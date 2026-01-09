"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background-secondary via-background to-background dark:from-background-dark dark:via-background-dark-secondary dark:to-background-dark">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,170,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,170,0.08),transparent_50%)]" />
      
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <div className="inline-flex space-x-6">
              <span className="rounded-full bg-accent/10 px-4 py-1.5 text-sm font-semibold leading-6 text-accent ring-1 ring-inset ring-accent/20 transition-all duration-300 hover:bg-accent/15 hover:ring-accent/30 dark:bg-accent/10 dark:text-accent dark:ring-accent/30">
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
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-x-6">
            <Link
              href="/docs/install"
              className="group rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/20 transition-all duration-300 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-accent dark:hover:bg-accent-hover"
            >
              Get Started (Self-Host)
              <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href={
                process.env.NEXT_PUBLIC_GITHUB_REPOSITORY_URL ||
                "https://github.com"
              }
              className="group text-sm font-semibold leading-6 text-foreground transition-colors duration-300 hover:text-accent dark:text-foreground-dark dark:hover:text-accent"
            >
              View on GitHub
              <span className="inline-block ml-1 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none w-full">
            <div className="-m-2 rounded-2xl bg-foreground/5 p-3 ring-1 ring-inset ring-border/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-accent/10 hover:ring-accent/30 lg:-m-4 lg:rounded-3xl lg:p-5 dark:bg-foreground-dark/5 dark:ring-border-dark/20 dark:hover:shadow-accent/5">
              <div className="rounded-xl bg-surface p-6 shadow-xl ring-1 ring-border/20 sm:p-10 lg:p-8 xl:p-12 dark:bg-surface-dark dark:ring-border-dark/20 transition-all duration-500 hover:shadow-2xl">
                <div className="aspect-[16/10] w-full rounded-xl bg-gradient-to-br from-accent/12 via-accent/10 to-accent/6 dark:from-accent/25 dark:via-accent/20 dark:to-accent/12 flex items-center justify-center transition-all duration-500 hover:from-accent/18 hover:via-accent/14 hover:to-accent/10 dark:hover:from-accent/30 dark:hover:via-accent/25 dark:hover:to-accent/18 p-8 sm:p-12">
                  <div className="text-center space-y-6 w-full max-w-md">
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl animate-pulse [animation-duration:2s]" />
                        <div className="relative bg-accent/15 dark:bg-accent/25 rounded-2xl p-5 sm:p-6 backdrop-blur-sm border border-accent/20 dark:border-accent/30 shadow-lg shadow-accent/10 transition-transform duration-500 hover:scale-110 hover:rotate-3">
                          <div className="text-5xl sm:text-6xl animate-pulse [animation-duration:3s] filter drop-shadow-lg">⚡</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
                        Blazing Fast UX
                      </h3>
                      <p className="text-base sm:text-lg text-foreground-secondary dark:text-foreground-dark-secondary leading-relaxed max-w-md mx-auto">
                        Keyboard-driven, instant responses
                      </p>
                    </div>
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

