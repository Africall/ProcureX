import { dbManager } from './db';
import { 
  Item, 
  Supplier, 
  PurchaseOrder, 
  ItemMovement, 
  WorkOrder, 
  Alert, 
  SystemEvent, 
  User 
} from './types';

export async function seedEnterpriseData() {
  try {
    const data = await dbManager.read();
    
    // Only seed if we don't have enterprise data yet
    if (data.purchaseOrders && data.purchaseOrders.length > 0) {
      console.log('Enterprise data already exists, skipping seed');
      return;
    }

    console.log('Seeding enterprise data...');

    // Enhance existing items with enterprise fields
    const enhancedItems: Item[] = (data.items || []).map((item: any, index: number) => ({
      ...item,
      minStock: Math.max(5, Math.floor(item.quantity * 0.2)),
      maxStock: Math.floor(item.quantity * 2),
      unitPrice: Math.floor(Math.random() * 500) + 50,
      category: ['Electronics', 'Tools', 'Safety', 'Materials', 'Office'][index % 5],
      description: `High-quality ${item.name.toLowerCase()} for professional use`,
      tags: ['standard', 'certified', 'essential'],
      isActive: true,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Enhance existing suppliers with enterprise fields
    const enhancedSuppliers: Supplier[] = (data.suppliers || []).map((supplier: any, index: number) => ({
      ...supplier,
      rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
      onTimeDeliveryRate: Math.floor(Math.random() * 20) + 80, // 80-100%
      qualityScore: Math.floor(Math.random() * 2) + 4, // 4-5 stars
      totalOrders: Math.floor(Math.random() * 50) + 10,
      totalValue: Math.floor(Math.random() * 100000) + 50000,
      isActive: true,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Enhance existing users with enterprise fields
    const enhancedUsers: User[] = (data.users || []).map((user: any, index: number) => ({
      ...user,
      role: ['admin', 'manager', 'technician', 'viewer'][index % 4] as any,
      firstName: user.name?.split(' ')[0] || 'John',
      lastName: user.name?.split(' ')[1] || 'Doe',
      department: ['IT', 'Maintenance', 'Operations', 'Procurement'][index % 4],
      isActive: true
    }));

    // Create sample purchase orders
    const purchaseOrders: PurchaseOrder[] = [];
    for (let i = 1; i <= 15; i++) {
      const supplier = enhancedSuppliers[i % enhancedSuppliers.length];
      const orderDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      const expectedDelivery = new Date(orderDate.getTime() + (Math.random() * 14 + 3) * 24 * 60 * 60 * 1000);
      
      const statuses = ['draft', 'pending', 'approved', 'shipped', 'received', 'cancelled'];
      const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
      
      const items = enhancedItems.slice(0, Math.floor(Math.random() * 3) + 1).map((item, idx) => ({
        id: i * 10 + idx,
        itemId: item.id,
        quantity: Math.floor(Math.random() * 20) + 5,
        unitPrice: item.unitPrice,
        totalPrice: (Math.floor(Math.random() * 20) + 5) * item.unitPrice
      }));

      purchaseOrders.push({
        id: i,
        orderNumber: `PO-${String(i).padStart(4, '0')}`,
        supplierId: supplier.id,
        status,
        orderDate: orderDate.toISOString(),
        expectedDeliveryDate: expectedDelivery.toISOString(),
        actualDeliveryDate: status === 'received' ? 
          new Date(expectedDelivery.getTime() + (Math.random() - 0.5) * 3 * 24 * 60 * 60 * 1000).toISOString() : 
          undefined,
        totalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0),
        items,
        createdBy: enhancedUsers[0]?.id || 1,
        approvedBy: status !== 'draft' ? enhancedUsers[1]?.id : undefined,
        notes: Math.random() > 0.7 ? 'Urgent delivery required' : undefined,
        createdAt: orderDate.toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Create sample item movements
    const itemMovements: ItemMovement[] = [];
    for (let i = 1; i <= 50; i++) {
      const item = enhancedItems[Math.floor(Math.random() * enhancedItems.length)];
      const types = ['in', 'out', 'adjustment', 'transfer'] as const;
      const type = types[Math.floor(Math.random() * types.length)];
      
      itemMovements.push({
        id: i,
        itemId: item.id,
        type,
        quantity: Math.floor(Math.random() * 20) + 1,
        reason: type === 'in' ? 'Purchase order receipt' :
                type === 'out' ? 'Work order consumption' :
                type === 'adjustment' ? 'Inventory count correction' :
                'Location transfer',
        fromLocation: type === 'transfer' ? (item.location || 'Unknown') : undefined,
        toLocation: type === 'transfer' ? 'Warehouse B' : (item.location || 'Unknown'),
        userId: enhancedUsers[Math.floor(Math.random() * enhancedUsers.length)]?.id || 1,
        referenceId: Math.random() > 0.5 ? `WO-${Math.floor(Math.random() * 100)}` : undefined,
        notes: Math.random() > 0.8 ? 'Emergency usage' : undefined,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Create sample work orders
    const workOrders: WorkOrder[] = [];
    const technicians = enhancedUsers.filter(u => u.role === 'technician');
    for (let i = 1; i <= 20; i++) {
      const statuses = ['open', 'in-progress', 'completed', 'cancelled'] as const;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const priorities = ['low', 'medium', 'high', 'critical'] as const;
      
      const estimatedHours = Math.floor(Math.random() * 8) + 1;
      const actualHours = status === 'completed' ? estimatedHours + (Math.random() - 0.5) * 2 : undefined;
      
      workOrders.push({
        id: i,
        orderNumber: `WO-${String(i).padStart(4, '0')}`,
        title: `Repair ${['Equipment A', 'System B', 'Component C', 'Device D'][i % 4]}`,
        description: `Maintenance work required for ${['routine inspection', 'breakdown repair', 'preventive maintenance', 'emergency fix'][i % 4]}`,
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        assignedTo: technicians.length > 0 ? technicians[i % technicians.length].id : undefined,
        requestedBy: enhancedUsers[0]?.id || 1,
        estimatedHours,
        actualHours,
        itemsUsed: enhancedItems.slice(0, Math.floor(Math.random() * 3)).map((item, idx) => ({
          id: i * 10 + idx,
          itemId: item.id,
          quantityUsed: Math.floor(Math.random() * 5) + 1,
          unitCost: item.unitPrice
        })),
        completedAt: status === 'completed' ? 
          new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : 
          undefined,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Create sample alerts
    const alerts: Alert[] = [];
    const alertTypes = ['low_stock', 'overstock', 'expired', 'delivery_delay', 'quality_issue', 'system'] as const;
    const severities = ['info', 'warning', 'error', 'critical'] as const;
    
    for (let i = 1; i <= 25; i++) {
      const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      alerts.push({
        id: i,
        type,
        severity,
        title: type === 'low_stock' ? 'Low Stock Alert' :
               type === 'delivery_delay' ? 'Delivery Delay' :
               type === 'quality_issue' ? 'Quality Issue Reported' :
               'System Alert',
        description: `${type.replace('_', ' ')} detected requiring attention`,
        itemId: Math.random() > 0.5 ? enhancedItems[Math.floor(Math.random() * enhancedItems.length)].id : undefined,
        supplierId: Math.random() > 0.7 ? enhancedSuppliers[Math.floor(Math.random() * enhancedSuppliers.length)].id : undefined,
        orderId: Math.random() > 0.8 ? Math.floor(Math.random() * purchaseOrders.length) + 1 : undefined,
        isRead: Math.random() > 0.3,
        isResolved: Math.random() > 0.6,
        resolvedBy: Math.random() > 0.6 ? enhancedUsers[0]?.id : undefined,
        resolvedAt: Math.random() > 0.6 ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Create sample system events
    const systemEvents: SystemEvent[] = [];
    const eventTypes = ['user_login', 'item_created', 'item_updated', 'order_placed', 'order_received', 'stock_movement', 'system_error'] as const;
    
    for (let i = 1; i <= 100; i++) {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      systemEvents.push({
        id: i,
        type,
        userId: Math.random() > 0.2 ? enhancedUsers[Math.floor(Math.random() * enhancedUsers.length)]?.id : undefined,
        entityId: Math.random() > 0.5 ? String(Math.floor(Math.random() * 100) + 1) : undefined,
        entityType: Math.random() > 0.5 ? ['item', 'supplier', 'order'][Math.floor(Math.random() * 3)] : undefined,
        description: `${type.replace('_', ' ')} event logged`,
        metadata: Math.random() > 0.7 ? { source: 'dashboard', automated: true } : undefined,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'ProcureX Dashboard v1.0',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Update database with all enterprise data
    // Note: We need to manually populate the data since dbManager.read() returns a copy
    // For LowDB, we can access the underlying data via dbManager
    if (dbManager.isUsingPostgres()) {
      // TODO: Implement PostgreSQL seeding when needed
      console.log('PostgreSQL seeding not yet implemented, skipping...');
    } else {
      // For LowDB, access the underlying database
      const lowDb = await import('./db');
      const db = lowDb.default;
      if (db.data) {
        db.data.items = enhancedItems;
        db.data.suppliers = enhancedSuppliers;
        db.data.users = enhancedUsers;
        db.data.purchaseOrders = purchaseOrders;
        db.data.itemMovements = itemMovements;
        db.data.workOrders = workOrders;
        db.data.alerts = alerts;
        db.data.systemEvents = systemEvents;
        db.data.lastPurchaseOrderId = purchaseOrders.length;
        db.data.lastWorkOrderId = workOrders.length;
        db.data.lastAlertId = alerts.length;
        db.data.lastSystemEventId = systemEvents.length;
        await db.write();
      }
    }
    console.log('✅ Enterprise data seeded successfully');
    console.log(`   - ${enhancedItems.length} enhanced items`);
    console.log(`   - ${enhancedSuppliers.length} enhanced suppliers`);
    console.log(`   - ${purchaseOrders.length} purchase orders`);
    console.log(`   - ${itemMovements.length} item movements`);
    console.log(`   - ${workOrders.length} work orders`);
    console.log(`   - ${alerts.length} alerts`);
    console.log(`   - ${systemEvents.length} system events`);

  } catch (error) {
    console.error('Error seeding enterprise data:', error);
  }
}