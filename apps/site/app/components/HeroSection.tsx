"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background-secondary to-background dark:from-background-dark dark:to-background-dark-secondary">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <div className="inline-flex space-x-6">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold leading-6 text-accent ring-1 ring-inset ring-accent/10 dark:bg-accent/10 dark:text-accent dark:ring-accent/20">
                Self-Hosted & Open Source
              </span>
            </div>
          </div>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-foreground sm:text-6xl dark:text-foreground-dark">
            Developer-First Flow Tracker
          </h1>
          <p className="mt-6 text-lg leading-8 text-foreground-secondary dark:text-foreground-dark-secondary">
            Match the speed and developer experience of Linear, with a focused
            approach to Engineering-Product-Design workflows. Self-host in
            minutes, no enterprise bloat.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Link
              href="/docs/install"
              className="rounded-md bg-accent px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-accent dark:hover:bg-accent-hover"
            >
              Get Started (Self-Host)
            </Link>
            <Link
              href="https://github.com"
              className="text-sm font-semibold leading-6 text-foreground dark:text-foreground-dark"
            >
              View on GitHub <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="-m-2 rounded-xl bg-foreground/5 p-2 ring-1 ring-inset ring-border/20 lg:-m-4 lg:rounded-2xl lg:p-4 dark:bg-foreground-dark/5 dark:ring-border-dark/20">
              <div className="rounded-md bg-surface p-2 shadow-2xl ring-1 ring-border/20 sm:p-8 lg:p-4 xl:p-8 dark:bg-surface-dark dark:ring-border-dark/20">
                <div className="aspect-[16/10] w-full rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">⚡</div>
                    <p className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                      Blazing Fast UX
                    </p>
                    <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-2">
                      Keyboard-driven, instant responses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

