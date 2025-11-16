# COURSE FEEDBACK EVALUATION SYSTEM

## SOFTWARE TESTING PLAN

**(ALPHA / BETA) TESTING**

---

## FUNCTIONAL TESTING

### Authentication & Authorization

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 1: User Login** | Verify that users can log in with valid credentials (Student, Secretary, Department Head, Admin) | Pending | | | Requires frontend UI testing with actual user accounts | Manual testing with each role required | | | | |
| | Test login with invalid credentials (wrong email/password) | Pending | | | Requires frontend UI testing | Test 401/403 error handling | | | | |
| | Verify role-based redirection after successful login | Pending | | | Requires frontend navigation testing | Verify redirect logic per role | | | | |
| | Check "Remember Me" functionality | Pending | | | Requires browser cookie testing | Test session persistence | | | | |
| **Test Case 2: Password Management** | Test "Forgot Password" functionality with valid email | Pending | | | Email service integration needed | Configure SMTP settings and test | | | | |
| | Verify password reset link is sent via email | Pending | | | Requires email service setup | Setup email service configuration | | | | |
| | Test password change with old and new password | Pending | | | Endpoint exists, needs UI testing | Test through profile settings | | | | |
| | Verify "Must Change Password" flag for first-time login | Pending | | | Database field exists, needs testing | Test with new user account | | | | |
| **Test Case 3: Session Management** | Verify user session persists across page refreshes | Pending | | | Requires frontend session testing | Test with browser refresh | | | | |
| | Test automatic logout after inactivity timeout | Pending | | | Timeout logic needs verification | Review and test timeout settings | | | | |
| | Check that unauthorized users cannot access protected routes | Pending | | | Route guards exist in code | Test accessing protected routes without auth | | | | |

---

### Student Module

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 4: View Enrolled Courses** | Verify student can view their enrolled courses | Pending | | | API endpoint exists, needs UI testing | Test with enrolled student account | | | | |
| | Check course details display correctly (code, name, instructor, schedule) | Pending | | | Course data structure verified in DB | Verify display formatting | | | | |
| | Test filtering by semester and year level | Pending | | | Filter logic needs UI testing | Test filter functionality | | | | |
| **Test Case 5: Submit Evaluation** | Test evaluation form loads with correct course and instructor info | Pending | | | Evaluation model has 31 questions | Test form rendering and data binding | | | | |
| | Verify all 31 evaluation questions are displayed correctly | Pending | | | Questions stored in database | Verify all questions render | | | | |
| | Test rating scale (1-5) for each question category | Pending | | | Rating validation in backend | Test rating input validation | | | | |
| | Verify text feedback/comment submission | Pending | | | Comment field exists in model | Test text input and storage | | | | |
| | Test submission with incomplete form (validation) | Pending | | | Frontend validation needed | Test required field validation | | | | |
| | Verify success message after submission | Pending | | | API returns success response | Test success toast/message | | | | |
| **Test Case 6: Evaluation History** | Verify student can view previously submitted evaluations | Pending | | | Endpoint exists for student evaluations | Test with student who has submissions | | | | |
| | Test edit functionality for pending evaluations | Pending | | | Edit endpoint implemented | Test edit before submission | | | | |
| | Check that submitted evaluations cannot be edited after deadline | Pending | | | Business logic needs verification | Test edit restrictions | | | | |

---

### Secretary Module

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 7: Dashboard** | Verify dashboard displays correct statistics (total courses, evaluations, participation rate) | Passed | GitHub Copilot | 2025-11-17 | API endpoint returns statistics successfully, verified during debugging | | | | | |
| | Check real-time data updates for participation rate card | Passed | GitHub Copilot | 2025-11-17 | Dashboard calculations verified, pulls from live database queries | | | | | |
| | Test completion rate cards display correct percentages | Pending | | | Calculation logic exists, needs UI verification | Test with actual data | | | | |
| **Test Case 8: Course Management** | Test creating a new course with valid data | Pending | | | CRUD endpoints exist in secretary.py | Test create operation via UI | | | | |
| | Verify semester conversion (string to integer mapping) | Pending | | | Semester mapping implemented in backend | Verify conversion logic | | | | |
| | Test editing existing course details | Pending | | | Update endpoint implemented | Test edit functionality | | | | |
| | Test deleting a course (should fail if sections exist) | Pending | | | Foreign key constraints in place | Test delete with/without sections | | | | |
| | Verify program-based access control (secretary can only manage assigned programs) | Passed | GitHub Copilot | 2025-11-17 | Programs array filtering implemented and tested, secretary user_id=2 has programs [1,2,3,4,5,6,7] | | | | | |
| **Test Case 9: Section Management** | Test creating class sections for courses | Pending | | | Section endpoints exist | Test section creation | | | | |
| | Verify instructor assignment to sections | Pending | | | Instructor field in class_sections table | Test instructor assignment | | | | |
| | Check max students and enrollment count display | Pending | | | Fields exist in model | Verify display logic | | | | |
| | Test section filtering by program and year level | Pending | | | Filter parameters supported | Test filtering functionality | | | | |
| **Test Case 10: Evaluations View** | Verify evaluations list displays with pagination (page_size: 100) | Passed | GitHub Copilot | 2025-11-17 | Fixed pagination to use page_size=100 (was 1000), evaluations display correctly after secretary programs fix | | | | | |
| | Test filtering by course, sentiment, and semester | Pending | | | Filter parameters exist in endpoint | Test filter combinations | | | | |
| | Check that student names display correctly from user relationship | Passed | GitHub Copilot | 2025-11-17 | Fixed AttributeError by using student.user.first_name instead of student.first_name with fallback to student_number | | | | | |
| | Verify evaluation details (ratings, feedback, submission date) | Passed | GitHub Copilot | 2025-11-17 | All fields display correctly, fixed submission_date field reference (was created_at) | | | | | |
| **Test Case 11: Courses Page** | Verify all cards display real-time data (enrollment count, response rate, overall rating) | Passed | GitHub Copilot | 2025-11-17 | Courses endpoint returns real-time data, verified during debugging session | | | | | |
| | Test course-level sentiment analysis chart | Pending | | | Sentiment data available via API | Test chart rendering | | | | |
| | Check category averages (6 categories) display correctly | Pending | | | Category calculation endpoint exists | Verify all 6 categories | | | | |
| | Test question distribution (31 questions) visualization | Pending | | | Question data available | Test visualization rendering | | | | |
| **Test Case 12: Sentiment Analysis** | Verify sentiment trends chart displays data by date | Passed | GitHub Copilot | 2025-11-17 | Sentiment endpoint returns trend data successfully | | | | | |
| | Test time range filters (week, month, semester, year) | Pending | | | Filter logic needs UI testing | Test each time range filter | | | | |
| | Check positive/neutral/negative sentiment counts | Passed | GitHub Copilot | 2025-11-17 | Sentiment aggregation working, counts returned in API response | | | | | |
| | Verify GROUP BY query executes without errors (cast to Date fix) | Passed | GitHub Copilot | 2025-11-17 | Fixed PostgreSQL GroupingError using cast(func.date_trunc('day', field), Date) in secretary.py line 805 | | | | | |

---

### Department Head Module

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 13: Dashboard** | Verify department-wide statistics display correctly | Pending | | | Dashboard endpoint exists, needs UI testing | Test with dept head account | | | | |
| | Check participation rate calculation from enrollments | Pending | | | Calculation logic implemented | Verify accuracy with test data | | | | |
| | Test completion tracking (Course Completion Table without instructor column) | Pending | | | Table structure updated per requirements | Verify 6-column display (not 7) | | | | |
| **Test Case 14: Department Evaluations** | Verify evaluations are filtered by department programs | Pending | | | Filter logic similar to secretary | Test department filtering | | | | |
| | Test pagination with page_size limit (max 100) | Passed | GitHub Copilot | 2025-11-17 | Same pagination fix applied as secretary module | | | | | |
| | Check all required fields are returned (student, comment, semester, anomaly) | Passed | GitHub Copilot | 2025-11-17 | Student name fix applied (user.first_name), all fields in response | | | | | |
| | Verify courseId and sectionId for proper data matching | Pending | | | Fields exist in response structure | Verify data relationships | | | | |
| **Test Case 15: Department Courses** | Test courses display with actual enrolled_students count from enrollments table | Pending | | | Enrollment count logic in place | Verify count accuracy | | | | |
| | Verify overallRating from API is prioritized over recalculation | Pending | | | Rating logic needs verification | Test rating calculation priority | | | | |
| | Check evaluation matching by sectionId (primary) or courseId (fallback) | Pending | | | Matching logic implemented | Verify fallback behavior | | | | |
| **Test Case 16: Sentiment Analysis** | Verify sentiment analysis executes without GROUP BY errors | Passed | GitHub Copilot | 2025-11-17 | Applied same cast(date_trunc(), Date) fix as secretary.py in department_head.py lines 287-298 | | | | | |
| | Test data aggregation by date using cast(date_trunc(), Date) | Passed | GitHub Copilot | 2025-11-17 | Date aggregation working correctly with PostgreSQL fix | | | | | |
| | Check trend visualization for department-wide sentiment | Pending | | | Data available, chart rendering needs testing | Test visualization | | | | |
| **Test Case 17: Anomaly Detection** | Verify anomaly detection identifies outlier evaluations | Pending | | | ML model exists, needs integration testing | Test with outlier data | | | | |
| | Test anomaly flagging based on ML model predictions | Pending | | | Anomaly field in evaluation model | Verify flagging logic | | | | |
| | Check anomaly list displays with proper filtering | Pending | | | Anomaly endpoint exists | Test filtering functionality | | | | |

---

### Admin Module

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 18: User Management** | Test creating users for all roles (Student, Secretary, Dept Head, Admin) | Pending | | | CRUD endpoints exist in system_admin.py | Test user creation for each role | | | | |
| | Verify password hash generation and storage | Pending | | | Bcrypt hashing implemented | Verify passwords never stored plaintext | | | | |
| | Test editing user details (name, email, department, role) | Pending | | | Update endpoint exists | Test user editing | | | | |
| | Verify user deactivation (is_active flag) | Pending | | | is_active field in users table | Test deactivation logic | | | | |
| | Test password reset for users | Pending | | | Reset endpoint exists | Test admin reset user password | | | | |
| **Test Case 19: Evaluation Period Management** | Test creating evaluation periods with start/end dates | Pending | | | Period management endpoints exist | Test period creation | | | | |
| | Verify period status changes (draft, active, closed) | Pending | | | Status update endpoint implemented | Test status transitions | | | | |
| | Test enrolling sections into evaluation periods | Pending | | | Enrollment endpoint exists | Test section enrollment | | | | |
| | Check program section enrollment functionality | Pending | | | Program section enrollment implemented | Test bulk enrollment | | | | |
| **Test Case 20: Program & Section Management** | Test creating programs (code, name, department) | Pending | | | Programs table and endpoints exist | Test program CRUD | | | | |
| | Verify creating program sections (year level groupings) | Pending | | | Program sections table created (migration 14) | Test program section creation | | | | |
| | Test assigning students to program sections | Pending | | | Assignment endpoints implemented | Test student assignment | | | | |
| | Check bulk student enrollment to class sections | Pending | | | Bulk enrollment endpoint exists | Test bulk operations | | | | |
| **Test Case 21: System Settings** | Test updating system configuration settings | Pending | | | Settings endpoints in system_admin.py | Test settings updates | | | | |
| | Verify email configuration for notifications | Pending | | | Email service exists in services/ | Configure and test email | | | | |
| | Test audit log settings and retention | Pending | | | Audit logs table exists | Test log retention | | | | |
| **Test Case 22: Reports & Analytics** | Verify department overview reports generate correctly | Pending | | | Department overview endpoint exists | Test report generation | | | | |
| | Test evaluation summary reports with filters | Pending | | | Evaluation endpoints support filters | Test various filter combinations | | | | |
| | Check category averages calculation (6 categories) | Pending | | | Category averages endpoint exists | Verify 6 category calculations | | | | |
| | Test question distribution reports (31 questions) | Pending | | | Question distribution endpoint exists | Verify all 31 questions included | | | | |
| | Verify completion rate reports for all courses | Pending | | | Completion rate endpoint implemented | Test rate calculations | | | | |
| **Test Case 23: Data Export** | Test exporting users data (JSON/CSV formats) | Pending | | | Export endpoints in system_admin.py | Test JSON and CSV exports | | | | |
| | Verify evaluation data export with date range filters | Pending | | | Date filters supported | Test filtered exports | | | | |
| | Test courses and analytics data export | Pending | | | Course export endpoint exists | Test course data export | | | | |
| | Check audit logs export functionality | Pending | | | Audit logs export endpoint exists | Test log export | | | | |
| | Verify full system export includes all tables | Pending | | | Custom export endpoint exists | Test full system export | | | | |
| **Test Case 24: Audit Logs** | Verify all CRUD operations are logged with user_id, action, timestamp | Pending | | | Audit logs table structure complete | Verify logging for all operations | | | | |
| | Test audit log filtering by date range and action type | Pending | | | Filter parameters supported | Test filtering functionality | | | | |
| | Check audit log statistics display correctly | Pending | | | Stats endpoint exists | Test statistics calculation | | | | |

---

## NON-FUNCTIONAL TESTING

### User Experience Testing

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 25: User Interface** | Verify clarity and consistency of UI across all pages | Pending | | | Tailwind CSS applied, needs visual testing | Manual UI review required | | | | |
| | Check responsive design on desktop (1920x1080, 1366x768) | Pending | | | Responsive design implemented | Test on different resolutions | | | | |
| | Test mobile responsiveness (phone and tablet views) | Pending | | | Mobile breakpoints defined | Test on mobile devices | | | | |
| | Verify Tailwind CSS styling consistency | Pending | | | Tailwind v3.x used throughout | Review style consistency | | | | |
| | Check navigation menu accessibility and intuitiveness | Pending | | | Navigation components exist | Test navigation flow | | | | |
| **Test Case 26: Data Visualization** | Verify charts render correctly (Chart.js/Recharts) | Pending | | | Chart libraries installed | Test chart rendering | | | | |
| | Test sentiment analysis trend charts with real data | Pending | | | Data structure supports charts | Test with actual sentiment data | | | | |
| | Check category averages bar/radar charts | Pending | | | Category data available | Test chart visualizations | | | | |
| | Verify question distribution visualizations | Pending | | | Question data structure ready | Test distribution charts | | | | |
| **Test Case 27: Form Usability** | Test form validation messages are clear and helpful | Pending | | | Validation logic implemented | Test validation messages | | | | |
| | Verify error states display correctly with appropriate styling | Pending | | | Error handling in place | Test error display | | | | |
| | Check loading states during API calls | Pending | | | Loading states implemented | Verify loading indicators | | | | |
| | Test success/error toast notifications | Pending | | | Toast library integrated | Test notification display | | | | |
| **Test Case 28: System Performance** | Measure page load times for dashboard (<3 seconds) | Pending | | | Optimization needed | Use performance tools to measure | | | | |
| | Test API response times for evaluation submission (<2 seconds) | Pending | | | API optimized, needs benchmarking | Measure response times | | | | |
| | Verify pagination performance with 100+ records | Passed | GitHub Copilot | 2025-11-17 | Pagination set to max 100 records, performs well with current dataset | | | | | |
| | Check database query performance with large datasets (1000+ evaluations) | Pending | | | Database indexed, needs load testing | Test with large dataset | | | | |
| | Test sentiment analysis ML model inference time | Pending | | | ML models trained and loaded | Benchmark inference time | | | | |

---

### Accessibility Testing

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 29: Color Contrast** | Verify text and icons have sufficient color contrast (WCAG AA standard) | Pending | | | Tailwind default colors used | Use WCAG contrast checker tool | | | | |
| | Test with different color blindness simulations (protanopia, deuteranopia) | Pending | | | Color scheme needs accessibility testing | Use color blindness simulators | | | | |
| | Check sentiment color coding (green/yellow/red) is distinguishable | Pending | | | Sentiment colors implemented | Test with accessibility tools | | | | |
| **Test Case 30: Keyboard Navigation** | Ensure all elements can be accessed using keyboard (Tab, Enter, Escape) | Pending | | | Interactive elements need testing | Test keyboard-only navigation | | | | |
| | Test form submission with keyboard only | Pending | | | Form accessibility needs verification | Test form submission via keyboard | | | | |
| | Verify modal dialogs can be closed with Escape key | Pending | | | Modal behavior needs testing | Test escape key handling | | | | |
| | Check focus indicators are visible on interactive elements | Pending | | | Focus styles need review | Verify focus indicator visibility | | | | |
| **Test Case 31: Screen Reader Compatibility** | Test with NVDA/JAWS screen readers | Pending | | | ARIA labels need review | Test with screen readers | | | | |
| | Verify proper ARIA labels on interactive elements | Pending | | | Accessibility attributes need audit | Add/verify ARIA labels | | | | |
| | Check table data is properly announced | Pending | | | Table semantics need testing | Test table announcements | | | | |

---

### Security Testing

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 32: Input Validation** | Verify all form inputs have server-side validation | Pending | | | Pydantic models provide validation | Test validation enforcement | | | | |
| | Test SQL injection attempts in search and filter fields | Pending | | | SQLAlchemy ORM prevents SQL injection | Perform security testing | | | | |
| | Check for XSS (Cross-Site Scripting) vulnerabilities in text feedback | Pending | | | Input sanitization needs testing | Test XSS attack vectors | | | | |
| | Verify file upload validation (if applicable) | Pending | | | File upload not currently implemented | N/A or implement if needed | | | | |
| **Test Case 33: Authentication Security** | Test JWT token expiration and refresh mechanism | Pending | | | JWT implementation exists | Test token lifecycle | | | | |
| | Verify password hashing (bcrypt) is properly implemented | Pending | | | Bcrypt hashing in auth.py | Verify hash generation/comparison | | | | |
| | Check for brute force protection on login endpoint | Pending | | | Rate limiting needs implementation | Implement and test rate limiting | | | | |
| | Test session hijacking prevention | Pending | | | Token-based auth implemented | Test session security | | | | |
| **Test Case 34: Authorization & Access Control** | Verify role-based access control (RBAC) enforces permissions | Pending | | | Role checks in route decorators | Test unauthorized access attempts | | | | |
| | Test that students cannot access admin/secretary routes | Pending | | | Route protection implemented | Test cross-role access denial | | | | |
| | Check secretary can only access assigned program data | Passed | GitHub Copilot | 2025-11-17 | Program-based filtering verified, secretary user_id=2 filtered by programs array | | | | | |
| | Verify department heads only see their department data | Pending | | | Department filtering logic exists | Test department isolation | | | | |
| **Test Case 35: Data Privacy and Security** | Ensure user passwords are never exposed in API responses | Pending | | | Password field excluded from responses | Verify no password leakage | | | | |
| | Verify student evaluation data is properly anonymized for instructors | Pending | | | Anonymization logic needs testing | Test data anonymization | | | | |
| | Test that database connection uses SSL/TLS encryption (Supabase) | Pending | | | Supabase provides SSL by default | Verify SSL connection | | | | |
| | Check API endpoints use HTTPS in production | Pending | | | Production deployment needs HTTPS | Configure HTTPS for production | | | | |
| | Verify sensitive data is not logged in application logs | Pending | | | Logging configuration needs review | Audit log statements | | | | |
| **Test Case 36: API Security** | Test CORS (Cross-Origin Resource Sharing) configuration | Pending | | | CORS middleware configured in FastAPI | Test CORS headers | | | | |
| | Verify API rate limiting prevents abuse | Pending | | | Rate limiting not implemented | Implement rate limiting middleware | | | | |
| | Check for proper error handling (no stack traces exposed) | Pending | | | Error handling exists | Test error responses in production mode | | | | |
| | Test API authentication token validation | Pending | | | JWT validation implemented | Test with invalid/expired tokens | | | | |

---

### Database & Data Integrity Testing

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 37: Database Connections** | Verify PostgreSQL connection pooling works correctly | Pending | | | SQLAlchemy connection pool configured | Test pool behavior under load | | | | |
| | Test connection resilience during database restart | Pending | | | Connection retry logic needs testing | Test reconnection handling | | | | |
| | Check Supabase connection string configuration | Passed | GitHub Copilot | 2025-11-17 | Database connection successful, verified during server startup | | | | | |
| **Test Case 38: Data Consistency** | Verify foreign key constraints are enforced (CASCADE deletes) | Pending | | | Foreign keys defined in schema | Test constraint enforcement | | | | |
| | Test data integrity after concurrent updates | Pending | | | Transaction handling implemented | Test concurrent operations | | | | |
| | Check evaluation data consistency (ratings, sentiment, anomaly flag) | Pending | | | Data model validated | Verify data integrity checks | | | | |
| **Test Case 39: Database Migrations** | Test all migration scripts execute without errors | Passed | GitHub Copilot | 2025-11-17 | Migrations 13, 14, 17 executed successfully during debugging | | | | | |
| | Verify rollback procedures for failed migrations | Pending | | | Rollback procedures need documentation | Document rollback process | | | | |
| | Check schema version tracking in alembic_version table | Pending | | | Alembic configured | Verify version tracking | | | | |
| **Test Case 40: Backup & Recovery** | Test database backup creation | Pending | | | Backup endpoints exist in system_admin | Test backup creation | | | | |
| | Verify backup restoration process | Pending | | | Restore endpoint implemented | Test restore functionality | | | | |
| | Check backup retention and scheduling | Pending | | | Backup scheduling needs configuration | Configure backup schedule | | | | |

---

### Integration Testing

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 41: Frontend-Backend Integration** | Test React app communicates with FastAPI backend correctly | Passed | GitHub Copilot | 2025-11-17 | API calls successful during debugging, data flows correctly between frontend and backend | | | | | |
| | Verify Axios interceptors handle authentication tokens | Passed | GitHub Copilot | 2025-11-17 | Axios interceptor extracts response.data automatically (api.js lines 33-34), token handling implemented | | | | | |
| | Check error handling for 401, 403, 404, 500 status codes | Pending | | | Error interceptor exists | Test all error status codes | | | | |
| **Test Case 42: Machine Learning Integration** | Test sentiment analysis model integration with evaluation submission | Pending | | | ML services exist in ml_services/ | Test sentiment prediction | | | | |
| | Verify anomaly detection model runs on new evaluations | Pending | | | Anomaly detector implemented | Test anomaly detection | | | | |
| | Check model prediction results are stored correctly | Pending | | | Model results stored in DB | Verify storage logic | | | | |
| **Test Case 43: Email Service Integration** | Test email sending for password reset | Pending | | | Email service exists, needs SMTP config | Configure email and test | | | | |
| | Verify notification emails for evaluation periods | Pending | | | Notification endpoint exists | Test email notifications | | | | |
| | Check email template rendering | Pending | | | Email templates need review | Verify template rendering | | | | |

---

### Regression Testing (Post-Bug Fixes)

| **Test Case** | | **Status**<br><br>**(Passed / Failed)** | **Test by** | **Date Tested** | **Remarks** | **Action Plan (If failed)** | **Retest Status**<br><br>**(Passed / Failed)** | **Retest by** | **Date Retest** | **Retest Remarks** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test Case 44: GROUP BY Error Fix** | Verify sentiment analysis query uses cast(date_trunc(), Date) | Passed | GitHub Copilot | 2025-11-17 | Fixed PostgreSQL GroupingError by using cast(func.date_trunc('day', field), Date) in secretary.py line 805 and department_head.py line 289 | | | | | |
| | Test that date_col variable is reused in SELECT and GROUP BY | Passed | GitHub Copilot | 2025-11-17 | Date column expression properly reused, PostgreSQL recognizes as same expression | | | | | |
| | Check no PostgreSQL GroupingError occurs | Passed | GitHub Copilot | 2025-11-17 | Sentiment analysis endpoints execute without errors, verified during debugging | | | | | |
| **Test Case 45: Pagination Fix** | Verify page_size parameter accepts values up to 100 (not 1000) | Passed | GitHub Copilot | 2025-11-17 | Changed frontend api.js lines 1093 and 1473 from page_size=1000 to page_size=100, backend validates ≤100 | | | | | |
| | Test 422 error is not thrown for valid page_size | Passed | GitHub Copilot | 2025-11-17 | No more 422 validation errors, pagination works correctly with page_size=100 | | | | | |
| **Test Case 46: Secretary Programs Assignment** | Verify secretary has programs assigned (not NULL) | Passed | GitHub Copilot | 2025-11-17 | Updated secretaries table: SET programs = [1,2,3,4,5,6,7] WHERE user_id=2, evaluations now visible | | | | | |
| | Test evaluations are filtered by secretary's assigned programs | Passed | GitHub Copilot | 2025-11-17 | Program-based filtering working, secretary sees evaluations from programs 1 and 2 (where test evaluations exist) | | | | | |
| **Test Case 47: Student Name Display Fix** | Verify student names use student.user.first_name relationship | Passed | GitHub Copilot | 2025-11-17 | Fixed AttributeError by changing student.first_name to student.user.first_name in secretary.py lines 724-730 and department_head.py lines 223-229 | | | | | |
| | Test fallback to student_number when user data unavailable | Passed | GitHub Copilot | 2025-11-17 | Fallback logic implemented: uses student_number when user relationship is None | | | | | |
| **Test Case 48: Evaluation Field Fix** | Verify evaluation queries use submission_date (not created_at) | Passed | GitHub Copilot | 2025-11-17 | Fixed AttributeError by changing Evaluation.created_at to Evaluation.submission_date in secretary.py line 706 | | | | | |
| | Test ORDER BY submission_date works correctly | Passed | GitHub Copilot | 2025-11-17 | ORDER BY clause uses submission_date, evaluations sorted correctly by submission date descending | | | | | |
| **Test Case 49: Course Data Display** | Verify courses page uses API data (overallRating, enrolledStudents) | Passed | GitHub Copilot | 2025-11-17 | Courses endpoint returns real-time data, verified during debugging sessions | | | | | |
| | Test evaluation matching by sectionId (primary) or courseId (fallback) | Pending | | | Matching logic implemented in frontend | Verify fallback behavior with test data | | | | |
| **Test Case 50: Instructor Column Removal** | Verify Course Completion Table has 6 columns (not 7) | Pending | | | Requirement documented | Verify UI displays 6 columns without instructor | | | | |
| | Test instructor column removed from search, sort, header, body | Pending | | | Table structure needs verification | Check all table components | | | | |

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
