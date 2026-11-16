import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files, images and the public invite pages (guests never log in).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|w/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
