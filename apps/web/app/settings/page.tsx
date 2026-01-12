import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account and system settings',
};

/**
 * Settings Index Page
 * 
 * Redirects to /settings/account as the default settings section.
 */
export default async function SettingsPage() {
  redirect('/settings/account');
}

