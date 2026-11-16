import { Suspense } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/action-form";
import { CopyButton } from "@/components/copy-button";
import { Card, buttonClass, secondaryButtonClass } from "@/components/ui";
import { requireWedding } from "@/lib/auth";
import { siteUrl } from "@/lib/format";
import { setPublished } from "../../../actions";

export default function SharePage({ params, searchParams }: PageProps<"/dashboard/[id]/share">) {
  return (
    <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
      <Share params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Share({ params, searchParams }: Pick<PageProps<"/dashboard/[id]/share">, "params" | "searchParams">) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, wedding } = await requireWedding(id);
  const [{ count: eventCount }, { count: goalCount }] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }).eq("wedding_id", id),
    supabase.from("goals").select("id", { count: "exact", head: true }).eq("wedding_id", id),
  ]);

  const url = `${siteUrl()}/w/${wedding.slug}`;
  const published = wedding.status === "published";
  const checklist = [
    { done: !!(wedding.partner_one && wedding.partner_two), label: "Both names", href: "", required: true },
    { done: !!eventCount, label: "At least one event", href: "/events", required: true },
    { done: !!wedding.cover_photo_path, label: "Cover photo (recommended for link previews)", href: "", required: false },
    { done: !!goalCount, label: "Goals (optional)", href: "/goals", required: false },
    {
      done: !goalCount || !!wedding.payment_method,
      label: "Payment details for your goals",
      href: "/settings",
      required: false,
    },
  ];
  const ready = checklist.every((c) => c.done || !c.required);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `You're invited to the wedding of ${wedding.partner_one} & ${wedding.partner_two}! ${url}`,
  )}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title={published ? "Your invite is live" : wedding.status === "archived" ? "Archived" : "Publish your invite"}
        description={
          published
            ? "Anyone with the link can view it. It's hidden from search engines."
            : wedding.status === "archived"
              ? "This invite was archived 6 months after the last event. Your records are still here."
              : "Check the preview, then publish to get a shareable link."
        }
      >
        {error === "incomplete" && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            Add both names and at least one event before publishing.
          </p>
        )}
        <ul className="mb-5 flex flex-col gap-2 text-sm">
          {checklist.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              <span className={c.done ? "text-green-700" : c.required ? "text-red-600" : "text-zinc-400"}>
                {c.done ? "✓" : "○"}
              </span>
              <Link href={`/dashboard/${id}${c.href}`} className={c.done ? "text-zinc-600" : "underline"}>
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/${id}/preview`} className={secondaryButtonClass}>
            Preview
          </Link>
          <form action={setPublished.bind(null, id, !published)}>
            <SubmitButton className={published ? secondaryButtonClass : buttonClass} pendingLabel="Saving…">
              {published ? "Unpublish" : wedding.status === "archived" ? "Republish" : "Publish"}
            </SubmitButton>
          </form>
        </div>
        {!ready && !published && (
          <p className="mt-3 text-xs text-zinc-500">Complete the required items to publish.</p>
        )}
      </Card>

      {published && (
        <Card title="Share" description="Send the link on WhatsApp, or download the card to forward as an image.">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 pl-3">
              <span className="flex-1 truncate text-sm">{url}</span>
              <CopyButton text={url} />
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                Share on WhatsApp
              </a>
              <a href={`/w/${wedding.slug}`} target="_blank" className={secondaryButtonClass}>
                Open invite ↗
              </a>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Invite card</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/w/${wedding.slug}/card?v=${encodeURIComponent(wedding.updated_at)}`}
                alt="Invite card preview"
                className="mb-3 w-48 rounded-lg border border-zinc-200 shadow-sm"
              />
              <div className="flex flex-wrap gap-2">
                <a href={`/w/${wedding.slug}/card`} download className={secondaryButtonClass}>
                  Download image
                </a>
                <a href={`/w/${wedding.slug}/card?format=pdf`} download className={secondaryButtonClass}>
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
