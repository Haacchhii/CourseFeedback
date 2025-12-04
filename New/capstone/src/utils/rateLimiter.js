/**
 * Frontend Rate Limiter
 * Prevents API spam by throttling requests to the same endpoint
 */

class RateLimiter {
  constructor() {
    this.requestCounts = new Map()
    this.requestTimestamps = new Map()
    this.blockedUntil = new Map()
  }

  /**
   * Check if request is allowed based on rate limits
   * @param {string} endpoint - API endpoint identifier
   * @param {Object} options - Rate limit options
   * @param {number} options.maxRequests - Maximum requests allowed in time window (default: 10)
   * @param {number} options.timeWindow - Time window in milliseconds (default: 60000 = 1 minute)
   * @param {number} options.blockDuration - How long to block after exceeding limit in ms (default: 60000)
   * @returns {Object} { allowed: boolean, reason: string, retryAfter: number }
   */
  checkLimit(endpoint, options = {}) {
    const {
      maxRequests = 10,
      timeWindow = 60000, // 1 minute
      blockDuration = 60000 // 1 minute block
    } = options

    const now = Date.now()

    // Check if currently blocked
    const blockedUntil = this.blockedUntil.get(endpoint)
    if (blockedUntil && now < blockedUntil) {
      const retryAfter = Math.ceil((blockedUntil - now) / 1000)
      return {
        allowed: false,
        reason: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter
      }
    }

    // Clear block if expired
    if (blockedUntil && now >= blockedUntil) {
      this.blockedUntil.delete(endpoint)
      this.requestCounts.delete(endpoint)
      this.requestTimestamps.delete(endpoint)
    }

    // Get request history
    const timestamps = this.requestTimestamps.get(endpoint) || []
    
    // Remove timestamps outside the time window
    const recentTimestamps = timestamps.filter(ts => now - ts < timeWindow)
    
    // Check if limit exceeded
    if (recentTimestamps.length >= maxRequests) {
      const oldestTimestamp = recentTimestamps[0]
      const retryAfter = Math.ceil((oldestTimestamp + timeWindow - now) / 1000)
      
      // Block the endpoint
      this.blockedUntil.set(endpoint, now + blockDuration)
      
      console.warn(`[RateLimiter] Rate limit exceeded for ${endpoint}. Blocked for ${blockDuration/1000}s`)
      
      return {
        allowed: false,
        reason: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
        retryAfter
      }
    }

    // Allow request and record timestamp
    recentTimestamps.push(now)
    this.requestTimestamps.set(endpoint, recentTimestamps)
    
    const count = (this.requestCounts.get(endpoint) || 0) + 1
    this.requestCounts.set(endpoint, count)

    return {
      allowed: true,
      reason: 'Request allowed',
      remaining: maxRequests - recentTimestamps.length
    }
  }

  /**
   * Reset rate limit for specific endpoint
   * @param {string} endpoint - API endpoint identifier
   */
  reset(endpoint) {
    this.requestCounts.delete(endpoint)
    this.requestTimestamps.delete(endpoint)
    this.blockedUntil.delete(endpoint)
  }

  /**
   * Clear all rate limits
   */
  resetAll() {
    this.requestCounts.clear()
    this.requestTimestamps.clear()
    this.blockedUntil.clear()
  }

  /**
   * Get current status for endpoint
   * @param {string} endpoint - API endpoint identifier
   * @returns {Object} Status information
   */
  getStatus(endpoint) {
    const now = Date.now()
    const blockedUntil = this.blockedUntil.get(endpoint)
    const timestamps = this.requestTimestamps.get(endpoint) || []
    const count = this.requestCounts.get(endpoint) || 0

    return {
      isBlocked: blockedUntil && now < blockedUntil,
      blockedUntil: blockedUntil || null,
      requestCount: count,
      recentRequests: timestamps.length
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter()

/**
 * Higher-order function to add rate limiting to async functions
 * @param {Function} fn - Async function to rate limit
 * @param {string} endpoint - Endpoint identifier
 * @param {Object} options - Rate limit options
 * @returns {Function} Rate-limited function
 */
export function withRateLimit(fn, endpoint, options = {}) {
  return async function(...args) {
    const result = rateLimiter.checkLimit(endpoint, options)
    
    if (!result.allowed) {
      throw new Error(result.reason)
    }

    return fn(...args)
  }
}

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for scroll/resize handlers
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 100) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export default rateLimiter
