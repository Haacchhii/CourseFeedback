# System Data Cleanup Guide

## Overview
Tools to help you start fresh with your Course Feedback System data.

## 📁 Files Created

### 1. `cleanup_data.ps1` (Interactive Menu)
**Location:** Root directory  
**Usage:** 
```powershell
.\cleanup_data.ps1
```
Provides an easy interactive menu to:
- Check current data status
- Reset ONLY students & evaluations (RECOMMENDED)
- Reset ALL system data (full reset)
- Safe confirmation prompts

### 2. `Back/App/check_data_status.py`
**Purpose:** Shows current data counts  
**Usage:**
```powershell
.venv\Scripts\python.exe Back\App\check_data_status.py
```
**Shows:**
- User counts by role
- Academic structure (programs, courses, sections)
- Enrollments and evaluations
- System logs
- Data health warnings

### 3. `Back/App/reset_students_evaluations.py` ⭐ RECOMMENDED
**Purpose:** Clean student data only - preserves your academic structure  
**Usage:**
```powershell
.venv\Scripts\python.exe Back\App\reset_students_evaluations.py
```
**Deletes:** Students, evaluations, enrollments  
**Preserves:** Staff, courses, programs, sections, evaluation periods

### 4. `Back/App/reset_system_data.py`
**Purpose:** Full reset - deletes all user data  
**Usage:**
```powershell
.venv\Scripts\python.exe Back\App\reset_system_data.py
```

## 🗑️ What Gets Deleted

### Option A: Student & Evaluation Reset (RECOMMENDED)
The `reset_students_evaluations.py` script removes:
- ✗ All students and student records
- ✗ All evaluations and responses
- ✗ All enrollments
- ✗ Student-related audit logs (optional)

**Preserves:**
- ✓ Admin accounts
- ✓ Department heads
- ✓ Secretaries  
- ✓ All courses and class sections
- ✓ All programs and program sections
- ✓ All evaluation periods

### Option B: Full System Reset
The `reset_system_data.py` script removes:
- ✗ All non-admin users (students, staff, department heads, secretaries)
- ✗ All evaluations and responses
- ✗ All enrollments
- ✗ All class sections and program sections
- ✗ All courses
- ✗ All programs
- ✗ All evaluation periods
- ✗ All audit logs
- ✗ All export history
- ✗ All password reset tokens

**Preserves:**
- ✓ **Admin accounts** (role='admin')
- ✓ Database schema/structure
- ✓ System settings (optional)

## 🎯 Recommended Workflow

### Step 1: Check Current Data
```powershell
.\cleanup_data.ps1
# Choose option 1
```
Or directly:
```powershell
.venv\Scripts\python.exe Back\App\check_data_status.py
```

### Step 2: Backup (Optional but Recommended)
If you have any data you might want later:
```powershell
# Manual backup via your database tool
# OR export CSV files from the admin panel
```

### Step 3: Choose Your Reset Type

#### Option A: Student & Evaluation Reset (RECOMMENDED) ⭐
Best for: Testing natural student data flow while keeping your academic structure
```powershell
.\cleanup_data.ps1
# Choose option 2
# Type "RESET STUDENTS" when prompted
```
Or directly:
```powershell
.venv\Scripts\python.exe Back\App\reset_students_evaluations.py
```

#### Option B: Full System Reset
Best for: Complete fresh start, rebuilding everything
```powershell
.\cleanup_data.ps1
# Choose option 3
# Type "RESET" when prompted
```
Or directly:
```powershell
.venv\Scripts\python.exe Back\App\reset_system_data.py
```

### Step 4: Verify Clean State
```powershell
.venv\Scripts\python.exe Back\App\check_data_status.py
```

**After Student Reset:** Should show:
- Admin and staff accounts remaining
- Courses, programs, sections intact
- Student count at 0
- Evaluation count at 0

**After Full Reset:** Should show:
- Only admin accounts remaining
- All other counts at 0

### Step 5: Start Fresh Data Flow

#### A. Create Evaluation Period
1. Login as admin
2. Go to System Settings → Evaluation Periods
3. Create a new active period (e.g., "1st Semester 2025-2026")

#### B. Add Programs
1. Go to Program Management
2. Add programs: BSCS-DS, BSCYSEC, BSIT, ABPSYCH, BSPSYCH, BMMA, ABCOMM

#### C. Add Courses
1. Go to Course Management
2. Add courses for each program with:
   - Course code
   - Course name
   - Department
   - Assigned program

#### D. Create Users
Option 1 - Bulk Import:
1. Go to User Management → Bulk Import
2. Upload CSV with student data
3. System sends welcome emails automatically

Option 2 - Manual Creation:
1. Go to User Management → Add User
2. Fill in details for each student/staff
3. System generates password and sends email

#### E. Create Class Sections
1. Go to Class Section Management
2. Create sections for each course
3. Assign instructor
4. Set schedule and room

#### F. Enroll Students
Option 1 - Bulk Enrollment:
1. Use enrollment list CSV import
2. Map students to sections

Option 2 - Manual Enrollment:
1. Go to each section
2. Add students individually

#### G. Test Natural Flow
1. **Student login** → View courses → Submit evaluations
2. **Instructor login** → View assigned courses → Check responses
3. **Secretary login** → Monitor completion rates → Generate reports
4. **Department Head login** → View analytics → Sentiment analysis
5. **Admin login** → System overview → Export data

## 🛡️ Safety Features

### Confirmation Required
- Must type "RESET" to confirm deletion
- Double confirmation in PowerShell script

### Admin Protection
- Admin accounts are NEVER deleted
- Ensures you can always access the system

### Transaction Safety
- Each delete operation is committed separately
- If one fails, others still complete
- Rollback on errors

### Logging
- Shows exactly what's being deleted
- Provides counts for verification
- Clear progress indicators

## 🚨 Troubleshooting

### "No admin accounts found" warning
**Solution:** Create an admin account first:
```powershell
.venv\Scripts\python.exe Back\App\create_demo_users.py
# OR use your existing admin creation script
```

### Foreign key constraint errors
**Cause:** Data relationships preventing deletion  
**Solution:** Script handles deletion order automatically, but if errors persist:
1. Check database for custom constraints
2. Run with database logs enabled
3. Contact for assistance with specific error

### Script hangs during execution
**Cause:** Large dataset taking time  
**Solution:** Be patient - script shows progress. Large datasets (1000+ records per table) may take 1-2 minutes

## 📊 Testing Scenarios After Reset

### Scenario 1: Complete Flow Test
1. Create 1 evaluation period
2. Add 2-3 programs
3. Add 5-10 courses
4. Create 20-30 students
5. Create 3-5 instructors
6. Create class sections
7. Enroll students
8. Have students submit evaluations
9. Check all analytics and reports

### Scenario 2: Error Handling Test
1. Try creating duplicate users
2. Test invalid enrollments
3. Test evaluation submissions outside period
4. Test bulk import with errors
5. Verify error messages are clear

### Scenario 3: Scale Test
1. Import 100+ students via CSV
2. Create 20+ sections
3. Bulk enroll students
4. Monitor performance
5. Check pagination and search

### Scenario 4: Defense Demo Preparation
1. Create realistic data set
2. Pre-populate evaluations
3. Generate sample reports
4. Prepare analytics screenshots
5. Test all user roles

## ⚡ Quick Commands

```powershell
# Check status
.venv\Scripts\python.exe Back\App\check_data_status.py

# Reset students & evaluations only (RECOMMENDED)
.venv\Scripts\python.exe Back\App\reset_students_evaluations.py

# Reset ALL data (full reset)
.venv\Scripts\python.exe Back\App\reset_system_data.py

# Interactive menu (easiest)
.\cleanup_data.ps1
```

## 🎓 Natural Data Flow Order

1. **System Setup** (Admin)
   - Evaluation periods
   - Programs
   - System settings

2. **Academic Structure** (Admin/Secretary)
   - Courses
   - Class sections
   - Program sections

3. **User Management** (Admin)
   - Department heads
   - Secretaries
   - Instructors
   - Students

4. **Enrollment** (Secretary)
   - Assign students to sections
   - Verify enrollments

5. **Evaluation Period** (Auto-triggered)
   - Students receive notifications
   - Students submit evaluations

6. **Monitoring** (Staff)
   - Track completion rates
   - Follow up non-respondents
   - Generate reports

7. **Analysis** (Department Heads)
   - Review sentiment analysis
   - Check anomaly detection
   - Export reports

8. **System Administration** (Admin)
   - Monitor audit logs
   - Export historical data
   - Manage evaluation periods

## 📝 Notes

- **Always check data status before and after reset**
- **Test with small dataset first** before defense preparation
- **Keep your admin credentials safe** - they're the only accounts preserved
- **Consider taking screenshots** of current data before reset if needed for reference
- **The reset is irreversible** - once confirmed, data is permanently deleted (except admins)

## 🆘 Need Help?

If you encounter issues:
1. Check the terminal output for specific error messages
2. Verify your virtual environment is activated
3. Ensure database connection is working
4. Check that no other processes are using the database
5. Review the script logs for detailed information
