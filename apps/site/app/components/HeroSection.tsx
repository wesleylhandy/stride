"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <div className="inline-flex space-x-6">
              <span className="rounded-full bg-primary-600/10 px-3 py-1 text-sm font-semibold leading-6 text-primary-600 ring-1 ring-inset ring-primary-600/10 dark:bg-primary-400/10 dark:text-primary-400 dark:ring-primary-400/20">
                Self-Hosted & Open Source
              </span>
            </div>
          </div>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
            Developer-First Flow Tracker
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Match the speed and developer experience of Linear, with a focused
            approach to Engineering-Product-Design workflows. Self-host in
            minutes, no enterprise bloat.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Link
              href="/docs/install"
              className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:bg-primary-500 dark:hover:bg-primary-400"
            >
              Get Started (Self-Host)
            </Link>
            <Link
              href="https://github.com"
              className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
            >
              View on GitHub <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 dark:bg-gray-100/5 dark:ring-gray-100/10">
              <div className="rounded-md bg-white p-2 shadow-2xl ring-1 ring-gray-900/10 sm:p-8 lg:p-4 xl:p-8 dark:bg-gray-800 dark:ring-gray-100/10">
                <div className="aspect-[16/10] w-full rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">⚡</div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      Blazing Fast UX
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
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

