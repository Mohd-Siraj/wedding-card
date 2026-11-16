-- Initial schema for the wedding invitation and goals app.
-- Couples are Supabase auth users. Guests never sign in: their RSVPs and
-- contributions are written by Server Actions using the secret key, so the
-- rsvps and contributions tables have no anonymous policies at all.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.wedding_status as enum ('draft', 'published', 'archived');
create type public.payment_method as enum ('upi', 'link', 'instructions');
create type public.contribution_status as enum ('unconfirmed', 'confirmed');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),

  partner_one text not null default '',
  partner_two text not null default '',
  story text,
  template text not null default 'classic',
  cover_photo_path text,
  photo_paths text[] not null default '{}'
    check (cardinality(photo_paths) <= 10),

  -- One currency per wedding (ISO 4217, e.g. INR, USD).
  currency char(3) not null default 'INR',

  -- Visibility of contributions on the public page.
  show_contributor_names boolean not null default true,
  show_amounts boolean not null default false,

  payment_method public.payment_method,
  upi_id text,
  payment_link text,
  payment_instructions text,

  -- Present from day one so paid features need no rework.
  plan text not null default 'free',

  status public.wedding_status not null default 'draft',
  published_at timestamptz,
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index weddings_owner_id_idx on public.weddings (owner_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  -- IANA timezone of the venue, e.g. 'Asia/Kolkata'. Times display in this zone.
  timezone text not null,
  venue_name text,
  address text,
  map_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_wedding_id_idx on public.events (wedding_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  description text,
  photo_path text,
  target_amount numeric(12, 2) check (target_amount is null or target_amount > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_wedding_id_idx on public.goals (wedding_id);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  attending boolean not null,
  guest_count int not null default 1 check (guest_count between 0 and 50),
  created_at timestamptz not null default now()
);

create index rsvps_wedding_id_idx on public.rsvps (wedding_id);

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  name text check (name is null or char_length(name) <= 120),
  amount numeric(12, 2) not null check (amount > 0),
  message text check (message is null or char_length(message) <= 1000),
  is_anonymous boolean not null default false,
  status public.contribution_status not null default 'unconfirmed',
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index contributions_wedding_id_idx on public.contributions (wedding_id);
create index contributions_goal_id_idx on public.contributions (goal_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger weddings_updated_at before update on public.weddings
  for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger goals_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

-- Up to 5 goals per wedding.
create function public.enforce_goal_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.goals where wedding_id = new.wedding_id) >= 5 then
    raise exception 'A wedding can have at most 5 goals';
  end if;
  return new;
end;
$$;

create trigger goals_limit before insert on public.goals
  for each row execute function public.enforce_goal_limit();

-- A contribution's goal must belong to the same wedding.
create function public.enforce_contribution_goal()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.goals where id = new.goal_id and wedding_id = new.wedding_id
  ) then
    raise exception 'Goal does not belong to this wedding';
  end if;
  return new;
end;
$$;

create trigger contributions_goal_check before insert or update on public.contributions
  for each row execute function public.enforce_contribution_goal();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.weddings enable row level security;
alter table public.events enable row level security;
alter table public.goals enable row level security;
alter table public.rsvps enable row level security;
alter table public.contributions enable row level security;

create function public.owns_wedding(wid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.weddings
    where id = wid and owner_id = (select auth.uid())
  );
$$;

-- Weddings: couples manage their own; anyone can read published ones.
create policy "Owners manage their weddings" on public.weddings
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Anyone can read published weddings" on public.weddings
  for select to anon, authenticated
  using (status = 'published');

-- Events and goals: owners manage; anyone can read those of published weddings.
create policy "Owners manage events" on public.events
  for all to authenticated
  using (public.owns_wedding(wedding_id))
  with check (public.owns_wedding(wedding_id));

create policy "Anyone can read events of published weddings" on public.events
  for select to anon, authenticated
  using (exists (
    select 1 from public.weddings w where w.id = wedding_id and w.status = 'published'
  ));

create policy "Owners manage goals" on public.goals
  for all to authenticated
  using (public.owns_wedding(wedding_id))
  with check (public.owns_wedding(wedding_id));

create policy "Anyone can read goals of published weddings" on public.goals
  for select to anon, authenticated
  using (exists (
    select 1 from public.weddings w where w.id = wedding_id and w.status = 'published'
  ));

-- RSVPs and contributions: only the owning couple can read, confirm or remove.
-- Guests write through Server Actions, never directly.
create policy "Owners read RSVPs" on public.rsvps
  for select to authenticated
  using (public.owns_wedding(wedding_id));

create policy "Owners delete RSVPs" on public.rsvps
  for delete to authenticated
  using (public.owns_wedding(wedding_id));

create policy "Owners read contributions" on public.contributions
  for select to authenticated
  using (public.owns_wedding(wedding_id));

create policy "Owners confirm contributions" on public.contributions
  for update to authenticated
  using (public.owns_wedding(wedding_id))
  with check (public.owns_wedding(wedding_id));

create policy "Owners delete contributions" on public.contributions
  for delete to authenticated
  using (public.owns_wedding(wedding_id));

-- ---------------------------------------------------------------------------
-- Public read functions
-- These are the only way guests see contribution data. Private names and
-- amounts are removed here in the database, so they never reach the browser.
-- ---------------------------------------------------------------------------

create function public.public_goal_progress(wedding_slug text)
returns table (goal_id uuid, raised numeric, contributor_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    g.id,
    case when w.show_amounts
      then coalesce(sum(c.amount) filter (where c.status = 'confirmed'), 0)
    end,
    count(c.id) filter (where c.status = 'confirmed')
  from public.weddings w
  join public.goals g on g.wedding_id = w.id
  left join public.contributions c on c.goal_id = g.id
  where w.slug = wedding_slug and w.status = 'published'
  group by g.id, w.show_amounts;
$$;

create function public.public_contributions(wedding_slug text)
returns table (
  id uuid,
  goal_id uuid,
  name text,
  amount numeric,
  message text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.goal_id,
    case when w.show_contributor_names and not c.is_anonymous then c.name end,
    case when w.show_amounts then c.amount end,
    c.message,
    c.created_at
  from public.weddings w
  join public.contributions c on c.wedding_id = w.id
  where w.slug = wedding_slug
    and w.status = 'published'
    and c.status = 'confirmed'
  order by c.created_at desc;
$$;

revoke execute on function public.public_goal_progress(text) from public;
revoke execute on function public.public_contributions(text) from public;
grant execute on function public.public_goal_progress(text) to anon, authenticated;
grant execute on function public.public_contributions(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Archiving: pages close 6 months after the last event. Couples keep access
-- through the owner policies. Schedule daily with pg_cron once deployed:
--   select cron.schedule('archive-weddings', '0 3 * * *',
--     'select public.archive_finished_weddings()');
-- ---------------------------------------------------------------------------

create function public.archive_finished_weddings()
returns int
language sql
security definer
set search_path = ''
as $$
  with finished as (
    update public.weddings w
    set status = 'archived', archived_at = now()
    where w.status = 'published'
      and (
        select max(coalesce(e.ends_at, e.starts_at))
        from public.events e where e.wedding_id = w.id
      ) < now() - interval '6 months'
    returning 1
  )
  select count(*)::int from finished;
$$;

revoke execute on function public.archive_finished_weddings() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: wedding photos, stored as {wedding_id}/{file}. Public read because
-- invite pages are public; only the owning couple can write.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedding-photos', 'wedding-photos', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp']);

create policy "Owners upload wedding photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wedding-photos'
    and public.owns_wedding(((storage.foldername(name))[1])::uuid)
  );

create policy "Owners update wedding photos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'wedding-photos'
    and public.owns_wedding(((storage.foldername(name))[1])::uuid)
  );

create policy "Owners delete wedding photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'wedding-photos'
    and public.owns_wedding(((storage.foldername(name))[1])::uuid)
  );
