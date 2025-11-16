# 🎯 SYSTEM SETUP GUIDE

**Production System Setup** - Follow these steps to set up the LPU Course Evaluation System

Branch: `feature/secretary-depthead-overhaul`  
Last Updated: November 17, 2025

---

## ✅ Prerequisites

Before starting, ensure you have:
- [ ] Python 3.13+ installed
- [ ] Node.js 20+ installed
- [ ] Supabase account with PostgreSQL database
- [ ] Access to Supabase SQL Editor
- [ ] Git installed (for cloning repository)

---

## 📋 SETUP STEPS

## 📋 Setup Steps

### Step 1: Clone Repository

```powershell
# Clone the repository
git clone <repository-url>
cd "1 thesis"

# Checkout the production branch
git checkout feature/secretary-depthead-overhaul
```

---

### Step 2: Database Setup

**Time: 5 minutes**

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and service key

2. **Initialize Database Schema:**
   - Open Supabase Dashboard → SQL Editor
   - Open file: `Back/database_schema/DATABASE_COMPLETE_SETUP.sql`
   - Copy entire content
   - Paste into SQL Editor
   - Click "RUN"
   - Verify success (should create 12+ tables)

3. **What this creates:**
   - Users table with role management
   - Programs, sections, courses tables
   - Class sections and enrollments
   - Evaluations and responses
   - Audit logs
   - System settings

---

### Step 3: Backend Setup

**Time: 3 minutes**

1. **Navigate to backend directory:**
```powershell
cd Back\App
```

2. **Create virtual environment:**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

3. **Install dependencies:**
```powershell
pip install -r requirements.txt
```

4. **Configure database connection:**
   - Create `config.py` in `Back/App/`
   - Add your Supabase credentials:
```python
SUPABASE_URL = "your-project-url"
SUPABASE_SERVICE_KEY = "your-service-key"
JWT_SECRET = "your-jwt-secret"
```

5. **Train ML models:**
```powershell
python train_ml_models.py
```
   - Creates SVM sentiment model
   - Creates DBSCAN anomaly detector
   - Saves to `ml_services/models/`

6. **Start backend server:**
```powershell
python main.py
```
   - Backend runs on http://localhost:8000
   - API docs at http://localhost:8000/docs

---

### Step 4: Frontend Setup

**Time: 2 minutes**

1. **Open new terminal, navigate to frontend:**
```powershell
cd New\capstone
```

2. **Install dependencies:**
```powershell
npm install
```

3. **Start development server:**
```powershell
npm run dev
```
   - Frontend runs on http://localhost:5173
   - Opens automatically in browser

---

### Step 5: Create Test Users

**Time: 1 minute**

1. **In backend terminal (with venv activated):**
```powershell
python create_test_users.py
```

2. **Expected output:**
```
✅ ALL USERS CREATED SUCCESSFULLY

📊 SUMMARY:
  System Admin: 1
  Admin: 1
  Secretary: 1
  Dept Head: 1
  Student: 5+

🔐 TEST CREDENTIALS:
System Admin:   admin@lpu.edu.ph / admin123
Student:        student1@lpu.edu.ph / student123
Secretary:      secretary@lpu.edu.ph / secretary123
Dept Head:      depthead@lpu.edu.ph / depthead123
```

**Time: 1 minute**

1. **Test login at http://localhost:5173**
   - Use credentials: admin@lpu.edu.ph / admin123
   - Should redirect to admin dashboard

2. **Verify ML models loaded:**
   - Check backend terminal for:
   ```
   ✅ SVM model loaded successfully
   ✅ Anomaly detector initialized
   ```

3. **Check API docs:**
   - Visit http://localhost:8000/docs
   - Should see 50+ endpoints organized by role

---

## 🎓 Default User Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| System Admin | admin@lpu.edu.ph | admin123 | Full system access, user management |
| Student | student1@lpu.edu.ph | student123 | Submit evaluations, view courses |
| Secretary | secretary@lpu.edu.ph | secretary123 | Manage evaluation periods |
| Dept Head | depthead@lpu.edu.ph | depthead123 | View department analytics |

**Note:** Create more students as needed using the admin panel.

**Keep this terminal open - backend must be running**

---

### STEP 6: Start the Frontend

**Time: 10 seconds**

1. Open NEW terminal in `New/capstone`
2. Run: `npm run dev`

**Expected Output:**
```
  VITE v7.1.4  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Keep this terminal open too**

---

### STEP 7: Test the System

**Time: 2-3 minutes**

1. Open browser: `http://localhost:5173`
2. Click "Login" button
---

## 🚀 Quick Start Workflow

### For Testing Student Enrollment:

1. **Login as System Admin:**
   - Email: admin@lpu.edu.ph
   - Password: admin123

2. **Create Program Section:**
   - Navigate to "Course Management"
   - Click "Program Sections" tab
   - Create section (e.g., BSCS-DS-3A for BSCS Data Science Year 3)

3. **Assign Student to Program Section:**
   - Go to "User Management"
   - Edit student record
   - Assign program and section

4. **Create Class Sections with Auto-Enrollment:**
   - Go to "Course Management"
   - Select "Quick Bulk Enrollment" tab
   - Select program (e.g., BSCS Data Science)
   - Select year level (e.g., 3)
   - Select program section (e.g., 3A)
   - Select semester and academic year
   - Click "Create Sections"
   - **Students are automatically enrolled!**

5. **Verify Student Can See Courses:**
   - Logout and login as student
   - Should see all enrolled courses
   - Can evaluate courses during active period

---

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem:** "Database connection failed"

**Solutions:**
1. Verify Supabase project is running
2. Check `config.py` has correct credentials:
   ```python
   SUPABASE_URL = "https://your-project.supabase.co"
   SUPABASE_SERVICE_KEY = "your-service-key"
   ```
3. Test connection:
   ```powershell
   python -c "from database.connection import get_db; print('✓ Connected')"
   ```

---

### Login Issues

**Problem:** "Invalid email or password"

**Solutions:**
1. Verify users exist:
   ```powershell
   python check_system.py
   ```
2. Check exact credentials (case-sensitive)
3. Re-create users if needed:
   ```powershell
   python create_test_users.py
   ```

---

### Student Not Seeing Courses

**Problem:** Student logged in but no courses shown

**Solutions:**
1. **Check enrollment:**
   - Use Quick Bulk Enrollment with auto-enrollment enabled
   - Or manually enroll student via admin panel

2. **Verify program section assignment:**
   - Student must be assigned to program section (e.g., BSCS-DS-3A)
   - Program section must match class sections

3. **Check evaluation period:**
   - Student only sees courses during active evaluation period
   - Create period via Secretary role

---

### ML Model Issues

**Problem:** "ML model not found" or sentiment analysis not working

**Solutions:**
1. Train models:
   ```powershell
   cd Back\App
   python train_ml_models.py
   ```
2. Verify models created:
   - Check `ml_services/models/svm_sentiment_model.pkl` exists
   - Backend should log "✅ SVM model loaded successfully"

---

### Frontend Connection Issues

**Problem:** "Cannot connect to backend" or API errors

**Solutions:**
- Check browser console (F12) for errors
- Verify frontend is running (`npm run dev`)
- Clear browser cache and reload

### Problem: "Role-specific pages not loading"
**Solution:**
- Verify user has correct role in database
- Check browser localStorage for auth token
- Logout and login again

### Problem: "No courses showing for student"
**Solution:**
- Run STEP 3 again to create enrollments
- Check student is enrolled: 
  ```sql
  SELECT * FROM enrollments WHERE student_id IN 
  (SELECT id FROM students WHERE student_number = '2021-00001')
  ```

---

## 📊 QUICK DATABASE CHECKS

Run these SQL queries in Supabase SQL Editor if needed:

### Check all users:
```sql
SELECT id, email, role, first_name, last_name, is_active 
FROM users 
ORDER BY role, id;
```

### Check students with programs:
```sql
SELECT s.student_number, u.email, p.program_code, s.year_level
FROM students s
JOIN users u ON s.user_id = u.id
JOIN programs p ON s.program_id = p.id;
```

### Check enrollments:
```sql
SELECT 
    s.student_number,
    c.subject_code,
    c.subject_name,
    cs.class_code,
    u.first_name || ' ' || u.last_name as instructor
FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN class_sections cs ON e.class_section_id = cs.id
JOIN courses c ON cs.course_id = c.id
JOIN users u ON cs.instructor_id = u.id
LIMIT 20;
```

---

## ✅ SUCCESS CHECKLIST

Mark these off as you complete them:

- [ ] STEP 1: Database schema fixed (no errors in SQL)
- [ ] STEP 2: 20 test users created (admin + staff + students)
- [ ] STEP 3: Sample data created (class sections + enrollments)
- [ ] STEP 4: System diagnostic shows all counts > 0
- [ ] STEP 5: Backend running without errors on port 8000
- [ ] STEP 6: Frontend running without errors on port 5173
- [ ] STEP 7a: Admin login works → see admin dashboard
- [ ] STEP 7b: Student login works → see courses
- [ ] STEP 7c: Instructor login works → see dashboard
- [ ] STEP 7d: Secretary login works → see dashboard
- [ ] STEP 7e: Dept Head login works → see dashboard

---

## 🎉 SYSTEM READY!

If all checkboxes are marked, your system is fully operational!

**Next Steps:**
1. Explore each role's features
2. Create additional users through admin panel
3. Start working on ML sentiment analysis features
4. Customize evaluation questions

**Need Help?**
- Re-run `python check_system.py` for current status
- Check error messages in backend/frontend terminals
- Review this checklist for missed steps

---

**Good luck! 🚀**
