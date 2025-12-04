# Complete Backend API Endpoint Mapping

**Generated:** December 2, 2025  
**System:** Course Feedback System  
**Total Routes:** 6 files analyzed

---

## 🔐 Authentication Routes (`auth.py`)

### Public Endpoints (No Authentication)

| Method | Route | Description | Parameters | Returns | Notes |
|--------|-------|-------------|------------|---------|-------|
| POST | `/login` | User authentication | `email`, `password` (body) | JWT token, user object | Blocks instructor role, updates last_login |
| POST | `/forgot-password` | Initiate password reset | `email` (body) | Success message | Generates reset token, logs to console |
| POST | `/reset-password` | Complete password reset | `token`, `new_password` (body) | Success message | Validates token expiration and usage |
| POST | `/change-password` | Change password (first login) | `user_id`, `current_password`, `new_password` (body) | Success message | Clears must_change_password flag |

**Key Features:**
- JWT token generation (24-hour expiration)
- Bcrypt password hashing
- Password reset with secure tokens (1-hour validity)
- Audit logging for all authentication events
- Instructor role login blocked with clear message
- First-time login password change support

**Concerns:**
- ⚠️ Instructor role cannot log in (by design, but may cause confusion)
- Email service not fully implemented (tokens logged to console)

---

## 👨‍💼 System Admin Routes (`system_admin.py`)

**Base Authentication:** `require_admin` or `require_staff`

### 1. User Management

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/users` | Get paginated user list | admin | `page`, `page_size`, `search`, `role`, `status`, `program`, `year_level` | User list with pagination |
| POST | `/users` | Create new user | admin | `UserCreate` body | User ID, auto-generated password for students |
| PUT | `/users/{user_id}` | Update user | admin | User data (body) | Success message |
| DELETE | `/users/{user_id}` | Soft delete user | admin | `user_id` (path) | Success message |
| POST | `/users/{user_id}/reset-password` | Admin reset password | admin | `user_id` (path), `new_password` (body) | Success message |
| GET | `/users/stats` | Get user statistics | staff | None | User counts by role |

**Features:**
- Auto-generates passwords for students: `lpub@{school_id}`
- Creates role-specific records (Student, Secretary, DepartmentHead)
- Bulk import support (via `UserCreate`)
- Welcome email integration
- Program and year level filtering

**Concerns:**
- ⚠️ `require_admin` doesn't define `current_user_id` variable used in audit logs
- Student number uses school_id (correct) but needs validation

### 2. Evaluation Period Management

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/evaluation-periods` | List all periods | staff | `status` (optional) | Period list with stats |
| POST | `/evaluation-periods` | Create period | admin | `EvaluationPeriodCreate` | Period ID |
| PATCH | `/evaluation-periods/{period_id}` | Update period details | admin | `end_date`, `start_date`, `name`, etc. | Updated period |
| PUT | `/evaluation-periods/{period_id}/status` | Change period status | admin | `status` (Open/Active/Closed) | Success message |
| DELETE | `/evaluation-periods/{period_id}` | Delete period | admin | `period_id` (path) | Success message |
| GET | `/evaluation-periods/active` | Get active period | staff | None | Active period with stats |

**Status Flow:** Draft → Active → Closed  
**Features:**
- Auto-closes other active periods when activating new one
- Calculates participation rates and completion statistics
- Cannot delete period with existing evaluations
- Date validation (cannot activate future-dated periods)

### 3. Period Enrollment Management

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| POST | `/evaluation-periods/{period_id}/enroll-section` | Enroll class section in period | admin | `section_id` (body) | Success, student count |
| GET | `/evaluation-periods/{period_id}/enrolled-sections` | Get enrolled sections | staff | `period_id` (path) | Section list |
| DELETE | `/evaluation-periods/{period_id}/enrolled-sections/{enrollment_id}` | Remove section enrollment | admin | IDs (path) | Success message |
| POST | `/evaluation-periods/{period_id}/enroll-program-section` | Enroll program section | admin | `program_section_id` (body) | Evaluations created count |
| GET | `/evaluation-periods/{period_id}/enrolled-program-sections` | Get enrolled program sections | staff | `period_id` (path) | Program section list |
| DELETE | `/evaluation-periods/{period_id}/enrolled-program-sections/{enrollment_id}` | Remove program section | admin | IDs (path) | Success message |

**Features:**
- Creates evaluation records for all enrolled students
- Links enrollments to periods via `evaluation_period_id`
- Tracks enrollment counts in `period_enrollments` table
- Supports both class sections and program sections

**Concerns:**
- ⚠️ Deleting program section enrollment also deletes evaluation records (data loss risk)

### 4. Course Management

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/courses` | List courses with filters | staff | `page`, `page_size`, `search`, `program_id`, `year_level`, `semester`, `status`, `period_id`, `show_all_periods` | Paginated course list |
| POST | `/courses` | Create course | admin | `CourseCreate` body | Course ID |
| PUT | `/courses/{course_id}` | Update course | admin | Course data (body) | Success message |
| DELETE | `/courses/{course_id}` | Delete course | admin | `course_id` (path) | Success message |
| GET | `/programs` | List all programs | staff | None | Program list |

**Features:**
- Defaults to active evaluation period (unless `show_all_periods=true`)
- Shows enrollment counts from period_enrollments
- Program, year level, semester filters
- Active/Archived status filter

**Data Model Notes:**
- Course uses `subject_code` and `subject_name` (not `course_code`/`course_name`)
- Semester is integer (1, 2, 3)
- `academic_year` stored in class_sections, not courses

### 5. Section Management

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/sections` | List class sections | staff | `search`, `program_id`, `program_code`, `program_section_id`, `year_level`, `semester`, `period_id` | Section list with enrollment counts |
| POST | `/sections` | Create section | admin | Section data | Section ID |
| PUT | `/sections/{section_id}` | Update section | admin | Section data | Success |
| DELETE | `/sections/{section_id}` | Delete section | admin | `section_id` | Success |
| GET | `/sections/{section_id}/students` | List section students | staff | `section_id` | Student list with eval status |
| POST | `/sections/{section_id}/enroll-students` | Enroll students in section | admin | `student_ids` (body) | Enrollment count |

**Features:**
- Filters by program section (block section) for group enrollment
- Shows evaluation status per student
- Creates enrollments and evaluation records simultaneously
- Validates student enrollment before creating evaluations

**Concerns:**
- ⚠️ No references to `instructors` table (instructor data removed from system)

### 6. Analytics & Reports

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/analytics/overview` | System-wide analytics | staff | `period_id` (optional) | Comprehensive stats |
| GET | `/analytics/sentiment-distribution` | Sentiment breakdown | staff | `period_id` | Sentiment counts |
| GET | `/analytics/course-performance` | Course ratings | staff | `period_id`, `program_id` | Course list with avg ratings |
| GET | `/analytics/program-comparison` | Compare programs | staff | `period_id` | Program stats |

**Features:**
- Real-time aggregation from evaluation data
- Period-based filtering (defaults to active period)
- Program-level comparisons
- Sentiment analysis visualization data

### 7. Data Export

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/export/evaluations` | Export evaluation data | admin | `format` (csv/json), `period_id`, filters | File download |
| GET | `/export/users` | Export user data | admin | `format`, `role` | File download |
| GET | `/export/reports` | Export analytics report | admin | `format`, `period_id` | File download |

**Features:**
- CSV and JSON format support
- Validates export filters with `validate_export_filters()`
- Creates audit trail via `ExportHistory` model
- Sensitive data filtering (excludes passwords)

### 8. Audit Logs

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/audit-logs` | Get audit logs | admin | `page`, `page_size`, `user_id`, `action`, `category`, `severity`, `date_from`, `date_to` | Paginated logs |
| GET | `/audit-logs/stats` | Audit statistics | admin | `date_from`, `date_to` | Activity summary |

**Features:**
- Tracks all critical actions (USER_CREATED, PASSWORD_RESET, PERIOD_CLOSED, etc.)
- Severity levels: Info, Warning, Error
- Categories: Authentication, User Management, Evaluation Management, etc.

### 9. System Settings

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/settings` | Get system settings | admin | None | Settings object |
| PUT | `/settings` | Update settings | admin | Settings data | Success |

**Features:**
- ML model configurations
- Email service settings
- System-wide defaults

---

## 📊 Admin/Secretary Shared Routes (`admin.py`)

**Base Authentication:** `require_staff`

### Dashboard & Overview

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/dashboard-stats` | Admin dashboard | staff | None | Comprehensive statistics |
| GET | `/department-overview` | Department statistics | staff | None | Program-wise breakdown |
| GET | `/departments` | List departments | staff | None | Department list (programs) |

**Features:**
- Total user/course/evaluation counts
- User role distribution
- Program statistics
- Recent evaluations
- Sentiment stats

**Concerns:**
- ⚠️ Returns empty arrays on error instead of failing (masks issues)
- Uses `programs` table as departments (single-department system)

### Data Access

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/students` | List students | staff | `department_id`, `program`, `year_level` | Student list |
| GET | `/evaluations` | List evaluations | staff | `course_id`, `department_id`, `semester`, `academic_year` | Evaluation list |
| GET | `/courses` | List courses | staff | `department_id`, `semester`, `academic_year` | Course list |

### Category Analysis

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/courses/{course_id}/category-averages` | 6-category averages | staff | `course_id`, `user_id` | Category breakdowns |
| GET | `/courses/{course_id}/question-distribution` | 31-question distribution | staff | `course_id`, `user_id` | Question response data |

**Categories:**
1. Relevance of Course (Q1-6)
2. Course Organization (Q7-11)
3. Teaching-Learning (Q12-18)
4. Assessment (Q19-24)
5. Learning Environment (Q25-30)
6. Counseling (Q31)

**Features:**
- Aggregates JSONB ratings from evaluations
- Returns count and percentage for each rating option (1-4)
- Calculates category averages and overall rating

**Concerns:**
- ⚠️ Frontend sends `section.id` as `course_id` parameter (confusing naming)

### Completion Tracking

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/completion-rates` | Completion statistics | staff | `user_id` | Overall & per-course completion |

**Features:**
- Shows enrolled vs evaluated students
- Identifies low-completion courses (<70%)
- Section-level breakdown

### Support

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| POST | `/support-request` | Submit support ticket | staff | `SupportRequest` body | Ticket ID |

**Features:**
- Logs request to server (not stored in DB)
- Generates ticket ID

**Concerns:**
- ⚠️ Not actually stored in database (only logged)

---

## 🎓 Student Routes (`student.py`)

**Base Authentication:** `require_student`

### Course Access

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/{student_id}/courses` | Get student's enrolled courses | student | `student_id` (path) | Course list with evaluation status |
| GET | `/courses/{course_id}` | Course details | student | `course_id` (path) | Course info with stats |
| GET | `/{student_id}/evaluation-periods` | Active periods | student | `student_id` (path) | Periods with pending evaluations |
| GET | `/{student_id}/pending-evaluations` | Pending evaluations | student | `student_id`, `period_id` (optional) | Pending evaluation list |

**Features:**
- Only shows courses in active evaluation periods
- Displays evaluation status (completed/pending)
- Period end date warnings
- Can evaluate indicator

**Business Logic:**
- Student sees only courses where:
  - Enrolled via `enrollments` table
  - `evaluation_period_id` is not NULL
  - Period status is 'active'
  - Current date is between period start/end dates

### Evaluation Submission

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| POST | `/evaluations` | Submit evaluation | student | `EvaluationSubmission` body | Success, ML analysis results |
| GET | `/evaluations/{evaluation_id}` | Get evaluation for edit | student | `evaluation_id` (path) | Evaluation data |
| PUT | `/evaluations/{evaluation_id}` | Update evaluation | student | `evaluation_id`, data (body) | Success |
| GET | `/{student_id}/evaluations` | List student's evaluations | student | `student_id` (path) | Evaluation list |

**Evaluation Validation (4-step process):**
1. ✅ Check active evaluation period exists
2. ✅ Verify section is enrolled in period
3. ✅ Verify student enrollment in section for period
4. ✅ Check for duplicate submission in period

**Features:**
- 31-question JSONB ratings storage
- Automatic sentiment analysis (ML-powered or rating-based fallback)
- Anomaly detection integration
- Updates pending evaluation records (changes status to 'completed')
- Audit logging

**Rating Scale:** 1 = Strongly Disagree, 2 = Disagree, 3 = Agree, 4 = Strongly Agree

**Concerns:**
- ⚠️ Can update evaluations even after period ends (no date check on PUT)

### Evaluation History

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/{student_id}/evaluation-history` | Past evaluations | student | `student_id`, `period_id` (optional) | Historical evaluations |

**Features:**
- Shows ONLY completed evaluations from CLOSED periods
- Active period evaluations appear in pending-evaluations
- Period-based filtering
- Includes course and period metadata

---

## 📝 Secretary Routes (`secretary.py`)

**Base Authentication:** `require_staff`

### Dashboard

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/dashboard` | Secretary overview | staff | `user_id`, `period_id` (optional) | Dashboard stats |

**Features:**
- Defaults to active evaluation period
- Shows total courses, sections, evaluations
- Participation rate
- Sentiment distribution
- Anomaly count

**Access Level:** Full system access (single-department system)

### Course Management

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/courses` | List courses | staff | `user_id`, `page`, `page_size`, `search`, `program_id` | Course list with enrollment data |
| POST | `/courses` | Create course | staff | `CourseCreate` body | Course ID |
| PUT | `/courses/{course_id}` | Update course | staff | Course data | Success |
| DELETE | `/courses/{course_id}` | Delete course | staff | `course_id` | Success |

**Features:**
- Returns class sections (not just courses)
- Shows evaluation count and enrollment count
- Pre-calculated response rates
- Search and filter support

**Concerns:**
- ⚠️ Secretary field `programs` array not used for filtering (full access)

### Section Management

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/courses/{course_id}/sections` | Course sections | staff | `course_id`, `user_id` | Section list |
| POST | `/sections` | Create section | staff | `ClassSectionCreate` body | Section ID |

### Analytics

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/evaluations` | List evaluations | staff | `user_id`, `page`, `page_size`, `course_id`, `sentiment`, `period_id` | Paginated evaluations |
| GET | `/sentiment-analysis` | Sentiment trends | staff | `user_id`, `time_range`, `period_id` | Trend data |
| GET | `/anomalies` | Detected anomalies | staff | `user_id`, `page`, `page_size`, `period_id` | Anomaly list |

**Features:**
- Time range options: week, month, semester, year
- Sentiment distribution over time
- Anomaly severity calculation
- Transforms JSONB rating keys to question numbers for frontend

### Reports

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/reports/evaluations-summary` | Evaluation summary | staff | `user_id` | Summary statistics |
| GET | `/courses/{course_id}/category-averages` | Category analysis | staff | `course_id`, `user_id`, `period_id` | 6-category breakdown |
| GET | `/courses/{course_id}/question-distribution` | Question distribution | staff | `course_id`, `user_id` | 31-question breakdown |
| GET | `/completion-rates` | Completion tracking | staff | `user_id`, `period_id` | Completion stats |

### ML Insights

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/ml-analysis/{section_id}` | ML results for section | staff | `section_id`, `user_id` | ML analysis data |
| GET | `/ml-insights-summary` | Overall ML insights | staff | `user_id`, `period_id` | Aggregated ML stats |

**Features:**
- Reads from `analysis_result` table
- Shows sentiment confidence scores
- Anomaly detection results

**Concerns:**
- ⚠️ ML models may not have run yet (returns "no data available")

---

## 🎯 Department Head Routes (`department_head.py`)

**Base Authentication:** `require_staff`

**Access Level:** Full system access (single-department system, same as secretary)

### Dashboard

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/dashboard` | Department overview | staff | `department` or `user_id`, `period_id` | Dashboard stats |

**Unique Features:**
- Can query by `department` name OR `user_id`
- Returns department name in response
- Same stats as secretary dashboard

### Evaluations

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/evaluations` | List evaluations | staff | `user_id`, `page`, `page_size`, `course_id`, `sentiment`, `anomaly_only`, `period_id` | Filtered evaluation list |

**Unique Features:**
- `anomaly_only` filter (dept heads focus on problematic evaluations)
- Shows instructor names (from user relationship)
- Includes year level information

### Analytics

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/sentiment-analysis` | Sentiment trends | staff | `user_id`, `time_range` | Trend data over time |
| GET | `/anomalies` | Anomaly list | staff | `user_id`, `page`, `page_size`, `period_id` | Anomalies with severity |
| GET | `/trends` | Trend analysis | staff | `user_id`, `metric` | Rating/sentiment/engagement trends |

**Metrics:** rating, sentiment, engagement (6-month lookback)

### Course Reports

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/courses` | List all courses | staff | `department` or `user_id` | Course list with stats |
| GET | `/courses/{course_id}/report` | Detailed course report | staff | `course_id`, `user_id` | Section-by-section analysis |

**Features:**
- Shows instructor names for each section
- Average ratings per section
- Sentiment distribution per section
- Evaluation counts

### Category & Question Analysis

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/courses/{course_id}/category-averages` | 6-category analysis | staff | `course_id`, `user_id`, `period_id` | Category breakdowns |
| GET | `/courses/{course_id}/question-distribution` | 31-question distribution | staff | `course_id`, `user_id` | Question response data |
| GET | `/completion-rates` | Completion tracking | staff | `user_id`, `period_id` | Completion statistics |

### ML Analysis

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/ml-analysis/{section_id}` | Section ML results | staff | `section_id`, `user_id` | ML analysis details |
| GET | `/ml-insights-summary` | Overall ML summary | staff | `user_id`, `period_id` | Aggregated ML data |

### Filter Options

| Method | Route | Description | Auth | Parameters | Returns |
|--------|-------|-------------|------|------------|---------|
| GET | `/programs` | Program list | staff | `user_id` | Available programs |
| GET | `/year-levels` | Year level list | staff | `user_id` | Year level options (1-4) |

---

## 🔍 Critical Issues & Concerns

### 1. ⚠️ Authentication Issues
- **Undefined Variables:** `current_user_id` used in audit logs but not defined by `require_admin`
- **Instructor Login Block:** Instructors cannot log in (may cause confusion)
- **Token Security:** SECRET_KEY validation is good, but no token refresh mechanism

### 2. ⚠️ Data Integrity Issues
- **Instructor References:** System references `instructors` table but authentication blocks them
- **Soft Delete:** User deletion is soft delete (sets `is_active=False`) but doesn't cascade to related records
- **Period Deletion:** Deleting period enrollments also deletes evaluation records (potential data loss)

### 3. ⚠️ Missing CRUD Operations
- **Courses:** Has CREATE, UPDATE, DELETE, but inconsistent between system_admin and secretary
- **Sections:** Has CREATE, UPDATE, DELETE in system_admin but only GET in secretary
- **Users:** Has full CRUD in system_admin, but UPDATE operation doesn't include role-specific records

### 4. ⚠️ Unclear Functionality
- **Section ID vs Course ID:** Frontend sends `section.id` as `course_id` parameter in category-averages and question-distribution endpoints (confusing)
- **Support Requests:** Logged but not stored in database
- **ML Results:** Endpoints exist but ML models may not have run yet

### 5. ⚠️ Naming Inconsistencies
- **Course Fields:** Database uses `subject_code`/`subject_name`, API sometimes uses `course_code`/`course_name`
- **Evaluation Fields:** Mix of `rating_*` individual fields and `ratings` JSONB field
- **Status Values:** Mix of "Open"/"Closed" and "active"/"closed"

### 6. ⚠️ Missing Validation
- **Duplicate Enrollments:** No check for duplicate student enrollment in same section
- **Date Validation:** Students can update evaluations after period ends
- **Email Validation:** Email uniqueness checked but format not validated

### 7. ⚠️ Performance Concerns
- **N+1 Queries:** Some endpoints fetch related data in loops instead of JOIN queries
- **Large Datasets:** No pagination limit on some endpoints (max 10,000 items)
- **Real-time Aggregations:** Analytics endpoints recalculate stats on every request

---

## 📋 Endpoint Count Summary

| Route File | Total Endpoints | GET | POST | PUT/PATCH | DELETE |
|------------|----------------|-----|------|-----------|---------|
| `auth.py` | 4 | 0 | 4 | 0 | 0 |
| `system_admin.py` | 48 | 30 | 10 | 6 | 2 |
| `admin.py` | 9 | 8 | 1 | 0 | 0 |
| `student.py` | 10 | 6 | 2 | 2 | 0 |
| `secretary.py` | 21 | 17 | 3 | 1 | 0 |
| `department_head.py` | 18 | 16 | 1 | 0 | 0 |
| **TOTAL** | **110** | **77** | **21** | **9** | **2** |

---

## 🎨 Functional Grouping

### User Management (10 endpoints)
- Create, read, update, delete users
- Reset passwords
- User statistics
- Bulk imports

### Evaluation Periods (11 endpoints)
- CRUD operations
- Status management
- Enrollment management (sections and program sections)
- Active period queries

### Courses & Sections (13 endpoints)
- Course CRUD
- Section CRUD
- Student enrollment in sections
- Section student lists

### Evaluations (12 endpoints)
- Student submission
- View/edit own evaluations
- List evaluations (admin/secretary/dept head)
- Evaluation history
- Pending evaluations

### Analytics & Reports (20 endpoints)
- Dashboard statistics
- Completion rates
- Category averages (6 categories)
- Question distribution (31 questions)
- Sentiment analysis
- Trend analysis
- Program comparisons
- Anomaly detection

### ML Features (4 endpoints)
- Sentiment analysis results
- Anomaly detection results
- ML insights summary
- Section-specific ML analysis

### Data Export (3 endpoints)
- Export evaluations
- Export users
- Export reports

### System Management (8 endpoints)
- Audit logs
- System settings
- Support requests
- Filter options (programs, year levels)

### Authentication (4 endpoints)
- Login
- Forgot password
- Reset password
- Change password

---

## 🔄 Data Flow Examples

### Example 1: Student Submits Evaluation
```
1. Student logs in → POST /login
2. Gets courses → GET /student/{id}/courses
3. Sees only courses in active period with evaluation_period_id set
4. Submits evaluation → POST /evaluations
   - Validates active period exists
   - Validates section is in period
   - Validates student enrollment
   - Checks for duplicates
   - Runs ML sentiment analysis
   - Stores in evaluations table
5. Evaluation appears in history → GET /student/{id}/evaluation-history
```

### Example 2: Admin Creates Evaluation Period
```
1. Admin logs in → POST /login
2. Creates period → POST /evaluation-periods
   - Sets status to "Open"
   - Auto-closes other active periods
3. Enrolls program section → POST /evaluation-periods/{id}/enroll-program-section
   - Updates enrollments.evaluation_period_id
   - Creates evaluation records (status='pending')
   - Records in period_program_sections
4. Students see courses → GET /student/{id}/courses
   - Filters by evaluation_period_id
   - Shows can_evaluate=true
```

### Example 3: Secretary Views Analytics
```
1. Secretary logs in → POST /login
2. Views dashboard → GET /secretary/dashboard
   - Defaults to active period
   - Shows aggregate stats
3. Views course details → GET /secretary/courses/{id}/category-averages
   - Calculates 6-category averages
   - Returns response rates
4. Views anomalies → GET /secretary/anomalies
   - Shows low-rated evaluations
   - Displays sentiment flags
```

---

## 🔒 Authentication & Authorization Matrix

| Endpoint Group | Admin | Secretary | Dept Head | Student |
|----------------|-------|-----------|-----------|---------|
| User Management | ✅ Full | ❌ None | ❌ None | ❌ None |
| Period Management | ✅ Full | ❌ View Only | ❌ View Only | ❌ None |
| Course Management | ✅ Full | ✅ Full | ❌ View Only | ❌ None |
| Evaluation Submission | ❌ None | ❌ None | ❌ None | ✅ Own Only |
| Evaluation Viewing | ✅ All | ✅ All | ✅ All | ✅ Own Only |
| Analytics | ✅ All | ✅ All | ✅ All | ❌ None |
| ML Insights | ✅ All | ✅ All | ✅ All | ❌ None |
| Data Export | ✅ Full | ❌ None | ❌ None | ❌ None |
| Audit Logs | ✅ Full | ❌ None | ❌ None | ❌ None |
| System Settings | ✅ Full | ❌ None | ❌ None | ❌ None |

**Note:** Secretary and Department Head have identical permissions (full system access in single-department setup)

---

## 📊 Database Tables Referenced

### Core Tables
- `users` - User accounts (all roles)
- `students` - Student-specific data
- `secretaries` - Secretary-specific data
- `department_heads` - Department head-specific data
- `programs` - Academic programs (used as departments)
- `courses` - Course definitions
- `class_sections` - Course sections (blocks)
- `program_sections` - Student groups (block sections)
- `enrollments` - Student-section enrollments
- `evaluation_periods` - Evaluation time windows
- `evaluations` - Student course evaluations
- `password_reset_tokens` - Password reset requests

### Support Tables
- `period_enrollments` - Tracks section enrollment in periods
- `period_program_sections` - Tracks program section enrollment in periods
- `section_students` - Maps students to program sections
- `audit_logs` - System activity logs
- `export_history` - Data export tracking
- `system_settings` - System configuration
- `analysis_result` - ML analysis results

### Potentially Missing Tables
- ❌ `support_tickets` (referenced but not stored)
- ⚠️ `instructors` (referenced but role cannot log in)

---

## 🚀 Recommendations

### 1. Fix Authentication Issues
- Define `current_user_id` in middleware
- Document instructor role restrictions
- Implement token refresh mechanism

### 2. Improve Data Consistency
- Add cascade rules for soft deletes
- Prevent evaluation record deletion
- Validate duplicate enrollments

### 3. Standardize Naming
- Use consistent field names (`subject_code` vs `course_code`)
- Standardize status values ("active" vs "Open")
- Clarify section_id vs course_id in category endpoints

### 4. Add Missing Features
- Implement support ticket storage
- Add email format validation
- Implement date-based evaluation edit restrictions

### 5. Optimize Performance
- Use JOIN queries instead of loops
- Cache frequently-accessed data (active period, programs)
- Add database indexes on foreign keys

### 6. Enhance Security
- Add rate limiting on authentication endpoints
- Implement CSRF protection
- Add request logging for sensitive operations

---

**END OF REPORT**
