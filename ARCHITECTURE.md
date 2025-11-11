# 🏗️ SYSTEM ARCHITECTURE OVERVIEW

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Vite)                     │
│                   http://localhost:5173                      │
├─────────────────────────────────────────────────────────────┤
│  Landing Page → Login → Role-Based Dashboard                │
│                                                               │
│  Admin:         /admin/dashboard, /admin/users, ...         │
│  Student:       /student/courses, /student/evaluate, ...    │
│  Staff:         /dashboard, /sentiment, /anomalies, ...     │
│                                                               │
│  Components: Layout, ProtectedRoute, Navigation             │
└─────────────────────────────────────────────────────────────┘
                             ↓ ↑
                        HTTP/REST API
                             ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND (Python)                    │
│                   http://localhost:8000                      │
├─────────────────────────────────────────────────────────────┤
│  Routes (Endpoints):                                         │
│  • /api/auth/login          - Authentication                │
│  • /api/student/*           - Student operations            │
│  • /api/instructor/*        - Instructor operations         │
│  • /api/secretary/*         - Secretary operations          │
│  • /api/dept-head/*         - Dept head operations          │
│  • /api/admin/*             - Admin operations              │
│                                                               │
│  Models: SQLAlchemy ORM (enhanced_models.py)                │
│  Auth: JWT tokens + bcrypt passwords                        │
└─────────────────────────────────────────────────────────────┘
                             ↓ ↑
                        PostgreSQL
                             ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE POSTGRESQL DATABASE                    │
│         (Transaction Pooler - Port 6543)                     │
├─────────────────────────────────────────────────────────────┤
│  Core Tables:                                                │
│  • users          - All user accounts (20 after setup)      │
│  • students       - Student details (10)                    │
│  • instructors    - Instructor details (5)                  │
│  • department_heads - Dept head details (2)                 │
│  • secretaries    - Secretary details (2)                   │
│                                                               │
│  Academic Tables:                                            │
│  • programs       - Academic programs (7)                   │
│  • courses        - All courses (367)                       │
│  • class_sections - Course sections (15 after setup)        │
│  • enrollments    - Student enrollments (40+ after setup)   │
│                                                               │
│  Evaluation Tables:                                          │
│  • evaluations         - Student feedback                   │
│  • evaluation_periods  - Evaluation schedules               │
│  • analysis_results    - ML analysis results                │
│                                                               │
│  Admin Tables:                                               │
│  • audit_logs       - System activity logging               │
│  • system_settings  - Configuration                         │
│  • notification_queue - Email queue                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 AUTHENTICATION FLOW

```
┌─────────┐
│ Browser │
│ User    │
└────┬────┘
     │ 1. Enter email + password
     ↓
┌─────────────────┐
│ Login Page      │
│ (React)         │
└────┬────────────┘
     │ 2. POST /api/auth/login
     ↓
┌──────────────────────────────────────┐
│ Auth Route (FastAPI)                 │
│ 1. Query users table by email        │
│ 2. Check is_active = true            │
│ 3. Verify bcrypt password            │
│ 4. Generate JWT token                │
│ 5. Return user data + token          │
└────┬─────────────────────────────────┘
     │ 3. Receive token + user data
     ↓
┌─────────────────┐
│ React App       │
│ 1. Store token  │
│ 2. Redirect by  │
│    role:        │
│    - admin →    │
│      /admin/    │
│      dashboard  │
│    - student →  │
│      /student/  │
│      courses    │
│    - staff →    │
│      /dashboard │
└─────────────────┘
     │ 4. All future requests include JWT
     ↓
┌─────────────────┐
│ Protected Routes│
│ Verify token    │
│ Check role      │
│ Allow/Deny      │
└─────────────────┘
```

---

## 👥 USER HIERARCHY & ROLES

```
                    ┌──────────────┐
                    │    ADMIN     │ (System Administrator)
                    │  Full Access │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼────┐  ┌─────▼──────┐
     │  SECRETARY  │ │ DEPT    │  │ INSTRUCTOR │
     │             │ │ HEAD    │  │            │
     │ Evaluations │ │ Dept    │  │ Teach      │
     │ Mgmt        │ │ Reports │  │ Classes    │
     └─────────────┘ └─────────┘  └────────────┘
            │              │              │
            └──────────────┼──────────────┘
                           │ (Share same dashboard/features)
                           │
                    ┌──────▼───────┐
                    │   STUDENT    │
                    │              │
                    │ Evaluate     │
                    │ Courses      │
                    └──────────────┘
```

### Permission Matrix

| Feature                  | Admin | Secretary | Dept Head | Instructor | Student |
|--------------------------|-------|-----------|-----------|------------|---------|
| User Management          | ✅    | ❌        | ❌        | ❌         | ❌      |
| Evaluation Periods       | ✅    | ✅        | ✅        | ❌         | ❌      |
| View All Evaluations     | ✅    | ✅        | ✅        | ❌         | ❌      |
| View Own Evaluations     | ✅    | ✅        | ✅        | ✅         | ❌      |
| Submit Evaluations       | ❌    | ❌        | ❌        | ❌         | ✅      |
| Sentiment Analysis       | ✅    | ✅        | ✅        | ✅         | ❌      |
| Anomaly Detection        | ✅    | ✅        | ✅        | ✅         | ❌      |
| System Settings          | ✅    | ❌        | ❌        | ❌         | ❌      |
| Audit Logs               | ✅    | ❌        | ❌        | ❌         | ❌      |
| Course Management        | ✅    | ✅        | ❌        | ❌         | ❌      |
| Reports/Export           | ✅    | ✅        | ✅        | ✅         | ❌      |

---

## 🗄️ DATABASE RELATIONSHIPS

```
┌─────────────┐
│   USERS     │ (Master table - All accounts)
│ id (PK)     │
│ email       │
│ role        │
└──────┬──────┘
       │
       ├──────────────┬─────────────┬──────────────┬─────────────┐
       │              │             │              │             │
┌──────▼───────┐ ┌───▼────────┐ ┌─▼─────────┐ ┌──▼──────────┐ │
│  STUDENTS    │ │INSTRUCTORS │ │DEPT_HEADS │ │SECRETARIES  │ │
│ user_id (FK) │ │user_id(FK) │ │user_id(FK)│ │user_id (FK) │ │
│ student_num  │ │ name       │ │first_name │ │ name        │ │
│ program_id   │ │ department │ │last_name  │ │ department  │ │
│ year_level   │ └────────────┘ │department │ └─────────────┘ │
└──────┬───────┘                └───────────┘                  │
       │                                                        │
       │ (Enrolled in)                         (Teaches)       │
       │                                                        │
┌──────▼───────┐              ┌──────────────┐                │
│ ENROLLMENTS  │              │CLASS_SECTIONS│◄───────────────┘
│ student_id   │◄─────────────┤ id (PK)      │
│class_sect_id │              │ course_id    │
└──────┬───────┘              │instructor_id │
       │                      │ class_code   │
       │                      │ semester     │
       │ (Evaluates)          │ academic_yr  │
       │                      └──────┬───────┘
┌──────▼───────┐                     │
│ EVALUATIONS  │                     │ (Based on)
│ student_id   │                     │
│class_sect_id │                     │
│ ratings      │              ┌──────▼───────┐
│ text_feedback│              │   COURSES    │
│ sentiment    │              │ id (PK)      │
│ is_anomaly   │              │ subject_code │
└──────────────┘              │ subject_name │
                              │ program_id   │
                              │ year_level   │
                              └──────┬───────┘
                                     │
                              ┌──────▼───────┐
                              │  PROGRAMS    │
                              │ id (PK)      │
                              │ program_code │
                              │ program_name │
                              └──────────────┘
```

---

## 🔄 DATA FLOW EXAMPLE: Student Submits Evaluation

```
1. STUDENT LOGS IN
   ↓
2. Frontend fetches enrolled courses
   GET /api/student/courses
   ↓
3. Backend queries:
   - enrollments WHERE student_id = X
   - JOIN class_sections
   - JOIN courses
   - JOIN users (instructors)
   ↓
4. Student sees list of courses
   ↓
5. Student clicks "Evaluate Course"
   ↓
6. Student fills form:
   - Rating (1-5): Teaching, Content, Engagement, Overall
   - Text Feedback
   - Suggestions
   ↓
7. Frontend sends:
   POST /api/student/evaluations
   {
     class_section_id: 123,
     rating_teaching: 5,
     rating_content: 4,
     text_feedback: "Great professor!"
   }
   ↓
8. Backend:
   - Validates student is enrolled
   - Validates evaluation period is active
   - Inserts into evaluations table
   - Sets processing_status = 'pending'
   ↓
9. ML Processing (Future):
   - Sentiment analysis on text_feedback
   - Anomaly detection on ratings
   - Update evaluation with results
   ↓
10. Instructor/Secretary/Admin can view:
    - Individual evaluations
    - Aggregate statistics
    - Sentiment trends
    - Anomaly reports
```

---

## 🛠️ TECHNOLOGY STACK

### Frontend
```
React 18.2.0          - UI framework
Vite 7.1.4            - Build tool (fast dev server)
React Router 6.14.1   - Client-side routing
Axios 1.13.1          - HTTP client
Recharts 2.6.0        - Charts/graphs
TailwindCSS 3.4.7     - Styling
```

### Backend
```
FastAPI               - Web framework
Python 3.x            - Language
SQLAlchemy            - ORM
Uvicorn               - ASGI server
bcrypt                - Password hashing
python-jose           - JWT tokens
psycopg2              - PostgreSQL driver
```

### Database
```
PostgreSQL            - Database
Supabase              - Hosting
```

### Future ML Stack
```
scikit-learn          - SVM sentiment analysis
DBSCAN                - Anomaly detection
pandas                - Data processing
numpy                 - Numerical computing
```

---

## 📂 FILE ORGANIZATION

```
thesis/
│
├── Documentation/
│   ├── START_HERE.md                  ← Start here!
│   ├── SETUP_GUIDE.md                 ← Step-by-step
│   ├── COMPLETE_SYSTEM_ANALYSIS.md    ← Technical
│   ├── QUICK_REFERENCE.md             ← Commands
│   └── ARCHITECTURE.md                ← This file
│
├── Back/                              ← Backend
│   ├── database_schema/               ← SQL scripts
│   │   └── 01_FIX_USERS_TABLE.sql    ← RUN FIRST
│   │
│   └── App/                           ← Python code
│       ├── main.py                    ← Entry point
│       ├── check_system.py            ← Diagnostic
│       ├── create_test_users.py       ← Setup users
│       ├── setup_sample_data.py       ← Setup data
│       ├── database/                  ← DB connection
│       ├── models/                    ← SQLAlchemy models
│       └── routes/                    ← API endpoints
│
└── New/capstone/                      ← Frontend
    └── src/
        ├── App.jsx                    ← Main routes
        ├── main.jsx                   ← Entry point
        ├── pages/                     ← Page components
        ├── components/                ← Reusable UI
        └── services/                  ← API calls
```

---

## 🚀 DEPLOYMENT ARCHITECTURE (Future)

```
┌─────────────────────────────────────────────────┐
│              PRODUCTION                          │
├─────────────────────────────────────────────────┤
│                                                  │
│  Frontend (Vercel/Netlify)                      │
│  https://yourapp.com                            │
│         ↓                                        │
│  Backend (Heroku/Railway/Render)                │
│  https://api.yourapp.com                        │
│         ↓                                        │
│  Database (Supabase/AWS RDS)                    │
│  (Already on Supabase)                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🔐 SECURITY ARCHITECTURE

```
┌────────────────────────────────────────┐
│          SECURITY LAYERS               │
├────────────────────────────────────────┤
│                                         │
│ 1. Frontend Route Protection           │
│    - ProtectedRoute component          │
│    - Check JWT token exists            │
│    - Check role matches allowed roles  │
│                                         │
│ 2. Backend Authentication              │
│    - Verify JWT token signature        │
│    - Check token expiration            │
│    - Extract user_id and role          │
│                                         │
│ 3. Database Level                      │
│    - Password hashes (bcrypt)          │
│    - Foreign key constraints           │
│    - Row-level security (future)       │
│                                         │
│ 4. API Level                           │
│    - CORS restrictions                 │
│    - Input validation                  │
│    - SQL injection prevention          │
│      (SQLAlchemy parameterized)        │
│                                         │
└────────────────────────────────────────┘
```

---

**This architecture is designed for:**
- ✅ Scalability (can handle 1000+ users)
- ✅ Security (multi-layer protection)
- ✅ Maintainability (clear separation)
- ✅ Testability (each component isolated)
- ✅ Extensibility (easy to add features)
