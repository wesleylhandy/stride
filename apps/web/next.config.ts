import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import path from "path";

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
  // Explicitly set Turbopack root to silence workspace root warning
  // The monorepo root is two directories up from apps/web
  // Using path.resolve for reliable absolute path resolution
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  // Bundle size optimization
  compiler: {
    // Remove console.log in production (keep console.error and console.warn)
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  // Image optimization configuration
  images: {
    // Enable Next.js Image Optimization API
    formats: ["image/avif", "image/webp"],
    // Configure image domains for external images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.gitlab.com",
      },
      {
        protocol: "https",
        hostname: "**.bitbucket.org",
      },
      // Add other domains as needed for user avatars, link previews, etc.
    ],
    // Image optimization quality (default: 75)
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Next.js 16 uses Turbopack by default, so we don't need webpack config
  // Error suppression is handled by ErrorSuppressor component instead
};

// Wrap Next.js config with Sentry
export default withSentryConfig(
  nextConfig,
  {
    // Sentry options
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    // Sentry build options
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);

