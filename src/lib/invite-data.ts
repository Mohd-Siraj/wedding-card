import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { photoUrl } from "@/lib/photos";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type WeddingRow = Database["public"]["Tables"]["weddings"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];

export type InviteEvent = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  venueName: string | null;
  address: string | null;
  mapUrl: string | null;
};

export type InviteGoal = {
  id: string;
  title: string;
  description: string | null;
  photoUrl: string | null;
  target: number | null;
  /** Null when the couple keeps amounts private. */
  raised: number | null;
  contributorCount: number;
};

export type InviteContribution = {
  id: string;
  goalId: string;
  /** Null when anonymous or names are private. */
  name: string | null;
  /** Null when amounts are private. */
  amount: number | null;
  message: string | null;
  createdAt: string;
};

export type InviteData = {
  id: string;
  slug: string;
  status: WeddingRow["status"];
  partnerOne: string;
  partnerTwo: string;
  story: string | null;
  template: string;
  coverPhotoUrl: string | null;
  photoUrls: string[];
  currency: string;
  showNames: boolean;
  showAmounts: boolean;
  payment:
    | { method: "upi"; upiId: string }
    | { method: "link"; link: string }
    | { method: "instructions"; instructions: string }
    | null;
  events: InviteEvent[];
  goals: InviteGoal[];
  contributions: InviteContribution[];
};

/** The first event's start, which stands in as "the wedding date". */
export function mainDate(invite: Pick<InviteData, "events">) {
  const first = invite.events[0];
  return first ? { iso: first.startsAt, timezone: first.timezone } : null;
}

export function coupleNames(invite: Pick<InviteData, "partnerOne" | "partnerTwo">) {
  const a = invite.partnerOne.trim() || "Partner";
  const b = invite.partnerTwo.trim() || "Partner";
  return `${a} & ${b}`;
}

function toPayment(w: WeddingRow): InviteData["payment"] {
  if (w.payment_method === "upi" && w.upi_id) return { method: "upi", upiId: w.upi_id };
  if (w.payment_method === "link" && w.payment_link) return { method: "link", link: w.payment_link };
  if (w.payment_method === "instructions" && w.payment_instructions)
    return { method: "instructions", instructions: w.payment_instructions };
  return null;
}

function toEvent(e: EventRow): InviteEvent {
  return {
    id: e.id,
    name: e.name,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    timezone: e.timezone,
    venueName: e.venue_name,
    address: e.address,
    mapUrl: e.map_url,
  };
}

function base(w: WeddingRow, events: EventRow[]): Omit<InviteData, "goals" | "contributions"> {
  return {
    id: w.id,
    slug: w.slug,
    status: w.status,
    partnerOne: w.partner_one,
    partnerTwo: w.partner_two,
    story: w.story,
    template: w.template,
    coverPhotoUrl: photoUrl(w.cover_photo_path),
    photoUrls: w.photo_paths.map((p) => photoUrl(p)!),
    currency: w.currency,
    showNames: w.show_contributor_names,
    showAmounts: w.show_amounts,
    payment: toPayment(w),
    events: events.map(toEvent),
  };
}

const byOrder = <T extends { sort_order: number; created_at: string }>(a: T, b: T) =>
  a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);

/**
 * What a guest sees. Uses a cookie-less anonymous client, so RLS and the
 * public_* database functions decide what leaves Postgres, exactly as for a
 * real guest, even when the couple opens their own link while signed in.
 */
export async function loadPublicInvite(slug: string): Promise<InviteData | null> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!wedding) return null;

  const [events, goals, progress, contributions] = await Promise.all([
    supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at"),
    supabase.from("goals").select("*").eq("wedding_id", wedding.id),
    supabase.rpc("public_goal_progress", { wedding_slug: slug }),
    supabase.rpc("public_contributions", { wedding_slug: slug }),
  ]);

  const progressById = new Map((progress.data ?? []).map((p) => [p.goal_id, p]));

  return {
    ...base(wedding, events.data ?? []),
    goals: (goals.data ?? []).sort(byOrder).map((g) => {
      const p = progressById.get(g.id);
      return {
        id: g.id,
        title: g.title,
        description: g.description,
        photoUrl: photoUrl(g.photo_path),
        target: g.target_amount === null ? null : Number(g.target_amount),
        raised: p?.raised == null ? null : Number(p.raised),
        contributorCount: Number(p?.contributor_count ?? 0),
      };
    }),
    contributions: (contributions.data ?? []).map((c) => ({
      id: c.id,
      goalId: c.goal_id,
      name: c.name,
      amount: c.amount == null ? null : Number(c.amount),
      message: c.message,
      createdAt: c.created_at,
    })),
  };
}

/** Status only, so an archived invite can show a friendly notice instead of a 404. */
export async function lookupInviteStatus(slug: string) {
  const { data } = await createAdminClient()
    .from("weddings")
    .select("status, partner_one, partner_two")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

/**
 * The couple's preview of their own (possibly draft) invite. Applies the same
 * visibility rules as the public functions so the preview is faithful.
 */
export async function loadPreviewInvite(weddingId: string): Promise<InviteData | null> {
  const supabase = await createClient();
  const { data: wedding } = await supabase.from("weddings").select("*").eq("id", weddingId).maybeSingle();
  if (!wedding) return null;

  const [events, goals, contributions] = await Promise.all([
    supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at"),
    supabase.from("goals").select("*").eq("wedding_id", wedding.id),
    supabase
      .from("contributions")
      .select("*")
      .eq("wedding_id", wedding.id)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false }),
  ]);
  const confirmed = contributions.data ?? [];

  return {
    ...base(wedding, events.data ?? []),
    goals: ((goals.data ?? []) as GoalRow[]).sort(byOrder).map((g) => {
      const mine = confirmed.filter((c) => c.goal_id === g.id);
      return {
        id: g.id,
        title: g.title,
        description: g.description,
        photoUrl: photoUrl(g.photo_path),
        target: g.target_amount === null ? null : Number(g.target_amount),
        raised: wedding.show_amounts ? mine.reduce((s, c) => s + Number(c.amount), 0) : null,
        contributorCount: mine.length,
      };
    }),
    contributions: confirmed.map((c) => ({
      id: c.id,
      goalId: c.goal_id,
      name: wedding.show_contributor_names && !c.is_anonymous ? c.name : null,
      amount: wedding.show_amounts ? Number(c.amount) : null,
      message: c.message,
      createdAt: c.created_at,
    })),
  };
}
