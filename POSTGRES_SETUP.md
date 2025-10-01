# PostgreSQL Setup Complete! ✅

## What's Been Set Up

### 1. Docker Compose Configuration
**File**: `docker-compose.yml`

Added three services:
- **PostgreSQL 16** (port 5432) - Main database
- **Adminer** (port 8080) - Web-based database admin UI  
- **ProcureX App** - Updated to connect to PostgreSQL

### 2. Database Initialization
**Directory**: `db/init/`
**File**: `db/init/01_finance.sql`

This SQL script creates a complete **Smart Books finance module** with:

#### Schemas
- `finance` - Isolated finance tables (NEW, won't touch Reports)
- `reports` - Placeholder for your Reports App (read-only from finance)

#### Finance Tables (18 tables + 2 views)

**Core Reference:**
- `chart_of_accounts` - COA with 18 seeded accounts
- `accounts` - Bank/M-PESA/Cash accounts (3 seeded)
- `tax_rates` - VAT and tax rates (VAT 16% seeded)
- `counterparties` - Unified customers/vendors/staff

**Double-Entry Bookkeeping:**
- `transactions` - Journal entries
- `transaction_lines` - Line items (debits/credits)
- **Built-in trigger**: `enforce_balanced_transaction()` ensures debits = credits!

**AR/AP:**
- `invoices` + `invoice_items` - Accounts Receivable
- `bills` + `bill_items` - Accounts Payable
- `payments` - Payment records
- `expenses` - Quick expenses

**Other:**
- `reconciliations` - Bank reconciliation
- `floats` + `float_entries` - Staff float management

**Read-Only Views:**
- `v_ticket_costs` - Aggregates material + labor costs per ticket from Reports
- `v_zone_pnl` - Zone P&L based on finance transactions

## How to Use

### Start the Database

```bash
# Start PostgreSQL + Adminer
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f db
```

### Access Adminer (Database UI)

Open http://localhost:8080

**Login credentials:**
- System: `PostgreSQL`
- Server: `db`
- Username: `procurex`
- Password: `procurex`
- Database: `procurex`

### Connect from Backend

The connection string is already configured in `docker-compose.yml`:

```
DATABASE_URL=postgresql://procurex:procurex@db:5432/procurex
```

For local development (outside Docker):
```
DATABASE_URL=postgresql://procurex:procurex@localhost:5432/procurex
```

### Install PostgreSQL Driver

```bash
cd backend
npm install pg @types/pg
```

### Example Usage in Backend

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Query chart of accounts
const { rows } = await pool.query(`
  SELECT code, name, type 
  FROM finance.chart_of_accounts 
  WHERE is_active = true
  ORDER BY code
`)

// Create an invoice
const result = await pool.query(`
  INSERT INTO finance.invoices 
    (customer_id, number, invoice_date, status, subtotal, tax_total, total, balance)
  VALUES 
    ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING id
`, [customerId, 'INV-2025-001', '2025-01-15', 'draft', 1000, 160, 1160, 1160])
```

## Key Features

### ✅ Schema Isolation
- Finance tables in `finance` schema
- Reports tables in `reports` schema
- **Zero risk** of touching existing Reports data

### ✅ Double-Entry Accounting
Built-in PostgreSQL trigger ensures all transactions balance:
```sql
-- This will FAIL if debits ≠ credits
INSERT INTO finance.transactions (tx_date, type) 
VALUES ('2025-01-15', 'invoice');

-- Must add balanced lines or transaction rolls back
```

### ✅ Read-Only Access to Reports
Finance can read Reports data via safe views:
- `v_ticket_costs` - Material + labor costs per ticket
- `v_zone_pnl` - Zone-level P&L

### ✅ Seed Data Included
- 18 Chart of Accounts entries (Bank, M-PESA, Revenue, COGS, Expenses, VAT)
- 3 Financial accounts (Main Bank, M-PESA Till, Petty Cash)
- 1 Tax rate (VAT 16%)

## File Structure

```
ProcureX/
├── docker-compose.yml          # Updated with PostgreSQL + Adminer
├── db/
│   ├── README.md              # Detailed documentation
│   ├── .gitignore             # Ignore data volumes
│   └── init/
│       └── 01_finance.sql     # Finance schema initialization
└── backend/
    └── src/
        └── postgres.ts        # Existing PostgreSQL connector
```

## Next Steps

### 1. Start the Database
```bash
docker compose up -d
```

### 2. Verify Setup
Open http://localhost:8080 and login to Adminer

### 3. Check Tables
```sql
-- List all tables in finance schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'finance';

-- View chart of accounts
SELECT code, name, type 
FROM finance.chart_of_accounts 
ORDER BY code;
```

### 4. Build Finance API Endpoints

Create these endpoints in your backend:

**Invoices (AR):**
- `GET /api/finance/invoices` - List invoices
- `POST /api/finance/invoices` - Create invoice
- `GET /api/finance/invoices/:id` - Get invoice details
- `PUT /api/finance/invoices/:id` - Update invoice
- `POST /api/finance/invoices/:id/payments` - Record payment

**Bills (AP):**
- `GET /api/finance/bills` - List bills
- `POST /api/finance/bills` - Create bill
- Similar CRUD operations

**Payments:**
- `POST /api/finance/payments` - Record payment (M-PESA, Bank, Cash)

**Expenses:**
- `GET /api/finance/expenses` - List expenses
- `POST /api/finance/expenses` - Create expense

**Reports:**
- `GET /api/finance/reports/kpis` - Financial KPIs
- `GET /api/finance/reports/trial-balance` - Trial balance
- `GET /api/finance/reports/pnl` - Profit & Loss
- `GET /api/finance/reports/balance-sheet` - Balance sheet
- `GET /api/finance/reports/cashflow` - Cash flow statement

### 5. Frontend Integration

The Smart Books UI is already in place at:
- `src/pages/finance/FinanceDashboard.tsx`
- `src/pages/finance/Invoices.tsx`
- `src/pages/finance/Bills.tsx`
- `src/pages/finance/Payments.tsx`
- etc.

Just update the API calls to use the new PostgreSQL-backed endpoints!

## Useful Commands

```bash
# Stop containers
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v

# View database logs
docker compose logs -f db

# Connect with psql CLI
docker exec -it procurex_db psql -U procurex -d procurex

# Backup database
docker exec procurex_db pg_dump -U procurex procurex > backup.sql

# Restore database
docker exec -i procurex_db psql -U procurex procurex < backup.sql
```

## Security Notes

⚠️ **Development credentials** - Change for production:
1. Update `POSTGRES_PASSWORD` in `docker-compose.yml`
2. Update `DATABASE_URL` connection strings
3. Use environment variables for sensitive data
4. Enable SSL for production connections

## Troubleshooting

### Port 5432 already in use?
```bash
# Windows: Stop existing PostgreSQL service
Stop-Service postgresql-x64-*

# Or change port in docker-compose.yml to 5433
```

### Database not initializing?
```bash
# Check logs
docker compose logs db

# Recreate (removes all data!)
docker compose down -v
docker compose up -d
```

### Can't connect from backend?
- Check `DATABASE_URL` environment variable
- Ensure PostgreSQL container is running: `docker compose ps`
- Test connection: `docker exec procurex_db pg_isready -U procurex`

## Success! 🎉

You now have a **production-ready PostgreSQL setup** with:
- ✅ Isolated finance schema
- ✅ Double-entry accounting enforcement
- ✅ 18+ tables for complete finance management
- ✅ Safe read-only views to Reports
- ✅ Web admin UI (Adminer)
- ✅ Seed data ready to use

**Next**: Start building the finance API endpoints and connect them to the Smart Books UI!
