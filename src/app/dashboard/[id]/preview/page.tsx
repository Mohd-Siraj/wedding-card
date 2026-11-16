import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWedding } from "@/lib/auth";
import { loadPreviewInvite } from "@/lib/invite-data";
import { InviteView } from "@/templates/invite-view";

// The couple's preview, including drafts. Forms are disabled here.
export default function PreviewPage({ params, searchParams }: PageProps<"/dashboard/[id]/preview">) {
  return (
    <Suspense fallback={<p className="p-8 text-zinc-600">Loading preview…</p>}>
      <Preview params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Preview({ params, searchParams }: Pick<PageProps<"/dashboard/[id]/preview">, "params" | "searchParams">) {
  const { id } = await params;
  const { view } = await searchParams;
  const { wedding } = await requireWedding(id);
  const invite = await loadPreviewInvite(id);
  if (!invite) notFound();
  const mobile = view === "mobile";

  // Rendered inside the phone frame's iframe, which gives it a real 360px viewport.
  if (view === "bare") {
    return <InviteView invite={invite} rsvpAction={null} contributeAction={null} />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 px-4 py-2 text-sm backdrop-blur">
        <Link href={`/dashboard/${id}`} className="font-medium">
          ← Back to editor
        </Link>
        <span className="text-zinc-500">
          Preview{wedding.status !== "published" && " · not published yet"} · forms are disabled
        </span>
        <span className="flex gap-1 rounded-lg bg-zinc-100 p-0.5">
          <Link
            href={`/dashboard/${id}/preview`}
            className={`rounded-md px-2.5 py-1 ${mobile ? "" : "bg-white shadow-sm"}`}
          >
            Desktop
          </Link>
          <Link
            href={`/dashboard/${id}/preview?view=mobile`}
            className={`rounded-md px-2.5 py-1 ${mobile ? "bg-white shadow-sm" : ""}`}
          >
            Phone
          </Link>
        </span>
      </div>
      {mobile ? (
        <div className="flex flex-1 justify-center bg-zinc-200 py-6">
          <iframe
            src={`/dashboard/${id}/preview?view=bare`}
            title="Phone preview"
            className="h-[740px] w-[376px] rounded-[2rem] border-8 border-zinc-900 bg-white shadow-xl"
          />
        </div>
      ) : (
        <InviteView invite={invite} rsvpAction={null} contributeAction={null} />
      )}
    </div>
  );
}
