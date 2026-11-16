"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

// Guests never sign in, so these actions are open to anyone. They validate
// every field, check the wedding is published, then write with the secret
// key (rsvps and contributions have no anonymous RLS policies at all).

export type GuestFormState = { status: "idle" | "success" | "error"; message?: string };

const TEN_MINUTES = 10 * 60 * 1000;

async function publishedWeddingId(slug: string) {
  const { data } = await createAdminClient()
    .from("weddings")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data?.id ?? null;
}

function text(fd: FormData, key: string, max: number) {
  const v = String(fd.get(key) ?? "").trim();
  return v.length > max ? null : v;
}

export async function submitRsvp(
  slug: string,
  _prev: GuestFormState,
  fd: FormData,
): Promise<GuestFormState> {
  // Honeypot: real guests never see or fill this field.
  if (fd.get("website")) return { status: "success", message: "Thank you!" };
  if (!(await rateLimit("rsvp", 10, TEN_MINUTES)))
    return { status: "error", message: "Too many replies from this device. Please try again later." };

  const name = text(fd, "name", 120);
  if (!name) return { status: "error", message: "Please enter your name." };

  const attendingRaw = fd.get("attending");
  if (attendingRaw !== "yes" && attendingRaw !== "no")
    return { status: "error", message: "Please tell us whether you can come." };
  const attending = attendingRaw === "yes";

  const guests = attending ? Number(fd.get("guest_count") ?? 1) : 0;
  if (!Number.isInteger(guests) || guests < 0 || guests > 20)
    return { status: "error", message: "Number of guests must be between 1 and 20." };
  if (attending && guests < 1) return { status: "error", message: "Include yourself in the number of guests." };

  const weddingId = await publishedWeddingId(slug);
  if (!weddingId) return { status: "error", message: "This invite is no longer accepting replies." };

  const { error } = await createAdminClient()
    .from("rsvps")
    .insert({ wedding_id: weddingId, name, attending, guest_count: guests });
  if (error) return { status: "error", message: "Something went wrong. Please try again." };

  return {
    status: "success",
    message: attending
      ? `Thank you, ${name}! We can't wait to celebrate with you.`
      : `Thank you for letting us know, ${name}. You'll be missed!`,
  };
}

export async function submitContribution(
  slug: string,
  _prev: GuestFormState,
  fd: FormData,
): Promise<GuestFormState> {
  if (fd.get("website")) return { status: "success", message: "Thank you!" };
  if (!(await rateLimit("contribution", 10, TEN_MINUTES)))
    return { status: "error", message: "Too many entries from this device. Please try again later." };

  const goalId = String(fd.get("goal_id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(goalId)) return { status: "error", message: "Please choose a goal." };

  const isAnonymous = fd.get("is_anonymous") === "on";
  const name = text(fd, "name", 120);
  if (name === null) return { status: "error", message: "Name is too long." };
  if (!isAnonymous && !name) return { status: "error", message: "Please enter your name, or choose to stay anonymous." };

  const amount = Number(String(fd.get("amount") ?? "").replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000)
    return { status: "error", message: "Please enter the amount you sent." };

  const message = text(fd, "message", 1000);
  if (message === null) return { status: "error", message: "Message is too long (1000 characters max)." };

  const weddingId = await publishedWeddingId(slug);
  if (!weddingId) return { status: "error", message: "This invite is no longer accepting contributions." };

  // A database trigger also checks the goal belongs to this wedding.
  const { error } = await createAdminClient()
    .from("contributions")
    .insert({
      wedding_id: weddingId,
      goal_id: goalId,
      name: name || null,
      amount: Math.round(amount * 100) / 100,
      message: message || null,
      is_anonymous: isAnonymous,
    });
  if (error) return { status: "error", message: "Something went wrong. Please try again." };

  return {
    status: "success",
    message: "Thank you! The couple will confirm your contribution once they see it.",
  };
}
