import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { loadCardFonts } from "@/lib/card-fonts";
import { OG_SIZE, renderOgImage } from "@/lib/card-render";
import { loadPublicInvite } from "@/lib/invite-data";

// The image WhatsApp and other apps show when the invite link is shared:
// photo, names and date (PRD: Public page).
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Wedding invitation";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  await connection(); // always reflect the latest edits
  const { slug } = await params;
  const invite = await loadPublicInvite(slug);
  const fonts = await loadCardFonts();

  if (!invite) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            background: "#fbf7f0",
          }}
        >
          Wedding invitation
        </div>
      ),
      { ...size, fonts },
    );
  }

  return new ImageResponse(renderOgImage(invite), {
    ...size,
    fonts,
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
