# 🎯 SYSTEM SETUP - STEP BY STEP GUIDE

**IMPORTANT:** Follow these steps IN ORDER. Do not skip any step.

---

## ✅ PRE-FLIGHT CHECK

Before starting, verify:
- [ ] You have access to Supabase SQL Editor
- [ ] Backend dependencies are installed (`cd Back && pip install -r requirements.txt`)
- [ ] Frontend dependencies are installed (`cd New/capstone && npm install`)
- [ ] You have the database URL in `Back/App/.env`

---

## 📋 SETUP STEPS

### STEP 1: Fix Database Schema (CRITICAL)

**Time: 2-3 minutes**

1. Open Supabase Dashboard → SQL Editor
2. Open the file: `Back/database_schema/01_FIX_USERS_TABLE.sql`
3. Copy ALL content and paste into Supabase SQL Editor
4. Click "RUN" button
5. Verify you see success message: "Users table fixed!"

**What this does:**
- Removes conflicting Supabase auth columns from public.users table
- Recreates clean tables with proper foreign keys
- Removes duplicate columns (id, role, email)

**Expected Result:**
```
✓ Users table fixed!
✓ 11 columns in users table
✓ 5 tables created
```

---

### STEP 2: Create Test Users

**Time: 1 minute**

1. Open terminal in `Back/App` directory
2. Run: `python create_test_users.py`
3. Wait for completion

**Expected Output:**
```
✅ ALL USERS CREATED SUCCESSFULLY

📊 SUMMARY:
  admin: 1
  department_head: 2
  instructor: 5
  secretary: 2
  student: 10

🔐 TEST CREDENTIALS:
Admin:          admin@example.com / admin123
Secretary:      secretary1@example.com / secretary123
Dept Head:      depthead1@example.com / depthead123
Instructor:     instructor1@example.com / instructor123
Student:        student1@example.com / student123
```

**If you see errors:**
- Make sure STEP 1 completed successfully
- Check database connection in `.env` file
- Run `python check_system.py` to diagnose

---

### STEP 3: Create Sample Data (Class Sections & Enrollments)

**Time: 30 seconds**

1. In same terminal (`Back/App`)
2. Run: `python setup_sample_data.py`

**Expected Output:**
```
✅ SAMPLE DATA CREATED SUCCESSFULLY

📊 DATA SUMMARY:
Class Sections: 15
Enrollments: 40+
Evaluation Periods: 1
```

---

### STEP 4: Verify Everything Works

**Time: 1 minute**

1. In `Back/App` terminal
2. Run: `python check_system.py`

**Expected Output:**
```
✅ Database connection successful!
Found 15 tables
Users: 20 records ✓
Students: 10 records ✓
Instructors: 5 records ✓
Department Heads: 2 records ✓
Secretaries: 2 records ✓
Programs: 7 records ✓
Courses: 367 records ✓
Class Sections: 15 records ✓
Enrollments: 40+ records ✓
```

**If any counts are 0, re-run the appropriate step above.**

---

### STEP 5: Start the Backend

**Time: 10 seconds**

1. Open terminal in `Back/App`
2. Run: `python main.py`

**Expected Output:**
```
🔌 Testing database connection...
✅ Database ready!
🛣️ All routes loaded successfully
✅ API routes registered: auth, student, admin...
INFO:     Uvicorn running on http://127.0.0.1:8000
```

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
3. Test each role:

#### Test Admin Login:
```
Email: admin@lpubatangas.edu.ph
Password: admin123
```
- Should redirect to `/admin/dashboard`
- Should see admin navigation menu
- Should see dashboard statistics

#### Test Student Login:
```
Email: student1@lpubatangas.edu.ph
Password: student123
```
- Should redirect to student dashboard
- Should see enrolled courses
- Can evaluate courses

#### Test Instructor Login:
```
Email: instructor1@lpubatangas.edu.ph
Password: instructor123
```
- Should redirect to `/dashboard`
- Should see assigned classes
- Can view evaluations

#### Test Secretary Login:
```
Email: secretary1@lpubatangas.edu.ph
Password: secretary123
```
- Should redirect to `/dashboard`
- Can manage evaluation periods
- Can view reports

#### Test Department Head Login:
```
Email: depthead1@lpubatangas.edu.ph
Password: depthead123
```
- Should redirect to `/dashboard`
- Can view department analytics
- Can access reports

---

## 🐛 TROUBLESHOOTING

### Problem: "Database connection failed"
**Solution:**
- Check `.env` file has correct DATABASE_URL
- Test connection: `python -c "from database.connection import test_connection; test_connection()"`
- Verify Supabase database is running

### Problem: "Invalid email or password"
**Solution:**
- Verify users were created (run `python check_system.py`)
- Re-run STEP 2 if no users found
- Check exact email and password (case-sensitive)

### Problem: "Cannot connect to backend"
**Solution:**
- Make sure backend is running (`python main.py`)
- Check backend is on port 8000
- Look for error messages in backend terminal

### Problem: "Blank/white screen on frontend"
**Solution:**
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
