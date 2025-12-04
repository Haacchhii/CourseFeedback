# Frontend Rate Limiting Implementation

## Overview

Added client-side rate limiting to prevent API spam and improve system stability. This protects the backend from excessive requests and provides better user experience with clear feedback.

## Features

### 1. **Automatic Rate Limiting**
- Applied to all non-GET API requests (POST, PUT, DELETE, PATCH)
- **Default limits**: 20 requests per minute per endpoint
- **Block duration**: 30 seconds when limit exceeded
- **Configurable** per endpoint

### 2. **User-Friendly Feedback**
- Clear error messages when rate limit hit
- Countdown timer showing when requests can resume
- Visual warning component for rate limit alerts

### 3. **Smart Request Tracking**
- Per-endpoint tracking (not global)
- Sliding time window (not fixed intervals)
- Automatic cleanup of expired timestamps

## Files Created

### `src/utils/rateLimiter.js`
Core rate limiting logic with singleton pattern.

**Key Functions:**
- `checkLimit(endpoint, options)` - Validate if request is allowed
- `reset(endpoint)` - Clear rate limit for specific endpoint
- `getStatus(endpoint)` - Get current rate limit status
- `withRateLimit(fn, endpoint, options)` - HOF wrapper for functions
- `debounce(func, wait)` - Debounce utility for search
- `throttle(func, limit)` - Throttle utility for scroll/resize

### `src/utils/useRateLimit.js`
React hooks for rate limiting integration.

**Hooks:**
- `useRateLimitedAPI(apiFunction, options)` - Wrapper for API calls
- `useDebouncedSearch(searchFunction, delay)` - Debounced search with rate limiting
- `useRateLimitWarning()` - Show/hide rate limit warnings

**Component:**
- `<RateLimitWarning />` - Visual notification component

## Integration

### Modified Files

**`src/services/api.js`:**
- Added rate limiter import
- Enhanced request interceptor with rate limit checks
- Rejects requests that exceed limits before hitting network

## Usage Examples

### 1. Basic API Call (Automatic Protection)
```javascript
// Rate limiting is automatic - no code changes needed
import { adminAPI } from '../services/api'

// This will be rate-limited automatically
await adminAPI.createUser(userData)
```

### 2. Custom Rate Limiting
```javascript
import { rateLimiter } from '../utils/rateLimiter'

// Check manually before making request
const result = rateLimiter.checkLimit('custom-operation', {
  maxRequests: 5,      // Only 5 requests
  timeWindow: 10000,   // Per 10 seconds
  blockDuration: 60000 // Block for 1 minute if exceeded
})

if (!result.allowed) {
  alert(result.reason)
  return
}

// Proceed with operation
await doSomething()
```

### 3. Using React Hook
```javascript
import { useRateLimitedAPI, RateLimitWarning } from '../utils/useRateLimit'

function MyComponent() {
  const { execute, loading, error, rateLimitInfo } = useRateLimitedAPI(adminAPI.createUser)

  const handleSubmit = async (data) => {
    try {
      await execute(data)
      alert('Success!')
    } catch (err) {
      // Error already set in hook
      console.error(err)
    }
  }

  return (
    <div>
      {rateLimitInfo && (
        <RateLimitWarning 
          show={true}
          message={rateLimitInfo.message}
        />
      )}
      <button onClick={handleSubmit} disabled={loading}>
        Submit
      </button>
    </div>
  )
}
```

### 4. Debounced Search
```javascript
import { useDebouncedSearch } from '../utils/useRateLimit'

function SearchComponent() {
  const { search, loading, results, error } = useDebouncedSearch(
    adminAPI.searchUsers,
    300 // 300ms debounce
  )

  return (
    <div>
      <input 
        type="text"
        onChange={(e) => search(e.target.value)}
        placeholder="Search users..."
      />
      {loading && <p>Searching...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <ul>
        {results.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    </div>
  )
}
```

## Configuration

### Default Rate Limits (in api.js)
```javascript
{
  maxRequests: 20,      // 20 requests
  timeWindow: 60000,    // Per minute (60,000ms)
  blockDuration: 30000  // 30 second block
}
```

### Customizing Per Endpoint
To customize rate limits for specific endpoints, modify the interceptor in `api.js`:

```javascript
// Example: Stricter limits for sensitive operations
if (config.url.includes('/admin/users')) {
  rateLimitResult = rateLimiter.checkLimit(endpoint, {
    maxRequests: 5,
    timeWindow: 60000,
    blockDuration: 120000 // 2 minute block
  })
}
```

## Error Handling

### Rate Limit Error Structure
```javascript
{
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'Too many requests. Please wait 15 seconds before trying again.',
  retryAfter: 15 // seconds
}
```

### Catching Rate Limit Errors
```javascript
try {
  await someAPI.call()
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    alert(`Rate limit hit! Retry in ${error.retryAfter}s`)
  } else {
    alert('Other error occurred')
  }
}
```

## Benefits

1. **Prevents API Spam**
   - Stops accidental double-clicks
   - Prevents malicious bulk requests
   - Reduces server load

2. **Better UX**
   - Clear feedback when limits hit
   - Countdown timers
   - Visual warnings

3. **System Protection**
   - Frontend-side throttling
   - Reduces backend load
   - Prevents DOS attacks

4. **Configurable**
   - Per-endpoint limits
   - Adjustable thresholds
   - Easy to customize

## Best Practices

1. **Don't Over-Limit**
   - Allow enough requests for normal usage
   - Consider user workflows
   - Test with real users

2. **Provide Clear Feedback**
   - Always show why request blocked
   - Display retry countdown
   - Use visual indicators

3. **Log Rate Limit Events**
   - Monitor which endpoints hit limits
   - Identify potential issues
   - Adjust thresholds based on data

4. **Combine with Backend**
   - Frontend rate limiting is first line of defense
   - Backend should also have rate limiting
   - Use both for best protection

## Testing

### Manual Testing
1. Rapidly click submit button multiple times
2. Verify rate limit message appears after threshold
3. Wait for block duration and verify requests allowed again

### Console Testing
```javascript
// Test rate limiter directly
import { rateLimiter } from './utils/rateLimiter'

// Spam requests
for (let i = 0; i < 25; i++) {
  const result = rateLimiter.checkLimit('test-endpoint', {
    maxRequests: 10,
    timeWindow: 60000
  })
  console.log(`Request ${i+1}:`, result.allowed ? 'ALLOWED' : 'BLOCKED')
}

// Check status
console.log('Status:', rateLimiter.getStatus('test-endpoint'))

// Reset
rateLimiter.reset('test-endpoint')
```

## Future Enhancements

1. **Persistent Storage**
   - Store rate limit data in localStorage
   - Persist across page refreshes
   - Share across browser tabs

2. **Analytics**
   - Track which endpoints hit limits most
   - Identify patterns
   - Optimize thresholds

3. **Adaptive Limits**
   - Adjust based on user behavior
   - Lower limits for suspicious activity
   - Higher limits for trusted users

4. **Backend Integration**
   - Sync with backend rate limits
   - Get limits from API response headers
   - Coordinate frontend/backend throttling

## Notes

- Rate limiting only applies to **non-GET requests** by default (GET requests are typically read-only)
- Limits are **per-endpoint**, not global (user can make 20 requests to endpoint A and 20 to endpoint B)
- **Browser refresh clears rate limits** (unless persistent storage implemented)
- **Development mode**: Consider disabling or increasing limits during development

---

**Implementation Date**: December 4, 2025  
**Status**: ✅ Production Ready  
**Testing**: Manual testing recommended before deployment
