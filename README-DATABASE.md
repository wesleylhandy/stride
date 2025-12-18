# Stride Database Setup

This guide explains how to run a local PostgreSQL database for Stride development using Docker.

## Quick Start

### 1. Start the Database

```bash
# Option 1: Use the helper script
./scripts/db-start.sh

# Option 2: Use Docker Compose directly
docker compose up -d stride-postgres
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The `.env` file should contain:

```env
DATABASE_URL=postgresql://stride:stride_dev_password@localhost:5433/stride
```

### 3. Run Migrations

```bash
pnpm --filter @stride/database db:migrate
```

## Database Configuration

The Docker setup uses:

- **Port**: `5433` (to avoid conflicts with other PostgreSQL instances on port 5432)
- **Container Name**: `stride-postgres` (isolated from other containers)
- **Database**: `stride`
- **User**: `stride`
- **Password**: `stride_dev_password`
- **Image**: `postgres:16-alpine`

## Connection Details

```
Host: localhost
Port: 5433
Database: stride
User: stride
Password: stride_dev_password
```

**Connection String:**
```
postgresql://stride:stride_dev_password@localhost:5433/stride
```

## Useful Commands

### Start Database
```bash
./scripts/db-start.sh
# or
docker compose up -d stride-postgres
```

### Stop Database
```bash
./scripts/db-stop.sh
# or
docker compose stop stride-postgres
```

### View Logs
```bash
docker compose logs -f stride-postgres
```

### Access Database Shell
```bash
docker compose exec stride-postgres psql -U stride -d stride
```

### Reset Database (⚠️ Deletes all data!)
```bash
./scripts/db-reset.sh
# or
docker compose down -v stride-postgres
docker compose up -d stride-postgres
```

### Check Database Status
```bash
docker compose ps stride-postgres
```

### Remove Database (keeps data volume)
```bash
docker compose down stride-postgres
```

### Remove Database and Data (⚠️ Deletes all data!)
```bash
docker compose down -v stride-postgres
```

## Data Persistence

Data is stored in a Docker volume named `stride-postgres-data`. This means:

- Data persists even if you stop the container
- Data persists even if you remove the container (without `-v` flag)
- To completely remove data, use `docker compose down -v`

## Troubleshooting

### Port Already in Use

If port 5433 is already in use, you can change it in `docker-compose.yml`:

```yaml
ports:
  - "5434:5432"  # Change 5433 to 5434 or any other available port
```

Then update your `.env` file accordingly.

### Container Name Conflict

If you have a container named `stride-postgres` already, you can either:

1. Remove the existing container: `docker rm stride-postgres`
2. Change the container name in `docker-compose.yml`

### Connection Refused

If you get connection refused errors:

1. Check if the container is running: `docker compose ps stride-postgres`
2. Check the logs: `docker compose logs stride-postgres`
3. Verify the port mapping: `docker compose ps` should show `0.0.0.0:5433->5432/tcp`

### Reset Database Schema

To reset the database schema and run migrations again:

```bash
# Option 1: Use the reset script
./scripts/db-reset.sh

# Option 2: Manual reset
docker compose down -v stride-postgres
docker compose up -d stride-postgres
pnpm --filter @stride/database db:migrate
```

## Integration with Other Tools

### Prisma Studio

Access Prisma Studio with:

```bash
cd packages/database
pnpm db:studio
```

This will open a web interface at `http://localhost:5555` to browse and edit data.

### Direct psql Access

```bash
docker compose exec stride-postgres psql -U stride -d stride
```

Or from your host machine (if you have psql installed):

```bash
psql -h localhost -p 5433 -U stride -d stride
```

## Production Considerations

⚠️ **This setup is for development only!**

For production:
- Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
- Use strong passwords
- Enable SSL/TLS connections
- Configure proper backup strategies
- Use connection pooling
- Set up monitoring and alerts

