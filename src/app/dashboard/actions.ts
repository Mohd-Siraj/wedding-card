"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/components/action-form";
import { requireUser, requireWedding } from "@/lib/auth";
import { CURRENCIES, isValidTimeZone, slugify, zonedLocalToUtc } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWeddingPhotoPath, MAX_GALLERY_PHOTOS, PHOTO_BUCKET } from "@/lib/photos";
import { UPI_ID_PATTERN } from "@/lib/upi";
import { TEMPLATE_IDS } from "@/templates/themes";

// Every action re-checks that the signed-in couple owns the wedding
// (requireWedding), and RLS enforces the same rule again in the database.

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function optionalUrl(value: string) {
  if (!value) return { ok: true as const, value: null };
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    return { ok: true as const, value: u.toString() };
  } catch {
    return { ok: false as const };
  }
}

const fail = (message: string): ActionState => ({ ok: false, message });

// ---------------------------------------------------------------------------
// Weddings
// ---------------------------------------------------------------------------

export async function createWedding(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const partnerOne = str(fd, "partner_one");
  const partnerTwo = str(fd, "partner_two");
  if (!partnerOne || !partnerTwo) return fail("Please enter both names.");
  if (partnerOne.length > 80 || partnerTwo.length > 80) return fail("Names must be 80 characters or fewer.");

  const template = TEMPLATE_IDS.includes(str(fd, "template") as never) ? str(fd, "template") : "classic";
  const baseSlug = slugify(`${partnerOne}-and-${partnerTwo}`) || "our-wedding";

  let weddingId: string | null = null;
  for (let attempt = 0; attempt < 5 && !weddingId; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("weddings")
      .insert({ owner_id: user.id, slug, partner_one: partnerOne, partner_two: partnerTwo, template })
      .select("id")
      .single();
    if (data) weddingId = data.id;
    else if (error?.code !== "23505") return fail("Could not create your invite. Please try again.");
  }
  if (!weddingId) return fail("Could not create a unique link. Please try again.");

  redirect(`/dashboard/${weddingId}`);
}

export async function updateDetails(weddingId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireWedding(weddingId);
  const partnerOne = str(fd, "partner_one");
  const partnerTwo = str(fd, "partner_two");
  const story = str(fd, "story");
  const template = str(fd, "template");

  if (!partnerOne || !partnerTwo) return fail("Please enter both names.");
  if (partnerOne.length > 80 || partnerTwo.length > 80) return fail("Names must be 80 characters or fewer.");
  if (story.length > 3000) return fail("Story must be 3000 characters or fewer.");
  if (!TEMPLATE_IDS.includes(template as never)) return fail("Please choose a template.");

  const { error } = await supabase
    .from("weddings")
    .update({ partner_one: partnerOne, partner_two: partnerTwo, story: story || null, template })
    .eq("id", weddingId);
  if (error) return fail("Could not save. Please try again.");
  refresh();
  return { ok: true, message: "Saved" };
}

export async function saveSettings(weddingId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireWedding(weddingId);

  const currency = str(fd, "currency").toUpperCase();
  if (!(CURRENCIES as readonly string[]).includes(currency)) return fail("Please choose a currency.");

  const method = str(fd, "payment_method");
  const upiId = str(fd, "upi_id");
  const link = optionalUrl(str(fd, "payment_link"));
  const instructions = str(fd, "payment_instructions");

  if (method && !["upi", "link", "instructions"].includes(method)) return fail("Invalid payment method.");
  if (method === "upi" && !UPI_ID_PATTERN.test(upiId)) return fail("Enter a valid UPI ID, like name@okbank.");
  if (!link.ok) return fail("Payment link must be a web address starting with https://");
  if (method === "link" && !link.value) return fail("Enter your payment link.");
  if (method === "instructions" && !instructions) return fail("Enter your payment instructions.");
  if (instructions.length > 1000) return fail("Instructions must be 1000 characters or fewer.");

  const { error } = await supabase
    .from("weddings")
    .update({
      currency,
      payment_method: (method || null) as "upi" | "link" | "instructions" | null,
      upi_id: upiId || null,
      payment_link: link.value,
      payment_instructions: instructions || null,
      show_contributor_names: fd.get("show_contributor_names") === "on",
      show_amounts: fd.get("show_amounts") === "on",
    })
    .eq("id", weddingId);
  if (error) return fail("Could not save. Please try again.");
  refresh();
  return { ok: true, message: "Saved" };
}

export async function saveSlug(weddingId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, wedding } = await requireWedding(weddingId);
  const slug = slugify(str(fd, "slug"));
  if (slug.length < 3) return fail("Use at least 3 letters or numbers.");
  if (slug === wedding.slug) return { ok: true, message: "No change" };

  const { error } = await supabase.from("weddings").update({ slug }).eq("id", weddingId);
  if (error?.code === "23505") return fail("That address is taken. Try another.");
  if (error) return fail("Could not save. Please try again.");
  refresh();
  return { ok: true, message: `Your link is now /w/${slug}` };
}

export async function setPublished(weddingId: string, publish: boolean) {
  const { supabase, wedding } = await requireWedding(weddingId);
  if (publish) {
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("wedding_id", weddingId);
    if (!wedding.partner_one || !wedding.partner_two || !count) {
      redirect(`/dashboard/${weddingId}/share?error=incomplete`);
    }
  }
  await supabase
    .from("weddings")
    .update(
      publish
        ? { status: "published", published_at: wedding.published_at ?? new Date().toISOString(), archived_at: null }
        : { status: "draft" },
    )
    .eq("id", weddingId);
  refresh();
}

export async function deleteWedding(weddingId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, wedding } = await requireWedding(weddingId);
  if (str(fd, "confirm") !== wedding.slug) return fail(`Type ${wedding.slug} to confirm.`);

  // Remove photos first; table rows cascade from the wedding.
  const storage = createAdminClient().storage.from(PHOTO_BUCKET);
  for (const folder of [weddingId, `${weddingId}/goals`]) {
    const { data: files } = await storage.list(folder, { limit: 100 });
    const paths = (files ?? []).filter((f) => f.id).map((f) => `${folder}/${f.name}`);
    if (paths.length) await storage.remove(paths);
  }
  const { error } = await supabase.from("weddings").delete().eq("id", weddingId);
  if (error) return fail("Could not delete. Please try again.");
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Photos. The browser compresses and uploads (RLS checks the folder); these
// actions record the path on the wedding.
// ---------------------------------------------------------------------------

// Storage cleanup uses the secret key: callers have already verified the
// couple owns the wedding and that the path sits in its folder.
async function removeFromStorage(_supabase: unknown, path: string | null) {
  if (path) await createAdminClient().storage.from(PHOTO_BUCKET).remove([path]);
}

export async function setCoverPhoto(weddingId: string, path: string): Promise<ActionState> {
  const { supabase, wedding } = await requireWedding(weddingId);
  if (!isWeddingPhotoPath(path, weddingId)) return fail("Invalid photo.");
  const { error } = await supabase.from("weddings").update({ cover_photo_path: path }).eq("id", weddingId);
  if (error) return fail("Could not save the photo.");
  if (wedding.cover_photo_path && wedding.cover_photo_path !== path)
    await removeFromStorage(supabase, wedding.cover_photo_path);
  refresh();
  return { ok: true };
}

export async function removeCoverPhoto(weddingId: string) {
  const { supabase, wedding } = await requireWedding(weddingId);
  await supabase.from("weddings").update({ cover_photo_path: null }).eq("id", weddingId);
  await removeFromStorage(supabase, wedding.cover_photo_path);
  refresh();
}

export async function addGalleryPhoto(weddingId: string, path: string): Promise<ActionState> {
  const { supabase, wedding } = await requireWedding(weddingId);
  if (!isWeddingPhotoPath(path, weddingId)) return fail("Invalid photo.");
  if (wedding.photo_paths.length >= MAX_GALLERY_PHOTOS) {
    await removeFromStorage(supabase, path);
    return fail(`You can add up to ${MAX_GALLERY_PHOTOS} photos.`);
  }
  const { error } = await supabase
    .from("weddings")
    .update({ photo_paths: [...wedding.photo_paths, path] })
    .eq("id", weddingId);
  if (error) return fail("Could not save the photo.");
  refresh();
  return { ok: true };
}

export async function removeGalleryPhoto(weddingId: string, path: string) {
  const { supabase, wedding } = await requireWedding(weddingId);
  if (!wedding.photo_paths.includes(path)) return;
  await supabase
    .from("weddings")
    .update({ photo_paths: wedding.photo_paths.filter((p) => p !== path) })
    .eq("id", weddingId);
  await removeFromStorage(supabase, path);
  refresh();
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function saveEvent(
  weddingId: string,
  eventId: string | null,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const { supabase } = await requireWedding(weddingId);
  const name = str(fd, "name");
  const timezone = str(fd, "timezone");
  const startsLocal = str(fd, "starts_at");
  const endsLocal = str(fd, "ends_at");
  const map = optionalUrl(str(fd, "map_url"));

  if (!name || name.length > 120) return fail("Give the event a name (up to 120 characters).");
  if (!isValidTimeZone(timezone)) return fail("Choose the venue's time zone.");
  const startsAt = zonedLocalToUtc(startsLocal, timezone);
  if (!startsAt) return fail("Choose a date and start time.");
  const endsAt = endsLocal ? zonedLocalToUtc(endsLocal, timezone) : null;
  if (endsLocal && !endsAt) return fail("End time is not valid.");
  if (endsAt && endsAt <= startsAt) return fail("End time must be after the start time.");
  if (!map.ok) return fail("Map link must be a web address starting with https://");

  const row = {
    name,
    timezone,
    starts_at: startsAt,
    ends_at: endsAt,
    venue_name: str(fd, "venue_name").slice(0, 200) || null,
    address: str(fd, "address").slice(0, 500) || null,
    map_url: map.value,
  };

  const { error } = eventId
    ? await supabase.from("events").update(row).eq("id", eventId).eq("wedding_id", weddingId)
    : await supabase.from("events").insert({ ...row, wedding_id: weddingId });
  if (error) return fail("Could not save the event. Please try again.");
  refresh();
  return { ok: true, message: eventId ? "Saved" : "Event added" };
}

export async function deleteEvent(weddingId: string, eventId: string) {
  const { supabase } = await requireWedding(weddingId);
  await supabase.from("events").delete().eq("id", eventId).eq("wedding_id", weddingId);
  refresh();
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function saveGoal(
  weddingId: string,
  goalId: string | null,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const { supabase } = await requireWedding(weddingId);
  const title = str(fd, "title");
  const description = str(fd, "description");
  const targetRaw = str(fd, "target_amount").replace(/,/g, "");
  const target = targetRaw ? Number(targetRaw) : null;

  if (!title || title.length > 120) return fail("Give the goal a title (up to 120 characters).");
  if (description.length > 1000) return fail("Description must be 1000 characters or fewer.");
  if (target !== null && (!Number.isFinite(target) || target <= 0 || target > 1e10))
    return fail("Target must be a positive amount, or left empty.");

  const row = { title, description: description || null, target_amount: target };

  if (goalId) {
    const { error } = await supabase.from("goals").update(row).eq("id", goalId).eq("wedding_id", weddingId);
    if (error) return fail("Could not save the goal.");
  } else {
    const { count } = await supabase
      .from("goals")
      .select("id", { count: "exact", head: true })
      .eq("wedding_id", weddingId);
    const { error } = await supabase
      .from("goals")
      .insert({ ...row, wedding_id: weddingId, sort_order: count ?? 0 });
    if (error) return fail(error.message.includes("at most 5") ? "You can add up to 5 goals." : "Could not add the goal.");
  }
  refresh();
  return { ok: true, message: goalId ? "Saved" : "Goal added" };
}

export async function deleteGoal(weddingId: string, goalId: string) {
  const { supabase } = await requireWedding(weddingId);
  const { data: goal } = await supabase
    .from("goals")
    .select("photo_path")
    .eq("id", goalId)
    .eq("wedding_id", weddingId)
    .maybeSingle();
  await supabase.from("goals").delete().eq("id", goalId).eq("wedding_id", weddingId);
  await removeFromStorage(supabase, goal?.photo_path ?? null);
  refresh();
}

export async function setGoalPhoto(weddingId: string, goalId: string, path: string): Promise<ActionState> {
  const { supabase } = await requireWedding(weddingId);
  if (!isWeddingPhotoPath(path, weddingId)) return fail("Invalid photo.");
  const { data: goal } = await supabase
    .from("goals")
    .select("photo_path")
    .eq("id", goalId)
    .eq("wedding_id", weddingId)
    .maybeSingle();
  if (!goal) return fail("Goal not found.");
  await supabase.from("goals").update({ photo_path: path }).eq("id", goalId);
  if (goal.photo_path && goal.photo_path !== path) await removeFromStorage(supabase, goal.photo_path);
  refresh();
  return { ok: true };
}

export async function removeGoalPhoto(weddingId: string, goalId: string) {
  const { supabase } = await requireWedding(weddingId);
  const { data: goal } = await supabase
    .from("goals")
    .select("photo_path")
    .eq("id", goalId)
    .eq("wedding_id", weddingId)
    .maybeSingle();
  if (!goal) return;
  await supabase.from("goals").update({ photo_path: null }).eq("id", goalId);
  await removeFromStorage(supabase, goal.photo_path);
  refresh();
}

// ---------------------------------------------------------------------------
// Guest records
// ---------------------------------------------------------------------------

export async function setContributionConfirmed(weddingId: string, contributionId: string, confirmed: boolean) {
  const { supabase } = await requireWedding(weddingId);
  await supabase
    .from("contributions")
    .update(
      confirmed
        ? { status: "confirmed", confirmed_at: new Date().toISOString() }
        : { status: "unconfirmed", confirmed_at: null },
    )
    .eq("id", contributionId)
    .eq("wedding_id", weddingId);
  refresh();
}

export async function deleteContribution(weddingId: string, contributionId: string) {
  const { supabase } = await requireWedding(weddingId);
  await supabase.from("contributions").delete().eq("id", contributionId).eq("wedding_id", weddingId);
  refresh();
}

export async function deleteRsvp(weddingId: string, rsvpId: string) {
  const { supabase } = await requireWedding(weddingId);
  await supabase.from("rsvps").delete().eq("id", rsvpId).eq("wedding_id", weddingId);
  refresh();
}
