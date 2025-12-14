import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable Pagination Component with LPU Red Theme
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total number of items
 * @param {function} onPageChange - Callback when page changes
 * @param {string} itemLabel - Label for items (e.g., "courses", "users", "students")
 * @param {number} itemsPerPage - Items per page (optional, for "Show X per page")
 * @param {function} onItemsPerPageChange - Callback when items per page changes (optional)
 * @param {boolean} showItemsPerPage - Whether to show items per page selector
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemLabel = "items",
  itemsPerPage = 10,
  onItemsPerPageChange,
  showItemsPerPage = true
}) => {
  if (totalPages <= 1 && !showItemsPerPage) return null

  const startItem = ((currentPage - 1) * itemsPerPage) + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const renderPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    let startPage, endPage
    if (totalPages <= maxVisible) {
      startPage = 1
      endPage = totalPages
    } else if (currentPage <= 3) {
      startPage = 1
      endPage = maxVisible
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - maxVisible + 1
      endPage = totalPages
    } else {
      startPage = currentPage - 2
      endPage = currentPage + 2
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return pages
  }

  return (
    <div className="p-4 lg:p-6 border-t border-gray-200 bg-gray-50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Items per page selector */}
        {showItemsPerPage && onItemsPerPageChange ? (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7a0000] focus:border-[#7a0000]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        ) : (
          <div></div>
        )}
        
        {/* Page info */}
        <div className="text-sm text-gray-600">
          Showing {startItem} to {endItem} of {totalItems} {itemLabel}
        </div>
        
        {/* Pagination buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            First
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {renderPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-[#7a0000] text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  )
}

export default Pagination
