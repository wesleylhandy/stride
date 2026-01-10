import { redirect } from 'next/navigation';

/**
 * Documentation Index Page
 * 
 * Redirects to the configuration documentation as the default docs page.
 * This handles navigation when clicking "Documentation" in breadcrumbs or
 * accessing /docs directly.
 */
export default function DocsIndexPage() {
  redirect('/docs/configuration');
}
