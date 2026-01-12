# Environment Variables Guide

## Where to Set Environment Variables

For Next.js applications in this monorepo, environment variables can be set in multiple locations. Next.js loads them in this order (later files override earlier ones):

1. **Root `.env`** (recommended for shared variables)
2. **Root `.env.local`** (gitignored, overrides `.env`)
3. **`apps/web/.env`** (app-specific)
4. **`apps/web/.env.local`** (gitignored, overrides `apps/web/.env`)

## Recommended Setup

### For Development

Set `JWT_SECRET` in the **root `.env` file** (project root):

```bash
# In /home/creativ/Overclock/stride/.env
JWT_SECRET=your-secure-random-secret-here-min-32-characters
```

### Why Root `.env`?

- ✅ Shared across all apps/packages in the monorepo
- ✅ Consistent with Docker Compose (which reads from root `.env`)
- ✅ Single source of truth
- ✅ Works with Turborepo

### When to Use `apps/web/.env`

Use `apps/web/.env` only if:
- You need app-specific overrides
- Deploying the app separately from the monorepo
- Working with deployment platforms that look in the app directory

## Verification

To verify `JWT_SECRET` is being loaded:

```bash
# Check if it's in your .env file
grep "^JWT_SECRET" .env

# When running the app, it should fail fast with a clear error if missing
# The error message will tell you if JWT_SECRET is not set
```

## Important Notes

1. **Restart Required**: After adding/changing environment variables, restart the Next.js dev server
2. **Gitignore**: `.env.local` files are gitignored - use them for local-only secrets
3. **Production**: Set environment variables in your deployment platform (Vercel, Docker, etc.)

## Site Metadata Configuration (apps/site)

The marketing site (`apps/site`) supports configurable metadata via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_TITLE` | Site title (used in `<title>` and OpenGraph) | `"Stride - Developer-First Flow Tracker"` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Main meta description | `"Self-hosted, open-source flow tracker that matches the speed and developer experience of Linear..."` |
| `NEXT_PUBLIC_SITE_OG_DESCRIPTION` | OpenGraph/Twitter description (can differ from main) | `"Self-hosted, open-source flow tracker with blazing fast UX and deep Git integration."` |
| `NEXT_PUBLIC_SITE_AUTHOR` | Site author name | `"Stride Team"` |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL | `"https://stride.dev"` |

**Example**:
```bash
# In root .env or apps/site/.env
NEXT_PUBLIC_SITE_TITLE="My Company - Project Tracker"
NEXT_PUBLIC_SITE_DESCRIPTION="Custom description for search engines"
NEXT_PUBLIC_SITE_OG_DESCRIPTION="Custom description for social sharing"
NEXT_PUBLIC_SITE_URL="https://mycompany.com"
```

**Note**: These can also be customized by editing `apps/site/lib/site-config.ts` directly.

## Security

⚠️ **Never commit `.env` files with real secrets to git!**

- `.env.example` - Safe to commit (with placeholder values)
- `.env.local` - Gitignored, safe for local secrets
- `.env` - May be gitignored depending on your setup
