import React from 'react'
import { useDashboardStore } from '../../stores/dashboardStore'

export const DashboardFilters: React.FC = () => {
  const { filters, setFilters, resetFilters } = useDashboardStore()

  const handleDatePresetChange = (preset: string) => {
    const now = new Date()
    let from: Date

    switch (preset) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        return
    }

    setFilters({
      dateRange: {
        from: from.toISOString(),
        to: now.toISOString(),
        preset: preset as any
      }
    })
  }

  const activeFiltersCount = [
    filters.category,
    filters.supplier,
    filters.technician,
    filters.site
  ].filter(Boolean).length

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Date Range Presets */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
        <div className="flex items-center gap-1">
          {(['today', '7d', '30d', '90d'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => handleDatePresetChange(preset)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filters.dateRange.preset === preset
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {preset === 'today' ? 'Today' : preset.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</label>
        <select
          value={filters.category || ''}
          onChange={(e) => setFilters({ category: e.target.value || undefined })}
          className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Networking">Networking</option>
          <option value="Safety">Safety</option>
          <option value="Tools">Tools</option>
          <option value="Hardware">Hardware</option>
          <option value="Electrical">Electrical</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      {/* Supplier Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Supplier:</label>
        <select
          value={filters.supplier || ''}
          onChange={(e) => setFilters({ supplier: e.target.value || undefined })}
          className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Suppliers</option>
          <option value="TechFlow Solutions">TechFlow Solutions</option>
          <option value="Global Parts Co">Global Parts Co</option>
          <option value="SafetyFirst Supplies">SafetyFirst Supplies</option>
          <option value="ElectroSupply Co">ElectroSupply Co</option>
          <option value="FastenerHub">FastenerHub</option>
        </select>
      </div>

      {/* Technician Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Technician:</label>
        <select
          value={filters.technician || ''}
          onChange={(e) => setFilters({ technician: e.target.value || undefined })}
          className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Technicians</option>
          <option value="John Smith">John Smith</option>
          <option value="Sarah Davis">Sarah Davis</option>
          <option value="Mike Johnson">Mike Johnson</option>
        </select>
      </div>

      {/* Site Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Site:</label>
        <select
          value={filters.site || ''}
          onChange={(e) => setFilters({ site: e.target.value || undefined })}
          className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Sites</option>
          <option value="Site A">Site A</option>
          <option value="Site B">Site B</option>
          <option value="Site C">Site C</option>
          <option value="Warehouse">Warehouse</option>
        </select>
      </div>

      {/* Active Filters Badge & Reset */}
      <div className="flex items-center gap-2 ml-auto">
        {activeFiltersCount > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-xs font-medium rounded-full">
            {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
          </span>
        )}
        
        <button
          onClick={resetFilters}
          className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          🗑️ Reset
        </button>
      </div>
    </div>
  )
}