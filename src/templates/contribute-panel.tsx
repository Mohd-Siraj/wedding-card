"use client";

import { useActionState, useEffect, useState } from "react";
import QRCode from "qrcode";
import type { GuestFormState } from "@/app/w/[slug]/actions";
import { submitWithoutReset } from "@/components/action-form";
import type { InviteData } from "@/lib/invite-data";
import { buildUpiUrl } from "@/lib/upi";

type Action = (prev: GuestFormState, fd: FormData) => Promise<GuestFormState>;

const input =
  "w-full rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-3 py-2.5 text-[var(--t-text)] placeholder:text-[var(--t-muted)] focus:outline-2 focus:outline-[var(--t-accent)]";
const primary =
  "inline-flex items-center justify-center rounded-lg bg-[var(--t-accent)] px-4 py-3 font-medium text-[var(--t-on-accent)] disabled:opacity-60";

export function ContributePanel({
  goal,
  payment,
  currency,
  payeeName,
  action,
}: {
  goal: { id: string; title: string };
  payment: InviteData["payment"];
  currency: string;
  payeeName: string;
  action: Action | null;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [state, formAction, pending] = useActionState<GuestFormState, FormData>(
    action ?? (async (s) => s),
    { status: "idle" },
  );

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${primary} w-full`}>
        Contribute
      </button>
    );
  }

  if (state.status === "success") {
    return (
      <p className="rounded-lg border border-[var(--t-border)] p-4 text-center" role="status">
        {state.message}
      </p>
    );
  }

  const numericAmount = Number(amount);

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-[var(--t-border)] p-4 text-left">
      <section className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--t-muted)]">1. Send your gift</h4>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-[var(--t-muted)]">Amount ({currency})</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 2100"
            className={input}
          />
        </label>
        <PaymentStep
          payment={payment}
          payeeName={payeeName}
          amount={numericAmount > 0 ? numericAmount : null}
          note={goal.title}
        />
      </section>

      <form action={formAction} onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--t-muted)]">
          2. Let the couple know
        </h4>
        <input type="hidden" name="goal_id" value={goal.id} />
        <input type="hidden" name="amount" value={amount} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-[var(--t-muted)]">Your name</span>
          <input name="name" maxLength={120} className={input} autoComplete="name" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-[var(--t-muted)]">Message (optional)</span>
          <textarea name="message" maxLength={1000} rows={3} className={input} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_anonymous" className="size-4 accent-[var(--t-accent)]" />
          Hide my name from other guests
        </label>
        {state.status === "error" && (
          <p className="text-sm text-red-600" role="alert">
            {state.message}
          </p>
        )}
        <button disabled={pending || !action || !(numericAmount > 0)} className={primary}>
          {!action ? "Disabled in preview" : pending ? "Saving…" : "I've sent it, record my contribution"}
        </button>
        <p className="text-xs text-[var(--t-muted)]">
          Payments go straight to the couple. This only records your gift so they know it came from you.
        </p>
      </form>
    </div>
  );
}

function PaymentStep({
  payment,
  payeeName,
  amount,
  note,
}: {
  payment: InviteData["payment"];
  payeeName: string;
  amount: number | null;
  note: string;
}) {
  if (!payment) {
    return <p className="text-sm text-[var(--t-muted)]">The couple hasn&apos;t added payment details yet.</p>;
  }
  if (payment.method === "link") {
    return (
      <a href={payment.link} target="_blank" rel="noopener noreferrer" className={primary}>
        Open the couple&apos;s payment link ↗
      </a>
    );
  }
  if (payment.method === "instructions") {
    return (
      <p className="whitespace-pre-wrap rounded-lg bg-[var(--t-surface)] p-3 text-sm">{payment.instructions}</p>
    );
  }
  return <UpiStep upiId={payment.upiId} payeeName={payeeName} amount={amount} note={note} />;
}

function UpiStep({
  upiId,
  payeeName,
  amount,
  note,
}: {
  upiId: string;
  payeeName: string;
  amount: number | null;
  note: string;
}) {
  const url = buildUpiUrl({ upiId, payeeName, amount, note });
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(url, { margin: 1, width: 320 }).then((d) => live && setQr(d));
    return () => {
      live = false;
    };
  }, [url]);

  return (
    <div className="flex flex-col gap-3">
      <a href={url} className={`${primary} sm:hidden`}>
        Pay with a UPI app
      </a>
      <div className="flex flex-col items-center gap-2 rounded-lg bg-white p-3 text-center text-sm text-neutral-700">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`UPI QR code for ${upiId}`} width={180} height={180} />
        ) : (
          <div className="size-[180px] animate-pulse rounded bg-neutral-100" />
        )}
        <span>Scan with GPay, PhonePe, Paytm or any UPI app</span>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(upiId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="text-sm underline underline-offset-4"
      >
        {copied ? "Copied!" : `Copy UPI ID: ${upiId}`}
      </button>
    </div>
  );
}
