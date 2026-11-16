import { Suspense } from "react";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, Field, inputClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { createWedding } from "./actions";

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
        <h1 className="text-2xl font-semibold">Your invites</h1>
        <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
          <WeddingList />
        </Suspense>
      </main>
    </>
  );
}

async function WeddingList() {
  const { supabase } = await requireUser();

  // RLS limits this to weddings the signed-in couple owns.
  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, slug, partner_one, partner_two, status")
    .order("created_at", { ascending: false });

  return (
    <>
      {!!weddings?.length && (
        <ul className="flex flex-col gap-3">
          {weddings.map((w) => (
            <li key={w.id}>
              <Link
                href={`/dashboard/${w.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-400"
              >
                <span>
                  <span className="block text-lg font-medium">
                    {w.partner_one} &amp; {w.partner_two}
                  </span>
                  <span className="text-sm text-zinc-500">/w/{w.slug}</span>
                </span>
                <StatusBadge status={w.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card
        title={weddings?.length ? "Start another invite" : "Create your invite"}
        description="Start with your names. You can change everything later."
      >
        <ActionForm action={createWedding} submitLabel="Create invite">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name">
              <input name="partner_one" required maxLength={80} className={inputClass} placeholder="Aisha" />
            </Field>
            <Field label="Your partner's name">
              <input name="partner_two" required maxLength={80} className={inputClass} placeholder="Rohan" />
            </Field>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
