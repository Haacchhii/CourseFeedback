# API Service Layer - Usage Guide

## Overview
The `api.js` file is now fully populated with all methods you need to connect your frontend to the backend.

## What Was Added

### ✅ Complete API Service Layer (800+ lines)
- **Authentication API**: Login, logout, getCurrentUser, isAuthenticated
- **Admin API**: 20+ methods for user management, periods, courses, settings, audit logs, exports
- **Student API**: 4 methods for courses, evaluations, submissions
- **Department Head API**: 8 methods for dashboard, evaluations, sentiment, courses, anomalies
- **Secretary API**: 10 methods for dashboard, courses CRUD, sections, programs, reports
- **Legacy Admin API**: 6 methods for backward compatibility
- **Utilities**: File download, date formatting helpers

### ✅ axios Configuration
- Base URL from environment variables
- Request/response interceptors
- Automatic token injection
- Global error handling
- 401 auto-logout
- 10-second timeout

### ✅ Environment Files
- `.env` - Local development configuration
- `.env.example` - Template for production

---

## How to Use in Your Components

### 1. Import the API

```javascript
// Import specific API modules
import { authAPI, adminAPI, studentAPI, deptHeadAPI, secretaryAPI } from '../../services/api'

// Or import default object
import api from '../../services/api'
// Then use: api.auth.login(), api.admin.getUsers(), etc.
```

### 2. Authentication Example

```javascript
// In Login.jsx
import { authAPI } from '../../services/api'

async function handleLogin() {
  try {
    setLoading(true)
    const response = await authAPI.login(email, password)
    
    if (response.success) {
      // User and token are automatically stored in localStorage
      const user = response.user
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else if (user.role === 'student') {
        navigate('/student/courses')
      } else if (user.role === 'department_head') {
        navigate('/dashboard')
      } else if (user.role === 'secretary') {
        navigate('/dashboard')
      }
    } else {
      setError(response.message || 'Login failed')
    }
  } catch (error) {
    setError(error.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}

// Logout
function handleLogout() {
  authAPI.logout() // Clears storage and redirects to login
}

// Check auth status
const isLoggedIn = authAPI.isAuthenticated()
const currentUser = authAPI.getCurrentUser()
```

### 3. Admin - User Management Example

```javascript
// In UserManagement.jsx
import { adminAPI } from '../../services/api'
import { useState, useEffect } from 'react'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})

  // Fetch users on mount
  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers(page = 1, filters = {}) {
    try {
      setLoading(true)
      const response = await adminAPI.getUsers({
        page,
        page_size: 10,
        ...filters
      })
      
      setUsers(response.data)
      setPagination(response.pagination)
    } catch (error) {
      alert('Error loading users: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Create user
  async function handleCreateUser(userData) {
    try {
      await adminAPI.createUser(userData)
      alert('User created successfully!')
      fetchUsers() // Reload list
    } catch (error) {
      alert('Error creating user: ' + error.message)
    }
  }

  // Update user
  async function handleUpdateUser(userId, userData) {
    try {
      await adminAPI.updateUser(userId, userData)
      alert('User updated successfully!')
      fetchUsers() // Reload list
    } catch (error) {
      alert('Error updating user: ' + error.message)
    }
  }

  // Delete user
  async function handleDeleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      await adminAPI.deleteUser(userId)
      alert('User deleted successfully!')
      fetchUsers() // Reload list
    } catch (error) {
      alert('Error deleting user: ' + error.message)
    }
  }

  // Reset password
  async function handleResetPassword(userId, newPassword) {
    try {
      await adminAPI.resetPassword(userId, newPassword)
      alert('Password reset successfully!')
    } catch (error) {
      alert('Error resetting password: ' + error.message)
    }
  }

  // Render component...
}
```

### 4. Student - Course Evaluation Example

```javascript
// In StudentCourses.jsx
import { studentAPI, authAPI } from '../../services/api'
import { useState, useEffect } from 'react'

function StudentCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const currentUser = authAPI.getCurrentUser()

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    try {
      setLoading(true)
      const response = await studentAPI.getCourses(currentUser.id)
      setCourses(response.data || response)
    } catch (error) {
      alert('Error loading courses: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Submit evaluation
  async function handleSubmitEvaluation(evaluationData) {
    try {
      await studentAPI.submitEvaluation(evaluationData)
      alert('Evaluation submitted successfully!')
      fetchCourses() // Reload to update status
    } catch (error) {
      alert('Error submitting evaluation: ' + error.message)
    }
  }

  if (loading) return <div>Loading courses...</div>

  return (
    <div>
      {courses.map(course => (
        <div key={course.id}>
          <h3>{course.course_name}</h3>
          <p>Instructor: {course.instructor_name}</p>
          <button onClick={() => handleSubmitEvaluation({
            student_id: currentUser.id,
            class_section_id: course.class_section_id,
            responses: [] // Your evaluation responses
          })}>
            Evaluate
          </button>
        </div>
      ))}
    </div>
  )
}
```

### 5. Department Head - Dashboard Example

```javascript
// In HeadDashboard.jsx
import { deptHeadAPI } from '../../services/api'
import { useState, useEffect } from 'react'

function HeadDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      setLoading(true)
      // Department is automatically from current user's department
      const data = await deptHeadAPI.getDashboard()
      setDashboardData(data)
    } catch (error) {
      alert('Error loading dashboard: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch sentiment analysis
  async function fetchSentiment(filters = {}) {
    try {
      const data = await deptHeadAPI.getSentimentAnalysis(filters)
      // Handle sentiment data...
    } catch (error) {
      alert('Error loading sentiment: ' + error.message)
    }
  }

  // Get anomalies
  async function fetchAnomalies() {
    try {
      const data = await deptHeadAPI.getAnomalies({
        threshold: 0.8
      })
      // Handle anomalies...
    } catch (error) {
      alert('Error loading anomalies: ' + error.message)
    }
  }
}
```

### 6. Data Export Example

```javascript
// In DataExportCenter.jsx
import { adminAPI, downloadFile } from '../../services/api'

async function handleExportUsers() {
  try {
    setLoading(true)
    const blob = await adminAPI.exportUsers({
      role: 'student', // Optional filter
      status: 'active'
    })
    
    // Download the file
    downloadFile(blob, 'users_export.csv')
    alert('Export successful!')
  } catch (error) {
    alert('Error exporting users: ' + error.message)
  } finally {
    setLoading(false)
  }
}

async function handleExportEvaluations() {
  try {
    const blob = await adminAPI.exportEvaluations({
      semester: '1st',
      academic_year: '2024-2025'
    })
    downloadFile(blob, 'evaluations_export.csv')
  } catch (error) {
    alert('Error exporting evaluations: ' + error.message)
  }
}
```

---

## Complete API Reference

### authAPI
- `login(email, password)` - Login user
- `logout()` - Logout and clear storage
- `getCurrentUser()` - Get user from localStorage
- `isAuthenticated()` - Check if user has token

### adminAPI
**Users:**
- `getUsers(params)` - Get users list with pagination
- `createUser(userData)` - Create new user
- `updateUser(userId, userData)` - Update user
- `deleteUser(userId)` - Delete user
- `resetPassword(userId, newPassword)` - Reset user password
- `getUserStats()` - Get user statistics

**Evaluation Periods:**
- `getPeriods()` - Get all periods
- `createPeriod(periodData)` - Create period
- `updatePeriodStatus(periodId, status)` - Update period status
- `getActivePeriod()` - Get active period

**Courses:**
- `getCourses(params)` - Get courses with filters

**Settings:**
- `getSettings(category)` - Get settings by category
- `updateSettings(settings)` - Update settings

**Audit Logs:**
- `getAuditLogs(params)` - Get audit logs
- `getAuditLogStats()` - Get audit statistics

**Export:**
- `exportUsers(filters)` - Export users to CSV
- `exportEvaluations(filters)` - Export evaluations to CSV
- `getDashboardStats()` - Get dashboard statistics

### studentAPI
- `getCourses(studentId)` - Get enrolled courses
- `submitEvaluation(evaluationData)` - Submit evaluation
- `getEvaluations(studentId)` - Get evaluation history
- `getCourseDetails(courseId)` - Get course details

### deptHeadAPI
- `getDashboard()` - Get department dashboard
- `getEvaluations(params)` - Get evaluations
- `getSentimentAnalysis(params)` - Get sentiment analysis
- `getCourses(params)` - Get courses with stats
- `getCourseReport(courseId, params)` - Get course report
- `getInstructors(params)` - Get instructors
- `getAnomalies(params)` - Get anomaly detection
- `getTrends(params)` - Get department trends

### secretaryAPI
- `getDashboard()` - Get secretary dashboard
- `getCourses(params)` - Get courses
- `createCourse(courseData)` - Create course
- `updateCourse(courseId, courseData)` - Update course
- `deleteCourse(courseId)` - Delete course
- `getCourseSections(courseId)` - Get sections
- `createSection(sectionData)` - Create section
- `assignInstructor(sectionId, instructorId)` - Assign instructor
- `getPrograms()` - Get programs
- `getEvaluationsSummary(params)` - Get evaluations summary

---

## Error Handling

All API calls are wrapped in try-catch. Errors are thrown with readable messages:

```javascript
try {
  const data = await adminAPI.getUsers()
  // Success
} catch (error) {
  // error.message contains the error description
  console.error(error.message)
  // Show to user
  alert('Error: ' + error.message)
  // Or use a toast notification library
}
```

### Automatic 401 Handling
If any API call returns 401 (Unauthorized), the user is automatically:
1. Logged out (token/user cleared from localStorage)
2. Redirected to `/login`

---

## Loading States Pattern

```javascript
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

async function fetchData() {
  try {
    setLoading(true)
    setError(null)
    const response = await adminAPI.getUsers()
    setData(response.data)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

// In render:
if (loading) return <div>Loading...</div>
if (error) return <div>Error: {error}</div>
return <div>{/* Render data */}</div>
```

---

## Next Steps

### 1. Update Login.jsx (30 minutes)
Replace mock authentication with real API call

### 2. Update One Admin Page (1 hour)
Start with UserManagement.jsx - replace all mock data

### 3. Test Integration (30 minutes)
- Start backend: `cd Back/App && python main.py`
- Start frontend: `cd New/capstone && npm run dev`
- Test login with: admin@lpu.edu.ph / password123
- Test CRUD operations

### 4. Repeat for Other Pages
Once UserManagement works, repeat pattern for other pages

---

## Tips

1. **Import what you need**: Don't import the entire api object if you only need one module
2. **Use async/await**: All API methods are async, always use await
3. **Handle errors**: Always wrap API calls in try-catch
4. **Show loading**: Update UI to show loading state during API calls
5. **Verify response**: Check response structure, some return `{ data: [], pagination: {} }`, others return data directly
6. **User context**: Get current user with `authAPI.getCurrentUser()`
7. **Auto department**: Department Head and Secretary APIs automatically use current user's department

---

## Environment Variables

The API automatically reads from `.env`:
- `VITE_API_BASE_URL` - Backend API URL (default: http://127.0.0.1:8000/api)

To change for production, update `.env` file.

---

## 🎉 You're Ready!

The API service layer is now complete with:
- ✅ 50+ API methods
- ✅ Automatic authentication
- ✅ Error handling
- ✅ Token management
- ✅ Type safety through JSDoc comments
- ✅ Ready to use in all components

Start by updating Login.jsx, then move to admin pages!
