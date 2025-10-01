import express from 'express';
import { query, transaction } from './financeDb';

const router = express.Router();

// ============================================================================
// CHART OF ACCOUNTS
// ============================================================================
router.get('/chart-of-accounts', async (_req, res) => {
  try {
    const result = await query(`
      SELECT id, code, name, type, parent_id, is_active, created_at, updated_at
      FROM finance.chart_of_accounts
      WHERE is_active = true
      ORDER BY code
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// FINANCIAL ACCOUNTS (Bank, M-PESA, Cash)
// ============================================================================
router.get('/accounts', async (_req, res) => {
  try {
    const result = await query(`
      SELECT 
        a.id, a.name, a.kind, a.currency, a.opening_balance,
        a.is_active, a.created_at, a.updated_at,
        c.code as coa_code, c.name as coa_name
      FROM finance.accounts a
      JOIN finance.chart_of_accounts c ON c.id = a.coa_id
      WHERE a.is_active = true
      ORDER BY a.created_at
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TAX RATES
// ============================================================================
router.get('/tax-rates', async (_req, res) => {
  try {
    const result = await query(`
      SELECT id, name, rate_percent, is_withholding, created_at, updated_at
      FROM finance.tax_rates
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// COUNTERPARTIES (Customers/Vendors)
// ============================================================================
router.get('/counterparties', async (req, res) => {
  try {
    const { type } = req.query;
    let sql = `
      SELECT id, name, type, email, phone, address, tax_id, is_active, created_at, updated_at
      FROM finance.counterparties
      WHERE is_active = true
    `;
    const params: any[] = [];
    if (type && ['customer', 'vendor', 'staff'].includes(type as string)) {
      sql += ' AND type = $1';
      params.push(type);
    }
    sql += ' ORDER BY name';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/counterparties', async (req, res) => {
  try {
    const { name, type, email, phone, address, tax_id } = req.body;
    const result = await query(`
      INSERT INTO finance.counterparties (name, type, email, phone, address, tax_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, type, email || null, phone || null, address || null, tax_id || null]);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INVOICES (Accounts Receivable)
// ============================================================================
router.get('/invoices', async (req, res) => {
  try {
    const { status, customer_id } = req.query;
    let sql = `
      SELECT 
        i.id, i.customer_id, i.number, i.invoice_date, i.due_date,
        i.status, i.subtotal, i.tax_total, i.discount_total, i.total, i.balance,
        i.memo, i.created_at, i.updated_at,
        cp.name as customer_name, cp.email as customer_email
      FROM finance.invoices i
      LEFT JOIN finance.counterparties cp ON cp.id = i.customer_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    if (status) {
      sql += ` AND i.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (customer_id) {
      sql += ` AND i.customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }
    
    sql += ' ORDER BY i.invoice_date DESC, i.created_at DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceResult = await query(`
      SELECT 
        i.id, i.customer_id, i.number, i.invoice_date, i.due_date,
        i.status, i.subtotal, i.tax_total, i.discount_total, i.total, i.balance,
        i.memo, i.created_at, i.updated_at,
        cp.name as customer_name, cp.email as customer_email, cp.phone as customer_phone,
        cp.address as customer_address
      FROM finance.invoices i
      LEFT JOIN finance.counterparties cp ON cp.id = i.customer_id
      WHERE i.id = $1
    `, [id]);
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const itemsResult = await query(`
      SELECT 
        id, item_description, quantity, unit_price, tax_rate_id, discount, total
      FROM finance.invoice_items
      WHERE invoice_id = $1
      ORDER BY id
    `, [id]);
    
    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;
    
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    const { customer_id, number, invoice_date, due_date, items, memo } = req.body;
    
    const result = await transaction(async (client) => {
      // Calculate totals
      let subtotal = 0;
      let tax_total = 0;
      let discount_total = 0;
      
      for (const item of items) {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemDiscount = item.discount || 0;
        const itemTax = item.tax_amount || 0;
        
        subtotal += itemSubtotal;
        discount_total += itemDiscount;
        tax_total += itemTax;
      }
      
      const total = subtotal - discount_total + tax_total;
      
      // Insert invoice
      const invoiceResult = await client.query(`
        INSERT INTO finance.invoices 
          (customer_id, number, invoice_date, due_date, status, subtotal, tax_total, discount_total, total, balance, memo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [customer_id, number, invoice_date, due_date, 'draft', subtotal, tax_total, discount_total, total, total, memo || null]);
      
      const invoice = invoiceResult.rows[0];
      
      // Insert invoice items
      for (const item of items) {
        const itemTotal = (item.quantity * item.unit_price) - (item.discount || 0) + (item.tax_amount || 0);
        await client.query(`
          INSERT INTO finance.invoice_items 
            (invoice_id, item_description, quantity, unit_price, tax_rate_id, discount, total)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [invoice.id, item.description, item.quantity, item.unit_price, item.tax_rate_id || null, item.discount || 0, itemTotal]);
      }
      
      return invoice;
    });
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, memo } = req.body;
    
    const result = await query(`
      UPDATE finance.invoices
      SET status = COALESCE($2, status),
          memo = COALESCE($3, memo),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `, [id, status, memo]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/invoices/:id/record-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date, account_id, reference, memo } = req.body;
    
    const result = await transaction(async (client) => {
      // Get invoice
      const invoiceResult = await client.query('SELECT * FROM finance.invoices WHERE id = $1', [id]);
      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      const invoice = invoiceResult.rows[0];
      
      if (amount > invoice.balance) {
        throw new Error('Payment amount exceeds balance');
      }
      
      // Create payment
      const paymentResult = await client.query(`
        INSERT INTO finance.payments 
          (payment_date, amount, account_id, counterparty_id, reference, memo, type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [payment_date, amount, account_id, invoice.customer_id, reference || invoice.number, memo || `Payment for ${invoice.number}`, 'receipt']);
      
      // Update invoice balance
      const newBalance = invoice.balance - amount;
      const newStatus = newBalance === 0 ? 'paid' : 'partial';
      
      await client.query(`
        UPDATE finance.invoices
        SET balance = $2, status = $3, updated_at = now()
        WHERE id = $1
      `, [id, newBalance, newStatus]);
      
      return paymentResult.rows[0];
    });
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BILLS (Accounts Payable)
// ============================================================================
router.get('/bills', async (req, res) => {
  try {
    const { status, vendor_id } = req.query;
    let sql = `
      SELECT 
        b.id, b.vendor_id, b.number, b.bill_date, b.due_date,
        b.status, b.subtotal, b.tax_total, b.discount_total, b.total, b.balance,
        b.memo, b.created_at, b.updated_at,
        cp.name as vendor_name, cp.email as vendor_email
      FROM finance.bills b
      LEFT JOIN finance.counterparties cp ON cp.id = b.vendor_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    if (status) {
      sql += ` AND b.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (vendor_id) {
      sql += ` AND b.vendor_id = $${paramCount}`;
      params.push(vendor_id);
      paramCount++;
    }
    
    sql += ' ORDER BY b.bill_date DESC, b.created_at DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const billResult = await query(`
      SELECT 
        b.id, b.vendor_id, b.number, b.bill_date, b.due_date,
        b.status, b.subtotal, b.tax_total, b.discount_total, b.total, b.balance,
        b.memo, b.created_at, b.updated_at,
        cp.name as vendor_name, cp.email as vendor_email, cp.phone as vendor_phone,
        cp.address as vendor_address
      FROM finance.bills b
      LEFT JOIN finance.counterparties cp ON cp.id = b.vendor_id
      WHERE b.id = $1
    `, [id]);
    
    if (billResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    const itemsResult = await query(`
      SELECT 
        id, item_description, quantity, unit_price, tax_rate_id, discount, total
      FROM finance.bill_items
      WHERE bill_id = $1
      ORDER BY id
    `, [id]);
    
    const bill = billResult.rows[0];
    bill.items = itemsResult.rows;
    
    res.json(bill);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bills', async (req, res) => {
  try {
    const { vendor_id, number, bill_date, due_date, items, memo } = req.body;
    
    const result = await transaction(async (client) => {
      // Calculate totals
      let subtotal = 0;
      let tax_total = 0;
      let discount_total = 0;
      
      for (const item of items) {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemDiscount = item.discount || 0;
        const itemTax = item.tax_amount || 0;
        
        subtotal += itemSubtotal;
        discount_total += itemDiscount;
        tax_total += itemTax;
      }
      
      const total = subtotal - discount_total + tax_total;
      
      // Insert bill
      const billResult = await client.query(`
        INSERT INTO finance.bills 
          (vendor_id, number, bill_date, due_date, status, subtotal, tax_total, discount_total, total, balance, memo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [vendor_id, number, bill_date, due_date, 'draft', subtotal, tax_total, discount_total, total, total, memo || null]);
      
      const bill = billResult.rows[0];
      
      // Insert bill items
      for (const item of items) {
        const itemTotal = (item.quantity * item.unit_price) - (item.discount || 0) + (item.tax_amount || 0);
        await client.query(`
          INSERT INTO finance.bill_items 
            (bill_id, item_description, quantity, unit_price, tax_rate_id, discount, total)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [bill.id, item.description, item.quantity, item.unit_price, item.tax_rate_id || null, item.discount || 0, itemTotal]);
      }
      
      return bill;
    });
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bills/:id/record-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date, account_id, reference, memo } = req.body;
    
    const result = await transaction(async (client) => {
      // Get bill
      const billResult = await client.query('SELECT * FROM finance.bills WHERE id = $1', [id]);
      if (billResult.rows.length === 0) {
        throw new Error('Bill not found');
      }
      const bill = billResult.rows[0];
      
      if (amount > bill.balance) {
        throw new Error('Payment amount exceeds balance');
      }
      
      // Create payment
      const paymentResult = await client.query(`
        INSERT INTO finance.payments 
          (payment_date, amount, account_id, counterparty_id, reference, memo, type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [payment_date, amount, account_id, bill.vendor_id, reference || bill.number, memo || `Payment for ${bill.number}`, 'disbursement']);
      
      // Update bill balance
      const newBalance = bill.balance - amount;
      const newStatus = newBalance === 0 ? 'paid' : 'partial';
      
      await client.query(`
        UPDATE finance.bills
        SET balance = $2, status = $3, updated_at = now()
        WHERE id = $1
      `, [id, newBalance, newStatus]);
      
      return paymentResult.rows[0];
    });
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PAYMENTS
// ============================================================================
router.get('/payments', async (req, res) => {
  try {
    const { type, account_id } = req.query;
    let sql = `
      SELECT 
        p.id, p.payment_date, p.amount, p.account_id, p.counterparty_id,
        p.reference, p.memo, p.type, p.created_at, p.updated_at,
        a.name as account_name,
        cp.name as counterparty_name
      FROM finance.payments p
      LEFT JOIN finance.accounts a ON a.id = p.account_id
      LEFT JOIN finance.counterparties cp ON cp.id = p.counterparty_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    if (type) {
      sql += ` AND p.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    if (account_id) {
      sql += ` AND p.account_id = $${paramCount}`;
      params.push(account_id);
      paramCount++;
    }
    
    sql += ' ORDER BY p.payment_date DESC, p.created_at DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/payments', async (req, res) => {
  try {
    const { payment_date, amount, account_id, counterparty_id, reference, memo, type } = req.body;
    
    const result = await query(`
      INSERT INTO finance.payments 
        (payment_date, amount, account_id, counterparty_id, reference, memo, type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [payment_date, amount, account_id, counterparty_id || null, reference || null, memo || null, type || 'other']);
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EXPENSES
// ============================================================================
router.get('/expenses', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        e.id, e.expense_date, e.amount, e.category_coa_id,
        e.payee, e.status, e.attachment_url, e.created_at, e.updated_at,
        coa.name as category_name, coa.code as category_code
      FROM finance.expenses e
      LEFT JOIN finance.chart_of_accounts coa ON coa.id = e.category_coa_id
      ORDER BY e.expense_date DESC, e.created_at DESC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const { expense_date, amount, category_coa_id, payee, attachment_url, status = 'draft' } = req.body;
    
    const result = await query(`
      INSERT INTO finance.expenses 
        (expense_date, amount, category_coa_id, payee, attachment_url, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [expense_date, amount, category_coa_id, payee || null, attachment_url || null, status]);
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REPORTS
// ============================================================================
router.get('/reports/kpis', async (_req, res) => {
  try {
    // Total Revenue (income accounts)
    const revenueResult = await query(`
      SELECT COALESCE(SUM(tl.credit - tl.debit), 0) as total_revenue
      FROM finance.transaction_lines tl
      JOIN finance.chart_of_accounts coa ON coa.id = tl.account_id
      WHERE coa.type = 'income'
    `);
    
    // Total Expenses (expense accounts)
    const expensesResult = await query(`
      SELECT COALESCE(SUM(tl.debit - tl.credit), 0) as total_expenses
      FROM finance.transaction_lines tl
      JOIN finance.chart_of_accounts coa ON coa.id = tl.account_id
      WHERE coa.type = 'expense'
    `);
    
    // Accounts Receivable balance
    const arResult = await query(`
      SELECT COALESCE(SUM(balance), 0) as ar_balance
      FROM finance.invoices
      WHERE status IN ('sent', 'partial', 'overdue')
    `);
    
    // Accounts Payable balance
    const apResult = await query(`
      SELECT COALESCE(SUM(balance), 0) as ap_balance
      FROM finance.bills
      WHERE status IN ('sent', 'partial', 'overdue')
    `);
    
    // Cash on hand (sum of all financial accounts)
    const cashResult = await query(`
      SELECT COALESCE(SUM(opening_balance), 0) as cash_on_hand
      FROM finance.accounts
      WHERE is_active = true AND kind IN ('bank', 'mpesa', 'cash')
    `);
    
    const revenue = parseFloat(revenueResult.rows[0].total_revenue);
    const expenses = parseFloat(expensesResult.rows[0].total_expenses);
    const profit = revenue - expenses;
    
    res.json({
      revenue,
      expenses,
      profit,
      accounts_receivable: parseFloat(arResult.rows[0].ar_balance),
      accounts_payable: parseFloat(apResult.rows[0].ap_balance),
      cash_on_hand: parseFloat(cashResult.rows[0].cash_on_hand),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/trial-balance', async (_req, res) => {
  try {
    const result = await query(`
      SELECT 
        coa.code,
        coa.name,
        coa.type,
        COALESCE(SUM(tl.debit), 0) as total_debit,
        COALESCE(SUM(tl.credit), 0) as total_credit,
        COALESCE(SUM(tl.debit - tl.credit), 0) as balance
      FROM finance.chart_of_accounts coa
      LEFT JOIN finance.transaction_lines tl ON tl.account_id = coa.id
      WHERE coa.is_active = true
      GROUP BY coa.id, coa.code, coa.name, coa.type
      ORDER BY coa.code
    `);
    
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/pnl', async (_req, res) => {
  try {
    const result = await query(`
      SELECT 
        coa.type,
        coa.name,
        COALESCE(SUM(tl.credit - tl.debit), 0) as amount
      FROM finance.chart_of_accounts coa
      LEFT JOIN finance.transaction_lines tl ON tl.account_id = coa.id
      WHERE coa.type IN ('income', 'expense', 'cogs')
      GROUP BY coa.id, coa.type, coa.name
      ORDER BY coa.type, coa.name
    `);
    
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/balance-sheet', async (_req, res) => {
  try {
    const result = await query(`
      SELECT 
        coa.type,
        coa.name,
        COALESCE(SUM(tl.debit - tl.credit), 0) as amount
      FROM finance.chart_of_accounts coa
      LEFT JOIN finance.transaction_lines tl ON tl.account_id = coa.id
      WHERE coa.type IN ('asset', 'liability', 'equity')
      GROUP BY coa.id, coa.type, coa.name
      ORDER BY coa.type, coa.name
    `);
    
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
