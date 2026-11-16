import type { NextRequest } from "next/server";
import { requireWedding } from "@/lib/auth";

// CSV export of RSVPs or contributions for the owning couple (PRD P1).
function csv(rows: (string | number | boolean | null)[][]) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = v === null ? "" : String(v);
          // Quote everything; neutralise spreadsheet formulas.
          const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}

export async function GET(request: NextRequest, ctx: RouteContext<"/dashboard/[id]/export">) {
  const { id } = await ctx.params;
  const { supabase, wedding } = await requireWedding(id);
  const type = request.nextUrl.searchParams.get("type");

  let body: string;
  if (type === "rsvps") {
    const { data } = await supabase.from("rsvps").select("*").eq("wedding_id", id).order("created_at");
    body = csv([
      ["Name", "Attending", "Guests", "Replied at"],
      ...(data ?? []).map((r) => [r.name, r.attending ? "Yes" : "No", r.guest_count, r.created_at]),
    ]);
  } else if (type === "contributions") {
    const [{ data: goals }, { data }] = await Promise.all([
      supabase.from("goals").select("id, title").eq("wedding_id", id),
      supabase.from("contributions").select("*").eq("wedding_id", id).order("created_at"),
    ]);
    const title = new Map((goals ?? []).map((g) => [g.id, g.title]));
    body = csv([
      ["Goal", "Name", "Amount", "Currency", "Message", "Hidden from guests", "Status", "Recorded at"],
      ...(data ?? []).map((c) => [
        title.get(c.goal_id) ?? "",
        c.name,
        Number(c.amount),
        wedding.currency,
        c.message,
        c.is_anonymous,
        c.status,
        c.created_at,
      ]),
    ]);
  } else {
    return new Response("Unknown export type", { status: 400 });
  }

  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${wedding.slug}-${type}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
