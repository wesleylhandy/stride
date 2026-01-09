import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeToggle } from "./components/ThemeToggle";
import "./globals.css";

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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}

