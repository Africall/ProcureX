# ProcureX PostgreSQL Setup

This directory contains the PostgreSQL database initialization scripts for the ProcureX Smart Books finance module.

## Quick Start

### 1. Start PostgreSQL with Docker Compose

```bash
docker compose up -d
```

This will start:
- **PostgreSQL 16** on port `5432`
- **Adminer** (database admin UI) on port `8080`

### 2. Access Adminer

Open http://localhost:8080 in your browser and login with:
- **System**: PostgreSQL
- **Server**: `db`
- **Username**: `procurex`
- **Password**: `procurex`
- **Database**: `procurex`

## Database Structure

### Schemas

- **`finance`** - ProcureX Smart Books tables (isolated, new)
- **`reports`** - Your existing Reports App tables (not modified, read-only views)

### Key Tables in `finance` Schema

**Core Reference:**
- `chart_of_accounts` - Chart of accounts (COA)
- `accounts` - Bank/M-PESA/Cash accounts
- `tax_rates` - VAT and other tax rates
- `counterparties` - Unified customers/vendors/staff

**Double-Entry Bookkeeping:**
- `transactions` - Journal entries (balanced)
- `transaction_lines` - Transaction line items (debits/credits)

**AR/AP:**
- `invoices` + `invoice_items` - Accounts Receivable
- `bills` + `bill_items` - Accounts Payable
- `payments` - Payment records (in/out)
- `expenses` - Quick expenses (petty cash, fuel, etc.)

**Other:**
- `reconciliations` - Bank reconciliation records
- `floats` + `float_entries` - Staff float management

### Built-in Safety Features

1. **Double-Entry Enforcement**: The `enforce_balanced_transaction()` trigger ensures all transactions have balanced debits = credits
2. **Schema Isolation**: Finance tables never touch your Reports App tables
3. **Read-Only Views**: Finance can read from Reports via safe views (`v_ticket_costs`, `v_zone_pnl`)

## Seed Data

The initialization script includes:

- **Chart of Accounts** (18 accounts): Bank, M-PESA, Petty Cash, Inventory, AP, Revenue, COGS, Expenses, VAT
- **3 Financial Accounts**: Main Bank, Till (M-PESA), Petty Cash Box
- **1 Tax Rate**: VAT 16%

All seed data uses `ON CONFLICT DO NOTHING` so it's safe to re-run.

## Connection String

For your Node.js backend:

```bash
DATABASE_URL=postgresql://procurex:procurex@localhost:5432/procurex
```

When running in Docker Compose, use:

```bash
DATABASE_URL=postgresql://procurex:procurex@db:5432/procurex
```

## Useful Commands

### Stop containers
```bash
docker compose down
```

### Stop and remove volumes (fresh start)
```bash
docker compose down -v
```

### View logs
```bash
docker compose logs -f db
```

### Connect with psql
```bash
docker exec -it procurex_db psql -U procurex -d procurex
```

### Example Queries

```sql
-- View chart of accounts
SELECT code, name, type FROM finance.chart_of_accounts ORDER BY code;

-- View financial accounts
SELECT a.name, a.kind, a.currency, coa.name as account_type
FROM finance.accounts a
JOIN finance.chart_of_accounts coa ON coa.id = a.coa_id;

-- Check tax rates
SELECT name, rate_percent, is_withholding FROM finance.tax_rates;
```

## Integration with Reports App

The finance schema includes two read-only views that bridge to your Reports App:

1. **`finance.v_ticket_costs`** - Aggregates material + labor costs per ticket
2. **`finance.v_zone_pnl`** - Zone-level P&L based on finance transactions linked to tickets

**Note**: These views reference `reports.tickets`, `reports.zones`, etc. If your Reports App uses different table names, update the views in `01_finance.sql`.

## Next Steps

1. Install a PostgreSQL client library in your backend:
   ```bash
   npm install pg
   ```

2. Create a connection pool in your backend code:
   ```typescript
   import { Pool } from 'pg'
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL
   })
   ```

3. Build API endpoints for:
   - Invoices (AR)
   - Bills (AP)
   - Payments
   - Expenses
   - Reports (Trial Balance, P&L, Balance Sheet)

## Security Notes

- **Default credentials are for development only**. Change them for production:
  - Update `POSTGRES_PASSWORD` in `docker-compose.yml`
  - Update connection strings accordingly
- Use environment variables for sensitive data
- Implement row-level security (RLS) if needed for multi-tenant scenarios

## Troubleshooting

### Port 5432 already in use
If you have another PostgreSQL instance running:
```bash
# Windows: Stop the service
Stop-Service postgresql-x64-*

# Or change the port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 instead
```

### Database not initializing
Check the logs:
```bash
docker compose logs db
```

The SQL scripts in `db/init/` only run on first initialization. To re-run:
```bash
docker compose down -v  # Remove volumes
docker compose up -d    # Recreate
```
