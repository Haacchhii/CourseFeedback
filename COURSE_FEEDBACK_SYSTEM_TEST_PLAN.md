# COURSE FEEDBACK EVALUATION SYSTEM

## SOFTWARE TESTING PLAN

**(ALPHA / BETA) TESTING**

---

## FUNCTIONAL TESTING

### Authentication & Authorization

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 1: User Login** | Verify that users can log in with valid credentials (Student, Secretary, Department Head, Admin) | | | | | | | | | |
| | Test login with invalid credentials (wrong email/password) | | | | | | | | | |
| | Verify role-based redirection after successful login | | | | | | | | | |
| | Check "Remember Me" functionality | | | | | | | | | |
| **Test Case 2: Password Management** | Test "Forgot Password" functionality with valid email | | | | | | | | | |
| | Verify password reset link is sent via email | | | | | | | | | |
| | Test password change with old and new password | | | | | | | | | |
| | Verify "Must Change Password" flag for first-time login | | | | | | | | | |
| **Test Case 3: Session Management** | Verify user session persists across page refreshes | | | | | | | | | |
| | Test automatic logout after inactivity timeout | | | | | | | | | |
| | Check that unauthorized users cannot access protected routes | | | | | | | | | |

---

### Student Module

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 4: View Enrolled Courses** | Verify student can view their enrolled courses | | | | | | | | | |
| | Check course details display correctly (code, name, instructor, schedule) | | | | | | | | | |
| | Test filtering by semester and year level | | | | | | | | | |
| **Test Case 5: Submit Evaluation** | Test evaluation form loads with correct course and instructor info | | | | | | | | | |
| | Verify all 31 evaluation questions are displayed correctly | | | | | | | | | |
| | Test rating scale (1-5) for each question category | | | | | | | | | |
| | Verify text feedback/comment submission | | | | | | | | | |
| | Test submission with incomplete form (validation) | | | | | | | | | |
| | Verify success message after submission | | | | | | | | | |
| **Test Case 6: Evaluation History** | Verify student can view previously submitted evaluations | | | | | | | | | |
| | Test edit functionality for pending evaluations | | | | | | | | | |
| | Check that submitted evaluations cannot be edited after deadline | | | | | | | | | |

---

### Secretary Module

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 7: Dashboard** | Verify dashboard displays correct statistics (total courses, evaluations, participation rate) | | | | | | | | | |
| | Check real-time data updates for participation rate card | | | | | | | | | |
| | Test completion rate cards display correct percentages | | | | | | | | | |
| **Test Case 8: Course Management** | Test creating a new course with valid data | | | | | | | | | |
| | Verify semester conversion (string to integer mapping) | | | | | | | | | |
| | Test editing existing course details | | | | | | | | | |
| | Test deleting a course (should fail if sections exist) | | | | | | | | | |
| | Verify program-based access control (secretary can only manage assigned programs) | | | | | | | | | |
| **Test Case 9: Section Management** | Test creating class sections for courses | | | | | | | | | |
| | Verify instructor assignment to sections | | | | | | | | | |
| | Check max students and enrollment count display | | | | | | | | | |
| | Test section filtering by program and year level | | | | | | | | | |
| **Test Case 10: Evaluations View** | Verify evaluations list displays with pagination (page_size: 100) | | | | | | | | | |
| | Test filtering by course, sentiment, and semester | | | | | | | | | |
| | Check that student names display correctly from user relationship | | | | | | | | | |
| | Verify evaluation details (ratings, feedback, submission date) | | | | | | | | | |
| **Test Case 11: Courses Page** | Verify all cards display real-time data (enrollment count, response rate, overall rating) | | | | | | | | | |
| | Test course-level sentiment analysis chart | | | | | | | | | |
| | Check category averages (6 categories) display correctly | | | | | | | | | |
| | Test question distribution (31 questions) visualization | | | | | | | | | |
| **Test Case 12: Sentiment Analysis** | Verify sentiment trends chart displays data by date | | | | | | | | | |
| | Test time range filters (week, month, semester, year) | | | | | | | | | |
| | Check positive/neutral/negative sentiment counts | | | | | | | | | |
| | Verify GROUP BY query executes without errors (cast to Date fix) | | | | | | | | | |

---

### Department Head Module

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 13: Dashboard** | Verify department-wide statistics display correctly | | | | | | | | | |
| | Check participation rate calculation from enrollments | | | | | | | | | |
| | Test completion tracking (Course Completion Table without instructor column) | | | | | | | | | |
| **Test Case 14: Department Evaluations** | Verify evaluations are filtered by department programs | | | | | | | | | |
| | Test pagination with page_size limit (max 100) | | | | | | | | | |
| | Check all required fields are returned (student, comment, semester, anomaly) | | | | | | | | | |
| | Verify courseId and sectionId for proper data matching | | | | | | | | | |
| **Test Case 15: Department Courses** | Test courses display with actual enrolled_students count from enrollments table | | | | | | | | | |
| | Verify overallRating from API is prioritized over recalculation | | | | | | | | | |
| | Check evaluation matching by sectionId (primary) or courseId (fallback) | | | | | | | | | |
| **Test Case 16: Sentiment Analysis** | Verify sentiment analysis executes without GROUP BY errors | | | | | | | | | |
| | Test data aggregation by date using cast(date_trunc(), Date) | | | | | | | | | |
| | Check trend visualization for department-wide sentiment | | | | | | | | | |
| **Test Case 17: Anomaly Detection** | Verify anomaly detection identifies outlier evaluations | | | | | | | | | |
| | Test anomaly flagging based on ML model predictions | | | | | | | | | |
| | Check anomaly list displays with proper filtering | | | | | | | | | |

---

### Admin Module

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 18: User Management** | Test creating users for all roles (Student, Secretary, Dept Head, Admin) | | | | | | | | | |
| | Verify password hash generation and storage | | | | | | | | | |
| | Test editing user details (name, email, department, role) | | | | | | | | | |
| | Verify user deactivation (is_active flag) | | | | | | | | | |
| | Test password reset for users | | | | | | | | | |
| **Test Case 19: Evaluation Period Management** | Test creating evaluation periods with start/end dates | | | | | | | | | |
| | Verify period status changes (draft, active, closed) | | | | | | | | | |
| | Test enrolling sections into evaluation periods | | | | | | | | | |
| | Check program section enrollment functionality | | | | | | | | | |
| **Test Case 20: Program & Section Management** | Test creating programs (code, name, department) | | | | | | | | | |
| | Verify creating program sections (year level groupings) | | | | | | | | | |
| | Test assigning students to program sections | | | | | | | | | |
| | Check bulk student enrollment to class sections | | | | | | | | | |
| **Test Case 21: System Settings** | Test updating system configuration settings | | | | | | | | | |
| | Verify email configuration for notifications | | | | | | | | | |
| | Test audit log settings and retention | | | | | | | | | |
| **Test Case 22: Reports & Analytics** | Verify department overview reports generate correctly | | | | | | | | | |
| | Test evaluation summary reports with filters | | | | | | | | | |
| | Check category averages calculation (6 categories) | | | | | | | | | |
| | Test question distribution reports (31 questions) | | | | | | | | | |
| | Verify completion rate reports for all courses | | | | | | | | | |
| **Test Case 23: Data Export** | Test exporting users data (JSON/CSV formats) | | | | | | | | | |
| | Verify evaluation data export with date range filters | | | | | | | | | |
| | Test courses and analytics data export | | | | | | | | | |
| | Check audit logs export functionality | | | | | | | | | |
| | Verify full system export includes all tables | | | | | | | | | |
| **Test Case 24: Audit Logs** | Verify all CRUD operations are logged with user_id, action, timestamp | | | | | | | | | |
| | Test audit log filtering by date range and action type | | | | | | | | | |
| | Check audit log statistics display correctly | | | | | | | | | |

---

## NON-FUNCTIONAL TESTING

### User Experience Testing

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 25: User Interface** | Verify clarity and consistency of UI across all pages | | | | | | | | | |
| | Check responsive design on desktop (1920x1080, 1366x768) | | | | | | | | | |
| | Test mobile responsiveness (phone and tablet views) | | | | | | | | | |
| | Verify Tailwind CSS styling consistency | | | | | | | | | |
| | Check navigation menu accessibility and intuitiveness | | | | | | | | | |
| **Test Case 26: Data Visualization** | Verify charts render correctly (Chart.js/Recharts) | | | | | | | | | |
| | Test sentiment analysis trend charts with real data | | | | | | | | | |
| | Check category averages bar/radar charts | | | | | | | | | |
| | Verify question distribution visualizations | | | | | | | | | |
| **Test Case 27: Form Usability** | Test form validation messages are clear and helpful | | | | | | | | | |
| | Verify error states display correctly with appropriate styling | | | | | | | | | |
| | Check loading states during API calls | | | | | | | | | |
| | Test success/error toast notifications | | | | | | | | | |
| **Test Case 28: System Performance** | Measure page load times for dashboard (<3 seconds) | | | | | | | | | |
| | Test API response times for evaluation submission (<2 seconds) | | | | | | | | | |
| | Verify pagination performance with 100+ records | | | | | | | | | |
| | Check database query performance with large datasets (1000+ evaluations) | | | | | | | | | |
| | Test sentiment analysis ML model inference time | | | | | | | | | |

---

### Accessibility Testing

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 29: Color Contrast** | Verify text and icons have sufficient color contrast (WCAG AA standard) | | | | | | | | | |
| | Test with different color blindness simulations (protanopia, deuteranopia) | | | | | | | | | |
| | Check sentiment color coding (green/yellow/red) is distinguishable | | | | | | | | | |
| **Test Case 30: Keyboard Navigation** | Ensure all elements can be accessed using keyboard (Tab, Enter, Escape) | | | | | | | | | |
| | Test form submission with keyboard only | | | | | | | | | |
| | Verify modal dialogs can be closed with Escape key | | | | | | | | | |
| | Check focus indicators are visible on interactive elements | | | | | | | | | |
| **Test Case 31: Screen Reader Compatibility** | Test with NVDA/JAWS screen readers | | | | | | | | | |
| | Verify proper ARIA labels on interactive elements | | | | | | | | | |
| | Check table data is properly announced | | | | | | | | | |

---

### Security Testing

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 32: Input Validation** | Verify all form inputs have server-side validation | | | | | | | | | |
| | Test SQL injection attempts in search and filter fields | | | | | | | | | |
| | Check for XSS (Cross-Site Scripting) vulnerabilities in text feedback | | | | | | | | | |
| | Verify file upload validation (if applicable) | | | | | | | | | |
| **Test Case 33: Authentication Security** | Test JWT token expiration and refresh mechanism | | | | | | | | | |
| | Verify password hashing (bcrypt) is properly implemented | | | | | | | | | |
| | Check for brute force protection on login endpoint | | | | | | | | | |
| | Test session hijacking prevention | | | | | | | | | |
| **Test Case 34: Authorization & Access Control** | Verify role-based access control (RBAC) enforces permissions | | | | | | | | | |
| | Test that students cannot access admin/secretary routes | | | | | | | | | |
| | Check secretary can only access assigned program data | | | | | | | | | |
| | Verify department heads only see their department data | | | | | | | | | |
| **Test Case 35: Data Privacy and Security** | Ensure user passwords are never exposed in API responses | | | | | | | | | |
| | Verify student evaluation data is properly anonymized for instructors | | | | | | | | | |
| | Test that database connection uses SSL/TLS encryption (Supabase) | | | | | | | | | |
| | Check API endpoints use HTTPS in production | | | | | | | | | |
| | Verify sensitive data is not logged in application logs | | | | | | | | | |
| **Test Case 36: API Security** | Test CORS (Cross-Origin Resource Sharing) configuration | | | | | | | | | |
| | Verify API rate limiting prevents abuse | | | | | | | | | |
| | Check for proper error handling (no stack traces exposed) | | | | | | | | | |
| | Test API authentication token validation | | | | | | | | | |

---

### Database & Data Integrity Testing

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 37: Database Connections** | Verify PostgreSQL connection pooling works correctly | | | | | | | | | |
| | Test connection resilience during database restart | | | | | | | | | |
| | Check Supabase connection string configuration | | | | | | | | | |
| **Test Case 38: Data Consistency** | Verify foreign key constraints are enforced (CASCADE deletes) | | | | | | | | | |
| | Test data integrity after concurrent updates | | | | | | | | | |
| | Check evaluation data consistency (ratings, sentiment, anomaly flag) | | | | | | | | | |
| **Test Case 39: Database Migrations** | Test all migration scripts execute without errors | | | | | | | | | |
| | Verify rollback procedures for failed migrations | | | | | | | | | |
| | Check schema version tracking in alembic_version table | | | | | | | | | |
| **Test Case 40: Backup & Recovery** | Test database backup creation | | | | | | | | | |
| | Verify backup restoration process | | | | | | | | | |
| | Check backup retention and scheduling | | | | | | | | | |

---

### Integration Testing

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 41: Frontend-Backend Integration** | Test React app communicates with FastAPI backend correctly | | | | | | | | | |
| | Verify Axios interceptors handle authentication tokens | | | | | | | | | |
| | Check error handling for 401, 403, 404, 500 status codes | | | | | | | | | |
| **Test Case 42: Machine Learning Integration** | Test sentiment analysis model integration with evaluation submission | | | | | | | | | |
| | Verify anomaly detection model runs on new evaluations | | | | | | | | | |
| | Check model prediction results are stored correctly | | | | | | | | | |
| **Test Case 43: Email Service Integration** | Test email sending for password reset | | | | | | | | | |
| | Verify notification emails for evaluation periods | | | | | | | | | |
| | Check email template rendering | | | | | | | | | |

---

### Regression Testing (Post-Bug Fixes)

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 44: GROUP BY Error Fix** | Verify sentiment analysis query uses cast(date_trunc(), Date) | | | | | | | | | |
| | Test that date_col variable is reused in SELECT and GROUP BY | | | | | | | | | |
| | Check no PostgreSQL GroupingError occurs | | | | | | | | | |
| **Test Case 45: Pagination Fix** | Verify page_size parameter accepts values up to 100 (not 1000) | | | | | | | | | |
| | Test 422 error is not thrown for valid page_size | | | | | | | | | |
| **Test Case 46: Secretary Programs Assignment** | Verify secretary has programs assigned (not NULL) | | | | | | | | | |
| | Test evaluations are filtered by secretary's assigned programs | | | | | | | | | |
| **Test Case 47: Student Name Display Fix** | Verify student names use student.user.first_name relationship | | | | | | | | | |
| | Test fallback to student_number when user data unavailable | | | | | | | | | |
| **Test Case 48: Evaluation Field Fix** | Verify evaluation queries use submission_date (not created_at) | | | | | | | | | |
| | Test ORDER BY submission_date works correctly | | | | | | | | | |
| **Test Case 49: Course Data Display** | Verify courses page uses API data (overallRating, enrolledStudents) | | | | | | | | | |
| | Test evaluation matching by sectionId (primary) or courseId (fallback) | | | | | | | | | |
| **Test Case 50: Instructor Column Removal** | Verify Course Completion Table has 6 columns (not 7) | | | | | | | | | |
| | Test instructor column removed from search, sort, header, body | | | | | | | | | |

---

## TEST ENVIRONMENT

**Hardware:**
- Desktop PC: Windows 10/11, 8GB+ RAM, Intel i5 or equivalent
- Mobile Devices: Android (Chrome), iOS (Safari)

**Software:**
- Backend: Python 3.13, FastAPI, SQLAlchemy 2.0.44, psycopg v3
- Frontend: React 18.3, Vite 5.x, Tailwind CSS 3.x
- Database: PostgreSQL 14+ (Supabase hosted)
- Browsers: Chrome 120+, Firefox 120+, Edge 120+, Safari 17+

**Test Data:**
- 7 Programs (BSIT, BSCS, etc.)
- 35+ Courses across multiple programs
- 3+ Student evaluations with varied sentiments
- Multiple user accounts per role
- Active evaluation periods

---

## TEST SCHEDULE

| **Phase** | **Duration** | **Start Date** | **End Date** |
|---|---|---|---|
| Alpha Testing (Internal) | 2 weeks | | |
| Bug Fixing Round 1 | 1 week | | |
| Beta Testing (User Acceptance) | 2 weeks | | |
| Bug Fixing Round 2 | 1 week | | |
| Final Regression Testing | 3 days | | |
| Production Deployment | 1 day | | |

---

## DEFECT SEVERITY LEVELS

| **Level** | **Description** | **Examples** |
|---|---|---|
| **Critical** | System crash, data loss, security breach | Database connection failure, SQL injection vulnerability |
| **High** | Major functionality broken | Login fails, evaluations cannot be submitted |
| **Medium** | Feature partially works, workaround exists | Chart not displaying, filter not working |
| **Low** | Minor UI issues, cosmetic problems | Alignment issues, typos, color inconsistencies |

---

## SIGN-OFF

| **Role** | **Name** | **Signature** | **Date** |
|---|---|---|---|
| Test Lead | | | |
| Developer | | | |
| Project Manager | | | |
| Stakeholder | | | |
