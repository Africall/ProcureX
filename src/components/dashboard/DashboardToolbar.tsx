import React from 'react'
import { useDashboardStore } from '../../stores/dashboardStore'
import { useRefreshDashboard } from '../../hooks/useDashboard'

export const DashboardToolbar: React.FC = () => {
  const { 
    isCustomizing, 
    setCustomizing, 
    showGrid, 
    setShowGrid,
    autoRefresh,
    setAutoRefresh,
    lastRefresh,
    resetLayout
  } = useDashboardStore()
  
  const refreshDashboard = useRefreshDashboard()

  const formatLastRefresh = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex items-center gap-3">
      {/* Last Refresh Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Last updated: {formatLastRefresh(lastRefresh)}
      </div>

      {/* Auto Refresh Toggle */}
      <button
        onClick={() => setAutoRefresh(!autoRefresh)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          autoRefresh
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        🔄 Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
      </button>

      {/* Manual Refresh */}
      <button
        onClick={() => refreshDashboard()}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
      >
        🔄 Refresh
      </button>

      {/* Grid Toggle */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          showGrid
            ? 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}
      >
        📐 Grid {showGrid ? 'ON' : 'OFF'}
      </button>

      {/* Customization Mode */}
      <button
        onClick={() => setCustomizing(!isCustomizing)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          isCustomizing
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}
      >
        ✏️ {isCustomizing ? 'Exit Edit' : 'Customize'}
      </button>

      {/* Save Layout (only when customizing) */}
      {isCustomizing && (
        <button
          onClick={() => {
            // TODO: Implement save layout modal
            console.log('Save layout modal')
          }}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
        >
          💾 Save Layout
        </button>
      )}

      {/* Reset Layout */}
      <button
        onClick={() => {
          const ok = window.confirm('Reset dashboard layout to defaults? This will clear your saved layout.')
          if (ok) resetLayout()
        }}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
      >
        ♻️ Reset Layout
      </button>
    </div>
  )
}