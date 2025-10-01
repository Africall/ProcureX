import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDashboardStore } from '../stores/dashboardStore'
import {
  KpiGroup,
  LowStockSummary,
  PoPipeline,
  TechUsage,
  SupplierPerf,
  Alert,
  Activity,
  PredictiveInsight,
  DashboardFilters
} from '../schema/dashboard'
import {
  getDashboardKPIs as apiGetDashboardKPIs,
  getLowStockItems as apiGetLowStockItems,
  getPOPipeline as apiGetPOPipeline,
  getTechUsage as apiGetTechUsage,
  getSupplierPerformance as apiGetSupplierPerformance,
  getDashboardAlerts as apiGetDashboardAlerts,
  getActivityTimeline as apiGetActivityTimeline,
  getPredictiveInsights as apiGetPredictiveInsights,
  getStockTrends as apiGetStockTrends
} from '../api'

// Enterprise dashboard API client using real backend endpoints
const dashboardApi = {
  async getKPIs(): Promise<KpiGroup> {
    const response = await apiGetDashboardKPIs()
    return response.data
  },

  async getLowStock(): Promise<LowStockSummary> {
    const response = await apiGetLowStockItems()
    return response.data
  },

  async getPOPipeline(): Promise<PoPipeline> {
    const response = await apiGetPOPipeline()
    return response.data
  },

  async getTechUsage(): Promise<TechUsage> {
    const response = await apiGetTechUsage()
    return response.data
  },

  async getSupplierPerformance(): Promise<SupplierPerf[]> {
    const response = await apiGetSupplierPerformance()
    return response.data
  },

  async getAlerts(): Promise<Alert[]> {
    const response = await apiGetDashboardAlerts()
    return response.data
  },

  async getStockTrends(): Promise<any> {
    const response = await apiGetStockTrends()
    return response.data
  },

  async getActivity(): Promise<Activity[]> {
    const response = await apiGetActivityTimeline()
    return response.data
  },

  async getPredictiveInsights(): Promise<PredictiveInsight[]> {
    const response = await apiGetPredictiveInsights()
    return response.data
  },

  async executeAction(action: string, params: Record<string, any>): Promise<{ success: boolean; message: string; [key: string]: any }> {
    // For enterprise mode, we could implement real actions
    // For now, return a success response
    return { success: true, message: `Action "${action}" executed successfully` }
  }
}

// Query hooks for each dashboard data type
export const useDashboardKPIs = () => {
  const { autoRefresh } = useDashboardStore()
  
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardApi.getKPIs,
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30s
    staleTime: 15000 // Consider data stale after 15s
  })
}

export const useLowStockData = () => {
  const { autoRefresh } = useDashboardStore()
  
  return useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: dashboardApi.getLowStock,
    refetchInterval: autoRefresh ? 60000 : false, // Auto-refresh every 60s
    staleTime: 30000
  })
}

export const usePOPipelineData = () => {
  const { autoRefresh } = useDashboardStore()
  
  return useQuery({
    queryKey: ['dashboard', 'po-pipeline'],
    queryFn: dashboardApi.getPOPipeline,
    refetchInterval: autoRefresh ? 45000 : false,
    staleTime: 20000
  })
}

export const useTechUsageData = () => {
  const { autoRefresh, filters } = useDashboardStore()
  
  return useQuery({
    queryKey: ['dashboard', 'tech-usage', filters.dateRange, filters.technician],
    queryFn: dashboardApi.getTechUsage,
    refetchInterval: autoRefresh ? 120000 : false, // Less frequent for usage data
    staleTime: 60000
  })
}

export const useSupplierPerformanceData = () => {
  const { autoRefresh, filters } = useDashboardStore()
  
  return useQuery({
    queryKey: ['dashboard', 'supplier-performance', filters.dateRange, filters.supplier],
    queryFn: dashboardApi.getSupplierPerformance,
    refetchInterval: autoRefresh ? 90000 : false,
    staleTime: 45000
  })
}

export const useDashboardAlerts = () => {
  const { autoRefresh } = useDashboardStore()
  
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: dashboardApi.getAlerts,
    refetchInterval: autoRefresh ? 20000 : false, // Frequent updates for alerts
    staleTime: 10000
  })
}

export const useActivityTimeline = () => {
  const { autoRefresh, filters } = useDashboardStore()
  
  return useQuery({
    queryKey: ['dashboard', 'activity', filters.dateRange],
    queryFn: dashboardApi.getActivity,
    refetchInterval: autoRefresh ? 30000 : false,
    staleTime: 15000
  })
}

export const usePredictiveInsights = () => {
  const { autoRefresh } = useDashboardStore()
  
  return useQuery({
    queryKey: ['dashboard', 'predictive'],
    queryFn: dashboardApi.getPredictiveInsights,
    refetchInterval: autoRefresh ? 300000 : false, // Less frequent for predictive data
    staleTime: 180000
  })
}

// Action mutation hook
export const useDashboardAction = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ action, params }: { action: string; params: Record<string, any> }) =>
      dashboardApi.executeAction(action, params),
    onSuccess: () => {
      // Invalidate relevant queries after successful action
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

// Convenience hook to refresh all dashboard data
export const useRefreshDashboard = () => {
  const queryClient = useQueryClient()
  const { setLastRefresh } = useDashboardStore()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    setLastRefresh(new Date())
  }
}

// Hook to get overall loading state
export const useDashboardStatus = () => {
  const kpis = useDashboardKPIs()
  const lowStock = useLowStockData()
  const pipeline = usePOPipelineData()
  const usage = useTechUsageData()
  const suppliers = useSupplierPerformanceData()
  const alerts = useDashboardAlerts()
  const activity = useActivityTimeline()
  const insights = usePredictiveInsights()

  const queries = [kpis, lowStock, pipeline, usage, suppliers, alerts, activity, insights]
  
  return {
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
    isFetching: queries.some(q => q.isFetching),
    errors: queries.filter(q => q.error).map(q => q.error),
    lastUpdated: Math.max(...queries.map(q => q.dataUpdatedAt).filter(Boolean))
  }
}

// Filtered data hooks that apply dashboard filters
export const useFilteredLowStock = () => {
  const { data } = useLowStockData()
  const { filters } = useDashboardStore()
  
  if (!data) return data
  
  let filteredItems = data.items
  
  if (filters.category) {
    filteredItems = filteredItems.filter(item => 
      item.category === filters.category
    )
  }
  
  if (filters.supplier) {
    filteredItems = filteredItems.filter(item =>
      item.supplier === filters.supplier
    )
  }
  
  // Note: severity filtering would need to be handled at component level
  
  return {
    ...data,
    items: filteredItems,
    critical: filteredItems.filter(i => i.severity === 'critical').length,
    warning: filteredItems.filter(i => i.severity === 'warning').length,
    low: filteredItems.filter(i => i.severity === 'low').length
  }
}

export const useFilteredActivity = () => {
  const { data } = useActivityTimeline()
  const { filters } = useDashboardStore()
  
  if (!data) return data
  
  let filteredActivity = data
  
  if (filters.technician) {
    filteredActivity = filteredActivity.filter(activity =>
      activity.actor === filters.technician
    )
  }
  
  if (filters.dateRange) {
    filteredActivity = filteredActivity.filter(activity => {
      const activityDate = new Date(activity.when)
      return activityDate >= new Date(filters.dateRange.from) && activityDate <= new Date(filters.dateRange.to)
    })
  }
  
  return filteredActivity
}