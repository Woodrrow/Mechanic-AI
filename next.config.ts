import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The guide cache is read from disk at request time; include it in the traced output.
  outputFileTracingIncludes: {
    "/api/guides": ["./data/guides/**/*"],
    "/api/videos": ["./data/guides/**/*"],
  },
};

export default nextConfig;
