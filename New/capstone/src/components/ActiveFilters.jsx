import React from 'react'

/**
 * ActiveFilters Component
 * Displays currently active filters with clear buttons
 * Shows filtered results count
 * 
 * @param {Object} props
 * @param {Object} props.filters - Object containing active filter values { filterName: value }
 * @param {Object} props.filterLabels - Object mapping filter keys to display labels
 * @param {Function} props.onClearFilter - Callback when single filter is cleared (filterKey)
 * @param {Function} props.onClearAll - Callback when all filters are cleared
 * @param {number} props.totalResults - Total number of results after filtering
 * @param {string} props.itemLabel - Label for items (e.g., "courses", "students", "evaluations")
 * @param {Object} props.filterOptions - Optional object mapping filter keys to arrays of {value, label} objects for display
 */
export default function ActiveFilters({
  filters = {},
  filterLabels = {},
  onClearFilter,
  onClearAll,
  totalResults,
  itemLabel = 'items',
  filterOptions = {}
}) {
  // Get active filters (excluding 'all' values and empty values)
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => value && value !== 'all' && value !== ''
  )

  // If no active filters, don't render anything
  if (activeFilters.length === 0) {
    return null
  }

  // Get display value for a filter
  const getFilterDisplayValue = (key, value) => {
    // If we have filter options, look up the label
    if (filterOptions[key]) {
      const option = filterOptions[key].find(opt => 
        opt.value === value || opt.id === value || opt.value === parseInt(value)
      )
      if (option) {
        return option.label || option.name || option.program_name || option.program_code || value
      }
    }
    
    // Otherwise just return the value
    return value
  }

  return (
    <div className="bg-gradient-to-r from-[#9D1535]/10 to-[#7D1028]/10 rounded-lg border-2 border-[#9D1535]/30 p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Active Filters List */}
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-semibold text-gray-700 mr-2">
              Active Filters:
            </span>
            
            {activeFilters.map(([key, value]) => (
              <div
                key={key}
                className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 text-sm font-medium text-gray-700 border border-[#9D1535]/30 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <span className="text-[#9D1535] font-semibold">
                  {filterLabels[key] || key}:
                </span>
                <span className="text-gray-900">
                  {getFilterDisplayValue(key, value)}
                </span>
                <button
                  onClick={() => onClearFilter(key)}
                  className="ml-1 text-gray-400 hover:text-[#9D1535] transition-colors duration-200"
                  aria-label={`Clear ${filterLabels[key] || key} filter`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Results Count and Clear All Button */}
        <div className="flex items-center gap-4">
          {totalResults !== undefined && (
            <div className="text-sm font-medium text-gray-700">
              <span className="text-[#9D1535] font-bold text-lg">{totalResults}</span>{' '}
              {itemLabel} found
            </div>
          )}
          
          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9D1535] to-[#7D1028] hover:from-[#7D1028] hover:to-[#5D0C1F] text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}
