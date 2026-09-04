/**
 * The app icon, drawn as plain SVG so it can be rasterised at build time by
 * next/og (Satori + resvg) without any image tooling in the repo.
 * A spanner on a blue tile. `padding` is the safe-zone inset for maskable icons.
 */
export function IconArtwork({
  size,
  padding = 0,
}: {
  size: number;
  padding?: number;
}) {
  const inner = size - padding * 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1d4ed8",
        borderRadius: padding > 0 ? 0 : Math.round(size * 0.22),
      }}
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="rotate(45 32 32)">
          <circle cx="32" cy="17" r="13" fill="#ffffff" />
          <rect x="26" y="0" width="12" height="17" fill="#1d4ed8" />
          <rect x="26.5" y="24" width="11" height="36" rx="4.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}
