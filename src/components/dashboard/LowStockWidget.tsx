import React from 'react'
import { useFilteredLowStock, useDashboardAction } from '../../hooks/useDashboard'

interface LowStockWidgetProps {
  config?: {
    showHeatmap?: boolean
    maxItems?: number
  }
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({ 
  config = { showHeatmap: true, maxItems: 10 }
}) => {
  const data = useFilteredLowStock()
  const { mutate: executeAction } = useDashboardAction()

  const handleCreatePO = (itemId: string, itemName: string) => {
    executeAction({
      action: 'create_po',
      params: { itemId, reason: 'low_stock_reorder' }
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨'
      case 'warning':
        return '⚠️'
      case 'low':
        return '📋'
      default:
        return '📦'
    }
  }

  if (!data) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const displayItems = data.items.slice(0, config.maxItems || 10)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Low Stock Alert
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded-full">
              {data.critical} Critical
            </span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 rounded-full">
              {data.warning} Warning
            </span>
          </div>
        </div>
        
        {/* Summary Stats */}
        {config.showHeatmap && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-red-50 dark:bg-red-900/10 rounded">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">{data.critical}</div>
              <div className="text-xs text-red-500 dark:text-red-400">Critical</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded">
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{data.warning}</div>
              <div className="text-xs text-yellow-500 dark:text-yellow-400">Warning</div>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.low}</div>
              <div className="text-xs text-blue-500 dark:text-blue-400">Low</div>
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-auto">
        {displayItems.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <p>All items are well stocked!</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(item.severity)}`}>
                        {getSeverityIcon(item.severity)} {item.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {item.sku}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Available: <strong>{item.available}</strong></span>
                      <span>ROP: <strong>{item.rop}</strong></span>
                      {item.estimatedDaysLeft && (
                        <span className="text-orange-600 dark:text-orange-400">
                          ~{item.estimatedDaysLeft} days left
                        </span>
                      )}
                    </div>
                    
                    {item.supplier && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Supplier: {item.supplier}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleCreatePO(item.id, item.name)}
                    className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors flex-shrink-0"
                  >
                    Create PO
                  </button>
                </div>

                {/* Stock Level Bar */}
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Stock Level:</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.severity === 'critical' ? 'bg-red-500' :
                          item.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, (item.available / item.rop) * 100)}%` }}
                      />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 min-w-0 w-10 text-right">
                      {Math.round((item.available / item.rop) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {data.items.length > (config.maxItems || 10) && (
              <div className="p-3 text-center">
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  View {data.items.length - (config.maxItems || 10)} more items
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}