import { Suspense } from "react";
import { SubmitButton } from "@/components/action-form";
import { Card, secondaryButtonClass } from "@/components/ui";
import { requireWedding } from "@/lib/auth";
import { deleteRsvp } from "../../../actions";

export default function GuestsPage({ params }: PageProps<"/dashboard/[id]/guests">) {
  return (
    <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
      <Guests params={params} />
    </Suspense>
  );
}

async function Guests({ params }: Pick<PageProps<"/dashboard/[id]/guests">, "params">) {
  const { id } = await params;
  const { supabase } = await requireWedding(id);
  const { data } = await supabase
    .from("rsvps")
    .select("*")
    .eq("wedding_id", id)
    .order("created_at", { ascending: false });
  const rsvps = data ?? [];
  const yes = rsvps.filter((r) => r.attending);
  const headcount = yes.reduce((s, r) => s + r.guest_count, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total headcount" value={headcount} />
        <Stat label="Attending" value={yes.length} />
        <Stat label="Declined" value={rsvps.length - yes.length} />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Replies ({rsvps.length})</h2>
          {rsvps.length > 0 && (
            <a href={`/dashboard/${id}/export?type=rsvps`} className={secondaryButtonClass}>
              Download CSV
            </a>
          )}
        </div>
        {rsvps.length === 0 ? (
          <p className="text-sm text-zinc-600">No replies yet. Share your invite to start collecting RSVPs.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {rsvps.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block font-medium">{r.name}</span>
                  <span className="text-sm text-zinc-600">
                    {r.attending ? `Attending · ${r.guest_count} ${r.guest_count === 1 ? "guest" : "guests"}` : "Declined"}
                    {" · "}
                    {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </span>
                <form action={deleteRsvp.bind(null, id, r.id)}>
                  <SubmitButton className="text-sm text-zinc-500 hover:text-red-700" pendingLabel="Removing…">
                    Remove
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold sm:text-3xl">{value}</p>
      <p className="text-xs text-zinc-600 sm:text-sm">{label}</p>
    </div>
  );
}
