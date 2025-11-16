# COMPREHENSIVE TEST PLAN
**Date**: December 2024  
**Branch**: feature/secretary-depthead-overhaul  
**Servers Running**:
- Backend: http://127.0.0.1:8000
- Frontend: http://localhost:5174

---

## TEST ENVIRONMENT STATUS ✅

### Backend Server
- **Status**: ✅ Running on port 8000
- **Reload**: Enabled (auto-restart on file changes)
- **Database**: ✅ Connected successfully
- **Routes Registered**: 
  - `/api/auth/*` - Authentication
  - `/api/admin/*` - Admin routes (including new endpoints)
  - `/api/dept-head/*` - Department Head routes (including new endpoints)
  - `/api/secretary/*` - Secretary routes (including new endpoints)
  - `/api/student/*` - Student routes

### Frontend Server
- **Status**: ✅ Running on port 5174
- **Build Tool**: Vite v7.1.4
- **Hot Reload**: Enabled

### New Endpoints Deployed
1. ✅ `/api/secretary/courses/{id}/category-averages` - GET
2. ✅ `/api/secretary/courses/{id}/question-distribution` - GET
3. ✅ `/api/secretary/completion-rates` - GET
4. ✅ `/api/secretary/support-request` - POST
5. ✅ `/api/dept-head/courses/{id}/category-averages` - GET
6. ✅ `/api/dept-head/courses/{id}/question-distribution` - GET
7. ✅ `/api/dept-head/completion-rates` - GET
8. ✅ `/api/dept-head/support-request` - POST
9. ✅ `/api/admin/courses/{id}/category-averages` - GET
10. ✅ `/api/admin/courses/{id}/question-distribution` - GET
11. ✅ `/api/admin/completion-rates` - GET
12. ✅ `/api/admin/support-request` - POST

---

## TASK 7: ROLE ACCESS TESTING

### Test Users (from database)
Use these credentials to test role access:

#### Secretary Test User
- **Email**: maria.garcia@lpunetwork.edu.ph
- **Password**: password123
- **Expected**: Full access to secretary features

#### Department Head Test User
- **Email**: robert.johnson@lpunetwork.edu.ph
- **Password**: password123
- **Expected**: Identical access to secretary (merged roles)

#### Instructor Test User (Should Fail)
- **Email**: john.smith@lpunetwork.edu.ph
- **Password**: password123
- **Expected**: Login should fail or redirect

#### Admin Test User
- **Email**: admin@lpunetwork.edu.ph
- **Password**: admin123
- **Expected**: Full system access

---

## TEST CHECKLIST

### ☐ Test 1: Secretary Login & Dashboard
**URL**: http://localhost:5174

1. [ ] Navigate to http://localhost:5174
2. [ ] Login as maria.garcia@lpunetwork.edu.ph
3. [ ] Verify redirect to Dashboard
4. [ ] Check Dashboard displays:
   - [ ] 3 statistic cards (Total Courses, Participation Rate, Average Rating)
   - [ ] 2 charts (Sentiment Distribution, Year Level Performance)
   - [ ] **NEW** CompletionTracker widget with circular progress
   - [ ] **NEW** CourseCompletionTable with search/sort/filter
   - [ ] 5 Quick Action buttons (including **Contact Admin**)
   - [ ] Category metrics section
5. [ ] Open browser DevTools (F12) → Console
6. [ ] Verify no errors in console
7. [ ] Check Network tab for API calls:
   - [ ] `/api/secretary/dashboard` - 200 OK
   - [ ] `/api/secretary/completion-rates` - 200 OK
   - [ ] `/api/secretary/programs` - 200 OK
   - [ ] `/api/secretary/year-levels` - 200 OK

**Expected Result**: Dashboard loads successfully with all new widgets

---

### ☐ Test 2: Completion Tracker Widget
**Location**: Dashboard page (above Quick Actions)

1. [ ] Verify circular progress indicator displays percentage
2. [ ] Check color coding:
   - [ ] Red if < 70%
   - [ ] Yellow if 70-85%
   - [ ] Green if ≥ 85%
3. [ ] Verify 4 statistic cards show:
   - [ ] Submitted count
   - [ ] Pending count
   - [ ] Total Students
   - [ ] Low Completion Courses
4. [ ] Click refresh button (↻ icon)
5. [ ] Verify loading state shows
6. [ ] Verify data refreshes

**Expected Result**: Widget displays real-time completion data

---

### ☐ Test 3: Course Completion Table
**Location**: Dashboard page (below CompletionTracker)

1. [ ] Verify table displays with 7 columns:
   - [ ] Course (name + code)
   - [ ] Instructor
   - [ ] Enrolled
   - [ ] Submitted
   - [ ] Pending
   - [ ] Completion (with progress bar)
   - [ ] Status (badge: Low/Fair/Good)
2. [ ] Test search filter:
   - [ ] Type course name → verify filtering
   - [ ] Type instructor name → verify filtering
   - [ ] Clear search → verify shows all
3. [ ] Test sort dropdown:
   - [ ] Sort by "Completion Rate (Low to High)"
   - [ ] Sort by "Course Name"
   - [ ] Sort by "Instructor"
4. [ ] Test threshold filter:
   - [ ] Select "Below 70%" → verify filters
   - [ ] Select "Below 50%" → verify filters
   - [ ] Select "All" → verify shows all
5. [ ] Hover over rows → verify hover effect

**Expected Result**: Table is fully interactive with working filters

---

### ☐ Test 4: Contact Admin Modal
**Location**: Dashboard → Quick Actions → Contact Admin button

1. [ ] Click "Contact Admin" button (5th button)
2. [ ] Verify modal opens with form
3. [ ] Verify form fields:
   - [ ] Issue Type dropdown (6 options)
   - [ ] Course Name (optional)
   - [ ] Course ID (optional)
   - [ ] Student Name (optional)
   - [ ] Student ID (optional)
   - [ ] Subject (required)
   - [ ] Message (required, textarea)
4. [ ] Test validation:
   - [ ] Try submitting empty form → verify error
   - [ ] Fill only subject → verify error
   - [ ] Fill subject + message → verify succeeds
5. [ ] Fill form with test data:
   - Issue Type: Technical Issue
   - Subject: "Test Support Request"
   - Message: "Testing the contact admin feature"
6. [ ] Click "Send Message"
7. [ ] Verify success message appears
8. [ ] Check backend logs for support request entry
9. [ ] Verify modal auto-closes after 2 seconds
10. [ ] Click "Contact Admin" again → verify form is reset

**Expected Result**: Modal works, form validates, request logs to backend

---

### ☐ Test 5: Courses Page - Enhanced Details
**URL**: http://localhost:5174/courses

1. [ ] Navigate to Courses page
2. [ ] Verify course list displays
3. [ ] Click on any course → opens CourseDetails page
4. [ ] Verify 2 tabs appear:
   - [ ] **Overview** tab (default)
   - [ ] **Detailed Analysis** tab
5. [ ] **Overview Tab** - Verify displays:
   - [ ] Course information card
   - [ ] Sentiment distribution (pie chart)
   - [ ] **NEW** Category Averages (6 categories with bars)
   - [ ] Radar chart for category visualization
6. [ ] **Detailed Analysis Tab** - Click and verify:
   - [ ] All 31 questions listed
   - [ ] Grouped by 6 categories
   - [ ] Each question shows:
     - Question text
     - Response counts (Strongly Agree, Agree, Disagree, Strongly Disagree)
     - Bar chart visualization
     - Average rating
7. [ ] Check Network tab:
   - [ ] `/api/secretary/courses/{id}/category-averages` - 200 OK
   - [ ] `/api/secretary/courses/{id}/question-distribution` - 200 OK

**Expected Result**: Course details show new tabs with detailed analytics

---

### ☐ Test 6: Department Head Login (Identical Access)
**URL**: http://localhost:5174

1. [ ] Logout (if logged in)
2. [ ] Login as robert.johnson@lpunetwork.edu.ph
3. [ ] Verify redirect to Dashboard
4. [ ] **CRITICAL**: Verify identical features to secretary:
   - [ ] Dashboard has same layout
   - [ ] CompletionTracker widget visible
   - [ ] CourseCompletionTable visible
   - [ ] Contact Admin button visible
   - [ ] All 5 Quick Actions accessible
5. [ ] Navigate to Courses → verify accessible
6. [ ] Open course details → verify tabs work
7. [ ] Check Network tab API calls use `/api/dept-head/*` prefix
8. [ ] Verify no permission errors

**Expected Result**: Department head has 100% identical access to secretary

---

### ☐ Test 7: API Endpoint Testing (Backend)

**Use browser DevTools Network tab or Postman**

#### Test Category Averages Endpoint
```
GET http://127.0.0.1:8000/api/secretary/courses/1/category-averages?user_id=2
Expected Response:
{
  "course_id": 1,
  "course_name": "...",
  "total_evaluations": 15,
  "category_averages": {
    "Commitment": 3.85,
    "Knowledge of Subject": 3.92,
    "Teaching for Independent Learning": 3.78,
    "Management of Learning": 3.81,
    "Feedback": 3.76,
    "Overall Effectiveness": 3.88
  }
}
```

#### Test Question Distribution Endpoint
```
GET http://127.0.0.1:8000/api/secretary/courses/1/question-distribution?user_id=2
Expected Response:
{
  "course_id": 1,
  "course_name": "...",
  "questions": [
    {
      "question_number": 1,
      "question_text": "...",
      "category": "Commitment",
      "strongly_agree": 8,
      "agree": 5,
      "disagree": 2,
      "strongly_disagree": 0,
      "total_responses": 15,
      "average_rating": 3.8
    },
    // ... 30 more questions
  ]
}
```

#### Test Completion Rates Endpoint
```
GET http://127.0.0.1:8000/api/secretary/completion-rates?user_id=2
Expected Response:
{
  "success": true,
  "data": {
    "overall": {
      "total_students": 250,
      "total_evaluations": 210,
      "completion_rate": 84.0,
      "pending_evaluations": 40,
      "total_courses": 15,
      "low_completion_courses": 3
    },
    "courses": [...]
  }
}
```

#### Test Support Request Endpoint
```
POST http://127.0.0.1:8000/api/secretary/support-request?user_id=2
Content-Type: application/json

{
  "issueType": "technical",
  "subject": "Test Support Request",
  "message": "This is a test message",
  "courseName": "Introduction to Programming",
  "courseId": "CS101"
}

Expected Response:
{
  "success": true,
  "message": "Support request submitted successfully...",
  "ticket_id": "TICKET-2-20241216143025"
}
```

**Check Backend Logs**: Should see support request details logged

---

### ☐ Test 8: Browser Console Checks

1. [ ] Open DevTools → Console (F12)
2. [ ] Navigate through all pages
3. [ ] Verify NO red errors appear
4. [ ] Yellow warnings are acceptable (but note them)
5. [ ] Check for:
   - [ ] No 404 errors (missing resources)
   - [ ] No 500 errors (server errors)
   - [ ] No CORS errors
   - [ ] No undefined variable errors
   - [ ] No React component errors

**Expected Result**: Clean console with no critical errors

---

### ☐ Test 9: Responsive Design Testing

1. [ ] Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. [ ] Test different screen sizes:
   - [ ] Mobile (375px) - iPhone SE
   - [ ] Tablet (768px) - iPad
   - [ ] Desktop (1920px) - Full HD
3. [ ] Verify on mobile:
   - [ ] Dashboard cards stack vertically
   - [ ] Quick Actions grid adjusts (5 buttons)
   - [ ] CompletionTracker is readable
   - [ ] CourseCompletionTable scrolls horizontally
   - [ ] Contact Admin modal is usable
4. [ ] Verify on tablet:
   - [ ] 2-column grid for most sections
   - [ ] Tables remain functional
5. [ ] Verify on desktop:
   - [ ] Full 3-column layout
   - [ ] All widgets fit properly

**Expected Result**: UI adapts to all screen sizes

---

### ☐ Test 10: Navigation Flow

Test complete navigation through all pages:

1. [ ] Login → Dashboard
2. [ ] Dashboard → Courses
3. [ ] Courses → Course Details
4. [ ] Course Details → Overview tab
5. [ ] Course Details → Detailed Analysis tab
6. [ ] Back to Courses
7. [ ] Dashboard → Evaluations
8. [ ] Dashboard → Sentiment Analysis
9. [ ] Dashboard → Anomalies
10. [ ] Open Contact Admin modal
11. [ ] Close modal
12. [ ] Logout

**Expected Result**: All navigation works smoothly with no errors

---

## TASK 21: COMPREHENSIVE PAGE TESTING

### Pages to Test in Detail

#### ☐ Page 1: Dashboard (Staff)
- [x] Already tested above
- [ ] Additional: Test filters (Program, Year Level, Semester)
- [ ] Verify filter changes update stats
- [ ] Test "Reset Filters" button
- [ ] Test "Apply Filters" button

#### ☐ Page 2: Courses List
- [ ] Verify course list loads
- [ ] Test search functionality
- [ ] Test filters (if any)
- [ ] Click multiple courses → verify details load

#### ☐ Page 3: Course Details
- [x] Already tested above (tabs)
- [ ] Additional: Test back button
- [ ] Test breadcrumb navigation
- [ ] Verify data accuracy

#### ☐ Page 4: Evaluations Page
- [ ] Navigate to /evaluations
- [ ] Verify evaluation list displays
- [ ] Test search/filter
- [ ] Check pagination (if exists)

#### ☐ Page 5: Sentiment Analysis
- [ ] Navigate to /sentiment
- [ ] Verify charts display
- [ ] Test any interactive elements
- [ ] Verify data accuracy

#### ☐ Page 6: Anomalies Page
- [ ] Navigate to /anomalies
- [ ] Verify anomaly detection works
- [ ] Test filters/sorting
- [ ] Check flagged items

---

## TASK 22: OPTIMIZATION & BUG FIXES

### Performance Checks

#### ☐ Page Load Times
Use browser DevTools → Network tab (disable cache)

1. [ ] Dashboard load time: < 2 seconds
2. [ ] Courses page load time: < 1.5 seconds
3. [ ] Course details load time: < 1 second
4. [ ] API response times: < 500ms average

#### ☐ Database Query Performance
Check backend logs for query times

1. [ ] Category averages query: < 100ms
2. [ ] Question distribution query: < 150ms
3. [ ] Completion rates query: < 200ms
4. [ ] Dashboard stats query: < 250ms

#### ☐ Memory Usage
Check browser DevTools → Performance tab

1. [ ] Record page load
2. [ ] Check memory heap size
3. [ ] Verify no memory leaks
4. [ ] Test with 100+ evaluations (if data available)

---

### Bug Discovery & Documentation

#### Issues Found During Testing

| # | Page | Issue | Severity | Status |
|---|------|-------|----------|--------|
| 1 |      |       |          |        |
| 2 |      |       |          |        |
| 3 |      |       |          |        |

**Severity Levels**:
- 🔴 **Critical**: Blocks functionality, must fix
- 🟡 **Medium**: Degraded UX, should fix
- 🟢 **Low**: Minor issue, nice to fix

---

### Console Warnings to Review

Document any warnings seen in browser console:

```
Example:
[Warning] React: useEffect has missing dependency 'data'
Location: Dashboard.jsx line 145
Action: Review dependency array
```

---

## OPTIMIZATION TASKS

### ☐ Caching Implementation
- [ ] Add caching to dashboard stats (5 minutes TTL)
- [ ] Cache category averages per course
- [ ] Cache completion rates (refresh every hour)
- [ ] Implement React Query or SWR for frontend caching

### ☐ Database Indexing
Review and add indexes if needed:
- [ ] `evaluations` table: course_id, student_id
- [ ] `class_sections` table: course_id, semester
- [ ] `enrollments` table: student_id, class_section_id

### ☐ Code Optimization
- [ ] Add loading skeletons for better UX
- [ ] Implement lazy loading for large datasets
- [ ] Debounce search inputs (300ms delay)
- [ ] Optimize React re-renders (useMemo, useCallback)

---

## FINAL CHECKLIST

### Before Merging to Main Branch

- [ ] All Task 7 tests pass ✅
- [ ] All Task 21 tests pass ✅
- [ ] No critical bugs discovered
- [ ] Performance meets requirements (<2s page load)
- [ ] Code review completed
- [ ] Console warnings reviewed and documented
- [ ] Database queries optimized
- [ ] All new features tested on 3 screen sizes
- [ ] Tested with real user data (not just mock)
- [ ] Backend logs reviewed (no errors)
- [ ] Git commit messages are clear
- [ ] README updated (if needed)
- [ ] API documentation updated (if needed)

---

## TESTING SUMMARY

**Total Test Cases**: 60+  
**Estimated Testing Time**: 2-3 hours  
**Test Coverage**:
- ✅ Role access (secretary, dept-head)
- ✅ All 4 new endpoint types
- ✅ 3 new React components
- ✅ Dashboard integration
- ✅ Contact Admin modal
- ✅ Category averages visualization
- ✅ Question distribution analysis
- ✅ Completion tracking system
- ✅ Responsive design
- ✅ Navigation flow

**Success Criteria**:
- 100% of critical tests pass
- Zero critical bugs
- Performance within targets
- Clean console (no red errors)

---

## NEXT STEPS AFTER TESTING

1. **Document Results**: Fill in checkboxes above
2. **Fix Critical Bugs**: Address any 🔴 severity issues
3. **Optimize Performance**: If load times > targets
4. **Final Code Review**: Review all changed files
5. **Merge Branch**: 
   ```bash
   git checkout main
   git merge feature/secretary-depthead-overhaul
   git push origin main
   ```
6. **Deploy to Production**: Follow deployment checklist in SECRETARY_DEPTHEAD_TASKS_STATUS.md
7. **User Training**: Train secretaries and dept heads on new features

---

**Start Testing Now**: http://localhost:5174  
**Backend API Docs**: http://127.0.0.1:8000/docs  
**Backend Status**: ✅ Running  
**Frontend Status**: ✅ Running

