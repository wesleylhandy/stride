'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '../utils/cn';

export interface UserMenuProps {
  user?: {
    email: string;
    name?: string | null;
    username?: string;
  };
  className?: string;
}

/**
 * UserMenu component
 * 
 * Displays user information and logout button.
 * If user prop is not provided, fetches user data from API.
 */
export function UserMenu({ user: initialUser, className }: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState(initialUser);
  const [loading, setLoading] = React.useState(!initialUser);
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Fetch user data if not provided
  React.useEffect(() => {
    if (!initialUser) {
      fetch('/api/auth/me')
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [initialUser]);

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page
        router.push('/login');
        router.refresh();
      } else {
        // Even if logout fails, redirect to login
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      // On error, still redirect to login
      router.push('/login');
      router.refresh();
    } finally {
      setLogoutLoading(false);
    }
  };

  const displayName = user?.name || user?.username || user?.email || 'User';

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-8 w-8 rounded-full bg-background-secondary dark:bg-background-dark animate-pulse" />
        <div className="h-4 w-24 bg-background-secondary dark:bg-background-dark rounded animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-background-secondary dark:hover:bg-background-dark transition-colors focus-ring"
        aria-label="User menu"
        aria-expanded={showMenu}
        aria-haspopup="true"
      >
        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline text-foreground dark:text-foreground-dark">
          {displayName}
        </span>
        <svg
          className={cn(
            'h-4 w-4 text-foreground-secondary dark:text-foreground-dark-secondary transition-transform',
            showMenu && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-lg z-50">
          <div className="p-4 border-b border-border dark:border-border-dark">
            <p className="text-sm font-medium text-foreground dark:text-foreground-dark">
              {displayName}
            </p>
            <p className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary mt-1">
              {user.email}
            </p>
          </div>
          <div className="p-2 space-y-1">
            {/* Settings Link */}
            <Link
              href="/settings"
              onClick={() => setShowMenu(false)}
              className={cn(
                'w-full flex items-center justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'text-foreground dark:text-foreground-dark',
                'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
                'active:bg-background-tertiary dark:active:bg-background-dark-tertiary',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark',
                pathname === '/settings' && 'bg-accent/10 text-accent'
              )}
            >
              <svg
                className="mr-2 h-4 w-4 text-foreground dark:text-foreground-dark"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-foreground dark:text-foreground-dark">
                Settings
              </span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className={cn(
                'w-full flex items-center justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'text-foreground dark:text-foreground-dark',
                'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
                'active:bg-background-tertiary dark:active:bg-background-dark-tertiary',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark',
                'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
                logoutLoading && 'cursor-wait'
              )}
            >
              {logoutLoading && (
                <svg
                  className="mr-2 h-4 w-4 animate-spin text-foreground dark:text-foreground-dark"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              <svg
                className={cn(
                  'mr-2 h-4 w-4 text-foreground dark:text-foreground-dark',
                  logoutLoading && 'hidden'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-foreground dark:text-foreground-dark">
                Log out
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

