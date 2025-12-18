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
};

export default nextConfig;

