import Link from "next/link";

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            Installation Guide
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Get Stride up and running in minutes with Docker Compose.
          </p>

          <div className="mt-10 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Prerequisites
              </h2>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-300">
                <li>Docker and Docker Compose installed</li>
                <li>At least 2GB of available RAM</li>
                <li>Port 3000 available (or configure a different port)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Quick Start
              </h2>
              <div className="mt-4 rounded-lg bg-gray-900 p-4 dark:bg-gray-800">
                <pre className="text-sm text-gray-100">
                  <code>{`# Clone the repository
git clone https://github.com/your-org/stride.git
cd stride

# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d

# Run database migrations
docker compose exec web pnpm --filter @stride/database prisma migrate deploy

# Access the application
open http://localhost:3000`}</code>
                </pre>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Configuration
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Edit the <code className="rounded bg-gray-100 px-1 py-0.5 text-sm dark:bg-gray-800">.env</code> file
                to configure:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-300">
                <li>Database connection settings</li>
                <li>JWT secret key</li>
                <li>OAuth credentials for GitHub/GitLab</li>
                <li>AI Gateway endpoint (optional)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Next Steps
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Once Stride is running, you'll be prompted to:
              </p>
              <ol className="mt-4 list-decimal space-y-2 pl-6 text-gray-600 dark:text-gray-300">
                <li>Create your admin account</li>
                <li>Link your first repository</li>
                <li>Create your first project</li>
              </ol>
            </section>

            <div className="pt-8">
              <Link
                href="/"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

