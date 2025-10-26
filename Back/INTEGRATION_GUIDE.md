# Frontend-Backend Integration Guide

## Quick Setup

### 1. Backend Setup

```powershell
# Navigate to backend
cd "C:\Users\Jose Iturralde\Documents\1 thesis\Back\App"

# Activate Python environment
& "C:\Users\Jose Iturralde\Documents\1 thesis\.venv\Scripts\Activate.ps1"

# Install dependencies (if not already installed)
pip install fastapi uvicorn sqlalchemy psycopg2-binary bcrypt python-dotenv

# Start the backend server
python main.py
```

**Backend will run on**: `http://localhost:8000`

### 2. Frontend Setup

```powershell
# Navigate to frontend
cd "C:\Users\Jose Iturralde\Documents\1 thesis\New\capstone"

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

**Frontend will run on**: `http://localhost:5173`

---

## API Service Configuration

Update `New/capstone/src/services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ===========================
// AUTHENTICATION
// ===========================

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// ===========================
// SYSTEM ADMIN API
// ===========================

export const adminAPI = {
  // User Management
  getUsers: (page = 1, pageSize = 10, filters = {}) =>
    api.get('/admin/users', { params: { page, page_size: pageSize, ...filters } }),
  
  createUser: (userData, currentUserId) =>
    api.post('/admin/users', userData, { params: { current_user_id: currentUserId } }),
  
  updateUser: (userId, userData, currentUserId) =>
    api.put(`/admin/users/${userId}`, userData, { params: { current_user_id: currentUserId } }),
  
  deleteUser: (userId, currentUserId) =>
    api.delete(`/admin/users/${userId}`, { params: { current_user_id: currentUserId } }),
  
  resetPassword: (userId, newPassword, currentUserId) =>
    api.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword }, { params: { current_user_id: currentUserId } }),
  
  getUserStats: () =>
    api.get('/admin/users/stats'),

  // Evaluation Periods
  getEvaluationPeriods: (status = null) =>
    api.get('/admin/evaluation-periods', { params: status ? { status } : {} }),
  
  createEvaluationPeriod: (periodData, currentUserId) =>
    api.post('/admin/evaluation-periods', periodData, { params: { current_user_id: currentUserId } }),
  
  updatePeriodStatus: (periodId, status, currentUserId) =>
    api.put(`/admin/evaluation-periods/${periodId}/status`, { status }, { params: { current_user_id: currentUserId } }),
  
  getActivePeriod: () =>
    api.get('/admin/evaluation-periods/active'),

  // Courses
  getCourses: (page = 1, pageSize = 10, filters = {}) =>
    api.get('/admin/courses', { params: { page, page_size: pageSize, ...filters } }),

  // System Settings
  getSettings: (category) =>
    api.get(`/admin/settings/${category}`),
  
  updateSettings: (category, settings, currentUserId) =>
    api.put('/admin/settings', { category, settings }, { params: { current_user_id: currentUserId } }),

  // Audit Logs
  getAuditLogs: (page = 1, pageSize = 15, filters = {}) =>
    api.get('/admin/audit-logs', { params: { page, page_size: pageSize, ...filters } }),
  
  getAuditLogStats: () =>
    api.get('/admin/audit-logs/stats'),

  // Data Export
  exportUsers: (format = 'csv') =>
    api.get('/admin/export/users', { params: { format } }),
  
  exportEvaluations: (format = 'csv') =>
    api.get('/admin/export/evaluations', { params: { format } }),

  // Dashboard
  getDashboardStats: () =>
    api.get('/admin/dashboard-stats'),
};

// ===========================
// DEPARTMENT HEAD API
// ===========================

export const deptHeadAPI = {
  getDashboard: (userId) =>
    api.get('/dept-head/dashboard', { params: { user_id: userId } }),
  
  getEvaluations: (userId, page = 1, pageSize = 10, filters = {}) =>
    api.get('/dept-head/evaluations', { params: { user_id: userId, page, page_size: pageSize, ...filters } }),
  
  getSentimentAnalysis: (userId, timeRange = 'month') =>
    api.get('/dept-head/sentiment-analysis', { params: { user_id: userId, time_range: timeRange } }),
  
  getCourses: (userId) =>
    api.get('/dept-head/courses', { params: { user_id: userId } }),
  
  getCourseReport: (courseId, userId) =>
    api.get(`/dept-head/courses/${courseId}/report`, { params: { user_id: userId } }),
  
  getInstructors: (userId) =>
    api.get('/dept-head/instructors', { params: { user_id: userId } }),
  
  getAnomalies: (userId, page = 1, pageSize = 10) =>
    api.get('/dept-head/anomalies', { params: { user_id: userId, page, page_size: pageSize } }),
  
  getTrends: (userId, metric = 'rating') =>
    api.get('/dept-head/trends', { params: { user_id: userId, metric } }),
};

// ===========================
// SECRETARY API
// ===========================

export const secretaryAPI = {
  getDashboard: (userId) =>
    api.get('/secretary/dashboard', { params: { user_id: userId } }),
  
  getCourses: (userId, page = 1, pageSize = 10, filters = {}) =>
    api.get('/secretary/courses', { params: { user_id: userId, page, page_size: pageSize, ...filters } }),
  
  createCourse: (courseData, userId) =>
    api.post('/secretary/courses', courseData, { params: { user_id: userId } }),
  
  updateCourse: (courseId, courseData, userId) =>
    api.put(`/secretary/courses/${courseId}`, courseData, { params: { user_id: userId } }),
  
  deleteCourse: (courseId, userId) =>
    api.delete(`/secretary/courses/${courseId}`, { params: { user_id: userId } }),
  
  getCourseSections: (courseId, userId) =>
    api.get(`/secretary/courses/${courseId}/sections`, { params: { user_id: userId } }),
  
  createSection: (sectionData, userId) =>
    api.post('/secretary/sections', sectionData, { params: { user_id: userId } }),
  
  assignInstructor: (sectionId, instructorName, instructorId, userId) =>
    api.put(`/secretary/sections/${sectionId}/assign-instructor`, { instructor_name: instructorName, instructor_id: instructorId }, { params: { user_id: userId } }),
  
  getPrograms: (userId) =>
    api.get('/secretary/programs', { params: { user_id: userId } }),
  
  getEvaluationsSummary: (userId) =>
    api.get('/secretary/reports/evaluations-summary', { params: { user_id: userId } }),
};

// ===========================
// STUDENT API
// ===========================

export const studentAPI = {
  getCourses: (studentId) =>
    api.get(`/student/${studentId}/courses`),
  
  submitEvaluation: (evaluationData) =>
    api.post('/student/evaluations', evaluationData),
};

export default api;
```

---

## Component Integration Examples

### 1. UserManagement.jsx

```javascript
import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers(page, 10, filters);
      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateUser = async (userData) => {
    try {
      const currentUserId = getCurrentUser()?.id;
      const response = await adminAPI.createUser(userData, currentUserId);
      if (response.data.success) {
        alert('User created successfully!');
        fetchUsers(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    }
  };
  
  // ... rest of component
}
```

### 2. EvaluationPeriodManagement.jsx

```javascript
import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

export default function EvaluationPeriodManagement() {
  const [activePeriod, setActivePeriod] = useState(null);
  
  useEffect(() => {
    fetchActivePeriod();
  }, []);
  
  const fetchActivePeriod = async () => {
    try {
      const response = await adminAPI.getActivePeriod();
      if (response.data.success) {
        setActivePeriod(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch active period:', error);
    }
  };
  
  const handleClosePeriod = async () => {
    try {
      const currentUserId = getCurrentUser()?.id;
      await adminAPI.updatePeriodStatus(activePeriod.id, 'closed', currentUserId);
      alert('Period closed successfully!');
      fetchActivePeriod();
    } catch (error) {
      console.error('Failed to close period:', error);
      alert('Failed to close period');
    }
  };
  
  // ... rest of component
}
```

### 3. Login.jsx

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await login(email, password);
      
      if (response.success) {
        // Store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        
        // Navigate based on role
        if (response.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (response.user.role === 'department_head') {
          navigate('/dashboard');
        } else if (response.user.role === 'secretary') {
          navigate('/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      } else {
        alert(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };
  
  // ... rest of component
}
```

---

## Testing the Integration

### 1. Test Authentication

```javascript
// In browser console or test file
const testLogin = async () => {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'password123'
    })
  });
  const data = await response.json();
  console.log(data);
};
```

### 2. Test System Admin Endpoints

```javascript
// Get users
const testGetUsers = async () => {
  const response = await fetch('http://localhost:8000/api/admin/users?page=1&page_size=10');
  const data = await response.json();
  console.log(data);
};

// Get audit logs
const testGetAuditLogs = async () => {
  const response = await fetch('http://localhost:8000/api/admin/audit-logs?page=1&page_size=15');
  const data = await response.json();
  console.log(data);
};
```

---

## Common Issues & Solutions

### Issue 1: CORS Error
**Error**: `Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solution**: Backend CORS is already configured for ports 5173 and 5174. Ensure backend is running.

### Issue 2: Database Connection Error
**Error**: `Database connection failed`

**Solution**: 
1. Check `Back/App/.env` has correct database credentials
2. Ensure PostgreSQL is running
3. Run database migrations

### Issue 3: Module Import Error
**Error**: `Import "fastapi" could not be resolved`

**Solution**: Activate Python environment and install dependencies:
```powershell
.venv\Scripts\Activate.ps1
pip install -r Back/requirements.txt
```

### Issue 4: Port Already in Use
**Error**: `Address already in use`

**Solution**: Kill process on port 8000 or 5173:
```powershell
# Find process on port
netstat -ano | findstr :8000

# Kill process
taskkill /PID <process_id> /F
```

---

## Environment Variables

### Backend (.env)

Create `Back/App/.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/course_feedback

# Application Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend (.env)

Create `New/capstone/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Next Steps

1. **Replace Mock Data**: Update frontend components to use real API calls instead of mock data
2. **Add Error Handling**: Implement comprehensive error handling with user-friendly messages
3. **Add Loading States**: Show loading spinners while fetching data
4. **Implement Caching**: Use React Query or SWR for data caching
5. **Add Authentication Context**: Create React context for managing user authentication state
6. **Implement JWT Tokens**: Add token-based authentication for better security
7. **Add Request Interceptors**: Automatically attach auth tokens to all API requests

---

## API Testing Tools

### Postman Collection
Import endpoints into Postman for easy testing

### Swagger UI
Access interactive API docs at: http://localhost:8000/docs

### ReDoc
Access alternative API docs at: http://localhost:8000/redoc

---

## Support

If you encounter issues:
1. Check backend logs in terminal
2. Check browser console for frontend errors
3. Verify database connection
4. Ensure all dependencies are installed
5. Check CORS configuration
