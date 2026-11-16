import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none disabled:bg-zinc-100";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50";
export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50";
export const dangerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function Card({ title, description, children }: { title?: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}
