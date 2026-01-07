'use client';

import * as React from 'react';
import { UserMenu } from '../molecules/UserMenu';
import { cn } from '../utils/cn';
import { useState, useEffect } from 'react';

export interface TopBarProps {
  className?: string;
}

/**
 * TopBar component
 * 
 * Provides consistent header with user menu, search placeholder, and notifications.
 * Displays on all authenticated pages.
 */
// ThemeToggle component (inline to avoid circular dependencies)
function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    setIsDark(shouldBeDark);
    const html = document.documentElement;
    if (shouldBeDark) {
      html.classList.add("dark");
      html.setAttribute("data-theme", "dark");
    } else {
      html.classList.remove("dark");
      html.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    const html = document.documentElement;
    if (newTheme) {
      html.classList.add("dark");
      html.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      html.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) {
    return (
      <button
        className={cn(
          'rounded-md p-2',
          'text-foreground-secondary dark:text-foreground-dark-secondary',
          'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark',
          'transition-colors'
        )}
        aria-label="Toggle theme"
      >
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'rounded-md p-2',
        'text-foreground-secondary dark:text-foreground-dark-secondary',
        'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark',
        'transition-colors'
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
      <span className="sr-only">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </span>
    </button>
  );
}

export function TopBar({ className }: TopBarProps) {
  const [searchFocused, setSearchFocused] = React.useState(false);

  return (
    <div
      className={cn(
        'border-b border-border dark:border-border-dark',
        'bg-surface dark:bg-surface-dark',
        'sticky top-0 z-40',
        className
      )}
    >
      <div className="mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Search placeholder */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-foreground-secondary dark:text-foreground-dark-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search (coming soon)..."
                disabled
                className={cn(
                  'w-full pl-10 pr-4 py-2',
                  'border border-border dark:border-border-dark rounded-md',
                  'bg-background dark:bg-background-dark',
                  'text-foreground dark:text-foreground-dark',
                  'placeholder:text-foreground-secondary dark:placeholder:text-foreground-dark-secondary',
                  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  searchFocused && 'ring-2 ring-accent'
                )}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                aria-label="Search"
              />
            </div>
          </div>

          {/* Right side: Notifications, Theme Toggle, and User Menu */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Notifications placeholder */}
            <button
              type="button"
              disabled
              className={cn(
                'relative p-2 rounded-md flex-shrink-0',
                'text-foreground-secondary dark:text-foreground-dark-secondary',
                'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
              aria-label="Notifications (coming soon)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  );
}

