import "server-only";
import QRCode from "qrcode";
import { appName, formatDate, formatShortDate, formatTime, siteUrl } from "@/lib/format";
import { mainDate, type InviteData } from "@/lib/invite-data";
import { getTheme } from "@/templates/themes";

// Image layouts for the link preview and the downloadable card. Rendered by
// next/og (Satori), which supports a flexbox subset of CSS: every element
// with more than one child needs display: flex.

export const CARD_SIZE = { width: 1080, height: 1350 };
export const OG_SIZE = { width: 1200, height: 630 };

export function inviteUrl(slug: string) {
  return `${siteUrl()}/w/${slug}`;
}

function Names({ invite, size }: { invite: InviteData; size: number }) {
  const t = getTheme(invite.template);
  const upper = t.namesUppercase;
  const style = {
    fontFamily: t.imageFonts.names,
    fontSize: upper ? size * 0.7 : size,
    letterSpacing: upper ? size * 0.08 : 0,
    textTransform: upper ? ("uppercase" as const) : ("none" as const),
    fontWeight: upper ? 600 : 400,
    lineHeight: 1.1,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", ...style }}>
      <span>{invite.partnerOne || "Partner"}</span>
      <span style={{ fontSize: style.fontSize * 0.5, color: t.colors.accent }}>&amp;</span>
      <span>{invite.partnerTwo || "Partner"}</span>
    </div>
  );
}

function Divider({ color, width = 240 }: { color: string; width?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: width / 2 - 14, height: 2, background: color }} />
      <div style={{ width: 10, height: 10, background: color, transform: "rotate(45deg)" }} />
      <div style={{ width: width / 2 - 14, height: 2, background: color }} />
    </div>
  );
}

export async function renderCard(invite: InviteData) {
  const t = getTheme(invite.template);
  const c = t.colors;
  const date = mainDate(invite);
  const qr = await QRCode.toDataURL(inviteUrl(invite.slug), {
    margin: 1,
    width: 360,
    color: { dark: "#111111", light: "#ffffff" },
  });
  const photoStyle =
    t.hero === "circle"
      ? { width: 340, height: 340, borderRadius: 170 }
      : t.hero === "arch"
        ? { width: 300, height: 380, borderRadius: "150px 150px 8px 8px" }
        : { width: 420, height: 320, borderRadius: 4 };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: c.bg,
        color: c.text,
        fontFamily: t.imageFonts.body,
        padding: 36,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          border: `3px solid ${c.accent}`,
          padding: "56px 48px 36px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
            paddingBottom: 32,
          }}
        >
          <span style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: c.muted }}>
            Together with their families
          </span>
          {invite.coverPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={invite.coverPhotoUrl}
              alt=""
              style={{ ...photoStyle, objectFit: "cover", border: `4px solid ${c.accent}` }}
            />
          )}
          <Names invite={invite} size={invite.coverPhotoUrl ? 92 : 120} />
          <span style={{ fontSize: 22, letterSpacing: 5, textTransform: "uppercase", color: c.muted }}>
            invite you to celebrate their wedding
          </span>
          <Divider color={c.accent} />
          {date && <span style={{ fontSize: 40 }}>{formatDate(date.iso, date.timezone)}</span>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 24, color: c.muted }}>
            {invite.events.slice(0, 3).map((e) => (
              <span key={e.id}>
                {e.name} · {formatShortDate(e.startsAt, e.timezone)}, {formatTime(e.startsAt, e.timezone)}
                {e.venueName ? ` · ${e.venueName}` : ""}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="" width={170} height={170} style={{ borderRadius: 8 }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
            <span style={{ fontSize: 30 }}>Scan to RSVP</span>
            <span style={{ fontSize: 20, color: c.muted }}>{inviteUrl(invite.slug).replace(/^https?:\/\//, "")}</span>
            <span style={{ fontSize: 18, color: c.muted, marginTop: 10 }}>Made with {appName()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function renderOgImage(invite: InviteData) {
  const t = getTheme(invite.template);
  const c = t.colors;
  const date = mainDate(invite);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: c.bg,
        color: c.text,
        fontFamily: t.imageFonts.body,
      }}
    >
      {invite.coverPhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={invite.coverPhotoUrl} alt="" width={520} height={630} style={{ objectFit: "cover" }} />
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: 48,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: c.muted }}>
          You&apos;re invited
        </span>
        <Names invite={invite} size={invite.coverPhotoUrl ? 84 : 104} />
        <Divider color={c.accent} />
        {date && <span style={{ fontSize: 34 }}>{formatDate(date.iso, date.timezone)}</span>}
        {invite.events[0]?.venueName && (
          <span style={{ fontSize: 24, color: c.muted }}>{invite.events[0].venueName}</span>
        )}
      </div>
    </div>
  );
}
