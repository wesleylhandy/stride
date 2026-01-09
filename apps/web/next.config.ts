import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    "@stride/ui",
    "@stride/types",
    "@stride/yaml-config",
  ],
  // Mark server-only packages as external to prevent client bundling
  // Note: These packages cannot be in transpilePackages at the same time
  serverExternalPackages: [
    "@stride/database",
    "pg",
    "@prisma/adapter-pg",
    "@prisma/client",
  ],
  // Enable standalone output for Docker
  output: "standalone",
  // Workarounds for Next.js 16.0.10 + React 19 compatibility issues
  experimental: {
    // Suppress ViewportBoundary bundler warnings
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Next.js 16 uses Turbopack by default, so we don't need webpack config
  // Error suppression is handled by ErrorSuppressor component instead
};

export default nextConfig;

