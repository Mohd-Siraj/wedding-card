"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function callbackUrl(next: string) {
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signInWithGoogle(formData: FormData) {
  const next = String(formData.get("next") || "/dashboard");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(next) },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const next = String(formData.get("next") || "/dashboard");
  if (!email) redirect("/login?error=email");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await callbackUrl(next) },
  });
  if (error) redirect("/login?error=email");
  redirect("/login?sent=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
