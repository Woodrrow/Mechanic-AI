import { ImageResponse } from "next/og";
import { IconArtwork } from "@/lib/brand/icon-artwork";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // iOS applies its own corner mask, so render a full-bleed tile.
  return new ImageResponse(<IconArtwork size={180} padding={1} />, size);
}
