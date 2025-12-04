import React from 'react'

/**
 * Reusable Pagination Component with LPU Red Theme
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total number of items
 * @param {function} onPageChange - Callback when page changes
 * @param {string} itemLabel - Label for items (e.g., "courses", "users", "students")
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemLabel = "items"
}) => {
  if (totalPages <= 1) return null

  const renderPageNumbers = () => {
    const pages = []
    
    // Show current page and up to 2 additional pages (like the image shows: 1, 2, 3)
    for (let i = currentPage; i <= Math.min(currentPage + 2, totalPages); i++) {
      pages.push(i)
    }
    
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-0 px-4 py-3">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm text-black border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        style={{ borderRadius: '5px', margin: '0 4px' }}
        aria-label="Previous page"
      >
        «
      </button>

      {/* Page Numbers */}
      {renderPageNumbers().map((page, idx) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm border border-gray-300 transition-colors ${
            currentPage === page
              ? 'bg-[#7a0000] text-white'
              : 'text-black hover:bg-gray-50'
          }`}
          style={{ borderRadius: '5px', margin: '0 4px' }}
          aria-label={`Go to page ${page}`}
          aria-current={currentPage === page ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm text-black border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        style={{ borderRadius: '5px', margin: '0 4px' }}
        aria-label="Next page"
      >
        »
      </button>
    </div>
  )
}

export default Pagination
