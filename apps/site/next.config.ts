import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import path from "path";

const nextConfig: NextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Explicitly set Turbopack root to silence workspace root warning
  // The monorepo root is two directories up from apps/site
  // Using path.resolve for reliable absolute path resolution
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  // Optionally, add any other Next.js config below
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);

