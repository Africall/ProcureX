// Core business entities - enhanced for enterprise
export interface User {
  id: number
  provider?: string
  providerId?: string
  name?: string
  email?: string | null
  phone?: string | null
  roles?: string[]
  displayName?: string
  passwordHash?: string | null
  createdAt?: string
  updatedAt?: string
  sessionVersion?: number
  // Enterprise additions
  role: 'admin' | 'manager' | 'technician' | 'viewer'
  firstName?: string
  lastName?: string
  department?: string
  isActive: boolean
}

export interface Item {
  id: number
  name: string
  sku?: string | null
  quantity: number
  location?: string | null
  // Enterprise additions
  minStock: number
  maxStock: number
  unitPrice: number
  category: string
  supplierId?: number
  description?: string
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: number
  name: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  // Enterprise additions
  rating: number // 1-5
  onTimeDeliveryRate: number // 0-100 percentage
  qualityScore: number // 1-5
  totalOrders: number
  totalValue: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// New enterprise entities
export interface PurchaseOrder {
  id: number
  orderNumber: string
  supplierId: number
  status: 'draft' | 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled'
  orderDate: string
  expectedDeliveryDate: string
  actualDeliveryDate?: string
  totalAmount: number
  items: PurchaseOrderItem[]
  createdBy: number
  approvedBy?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderItem {
  id: number
  itemId: number
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface ItemMovement {
  id: number
  itemId: number
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  reason: string
  fromLocation?: string
  toLocation?: string
  userId: number
  referenceId?: string // PO ID, work order ID, etc.
  notes?: string
  createdAt: string
}

export interface WorkOrder {
  id: number
  orderNumber: string
  title: string
  description: string
  status: 'open' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo?: number
  requestedBy: number
  estimatedHours: number
  actualHours?: number
  itemsUsed: WorkOrderItem[]
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface WorkOrderItem {
  id: number
  itemId: number
  quantityUsed: number
  unitCost: number
}

export interface Alert {
  id: number
  type: 'low_stock' | 'overstock' | 'expired' | 'delivery_delay' | 'quality_issue' | 'system'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  description: string
  itemId?: number
  supplierId?: number
  orderId?: number
  isRead: boolean
  isResolved: boolean
  resolvedBy?: number
  resolvedAt?: string
  createdAt: string
}

export interface SystemEvent {
  id: number
  type: 'user_login' | 'item_created' | 'item_updated' | 'order_placed' | 'order_received' | 'stock_movement' | 'system_error'
  userId?: number
  entityId?: string
  entityType?: string
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

// Legacy auth types (keeping for compatibility)
export interface PendingPhoneCode {
  phone: string
  code: string
  expires: number
}

// Analytics and dashboard types
export interface DashboardKPI {
  totalItems: number
  totalValue: number
  lowStockItems: number
  pendingOrders: number
  activeSuppliers: number
  monthlySpend: number
  averageDeliveryTime: number
  stockTurnover: number
}

export interface StockMovementTrend {
  date: string
  inbound: number
  outbound: number
  adjustments: number
}

export interface SupplierPerformanceMetric {
  supplierId: number
  supplierName: string
  onTimeDeliveryRate: number
  qualityScore: number
  totalOrders: number
  totalValue: number
  averageDeliveryDays: number
  lastOrderDate: string
}

export interface PredictiveInsight {
  id: number
  type: 'stock_forecast' | 'demand_prediction' | 'supplier_risk' | 'cost_optimization'
  title: string
  description: string
  confidence: number // 0-100 percentage
  impact: 'low' | 'medium' | 'high'
  actionRequired: boolean
  recommendedActions: string[]
  dataPoints: any[]
  createdAt: string
}

// ==================== SMART BOOKS - FINANCE & ACCOUNTING ====================

// Chart of Accounts
export interface ChartOfAccount {
  id: number
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  parentId?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Financial Accounts (Bank, M-PESA, Cash)
export interface Account {
  id: number
  name: string
  type: 'bank' | 'mpesa' | 'cash' | 'card'
  currency: string
  accountNumber?: string
  openingBalance: number
  currentBalance: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Double-entry Transaction (Journal Entry)
export interface Transaction {
  id: number
  date: string
  type: 'invoice' | 'bill' | 'payment' | 'expense' | 'transfer' | 'journal'
  reference: string
  memo?: string
  projectId?: number
  costCenterId?: number
  createdBy: number
  isPosted: boolean
  createdAt: string
  updatedAt: string
}

// Transaction Lines (DR/CR entries)
export interface TransactionLine {
  id: number
  transactionId: number
  accountId: number
  itemId?: number
  description?: string
  quantity?: number
  unitPrice?: number
  taxRateId?: number
  debit: number
  credit: number
  createdAt: string
}

// Invoices (Accounts Receivable)
export interface Invoice {
  id: number
  customerId: number
  customerName: string
  number: string
  date: string
  dueDate: string
  status: 'draft' | 'sent' | 'part_paid' | 'paid' | 'overdue' | 'cancelled'
  subtotal: number
  taxTotal: number
  total: number
  balance: number
  notes?: string
  paymentTerms?: string
  transactionId?: number
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  id: number
  invoiceId: number
  itemId?: number
  description: string
  quantity: number
  unitPrice: number
  taxRateId?: number
  lineTotal: number
  createdAt: string
}

// Bills (Accounts Payable)
export interface Bill {
  id: number
  vendorId: number
  vendorName: string
  number: string
  billDate: string
  dueDate: string
  status: 'draft' | 'awaiting_approval' | 'approved' | 'part_paid' | 'paid' | 'overdue' | 'cancelled'
  subtotal: number
  taxTotal: number
  total: number
  balance: number
  notes?: string
  poId?: number // Link to Purchase Order
  grnId?: number // Link to Goods Receipt Note
  transactionId?: number
  approvedBy?: number
  approvedAt?: string
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface BillItem {
  id: number
  billId: number
  itemId?: number
  description: string
  quantity: number
  unitPrice: number
  taxRateId?: number
  lineTotal: number
  createdAt: string
}

// Payments
export interface Payment {
  id: number
  payeeType: 'vendor' | 'customer' | 'employee' | 'other'
  payeeId?: number
  payeeName: string
  method: 'mpesa' | 'bank_transfer' | 'cash' | 'card' | 'cheque'
  amount: number
  currency: string
  reference: string
  mpesaReceiptNumber?: string
  bankReference?: string
  relatedInvoiceId?: number
  relatedBillId?: number
  accountId: number // From which account
  transactionId?: number
  notes?: string
  date: string
  createdBy: number
  createdAt: string
  updatedAt: string
}

// Expenses
export interface Expense {
  id: number
  payee: string
  categoryAccountId: number
  amount: number
  taxRateId?: number
  date: string
  description: string
  attachmentUrl?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
  projectId?: number
  costCenterId?: number
  accountId?: number // Payment account
  transactionId?: number
  submittedBy: number
  approvedBy?: number
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

// Tax Rates
export interface TaxRate {
  id: number
  name: string
  ratePercent: number
  isWithholding: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Bank Reconciliation
export interface Reconciliation {
  id: number
  accountId: number
  statementName: string
  startDate: string
  endDate: string
  openingBalance: number
  closingBalance: number
  status: 'in_progress' | 'completed'
  reconciledBy?: number
  reconciledAt?: string
  createdAt: string
  updatedAt: string
}

export interface ReconciliationLine {
  id: number
  reconciliationId: number
  transactionId?: number
  statementDate: string
  statementDescription: string
  statementAmount: number
  isMatched: boolean
  matchedAt?: string
  createdAt: string
}

// Projects & Cost Centers
export interface Project {
  id: number
  code: string
  name: string
  description?: string
  budget?: number
  status: 'active' | 'completed' | 'on_hold'
  startDate: string
  endDate?: string
  managerId?: number
  createdAt: string
  updatedAt: string
}

export interface CostCenter {
  id: number
  code: string
  name: string
  description?: string
  managerId?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Customers (for invoicing)
export interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  paymentTerms?: string
  creditLimit?: number
  balance: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Finance Settings
export interface FinanceSettings {
  id: number
  companyName: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyLogo?: string
  baseCurrency: string
  fiscalYearStart: string // MM-DD format
  invoiceNumberFormat: string // e.g., "INV-{FY}-{SEQ}"
  billNumberFormat: string
  paymentNumberFormat: string
  defaultPaymentTerms: string
  defaultTaxRateId?: number
  mpesaConsumerKey?: string
  mpesaConsumerSecret?: string
  mpesaShortcode?: string
  mpesaPasskey?: string
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  updatedAt: string
}

// Enhanced database structure
export interface DBData {
  // Core entities
  items: Item[]
  suppliers: Supplier[]
  users: User[]
  
  // Enterprise entities
  purchaseOrders: PurchaseOrder[]
  itemMovements: ItemMovement[]
  workOrders: WorkOrder[]
  alerts: Alert[]
  systemEvents: SystemEvent[]
  
  // Smart Books - Finance & Accounting
  chartOfAccounts: ChartOfAccount[]
  accounts: Account[]
  transactions: Transaction[]
  transactionLines: TransactionLine[]
  invoices: Invoice[]
  invoiceItems: InvoiceItem[]
  bills: Bill[]
  billItems: BillItem[]
  payments: Payment[]
  expenses: Expense[]
  taxRates: TaxRate[]
  reconciliations: Reconciliation[]
  reconciliationLines: ReconciliationLine[]
  projects: Project[]
  costCenters: CostCenter[]
  customers: Customer[]
  financeSettings?: FinanceSettings
  
  // Legacy auth
  pendingPhoneCodes?: PendingPhoneCode[]
  passwordResetTokens?: { tokenHash: string; userId: number; expires: number }[]
  
  // ID counters
  lastId: number
  lastSupplierId?: number
  lastUserId?: number
  lastPurchaseOrderId?: number
  lastWorkOrderId?: number
  lastAlertId?: number
  lastSystemEventId?: number
  lastInvoiceId?: number
  lastBillId?: number
  lastPaymentId?: number
  lastExpenseId?: number
  lastProjectId?: number
  lastCostCenterId?: number
  lastCustomerId?: number
  lastAccountId?: number
  lastTransactionId?: number
}

export {}