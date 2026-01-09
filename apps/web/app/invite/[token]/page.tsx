import { redirect } from 'next/navigation';
import { InviteAcceptForm } from '@/components/InviteAcceptForm';
import type { InvitationDetails } from '@/components/InviteAcceptForm';

interface PageParams {
  params: Promise<{
    token: string;
  }>;
}

/**
 * Invitation Acceptance Page (Server Component)
 * 
 * Public page (no authentication required) for accepting user invitations.
 * Fetches invitation details and displays the acceptance form.
 */
export default async function InviteAcceptPage({ params }: PageParams) {
  const { token } = await params;

  if (!token || typeof token !== 'string') {
    redirect('/');
  }

  // Fetch invitation details
  let invitation: InvitationDetails | undefined;
  let error: string | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/invite/${token}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        error = 'Invitation not found';
      } else if (response.status === 410) {
        const result = await response.json();
        error = result.error || 'This invitation has expired or already been accepted';
      } else {
        error = 'Failed to load invitation';
      }
    } else {
      const result = await response.json();
      invitation = result.invitation;
    }
  } catch (err) {
    console.error('Failed to fetch invitation:', err);
    error = 'Failed to load invitation. Please try again.';
  }

  // If there's an error, show error page
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary dark:bg-background-dark p-4">
        <div className="max-w-md w-full rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-4">
            Invalid Invitation
          </h1>
          <p className="text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
            {error}
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary dark:bg-background-dark p-4">
      <div className="max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-2">
            Accept Invitation
          </h1>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            Create your account to get started
          </p>
        </div>
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          {invitation && (
            <InviteAcceptForm token={token} invitation={invitation} />
          )}
        </div>
      </div>
    </div>
  );
}
