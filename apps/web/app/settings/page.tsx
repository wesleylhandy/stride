import { redirect } from 'next/navigation';

/**
 * Settings Index Page
 * 
 * Redirects to /settings/account as the default settings section.
 */
export default async function SettingsPage() {
  redirect('/settings/account');
}

