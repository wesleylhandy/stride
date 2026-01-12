import type { Metadata } from "next";

/**
 * Site metadata configuration
 *
 * This can be customized when instantiating Stride by:
 * 1. Editing this file directly
 * 2. Setting environment variables (NEXT_PUBLIC_SITE_*)
 *
 * Environment variables take precedence over defaults.
 */
export const siteConfig = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || "Stride - Developer-First Flow Tracker",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Self-hosted, open-source flow tracker that matches the speed and developer experience of Linear, with a focused approach to Engineering-Product-Design workflows.",
  openGraphDescription:
    process.env.NEXT_PUBLIC_SITE_OG_DESCRIPTION ||
    "Self-hosted, open-source flow tracker with blazing fast UX and deep Git integration.",
  keywords: [
    "flow tracker",
    "issue tracker",
    "project management",
    "developer tools",
    "self-hosted",
    "open source",
    "kanban",
    "sprint planning",
  ],
  author: process.env.NEXT_PUBLIC_SITE_AUTHOR || "Stride Team",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://stride.dev",
} as const;

/**
 * Generate Next.js Metadata object from site configuration
 */
export function getSiteMetadata(): Metadata {
  return {
    title: siteConfig.title,
    description: siteConfig.description,
    keywords: [...siteConfig.keywords],
    authors: [{ name: siteConfig.author }],
    openGraph: {
      title: siteConfig.title,
      description: siteConfig.openGraphDescription,
      type: "website",
      url: siteConfig.url,
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.openGraphDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
