# Course Feedback System# Course Feedback System - Thesis Version



A comprehensive faculty evaluation system for educational institutions built with React, FastAPI, and PostgreSQL.**Branch:** `final-version`  

**Thesis:** Enhanced Sentiment Analysis and Anomaly Detection for Student Course Evaluations using SVM and DBSCAN Approach  

## 📋 Features**Status:** Database Schema Redesigned - Ready for ML Implementation



- **Student Portal**: Submit course evaluations and feedbackA course evaluation system with React frontend, FastAPI backend, and Supabase PostgreSQL database, optimized for machine learning research.

- **Admin Dashboard**: Real-time analytics, user management, system configuration

- **Department Head**: View department-specific evaluation results## Project Structure

- **Secretary System**: Manage evaluation periods and generate reports

- **Multi-role Authentication**: Role-based access control (Student, Instructor, Admin, Secretary, Department Head)```

- **Analytics**: Sentiment analysis, rating trends, department overviewthesis/

- **Report Generation**: Export evaluation data and analytics├── readme.md

├── SYSTEM_TEST_REPORT.md   # Comprehensive testing documentation

## 🛠 Tech Stack├── Back/                    # FastAPI Backend

│   ├── requirements.txt     # Python dependencies

- **Frontend**: React 18, Vite, React Router, TailwindCSS, Recharts│   ├── .env                # Supabase connection config

- **Backend**: Python 3.13, FastAPI, Uvicorn│   ├── database_schema/    # SQL schema files

- **Database**: PostgreSQL (Supabase)│   │   ├── COMPLETE_SCHEMA_SINGLE_RUN.sql  # Full database schema

- **ORM**: SQLAlchemy│   │   ├── create_test_users.sql           # Test user accounts

- **Authentication**: JWT tokens, bcrypt│   │   ├── README.md                       # Schema documentation

│   │   └── QUICK_REFERENCE.md              # Common queries

## 📁 Project Structure│   └── App/

│       ├── main.py         # FastAPI application entry

```│       ├── database/       # Database connection

1 thesis/│       ├── models/         # SQLAlchemy models

├── Back/                          # Backend (FastAPI)│       ├── routes/         # API endpoints (auth, admin, dept-head, secretary, student)

│   └── App/│       └── services/       # Business logic

│       ├── main.py               # Main application entry point└── New/

│       ├── requirements.txt      # Python dependencies    └── capstone/           # React Frontend (Vite)

│       ├── .env                  # Environment variables (DATABASE_URL)        ├── package.json    # Node dependencies

│       ├── database/        ├── vite.config.js  # Vite configuration

│       │   └── connection.py     # Database connection setup        ├── public/         # Static assets

│       ├── models/        └── src/

│       │   ├── thesis_models.py  # Core database models            ├── App.jsx         # Main application

│       │   └── enhanced_models.py # Admin/analytics models            ├── main.jsx        # Entry point

│       ├── routes/            ├── components/     # Reusable components

│       │   ├── auth.py          # Authentication endpoints            ├── pages/          # Page components (admin, student, common)

│       │   ├── student.py       # Student evaluation endpoints            ├── data/           # Mock data (temporary)

│       │   ├── admin.py         # Admin dashboard endpoints            ├── utils/          # Utility functions

│       │   ├── system_admin.py  # User management endpoints            └── styles/         # CSS stylesheets

│       │   ├── dept_head.py     # Department head endpoints```

│       │   └── secretary.py     # Secretary endpoints

│       └── services/            # Business logic## Quick Setup

│

├── New/capstone/                 # Frontend (React + Vite)### Database Setup (CRITICAL - Do This First!)

│   ├── src/

│   │   ├── pages/               # Page componentsThe database schema has been **completely redesigned** for your thesis requirements.

│   │   │   ├── student/        # Student pages

│   │   │   ├── admin/          # Admin pages1. **Open Supabase SQL Editor**

│   │   │   ├── dept-head/      # Department head pages2. **Run these 3 SQL files in order:**

│   │   │   └── secretary/      # Secretary pages   ```sql

│   │   ├── components/          # Reusable components   -- 1. Create schema (tables, indexes, views)

│   │   ├── services/   COMPLETE_THESIS_SETUP.sql

│   │   │   └── api.js          # API client   

│   │   └── styles/             # Global styles   -- 2. Import programs and courses from Courses.xlsx

│   ├── pub/                     # Static assets   IMPORT_PROGRAMS_COURSES.sql

│   ├── package.json            # Node dependencies   

│   └── vite.config.js          # Vite configuration   -- 3. Create sample data for testing

│   SAMPLE_EVALUATION_DATA.sql

├── import_by_program/           # Course data SQL files   ```

│   ├── 00_RUN_ALL_IMPORTS.sql  # Master import script

│   ├── 01_insert_programs.sql  # Program definitions3. **Verify setup:**

│   ├── 02-08_courses_*.sql     # Course data by program   ```sql

│   └── 09_reset_sequences.sql  # Reset ID sequences   SELECT 

│       (SELECT COUNT(*) FROM programs) as programs,        -- Should be 7

├── DATABASE_COMPLETE_SETUP.sql  # Complete database schema       (SELECT COUNT(*) FROM courses) as courses,          -- Should be 367

├── IMPORT_PROGRAMS_COURSES.sql  # Program & course import       (SELECT COUNT(*) FROM evaluations) as evaluations;  -- Should be 152

└── readme.md                    # This file   ```

```

**See `DATABASE_SETUP_GUIDE.md` for detailed instructions.**

## 🚀 Quick Start

### What's New in Schema:

### Prerequisites- ✅ **7 Programs** from Courses.xlsx (BSCS-DS, BS-CYBER, BSIT, BSPSY, BAPSY, BMA, ABCOMM)

- ✅ **367 Courses** with year level and semester

- Python 3.13+- ✅ **ML Features** for SVM sentiment analysis (text_feedback, sentiment, sentiment_score)

- Node.js 18+- ✅ **ML Features** for DBSCAN anomaly detection (is_anomaly, anomaly_score, anomaly_reason)

- PostgreSQL database (or Supabase account)- ✅ **Simplified Schema** - Removed Firebase sync, audit logs, secretary system, evaluation periods

- ✅ **Sample Data** - 152 evaluations with realistic sentiment distribution and intentional anomalies

### 1. Database Setup

### Backend Setup (FastAPI)

Run the complete database setup:

1. **Create Python Virtual Environment:**

```sql   ```bash

-- In your PostgreSQL/Supabase SQL editor:   cd Back

-- 1. Run DATABASE_COMPLETE_SETUP.sql (creates all tables)   python -m venv .venv

-- 2. Run import_by_program/00_RUN_ALL_IMPORTS.sql (imports programs & courses)   .venv\Scripts\activate  # Windows

```   ```



### 2. Backend Setup2. **Install Dependencies:**

   ```bash

```bash   pip install -r requirements.txt

cd "Back/App"   ```



# Install dependencies3. **Configure Database:**

pip install -r requirements.txt   - File: `Back/App/.env`

   - Already configured with Supabase connection string

# Configure environment variables   - No changes needed if using existing Supabase project

# Edit .env file with your database URL:

DATABASE_URL=postgresql://user:password@host:port/database4. **Initialize Database Schema:**

   - Open Supabase Dashboard → SQL Editor

# Start the backend server   - Run: `COMPLETE_THESIS_SETUP.sql` (creates all tables)

python main.py   - Run: `IMPORT_PROGRAMS_COURSES.sql` (imports 7 programs + 367 courses)

```   - Run: `SAMPLE_EVALUATION_DATA.sql` (creates sample data for testing)

   - **DO NOT use old database_schema/ files - they're outdated**

Backend will run on `http://127.0.0.1:8000`

5. **Start Backend Server:**

### 3. Frontend Setup   ```bash

   cd Back/App

```bash   python main.py

cd "New/capstone"   ```

   - Server runs on: http://127.0.0.1:8000

# Install dependencies   - API docs: http://127.0.0.1:8000/docs

npm install

### Frontend Setup (React + Vite)

# Start development server

npm run dev1. **Install Dependencies:**

```   ```bash

   cd New/capstone

Frontend will run on `http://localhost:5173`   npm install

   ```

## 🔑 Default Accounts

2. **Start Development Server:**

After running the database setup, you can create admin users through the system or use SQL:   ```bash

   npm run dev

```sql   ```

-- Create an admin user (run in database)   - Server runs on: http://localhost:5173

INSERT INTO users (email, password_hash, first_name, last_name, role)

VALUES ('admin@example.com', '$2b$12$hashed_password_here', 'Admin', 'User', 'admin');## Test Accounts

```

After running the SQL setup scripts, use these accounts:

## 📊 Database Schema

| Role | Email | Password | Purpose |

The system uses 10 main tables:|------|-------|----------|---------|

| Admin | admin@lpubatangas.edu.ph | changeme | System administration |

- **users** - All system users (students, instructors, admins)| Secretary | secretary@lpubatangas.edu.ph | changeme | Secretary functions |

- **students** - Student-specific data| Instructor | instructor1@lpubatangas.edu.ph | changeme | View class evaluations |

- **programs** - Academic programs (BSCS-DS, BSIT, etc.)| Student | student1@lpubatangas.edu.ph | changeme | Submit evaluations |

- **courses** - Course catalog

- **class_sections** - Specific class instances**Note:** Sample data creates 10 instructors (instructor1-10) and 20 students (student1-20)

- **enrollments** - Student-class enrollments

- **evaluations** - Student evaluation submissions## Current Status

- **evaluation_periods** - Evaluation scheduling

- **audit_logs** - System activity tracking### ✅ Completed

- **system_settings** - Configuration management- Backend API fully implemented

- **Database schema redesigned for thesis**

## 🔧 Configuration- **7 Programs + 367 courses imported from Courses.xlsx**

- **ML features added (sentiment analysis + anomaly detection)**

### Backend (.env)- **Sample evaluation data with realistic distributions**

- Frontend UI components built

```env- Role-based routing configured

DATABASE_URL=postgresql://user:password@host:6543/database- Supabase PostgreSQL connected

```

### 🔨 In Progress

### Frontend (vite.config.js)- **Frontend Updates** (Some admin pages need updates)

  - Remove: EvaluationPeriodManagement, SystemSettings, AuditLogViewer

API base URL is configured in `src/services/api.js`:  - Update: UserManagement, CourseManagement, AdminDashboard

```javascript  - Keep: SentimentAnalysis and AnomalyDetection (perfect for thesis!)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';  - See `FRONTEND_PAGES_ANALYSIS.md` for details

```

### 📝 Next Steps (ML Implementation)

## 🐛 Troubleshooting1. **Train SVM model** on text_feedback data

2. **Implement DBSCAN** for anomaly detection

### Backend won't start3. **Connect ML models** to backend API

4. **Display results** in SentimentAnalysis.jsx and AnomalyDetection.jsx

- Check if port 8000 is available: `netstat -ano | findstr :8000`5. Test and validate ML predictions

- Verify DATABASE_URL in `.env` file

- Ensure all dependencies are installed: `pip install -r requirements.txt`**See `DATABASE_SETUP_GUIDE.md` for database setup.**  

**See `FRONTEND_PAGES_ANALYSIS.md` for frontend updates.**

### Frontend API errors

## Technology Stack

- Verify backend is running on `http://127.0.0.1:8000`1. Navigate to `Back` folder

- Check CORS settings in `Back/App/main.py`2. Create virtual environment: `python -m venv venv`

- Ensure API requests are using correct base URL3. Activate: `venv\Scripts\activate` (Windows)

4. Install dependencies: `pip install -r requirements.txt`

### Database connection issues5. Copy `.env.example` to `.env`

6. Run: `cd App && python main.py`

- Verify database credentials in `.env`

- Use Transaction Pooler port (6543) for Supabase, not Session Pooler (5432)### Frontend

- Check connection pool settings in `Back/App/database/connection.py`1. Navigate to `Front` folder

2. Install dependencies: `npm install`

## 📝 Development Notes3. Start dev server: `npm start`



- Backend uses `reload=False` to prevent auto-restart issues## Features

- Frontend uses React Router for navigation- User authentication

- Authentication tokens stored in localStorage- Data management

- Database connection pooling configured for optimal performance- Modern UI with Material-UI

- REST API with FastAPI

## 🎯 Key Endpoints- PostgreSQL/SQLite database support



- `POST /api/auth/login` - User login## Tech Stack

- `GET /api/student/courses` - Get student's enrolled courses- **Backend**: FastAPI, SQLAlchemy, PostgreSQL

- `POST /api/student/evaluate` - Submit evaluation- **Frontend**: React, Material-UI

- `GET /api/admin/dashboard-stats` - Admin dashboard statistics- **ML**: scikit-learn, spaCy

- `GET /api/admin/users` - User management- **Cloud**: Firebase (optional)

- `GET /api/dept-head/evaluations` - Department evaluations

## 📦 SQL Files Guide

- **DATABASE_COMPLETE_SETUP.sql** - Run this first to create all tables and indexes
- **import_by_program/00_RUN_ALL_IMPORTS.sql** - Run this second to import all programs and courses
- Individual course files (01-08) can be run separately if needed

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all setup steps were completed
3. Check terminal/console for error messages
