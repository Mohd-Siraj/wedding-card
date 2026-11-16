"use client";

import { useActionState, useState } from "react";
import type { GuestFormState } from "@/app/w/[slug]/actions";
import { submitWithoutReset } from "@/components/action-form";

type Action = (prev: GuestFormState, fd: FormData) => Promise<GuestFormState>;

const input =
  "w-full rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-3 py-2.5 text-[var(--t-text)] placeholder:text-[var(--t-muted)] focus:outline-2 focus:outline-[var(--t-accent)]";

export function RsvpForm({ action }: { action: Action | null }) {
  const [state, formAction, pending] = useActionState<GuestFormState, FormData>(
    action ?? (async (s) => s),
    { status: "idle" },
  );
  const [attending, setAttending] = useState<"yes" | "no" | null>(null);

  if (state.status === "success") {
    return (
      <p className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-6 text-center" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-4 text-left">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-[var(--t-muted)]">Your name</span>
        <input name="name" required maxLength={120} className={input} autoComplete="name" />
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm text-[var(--t-muted)]">Will you attend?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((v) => (
            <label
              key={v}
              className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center transition ${
                attending === v
                  ? "border-[var(--t-accent)] bg-[var(--t-accent)] text-[var(--t-on-accent)]"
                  : "border-[var(--t-border)] bg-[var(--t-surface)]"
              }`}
            >
              <input
                type="radio"
                name="attending"
                value={v}
                required
                className="sr-only"
                onChange={() => setAttending(v)}
              />
              {v === "yes" ? "Joyfully accept" : "Regretfully decline"}
            </label>
          ))}
        </div>
      </fieldset>

      {attending === "yes" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-[var(--t-muted)]">Number of guests, including you</span>
          <input name="guest_count" type="number" min={1} max={20} defaultValue={1} required className={input} />
        </label>
      )}

      {state.status === "error" && (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      )}

      <button
        disabled={pending || !action}
        className="rounded-lg bg-[var(--t-accent)] px-4 py-3 font-medium text-[var(--t-on-accent)] disabled:opacity-60"
      >
        {!action ? "RSVP (disabled in preview)" : pending ? "Sending…" : "Send RSVP"}
      </button>
    </form>
  );
}
