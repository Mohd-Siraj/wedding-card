import "server-only";

// Fonts for generated images (link previews and downloadable cards). The
// image renderer needs TTF/OTF data, so fetch it once from Google Fonts and
// keep it in memory. If the fetch fails, images fall back to the default font.

type FontSpec = { name: string; family: string; weight: 400 | 600 };
type LoadedFont = { name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" };

const SPECS: FontSpec[] = [
  { name: "Playfair Display", family: "Playfair+Display", weight: 400 },
  { name: "Playfair Display", family: "Playfair+Display", weight: 600 },
  { name: "Great Vibes", family: "Great+Vibes", weight: 400 },
  { name: "Noto Sans", family: "Noto+Sans", weight: 400 },
];

let cache: Promise<LoadedFont[]> | null = null;

async function loadOne(spec: FontSpec): Promise<LoadedFont | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${spec.family}:wght@${spec.weight}&display=swap`,
    ).then((r) => r.text());
    // Without a browser user agent Google serves TrueType, which the renderer needs.
    const url = /src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/.exec(css)?.[1];
    if (!url) return null;
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return { name: spec.name, data, weight: spec.weight, style: "normal" };
  } catch {
    return null;
  }
}

export function loadCardFonts(): Promise<LoadedFont[]> {
  cache ??= Promise.all(SPECS.map(loadOne)).then((fonts) => {
    const ok = fonts.filter((f): f is LoadedFont => f !== null);
    if (ok.length < SPECS.length) cache = null; // retry next time
    return ok;
  });
  return cache;
}
