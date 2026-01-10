import Link from "next/link";
import { CodeBlock } from "../../components/docs/CodeBlock";

export default function InstallPage() {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl dark:text-foreground-dark">
        Installation Guide
      </h1>
      <p className="mt-6 text-lg leading-8 text-foreground-secondary dark:text-foreground-dark-secondary">
        Get Stride up and running in minutes with Docker Compose.
      </p>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
            Prerequisites
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground-secondary dark:text-foreground-dark-secondary">
            <li>Docker and Docker Compose installed</li>
            <li>At least 2GB of available RAM</li>
            <li>Port 3000 available (or configure a different port)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
            Quick Start
          </h2>
          <div className="mt-4">
            <CodeBlock
              code={`# Clone the repository
git clone https://github.com/your-org/stride.git
cd stride

# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d

# Run database migrations
docker compose exec web pnpm --filter @stride/database prisma migrate deploy

# Access the application
open http://localhost:3000`}
              language="bash"
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
            Configuration
          </h2>
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            Edit the <code className="rounded bg-surface-secondary dark:bg-surface-dark-secondary px-1.5 py-0.5 text-sm font-mono border border-border dark:border-border-dark">.env</code> file
            to configure:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground-secondary dark:text-foreground-dark-secondary">
            <li>Database connection settings</li>
            <li>JWT secret key</li>
            <li>OAuth credentials for GitHub/GitLab</li>
            <li>AI Gateway endpoint (optional)</li>
          </ul>
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            For detailed configuration options, see the <Link href="/docs/configuration" className="text-accent hover:text-accent-hover dark:text-accent dark:hover:text-accent-hover underline">Configuration Documentation</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
            Next Steps
          </h2>
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            Once Stride is running, you'll be prompted to:
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-foreground-secondary dark:text-foreground-dark-secondary">
            <li>Create your admin account</li>
            <li>Link your first repository</li>
            <li>Create your first project</li>
          </ol>
        </section>
      </div>
    </>
  );
}

