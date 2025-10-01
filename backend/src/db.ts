import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import fs from 'fs'
import { DBData, User, Item, Supplier } from './types'
import { initPostgres, PostgresAdapter, closePostgres } from './postgres'

// Default database structure with enterprise fields
const defaultData: DBData = {
  users: [],
  items: [
    {
      id: 1,
      name: 'Office Printer Paper',
      sku: 'PPR-001',
      quantity: 120,
      location: 'Storage Room A',
      minStock: 20,
      maxStock: 200,
      unitPrice: 15.99,
      category: 'Office Supplies',
      supplierId: 1,
      description: 'Premium white A4 printing paper, 500 sheets per ream',
      tags: ['paper', 'office', 'printing'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Ballpoint Pens (Blue)',
      sku: 'PEN-002',
      quantity: 85,
      location: 'Storage Room A',
      minStock: 50,
      maxStock: 300,
      unitPrice: 2.49,
      category: 'Office Supplies',
      supplierId: 2,
      description: 'Blue ballpoint pens, smooth writing, pack of 12',
      tags: ['pens', 'blue', 'writing'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  suppliers: [
    {
      id: 1,
      name: 'Office World Supplies',
      contactName: 'Sarah Johnson',
      email: 'sarah@officeworld.com',
      phone: '+1-555-0123',
      address: '123 Business District, Nairobi, Kenya',
      rating: 4.2,
      onTimeDeliveryRate: 92,
      qualityScore: 4.1,
      totalOrders: 145,
      totalValue: 67890.50,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Kenya Paper Solutions',
      contactName: 'David Mwangi',
      email: 'david@kenyapaper.co.ke',
      phone: '+254-700-123456',
      address: '456 Industrial Area, Nairobi, Kenya',
      rating: 3.9,
      onTimeDeliveryRate: 88,
      qualityScore: 3.8,
      totalOrders: 89,
      totalValue: 34567.25,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  purchaseOrders: [],
  itemMovements: [],
  workOrders: [],
  alerts: [],
  systemEvents: [],
  // Smart Books - Finance & Accounting
  chartOfAccounts: [],
  accounts: [],
  transactions: [],
  transactionLines: [],
  invoices: [],
  invoiceItems: [],
  bills: [],
  billItems: [],
  payments: [],
  expenses: [],
  taxRates: [],
  reconciliations: [],
  reconciliationLines: [],
  projects: [],
  costCenters: [],
  customers: [],
  // Legacy fields for backward compatibility
  lastId: 2,
  lastSupplierId: 2,
  lastUserId: 0,
  lastPurchaseOrderId: 0,
  lastWorkOrderId: 0,
  lastAlertId: 0,
  lastSystemEventId: 0,
  lastInvoiceId: 0,
  lastBillId: 0,
  lastPaymentId: 0,
  lastExpenseId: 0,
  lastProjectId: 0,
  lastCostCenterId: 0,
  lastCustomerId: 0,
  lastAccountId: 0,
  lastTransactionId: 0,
  pendingPhoneCodes: [],
  passwordResetTokens: []
}

// Universal database interface that works with both LowDB and PostgreSQL
class DatabaseManager {
  private db: Low<DBData> | null = null
  private pgAdapter: PostgresAdapter | null = null
  private initialized: boolean = false
  private dbPath: string
  private usingPostgres: boolean = false

  constructor() {
    // Use DB_FILE environment variable or default path
    this.dbPath = process.env.DB_FILE || path.join(process.cwd(), 'db.json')
    // Detect PostgreSQL mode
    this.usingPostgres = !!process.env.DATABASE_URL
  }

  async init(): Promise<void> {
    if (this.initialized) return

    if (this.usingPostgres) {
      console.log('Initializing PostgreSQL database...')
      try {
        const pool = await initPostgres(process.env.DATABASE_URL!)
        this.pgAdapter = new PostgresAdapter(pool)
        console.log('PostgreSQL database ready')
      } catch (error) {
        console.error('PostgreSQL initialization failed, falling back to LowDB:', error)
        this.usingPostgres = false
      }
    }

    if (!this.usingPostgres) {
      console.log(`Initializing LowDB at: ${this.dbPath}`)
      
      // Ensure directory exists
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const adapter = new JSONFile<DBData>(this.dbPath)
      this.db = new Low(adapter)
      
      try {
        await this.db.read()
      } catch (err: any) {
        // If JSON is corrupted, back it up and reseed to keep service alive
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        const backup = this.dbPath.replace(/\.json$/, `.corrupt-${ts}.json`)
        try {
          if (fs.existsSync(this.dbPath)) fs.renameSync(this.dbPath, backup)
        } catch {}
        this.db.data = { ...defaultData }
        await this.writeWithRetry()
      }
      
      // If file doesn't exist or is empty, initialize with default data
      if (!this.db.data) {
        this.db.data = defaultData
        await this.writeWithRetry()
        console.log('LowDB initialized with default data')
      } else {
        // Ensure all required arrays exist (for backward compatibility)
        this.db.data.purchaseOrders = this.db.data.purchaseOrders || []
        this.db.data.itemMovements = this.db.data.itemMovements || []
        this.db.data.workOrders = this.db.data.workOrders || []
        this.db.data.alerts = this.db.data.alerts || []
        this.db.data.systemEvents = this.db.data.systemEvents || []
        this.db.data.users = this.db.data.users || []
        this.db.data.pendingPhoneCodes = this.db.data.pendingPhoneCodes || []
        this.db.data.passwordResetTokens = this.db.data.passwordResetTokens || []
        // Smart Books - Finance & Accounting
        this.db.data.chartOfAccounts = this.db.data.chartOfAccounts || []
        this.db.data.accounts = this.db.data.accounts || []
        this.db.data.transactions = this.db.data.transactions || []
        this.db.data.transactionLines = this.db.data.transactionLines || []
        this.db.data.invoices = this.db.data.invoices || []
        this.db.data.invoiceItems = this.db.data.invoiceItems || []
        this.db.data.bills = this.db.data.bills || []
        this.db.data.billItems = this.db.data.billItems || []
        this.db.data.payments = this.db.data.payments || []
        this.db.data.expenses = this.db.data.expenses || []
        this.db.data.taxRates = this.db.data.taxRates || []
        this.db.data.reconciliations = this.db.data.reconciliations || []
        this.db.data.reconciliationLines = this.db.data.reconciliationLines || []
        this.db.data.projects = this.db.data.projects || []
        this.db.data.costCenters = this.db.data.costCenters || []
        this.db.data.customers = this.db.data.customers || []
        
        // Migrate legacy fields to enterprise
        let changed = false
        this.db.data.items.forEach(item => {
          if (!item.supplierId) { item.supplierId = 1; changed = true }
          if (!item.description) { item.description = ''; changed = true }
          if (!item.tags) { item.tags = []; changed = true }
          if (item.isActive === undefined) { item.isActive = true; changed = true }
          if (!item.createdAt) { item.createdAt = new Date().toISOString(); changed = true }
          if (!item.updatedAt) { item.updatedAt = new Date().toISOString(); changed = true }
        })
        
        this.db.data.suppliers.forEach(supplier => {
          if (supplier.rating === undefined) { supplier.rating = 4.0; changed = true }
          if (!supplier.onTimeDeliveryRate) { supplier.onTimeDeliveryRate = 90; changed = true }
          if (supplier.qualityScore === undefined) { supplier.qualityScore = 4.0; changed = true }
          if (!supplier.totalOrders) { supplier.totalOrders = 0; changed = true }
          if (supplier.totalValue === undefined) { supplier.totalValue = 0; changed = true }
          if (supplier.isActive === undefined) { supplier.isActive = true; changed = true }
          if (!supplier.createdAt) { supplier.createdAt = new Date().toISOString(); changed = true }
          if (!supplier.updatedAt) { supplier.updatedAt = new Date().toISOString(); changed = true }
        })
        
        if (changed) {
          await this.writeWithRetry()
        }
      }
      console.log('LowDB database ready')
    }
    
    this.initialized = true
  }

  async read(): Promise<DBData> {
    await this.init()
    
    if (this.usingPostgres && this.pgAdapter) {
      // Aggregate data from PostgreSQL tables
      const [users, items, suppliers] = await Promise.all([
        this.pgAdapter.getUsers(),
        this.pgAdapter.getItems(),
        this.pgAdapter.getSuppliers()
      ])
      
      return {
        users,
        items,
        suppliers,
        purchaseOrders: [], // TODO: Implement PG queries
        itemMovements: [],
        workOrders: [],
        alerts: [],
        systemEvents: [],
        // Smart Books - Finance & Accounting (TODO: Implement PG queries)
        chartOfAccounts: [],
        accounts: [],
        transactions: [],
        transactionLines: [],
        invoices: [],
        invoiceItems: [],
        bills: [],
        billItems: [],
        payments: [],
        expenses: [],
        taxRates: [],
        reconciliations: [],
        reconciliationLines: [],
        projects: [],
        costCenters: [],
        customers: [],
        // Legacy fields for compatibility
        lastId: items.length > 0 ? Math.max(...items.map(i => i.id)) : 0,
        lastSupplierId: suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) : 0,
        lastUserId: users.length > 0 ? Math.max(...users.map(u => u.id)) : 0,
        lastPurchaseOrderId: 0,
        lastWorkOrderId: 0,
        lastAlertId: 0,
        lastSystemEventId: 0,
        lastInvoiceId: 0,
        lastBillId: 0,
        lastPaymentId: 0,
        lastExpenseId: 0,
        lastProjectId: 0,
        lastCostCenterId: 0,
        lastCustomerId: 0,
        lastAccountId: 0,
        lastTransactionId: 0,
        pendingPhoneCodes: [],
        passwordResetTokens: []
      }
    } else {
      await this.db!.read()
      return this.db!.data!
    }
  }

  async write(): Promise<void> {
    if (!this.usingPostgres) {
      await this.writeWithRetry()
    }
    // PostgreSQL writes happen immediately via adapter methods
  }

  private async writeWithRetry(maxRetries: number = 5): Promise<void> {
    if (!this.db) return
    
    let attempt = 0
    let lastErr: any
    
    while (attempt < maxRetries) {
      try {
        await this.db.write()
        return
      } catch (err: any) {
        lastErr = err
        // Only retry for common Windows file lock errors
        const msg = String(err?.message || '')
        if (err?.code === 'EPERM' || err?.code === 'EBUSY' || msg.includes('EPERM') || msg.includes('busy') || msg.includes('locked')) {
          await new Promise(r => setTimeout(r, 100 + attempt * 100))
          attempt++
          continue
        }
        throw err
      }
    }
    throw lastErr
  }

  getData(): DBData {
    if (!this.initialized) {
      throw new Error('Database not initialized')
    }
    
    if (this.usingPostgres) {
      throw new Error('Use async read() method for PostgreSQL')
    }
    
    if (!this.db?.data) {
      throw new Error('LowDB data not available')
    }
    
    return this.db.data
  }

  // Database-agnostic user operations
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    await this.init()
    
    if (this.usingPostgres && this.pgAdapter) {
      return await this.pgAdapter.createUser(userData)
    } else {
      const data = this.getData()
      const newId = Math.max(0, ...data.users.map(u => u.id)) + 1
      const user: User = { id: newId, ...userData }
      data.users.push(user)
      data.lastUserId = newId
      await this.write()
      return user
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    await this.init()
    
    if (this.usingPostgres && this.pgAdapter) {
      await this.pgAdapter.updateUser(id, updates)
    } else {
      const data = this.getData()
      const userIndex = data.users.findIndex(u => u.id === id)
      if (userIndex !== -1) {
        data.users[userIndex] = { ...data.users[userIndex], ...updates, updatedAt: new Date().toISOString() }
        await this.write()
      }
    }
  }

  async getUserById(id: number): Promise<User | null> {
    await this.init()
    
    if (this.usingPostgres && this.pgAdapter) {
      return await this.pgAdapter.getUserById(id)
    } else {
      const data = this.getData()
      return data.users.find(u => u.id === id) || null
    }
  }

  // Dashboard analytics (database-agnostic)
  async getDashboardKPIs(): Promise<any> {
    await this.init()
    
    if (this.usingPostgres && this.pgAdapter) {
      return await this.pgAdapter.getDashboardKPIs()
    } else {
      const data = this.getData()
      return {
        totalItems: data.items.filter(i => i.isActive !== false).length,
        totalValue: data.items.filter(i => i.isActive !== false).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        lowStockItems: data.items.filter(i => (i.isActive !== false) && i.quantity <= i.minStock).length,
        pendingOrders: data.purchaseOrders.filter(po => ['draft', 'pending', 'approved'].includes(po.status)).length,
        activeSuppliers: data.suppliers.filter(s => s.isActive !== false).length,
        monthlySpend: 27905,
        averageDeliveryTime: 5.2,
        stockTurnover: 2.1
      }
    }
  }

  isUsingPostgres(): boolean {
    return this.usingPostgres
  }

  async cleanup(): Promise<void> {
    if (this.usingPostgres) {
      await closePostgres()
    }
  }
}

export const dbManager = new DatabaseManager()

// Legacy export for backward compatibility
export default { 
  async read() { return dbManager.read() },
  async write() { return dbManager.write() },
  get data() { return dbManager.getData() }
}

// Convenience methods (database-agnostic)
export async function getUsers(): Promise<User[]> {
  const data = await dbManager.read()
  return data.users
}

export async function getItems(): Promise<Item[]> {
  const data = await dbManager.read()
  return data.items
}

export async function getSuppliers(): Promise<Supplier[]> {
  const data = await dbManager.read()
  return data.suppliers
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down database connections...')
  await dbManager.cleanup()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down database connections...')
  await dbManager.cleanup()
  process.exit(0)
})
