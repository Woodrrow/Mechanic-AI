import { ImageResponse } from "next/og";
import { IconArtwork } from "@/lib/brand/icon-artwork";

export const dynamic = "force-static";
export const dynamicParams = false;

const VARIANTS = {
  "192": { size: 192, padding: 0 },
  "512": { size: 512, padding: 0 },
  // Maskable icons are cropped to a circle/squircle by the OS; keep the mark
  // inside the central 80% safe zone.
  maskable: { size: 512, padding: 96 },
} as const;

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/pwa-icon/[variant]">,
) {
  const { variant } = await ctx.params;
  const spec = VARIANTS[variant as keyof typeof VARIANTS] ?? VARIANTS["512"];
  return new ImageResponse(
    <IconArtwork size={spec.size} padding={spec.padding} />,
    { width: spec.size, height: spec.size },
  );
}
