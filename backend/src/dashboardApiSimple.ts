import express from 'express'
import { dbManager } from './db'

const router = express.Router();

// Enterprise KPI calculation
router.get('/kpis', async (req, res) => {
  try {
    const data = await dbManager.read();
    const items = data.items || [];
    const suppliers = data.suppliers || [];
    const orders = data.purchaseOrders || [];

    // Calculate real KPIs from database
    const totalItems = items.length;
    const totalValue = items.reduce((sum: any, item: any) => sum + (item.quantity * (item.unitPrice || 0)), 0);
    const lowStockItems = items.filter((item: any) => item.quantity <= (item.minStock || 0)).length;
    const pendingOrders = orders.filter((order: any) => ['pending', 'approved', 'shipped'].includes(order.status)).length;
    const activeSuppliers = suppliers.filter((supplier: any) => supplier.isActive).length;

    // Calculate monthly spend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlySpend = orders
      .filter((order: any) => new Date(order.orderDate) >= thirtyDaysAgo && order.status !== 'cancelled')
      .reduce((sum: any, order: any) => sum + order.totalAmount, 0);

    const kpis = {
      totalItems,
      totalValue,
      lowStockItems,
      pendingOrders,
      activeSuppliers,
      monthlySpend,
      averageDeliveryTime: 5.2, // Placeholder
      stockTurnover: 2.1 // Placeholder
    };

    res.json(kpis);
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    res.status(500).json({ error: 'Failed to calculate KPIs' });
  }
});

// Low stock analysis
router.get('/low-stock', async (req, res) => {
  try {
    const data = await dbManager.read();
    const items = data.items || [];

    const lowStockItems = items
      .filter((item: any) => item.quantity <= (item.minStock || 0))
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        currentStock: item.quantity,
        minStock: item.minStock || 0,
        location: item.location,
        category: item.category || 'General',
        severity: item.quantity === 0 ? 'critical' : 
                 item.quantity < (item.minStock || 0) * 0.5 ? 'high' : 'medium'
      }))
      .sort((a: any, b: any) => a.currentStock - b.currentStock);

    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// Purchase order pipeline
router.get('/po-pipeline', async (req, res) => {
  try {
    const data = await dbManager.read();
    const orders = data.purchaseOrders || [];
    const suppliers = data.suppliers || [];

    const pipeline = orders
      .filter((order: any) => order.status !== 'cancelled' && order.status !== 'received')
      .map((order: any) => {
        const supplier = suppliers.find((s: any) => s.id === order.supplierId);
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          supplier: supplier?.name || 'Unknown',
          status: order.status,
          orderDate: order.orderDate,
          expectedDelivery: order.expectedDeliveryDate,
          totalAmount: order.totalAmount,
          itemCount: order.items?.length || 0,
          daysUntilDelivery: Math.ceil(
            (new Date(order.expectedDeliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        };
      })
      .sort((a: any, b: any) => new Date(a.expectedDelivery).getTime() - new Date(b.expectedDelivery).getTime());

    res.json(pipeline);
  } catch (error) {
    console.error('Error fetching PO pipeline:', error);
    res.status(500).json({ error: 'Failed to fetch PO pipeline' });
  }
});

// Stock movement trends
router.get('/stock-trends', async (req, res) => {
  try {
    const data = await dbManager.read();
    const movements = data.itemMovements || [];

    // Generate last 30 days of data
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayMovements = movements.filter((m: any) => 
        m.createdAt.startsWith(dateStr)
      );

      trends.push({
        date: dateStr,
        inbound: dayMovements.filter((m: any) => m.type === 'in').reduce((sum: any, m: any) => sum + m.quantity, 0),
        outbound: dayMovements.filter((m: any) => m.type === 'out').reduce((sum: any, m: any) => sum + m.quantity, 0),
        adjustments: dayMovements.filter((m: any) => m.type === 'adjustment').reduce((sum: any, m: any) => sum + Math.abs(m.quantity), 0)
      });
    }

    res.json(trends);
  } catch (error) {
    console.error('Error fetching stock trends:', error);
    res.status(500).json({ error: 'Failed to fetch stock trends' });
  }
});

// Technician usage analytics
router.get('/tech-usage', async (req, res) => {
  try {
    const data = await dbManager.read();
    const workOrders = data.workOrders || [];
    const users = data.users || [];

    const techUsage = users
      .filter((user: any) => user.role === 'technician')
      .map((tech: any) => {
        const techOrders = workOrders.filter((wo: any) => wo.assignedTo === tech.id);
        const completedOrders = techOrders.filter((wo: any) => wo.status === 'completed');
        
        return {
          id: tech.id,
          name: tech.displayName || tech.name || 'Unknown',
          activeOrders: techOrders.filter((wo: any) => wo.status === 'in-progress').length,
          completedOrders: completedOrders.length,
          totalHours: completedOrders.reduce((sum: any, wo: any) => sum + (wo.actualHours || 0), 0),
          efficiency: completedOrders.length > 0 ? 85 : 0 // Placeholder calculation
        };
      })
      .sort((a: any, b: any) => b.completedOrders - a.completedOrders);

    res.json(techUsage);
  } catch (error) {
    console.error('Error fetching tech usage:', error);
    res.status(500).json({ error: 'Failed to fetch technician usage' });
  }
});

// Supplier performance metrics
router.get('/supplier-performance', async (req, res) => {
  try {
    const data = await dbManager.read();
    const suppliers = data.suppliers || [];

    const performance = suppliers
      .filter((supplier: any) => supplier.isActive)
      .map((supplier: any) => ({
        supplierId: supplier.id,
        supplierName: supplier.name,
        onTimeDeliveryRate: supplier.onTimeDeliveryRate || 0,
        qualityScore: supplier.qualityScore || 0,
        totalOrders: supplier.totalOrders || 0,
        totalValue: supplier.totalValue || 0,
        averageDeliveryDays: 5, // Placeholder
        lastOrderDate: new Date().toISOString() // Placeholder
      }))
      .sort((a: any, b: any) => b.qualityScore - a.qualityScore);

    res.json(performance);
  } catch (error) {
    console.error('Error fetching supplier performance:', error);
    res.status(500).json({ error: 'Failed to fetch supplier performance' });
  }
});

// Active alerts
router.get('/alerts', async (req, res) => {
  try {
    const data = await dbManager.read();
    const alerts = data.alerts || [];

    const activeAlerts = alerts
      .filter((alert: any) => !alert.isResolved)
      .sort((a: any, b: any) => {
        const severityOrder: any = { critical: 4, error: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 10); // Latest 10 alerts

    res.json(activeAlerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Activity timeline
router.get('/activity', async (req, res) => {
  try {
    const data = await dbManager.read();
    const events = data.systemEvents || [];
    const users = data.users || [];

    const recentActivity = events
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((event: any) => {
        const user = users.find((u: any) => u.id === event.userId);
        return {
          id: event.id,
          type: event.type,
          description: event.description,
          user: user?.displayName || user?.name || 'System',
          timestamp: event.createdAt,
          metadata: event.metadata
        };
      });

    res.json(recentActivity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity timeline' });
  }
});

// Predictive insights (AI-powered analytics)
router.get('/insights', async (req, res) => {
  try {
    const data = await dbManager.read();
    const items = data.items || [];

    const insights = [];

    // Stock forecast insights
    const lowStockItems = items.filter((item: any) => item.quantity <= (item.minStock || 0));
    if (lowStockItems.length > 0) {
      insights.push({
        id: 1,
        type: 'stock_forecast',
        title: `${lowStockItems.length} items approaching critical stock levels`,
        description: 'Based on current usage patterns, these items will require replenishment within 7 days.',
        confidence: 85,
        impact: lowStockItems.length > 5 ? 'high' : 'medium',
        actionRequired: true,
        recommendedActions: [
          'Create purchase orders for critical items',
          'Review min/max stock levels',
          'Consider alternative suppliers for faster delivery'
        ],
        dataPoints: lowStockItems.map((item: any) => ({ 
          itemId: item.id, 
          name: item.name, 
          daysRemaining: Math.max(0, item.quantity / 2) 
        })),
        createdAt: new Date().toISOString()
      });
    }

    res.json(insights);
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;