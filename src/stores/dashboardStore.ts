import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Layout } from 'react-grid-layout'
import { DashboardFilters, WidgetConfig } from '../schema/dashboard'

interface DashboardWidget extends WidgetConfig {
  title: string
}

interface SavedDashboardLayout {
  id: string
  name: string
  description?: string
  layout: Layout[]
  widgets: string[]
  createdAt: Date
  isDefault: boolean
}

interface DashboardStore {
  // Filters and Date Range
  filters: DashboardFilters
  setFilters: (filters: Partial<DashboardFilters>) => void
  resetFilters: () => void

  // Layout and Widget Management
  layouts: Record<string, Layout[]>
  setLayout: (breakpoint: string, layout: Layout[]) => void
  
  // Widget Configuration
  widgets: Record<string, DashboardWidget>
  updateWidget: (widgetId: string, config: Partial<DashboardWidget>) => void
  addWidget: (widget: DashboardWidget) => void
  removeWidget: (widgetId: string) => void
  
  // Dashboard Layout Presets
  savedLayouts: SavedDashboardLayout[]
  saveLayout: (name: string, description?: string) => void
  loadLayout: (layoutId: string) => void
  deleteLayout: (layoutId: string) => void
  
  // UI State
  isCustomizing: boolean
  setCustomizing: (isCustomizing: boolean) => void
  showGrid: boolean
  setShowGrid: (showGrid: boolean) => void
  
  // Data Refresh
  lastRefresh: Date | null
  setLastRefresh: (date: Date) => void
  autoRefresh: boolean
  setAutoRefresh: (enabled: boolean) => void

  // Reset & Clear
  resetLayout: () => void
}

const defaultFilters: DashboardFilters = {
  dateRange: { 
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
    to: new Date().toISOString() 
  }
}

const defaultWidgets: Record<string, DashboardWidget> = {
  'kpis': {
    id: 'kpis',
    type: 'kpi',
    title: 'Key Performance Indicators',
    position: { x: 0, y: 0, w: 12, h: 2 },
    visible: true,
    config: { showSparklines: true, showTrends: true }
  },
  'lowStock': {
    id: 'lowStock', 
    type: 'lowStock',
    title: 'Low Stock Alert',
    position: { x: 0, y: 2, w: 6, h: 4 },
    visible: true,
    config: { showHeatmap: true, maxItems: 10 }
  },
  'poPipeline': {
    id: 'poPipeline',
    type: 'pipeline', 
    title: 'PO Pipeline',
    position: { x: 6, y: 2, w: 6, h: 4 },
    visible: true,
    config: { showCounts: true, showMiniKanban: false }
  },
  'techUsage': {
    id: 'techUsage',
    type: 'usage',
    title: 'Technician Usage',
    position: { x: 0, y: 6, w: 6, h: 4 },
    visible: true,
    config: { chartType: 'bar', showCategories: true }
  },
  'supplierPerf': {
    id: 'supplierPerf',
    type: 'suppliers',
    title: 'Supplier Performance', 
    position: { x: 6, y: 6, w: 6, h: 4 },
    visible: true,
    config: { showCharts: true, maxSuppliers: 5 }
  },
  'alerts': {
    id: 'alerts',
    type: 'alerts',
    title: 'Alerts Center',
    position: { x: 0, y: 10, w: 4, h: 6 },
    visible: true,
    config: { showAcknowledged: false, maxAlerts: 10 }
  },
  'activity': {
    id: 'activity',
    type: 'activity', 
    title: 'Recent Activity',
    position: { x: 4, y: 10, w: 4, h: 6 },
    visible: true,
    config: { showDetails: true, maxItems: 15 }
  },
  'predictive': {
    id: 'predictive',
    type: 'predictive',
    title: 'Predictive Insights',
    position: { x: 8, y: 10, w: 4, h: 6 },
    visible: true,
    config: { minConfidence: 70, showActions: true }
  }
}

const defaultLayout: Layout[] = Object.values(defaultWidgets).map(widget => ({
  i: widget.id,
  x: widget.position.x,
  y: widget.position.y,
  w: widget.position.w,
  h: widget.position.h,
  minW: 2,
  minH: 2
}))

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // Filters
      filters: defaultFilters,
      setFilters: (newFilters) => 
        set((state) => ({ 
          filters: { ...state.filters, ...newFilters }
        })),
      resetFilters: () => set({ filters: defaultFilters }),

  // Layout Management (ensure all breakpoints exist to satisfy ResponsiveGridLayout)
  layouts: { lg: defaultLayout, md: defaultLayout, sm: defaultLayout, xs: defaultLayout, xxs: defaultLayout },
      setLayout: (breakpoint, layout) =>
        set((state) => ({
          layouts: { ...state.layouts, [breakpoint]: layout }
        })),

      // Widget Management
      widgets: defaultWidgets,
      updateWidget: (widgetId, config) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            [widgetId]: { ...state.widgets[widgetId], ...config }
          }
        })),
      addWidget: (widget) =>
        set((state) => ({
          widgets: { ...state.widgets, [widget.id]: widget }
        })),
      removeWidget: (widgetId) =>
        set((state) => {
          const newWidgets = { ...state.widgets }
          delete newWidgets[widgetId]
          return { widgets: newWidgets }
        }),

      // Saved Layouts
      savedLayouts: [
        {
          id: 'default',
          name: 'Default Layout',
          description: 'Standard operational dashboard',
          layout: defaultLayout,
          widgets: Object.keys(defaultWidgets),
          createdAt: new Date(),
          isDefault: true
        }
      ],
      saveLayout: (name, description) => {
        const { layouts, widgets } = get()
        const newLayout: SavedDashboardLayout = {
          id: `layout-${Date.now()}`,
          name,
          description,
          layout: layouts.lg,
          widgets: Object.keys(widgets),
          createdAt: new Date(),
          isDefault: false
        }
        set((state) => ({
          savedLayouts: [...state.savedLayouts, newLayout]
        }))
      },
      loadLayout: (layoutId) => {
        const { savedLayouts } = get()
        const layout = savedLayouts.find(l => l.id === layoutId)
        if (layout) {
          set({
            layouts: { lg: layout.layout, md: layout.layout, sm: layout.layout, xs: layout.layout, xxs: layout.layout }
          })
        }
      },
      deleteLayout: (layoutId) =>
        set((state) => ({
          savedLayouts: state.savedLayouts.filter(l => l.id !== layoutId)
        })),

      // UI State  
      isCustomizing: false,
      setCustomizing: (isCustomizing) => set({ isCustomizing }),
      showGrid: false,
      setShowGrid: (showGrid) => set({ showGrid }),

      // Data Refresh
      lastRefresh: null,
      setLastRefresh: (date) => set({ lastRefresh: date }),
      autoRefresh: true,
      setAutoRefresh: (enabled) => set({ autoRefresh: enabled })
      ,
      // Reset & Clear persisted dashboard layout/state
      resetLayout: () => {
        const defaultSaved: SavedDashboardLayout = {
          id: 'default',
          name: 'Default Layout',
          description: 'Standard operational dashboard',
          layout: defaultLayout,
          widgets: Object.keys(defaultWidgets),
          createdAt: new Date(),
          isDefault: true,
        }
        // Clear persisted storage key to avoid stale data
        try { localStorage.removeItem('dashboard-store') } catch {}
        set({
          // Filters
          filters: defaultFilters,
          // Layouts
          layouts: { lg: defaultLayout, md: defaultLayout, sm: defaultLayout, xs: defaultLayout, xxs: defaultLayout },
          // Widgets
          widgets: defaultWidgets,
          // Saved layouts
          savedLayouts: [defaultSaved],
          // UI state defaults
          isCustomizing: false,
          showGrid: false,
          lastRefresh: null,
          autoRefresh: true,
        })
      }
    }),
    {
      name: 'dashboard-store',
      version: 2,
      migrate: (persisted: any, _fromVersion: number) => {
        // Defensive migration: guarantee valid layout arrays for all breakpoints
        const isValidLayoutArray = (val: any) => Array.isArray(val)
          && val.every(v => v && typeof v.i === 'string' && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.w) && Number.isFinite(v.h))

        const coerce = (val: any) => isValidLayoutArray(val) ? val : defaultLayout

        const existing = persisted?.layouts || {}
        const base = isValidLayoutArray(existing?.lg) ? existing.lg : defaultLayout

        const nextLayouts = {
          lg: coerce(existing?.lg || base),
          md: coerce(existing?.md || base),
          sm: coerce(existing?.sm || base),
          xs: coerce(existing?.xs || base),
          xxs: coerce(existing?.xxs || base),
        }

        return {
          ...persisted,
          layouts: nextLayouts,
        }
      },
      partialize: (state) => ({
        filters: state.filters,
        layouts: state.layouts,
        widgets: state.widgets,
        savedLayouts: state.savedLayouts,
        autoRefresh: state.autoRefresh
      })
    }
  )
)