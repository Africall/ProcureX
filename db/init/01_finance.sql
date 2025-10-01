-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;         -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- uuid_generate_v4()

-- Schemas
CREATE SCHEMA IF NOT EXISTS finance;             -- NEW: ProcureX Smart Books lives here
CREATE SCHEMA IF NOT EXISTS reports;             -- assume your Reports App already uses this; we won't change it

-- ==============
-- Core reference
-- ==============
-- Chart of Accounts (no impact to Reports)
CREATE TABLE IF NOT EXISTS finance.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','income','expense','cogs','tax')),
  parent_id UUID NULL REFERENCES finance.chart_of_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financial accounts (Bank/M-PESA/Cash/Control)
CREATE TABLE IF NOT EXISTS finance.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('bank','mpesa','cash','control','other')),
  currency TEXT NOT NULL DEFAULT 'KES',
  opening_balance NUMERIC(16,2) NOT NULL DEFAULT 0,
  coa_id UUID NOT NULL REFERENCES finance.chart_of_accounts(id) ON DELETE RESTRICT,
  meta JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tax rates
CREATE TABLE IF NOT EXISTS finance.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate_percent NUMERIC(6,3) NOT NULL DEFAULT 0,
  is_withholding BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unified counterparty (avoid touching your existing vendors/customers)
CREATE TABLE IF NOT EXISTS finance.counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('customer','vendor','staff','other')),
  display_name TEXT NOT NULL,
  external_ref TEXT,                -- optional link to existing IDs in your other apps
  email TEXT,
  phone TEXT,
  meta JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =======================
-- Double-entry bookkeeping
-- =======================
CREATE TABLE IF NOT EXISTS finance.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('invoice','bill','payment','expense','journal','transfer','reconcile')),
  reference TEXT,                   -- e.g. INV-25-0001, BILL-25-0001, or external ticket id
  memo TEXT,
  project_id UUID,                  -- optional; aligns with your Projects
  cost_center_id UUID,              -- optional; align to Department/Zone
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.transaction_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES finance.transactions(id) ON DELETE CASCADE,
  line_no INT NOT NULL,
  account_id UUID NOT NULL REFERENCES finance.chart_of_accounts(id) ON DELETE RESTRICT,
  debit NUMERIC(16,2) NOT NULL DEFAULT 0,
  credit NUMERIC(16,2) NOT NULL DEFAULT 0,
  tax_rate_id UUID NULL REFERENCES finance.tax_rates(id) ON DELETE SET NULL,
  item_id UUID,                     -- optional: reference your Inventory items (kept loose to avoid coupling)
  qty NUMERIC(16,3),
  unit_price NUMERIC(16,2),
  meta JSONB NOT NULL DEFAULT '{}'
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_txline_tx_lineno ON finance.transaction_lines(transaction_id, line_no);

-- Guardrail: ensure each transaction is balanced
CREATE OR REPLACE FUNCTION finance.enforce_balanced_transaction()
RETURNS TRIGGER AS $$
DECLARE
  s_debit NUMERIC(16,2);
  s_credit NUMERIC(16,2);
BEGIN
  SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0)
    INTO s_debit, s_credit
  FROM finance.transaction_lines
  WHERE transaction_id = NEW.id;

  IF s_debit <> s_credit THEN
    RAISE EXCEPTION 'Unbalanced transaction %: debits (%.2f) != credits (%.2f)', NEW.id, s_debit, s_credit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tx_balanced ON finance.transactions;
CREATE CONSTRAINT TRIGGER trg_tx_balanced
AFTER INSERT OR UPDATE ON finance.transactions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION finance.enforce_balanced_transaction();

-- =================
-- AR / AP primitives
-- =================
-- Invoices (AR)
CREATE TABLE IF NOT EXISTS finance.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES finance.counterparties(id) ON DELETE RESTRICT,
  number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL CHECK (status IN ('draft','sent','part_paid','paid','overdue','void')),
  subtotal NUMERIC(16,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(16,2) NOT NULL DEFAULT 0,
  total NUMERIC(16,2) NOT NULL DEFAULT 0,
  balance NUMERIC(16,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  external_ref TEXT,               -- e.g. account number eb1234 or ticket id
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES finance.invoices(id) ON DELETE CASCADE,
  item_id UUID,
  description TEXT,
  qty NUMERIC(16,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(16,2) NOT NULL DEFAULT 0,
  tax_rate_id UUID REFERENCES finance.tax_rates(id) ON DELETE SET NULL,
  line_total NUMERIC(16,2) NOT NULL DEFAULT 0
);

-- Bills (AP)
CREATE TABLE IF NOT EXISTS finance.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES finance.counterparties(id) ON DELETE RESTRICT,
  number TEXT NOT NULL,
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL CHECK (status IN ('draft','awaiting_approval','approved','part_paid','paid','overdue','void')),
  subtotal NUMERIC(16,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(16,2) NOT NULL DEFAULT 0,
  total NUMERIC(16,2) NOT NULL DEFAULT 0,
  balance NUMERIC(16,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  po_id UUID,                       -- optional: link to your POs (external)
  grn_id UUID,                      -- optional: link to your GRNs (external)
  external_ref TEXT,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bills_vendor_no ON finance.bills(vendor_id, number);

CREATE TABLE IF NOT EXISTS finance.bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES finance.bills(id) ON DELETE CASCADE,
  item_id UUID,
  description TEXT,
  qty NUMERIC(16,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(16,2) NOT NULL DEFAULT 0,
  tax_rate_id UUID REFERENCES finance.tax_rates(id) ON DELETE SET NULL,
  line_total NUMERIC(16,2) NOT NULL DEFAULT 0
);

-- Payments (in or out)
CREATE TABLE IF NOT EXISTS finance.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payee_type TEXT NOT NULL CHECK (payee_type IN ('vendor','customer','staff','other')),
  payee_id UUID REFERENCES finance.counterparties(id) ON DELETE SET NULL,
  method TEXT NOT NULL CHECK (method IN ('mpesa','bank','cash','card','other')),
  amount NUMERIC(16,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  reference TEXT,                   -- e.g. M-PESA ref
  account_id UUID REFERENCES finance.accounts(id) ON DELETE SET NULL,  -- cash/bank/mpesa ledger account
  related_invoice_id UUID REFERENCES finance.invoices(id) ON DELETE SET NULL,
  related_bill_id UUID REFERENCES finance.bills(id) ON DELETE SET NULL,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quick Expenses (petty cash, fuel, etc.)
CREATE TABLE IF NOT EXISTS finance.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payee TEXT,
  category_coa_id UUID NOT NULL REFERENCES finance.chart_of_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(16,2) NOT NULL,
  tax_rate_id UUID REFERENCES finance.tax_rates(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attachment_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft','awaiting_approval','approved','posted','void')) DEFAULT 'draft',
  project_id UUID,
  cost_center_id UUID,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reconciliations
CREATE TABLE IF NOT EXISTS finance.reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES finance.accounts(id) ON DELETE CASCADE,
  statement_name TEXT,
  start_date DATE,
  end_date DATE,
  closing_balance NUMERIC(16,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Staff Floats (optional, keeps Reports untouched)
CREATE TABLE IF NOT EXISTS finance.floats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_ref TEXT NOT NULL,          -- e.g. staff id from your app (kept as TEXT to avoid FK coupling)
  issued_amount NUMERIC(16,2) NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('issued','retired','variance'))
);

CREATE TABLE IF NOT EXISTS finance.float_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  float_id UUID NOT NULL REFERENCES finance.floats(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('issue','spend','return','variance')),
  amount NUMERIC(16,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================
-- Read-only bridges to Reports
-- ===========================
-- NOTE: We DO NOT modify reports.* tables. We only read from them.
-- If your reports tables have different names/columns, create views in `reports` to match these,
-- or adjust these views accordingly.

-- Ticket cost roll-up (materials + labor)
CREATE OR REPLACE VIEW finance.v_ticket_costs AS
SELECT
  t.id                     AS ticket_id,
  t.ticket_type,
  t.zone_id,
  t.account_no,
  COALESCE(SUM(tm.qty * COALESCE(tm.unit_cost_estimate, 0)), 0)::NUMERIC(14,2) AS materials_cost,
  COALESCE(SUM(ts.minutes) / 60.0 * COALESCE(ts.rate_per_hour, 0), 0)::NUMERIC(14,2) AS labor_cost,
  (COALESCE(SUM(tm.qty * COALESCE(tm.unit_cost_estimate,0)),0)
   + COALESCE(SUM(ts.minutes)/60.0 * COALESCE(ts.rate_per_hour,0),0))::NUMERIC(14,2) AS total_cost
FROM reports.tickets t
LEFT JOIN reports.ticket_materials tm ON tm.ticket_id = t.id
LEFT JOIN reports.timesheets ts ON ts.ticket_id = t.id
GROUP BY t.id, t.ticket_type, t.zone_id, t.account_no;

-- Zone monthly P&L view (based on finance transactions tied to ticket refs)
-- We assume you will set transactions.reference = 'TICKET#<ticket_id>' when posting from Ops.
CREATE OR REPLACE VIEW finance.v_zone_pnl AS
SELECT
  z.name                                         AS zone,
  date_trunc('month', t.closed_at)::date         AS month,
  SUM(CASE WHEN tl.account_id IN (
          SELECT id FROM finance.chart_of_accounts WHERE type = 'income'
      ) THEN tl.credit - tl.debit ELSE 0 END)    AS revenue,
  SUM(CASE WHEN tl.account_id IN (
          SELECT id FROM finance.chart_of_accounts WHERE type = 'cogs'
      ) THEN tl.debit - tl.credit ELSE 0 END)    AS cogs,
  SUM(CASE WHEN tl.account_id IN (
          SELECT id FROM finance.chart_of_accounts WHERE type = 'expense'
      ) THEN tl.debit - tl.credit ELSE 0 END)    AS opex
FROM reports.tickets t
JOIN reports.zones z ON z.id = t.zone_id
JOIN finance.transactions tr ON tr.reference = ('TICKET#' || t.id::text)
JOIN finance.transaction_lines tl ON tl.transaction_id = tr.id
WHERE t.closed_at IS NOT NULL
GROUP BY 1,2;

-- =========
-- Seed data
-- =========
-- Minimal COA for Kenya ISP context
INSERT INTO finance.chart_of_accounts (code,name,type) VALUES
 ('101','Bank',         'asset'),
 ('102','M-PESA',       'asset'),
 ('103','Petty Cash',   'asset'),
 ('120','Inventory',    'asset'),
 ('210','Accounts Payable', 'liability'),
 ('220','Accrued Payroll',  'liability'),
 ('300','Retained Earnings','equity'),
 ('400','Internet Revenue','income'),
 ('410','Installation Fees','income'),
 ('420','Service Revenue','income'),
 ('500','COGS - Materials','cogs'),
 ('610','Fuel Expense',     'expense'),
 ('611','Per Diem',         'expense'),
 ('612','Field Supplies',   'expense'),
 ('620','Internet/IX',      'expense'),
 ('699','Misc Expense',     'expense'),
 ('700','VAT Output',       'tax'),
 ('701','VAT Input',        'tax')
ON CONFLICT DO NOTHING;

-- Bank/M-PESA logical accounts mapped to COA above
INSERT INTO finance.accounts (name, kind, currency, opening_balance, coa_id)
SELECT 'Main Bank', 'bank', 'KES', 0, id FROM finance.chart_of_accounts WHERE code='101'
ON CONFLICT DO NOTHING;
INSERT INTO finance.accounts (name, kind, currency, opening_balance, coa_id)
SELECT 'Till (M-PESA)', 'mpesa', 'KES', 0, id FROM finance.chart_of_accounts WHERE code='102'
ON CONFLICT DO NOTHING;
INSERT INTO finance.accounts (name, kind, currency, opening_balance, coa_id)
SELECT 'Petty Cash Box', 'cash', 'KES', 0, id FROM finance.chart_of_accounts WHERE code='103'
ON CONFLICT DO NOTHING;

-- Default VAT 16% (editable)
INSERT INTO finance.tax_rates (name, rate_percent, is_withholding)
VALUES ('VAT 16%', 16.000, FALSE)
ON CONFLICT DO NOTHING;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_tx_type_date ON finance.transactions(type, tx_date);
CREATE INDEX IF NOT EXISTS idx_tx_ref ON finance.transactions(reference);
CREATE INDEX IF NOT EXISTS idx_inv_status_due ON finance.invoices(status, due_date);
CREATE INDEX IF NOT EXISTS idx_bill_status_due ON finance.bills(status, due_date);
