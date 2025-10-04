import React from 'react'
import { useFormatCurrency } from '../../utils/currency'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useDashboardKPIs } from '../../hooks/useDashboard'
import { Kpi } from '../../schema/dashboard'

interface SparklineProps {
  data: number[]
  trend: 'up' | 'down' | 'flat'
}

const Sparkline: React.FC<SparklineProps> = ({ data, trend }) => {
  const chartData = data.map((value, index) => ({ x: index, y: value }))
  
  const color = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'
  
  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface KPICardProps {
  kpi: Kpi
}

const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  const formatCurrency = useFormatCurrency()

  const formatValue = (value: number, key: string) => {
    switch (key) {
      case 'spend':
        // spend is a monetary value
        return formatCurrency(value)
      case 'items':
      case 'lowStock':
      case 'pendingPOs':
      case 'issuesToday':
      case 'faultyItems':
        return value.toLocaleString()
      default:
        return value.toString()
    }
  }

  const getKPILabel = (key: string) => {
    const labels = {
      items: 'Total Items',
      lowStock: 'Low Stock Items',
      pendingPOs: 'Pending POs',
      issuesToday: 'Issues Today',
      faultyItems: 'Faulty Items',
      spend: 'Monthly Spend'
    }
    return labels[key as keyof typeof labels] || key
  }

  const getKPIIcon = (key: string) => {
    const icons = {
      items: '📦',
      lowStock: '⚠️',
      pendingPOs: '📄',
      issuesToday: '🔧',
      faultyItems: '❌',
      spend: '💰'
    }
    return icons[key as keyof typeof icons] || '📊'
  }

  const trendColor = kpi.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                     kpi.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                     'text-gray-500 dark:text-gray-400'

  const trendIcon = kpi.trend === 'up' ? '↗️' :
                    kpi.trend === 'down' ? '↘️' : '➡️'

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getKPIIcon(kpi.key)}</span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {getKPILabel(kpi.key)}
          </span>
        </div>
        {kpi.sparkline && (
          <Sparkline data={kpi.sparkline} trend={kpi.trend || 'flat'} />
        )}
      </div>
      
      <div className="mt-2 flex items-end justify-between">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatValue(kpi.value, kpi.key)}
        </div>
        
        {typeof kpi.deltaPct === 'number' && isFinite(kpi.deltaPct) && (
          <div className={`text-sm flex items-center gap-1 ${trendColor}`}>
            <span>{trendIcon}</span>
            <span>{Math.abs(kpi.deltaPct).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

export const KPICards: React.FC = () => {
  const { data: kpis, isLoading, error } = useDashboardKPIs()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">Failed to load KPI data</p>
      </div>
    )
  }

  if (!kpis || kpis.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No KPI data available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.key} kpi={kpi} />
      ))}
    </div>
  )
}