import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Signed-in couple, or a redirect to the login page. */
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, user: data.user };
}

/** A wedding the signed-in couple owns. RLS hides everyone else's, so a miss is a 404. */
export async function requireWedding(id: string) {
  const { supabase, user } = await requireUser();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!wedding) notFound();
  return { supabase, user, wedding };
}
