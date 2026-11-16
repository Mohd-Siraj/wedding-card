const STYLES = {
  draft: "bg-amber-50 text-amber-800 ring-amber-200",
  published: "bg-green-50 text-green-800 ring-green-200",
  archived: "bg-zinc-100 text-zinc-700 ring-zinc-200",
} as const;

export function StatusBadge({ status }: { status: keyof typeof STYLES }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ${STYLES[status]}`}>
      {status}
    </span>
  );
}
