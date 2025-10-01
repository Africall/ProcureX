import React from 'react'
import { usePredictiveInsights, useDashboardAction } from '../../hooks/useDashboard'

interface PredictiveInsightsWidgetProps {
  config?: {
    minConfidence?: number
    showActions?: boolean
  }
}

export const PredictiveInsightsWidget: React.FC<PredictiveInsightsWidgetProps> = ({ config }) => {
  const { data, isLoading, error } = usePredictiveInsights()
  const { mutate: executeAction } = useDashboardAction()

  if (isLoading) {
    return (
      <div className="h-full p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="h-full p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Failed to load predictive insights</p>
      </div>
    )
  }

  const filteredInsights = data.filter(
    insight => insight.confidence >= (config?.minConfidence || 70)
  )

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      reorder: '📦',
      supplier: '🏢',
      cost: '💰',
      maintenance: '🔧'
    }
    return icons[category as keyof typeof icons] || '🔮'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 dark:text-green-400'
    if (confidence >= 75) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  const handleAction = (insight: any) => {
    if (insight.suggestedAction && config?.showActions) {
      executeAction({
        action: insight.suggestedAction.action,
        params: insight.suggestedAction.params || {}
      })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Insights
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredInsights.length} predictions
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {filteredInsights.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">🔮</div>
            <p>No insights available</p>
            <p className="text-xs mt-1">Check back later for AI predictions</p>
          </div>
        ) : (
          <div className="p-2 space-y-3">
            {filteredInsights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(insight.category)}</span>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {insight.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getImpactColor(insight.impact)}`}>
                      {insight.impact.toUpperCase()}
                    </span>
                    <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                      {insight.confidence}%
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  {insight.rationale}
                </p>
                
                <p className="text-sm text-gray-800 dark:text-gray-200 mb-3">
                  💡 {insight.recommendation}
                </p>
                
                <div className="flex items-center justify-between">
                  {insight.daysAhead && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Predicted for {insight.daysAhead} days ahead
                    </span>
                  )}
                  
                  {config?.showActions && insight.suggestedAction && (
                    <button
                      onClick={() => handleAction(insight)}
                      className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                    >
                      {insight.suggestedAction.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}