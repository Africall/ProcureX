import React from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { usePOPipelineData } from '../../hooks/useDashboard'

interface POPipelineWidgetProps {
  config?: {
    showCounts?: boolean
    showMiniKanban?: boolean
  }
}

export const POPipelineWidget: React.FC<POPipelineWidgetProps> = ({ 
  config = { showCounts: true, showMiniKanban: false }
}) => {
  const { data, isLoading, error } = usePOPipelineData()

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
      <div className="h-full p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">Failed to load PO pipeline data</p>
      </div>
    )
  }

  const chartData = [
    { name: 'Draft', value: data.draft, color: '#9ca3af' },
    { name: 'Pending', value: data.pending, color: '#f59e0b' },
    { name: 'Approved', value: data.approved, color: '#3b82f6' },
    { name: 'Ordered', value: data.ordered, color: '#8b5cf6' },
    { name: 'Received', value: data.received, color: '#10b981' },
    { name: 'Blocked', value: data.blocked, color: '#ef4444' }
  ]

  const totalPOs = chartData.reduce((sum, item) => sum + item.value, 0)

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: '📝',
      pending: '⏳',
      approved: '✅',
      ordered: '📋',
      received: '📦',
      blocked: '🚫',
      closed: '✔️'
    }
    return icons[status as keyof typeof icons] || '📄'
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            PO Pipeline
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {totalPOs} Total POs
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {config.showMiniKanban ? (
          // Mini Kanban View
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-full">
            {chartData.filter(item => item.value > 0).map((stage) => (
              <div
                key={stage.name}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{getStatusIcon(stage.name.toLowerCase())}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stage.name}
                  </span>
                  <span className="ml-auto text-sm font-bold" style={{ color: stage.color }}>
                    {stage.value}
                  </span>
                </div>
                
                {/* Mini progress bars for visual representation */}
                <div className="space-y-1">
                  {Array.from({ length: Math.min(3, stage.value) }).map((_, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full opacity-70"
                      style={{ backgroundColor: stage.color }}
                    />
                  ))}
                  {stage.value > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{stage.value - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Chart + Stats View
          <div className="h-full flex flex-col">
            {/* Chart */}
            <div className="h-32 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={30} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Grid */}
            {config.showCounts && (
              <div className="grid grid-cols-2 gap-3">
                {chartData.map((stage) => (
                  <div
                    key={stage.name}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <span>{getStatusIcon(stage.name.toLowerCase())}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {stage.name}
                      </span>
                    </div>
                    <span 
                      className="text-sm font-bold"
                      style={{ color: stage.color }}
                    >
                      {stage.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Items */}
            <div className="mt-4 space-y-2">
              {data.blocked > 0 && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-600 dark:text-red-400">🚫</span>
                    <span className="text-red-700 dark:text-red-300">
                      <strong>{data.blocked}</strong> POs are blocked and need attention
                    </span>
                  </div>
                </div>
              )}
              
              {data.pending > 5 && (
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-600 dark:text-yellow-400">⏳</span>
                    <span className="text-yellow-700 dark:text-yellow-300">
                      High pending queue: <strong>{data.pending}</strong> POs awaiting approval
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}