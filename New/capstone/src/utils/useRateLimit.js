/**
 * React Hooks for Rate Limiting
 * Provides user-friendly feedback when rate limits are hit
 */

import { useState, useCallback, useRef } from 'react'
import { rateLimiter } from './rateLimiter'

/**
 * Hook for rate-limited API calls with user feedback
 * @param {Function} apiFunction - API function to call
 * @param {Object} options - Rate limit options
 * @returns {Object} { execute, loading, error, rateLimitInfo }
 */
export function useRateLimitedAPI(apiFunction, options = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rateLimitInfo, setRateLimitInfo] = useState(null)
  const lastCallTime = useRef(null)

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      setRateLimitInfo(null)

      const result = await apiFunction(...args)
      lastCallTime.current = Date.now()
      
      return result
    } catch (err) {
      // Check if it's a rate limit error
      if (err.code === 'RATE_LIMIT_EXCEEDED') {
        setRateLimitInfo({
          message: err.message,
          retryAfter: err.retryAfter
        })
        setError(`Rate limit exceeded. Please wait ${err.retryAfter} seconds.`)
      } else {
        setError(err.message || 'An error occurred')
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  return { execute, loading, error, rateLimitInfo }
}

/**
 * Hook for debounced search with rate limiting
 * @param {Function} searchFunction - Search API function
 * @param {number} debounceMs - Debounce delay in milliseconds
 * @returns {Object} { search, loading, results, error }
 */
export function useDebouncedSearch(searchFunction, debounceMs = 300) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const debounceTimeout = useRef(null)
  const lastQuery = useRef('')

  const search = useCallback((query) => {
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Don't search for empty queries
    if (!query || query.trim() === '') {
      setResults([])
      setLoading(false)
      return
    }

    // Don't search if query hasn't changed
    if (query === lastQuery.current) {
      return
    }

    setLoading(true)
    setError(null)

    // Debounce the search
    debounceTimeout.current = setTimeout(async () => {
      try {
        const data = await searchFunction(query)
        setResults(data)
        lastQuery.current = query
      } catch (err) {
        if (err.code === 'RATE_LIMIT_EXCEEDED') {
          setError(`Too many searches. Please wait ${err.retryAfter} seconds.`)
        } else {
          setError(err.message || 'Search failed')
        }
        setResults([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)
  }, [searchFunction, debounceMs])

  return { search, loading, results, error }
}

/**
 * Hook for showing rate limit warnings to users
 * @returns {Object} { showWarning, warningMessage, clearWarning }
 */
export function useRateLimitWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const warningTimeout = useRef(null)

  const displayWarning = useCallback((message, duration = 5000) => {
    setWarningMessage(message)
    setShowWarning(true)

    // Clear previous timeout
    if (warningTimeout.current) {
      clearTimeout(warningTimeout.current)
    }

    // Auto-hide after duration
    warningTimeout.current = setTimeout(() => {
      setShowWarning(false)
    }, duration)
  }, [])

  const clearWarning = useCallback(() => {
    setShowWarning(false)
    if (warningTimeout.current) {
      clearTimeout(warningTimeout.current)
    }
  }, [])

  return { showWarning, warningMessage, displayWarning, clearWarning }
}

/**
 * Component for displaying rate limit warnings
 */
export function RateLimitWarning({ show, message, onClose }) {
  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-yellow-800 font-medium">
              Rate Limit Warning
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              {message}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-3 flex-shrink-0 text-yellow-400 hover:text-yellow-500"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
