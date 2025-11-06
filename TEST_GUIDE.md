# 🔐 Role-Based Routing - Quick Test Guide

## Database Users

| ID | Email | Password | Role | Expected Route |
|----|-------|----------|------|----------------|
| 14 | admin@lpubatangas.edu.ph | (hashed) | `admin` | `/admin/dashboard` |
| 15 | instructor@lpubatangas.edu.ph | (hashed) | `instructor` | `/dashboard` |
| 16 | depthead@lpubatangas.edu.ph | (hashed) | `department_head` | `/dashboard` |
| 17 | secretary@lpubatangas.edu.ph | (hashed) | `secretary` | `/dashboard` |
| 18 | student@lpubatangas.edu.ph | (hashed) | `student` | `/student/courses` |

---

## Quick Test Script

### Test 1: Admin Access ✅
```
1. Login: admin@lpubatangas.edu.ph
2. Expected: Redirect to /admin/dashboard
3. Can access: /admin/users, /admin/periods, /admin/courses, /admin/settings, /admin/export, /admin/audit-logs
4. Cannot access: /dashboard, /student/courses
```

### Test 2: Staff Access (Secretary) ✅
```
1. Login: secretary@lpubatangas.edu.ph
2. Expected: Redirect to /dashboard
3. Can access: /dashboard, /sentiment, /anomalies, /courses, /evaluations, /evaluation-questions
4. Cannot access: /admin/dashboard, /student/courses
```

### Test 3: Staff Access (Instructor) ✅
```
1. Login: instructor@lpubatangas.edu.ph
2. Expected: Redirect to /dashboard
3. Can access: Same as secretary
4. Cannot access: /admin/dashboard, /student/courses
```

### Test 4: Staff Access (Department Head) ✅
```
1. Login: depthead@lpubatangas.edu.ph
2. Expected: Redirect to /dashboard
3. Can access: Same as secretary and instructor
4. Cannot access: /admin/dashboard, /student/courses
```

### Test 5: Student Access ✅
```
1. Login: student@lpubatangas.edu.ph
2. Expected: Redirect to /student/courses
3. Can access: /student-evaluation, /student/courses, /student/evaluate/:courseId
4. Cannot access: /admin/dashboard, /dashboard
```

---

## Role URLs at a Glance

### Admin URLs
- `/admin/dashboard` - System overview
- `/admin/users` - User management
- `/admin/periods` - Evaluation periods
- `/admin/courses` - Course management
- `/admin/settings` - System settings
- `/admin/export` - Data export
- `/admin/audit-logs` - Audit logs

### Staff URLs (Secretary/Instructor/Dept Head)
- `/dashboard` - Staff dashboard
- `/sentiment` - Sentiment analysis
- `/anomalies` - Anomaly detection
- `/courses` - View courses
- `/evaluations` - View evaluations
- `/evaluation-questions` - Manage questions

### Student URLs
- `/student-evaluation` - Main evaluation page
- `/student/courses` - Course list
- `/student/evaluate/:courseId` - Evaluation form

---

## Error Scenarios to Test

### ❌ Unauthorized Access
1. Login as student → Try to access `/admin/dashboard` → Should see "Access Denied"
2. Login as instructor → Try to access `/admin/users` → Should see "Access Denied"
3. Login as secretary → Try to access `/student/courses` → Should see "Access Denied"
4. Login as admin → Try to access `/student/evaluate/1` → Should see "Access Denied"

### ❌ Invalid Routes
1. Any user → Navigate to `/invalid-route` → Should see 404 page
2. Logout → Try to access protected route → Redirect to `/login`

---

## Expected Behavior Summary

| Role | Admin Routes | Staff Routes | Student Routes |
|------|-------------|--------------|----------------|
| **admin** | ✅ Full Access | ❌ No Access | ❌ No Access |
| **secretary** | ❌ No Access | ✅ Full Access | ❌ No Access |
| **instructor** | ❌ No Access | ✅ Full Access | ❌ No Access |
| **department_head** | ❌ No Access | ✅ Full Access | ❌ No Access |
| **student** | ❌ No Access | ❌ No Access | ✅ Full Access |

---

## Navigation Menu Items (Should Show Based on Role)

### Admin Menu
- Dashboard
- User Management
- Evaluation Periods
- Course Management
- System Settings
- Data Export
- Audit Logs

### Staff Menu
- Dashboard
- Sentiment Analysis
- Anomaly Detection
- Courses
- Evaluations
- Evaluation Questions

### Student Menu
- My Courses
- Evaluations
- (Minimal navigation)

---

## Testing Commands

```powershell
# Start backend
cd "c:\Users\Jose Iturralde\Documents\1 thesis\Back\App"
python -m uvicorn main:app --reload

# Start frontend
cd "c:\Users\Jose Iturralde\Documents\1 thesis\New\capstone"
npm run dev
```

---

## Status: ✅ OPTIMIZED & READY FOR TESTING

All role-based routing has been aligned with the database structure:
- ✅ Clean route definitions in App.jsx
- ✅ Correct role checks in ProtectedRoute
- ✅ Updated login redirects
- ✅ Fixed all dropdown menus
- ✅ Updated role display functions
- ✅ Removed deprecated role references

**No more routing confusion! Admin = Admin, Staff = Staff, Student = Student.**
