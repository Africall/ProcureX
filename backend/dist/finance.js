"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("./db");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// ==================== VALIDATION HELPERS ====================
function validateRequest(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return false;
    }
    return true;
}
// ==================== CHART OF ACCOUNTS ====================
// Get Chart of Accounts
router.get('/chart-of-accounts', async (req, res) => {
    const data = await db_1.dbManager.read();
    res.json(data.chartOfAccounts || []);
});
// Create Account Code
router.post('/chart-of-accounts', (0, express_validator_1.body)('code').isLength({ min: 1 }), (0, express_validator_1.body)('name').isLength({ min: 1 }), (0, express_validator_1.body)('type').isIn(['asset', 'liability', 'equity', 'revenue', 'expense']), async (req, res) => {
    if (!validateRequest(req, res))
        return;
    const data = await db_1.dbManager.read();
    const accounts = data.chartOfAccounts || [];
    const newId = Math.max(0, ...accounts.map(a => a.id)) + 1;
    const account = {
        id: newId,
        code: req.body.code,
        name: req.body.name,
        type: req.body.type,
        parentId: req.body.parentId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    accounts.push(account);
    data.chartOfAccounts = accounts;
    await db_1.dbManager.write();
    res.status(201).json(account);
});
// ==================== ACCOUNTS (BANK/MPESA/CASH) ====================
// Get all accounts
router.get('/accounts', async (req, res) => {
    const data = await db_1.dbManager.read();
    res.json(data.accounts || []);
});
// Create account
router.post('/accounts', (0, express_validator_1.body)('name').isLength({ min: 1 }), (0, express_validator_1.body)('type').isIn(['bank', 'mpesa', 'cash', 'card']), (0, express_validator_1.body)('currency').isLength({ min: 3, max: 3 }), async (req, res) => {
    if (!validateRequest(req, res))
        return;
    const data = await db_1.dbManager.read();
    const accounts = data.accounts || [];
    const newId = Math.max(0, ...accounts.map(a => a.id), data.lastAccountId || 0) + 1;
    const account = {
        id: newId,
        name: req.body.name,
        type: req.body.type,
        currency: req.body.currency,
        accountNumber: req.body.accountNumber,
        openingBalance: req.body.openingBalance || 0,
        currentBalance: req.body.openingBalance || 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    accounts.push(account);
    data.accounts = accounts;
    data.lastAccountId = newId;
    await db_1.dbManager.write();
    res.status(201).json(account);
});
// Update account balance (used internally by transactions)
async function updateAccountBalance(accountId, amount, isDebit) {
    const data = await db_1.dbManager.read();
    const account = data.accounts?.find(a => a.id === accountId);
    if (account) {
        account.currentBalance += isDebit ? -amount : amount;
        account.updatedAt = new Date().toISOString();
        await db_1.dbManager.write();
    }
}
// ==================== CUSTOMERS ====================
// Get all customers
router.get('/customers', async (req, res) => {
    const data = await db_1.dbManager.read();
    res.json(data.customers || []);
});
// Create customer
router.post('/customers', (0, express_validator_1.body)('name').isLength({ min: 1 }), async (req, res) => {
    if (!validateRequest(req, res))
        return;
    const data = await db_1.dbManager.read();
    const customers = data.customers || [];
    const newId = Math.max(0, ...customers.map(c => c.id), data.lastCustomerId || 0) + 1;
    const customer = {
        id: newId,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        taxId: req.body.taxId,
        paymentTerms: req.body.paymentTerms || 'Net 30',
        creditLimit: req.body.creditLimit || 0,
        balance: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    customers.push(customer);
    data.customers = customers;
    data.lastCustomerId = newId;
    await db_1.dbManager.write();
    res.status(201).json(customer);
});
// ==================== INVOICES (AR) ====================
// Get all invoices
router.get('/invoices', async (req, res) => {
    const data = await db_1.dbManager.read();
    const invoices = data.invoices || [];
    // Include items for each invoice
    const invoicesWithItems = invoices.map(inv => ({
        ...inv,
        items: (data.invoiceItems || []).filter(item => item.invoiceId === inv.id)
    }));
    res.json(invoicesWithItems);
});
// Get single invoice
router.get('/invoices/:id', async (req, res) => {
    if (!req.params?.id) {
        return res.status(400).json({ error: 'Invoice id is required' });
    }
    const invoiceId = Number(req.params.id);
    if (Number.isNaN(invoiceId)) {
        return res.status(400).json({ error: 'Invalid invoice id' });
    }
    const data = await db_1.dbManager.read();
    const invoice = data.invoices?.find(i => i.id === invoiceId);
    if (!invoice)
        return res.status(404).json({ error: 'Invoice not found' });
    const items = (data.invoiceItems || []).filter(item => item.invoiceId === invoice.id);
    res.json({ ...invoice, items });
});
// Create invoice
router.post('/invoices', (0, express_validator_1.body)('customerId').isInt(), (0, express_validator_1.body)('date').isISO8601(), (0, express_validator_1.body)('dueDate').isISO8601(), (0, express_validator_1.body)('items').isArray({ min: 1 }), async (req, res) => {
    if (!validateRequest(req, res))
        return;
    const data = await db_1.dbManager.read();
    const customer = data.customers?.find(c => c.id === req.body.customerId);
    if (!customer)
        return res.status(404).json({ error: 'Customer not found' });
    const invoices = data.invoices || [];
    const invoiceItems = data.invoiceItems || [];
    const newId = Math.max(0, ...invoices.map(i => i.id), data.lastInvoiceId || 0) + 1;
    // Generate invoice number
    const fiscalYear = new Date().getFullYear().toString().slice(-2);
    const seq = String(newId).padStart(6, '0');
    const number = `INV-${fiscalYear}-${seq}`;
    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    const newInvoiceItems = req.body.items.map((item, index) => {
        const lineTotal = item.quantity * item.unitPrice;
        const taxRate = data.taxRates?.find(t => t.id === item.taxRateId);
        const lineTax = taxRate ? lineTotal * (taxRate.ratePercent / 100) : 0;
        subtotal += lineTotal;
        taxTotal += lineTax;
        return {
            id: invoiceItems.length + index + 1,
            invoiceId: newId,
            itemId: item.itemId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRateId: item.taxRateId,
            lineTotal,
            createdAt: new Date().toISOString()
        };
    });
    const total = subtotal + taxTotal;
    const invoice = {
        id: newId,
        customerId: req.body.customerId,
        customerName: customer.name,
        number,
        date: req.body.date,
        dueDate: req.body.dueDate,
        status: 'draft',
        subtotal,
        taxTotal,
        total,
        balance: total,
        notes: req.body.notes,
        paymentTerms: req.body.paymentTerms || customer.paymentTerms,
        createdBy: 1, // TODO: get from auth
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    invoices.push(invoice);
    invoiceItems.push(...newInvoiceItems);
    data.invoices = invoices;
    data.invoiceItems = invoiceItems;
    data.lastInvoiceId = newId;
    await db_1.dbManager.write();
    res.status(201).json({ ...invoice, items: newInvoiceItems });
});
// Update invoice status
router.patch('/invoices/:id/status', (0, express_validator_1.body)('status').isIn(['draft', 'sent', 'part_paid', 'paid', 'overdue', 'cancelled']), async (req, res) => {
    if (!validateRequest(req, res))
        return;
    const data = await db_1.dbManager.read();
    if (!req.params?.id) {
        return res.status(400).json({ error: 'Invoice id is required' });
    }
    const invoiceId = Number(req.params.id);
    if (Number.isNaN(invoiceId)) {
        return res.status(400).json({ error: 'Invalid invoice id' });
    }
    const invoice = data.invoices?.find(i => i.id === invoiceId);
    if (!invoice)
        return res.status(404).json({ error: 'Invoice not found' });
    invoice.status = req.body.status;
    invoice.updatedAt = new Date().toISOString();
    await db_1.dbManager.write();
    res.json(invoice);
});
// ==================== BILLS (AP) ====================
// Get all bills
router.get('/bills', async (req, res) => {
    const data = await db_1.dbManager.read();
    const bills = data.bills || [];
    const billsWithItems = bills.map(bill => ({
        ...bill,
        items: (data.billItems || []).filter(item => item.billId === bill.id)
    }));
    res.json(billsWithItems);
});
// Get single bill
router.get('/bills/:id', async (req, res) => {
    if (!req.params?.id) {
        return res.status(400).json({ error: 'Bill id is required' });
    }
    const billId = Number(req.params.id);
    if (Number.isNaN(billId)) {
        return res.status(400).json({ error: 'Invalid bill id' });
    }
    const data = await db_1.dbManager.read();
    const bill = data.bills?.find(b => b.id === billId);
    if (!bill)
        return res.status(404).json({ error: 'Bill not found' });
    const items = (data.billItems || []).filter(item => item.billId === bill.id);
    res.json({ ...bill, items });
});
// Create bill
router.post('/bills', (0, express_validator_1.body)('vendorId').isInt(), (0, express_validator_1.body)('billDate').isISO8601(), (0, express_validator_1.body)('dueDate').isISO8601(), (0, express_validator_1.body)('items').isArray({ min: 1 }), async (req, res) => {
    if (!validateRequest(req, res))
        return;
    const data = await db_1.dbManager.read();
    const vendor = data.suppliers?.find(s => s.id === req.body.vendorId);
    if (!vendor)
        return res.status(404).json({ error: 'Vendor not found' });
    const bills = data.bills || [];
    const billItems = data.billItems || [];
    const newId = Math.max(0, ...bills.map(b => b.id), data.lastBillId || 0) + 1;
    // Generate bill number
    const fiscalYear = new Date().getFullYear().toString().slice(-2);
    const seq = String(newId).padStart(6, '0');
    const number = `BILL-${fiscalYear}-${seq}`;
    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    const newBillItems = req.body.items.map((item, index) => {
        const lineTotal = item.quantity * item.unitPrice;
        const taxRate = data.taxRates?.find(t => t.id === item.taxRateId);
        const lineTax = taxRate ? lineTotal * (taxRate.ratePercent / 100) : 0;
        subtotal += lineTotal;
        taxTotal += lineTax;
        return {
            id: billItems.length + index + 1,
            billId: newId,
            itemId: item.itemId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRateId: item.taxRateId,
            lineTotal,
            createdAt: new Date().toISOString()
        };
    });
    const total = subtotal + taxTotal;
    const bill = {
        id: newId,
        vendorId: req.body.vendorId,
        vendorName: vendor.name,
        number,
        billDate: req.body.billDate,
        dueDate: req.body.dueDate,
        status: 'draft',
        subtotal,
        taxTotal,
        total,
        balance: total,
        notes: req.body.notes,
        poId: req.body.poId,
        grnId: req.body.grnId,
        createdBy: 1, // TODO: get from auth
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    bills.push(bill);
    billItems.push(...newBillItems);
    data.bills = bills;
    data.billItems = billItems;
    data.lastBillId = newId;
    await db_1.dbManager.write();
    res.status(201).json({ ...bill, items: newBillItems });
});
// Create bill from PO
router.post('/bills/from-po/:poId', async (req, res) => {
    if (!req.params?.poId) {
        return res.status(400).json({ error: 'Purchase order id is required' });
    }
    const poId = Number(req.params.poId);
    if (Number.isNaN(poId)) {
        return res.status(400).json({ error: 'Invalid purchase order id' });
    }
    const data = await db_1.dbManager.read();
    const po = data.purchaseOrders?.find(p => p.id === poId);
    if (!po)
        return res.status(404).json({ error: 'Purchase Order not found' });
    const vendor = data.suppliers?.find(s => s.id === po.supplierId);
    if (!vendor)
        return res.status(404).json({ error: 'Vendor not found' });
    const bills = data.bills || [];
    const billItems = data.billItems || [];
    const newId = Math.max(0, ...bills.map(b => b.id), data.lastBillId || 0) + 1;
    const fiscalYear = new Date().getFullYear().toString().slice(-2);
    const seq = String(newId).padStart(6, '0');
    const number = `BILL-${fiscalYear}-${seq}`;
    // Convert PO items to bill items
    const newBillItems = (po.items || []).map((poItem, index) => ({
        id: billItems.length + index + 1,
        billId: newId,
        itemId: poItem.itemId,
        description: poItem.itemName || '',
        quantity: poItem.quantity,
        unitPrice: poItem.unitPrice,
        taxRateId: undefined,
        lineTotal: poItem.quantity * poItem.unitPrice,
        createdAt: new Date().toISOString()
    }));
    const subtotal = newBillItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const bill = {
        id: newId,
        vendorId: po.supplierId,
        vendorName: vendor.name,
        number,
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        status: 'awaiting_approval',
        subtotal,
        taxTotal: 0,
        total: subtotal,
        balance: subtotal,
        poId: po.id,
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    bills.push(bill);
    billItems.push(...newBillItems);
    data.bills = bills;
    data.billItems = billItems;
    data.lastBillId = newId;
    await db_1.dbManager.write();
    res.status(201).json({ ...bill, items: newBillItems });
});
// Approve bill
router.post('/bills/:id/approve', async (req, res) => {
    if (!req.params?.id) {
        return res.status(400).json({ error: 'Bill id is required' });
    }
    const billId = Number(req.params.id);
    if (Number.isNaN(billId)) {
        return res.status(400).json({ error: 'Invalid bill id' });
    }
    const data = await db_1.dbManager.read();
    const bill = data.bills?.find(b => b.id === billId);
    if (!bill)
        return res.status(404).json({ error: 'Bill not found' });
    bill.status = 'approved';
    bill.approvedBy = 1; // TODO: get from auth
    bill.approvedAt = new Date().toISOString();
    bill.updatedAt = new Date().toISOString();
    await db_1.dbManager.write();
    res.json(bill);
});
// ==================== PAYMENTS ====================
// Get all payments
router.get('/payments', async (req, res) => {
    const data = await db_1.dbManager.read();
    res.json(data.payments || []);
});
// Record payment
router.post('/payments', (0, express_validator_1.body)('payeeType').isIn(['vendor', 'customer', 'employee', 'other']), (0, express_validator_1.body)('method').isIn(['mpesa', 'bank_transfer', 'cash', 'card', 'cheque']), (0, express_validator_1.body)('amount').isFloat({ gt: 0 }), (0, express_validator_1.body)('accountId').isInt(), async (req, res) => {
    if (!validateRequest(req, res))
        return;
    const data = await db_1.dbManager.read();
    const payments = data.payments || [];
    const newId = Math.max(0, ...payments.map(p => p.id), data.lastPaymentId || 0) + 1;
    const fiscalYear = new Date().getFullYear().toString().slice(-2);
    const seq = String(newId).padStart(6, '0');
    const reference = req.body.reference || `PAY-${fiscalYear}-${seq}`;
    const payment = {
        id: newId,
        payeeType: req.body.payeeType,
        payeeId: req.body.payeeId,
        payeeName: req.body.payeeName || '',
        method: req.body.method,
        amount: req.body.amount,
        currency: req.body.currency || 'KES',
        reference,
        mpesaReceiptNumber: req.body.mpesaReceiptNumber,
        bankReference: req.body.bankReference,
        relatedInvoiceId: req.body.relatedInvoiceId,
        relatedBillId: req.body.relatedBillId,
        accountId: req.body.accountId,
        notes: req.body.notes,
        date: req.body.date || new Date().toISOString(),
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    // Update related invoice/bill balance
    if (payment.relatedInvoiceId) {
        const invoice = data.invoices?.find(i => i.id === payment.relatedInvoiceId);
        if (invoice) {
            invoice.balance -= payment.amount;
            if (invoice.balance <= 0) {
                invoice.status = 'paid';
                invoice.balance = 0;
            }
            else if (invoice.balance < invoice.total) {
                invoice.status = 'part_paid';
            }
            invoice.updatedAt = new Date().toISOString();
        }
    }
    if (payment.relatedBillId) {
        const bill = data.bills?.find(b => b.id === payment.relatedBillId);
        if (bill) {
            bill.balance -= payment.amount;
            if (bill.balance <= 0) {
                bill.status = 'paid';
                bill.balance = 0;
            }
            else if (bill.balance < bill.total) {
                bill.status = 'part_paid';
            }
            bill.updatedAt = new Date().toISOString();
        }
    }
    // Update account balance
    await updateAccountBalance(payment.accountId, payment.amount, true);
    payments.push(payment);
    data.payments = payments;
    data.lastPaymentId = newId;
    await db_1.dbManager.write();
    res.status(201).json(payment);
});
// ==================== EXPENSES ====================
// Get all expenses
router.get('/expenses', async (req, res) => {
    const data = await db_1.dbManager.read();
    res.json(data.expenses || []);
});
// Create expense
router.post('/expenses', (0, express_validator_1.body)('payee').isLength({ min: 1 }), (0, express_validator_1.body)('categoryAccountId').isInt(), (0, express_validator_1.body)('amount').isFloat({ gt: 0 }), (0, express_validator_1.body)('date').isISO8601(), async (req, res) => {
    if (!validateRequest(req, res))
        return;
    const data = await db_1.dbManager.read();
    const expenses = data.expenses || [];
    const newId = Math.max(0, ...expenses.map(e => e.id), data.lastExpenseId || 0) + 1;
    const expense = {
        id: newId,
        payee: req.body.payee,
        categoryAccountId: req.body.categoryAccountId,
        amount: req.body.amount,
        taxRateId: req.body.taxRateId,
        date: req.body.date,
        description: req.body.description || '',
        attachmentUrl: req.body.attachmentUrl,
        status: 'draft',
        projectId: req.body.projectId,
        costCenterId: req.body.costCenterId,
        submittedBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    expenses.push(expense);
    data.expenses = expenses;
    data.lastExpenseId = newId;
    await db_1.dbManager.write();
    res.status(201).json(expense);
});
// Approve expense
router.post('/expenses/:id/approve', async (req, res) => {
    if (!req.params?.id) {
        return res.status(400).json({ error: 'Expense id is required' });
    }
    const expenseId = Number(req.params.id);
    if (Number.isNaN(expenseId)) {
        return res.status(400).json({ error: 'Invalid expense id' });
    }
    const data = await db_1.dbManager.read();
    const expense = data.expenses?.find(e => e.id === expenseId);
    if (!expense)
        return res.status(404).json({ error: 'Expense not found' });
    expense.status = 'approved';
    expense.approvedBy = 1;
    expense.approvedAt = new Date().toISOString();
    expense.updatedAt = new Date().toISOString();
    await db_1.dbManager.write();
    res.json(expense);
});
// ==================== TAX RATES ====================
// Get all tax rates
router.get('/tax-rates', async (req, res) => {
    const data = await db_1.dbManager.read();
    res.json(data.taxRates || []);
});
// Create tax rate
router.post('/tax-rates', (0, express_validator_1.body)('name').isLength({ min: 1 }), (0, express_validator_1.body)('ratePercent').isFloat({ min: 0, max: 100 }), async (req, res) => {
    if (!validateRequest(req, res))
        return;
    const data = await db_1.dbManager.read();
    const taxRates = data.taxRates || [];
    const newId = Math.max(0, ...taxRates.map(t => t.id)) + 1;
    const taxRate = {
        id: newId,
        name: req.body.name,
        ratePercent: req.body.ratePercent,
        isWithholding: req.body.isWithholding || false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    taxRates.push(taxRate);
    data.taxRates = taxRates;
    await db_1.dbManager.write();
    res.status(201).json(taxRate);
});
// ==================== REPORTS ====================
// Dashboard KPIs
router.get('/reports/kpis', async (req, res) => {
    const data = await db_1.dbManager.read();
    const invoices = data.invoices || [];
    const bills = data.bills || [];
    const payments = data.payments || [];
    const accounts = data.accounts || [];
    const totalReceivables = invoices
        .filter(i => ['sent', 'part_paid', 'overdue'].includes(i.status))
        .reduce((sum, i) => sum + i.balance, 0);
    const totalPayables = bills
        .filter(b => ['approved', 'part_paid', 'overdue'].includes(b.status))
        .reduce((sum, b) => sum + b.balance, 0);
    const totalCash = accounts
        .filter(a => a.isActive)
        .reduce((sum, a) => sum + a.currentBalance, 0);
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
    const overdueBills = bills.filter(b => b.status === 'overdue').length;
    res.json({
        totalReceivables,
        totalPayables,
        totalCash,
        overdueInvoices,
        overdueBills,
        netCashflow: totalCash + totalReceivables - totalPayables
    });
});
// Profit & Loss
router.get('/reports/profit-loss', async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await db_1.dbManager.read();
    // Simplified P&L - in production, this would query transaction_lines
    const invoices = data.invoices?.filter(i => i.status === 'paid' &&
        (!startDate || i.date >= startDate) &&
        (!endDate || i.date <= endDate)) || [];
    const bills = data.bills?.filter(b => b.status === 'paid' &&
        (!startDate || b.billDate >= startDate) &&
        (!endDate || b.billDate <= endDate)) || [];
    const expenses = data.expenses?.filter(e => e.status === 'paid' &&
        (!startDate || e.date >= startDate) &&
        (!endDate || e.date <= endDate)) || [];
    const revenue = invoices.reduce((sum, i) => sum + i.total, 0);
    const costOfGoodsSold = bills.reduce((sum, b) => sum + b.total, 0);
    const operatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = revenue - costOfGoodsSold;
    const netProfit = grossProfit - operatingExpenses;
    res.json({
        revenue,
        costOfGoodsSold,
        grossProfit,
        grossProfitMargin: revenue > 0 ? (grossProfit / revenue * 100) : 0,
        operatingExpenses,
        netProfit,
        netProfitMargin: revenue > 0 ? (netProfit / revenue * 100) : 0
    });
});
// Accounts Receivable Aging
router.get('/reports/ar-aging', async (req, res) => {
    const data = await db_1.dbManager.read();
    const invoices = data.invoices?.filter(i => i.balance > 0) || [];
    const aging = {
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        days90Plus: 0
    };
    const now = new Date();
    invoices.forEach(inv => {
        const dueDate = new Date(inv.dueDate);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue < 0)
            aging.current += inv.balance;
        else if (daysOverdue <= 30)
            aging.days30 += inv.balance;
        else if (daysOverdue <= 60)
            aging.days60 += inv.balance;
        else if (daysOverdue <= 90)
            aging.days90 += inv.balance;
        else
            aging.days90Plus += inv.balance;
    });
    res.json(aging);
});
// Accounts Payable Aging
router.get('/reports/ap-aging', async (req, res) => {
    const data = await db_1.dbManager.read();
    const bills = data.bills?.filter(b => b.balance > 0) || [];
    const aging = {
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        days90Plus: 0
    };
    const now = new Date();
    bills.forEach(bill => {
        const dueDate = new Date(bill.dueDate);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue < 0)
            aging.current += bill.balance;
        else if (daysOverdue <= 30)
            aging.days30 += bill.balance;
        else if (daysOverdue <= 60)
            aging.days60 += bill.balance;
        else if (daysOverdue <= 90)
            aging.days90 += bill.balance;
        else
            aging.days90Plus += bill.balance;
    });
    res.json(aging);
});
// ==================== SETTINGS ====================
// Get finance settings
router.get('/settings', async (req, res) => {
    const data = await db_1.dbManager.read();
    res.json(data.financeSettings || {
        companyName: 'ProcureX',
        baseCurrency: 'KES',
        fiscalYearStart: '01-01',
        invoiceNumberFormat: 'INV-{FY}-{SEQ}',
        billNumberFormat: 'BILL-{FY}-{SEQ}',
        paymentNumberFormat: 'PAY-{FY}-{SEQ}',
        defaultPaymentTerms: 'Net 30',
        updatedAt: new Date().toISOString()
    });
});
// Update finance settings
router.put('/settings', async (req, res) => {
    const data = await db_1.dbManager.read();
    data.financeSettings = {
        ...data.financeSettings,
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    await db_1.dbManager.write();
    res.json(data.financeSettings);
});
exports.default = router;
