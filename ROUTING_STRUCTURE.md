# Course Feedback System - Clean Routing Structure

## Overview
This document outlines the clean, permanent routing architecture implemented to separate Admin, Staff, and Student functionalities.

---

## Folder Organization

### `pages/admin/` - System Administration (Admin Only)
**Purpose**: Full system control, user management, and configuration
**Access**: `admin`, `system-admin` roles only

**Files (7 total):**
1. `AdminDashboard.jsx` - System overview and statistics
2. `UserManagement.jsx` - Create, edit, delete users
3. `EvaluationPeriodManagement.jsx` - Manage evaluation periods
4. `EnhancedCourseManagement.jsx` - Full course CRUD operations
5. `SystemSettings.jsx` - System configuration settings
6. `AuditLogViewer.jsx` - Security and audit logs
7. `DataExportCenter.jsx` - Data export and reports

**Routes:**
- `/admin/dashboard` → AdminDashboard
- `/admin/users` → UserManagement
- `/admin/periods` → EvaluationPeriodManagement
- `/admin/courses` → EnhancedCourseManagement
- `/admin/settings` → SystemSettings
- `/admin/export` → DataExportCenter
- `/admin/audit-logs` → AuditLogViewer

---

### `pages/staff/` - Staff Dashboard (Secretary/Dept Head/Instructor)
**Purpose**: View evaluations, analytics, reports, and manage course content
**Access**: `secretary`, `department_head`, `head`, `instructor` roles

**Files (6 total):**
1. `Dashboard.jsx` - Main staff dashboard with evaluation overview
2. `SentimentAnalysis.jsx` - Sentiment analysis charts and insights
3. `AnomalyDetection.jsx` - Anomaly detection interface
4. `Courses.jsx` - Course listing and viewing
5. `Evaluations.jsx` - View completed evaluations
6. `EvaluationQuestions.jsx` - View/manage evaluation questions

**Routes:**
- `/dashboard` → StaffDashboard
- `/sentiment` → StaffSentimentAnalysis
- `/anomalies` → StaffAnomalyDetection
- `/courses` → StaffCourses
- `/evaluations` → StaffEvaluations
- `/evaluation-questions` → StaffEvaluationQuestions

---

### `pages/student/` - Student Evaluation Interface
**Purpose**: Submit course evaluations
**Access**: `student` role only

**Files (3 total):**
1. `StudentEvaluation.jsx` - Main student dashboard
2. `StudentCourses.jsx` - List of courses to evaluate
3. `EvaluateCourse.jsx` - Evaluation form for specific course

**Routes:**
- `/student-evaluation` → StudentEvaluation
- `/student/courses` → StudentCourses
- `/student/evaluate/:courseId` → EvaluateCourse

---

### `pages/common/` - Public Pages
**Purpose**: Publicly accessible pages
**Access**: No authentication required

**Files (4 total):**
1. `Index.jsx` - Landing page
2. `Login.jsx` - Login page
3. `ForgotPassword.jsx` - Password reset page
4. `NotFound.jsx` - 404 error page

**Routes:**
- `/` → Index
- `/login` → Login
- `/forgot` → ForgotPassword
- `/404` and `*` → NotFound

---

## Role-Based Access Summary

### Admin Role (`admin`, `system-admin`)
- Full system administration access
- User management
- System configuration
- All `/admin/*` routes

### Staff Roles (`secretary`, `department_head`, `head`, `instructor`)
- View evaluations and analytics
- Generate reports
- View sentiment and anomaly detection
- Access to main dashboard and analytics routes
- All `/dashboard`, `/sentiment`, `/anomalies`, `/courses`, `/evaluations`, `/evaluation-questions` routes

### Student Role (`student`)
- Submit course evaluations
- View assigned courses
- Complete evaluation forms
- All `/student*` routes

---

## Key Benefits of This Structure

1. **Clear Separation**: Each role has dedicated folder and routes
2. **No Confusion**: Admin routes use `/admin/*` prefix, staff uses root-level paths
3. **Easy Maintenance**: New features go into appropriate role folder
4. **Scalable**: Easy to add new pages or roles
5. **Security**: Role-based route protection enforced

---

## Import Pattern in App.jsx

```jsx
// Admin Pages (System Administration)
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
// ... other admin pages

// Staff Pages (Secretary/Dept Head/Instructor)
import StaffDashboard from './pages/staff/Dashboard'
import StaffSentimentAnalysis from './pages/staff/SentimentAnalysis'
// ... other staff pages

// Student Pages
import StudentEvaluation from './pages/student/StudentEvaluation'
// ... other student pages

// Common Pages
import Index from './pages/common/Index'
import Login from './pages/common/Login'
// ... other common pages
```

**Note**: Staff pages are prefixed with `Staff*` in imports to avoid naming conflicts with admin pages.

---

## Migration Notes

**Completed Actions:**
- ✅ Created `pages/staff/` directory
- ✅ Moved 6 staff pages from `pages/admin/` to `pages/staff/`
- ✅ Updated all imports in `App.jsx`
- ✅ Updated all route definitions in `App.jsx`
- ✅ Removed test/debug files and legacy head pages
- ✅ Cleaned up routing structure

**Next Steps:**
1. Restart frontend development server
2. Test login for each role (admin, secretary, student)
3. Verify role-based redirects work correctly
4. Test navigation between pages for each role

---

**Last Updated**: [Current Date]
**Version**: 2.0 - Clean Architecture
