import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "@stride/ui/styles";
import { CommandPaletteProvider } from "@/components/CommandPaletteProvider";
import { ErrorSuppressor } from "./components/ErrorSuppressor";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Stride",
    default: "Stride",
  },
  description: "Developer-first workflow management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background dark:bg-background-dark`}
      >
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
        <ErrorSuppressor />
        <CommandPaletteProvider>{children}</CommandPaletteProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: 'bg-background-secondary dark:bg-background-dark-secondary border border-border dark:border-border-dark text-foreground dark:text-foreground-dark',
              title: 'text-foreground dark:text-foreground-dark font-medium',
              description: 'text-foreground-secondary dark:text-foreground-dark-secondary text-sm',
              success: 'border-success dark:border-success-dark',
              error: 'border-error dark:border-error-dark',
              warning: 'border-warning dark:border-warning-dark',
              info: 'border-info dark:border-info-dark',
            },
          }}
        />
      </body>
    </html>
  );
}
