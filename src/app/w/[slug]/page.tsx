import type { Metadata } from "next";
import { Suspense, cache } from "react";
import { notFound } from "next/navigation";
import { MadeWithFooter } from "@/components/made-with-footer";
import { formatDate } from "@/lib/format";
import { coupleNames, loadPublicInvite, lookupInviteStatus, mainDate } from "@/lib/invite-data";
import { InviteView } from "@/templates/invite-view";
import { submitContribution, submitRsvp } from "./actions";

// One query per request, shared by generateMetadata and the page.
const getInvite = cache(loadPublicInvite);

export async function generateMetadata({ params }: PageProps<"/w/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const invite = await getInvite(slug);
  // Unlisted invite pages must never appear in search results.
  const robots = { index: false, follow: false };
  if (!invite) return { title: "Wedding invitation", robots };

  const date = mainDate(invite);
  const title = `${coupleNames(invite)} are getting married`;
  const description = [
    date && formatDate(date.iso, date.timezone),
    invite.events[0]?.venueName,
    "Tap to view the invitation and RSVP.",
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title,
    description,
    robots,
    openGraph: { title, description, type: "website", url: `/w/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function InvitePage({ params }: PageProps<"/w/[slug]">) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center p-16 text-zinc-500">Opening invitation…</main>
      }
    >
      <Invite params={params} />
    </Suspense>
  );
}

async function Invite({ params }: Pick<PageProps<"/w/[slug]">, "params">) {
  const { slug } = await params;
  const invite = await getInvite(slug);

  if (!invite) {
    const status = await lookupInviteStatus(slug);
    if (status?.status !== "archived") notFound();
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">
          {status.partner_one} &amp; {status.partner_two}
        </h1>
        <p className="text-zinc-600">
          This celebration has passed and the invitation has been archived. Thank you for being part of it.
        </p>
        <MadeWithFooter />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <InviteView
        invite={invite}
        rsvpAction={submitRsvp.bind(null, slug)}
        contributeAction={submitContribution.bind(null, slug)}
      />
    </main>
  );
}
