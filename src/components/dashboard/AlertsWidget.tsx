import React from 'react'
import { useDashboardAlerts, useDashboardAction } from '../../hooks/useDashboard'

interface AlertsWidgetProps {
  config?: {
    showAcknowledged?: boolean
    maxAlerts?: number
  }
}

export const AlertsWidget: React.FC<AlertsWidgetProps> = ({ config }) => {
  const { data, isLoading, error } = useDashboardAlerts()
  const { mutate: executeAction } = useDashboardAction()

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
        <p className="text-red-600 dark:text-red-400">Failed to load alerts</p>
      </div>
    )
  }

  let filteredAlerts = data
  if (!config?.showAcknowledged) {
    filteredAlerts = data.filter(alert => !alert.acknowledged)
  }
  
  const displayAlerts = filteredAlerts.slice(0, config?.maxAlerts || 10)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'warn':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨'
      case 'warn': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  const handleAction = (alert: any) => {
    if (alert.cta) {
      executeAction({
        action: alert.cta.action,
        params: alert.cta.params || {}
      })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Alerts Center
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredAlerts.length} active
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {displayAlerts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <p>No active alerts</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {displayAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">
                    {getSeverityIcon(alert.severity)}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.title}
                    </h4>
                    {alert.detail && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {alert.detail}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                      
                      {alert.cta && (
                        <button
                          onClick={() => handleAction(alert)}
                          className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                          {alert.cta.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}