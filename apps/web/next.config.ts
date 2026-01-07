import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    "@stride/ui",
    "@stride/database",
    "@stride/types",
    "@stride/yaml-config",
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

