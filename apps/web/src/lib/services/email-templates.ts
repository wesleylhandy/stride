/**
 * Email templates for system notifications
 */

export interface InvitationEmailParams {
  email: string;
  token: string;
  invitedByName: string | null;
  expiresAt: Date;
  inviteUrl: string;
}

/**
 * Generate invitation email HTML content
 */
export function generateInvitationEmailHtml(params: InvitationEmailParams): string {
  const { email, token, invitedByName, expiresAt, inviteUrl } = params;
  const expiresAtFormatted = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const invitedByText = invitedByName
    ? `${invitedByName} has invited you`
    : 'You have been invited';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to join Stride</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
    <h1 style="color: #1a1a1a; margin-top: 0;">You've been invited to join Stride</h1>
    
    <p style="font-size: 16px; margin: 20px 0;">
      ${invitedByText} to join Stride. Click the button below to accept the invitation and create your account.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin: 20px 0;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 12px; color: #999; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">
      ${inviteUrl}
    </p>
    
    <p style="font-size: 14px; color: #666; margin: 30px 0 10px 0;">
      <strong>This invitation expires on:</strong> ${expiresAtFormatted}
    </p>
    
    <p style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate invitation email plain text content
 */
export function generateInvitationEmailText(params: InvitationEmailParams): string {
  const { email, token, invitedByName, expiresAt, inviteUrl } = params;
  const expiresAtFormatted = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const invitedByText = invitedByName
    ? `${invitedByName} has invited you`
    : 'You have been invited';

  return `
You've been invited to join Stride

${invitedByText} to join Stride. Click the link below to accept the invitation and create your account.

${inviteUrl}

This invitation expires on: ${expiresAtFormatted}

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
}
