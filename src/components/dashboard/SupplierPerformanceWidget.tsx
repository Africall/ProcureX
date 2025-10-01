import React from 'react'
import { useSupplierPerformanceData } from '../../hooks/useDashboard'

interface SupplierPerformanceWidgetProps {
  config?: {
    showCharts?: boolean
    maxSuppliers?: number
  }
}

export const SupplierPerformanceWidget: React.FC<SupplierPerformanceWidgetProps> = ({ config }) => {
  const { data, isLoading, error } = useSupplierPerformanceData()

  if (isLoading) {
    return (
      <div className="h-full p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="h-full p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Failed to load supplier performance data</p>
      </div>
    )
  }

  const displaySuppliers = data.slice(0, config?.maxSuppliers || 5)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Supplier Performance
        </h3>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        <div className="space-y-3">
          {displaySuppliers.map((supplier) => (
            <div key={supplier.supplierId} className="border rounded-lg p-3 bg-white dark:bg-gray-800">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{supplier.name}</h4>
                <div className="flex items-center gap-1 text-sm">
                  <span>⭐</span>
                  <span className="text-gray-600 dark:text-gray-300">{supplier.rating}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Fulfillment:</span>
                  <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                    {Number.isFinite(supplier.fulfillmentPct as number) ? (supplier.fulfillmentPct as number).toFixed(1) : '0.0'}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">On-time:</span>
                  <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                    {Number.isFinite(supplier.onTimeDeliveryPct as number) ? (supplier.onTimeDeliveryPct as number).toFixed(1) : '0.0'}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Lead time:</span>
                  <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                    {Number.isFinite(supplier.avgLeadDays as number) ? (supplier.avgLeadDays as number).toFixed(1) : '0.0'} days
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Faulty:</span>
                  <span className="ml-1 font-medium text-red-600 dark:text-red-400">
                    {Number.isFinite(supplier.faultyRatePct as number) ? (supplier.faultyRatePct as number).toFixed(1) : '0.0'}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}