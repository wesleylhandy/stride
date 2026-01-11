/**
 * Monitoring Webhook Icons
 * 
 * SVG icon representing monitoring services (Sentry, Datadog, New Relic)
 */

export function MonitoringIcons() {
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
      {/* Activity/graph icon representing monitoring */}
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
