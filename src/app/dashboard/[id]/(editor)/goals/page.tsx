import { Suspense } from "react";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PhotoUpload } from "@/components/photo-upload";
import { Card, Field, dangerButtonClass, inputClass } from "@/components/ui";
import { requireWedding } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { photoUrl } from "@/lib/photos";
import type { Database } from "@/types/database";
import { deleteGoal, removeGoalPhoto, saveGoal, setGoalPhoto } from "../../../actions";

type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
const MAX_GOALS = 5;

export default function GoalsPage({ params }: PageProps<"/dashboard/[id]/goals">) {
  return (
    <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
      <Goals params={params} />
    </Suspense>
  );
}

async function Goals({ params }: Pick<PageProps<"/dashboard/[id]/goals">, "params">) {
  const { id } = await params;
  const { supabase, wedding } = await requireWedding(id);
  const [{ data: goals }, { data: contributions }] = await Promise.all([
    supabase.from("goals").select("*").eq("wedding_id", id).order("sort_order").order("created_at"),
    supabase.from("contributions").select("goal_id, amount").eq("wedding_id", id).eq("status", "confirmed"),
  ]);
  const list = goals ?? [];
  const raised = new Map<string, number>();
  for (const c of contributions ?? []) raised.set(c.goal_id, (raised.get(c.goal_id) ?? 0) + Number(c.amount));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-600">
        Goals are optional. Guests pay you directly and record what they sent. You confirm each entry under{" "}
        <Link href={`/dashboard/${id}/contributions`} className="underline">
          Contributions
        </Link>
        .{" "}
        {!wedding.payment_method && (
          <>
            Add how guests should pay under{" "}
            <Link href={`/dashboard/${id}/settings`} className="font-medium underline">
              Payments &amp; privacy
            </Link>
            .
          </>
        )}
      </p>

      {list.map((g) => (
        <Card key={g.id}>
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-48">
              {g.photo_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl(g.photo_path)!} alt="" className="aspect-video w-full rounded-lg object-cover" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-500">
                  No photo
                </div>
              )}
              <PhotoUpload
                weddingId={id}
                folder="goals"
                onUploaded={setGoalPhoto.bind(null, id, g.id)}
                label={g.photo_path ? "Replace photo" : "Add photo"}
              />
              {g.photo_path && (
                <form action={removeGoalPhoto.bind(null, id, g.id)}>
                  <SubmitButton className={`${dangerButtonClass} w-full`}>Remove photo</SubmitButton>
                </form>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <p className="text-sm text-zinc-600">
                Confirmed so far: {formatMoney(raised.get(g.id) ?? 0, wedding.currency)}
                {g.target_amount && ` of ${formatMoney(Number(g.target_amount), wedding.currency)}`}
              </p>
              <GoalFields action={saveGoal.bind(null, id, g.id)} goal={g} currency={wedding.currency} />
              <form action={deleteGoal.bind(null, id, g.id)}>
                <SubmitButton className={dangerButtonClass} pendingLabel="Deleting…">
                  Delete goal and its contributions
                </SubmitButton>
              </form>
            </div>
          </div>
        </Card>
      ))}

      {list.length < MAX_GOALS ? (
        <Card title="Add a goal" description={`Up to ${MAX_GOALS} goals, like a honeymoon, a first home or a charity.`}>
          <GoalFields action={saveGoal.bind(null, id, null)} currency={wedding.currency} reset />
        </Card>
      ) : (
        <p className="text-sm text-zinc-600">You&apos;ve added the maximum of {MAX_GOALS} goals.</p>
      )}
    </div>
  );
}

function GoalFields({
  action,
  goal,
  currency,
  reset,
}: {
  action: Parameters<typeof ActionForm>[0]["action"];
  goal?: GoalRow;
  currency: string;
  reset?: boolean;
}) {
  return (
    <ActionForm action={action} submitLabel={goal ? "Save goal" : "Add goal"} resetOnSuccess={reset}>
      <Field label="Title">
        <input
          name="title"
          defaultValue={goal?.title}
          required
          maxLength={120}
          placeholder="Our honeymoon in Bali"
          className={inputClass}
        />
      </Field>
      <Field label="Description">
        <textarea
          name="description"
          defaultValue={goal?.description ?? ""}
          rows={3}
          maxLength={1000}
          className={inputClass}
        />
      </Field>
      <Field label={`Target (${currency})`} hint="Optional. A progress bar appears when amounts are public.">
        <input
          name="target_amount"
          inputMode="decimal"
          defaultValue={goal?.target_amount ?? ""}
          placeholder="150000"
          className={inputClass}
        />
      </Field>
    </ActionForm>
  );
}
