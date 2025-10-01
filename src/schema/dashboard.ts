import { z } from 'zod'

// KPI Metrics
export const KpiSchema = z.object({
  key: z.enum(['items', 'lowStock', 'pendingPOs', 'issuesToday', 'faultyItems', 'spend']),
  value: z.number(),
  deltaPct: z.number().optional(), // +/- %
  trend: z.enum(['up', 'down', 'flat']).optional(),
  sparkline: z.array(z.number()).optional(), // Mini chart data
})

export const KpiGroupSchema = z.array(KpiSchema)

// Low Stock Management
export const LowStockItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  available: z.number(),
  rop: z.number(), // Reorder Point
  severity: z.enum(['critical', 'warning', 'low']),
  supplier: z.string().optional(),
  lastOrdered: z.string().optional(), // ISO date
  estimatedDaysLeft: z.number().optional(),
})

export const LowStockSummarySchema = z.object({
  critical: z.number(),
  warning: z.number(),
  low: z.number(),
  items: z.array(LowStockItemSchema),
})

// Purchase Order Pipeline
export const PoPipelineSchema = z.object({
  draft: z.number(),
  pending: z.number(),
  approved: z.number(),
  ordered: z.number(),
  received: z.number(),
  closed: z.number(),
  blocked: z.number(),
})

// Technician Usage Analytics
export const TechUsageSchema = z.array(z.object({
  technician: z.string(),
  itemCount: z.number(),
  qtyTotal: z.number(),
  categories: z.array(z.object({
    category: z.string(),
    count: z.number(),
  })),
  trend: z.enum(['up', 'down', 'flat']).optional(),
}))

// Supplier Performance Metrics
export const SupplierPerfSchema = z.object({
  supplierId: z.string(),
  name: z.string(),
  fulfillmentPct: z.number(), // 0–100
  avgLeadDays: z.number(),
  faultyRatePct: z.number(), // 0–100
  onTimeDeliveryPct: z.number(), // 0–100
  spendSeries: z.array(z.object({ 
    date: z.string(), 
    amount: z.number() 
  })),
  recentOrders: z.number(),
  rating: z.number().min(1).max(5),
})

// Alerts and Notifications
export const AlertSchema = z.object({
  id: z.string(),
  severity: z.enum(['info', 'warn', 'critical']),
  title: z.string(),
  detail: z.string().optional(),
  timestamp: z.string(), // ISO
  category: z.enum(['stock', 'supplier', 'po', 'system', 'maintenance']),
  cta: z.object({ 
    label: z.string(), 
    action: z.string(),
    params: z.record(z.any()).optional()
  }).optional(),
  acknowledged: z.boolean().default(false),
})

// Activity Timeline
export const ActivitySchema = z.object({
  id: z.string(),
  when: z.string(), // ISO
  type: z.enum(['ISSUE', 'RECEIVE', 'FAULTY', 'PO_CREATED', 'PO_APPROVED', 'ADJUST', 'SUPPLIER_UPDATE']),
  actor: z.string(),
  summary: z.string(),
  details: z.record(z.any()).optional(),
  itemId: z.string().optional(),
  supplierId: z.string().optional(),
  poId: z.string().optional(),
})

// Predictive AI Insights
export const PredictiveInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  rationale: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(100), // AI confidence %
  impact: z.enum(['low', 'medium', 'high']),
  category: z.enum(['reorder', 'supplier', 'cost', 'maintenance']),
  suggestedAction: z.object({ 
    label: z.string(), 
    action: z.string(),
    params: z.record(z.any()).optional()
  }),
  daysAhead: z.number().optional(), // Prediction timeframe
})

// Dashboard Filters
export const DashboardFiltersSchema = z.object({
  dateRange: z.object({
    from: z.string(), // ISO
    to: z.string(),   // ISO
    preset: z.enum(['today', '7d', '30d', '90d', 'custom']).optional(),
  }),
  category: z.string().optional(),
  site: z.string().optional(),
  technician: z.string().optional(),
  supplier: z.string().optional(),
})

// Widget Layout Configuration
export const WidgetConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['kpi', 'lowStock', 'pipeline', 'usage', 'suppliers', 'alerts', 'activity', 'predictive']),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  visible: z.boolean().default(true),
  config: z.record(z.any()).optional(), // Widget-specific settings
})

export const DashboardLayoutSchema = z.object({
  widgets: z.array(WidgetConfigSchema),
  lastModified: z.string(),
})

// API Response Types
export const DashboardDataSchema = z.object({
  kpis: KpiGroupSchema,
  lowStock: LowStockSummarySchema,
  pipeline: PoPipelineSchema,
  usage: TechUsageSchema,
  suppliers: z.array(SupplierPerfSchema),
  alerts: z.array(AlertSchema),
  activity: z.array(ActivitySchema),
  insights: z.array(PredictiveInsightSchema),
})

// TypeScript Types (derived from schemas)
export type Kpi = z.infer<typeof KpiSchema>
export type KpiGroup = z.infer<typeof KpiGroupSchema>
export type LowStockItem = z.infer<typeof LowStockItemSchema>
export type LowStockSummary = z.infer<typeof LowStockSummarySchema>
export type PoPipeline = z.infer<typeof PoPipelineSchema>
export type TechUsage = z.infer<typeof TechUsageSchema>
export type SupplierPerf = z.infer<typeof SupplierPerfSchema>
export type Alert = z.infer<typeof AlertSchema>
export type Activity = z.infer<typeof ActivitySchema>
export type PredictiveInsight = z.infer<typeof PredictiveInsightSchema>
export type DashboardFilters = z.infer<typeof DashboardFiltersSchema>
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>
export type DashboardLayout = z.infer<typeof DashboardLayoutSchema>
export type DashboardData = z.infer<typeof DashboardDataSchema>

// Helper functions for data validation
export const validateKpis = (data: unknown) => KpiGroupSchema.parse(data)
export const validateLowStock = (data: unknown) => LowStockSummarySchema.parse(data)
export const validatePipeline = (data: unknown) => PoPipelineSchema.parse(data)
export const validateUsage = (data: unknown) => TechUsageSchema.parse(data)
export const validateSuppliers = (data: unknown) => z.array(SupplierPerfSchema).parse(data)
export const validateAlerts = (data: unknown) => z.array(AlertSchema).parse(data)
export const validateActivity = (data: unknown) => z.array(ActivitySchema).parse(data)
export const validateInsights = (data: unknown) => z.array(PredictiveInsightSchema).parse(data)