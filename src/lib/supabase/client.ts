import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Supabase client for Client Components. Uses the publishable key, so every
// query is subject to Row Level Security.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
