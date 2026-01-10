import type { Config } from "tailwindcss";
import uiConfig from "../../packages/ui/tailwind.config";

const config: Config = {
  // Extend the UI package's Tailwind config
  ...uiConfig,
  // Explicitly set darkMode to ensure it's inherited
  darkMode: ["class", "[data-theme='dark']"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Include UI package components
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  // Merge theme extensions
  theme: {
    ...uiConfig.theme,
    extend: {
      ...uiConfig.theme?.extend,
    },
  },
};

export default config;

