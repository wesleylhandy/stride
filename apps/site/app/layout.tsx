import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeToggle } from "./components/ThemeToggle";
import "./globals.css";
import "@stride/ui/styles";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stride - Developer-First Flow Tracker",
  description:
    "Self-hosted, open-source flow tracker that matches the speed and developer experience of Linear, with a focused approach to Engineering-Product-Design workflows.",
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
  authors: [{ name: "Stride Team" }],
  openGraph: {
    title: "Stride - Developer-First Flow Tracker",
    description:
      "Self-hosted, open-source flow tracker with blazing fast UX and deep Git integration.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stride - Developer-First Flow Tracker",
    description:
      "Self-hosted, open-source flow tracker with blazing fast UX and deep Git integration.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background dark:bg-background-dark`}>
        {/* Blocking script to initialize dark mode before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
                  const html = document.documentElement;
                  if (shouldBeDark) {
                    html.classList.add('dark');
                    html.setAttribute('data-theme', 'dark');
                  } else {
                    html.classList.remove('dark');
                    html.setAttribute('data-theme', 'light');
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}

