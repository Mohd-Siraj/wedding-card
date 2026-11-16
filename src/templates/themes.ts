// Template designs. Each one is data read by the shared invite component, the
// link-preview image and the downloadable card, so all three always match.
// Artwork is drawn in SVG for now; AI artwork can replace `ornament` later
// (see PRD open question on the artwork tool and its licence).

export type TemplateId = "classic" | "floral" | "modern" | "royal";

export type Theme = {
  id: TemplateId;
  name: string;
  description: string;
  colors: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    onAccent: string;
    border: string;
  };
  /** CSS font stacks for the web page (variables set in the root layout). */
  fonts: { names: string; heading: string; body: string };
  /** Satori font family names for generated images (see lib/card-fonts.ts). */
  imageFonts: { names: "Playfair Display" | "Great Vibes"; body: "Playfair Display" | "Noto Sans" };
  namesUppercase: boolean;
  hero: "arch" | "circle" | "bleed" | "frame";
  ornament: "leaves" | "florals" | "line" | "mandala";
};

export const THEMES: Record<TemplateId, Theme> = {
  classic: {
    id: "classic",
    name: "Ivory & Gold",
    description: "Timeless serif type on warm ivory with gold leaves.",
    colors: {
      bg: "#fbf7f0",
      surface: "#ffffff",
      text: "#3b3127",
      muted: "#7a6a58",
      accent: "#b08d57",
      onAccent: "#ffffff",
      border: "#e8dcc8",
    },
    fonts: {
      names: "var(--font-cormorant), Georgia, serif",
      heading: "var(--font-cormorant), Georgia, serif",
      body: "var(--font-geist-sans), system-ui, sans-serif",
    },
    imageFonts: { names: "Playfair Display", body: "Playfair Display" },
    namesUppercase: false,
    hero: "arch",
    ornament: "leaves",
  },
  floral: {
    id: "floral",
    name: "Blush Garden",
    description: "Soft blush tones, script names and hand-drawn florals.",
    colors: {
      bg: "#fdf2f4",
      surface: "#ffffff",
      text: "#4a2c34",
      muted: "#8a6670",
      accent: "#c26d84",
      onAccent: "#ffffff",
      border: "#f3d3db",
    },
    fonts: {
      names: "var(--font-script), cursive",
      heading: "var(--font-playfair), Georgia, serif",
      body: "var(--font-geist-sans), system-ui, sans-serif",
    },
    imageFonts: { names: "Great Vibes", body: "Playfair Display" },
    namesUppercase: false,
    hero: "circle",
    ornament: "florals",
  },
  modern: {
    id: "modern",
    name: "Modern Minimal",
    description: "Clean, monochrome and editorial, with a full-width photo.",
    colors: {
      bg: "#ffffff",
      surface: "#f5f5f4",
      text: "#111111",
      muted: "#6b6b6b",
      accent: "#111111",
      onAccent: "#ffffff",
      border: "#e5e5e5",
    },
    fonts: {
      names: "var(--font-geist-sans), system-ui, sans-serif",
      heading: "var(--font-geist-sans), system-ui, sans-serif",
      body: "var(--font-geist-sans), system-ui, sans-serif",
    },
    imageFonts: { names: "Playfair Display", body: "Noto Sans" },
    namesUppercase: true,
    hero: "bleed",
    ornament: "line",
  },
  royal: {
    id: "royal",
    name: "Royal Maroon",
    description: "Deep maroon and gold with a mandala, made for grand celebrations.",
    colors: {
      bg: "#4a0e1b",
      surface: "#5c1424",
      text: "#f6e7c8",
      muted: "#d9c29a",
      accent: "#d4a64a",
      onAccent: "#3a0a14",
      border: "#7a2a3a",
    },
    fonts: {
      names: "var(--font-playfair), Georgia, serif",
      heading: "var(--font-playfair), Georgia, serif",
      body: "var(--font-geist-sans), system-ui, sans-serif",
    },
    imageFonts: { names: "Playfair Display", body: "Playfair Display" },
    namesUppercase: false,
    hero: "frame",
    ornament: "mandala",
  },
};

export const TEMPLATE_IDS = Object.keys(THEMES) as TemplateId[];

export function getTheme(id: string | null | undefined): Theme {
  return THEMES[(id ?? "") as TemplateId] ?? THEMES.classic;
}
