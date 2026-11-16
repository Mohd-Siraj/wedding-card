import { Suspense } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { StatusBadge } from "@/components/status-badge";
import { EditorTabs } from "@/components/editor-tabs";
import { secondaryButtonClass } from "@/components/ui";
import { requireWedding } from "@/lib/auth";

export default function EditorLayout({ children, params }: LayoutProps<"/dashboard/[id]">) {
  return (
    <>
      <DashboardHeader />
      <div className="mx-auto w-full max-w-5xl px-4 pt-6">
        <Suspense fallback={<div className="h-[88px]" />}>
          <WeddingHeader params={params} />
        </Suspense>
      </div>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">{children}</main>
    </>
  );
}

async function WeddingHeader({ params }: Pick<LayoutProps<"/dashboard/[id]">, "params">) {
  const { id } = await params;
  const { wedding } = await requireWedding(id);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900" aria-label="All invites">
            ←
          </Link>
          <h1 className="text-xl font-semibold sm:text-2xl">
            {wedding.partner_one} &amp; {wedding.partner_two}
          </h1>
          <StatusBadge status={wedding.status} />
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/${id}/preview`} className={secondaryButtonClass}>
            Preview
          </Link>
          {wedding.status === "published" && (
            <a href={`/w/${wedding.slug}`} target="_blank" className={secondaryButtonClass}>
              View live ↗
            </a>
          )}
        </div>
      </div>
      <EditorTabs weddingId={id} />
    </div>
  );
}
