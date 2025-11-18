# IPO Diagram - Course Insight Guardian System

## System Overview
**Course Insight Guardian** is a comprehensive course evaluation and feedback management system for Lyceum of the Philippines University - Batangas.

---

## IPO (Input-Process-Output) Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               INPUTS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. USER AUTHENTICATION                                                     │
│     • Email address                                                         │
│     • Password (temporary or permanent)                                     │
│     • School ID number                                                      │
│     • Role (student, instructor, secretary, department_head, admin)         │
│                                                                             │
│  2. USER MANAGEMENT DATA                                                    │
│     • User profile information (first name, last name, email)               │
│     • CSV bulk import files (user data with school IDs)                     │
│     • Role assignments and permissions                                      │
│     • Department assignments                                                │
│     • Password change requests                                              │
│                                                                             │
│  3. ACADEMIC STRUCTURE DATA                                                 │
│     • Program information (code, name, department)                          │
│     • Course details (code, description, units)                             │
│     • Section information (class codes, schedules)                          │
│     • Instructor assignments                                                │
│     • Student enrollments                                                   │
│     • Year levels (1-4)                                                     │
│                                                                             │
│  4. EVALUATION DATA                                                         │
│     • Evaluation period settings (start/end dates, academic year, semester) │
│     • Student ratings (1-5 scale) for instructors                           │
│     • Detailed ratings (teaching effectiveness, communication, etc.)        │
│     • Written comments and feedback                                         │
│     • Sentiment indicators (positive, neutral, negative)                    │
│                                                                             │
│  5. ADMINISTRATIVE DATA                                                     │
│     • System settings and configurations                                    │
│     • Email notification templates                                          │
│     • Evaluation period definitions                                         │
│     • Export format preferences (CSV, JSON)                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                                      ↓↓↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                               PROCESSES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. AUTHENTICATION & AUTHORIZATION                                          │
│     • Validate user credentials (email + password)                          │
│     • Check first-time login status                                         │
│     • Generate temporary passwords (lpub@{school_id})                       │
│     • Enforce password change on first login                                │
│     • Hash passwords using bcrypt                                           │
│     • Generate JWT tokens for session management                            │
│     • Verify role-based permissions                                         │
│                                                                             │
│  2. USER MANAGEMENT                                                         │
│     • Create new user accounts (individual or bulk)                         │
│     • Parse CSV files for bulk import                                       │
│     • Validate user data (email format, required fields)                    │
│     • Assign roles and permissions                                          │
│     • Activate/deactivate user accounts                                     │
│     • Reset passwords                                                       │
│     • Update user profiles                                                  │
│     • Send welcome emails with credentials                                  │
│     • Track user login history                                              │
│                                                                             │
│  3. ACADEMIC STRUCTURE MANAGEMENT                                           │
│     • Store and retrieve program information                                │
│     • Manage course catalog                                                 │
│     • Create and manage sections                                            │
│     • Assign instructors to sections                                        │
│     • Enroll students in sections                                           │
│     • Validate program-course relationships                                 │
│     • Filter courses by program and year level                              │
│                                                                             │
│  4. EVALUATION PERIOD MANAGEMENT                                            │
│     • Create evaluation periods with date ranges                            │
│     • Set academic year and semester                                        │
│     • Activate/deactivate evaluation periods                                │
│     • Extend evaluation deadlines                                           │
│     • Delete past evaluation periods                                        │
│     • Track evaluation period status                                        │
│                                                                             │
│  5. EVALUATION SUBMISSION & PROCESSING                                      │
│     • Display enrolled courses for students                                 │
│     • Collect ratings (1-5 scale) for instructors                           │
│     • Collect detailed ratings (multiple criteria)                          │
│     • Accept written comments and feedback                                  │
│     • Validate completeness of evaluations                                  │
│     • Store evaluation responses                                            │
│     • Prevent duplicate evaluations                                         │
│     • Track submission timestamps                                           │
│                                                                             │
│  6. SENTIMENT ANALYSIS (ML)                                                 │
│     • Analyze text comments for sentiment                                   │
│     • Classify as positive, neutral, or negative                            │
│     • Calculate sentiment scores                                            │
│     • Store sentiment analysis results                                      │
│                                                                             │
│  7. ANOMALY DETECTION (ML)                                                  │
│     • Detect unusual rating patterns                                        │
│     • Identify potential bias in evaluations                                │
│     • Flag suspicious evaluation behavior                                   │
│     • Generate anomaly alerts                                               │
│                                                                             │
│  8. DATA AGGREGATION & ANALYTICS                                            │
│     • Calculate average ratings per instructor                              │
│     • Compute ratings by course and section                                 │
│     • Aggregate feedback by department                                      │
│     • Generate statistical summaries                                        │
│     • Calculate response rates                                              │
│     • Track evaluation completion status                                    │
│     • Compile detailed rating breakdowns                                    │
│                                                                             │
│  9. REPORTING & EXPORT                                                      │
│     • Generate evaluation reports (CSV, JSON)                               │
│     • Export user data                                                      │
│     • Create audit logs                                                     │
│     • Track export history                                                  │
│     • Format data for download                                              │
│                                                                             │
│  10. AUDIT & LOGGING                                                        │
│     • Log all system actions                                                │
│     • Track user activities                                                 │
│     • Record data modifications                                             │
│     • Timestamp all operations                                              │
│     • Store audit trail details                                             │
│                                                                             │
│  11. EMAIL NOTIFICATIONS                                                    │
│     • Generate welcome emails for new users                                 │
│     • Send temporary password notifications                                 │
│     • Format HTML email templates                                           │
│     • Include login instructions and requirements                           │
│     • Log email delivery status                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                                      ↓↓↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                               OUTPUTS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. AUTHENTICATION OUTPUTS                                                  │
│     • JWT authentication tokens                                             │
│     • User session data                                                     │
│     • Login success/failure messages                                        │
│     • First-time login redirect instructions                                │
│     • Password change confirmations                                         │
│                                                                             │
│  2. USER INTERFACE OUTPUTS                                                  │
│     • Role-specific dashboards                                              │
│       - Admin Dashboard: System overview and management tools               │
│       - Student Dashboard: Course list and evaluation forms                 │
│       - Instructor Dashboard: Evaluation results and feedback               │
│       - Secretary Dashboard: Data entry and reports                         │
│       - Department Head Dashboard: Department analytics                     │
│     • Navigation menus based on user role                                   │
│     • Form validation messages                                              │
│     • Success/error notifications                                           │
│                                                                             │
│  3. USER MANAGEMENT OUTPUTS                                                 │
│     • User account creation confirmations                                   │
│     • Generated temporary passwords (lpub@{school_id})                      │
│     • Bulk import success/failure reports                                   │
│     • User list with filters (role, status, department)                     │
│     • Password reset confirmations                                          │
│     • User profile updates                                                  │
│                                                                             │
│  4. ACADEMIC DATA OUTPUTS                                                   │
│     • Program listings with course catalogs                                 │
│     • Section schedules and enrollment lists                                │
│     • Instructor assignment reports                                         │
│     • Student enrollment confirmations                                      │
│     • Filtered course lists (by program, year level)                        │
│                                                                             │
│  5. EVALUATION OUTPUTS                                                      │
│     • Student evaluation forms (dynamic based on enrollments)               │
│     • Evaluation submission confirmations                                   │
│     • Progress tracking (completed vs. pending)                             │
│     • Evaluation period status displays                                     │
│                                                                             │
│  6. ANALYTICS & REPORTS                                                     │
│     • Instructor rating summaries                                           │
│       - Overall average ratings                                             │
│       - Ratings by course/section                                           │
│       - Detailed criteria breakdowns                                        │
│       - Trend analysis over time                                            │
│     • Department performance reports                                        │
│     • Response rate statistics                                              │
│     • Sentiment analysis results (positive/neutral/negative counts)         │
│     • Anomaly detection alerts                                              │
│     • Visual charts and graphs                                              │
│                                                                             │
│  7. DATA EXPORTS                                                            │
│     • CSV files (evaluations, users, courses)                               │
│     • JSON formatted data                                                   │
│     • Excel-compatible formats                                              │
│     • Audit log exports                                                     │
│     • Export history records                                                │
│                                                                             │
│  8. EMAIL NOTIFICATIONS                                                     │
│     • Welcome emails with credentials                                       │
│       - User name and email                                                 │
│       - Temporary password (lpub@{school_id})                               │
│       - Login URL and instructions                                          │
│       - Password requirements                                               │
│       - Security warnings                                                   │
│     • Email delivery status logs                                            │
│                                                                             │
│  9. AUDIT LOGS                                                              │
│     • Timestamped activity records                                          │
│     • User action history                                                   │
│     • System event logs                                                     │
│     • Data modification trails                                              │
│     • Security audit reports                                                │
│                                                                             │
│  10. SYSTEM FEEDBACK                                                        │
│     • Success messages ("User created successfully")                        │
│     • Error messages with details                                           │
│     • Validation warnings                                                   │
│     • Loading indicators                                                    │
│     • Progress bars (bulk operations)                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Process Flows by User Role

### 1. STUDENT FLOW
```
INPUT → LOGIN → PROCESS → OUTPUT
      ↓
   Email + Password
      ↓
   Authenticate → First Login? → Password Change → Dashboard
      ↓                                               ↓
   View Enrolled Courses                        Evaluation Forms
      ↓                                               ↓
   Submit Ratings & Comments                   Submission Confirmation
      ↓
   ML Processing (Sentiment Analysis)
      ↓
   Store Evaluation Data
```

### 2. INSTRUCTOR FLOW
```
INPUT → LOGIN → PROCESS → OUTPUT
      ↓
   Email + Password
      ↓
   Authenticate → Dashboard → View Assigned Courses
      ↓                              ↓
   Access Evaluation Results    Filter by Period/Course
      ↓                              ↓
   View Ratings & Comments      Analytics & Charts
      ↓                              ↓
   Sentiment Analysis Results   Detailed Feedback
```

### 3. ADMIN FLOW
```
INPUT → LOGIN → PROCESS → OUTPUT
      ↓
   Email + Password
      ↓
   Authenticate → Admin Dashboard
      ↓
   Manage Users → Create/Import → Generate Passwords → Send Emails
      ↓
   Manage Periods → Create/Edit/Extend → Period Status
      ↓
   Manage Courses → Assign Instructors → Enroll Students
      ↓
   View Reports → Export Data → CSV/JSON Files
      ↓
   Audit Logs → Review Activities → Security Reports
```

### 4. SECRETARY FLOW
```
INPUT → LOGIN → PROCESS → OUTPUT
      ↓
   Email + Password
      ↓
   Authenticate → Secretary Dashboard
      ↓
   Data Entry → Course Management → Section Creation
      ↓
   Student Enrollment → Bulk Import → Success Reports
      ↓
   Generate Reports → Export Data → Download Files
```

### 5. DEPARTMENT HEAD FLOW
```
INPUT → LOGIN → PROCESS → OUTPUT
      ↓
   Email + Password
      ↓
   Authenticate → Department Dashboard
      ↓
   View Department Analytics → Filter by Program/Course
      ↓                              ↓
   Instructor Performance       Sentiment Analysis
      ↓                              ↓
   Department Reports           Export Department Data
```

---

## Technical Architecture (IPO Components)

### INPUT LAYER
- **Frontend Forms:** React components with validation
- **CSV Upload:** File parsing and validation
- **API Requests:** RESTful endpoints
- **Database Queries:** PostgreSQL reads

### PROCESSING LAYER
- **Backend API:** FastAPI (Python)
- **Business Logic:** Route handlers and services
- **Authentication:** JWT + bcrypt
- **ML Models:** Sentiment analyzer + Anomaly detector
- **Database Operations:** SQLAlchemy ORM
- **Email Service:** SMTP/SendGrid integration

### OUTPUT LAYER
- **JSON Responses:** API data structures
- **React UI:** Dynamic components and pages
- **Email Templates:** HTML formatted messages
- **CSV/JSON Exports:** Formatted data files
- **Database Records:** PostgreSQL writes
- **Logs:** Audit trail and system logs

---

## Data Flow Summary

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    INPUT     │ ──→ │   PROCESS    │ ──→ │    OUTPUT    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ • Users      │     │ • Validate   │     │ • Dashboard  │
│ • CSV Files  │     │ • Compute    │     │ • Reports    │
│ • Ratings    │     │ • Transform  │     │ • Emails     │
│ • Comments   │     │ • Analyze    │     │ • Exports    │
│ • Settings   │     │ • Store      │     │ • Logs       │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## System Boundaries

**INSIDE SYSTEM:**
- User authentication and management
- Course and evaluation management
- Data analytics and ML processing
- Report generation and exports
- Email notifications
- Audit logging

**OUTSIDE SYSTEM:**
- External email servers (SMTP)
- User's web browsers
- CSV file creation (by admins)
- Physical student/instructor enrollment processes

---

**Document Version:** 1.0  
**Created:** November 2024  
**System:** Course Insight Guardian  
**Institution:** Lyceum of the Philippines University - Batangas
