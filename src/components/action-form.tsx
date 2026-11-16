"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "./ui";

export type ActionState = { ok: boolean; message?: string } | null;
type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/**
 * Submits without React's automatic form reset, so a failed save never wipes
 * what the user typed.
 */
export function submitWithoutReset(dispatch: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(fd));
  };
}

/** A form bound to a Server Action that reports success or an error inline. */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  className = "flex flex-col gap-4",
  resetOnSuccess = false,
}: {
  action: Action;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} onSubmit={submitWithoutReset(formAction)} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button className={buttonClass} disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {state && !pending && (
          <span role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-green-700" : "text-red-700"}`}>
            {state.message ?? (state.ok ? "Saved" : "Something went wrong")}
          </span>
        )}
      </div>
    </form>
  );
}

/** Submit button for plain Server Action forms (no state). */
export function SubmitButton({
  children,
  className = buttonClass,
  pendingLabel,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? (pendingLabel ?? "…") : children}
    </button>
  );
}
