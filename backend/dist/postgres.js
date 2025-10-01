"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresAdapter = void 0;
exports.initPostgres = initPostgres;
exports.closePostgres = closePostgres;
const pg_1 = require("pg");
// PostgreSQL-based database layer for production
// Automatically detects DATABASE_URL and falls back to LowDB if not present
let pool = null;
async function initPostgres(connectionString) {
    pool = new pg_1.Pool({ connectionString });
    // Test connection
    try {
        await pool.query('SELECT 1');
        console.log('PostgreSQL connected successfully');
    }
    catch (error) {
        console.error('PostgreSQL connection failed:', error);
        throw error;
    }
    // Create tables if they don't exist
    await createTables();
    return pool;
}
async function createTables() {
    if (!pool)
        throw new Error('PostgreSQL not initialized');
    const createTablesSQL = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      provider VARCHAR(50),
      provider_id VARCHAR(255),
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      roles TEXT[],
      display_name VARCHAR(255),
      password_hash TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      session_version INTEGER DEFAULT 1,
      role VARCHAR(50) DEFAULT 'viewer',
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      department VARCHAR(255),
      is_active BOOLEAN DEFAULT true
    );

    -- Items table
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100),
      quantity INTEGER DEFAULT 0,
      location VARCHAR(255),
      min_stock INTEGER DEFAULT 0,
      max_stock INTEGER DEFAULT 100,
      unit_price DECIMAL(10,2) DEFAULT 0,
      category VARCHAR(100) DEFAULT 'General',
      supplier_id INTEGER REFERENCES suppliers(id),
      description TEXT,
      tags TEXT[],
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Suppliers table
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      rating DECIMAL(2,1) DEFAULT 3.0,
      on_time_delivery_rate INTEGER DEFAULT 95,
      quality_score DECIMAL(2,1) DEFAULT 3.0,
      total_orders INTEGER DEFAULT 0,
      total_value DECIMAL(12,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Purchase Orders table
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(100) UNIQUE NOT NULL,
      supplier_id INTEGER REFERENCES suppliers(id),
      status VARCHAR(50) DEFAULT 'draft',
      order_date DATE DEFAULT CURRENT_DATE,
      expected_delivery_date DATE,
      actual_delivery_date DATE,
      total_amount DECIMAL(12,2) DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      approved_by INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Purchase Order Items table
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id SERIAL PRIMARY KEY,
      purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
      item_id INTEGER REFERENCES items(id),
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
    );

    -- Item Movements table
    CREATE TABLE IF NOT EXISTS item_movements (
      id SERIAL PRIMARY KEY,
      item_id INTEGER REFERENCES items(id),
      type VARCHAR(50) NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT,
      from_location VARCHAR(255),
      to_location VARCHAR(255),
      user_id INTEGER REFERENCES users(id),
      reference_id VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Work Orders table
    CREATE TABLE IF NOT EXISTS work_orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(100) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'open',
      priority VARCHAR(50) DEFAULT 'medium',
      assigned_to INTEGER REFERENCES users(id),
      requested_by INTEGER REFERENCES users(id),
      estimated_hours DECIMAL(5,2) DEFAULT 0,
      actual_hours DECIMAL(5,2),
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Work Order Items table
    CREATE TABLE IF NOT EXISTS work_order_items (
      id SERIAL PRIMARY KEY,
      work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
      item_id INTEGER REFERENCES items(id),
      quantity_used INTEGER NOT NULL,
      unit_cost DECIMAL(10,2) DEFAULT 0
    );

    -- Alerts table
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      severity VARCHAR(50) DEFAULT 'info',
      title VARCHAR(255) NOT NULL,
      description TEXT,
      item_id INTEGER REFERENCES items(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      order_id INTEGER,
      is_read BOOLEAN DEFAULT false,
      is_resolved BOOLEAN DEFAULT false,
      resolved_by INTEGER REFERENCES users(id),
      resolved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- System Events table
    CREATE TABLE IF NOT EXISTS system_events (
      id SERIAL PRIMARY KEY,
      type VARCHAR(100) NOT NULL,
      user_id INTEGER REFERENCES users(id),
      entity_id VARCHAR(100),
      entity_type VARCHAR(100),
      description TEXT,
      metadata JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Password Reset Tokens table
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      token_hash VARCHAR(255) NOT NULL,
      user_id INTEGER REFERENCES users(id),
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Pending Phone Codes table
    CREATE TABLE IF NOT EXISTS pending_phone_codes (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(50) NOT NULL,
      code VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
    CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_item_movements_item ON item_movements(item_id);
    CREATE INDEX IF NOT EXISTS idx_item_movements_created ON item_movements(created_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
    CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
    CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(type);
    CREATE INDEX IF NOT EXISTS idx_system_events_created ON system_events(created_at);
  `;
    await pool.query(createTablesSQL);
    console.log('PostgreSQL tables created/verified');
}
// PostgreSQL adapter that mimics LowDB interface
class PostgresAdapter {
    constructor(pool) {
        this.pool = pool;
    }
    async getUsers() {
        const result = await this.pool.query('SELECT * FROM users ORDER BY id');
        return result.rows.map(this.mapUserFromDB);
    }
    async getUserById(id) {
        const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] ? this.mapUserFromDB(result.rows[0]) : null;
    }
    async createUser(user) {
        const { provider, providerId, name, email, phone, roles, displayName, passwordHash, createdAt, updatedAt, sessionVersion, role, firstName, lastName, department, isActive } = user;
        const result = await this.pool.query(`
      INSERT INTO users (
        provider, provider_id, name, email, phone, roles, display_name,
        password_hash, created_at, updated_at, session_version, role,
        first_name, last_name, department, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
            provider, providerId, name, email, phone, roles, displayName,
            passwordHash, createdAt, updatedAt, sessionVersion, role,
            firstName, lastName, department, isActive
        ]);
        return this.mapUserFromDB(result.rows[0]);
    }
    async updateUser(id, updates) {
        const setClause = [];
        const values = [];
        let paramIndex = 1;
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                const dbKey = this.camelToSnake(key);
                setClause.push(`${dbKey} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }
        if (setClause.length > 0) {
            values.push(id);
            await this.pool.query(`UPDATE users SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`, values);
        }
    }
    // Similar methods for other entities...
    async getItems() {
        const result = await this.pool.query('SELECT * FROM items ORDER BY id');
        return result.rows.map(this.mapItemFromDB);
    }
    async getSuppliers() {
        const result = await this.pool.query('SELECT * FROM suppliers ORDER BY id');
        return result.rows.map(this.mapSupplierFromDB);
    }
    // Dashboard analytics queries
    async getDashboardKPIs() {
        const [itemsCount, lowStockCount, pendingOrdersCount, suppliersCount] = await Promise.all([
            this.pool.query('SELECT COUNT(*) as count FROM items WHERE is_active = true'),
            this.pool.query('SELECT COUNT(*) as count FROM items WHERE quantity <= min_stock AND is_active = true'),
            this.pool.query('SELECT COUNT(*) as count FROM purchase_orders WHERE status IN (\'draft\', \'pending\', \'approved\')'),
            this.pool.query('SELECT COUNT(*) as count FROM suppliers WHERE is_active = true')
        ]);
        const totalValueResult = await this.pool.query(`
      SELECT COALESCE(SUM(quantity * unit_price), 0) as total_value 
      FROM items WHERE is_active = true
    `);
        return {
            totalItems: parseInt(itemsCount.rows[0].count),
            totalValue: parseFloat(totalValueResult.rows[0].total_value),
            lowStockItems: parseInt(lowStockCount.rows[0].count),
            pendingOrders: parseInt(pendingOrdersCount.rows[0].count),
            activeSuppliers: parseInt(suppliersCount.rows[0].count),
            monthlySpend: 27905, // TODO: Calculate from actual order data
            averageDeliveryTime: 5.2, // TODO: Calculate from delivery data
            stockTurnover: 2.1 // TODO: Calculate turnover ratio
        };
    }
    // Utility methods
    mapUserFromDB(row) {
        return {
            id: row.id,
            provider: row.provider,
            providerId: row.provider_id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            roles: row.roles,
            displayName: row.display_name,
            passwordHash: row.password_hash,
            createdAt: row.created_at?.toISOString(),
            updatedAt: row.updated_at?.toISOString(),
            sessionVersion: row.session_version,
            role: row.role,
            firstName: row.first_name,
            lastName: row.last_name,
            department: row.department,
            isActive: row.is_active
        };
    }
    mapItemFromDB(row) {
        return {
            id: row.id,
            name: row.name,
            sku: row.sku,
            quantity: row.quantity,
            location: row.location,
            minStock: row.min_stock,
            maxStock: row.max_stock,
            unitPrice: parseFloat(row.unit_price || 0),
            category: row.category,
            supplierId: row.supplier_id,
            description: row.description,
            tags: row.tags || [],
            isActive: row.is_active,
            createdAt: row.created_at?.toISOString(),
            updatedAt: row.updated_at?.toISOString()
        };
    }
    mapSupplierFromDB(row) {
        return {
            id: row.id,
            name: row.name,
            contactName: row.contact_name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            rating: parseFloat(row.rating || 0),
            onTimeDeliveryRate: row.on_time_delivery_rate,
            qualityScore: parseFloat(row.quality_score || 0),
            totalOrders: row.total_orders,
            totalValue: parseFloat(row.total_value || 0),
            isActive: row.is_active,
            createdAt: row.created_at?.toISOString(),
            updatedAt: row.updated_at?.toISOString()
        };
    }
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
exports.PostgresAdapter = PostgresAdapter;
async function closePostgres() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
