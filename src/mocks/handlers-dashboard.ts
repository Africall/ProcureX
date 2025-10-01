import { http, HttpResponse } from 'msw'
import { subDays, format } from 'date-fns'

// Helper functions for mock data generation
const generateSparkline = (points: number = 7) => 
  Array.from({ length: points }, () => Math.floor(Math.random() * 100) + 50)

const generateTimeSeries = (days: number = 30) =>
  Array.from({ length: days }, (_, i) => ({
    date: format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd'),
    amount: Math.floor(Math.random() * 5000) + 1000
  }))

export const dashboardHandlers = [
  // Dashboard KPIs
  http.get('/dashboard/kpis', () => {
    return HttpResponse.json([
      {
        key: 'items',
        value: 1247,
        deltaPct: 8.2,
        trend: 'up',
        sparkline: generateSparkline()
      },
      {
        key: 'lowStock',
        value: 23,
        deltaPct: -12.5,
        trend: 'down',
        sparkline: generateSparkline()
      },
      {
        key: 'pendingPOs',
        value: 8,
        deltaPct: 15.6,
        trend: 'up',
        sparkline: generateSparkline()
      },
      {
        key: 'issuesToday',
        value: 42,
        deltaPct: 5.3,
        trend: 'up',
        sparkline: generateSparkline()
      },
      {
        key: 'faultyItems',
        value: 7,
        deltaPct: -25.0,
        trend: 'down',
        sparkline: generateSparkline()
      },
      {
        key: 'spend',
        value: 89750,
        deltaPct: 3.2,
        trend: 'up',
        sparkline: generateSparkline()
      }
    ])
  }),

  // Low Stock Summary
  http.get('/dashboard/low-stock', () => {
    return HttpResponse.json({
      critical: 5,
      warning: 11,
      low: 7,
      items: [
        {
          id: 'item-1',
          sku: 'CAT6-100',
          name: 'Cat6 Ethernet Cable 100ft',
          category: 'Networking',
          available: 2,
          rop: 10,
          severity: 'critical',
          supplier: 'TechFlow Solutions',
          lastOrdered: '2025-09-15',
          estimatedDaysLeft: 3
        },
        {
          id: 'item-2',
          sku: 'LED-PANEL-24',
          name: 'LED Panel Light 24W',
          category: 'Electrical',
          available: 8,
          rop: 15,
          severity: 'warning',
          supplier: 'ElectroSupply Co',
          lastOrdered: '2025-09-10',
          estimatedDaysLeft: 12
        },
        {
          id: 'item-3',
          sku: 'SCREW-M6-50',
          name: 'M6x50mm Hex Bolts',
          category: 'Hardware',
          available: 45,
          rop: 50,
          severity: 'low',
          supplier: 'FastenerHub',
          lastOrdered: '2025-08-28',
          estimatedDaysLeft: 25
        }
      ]
    })
  }),

  // PO Pipeline
  http.get('/dashboard/po-pipeline', () => {
    return HttpResponse.json({
      draft: 3,
      pending: 8,
      approved: 12,
      ordered: 15,
      received: 7,
      closed: 145,
      blocked: 2
    })
  }),

  // Technician Usage
  http.get('/dashboard/tech-usage', () => {
    return HttpResponse.json([
      {
        technician: 'John Smith',
        itemCount: 42,
        qtyTotal: 156,
        categories: [
          { category: 'Electronics', count: 18 },
          { category: 'Tools', count: 15 },
          { category: 'Safety', count: 9 }
        ],
        trend: 'up'
      },
      {
        technician: 'Sarah Davis',
        itemCount: 38,
        qtyTotal: 132,
        categories: [
          { category: 'Networking', count: 22 },
          { category: 'Hardware', count: 11 },
          { category: 'Electrical', count: 5 }
        ],
        trend: 'up'
      },
      {
        technician: 'Mike Johnson',
        itemCount: 29,
        qtyTotal: 98,
        categories: [
          { category: 'Safety', count: 16 },
          { category: 'Tools', count: 8 },
          { category: 'Maintenance', count: 5 }
        ],
        trend: 'flat'
      }
    ])
  }),

  // Supplier Performance
  http.get('/dashboard/supplier-performance', () => {
    return HttpResponse.json([
      {
        supplierId: 'sup-1',
        name: 'TechFlow Solutions',
        fulfillmentPct: 94.5,
        avgLeadDays: 3.2,
        faultyRatePct: 1.8,
        onTimeDeliveryPct: 91.2,
        spendSeries: generateTimeSeries(30),
        recentOrders: 12,
        rating: 4.7
      },
      {
        supplierId: 'sup-2',
        name: 'Global Parts Co',
        fulfillmentPct: 88.3,
        avgLeadDays: 5.1,
        faultyRatePct: 3.2,
        onTimeDeliveryPct: 85.7,
        spendSeries: generateTimeSeries(30),
        recentOrders: 8,
        rating: 4.2
      },
      {
        supplierId: 'sup-3',
        name: 'SafetyFirst Supplies',
        fulfillmentPct: 97.8,
        avgLeadDays: 2.1,
        faultyRatePct: 0.5,
        onTimeDeliveryPct: 96.4,
        spendSeries: generateTimeSeries(30),
        recentOrders: 15,
        rating: 4.9
      }
    ])
  }),

  // Alerts
  http.get('/dashboard/alerts', () => {
    return HttpResponse.json([
      {
        id: 'alert-1',
        severity: 'critical',
        title: 'Critical Stock Level',
        detail: 'Cat6 Ethernet Cable 100ft has only 2 units remaining',
        timestamp: new Date().toISOString(),
        category: 'stock',
        cta: {
          label: 'Create PO',
          action: 'create_po',
          params: { itemId: 'item-1' }
        },
        acknowledged: false
      },
      {
        id: 'alert-2',
        severity: 'warn',
        title: 'Supplier Delivery Delay',
        detail: 'TechFlow Solutions reports 2-day delay on PO-2025-089',
        timestamp: subDays(new Date(), 1).toISOString(),
        category: 'supplier',
        cta: {
          label: 'Contact Supplier',
          action: 'contact_supplier',
          params: { supplierId: 'sup-1', poId: 'PO-2025-089' }
        },
        acknowledged: false
      },
      {
        id: 'alert-3',
        severity: 'info',
        title: 'Monthly Report Ready',
        detail: 'September inventory report is available for download',
        timestamp: subDays(new Date(), 2).toISOString(),
        category: 'system',
        cta: {
          label: 'Download',
          action: 'download_report',
          params: { reportId: 'monthly-2025-09' }
        },
        acknowledged: true
      }
    ])
  }),

  // Activity Timeline
  http.get('/dashboard/activity', () => {
    const activities = [
      {
        id: 'act-1',
        when: new Date().toISOString(),
        type: 'ISSUE',
        actor: 'John Smith',
        summary: 'Issued 5x Cat6 Ethernet Cable 100ft to Site A',
        details: { itemId: 'item-1', quantity: 5, site: 'Site A' }
      },
      {
        id: 'act-2',
        when: subDays(new Date(), 0.5).toISOString(),
        type: 'PO_CREATED',
        actor: 'Sarah Davis',
        summary: 'Created PO-2025-092 for LED Panel Lights',
        details: { poId: 'PO-2025-092', supplierId: 'sup-2' },
        poId: 'PO-2025-092'
      },
      {
        id: 'act-3',
        when: subDays(new Date(), 1).toISOString(),
        type: 'RECEIVE',
        actor: 'Mike Johnson',
        summary: 'Received 50x M6x50mm Hex Bolts from FastenerHub',
        details: { itemId: 'item-3', quantity: 50, supplier: 'FastenerHub' }
      },
      {
        id: 'act-4',
        when: subDays(new Date(), 1.2).toISOString(),
        type: 'FAULTY',
        actor: 'John Smith',
        summary: 'Marked 2x LED Panel Light 24W as faulty',
        details: { itemId: 'item-2', quantity: 2, reason: 'Flickering' }
      },
      {
        id: 'act-5',
        when: subDays(new Date(), 2).toISOString(),
        type: 'PO_APPROVED',
        actor: 'System',
        summary: 'PO-2025-091 approved and sent to TechFlow Solutions',
        details: { poId: 'PO-2025-091', supplierId: 'sup-1' },
        poId: 'PO-2025-091'
      }
    ]

    return HttpResponse.json(activities.slice(0, 25))
  }),

  // Predictive Insights
  http.get('/dashboard/predictive', () => {
    return HttpResponse.json([
      {
        id: 'insight-1',
        title: 'Reorder Recommendation',
        rationale: 'Based on usage patterns, Cat6 cables will hit critical levels in 3 days',
        recommendation: 'Order 120 units to maintain optimal stock levels',
        confidence: 89,
        impact: 'high',
        category: 'reorder',
        suggestedAction: {
          label: 'Create PO for 120 units',
          action: 'create_po',
          params: { itemId: 'item-1', quantity: 120 }
        },
        daysAhead: 3
      },
      {
        id: 'insight-2',
        title: 'Supplier Performance Alert',
        rationale: 'Global Parts Co delivery times increased 40% over last 30 days',
        recommendation: 'Consider alternative suppliers for critical components',
        confidence: 76,
        impact: 'medium',
        category: 'supplier',
        suggestedAction: {
          label: 'Review Alternatives',
          action: 'find_suppliers',
          params: { category: 'Electronics' }
        },
        daysAhead: 7
      },
      {
        id: 'insight-3',
        title: 'Cost Optimization',
        rationale: 'LED Panel usage spiked 60% - bulk ordering could save 15%',
        recommendation: 'Place larger orders to qualify for volume discounts',
        confidence: 82,
        impact: 'medium',
        category: 'cost',
        suggestedAction: {
          label: 'Calculate Savings',
          action: 'bulk_analysis',
          params: { itemId: 'item-2' }
        },
        daysAhead: 14
      }
    ])
  }),

  // Dashboard Actions
  http.post('/dashboard/action', async ({ request }) => {
    const body = await request.json() as any
    const { action, params } = body

    switch (action) {
      case 'create_po':
        return HttpResponse.json({
          success: true,
          message: 'Purchase order draft created successfully',
          poId: `PO-${Date.now()}`,
          nextStep: 'Review and approve the purchase order'
        })
      
      case 'contact_supplier':
        return HttpResponse.json({
          success: true,
          message: 'Notification sent to supplier',
          contactMethod: 'email',
          expectedResponse: '24 hours'
        })
      
      case 'find_suppliers':
        return HttpResponse.json({
          success: true,
          message: 'Supplier search initiated',
          resultsFound: 8,
          nextStep: 'Review supplier recommendations'
        })
      
      default:
        return HttpResponse.json({
          success: true,
          message: `Action ${action} executed successfully`
        })
    }
  }),
]