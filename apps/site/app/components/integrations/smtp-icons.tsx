/**
 * SMTP Service Icons
 * 
 * SVG icons for SMTP email services: SendGrid, AWS SES, Mailgun, Gmail, Microsoft 365, and generic mail server icon
 */

export function SMTPIcons() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6 text-accent"
      aria-hidden="true"
    >
      {/* Mail/envelope icon representing SMTP */}
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
