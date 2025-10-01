# ProcureX – Production Deployment

This guide describes a production-ready, containerized deployment where Express serves both the API and the compiled React frontend (same-origin).

## Image overview
- Multi-stage `Dockerfile` builds:
  - Frontend (Vite) → `dist/`
  - Backend (TypeScript) → `backend/dist`
- Production image contains:
  - `dist/` (frontend bundle)
  - `backend/dist/index.js` (Express server)
- Express serves static frontend files in production and handles SPA fallback.

## Persistent data
- LowDB JSON file is configurable via `DB_FILE` env var (default `/data/db.json`).
- The compose file mounts a volume at `/data` for persistence.

## Build and run

### Using Docker Compose
```powershell
# Build and start
docker compose up -d --build

# Tail logs
docker compose logs -f procurex

# Stop
docker compose down
```

App will be available at: http://localhost:4001

### Standalone Docker
```powershell
# Build image
docker build -t procurex:latest .

# Run container
docker run -d --name procurex -p 4001:4001 \
  -e NODE_ENV=production -e PORT=4001 \
  -e JWT_SECRET=change-me \
  -e APP_ORIGIN=http://localhost:4001 \
  -v procurex-data:/data \
  procurex:latest
```

### Optional: generate self-signed TLS certs (local testing)
```bash
# macOS / Linux
bash scripts/generate-self-signed-cert.sh

# Windows (Git Bash or WSL)
bash scripts/generate-self-signed-cert.sh

# Override domain (CN/SAN) and output directory (defaults: DOMAIN=localhost, OUTPUT_DIR=nginx/certs)
DOMAIN=dev.local bash scripts/generate-self-signed-cert.sh custom-certs
```

The script outputs `fullchain.pem` and `privkey.pem` into the target directory (default `nginx/certs`).
Point `docker-compose.nginx.yml` to that directory for local HTTPS with self-signed certs.

## Database Configuration

ProcureX supports both LowDB (JSON file storage) and PostgreSQL databases with automatic detection and fallback.

### Development Mode (Default)
- Uses LowDB with JSON file storage (`backend/db.json`)
- No additional configuration required
- Suitable for development and testing

### Production Mode (PostgreSQL)
To use PostgreSQL in production, set the `DATABASE_URL` environment variable:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/procurex"
```

#### PostgreSQL Setup

1. **Install PostgreSQL** (version 12 or higher recommended)
2. **Create Database and User**:
   ```sql
   CREATE DATABASE procurex;
   CREATE USER procurex_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE procurex TO procurex_user;
   ```

3. **Set Environment Variables**:
   ```bash
   # Docker Compose
   DATABASE_URL=postgresql://procurex_user:secure_password@postgres:5432/procurex
   
   # Local Development with PostgreSQL
   DATABASE_URL=postgresql://procurex_user:secure_password@localhost:5432/procurex
   ```

#### Automatic Migration

The application automatically:
- Detects `DATABASE_URL` presence
- Creates all required tables and indexes on first run
- Falls back to LowDB if PostgreSQL connection fails
- Logs the database mode being used

#### Database Schema

PostgreSQL tables are automatically created:
- `users` - User accounts and authentication
- `items` - Inventory items with enterprise fields  
- `suppliers` - Supplier information and performance metrics
- `purchase_orders` - Purchase order management
- `item_movements` - Inventory movement tracking
- `work_orders` - Work order management
- `alerts` - System alerts and notifications
- `system_events` - Audit trail and system events

#### Migration from LowDB

To migrate existing LowDB data to PostgreSQL:

1. **Export existing data**: Backup your `db.json` file
2. **Set up PostgreSQL**: Follow setup steps above  
3. **Set DATABASE_URL**: Application will create fresh PostgreSQL schema
4. **Manual data import**: Use database tools to import JSON data if needed

*Note: Automatic LowDB-to-PostgreSQL migration is not yet implemented.*

## Environment variables
- `NODE_ENV` (production)
- `PORT` (default 4001)
- `JWT_SECRET` (required – set a strong random string)
- `APP_ORIGIN` (e.g., `https://your-domain`)
- `DATABASE_URL` (optional – PostgreSQL connection string; fallback to LowDB)
- `DB_FILE` (LowDB only – default `/data/db.json`)
- Optional OAuth / Email / SMS:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
  - `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`

## Security notes
- Cookies:
  - In production, cookies are set with `SameSite=Strict` (unless cross-origin is required) and `Secure` when behind TLS.
- CORS:
  - Same-origin deployment avoids complicated CORS configs. For cross-origin, update backend CORS origin to your frontend origin and set `SameSite=None; Secure` cookies.
- Headers:
  - Helmet is enabled. You can further tune Content Security Policy (CSP) if desired.
- Rate limiting:
  - Express rate limit is active via env `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`.

## Health checks
- `GET /health` – liveness
- `GET /ready` – readiness (after dependencies are initialized)

## Backups and data

### LowDB (Default)
- The LowDB JSON database is small and file-based. Ensure volume snapshots / backups as needed.
- Located at `/data/db.json` in containers or `backend/db.json` in development.

### PostgreSQL (Production)
- Standard PostgreSQL backup procedures apply: `pg_dump`, `pg_restore`
- Use PostgreSQL's built-in replication and backup features for production
- Consider automated backup solutions for critical data

## Upgrades
```powershell
docker compose pull && docker compose up -d --build
```

## Troubleshooting
- If you see 503 JSON responses for `/api` routes at startup, the readiness gate is blocking until init completes; retry shortly.
- If `/auth/google` or `/auth/apple` show not configured in prod, add real credentials in env or use only password/phone auth.
