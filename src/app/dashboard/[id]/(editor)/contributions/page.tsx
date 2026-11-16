import { Suspense } from "react";
import { SubmitButton } from "@/components/action-form";
import { Card, buttonClass, secondaryButtonClass } from "@/components/ui";
import { requireWedding } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { deleteContribution, setContributionConfirmed } from "../../../actions";

export default function ContributionsPage({ params }: PageProps<"/dashboard/[id]/contributions">) {
  return (
    <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
      <Contributions params={params} />
    </Suspense>
  );
}

async function Contributions({ params }: Pick<PageProps<"/dashboard/[id]/contributions">, "params">) {
  const { id } = await params;
  const { supabase, wedding } = await requireWedding(id);
  const [{ data: goals }, { data }] = await Promise.all([
    supabase.from("goals").select("id, title").eq("wedding_id", id),
    supabase.from("contributions").select("*").eq("wedding_id", id).order("created_at", { ascending: false }),
  ]);
  const goalTitle = new Map((goals ?? []).map((g) => [g.id, g.title]));
  const all = data ?? [];
  const pending = all.filter((c) => c.status === "unconfirmed");
  const confirmed = all.filter((c) => c.status === "confirmed");
  const money = (n: number) => formatMoney(n, wedding.currency);
  const confirmedTotal = confirmed.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold">{money(confirmedTotal)}</p>
          <p className="text-sm text-zinc-600">Confirmed ({confirmed.length})</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold">{pending.length}</p>
          <p className="text-sm text-zinc-600">Waiting for you to confirm</p>
        </div>
      </div>

      <p className="text-sm text-zinc-600">
        Check each entry against what actually arrived in your account. Only confirmed entries count towards goals or
        appear on your invite.
      </p>

      {all.length > 0 && (
        <div>
          <a href={`/dashboard/${id}/export?type=contributions`} className={secondaryButtonClass}>
            Download CSV
          </a>
        </div>
      )}

      {[
        { title: "To confirm", items: pending },
        { title: "Confirmed", items: confirmed },
      ].map(({ title, items }) => (
        <Card key={title} title={`${title} (${items.length})`}>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-600">Nothing here yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {items.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {money(Number(c.amount))} · {c.name || "No name given"}
                      {c.is_anonymous && (
                        <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-normal text-zinc-600">
                          hidden from guests
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {goalTitle.get(c.goal_id) ?? "Goal"} ·{" "}
                      {new Date(c.created_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    {c.message && <p className="mt-1 whitespace-pre-line text-sm">“{c.message}”</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={setContributionConfirmed.bind(null, id, c.id, c.status !== "confirmed")}>
                      <SubmitButton className={c.status === "confirmed" ? secondaryButtonClass : buttonClass}>
                        {c.status === "confirmed" ? "Unconfirm" : "Confirm"}
                      </SubmitButton>
                    </form>
                    <form action={deleteContribution.bind(null, id, c.id)}>
                      <SubmitButton className={secondaryButtonClass}>Remove</SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
