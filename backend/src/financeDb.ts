import { Pool } from 'pg';

// Use port 5433 since we changed it in docker-compose
const connectionString = process.env.DATABASE_URL || 'postgresql://procurex:procurex@localhost:5433/procurex';

export const financePool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection and log status
financePool.on('connect', () => {
  console.log('✅ Finance DB connected');
});

financePool.on('error', (err) => {
  console.error('❌ Finance DB error:', err);
});

// Helper to run queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await financePool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Helper for transactions
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await financePool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Seed data initialization
export async function seedFinanceData() {
  try {
    // Check if already seeded
    const checkCOA = await query('SELECT COUNT(*) as count FROM finance.chart_of_accounts');
    if (parseInt(checkCOA.rows[0].count) > 0) {
      console.log('✅ Finance data already seeded');
      return;
    }

    console.log('🌱 Seeding finance data...');

    // Insert Chart of Accounts
    await query(`
      INSERT INTO finance.chart_of_accounts (code, name, type) VALUES
      ('1000', 'Bank Account', 'asset'),
      ('1010', 'M-PESA Account', 'asset'),
      ('1020', 'Petty Cash', 'asset'),
      ('1050', 'Accounts Receivable', 'asset'),
      ('1100', 'Inventory', 'asset'),
      ('1200', 'Equipment', 'asset'),
      ('1300', 'Prepaid Expenses', 'asset'),
      ('2000', 'Accounts Payable', 'liability'),
      ('2100', 'VAT Payable', 'tax'),
      ('2200', 'Accrued Expenses', 'liability'),
      ('3000', 'Retained Earnings', 'equity'),
      ('3100', 'Owner Capital', 'equity'),
      ('4000', 'Sales Revenue', 'income'),
      ('4100', 'Service Revenue', 'income'),
      ('5000', 'Cost of Goods Sold', 'cogs'),
      ('6000', 'Salaries Expense', 'expense'),
      ('6100', 'Utilities Expense', 'expense'),
      ('6200', 'Transport Expense', 'expense'),
      ('6300', 'Office Supplies', 'expense'),
      ('6400', 'Marketing Expense', 'expense')
    `);

    // Get IDs for bank, mpesa, cash accounts
    const bankCOA = await query(`SELECT id FROM finance.chart_of_accounts WHERE code = '1000'`);
    const mpesaCOA = await query(`SELECT id FROM finance.chart_of_accounts WHERE code = '1010'`);
    const cashCOA = await query(`SELECT id FROM finance.chart_of_accounts WHERE code = '1020'`);

    // Insert Financial Accounts
    await query(`
      INSERT INTO finance.accounts (name, kind, currency, opening_balance, coa_id) VALUES
      ('Main Bank Account', 'bank', 'KES', 50000.00, $1),
      ('M-PESA Till', 'mpesa', 'KES', 10000.00, $2),
      ('Petty Cash Box', 'cash', 'KES', 2000.00, $3)
    `, [bankCOA.rows[0].id, mpesaCOA.rows[0].id, cashCOA.rows[0].id]);

    // Insert Tax Rates
    await query(`
      INSERT INTO finance.tax_rates (name, rate_percent, is_withholding) VALUES
      ('VAT 16%', 16.000, false),
      ('WHT 5%', 5.000, true),
      ('WHT 10%', 10.000, true)
    `);

    console.log('✅ Finance seed data inserted');
  } catch (error) {
    console.error('❌ Failed to seed finance data:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await financePool.end();
  console.log('Finance DB pool closed');
});

process.on('SIGTERM', async () => {
  await financePool.end();
  console.log('Finance DB pool closed');
});
