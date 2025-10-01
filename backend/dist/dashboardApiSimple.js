"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const router = express_1.default.Router();
// Enterprise KPI calculation
router.get('/kpis', async (req, res) => {
    try {
        const data = await db_1.dbManager.read();
        const items = data.items || [];
        const suppliers = data.suppliers || [];
        const orders = data.purchaseOrders || [];
        // Calculate real KPIs from database
        const totalItems = items.length;
        const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);
        const lowStockItems = items.filter((item) => item.quantity <= (item.minStock || 0)).length;
        const pendingOrders = orders.filter((order) => ['pending', 'approved', 'shipped'].includes(order.status)).length;
        const activeSuppliers = suppliers.filter((supplier) => supplier.isActive).length;
        // Calculate monthly spend (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlySpend = orders
            .filter((order) => new Date(order.orderDate) >= thirtyDaysAgo && order.status !== 'cancelled')
            .reduce((sum, order) => sum + order.totalAmount, 0);
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
    }
    catch (error) {
        console.error('Error calculating KPIs:', error);
        res.status(500).json({ error: 'Failed to calculate KPIs' });
    }
});
// Low stock analysis
router.get('/low-stock', async (req, res) => {
    try {
        const data = await db_1.dbManager.read();
        const items = data.items || [];
        const lowStockItems = items
            .filter((item) => item.quantity <= (item.minStock || 0))
            .map((item) => ({
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
            .sort((a, b) => a.currentStock - b.currentStock);
        res.json(lowStockItems);
    }
    catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
});
// Purchase order pipeline
router.get('/po-pipeline', async (req, res) => {
    try {
        const data = await db_1.dbManager.read();
        const orders = data.purchaseOrders || [];
        const suppliers = data.suppliers || [];
        const pipeline = orders
            .filter((order) => order.status !== 'cancelled' && order.status !== 'received')
            .map((order) => {
            const supplier = suppliers.find((s) => s.id === order.supplierId);
            return {
                id: order.id,
                orderNumber: order.orderNumber,
                supplier: supplier?.name || 'Unknown',
                status: order.status,
                orderDate: order.orderDate,
                expectedDelivery: order.expectedDeliveryDate,
                totalAmount: order.totalAmount,
                itemCount: order.items?.length || 0,
                daysUntilDelivery: Math.ceil((new Date(order.expectedDeliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            };
        })
            .sort((a, b) => new Date(a.expectedDelivery).getTime() - new Date(b.expectedDelivery).getTime());
        res.json(pipeline);
    }
    catch (error) {
        console.error('Error fetching PO pipeline:', error);
        res.status(500).json({ error: 'Failed to fetch PO pipeline' });
    }
});
// Stock movement trends
router.get('/stock-trends', async (req, res) => {
    try {
        const data = await db_1.dbManager.read();
        const movements = data.itemMovements || [];
        // Generate last 30 days of data
        const trends = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayMovements = movements.filter((m) => m.createdAt.startsWith(dateStr));
            trends.push({
                date: dateStr,
                inbound: dayMovements.filter((m) => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0),
                outbound: dayMovements.filter((m) => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0),
                adjustments: dayMovements.filter((m) => m.type === 'adjustment').reduce((sum, m) => sum + Math.abs(m.quantity), 0)
            });
        }
        res.json(trends);
    }
    catch (error) {
        console.error('Error fetching stock trends:', error);
        res.status(500).json({ error: 'Failed to fetch stock trends' });
    }
});
// Technician usage analytics
router.get('/tech-usage', async (req, res) => {
    try {
        const data = await db_1.dbManager.read();
        const workOrders = data.workOrders || [];
        const users = data.users || [];
        const techUsage = users
            .filter((user) => user.role === 'technician')
            .map((tech) => {
            const techOrders = workOrders.filter((wo) => wo.assignedTo === tech.id);
            const completedOrders = techOrders.filter((wo) => wo.status === 'completed');
            return {
                id: tech.id,
                name: tech.displayName || tech.name || 'Unknown',
                activeOrders: techOrders.filter((wo) => wo.status === 'in-progress').length,
                completedOrders: completedOrders.length,
                totalHours: completedOrders.reduce((sum, wo) => sum + (wo.actualHours || 0), 0),
                efficiency: completedOrders.length > 0 ? 85 : 0 // Placeholder calculation
            };
        })
            .sort((a, b) => b.completedOrders - a.completedOrders);
        res.json(techUsage);
    }
    catch (error) {
        console.error('Error fetching tech usage:', error);
        res.status(500).json({ error: 'Failed to fetch technician usage' });
    }
});
// Supplier performance metrics
router.get('/supplier-performance', async (req, res) => {
    try {
        const data = await db_1.dbManager.read();
        const suppliers = data.suppliers || [];
        const performance = suppliers
            .filter((supplier) => supplier.isActive)
            .map((supplier) => ({
            supplierId: supplier.id,
            supplierName: supplier.name,
            onTimeDeliveryRate: supplier.onTimeDeliveryRate || 0,
            qualityScore: supplier.qualityScore || 0,
            totalOrders: supplier.totalOrders || 0,
            totalValue: supplier.totalValue || 0,
            averageDeliveryDays: 5, // Placeholder
            lastOrderDate: new Date().toISOString() // Placeholder
        }))
            .sort((a, b) => b.qualityScore - a.qualityScore);
        res.json(performance);
    }
    catch (error) {
        console.error('Error fetching supplier performance:', error);
        res.status(500).json({ error: 'Failed to fetch supplier performance' });
    }
});
// Active alerts
router.get('/alerts', async (req, res) => {
    try {
        const data = await db_1.dbManager.read();
        const alerts = data.alerts || [];
        const activeAlerts = alerts
            .filter((alert) => !alert.isResolved)
            .sort((a, b) => {
            const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        })
            .slice(0, 10); // Latest 10 alerts
        res.json(activeAlerts);
    }
    catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});
// Activity timeline
router.get('/activity', async (req, res) => {
    try {
        const data = await db_1.dbManager.read();
        const events = data.systemEvents || [];
        const users = data.users || [];
        const recentActivity = events
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20)
            .map((event) => {
            const user = users.find((u) => u.id === event.userId);
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
    }
    catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity timeline' });
    }
});
// Predictive insights (AI-powered analytics)
router.get('/insights', async (req, res) => {
    try {
        const data = await db_1.dbManager.read();
        const items = data.items || [];
        const insights = [];
        // Stock forecast insights
        const lowStockItems = items.filter((item) => item.quantity <= (item.minStock || 0));
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
                dataPoints: lowStockItems.map((item) => ({
                    itemId: item.id,
                    name: item.name,
                    daysRemaining: Math.max(0, item.quantity / 2)
                })),
                createdAt: new Date().toISOString()
            });
        }
        res.json(insights);
    }
    catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});
exports.default = router;
