# ⚡ QUICK REFERENCE CARD

## 🎯 3-STEP SETUP

```bash
# 1. FIX DATABASE (Supabase SQL Editor)
Run: Back/database_schema/01_FIX_USERS_TABLE.sql

# 2. CREATE DATA (Terminal in Back/App)
python create_test_users.py
python setup_sample_data.py

# 3. START SYSTEM (Two terminals)
python main.py              # Terminal 1
npm run dev                 # Terminal 2 (in New/capstone)
```

## 🔐 LOGIN CREDENTIALS

```
Admin:      admin@lpubatangas.edu.ph / admin123
Secretary:  secretary1@lpubatangas.edu.ph / secretary123
Dept Head:  depthead1@lpubatangas.edu.ph / depthead123
Instructor: instructor1@lpubatangas.edu.ph / instructor123
Student:    student1@lpubatangas.edu.ph / student123
```

## 🛠️ USEFUL COMMANDS

```bash
# Check system status
python check_system.py

# Test database connection
python -c "from database.connection import test_connection; test_connection()"

# Kill backend (if port busy)
# Windows: netstat -ano | findstr :8000
# Then: taskkill /PID <PID> /F

# Backend
python main.py              # Start backend on port 8000

# Frontend
npm run dev                 # Start frontend on port 5173

# Install dependencies
pip install -r requirements.txt        # Backend (in Back/)
npm install                            # Frontend (in New/capstone/)
```

## 📊 KEY URLS

```
Frontend:        http://localhost:5173
Backend API:     http://localhost:8000
API Docs:        http://localhost:8000/docs
Health Check:    http://localhost:8000/health
```

## 🗂️ IMPORTANT FILES

```
START_HERE.md                          ← Read this first!
SETUP_GUIDE.md                         ← Follow step-by-step
COMPLETE_SYSTEM_ANALYSIS.md            ← Technical details

Back/database_schema/01_FIX_USERS_TABLE.sql    ← Run in Supabase
Back/App/check_system.py                       ← Diagnostic tool
Back/App/create_test_users.py                  ← Create users
Back/App/setup_sample_data.py                  ← Create data
Back/App/main.py                               ← Backend entry
Back/App/.env                                  ← Database config

New/capstone/src/App.jsx               ← Frontend routes
```

## 🔍 TROUBLESHOOTING

```bash
# Database issues
python check_system.py       # See what's wrong

# Backend issues
python main.py               # Look for error messages

# Frontend issues
npm run dev                  # Look for error messages
# Then: Open browser console (F12)

# Login issues
# 1. Verify users exist: python check_system.py
# 2. Check exact email/password (case-sensitive)
# 3. Verify backend is running
```

## ✅ SUCCESS INDICATORS

```
✓ Backend shows: "✅ Database ready!"
✓ Backend shows: "Uvicorn running on http://127.0.0.1:8000"
✓ Frontend shows: "Local: http://localhost:5173"
✓ check_system.py shows: Users: 20, Students: 10, etc.
✓ Can login as any role
✓ Dashboard loads after login
```

## 🚨 COMMON ERRORS

### "Database connection failed"
→ Check .env file has correct DATABASE_URL

### "Invalid email or password"
→ Run: python create_test_users.py

### "Cannot connect to backend"
→ Make sure backend is running (python main.py)

### "White screen on frontend"
→ Check browser console (F12) for errors
→ Verify frontend is running (npm run dev)

### "No users found"
→ Run 01_FIX_USERS_TABLE.sql in Supabase first
→ Then run python create_test_users.py

## 📝 DATABASE QUICK CHECKS

```sql
-- Check users
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check students
SELECT * FROM students LIMIT 5;

-- Check enrollments
SELECT COUNT(*) FROM enrollments;
```

## 🎯 ROLE CAPABILITIES

| Role           | Can Do                                    |
|----------------|-------------------------------------------|
| Admin          | Everything (user mgmt, system settings)   |
| Secretary      | Evaluations, periods, reports             |
| Dept Head      | Department analytics, reports             |
| Instructor     | Own class evaluations                     |
| Student        | Submit evaluations for enrolled courses   |

## 🔄 RESET EVERYTHING

```bash
# If you need to start completely fresh:

# 1. Run in Supabase SQL Editor:
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS class_sections CASCADE;
DROP TABLE IF EXISTS instructors CASCADE;
DROP TABLE IF EXISTS secretaries CASCADE;
DROP TABLE IF EXISTS department_heads CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

# 2. Then follow 3-STEP SETUP above
```

## 💾 BACKUP IMPORTANT DATA

```bash
# Before major changes, backup:
# 1. .env file (database credentials)
# 2. Export users from Supabase (SQL Editor):
SELECT * FROM users;
# Copy results

# 3. Export programs/courses:
SELECT * FROM programs;
SELECT * FROM courses;
```

---

**Need detailed help? Read START_HERE.md → SETUP_GUIDE.md**

**System working? Explore the admin dashboard to create more users!**
