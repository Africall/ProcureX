import React from 'react'
import { useFilteredActivity } from '../../hooks/useDashboard'

interface ActivityWidgetProps {
  config?: {
    showDetails?: boolean
    maxItems?: number
  }
}

export const ActivityWidget: React.FC<ActivityWidgetProps> = ({ config }) => {
  const data = useFilteredActivity()

  if (!data) {
    return (
      <div className="h-full p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const displayItems = data.slice(0, config?.maxItems || 15)

  const getActivityIcon = (type: string) => {
    const icons = {
      ISSUE: '📤',
      RECEIVE: '📥',
      FAULTY: '❌',
      PO_CREATED: '📋',
      PO_APPROVED: '✅',
      ADJUST: '🔧',
      SUPPLIER_UPDATE: '🏢'
    }
    return icons[type as keyof typeof icons] || '📝'
  }

  const getActivityColor = (type: string) => {
    const colors = {
      ISSUE: 'text-blue-600 dark:text-blue-400',
      RECEIVE: 'text-green-600 dark:text-green-400',
      FAULTY: 'text-red-600 dark:text-red-400',
      PO_CREATED: 'text-purple-600 dark:text-purple-400',
      PO_APPROVED: 'text-green-600 dark:text-green-400',
      ADJUST: 'text-orange-600 dark:text-orange-400',
      SUPPLIER_UPDATE: 'text-gray-600 dark:text-gray-400'
    }
    return colors[type as keyof typeof colors] || 'text-gray-600 dark:text-gray-400'
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
      </div>
      
      <div className="flex-1 overflow-auto">
        {displayItems.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📝</div>
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="p-2">
            {displayItems.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                      {activity.actor}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(activity.when)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {activity.summary}
                  </p>
                  
                  {config?.showDetails && activity.details && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {Object.entries(activity.details).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Timeline connector */}
                {index < displayItems.length - 1 && (
                  <div className="absolute left-7 mt-8 w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}