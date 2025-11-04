# Course Feedback System - Final Version

**Branch:** `final-version`  
**Status:** In Development - API Integration Phase

A comprehensive course evaluation system with React frontend, FastAPI backend, and Supabase PostgreSQL database.

## Project Structure

```
thesis/
├── readme.md
├── SYSTEM_TEST_REPORT.md   # Comprehensive testing documentation
├── Back/                    # FastAPI Backend
│   ├── requirements.txt     # Python dependencies
│   ├── .env                # Supabase connection config
│   ├── database_schema/    # SQL schema files
│   │   ├── COMPLETE_SCHEMA_SINGLE_RUN.sql  # Full database schema
│   │   ├── create_test_users.sql           # Test user accounts
│   │   ├── README.md                       # Schema documentation
│   │   └── QUICK_REFERENCE.md              # Common queries
│   └── App/
│       ├── main.py         # FastAPI application entry
│       ├── database/       # Database connection
│       ├── models/         # SQLAlchemy models
│       ├── routes/         # API endpoints (auth, admin, dept-head, secretary, student)
│       └── services/       # Business logic
└── New/
    └── capstone/           # React Frontend (Vite)
        ├── package.json    # Node dependencies
        ├── vite.config.js  # Vite configuration
        ├── public/         # Static assets
        └── src/
            ├── App.jsx         # Main application
            ├── main.jsx        # Entry point
            ├── components/     # Reusable components
            ├── pages/          # Page components (admin, student, common)
            ├── data/           # Mock data (temporary)
            ├── utils/          # Utility functions
            └── styles/         # CSS stylesheets
```

## Quick Setup

### Backend Setup (FastAPI)

1. **Create Python Virtual Environment:**
   ```bash
   cd Back
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Database:**
   - File: `Back/App/.env`
   - Already configured with Supabase connection string
   - No changes needed if using existing Supabase project

4. **Initialize Database Schema:**
   - Open Supabase Dashboard → SQL Editor
   - Run: `Back/database_schema/COMPLETE_SCHEMA_SINGLE_RUN.sql`
   - Run: `Back/database_schema/create_test_users.sql`

5. **Start Backend Server:**
   ```bash
   cd Back/App
   python main.py
   ```
   - Server runs on: http://127.0.0.1:8000
   - API docs: http://127.0.0.1:8000/docs

### Frontend Setup (React + Vite)

1. **Install Dependencies:**
   ```bash
   cd New/capstone
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```
   - Server runs on: http://localhost:5173

## Test Accounts

After running `create_test_users.sql`, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lpu.edu.ph | password123 |
| Instructor | instructor@lpu.edu.ph | password123 |
| Department Head | depthead@lpu.edu.ph | password123 |
| Secretary | secretary@lpu.edu.ph | password123 |
| Student | student@lpu.edu.ph | password123 |

## Current Status

### ✅ Completed
- Backend API fully implemented
- Database schema designed and imported
- Frontend UI components built
- Role-based routing configured
- Supabase PostgreSQL connected

### 🔨 In Progress
- **API Integration** (CRITICAL)
  - Frontend currently uses mock data
  - Need to create API service layer
  - Connect login to backend authentication
  - Replace all mock data with real API calls

### 📝 Next Steps
1. Create `New/capstone/src/services/api.js`
2. Implement authentication flow with JWT
3. Connect admin pages to backend endpoints
4. Test all CRUD operations
5. Add error handling and loading states

**See `SYSTEM_TEST_REPORT.md` for detailed testing information and implementation guide.**

## Technology Stack

- **Frontend:** React 18, Vite, TailwindCSS, React Router
- **Backend:** FastAPI, Python 3.13, SQLAlchemy
- **Database:** Supabase PostgreSQL
- **Authentication:** bcrypt (JWT planned)
- **Development:** Hot reload, TypeScript support (planned)

## Branch Information

- **final-version** (current): Clean production-ready version
- **FrontBack**: Previous development branch
- Only `Back/` and `New/` folders maintained in final version

### Backend
1. Navigate to `Back` folder
2. Create virtual environment: `python -m venv venv`
3. Activate: `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env`
6. Run: `cd App && python main.py`

### Frontend
1. Navigate to `Front` folder
2. Install dependencies: `npm install`
3. Start dev server: `npm start`

## Features
- User authentication
- Data management
- Modern UI with Material-UI
- REST API with FastAPI
- PostgreSQL/SQLite database support

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React, Material-UI
- **ML**: scikit-learn, spaCy
- **Cloud**: Firebase (optional)
