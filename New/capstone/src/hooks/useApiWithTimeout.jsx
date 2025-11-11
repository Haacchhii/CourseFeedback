// Custom hook for API calls with timeout and error handling
import { useState, useEffect } from 'react'

/**
 * Custom hook for fetching data with automatic timeout and error handling
 * @param {Function} fetchFunction - Async function that fetches data
 * @param {Array} dependencies - Dependencies array for useEffect
 * @param {number} timeout - Timeout in milliseconds (default: 30000 = 30 seconds)
 * @returns {Object} - { data, loading, error, retry }
 */
export function useApiWithTimeout(fetchFunction, dependencies = [], timeout = 30000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const retry = () => {
    setRetryCount(prev => prev + 1)
    setError(null)
    setLoading(true)
  }

  useEffect(() => {
    let isMounted = true
    let timeoutId

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Set up timeout
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Request timed out. Please check your connection and try again.'))
          }, timeout)
        })

        // Race between fetch and timeout
        const result = await Promise.race([fetchFunction(), timeoutPromise])

        if (isMounted) {
          clearTimeout(timeoutId)
          setData(result)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          clearTimeout(timeoutId)
          console.error('API Error:', err)
          setError(err.message || 'An unexpected error occurred')
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [...dependencies, retryCount])

  return { data, loading, error, retry }
}

/**
 * Loading component to show during data fetch
 */
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#7a0000] mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}

/**
 * Error component to show when data fetch fails
 */
export function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Oops! Something went wrong</h2>
        <p className="mt-2 text-gray-600">{error}</p>
        <div className="mt-6 space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-6 py-3 bg-[#7a0000] text-white rounded-lg hover:bg-[#5a0000] transition-colors font-medium"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Empty state component when no data is available
 */
export function EmptyState({ message = 'No data available', icon = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon || (
        <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )}
      <h3 className="mt-4 text-xl font-semibold text-gray-700">{message}</h3>
      <p className="mt-2 text-gray-500 text-center max-w-md">
        There's nothing to display right now. Try checking back later or contact your administrator if you believe this is an error.
      </p>
    </div>
  )
}
