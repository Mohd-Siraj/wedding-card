import { ImageResponse } from "next/og";
import { connection, type NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import { loadCardFonts } from "@/lib/card-fonts";
import { CARD_SIZE, renderCard } from "@/lib/card-render";
import { slugify } from "@/lib/format";
import { coupleNames, loadPublicInvite } from "@/lib/invite-data";

// Downloadable invite card in the chosen template, with a QR code to the page.
//   /w/{slug}/card            PNG
//   /w/{slug}/card?format=pdf PDF
export async function GET(request: NextRequest, ctx: RouteContext<"/w/[slug]/card">) {
  await connection();
  const { slug } = await ctx.params;
  const invite = await loadPublicInvite(slug);
  if (!invite) return new Response("Invite not found or not published", { status: 404 });

  const fonts = await loadCardFonts();
  const png = await new ImageResponse(await renderCard(invite), { ...CARD_SIZE, fonts }).arrayBuffer();
  const filename = `${slugify(coupleNames(invite)) || "wedding"}-invite`;

  if (request.nextUrl.searchParams.get("format") === "pdf") {
    const pdf = await PDFDocument.create();
    pdf.setTitle(`${coupleNames(invite)} – Wedding invitation`);
    const image = await pdf.embedPng(png);
    // 5 × 6.25 inches, same proportions as the image.
    const page = pdf.addPage([360, 450]);
    page.drawImage(image, { x: 0, y: 0, width: 360, height: 450 });
    const bytes = await pdf.save();
    return new Response(bytes as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
