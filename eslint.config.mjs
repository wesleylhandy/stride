import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig, // Disable ESLint rules that conflict with Prettier
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "node_modules/**",
    "coverage/**",
    "*.tsbuildinfo",
    "next-env.d.ts",
    ".turbo/**",
    "packages/*/dist/**",
    "apps/*/dist/**",
    "apps/*/.next/**",
  ]),
]);

export default eslintConfig;
