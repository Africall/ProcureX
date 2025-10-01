import React from 'react'
import { useTechUsageData } from '../../hooks/useDashboard'

interface TechUsageWidgetProps {
  config?: {
    chartType?: string
    showCategories?: boolean
  }
}

export const TechUsageWidget: React.FC<TechUsageWidgetProps> = ({ config }) => {
  const { data, isLoading, error } = useTechUsageData()

  if (isLoading) {
    return (
      <div className="h-full p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="h-full p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Failed to load technician usage data</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Technician Usage
        </h3>
      </div>
      
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {data.map((tech) => (
            <div key={tech.technician} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{tech.technician}</h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {tech.itemCount} items • {tech.qtyTotal} total qty
                </span>
              </div>
              {config?.showCategories && (
                <div className="flex gap-2 flex-wrap">
                  {tech.categories.map((cat) => (
                    <span key={cat.category} className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      {cat.category}: {cat.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}