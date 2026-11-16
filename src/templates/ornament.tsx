import type { Theme } from "./themes";

// Decorative SVG artwork per template. Uses currentColor so it follows the
// theme's accent colour.
export function Ornament({ kind, className }: { kind: Theme["ornament"]; className?: string }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    "aria-hidden": true,
  };

  switch (kind) {
    case "leaves":
      return (
        <svg viewBox="0 0 240 40" {...common}>
          <path d="M20 20h80M140 20h80" />
          <path d="M120 8c6 6 6 18 0 24c-6-6-6-18 0-24z" fill="currentColor" fillOpacity=".15" />
          <path d="M100 20c-8-8-20-8-26-4c6 6 18 8 26 4zM100 20c-8 8-20 8-26 4c6-6 18-8 26-4z" />
          <path d="M140 20c8-8 20-8 26-4c-6 6-18 8-26 4zM140 20c8 8 20 8 26 4c-6-6-18-8-26-4z" />
          <circle cx="120" cy="20" r="2" fill="currentColor" />
        </svg>
      );
    case "florals":
      return (
        <svg viewBox="0 0 240 48" {...common}>
          <path d="M10 30c30-14 60-14 90-4M230 30c-30-14-60-14-90-4" />
          {[60, 180].map((cx) => (
            <g key={cx}>
              {[0, 72, 144, 216, 288].map((r) => (
                <ellipse
                  key={r}
                  cx={cx}
                  cy={18}
                  rx="4"
                  ry="8"
                  transform={`rotate(${r} ${cx} 24) translate(0 -2)`}
                  fill="currentColor"
                  fillOpacity=".18"
                />
              ))}
              <circle cx={cx} cy={24} r="2.5" fill="currentColor" />
            </g>
          ))}
          <path d="M120 10c8 4 8 16 0 22c-8-6-8-18 0-22z" fill="currentColor" fillOpacity=".25" />
          <path d="M120 32v10M112 40c4-4 12-4 16 0" />
        </svg>
      );
    case "line":
      return (
        <svg viewBox="0 0 240 12" {...common}>
          <path d="M60 6h120" />
        </svg>
      );
    case "mandala":
      return (
        <svg viewBox="0 0 120 120" {...common} strokeWidth={1}>
          <circle cx="60" cy="60" r="10" />
          <circle cx="60" cy="60" r="22" />
          <circle cx="60" cy="60" r="44" strokeDasharray="2 4" />
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d="M60 38c6 8 6 14 0 22c-6-8-6-14 0-22z"
              transform={`rotate(${i * 30} 60 60)`}
              fill="currentColor"
              fillOpacity=".15"
            />
          ))}
          {Array.from({ length: 24 }, (_, i) => (
            <circle key={i} cx="60" cy="10" r="1.6" transform={`rotate(${i * 15} 60 60)`} fill="currentColor" />
          ))}
        </svg>
      );
  }
}
