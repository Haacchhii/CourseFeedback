# Sentry Integration Guide (Optional)

## Overview

Sentry provides real-time error tracking and monitoring for production applications. This guide shows how to integrate Sentry into the Course Feedback System.

## Setup

### 1. Install Sentry SDK

```bash
cd New/capstone
npm install @sentry/react
```

### 2. Create Sentry Account
1. Go to https://sentry.io/signup/
2. Create a new project (React)
3. Copy your DSN (Data Source Name)

### 3. Add Environment Variable

**`.env`:**
```env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_ENVIRONMENT=production  # or development, staging
```

## Implementation

### 1. Initialize Sentry

Create `src/config/sentry.js`:

```javascript
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

export function initSentry() {
  // Only initialize in production or if explicitly enabled
  if (import.meta.env.VITE_ENVIRONMENT !== 'production' && !import.meta.env.VITE_SENTRY_ENABLED) {
    console.log('Sentry disabled (not in production)')
    return
  }

  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured')
    return
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    
    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: ['localhost', /^\//],
      }),
    ],
    
    // Sample rate for performance monitoring
    tracesSampleRate: 1.0, // 100% in production, adjust as needed
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    
    // Filter out errors
    beforeSend(event, hint) {
      // Don't send errors for 401 (unauthorized) - these are expected
      if (hint.originalException?.response?.status === 401) {
        return null
      }
      
      // Don't send rate limit errors
      if (hint.originalException?.code === 'RATE_LIMIT_EXCEEDED') {
        return null
      }
      
      return event
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      // Network errors
      'NetworkError',
      'Failed to fetch',
    ],
  })

  // Set user context when available
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
      role: user.role,
    })
  }
}
```

### 2. Update main.jsx

**`src/main.jsx`:**

```javascript
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { initSentry } from './config/sentry'
import './styles/tailwind.css'
import './styles/responsive-fixes.css'

// Initialize Sentry before rendering
initSentry()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
```

### 3. Wrap ErrorBoundary with Sentry

**`src/components/ErrorBoundary.jsx`:**

```javascript
import React from 'react'
import * as Sentry from '@sentry/react'

// Wrap ErrorBoundary with Sentry
const ErrorBoundary = Sentry.withErrorBoundary(
  class ErrorBoundaryComponent extends React.Component {
    constructor(props) {
      super(props)
      this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
      return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
      console.error('Error caught by boundary:', error, errorInfo)
      this.setState({ error, errorInfo })
      
      // Send to Sentry
      Sentry.captureException(error, { contexts: { react: errorInfo } })
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
            <div className="max-w-2xl bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                ⚠️ Something went wrong
              </h1>
              <div className="bg-red-100 border border-red-300 rounded p-4 mb-4">
                <p className="font-mono text-sm text-red-800">
                  {this.state.error && this.state.error.toString()}
                </p>
              </div>
              {this.state.errorInfo && (
                <details className="bg-gray-100 p-4 rounded">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Stack trace
                  </summary>
                  <pre className="text-xs overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      }

      return this.props.children
    }
  },
  {
    fallback: ({ error, resetError }) => (
      <div className="p-8 text-center">
        <h1>Application Error</h1>
        <p>{error.message}</p>
        <button onClick={resetError}>Try again</button>
      </div>
    ),
  }
)

export default ErrorBoundary
```

### 4. Manual Error Reporting

**Capture specific errors:**

```javascript
import * as Sentry from '@sentry/react'

try {
  // Risky operation
  await someAPI.call()
} catch (error) {
  // Log to Sentry with context
  Sentry.captureException(error, {
    tags: {
      section: 'enrollment',
      action: 'bulk-import'
    },
    extra: {
      studentCount: students.length,
      timestamp: new Date().toISOString()
    }
  })
  
  // Still show error to user
  alert('Import failed')
}
```

**Custom breadcrumbs:**

```javascript
import * as Sentry from '@sentry/react'

// Add breadcrumb before action
Sentry.addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to evaluation form',
  level: 'info'
})

// Add breadcrumb with data
Sentry.addBreadcrumb({
  category: 'api',
  message: 'Submitting evaluation',
  data: {
    courseId: 123,
    studentId: 456
  }
})
```

## Features to Enable

### 1. Performance Monitoring

Track page load times, component render times, API call duration:

```javascript
import * as Sentry from '@sentry/react'

// Track custom transaction
const transaction = Sentry.startTransaction({
  name: 'Evaluation Submission',
  op: 'submit'
})

try {
  await submitEvaluation(data)
  transaction.setStatus('ok')
} catch (error) {
  transaction.setStatus('error')
  throw error
} finally {
  transaction.finish()
}
```

### 2. Session Replay

Replay user sessions to see what happened before errors:

```javascript
integrations: [
  new Sentry.Replay({
    maskAllText: true, // Privacy protection
    blockAllMedia: true,
  }),
],
replaysSessionSampleRate: 0.1, // 10% of sessions
replaysOnErrorSampleRate: 1.0, // 100% of error sessions
```

### 3. User Feedback

Let users report issues:

```javascript
import * as Sentry from '@sentry/react'

function ReportIssueButton() {
  const handleReport = () => {
    Sentry.showReportDialog({
      eventId: Sentry.lastEventId(),
      title: 'Report an Issue',
      subtitle: 'Help us improve the system',
      subtitle2: 'What went wrong?',
    })
  }

  return <button onClick={handleReport}>Report Issue</button>
}
```

## Dashboard & Monitoring

### Sentry Dashboard Features:
1. **Issues**: Group similar errors, see frequency
2. **Performance**: Track slow operations
3. **Releases**: Track errors per deployment
4. **Alerts**: Email/Slack notifications for critical errors
5. **User Impact**: See which users affected
6. **Source Maps**: View original source code in stack traces

### Setting Up Source Maps

**vite.config.js:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'your-org',
      project: 'course-feedback',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Enable source maps
  },
})
```

## Testing

### Test Sentry Integration:

```javascript
// Add to a test page or console
import * as Sentry from '@sentry/react'

// Test error capture
Sentry.captureMessage('Test message', 'info')

// Test exception
try {
  throw new Error('Test error')
} catch (error) {
  Sentry.captureException(error)
}

// Test performance
const transaction = Sentry.startTransaction({ name: 'test' })
setTimeout(() => transaction.finish(), 1000)
```

## Cost Considerations

**Sentry Pricing (as of 2024):**
- **Developer Plan**: Free - 5,000 errors/month, 10k performance events
- **Team Plan**: $26/month - 50,000 errors/month, 100k performance
- **Business Plan**: $80/month - 500,000 errors/month, 500k performance

**Optimization Tips:**
1. Use sample rates to reduce events sent
2. Filter out expected errors (401, rate limits)
3. Set data retention policies
4. Use environments to separate dev/prod

## Security & Privacy

### 1. Scrub Sensitive Data

```javascript
beforeSend(event) {
  // Remove sensitive data
  if (event.request) {
    delete event.request.cookies
    delete event.request.headers['Authorization']
  }
  
  // Scrub passwords
  if (event.extra?.formData) {
    delete event.extra.formData.password
  }
  
  return event
}
```

### 2. User Privacy

```javascript
// Don't send PII in production
Sentry.setUser({
  id: user.id,
  // DON'T send email, name in production
  // Only send if allowed by privacy policy
})
```

## Alternative: Self-Hosted Options

If Sentry is too expensive or privacy concerns exist:

1. **GlitchTip** (Open source Sentry alternative)
2. **Rollbar** (Similar to Sentry)
3. **Custom logging** to your own server
4. **Console + Backend logs** (what you currently have)

## Recommendation

**For Your System:**

Given that this is an educational project:
1. ✅ **Current setup is fine** (ErrorBoundary + console logs)
2. 💡 **Add Sentry** if deploying to production
3. 💡 **Start with free tier** to test
4. 💡 **Enable only in production** environment

**Priority:**
- **Low**: System works fine without it
- **Nice to have**: Better production monitoring
- **Optional**: Can add later if needed

---

**Status**: 📝 Guide Only - Not Implemented  
**Installation Required**: Yes (Sentry SDK)  
**Cost**: Free tier available  
**Complexity**: Low (30 minutes setup)
