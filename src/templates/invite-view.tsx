import type { CSSProperties, ReactNode } from "react";
import type { GuestFormState } from "@/app/w/[slug]/actions";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { coupleNames, mainDate, type InviteData, type InviteGoal } from "@/lib/invite-data";
import { MadeWithFooter } from "@/components/made-with-footer";
import { ContributePanel } from "./contribute-panel";
import { Ornament } from "./ornament";
import { RsvpForm } from "./rsvp-form";
import { getTheme, type Theme } from "./themes";

type Action = (prev: GuestFormState, fd: FormData) => Promise<GuestFormState>;

/**
 * Renders an invite in its chosen template. Used for the public page and the
 * couple's preview (where actions are null and the forms are disabled).
 */
export function InviteView({
  invite,
  rsvpAction,
  contributeAction,
}: {
  invite: InviteData;
  rsvpAction: Action | null;
  contributeAction: Action | null;
}) {
  const theme = getTheme(invite.template);
  const c = theme.colors;
  const vars = {
    "--t-bg": c.bg,
    "--t-surface": c.surface,
    "--t-text": c.text,
    "--t-muted": c.muted,
    "--t-accent": c.accent,
    "--t-on-accent": c.onAccent,
    "--t-border": c.border,
    fontFamily: theme.fonts.body,
  } as CSSProperties;

  const payeeName = coupleNames(invite);

  return (
    <div style={vars} className="flex min-h-full flex-1 flex-col bg-[var(--t-bg)] text-[var(--t-text)]">
      <Hero invite={invite} theme={theme} />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-4 pb-8 sm:px-6">
        {invite.story && (
          <Section title="Our story" theme={theme}>
            <p className="whitespace-pre-line text-lg leading-relaxed">{invite.story}</p>
          </Section>
        )}

        {invite.photoUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {invite.photoUrls.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`Photo ${i + 1}`}
                loading="lazy"
                className="aspect-square w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {invite.events.length > 0 && (
          <Section title={invite.events.length > 1 ? "Celebrations" : "The celebration"} theme={theme}>
            <div className="flex flex-col gap-4">
              {invite.events.map((e) => (
                <article
                  key={e.id}
                  className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-5 text-left"
                >
                  <h3 className="text-2xl" style={{ fontFamily: theme.fonts.heading }}>
                    {e.name}
                  </h3>
                  <p className="mt-2 font-medium">{formatDate(e.startsAt, e.timezone)}</p>
                  <p className="text-[var(--t-muted)]">
                    {formatTime(e.startsAt, e.timezone)}
                    {e.endsAt && ` – ${formatTime(e.endsAt, e.timezone)}`}
                  </p>
                  {(e.venueName || e.address) && (
                    <p className="mt-3">
                      {e.venueName && <span className="block font-medium">{e.venueName}</span>}
                      {e.address && <span className="block whitespace-pre-line text-[var(--t-muted)]">{e.address}</span>}
                    </p>
                  )}
                  {e.mapUrl && (
                    <a
                      href={e.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-medium text-[var(--t-accent)] underline underline-offset-4"
                    >
                      Open in Maps ↗
                    </a>
                  )}
                </article>
              ))}
            </div>
          </Section>
        )}

        <Section title="Will you join us?" theme={theme}>
          <div className="mx-auto w-full max-w-md">
            <RsvpForm action={rsvpAction} />
          </div>
        </Section>

        {invite.goals.length > 0 && (
          <Section title="Our dreams" theme={theme}>
            <p className="mx-auto mb-6 max-w-prose text-[var(--t-muted)]">
              Your presence and blessings are the greatest gift. If you&apos;d still like to give something, you
              can help us towards one of these dreams instead.
            </p>
            <div className="flex flex-col gap-6">
              {invite.goals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  invite={invite}
                  theme={theme}
                  payeeName={payeeName}
                  action={contributeAction}
                />
              ))}
            </div>
          </Section>
        )}

        {invite.contributions.some((c) => c.message) && (
          <Section title="Wishes" theme={theme}>
            <ul className="flex flex-col gap-3 text-left">
              {invite.contributions
                .filter((c) => c.message)
                .slice(0, 30)
                .map((c) => (
                  <li key={c.id} className="rounded-xl bg-[var(--t-surface)] p-4">
                    <p className="whitespace-pre-line">“{c.message}”</p>
                    <p className="mt-2 text-sm text-[var(--t-muted)]">— {c.name ?? "A well-wisher"}</p>
                  </li>
                ))}
            </ul>
          </Section>
        )}

        <MadeWithFooter />
      </div>
    </div>
  );
}

function Section({ title, theme, children }: { title: string; theme: Theme; children: ReactNode }) {
  return (
    <section className="text-center">
      <h2
        className={`mb-2 text-3xl sm:text-4xl ${theme.namesUppercase ? "text-xl font-semibold uppercase tracking-[0.3em] sm:text-2xl" : ""}`}
        style={{ fontFamily: theme.fonts.heading }}
      >
        {title}
      </h2>
      <Ornament kind={theme.ornament} className="mx-auto mb-6 h-6 w-40 text-[var(--t-accent)]" />
      {children}
    </section>
  );
}

function Hero({ invite, theme }: { invite: InviteData; theme: Theme }) {
  const date = mainDate(invite);
  const first = invite.events[0];
  const names = (
    <h1
      className={
        theme.namesUppercase
          ? "text-4xl font-semibold uppercase tracking-[0.2em] sm:text-6xl"
          : theme.id === "floral"
            ? "text-6xl leading-tight sm:text-8xl"
            : "text-5xl leading-tight sm:text-7xl"
      }
      style={{ fontFamily: theme.fonts.names }}
    >
      <span className="block">{invite.partnerOne || "Partner"}</span>
      <span className="block text-[0.5em] text-[var(--t-accent)]">&amp;</span>
      <span className="block">{invite.partnerTwo || "Partner"}</span>
    </h1>
  );
  const details = (
    <>
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--t-muted)]">Together with their families</p>
      {names}
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--t-muted)]">invite you to celebrate their wedding</p>
      {date && (
        <p className="text-xl" style={{ fontFamily: theme.fonts.heading }}>
          {formatDate(date.iso, date.timezone)}
          {first?.venueName && <span className="block text-base text-[var(--t-muted)]">{first.venueName}</span>}
        </p>
      )}
    </>
  );
  const photo = invite.coverPhotoUrl;

  if (theme.hero === "bleed") {
    return (
      <header className="mb-16">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-[60vh] max-h-[640px] w-full object-cover" />
        )}
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 pt-12 text-center">
          {details}
          <Ornament kind="line" className="h-3 w-40 text-[var(--t-accent)]" />
        </div>
      </header>
    );
  }

  const photoEl = photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo}
      alt=""
      className={
        theme.hero === "circle"
          ? "size-56 rounded-full border-4 border-[var(--t-surface)] object-cover shadow-lg sm:size-64"
          : theme.hero === "arch"
            ? "h-80 w-60 rounded-t-full border border-[var(--t-border)] object-cover p-1.5 sm:h-96 sm:w-72"
            : "h-80 w-64 border-2 border-[var(--t-accent)] object-cover p-1.5 sm:h-96 sm:w-80"
      }
    />
  ) : null;

  return (
    <header className="mx-auto mb-16 flex w-full max-w-2xl flex-col items-center gap-6 px-4 pt-14 text-center">
      {theme.hero === "frame" ? (
        <Ornament kind="mandala" className="size-24 text-[var(--t-accent)]" />
      ) : (
        <Ornament kind={theme.ornament} className="h-10 w-56 text-[var(--t-accent)]" />
      )}
      {photoEl}
      {details}
    </header>
  );
}

function GoalCard({
  goal,
  invite,
  theme,
  payeeName,
  action,
}: {
  goal: InviteGoal;
  invite: InviteData;
  theme: Theme;
  payeeName: string;
  action: Action | null;
}) {
  // Without public amounts the bar is hidden too, since a percentage of a
  // known target would reveal the total.
  const pct =
    goal.target && goal.raised !== null ? Math.min(100, Math.round((goal.raised / goal.target) * 100)) : null;

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] text-left">
      {goal.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={goal.photoUrl} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
      )}
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-2xl" style={{ fontFamily: theme.fonts.heading }}>
          {goal.title}
        </h3>
        {goal.description && <p className="whitespace-pre-line text-[var(--t-muted)]">{goal.description}</p>}

        {pct !== null && (
          <div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--t-border)]">
              <div className="h-full rounded-full bg-[var(--t-accent)]" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-sm text-[var(--t-muted)]">
              {formatMoney(goal.raised!, invite.currency)} of {formatMoney(goal.target!, invite.currency)} ·{" "}
              {pct}%
            </p>
          </div>
        )}
        {pct === null && goal.raised !== null && goal.raised > 0 && (
          <p className="text-sm text-[var(--t-muted)]">{formatMoney(goal.raised, invite.currency)} raised</p>
        )}
        {goal.contributorCount > 0 && (
          <p className="text-sm text-[var(--t-muted)]">
            {goal.contributorCount} {goal.contributorCount === 1 ? "person has" : "people have"} contributed
          </p>
        )}

        {invite.showNames && (
          <ContributorList invite={invite} goalId={goal.id} />
        )}

        <ContributePanel
          goal={{ id: goal.id, title: goal.title }}
          payment={invite.payment}
          currency={invite.currency}
          payeeName={payeeName}
          action={action}
        />
      </div>
    </article>
  );
}

function ContributorList({ invite, goalId }: { invite: InviteData; goalId: string }) {
  const list = invite.contributions.filter((c) => c.goalId === goalId).slice(0, 12);
  if (!list.length) return null;
  return (
    <ul className="flex flex-wrap gap-2 text-sm">
      {list.map((c) => (
        <li key={c.id} className="rounded-full border border-[var(--t-border)] px-3 py-1">
          {c.name ?? "Anonymous"}
          {c.amount !== null && <span className="text-[var(--t-muted)]"> · {formatMoney(c.amount, invite.currency)}</span>}
        </li>
      ))}
    </ul>
  );
}
