# 🧪 LPU Course Feedback System - Testing Guide

**For:** Claude AI or Manual Testing  
**Date:** December 8, 2025  
**System:** Course Insight Guardian - LPU Batangas

---

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Test User Template](#test-user-template)
3. [CSV Import Format](#csv-import-format)
4. [Test Scenarios](#test-scenarios)
5. [API Endpoints](#api-endpoints)
6. [Expected Behaviors](#expected-behaviors)
7. [Common Issues](#common-issues)

---

## 🎯 System Overview

### Technology Stack
- **Frontend:** React 18 + Vite + Tailwind CSS (Port: 5173)
- **Backend:** FastAPI + Python 3.13 (Port: 8000)
- **Database:** PostgreSQL (Supabase)
- **ML Features:** SVM Sentiment Analysis + DBSCAN Anomaly Detection

### User Roles
1. **System Admin** - Full system access, user management, course management
2. **Department Head** - View analytics, sentiment analysis, anomaly detection
3. **Secretary** - View analytics, manage program sections
4. **Student** - Submit course evaluations
5. **Instructor** - View own course evaluations (limited)

---

## 👤 Test User Template

### Student Import CSV Format
The system accepts student data in the following CSV format:

```csv
student_number,first_name,last_name,middle_name,email,program_code,year_level,college_code,college_name
2022-00001,Francesca Nicole,Dayaday,,fdayaday@lpulaguna.edu.ph,BSIT,2,CCAS,College of Computer and Applied Sciences
2022-00002,Juan,Dela Cruz,Santos,jdelacruz@lpulaguna.edu.ph,BSIT,1,CCAS,College of Computer and Applied Sciences
```

### Required Fields
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `student_number` | String | Unique student ID (format: YYYY-XXXXX) | `2022-00001` |
| `first_name` | String | Student first name | `Juan` |
| `last_name` | String | Student last name | `Dela Cruz` |
| `middle_name` | String | Middle name (can be empty) | `Santos` or `` |
| `email` | String | LPU email (must end with @lpulaguna.edu.ph) | `jdelacruz@lpulaguna.edu.ph` |
| `program_code` | String | Program abbreviation | `BSIT`, `BSCS-DS`, `BSPSY`, etc. |
| `year_level` | Integer | 1-4 | `1`, `2`, `3`, or `4` |
| `college_code` | String | College abbreviation | `CCAS`, `CAS`, `CBA`, `CCSEAS` |
| `college_name` | String | Full college name | `College of Computer and Applied Sciences` |

### Valid Program Codes
```
- BSIT: Bachelor of Science in Information Technology
- BSCS-DS: Bachelor of Science in Computer Science - Data Science
- BSPSY: Bachelor of Science in Psychology
- BAPSY: Bachelor of Arts in Psychology
- ABCOMM: Bachelor of Arts in Communication
- BMA: Bachelor of Multimedia Arts
- BS-CYBER: Bachelor of Science in Cybersecurity
- BMMA: Bachelor of Multimedia Arts
```

### Valid College Codes
```
- CCAS: College of Computer and Applied Sciences
- CAS: College of Arts and Sciences
- CBA: College of Business Administration
- CCSEAS: College of Communication and Social and Educational Applied Sciences
```

---

## 📝 Generate Test Users (CSV Template)

### Example: 30 Students for BSIT Program

```csv
student_number,first_name,last_name,middle_name,email,program_code,year_level,college_code,college_name
2022-00001,John,Smith,Santos,jsmith@lpulaguna.edu.ph,BSIT,1,CCAS,College of Computer and Applied Sciences
2022-00002,Jane,Johnson,Cruz,jjohnson@lpulaguna.edu.ph,BSIT,1,CCAS,College of Computer and Applied Sciences
2022-00003,Mark,Williams,Reyes,mwilliams@lpulaguna.edu.ph,BSIT,1,CCAS,College of Computer and Applied Sciences
2022-00004,Mary,Brown,Garcia,mbrown@lpulaguna.edu.ph,BSIT,1,CCAS,College of Computer and Applied Sciences
2022-00005,Peter,Jones,Lopez,pjones@lpulaguna.edu.ph,BSIT,1,CCAS,College of Computer and Applied Sciences
2022-00006,Sarah,Garcia,Martinez,sgarcia@lpulaguna.edu.ph,BSIT,2,CCAS,College of Computer and Applied Sciences
2022-00007,Michael,Miller,Hernandez,mmiller@lpulaguna.edu.ph,BSIT,2,CCAS,College of Computer and Applied Sciences
2022-00008,Linda,Davis,Gonzalez,ldavis@lpulaguna.edu.ph,BSIT,2,CCAS,College of Computer and Applied Sciences
2022-00009,James,Rodriguez,Perez,jrodriguez@lpulaguna.edu.ph,BSIT,2,CCAS,College of Computer and Applied Sciences
2022-00010,Emma,Martinez,Torres,emartinez@lpulaguna.edu.ph,BSIT,2,CCAS,College of Computer and Applied Sciences
2022-00011,Robert,Hernandez,Flores,rhernandez@lpulaguna.edu.ph,BSIT,3,CCAS,College of Computer and Applied Sciences
2022-00012,Lisa,Lopez,Ramirez,llopez@lpulaguna.edu.ph,BSIT,3,CCAS,College of Computer and Applied Sciences
2022-00013,David,Gonzalez,Rivera,dgonzalez@lpulaguna.edu.ph,BSIT,3,CCAS,College of Computer and Applied Sciences
2022-00014,Nancy,Wilson,Castillo,nwilson@lpulaguna.edu.ph,BSIT,3,CCAS,College of Computer and Applied Sciences
2022-00015,William,Anderson,Morales,wanderson@lpulaguna.edu.ph,BSIT,3,CCAS,College of Computer and Applied Sciences
2022-00016,Karen,Thomas,Ortiz,kthomas@lpulaguna.edu.ph,BSIT,4,CCAS,College of Computer and Applied Sciences
2022-00017,Richard,Taylor,Ramos,rtaylor@lpulaguna.edu.ph,BSIT,4,CCAS,College of Computer and Applied Sciences
2022-00018,Betty,Moore,Diaz,bmoore@lpulaguna.edu.ph,BSIT,4,CCAS,College of Computer and Applied Sciences
2022-00019,Joseph,Jackson,Mendoza,jjackson@lpulaguna.edu.ph,BSIT,4,CCAS,College of Computer and Applied Sciences
2022-00020,Helen,Martin,Santos,hmartin@lpulaguna.edu.ph,BSIT,4,CCAS,College of Computer and Applied Sciences
```

### Example: Mixed Programs (BSCS-DS, BSPSY, ABCOMM)

```csv
student_number,first_name,last_name,middle_name,email,program_code,year_level,college_code,college_name
2022-00021,Thomas,Lee,Cruz,tlee@lpulaguna.edu.ph,BSCS-DS,1,CCAS,College of Computer and Applied Sciences
2022-00022,Sandra,Perez,Reyes,sperez@lpulaguna.edu.ph,BSCS-DS,2,CCAS,College of Computer and Applied Sciences
2022-00023,Charles,Thompson,Garcia,cthompson@lpulaguna.edu.ph,BSCS-DS,3,CCAS,College of Computer and Applied Sciences
2022-00024,Donna,White,Lopez,dwhite@lpulaguna.edu.ph,BSCS-DS,4,CCAS,College of Computer and Applied Sciences
2022-00025,Daniel,Harris,Martinez,dharris@lpulaguna.edu.ph,BSPSY,1,CAS,College of Arts and Sciences
2022-00026,Carol,Sanchez,Hernandez,csanchez@lpulaguna.edu.ph,BSPSY,2,CAS,College of Arts and Sciences
2022-00027,Paul,Clark,Gonzalez,pclark@lpulaguna.edu.ph,BSPSY,3,CAS,College of Arts and Sciences
2022-00028,Ruth,Ramirez,Perez,rramirez@lpulaguna.edu.ph,BSPSY,4,CAS,College of Arts and Sciences
2022-00029,George,Lewis,Torres,glewis@lpulaguna.edu.ph,ABCOMM,1,CCSEAS,College of Communication and Social and Educational Applied Sciences
2022-00030,Sharon,Robinson,Flores,srobinson@lpulaguna.edu.ph,ABCOMM,2,CCSEAS,College of Communication and Social and Educational Applied Sciences
```

---

## 🧪 Test Scenarios

### 1. Authentication Testing

#### Test Login (All Roles)
**Default Admin:**
- Email: `admin@lpu.edu.ph`
- Password: `admin123`
- Expected: Redirect to Admin Dashboard

**Test Student (after import):**
- Email: `jsmith@lpulaguna.edu.ph`
- Password: `password123` (default for imported students)
- Expected: Redirect to Student Evaluation page

#### Test Invalid Login
- Email: `invalid@test.com`
- Password: `wrong`
- Expected: Error message "Invalid credentials"

### 2. Student Import Testing

**Steps:**
1. Login as System Admin
2. Navigate to User Management
3. Click "Import Students" or "Bulk Upload"
4. Upload CSV file (use template above)
5. Verify success message
6. Check Users table for new students

**Expected Results:**
- ✅ All students created with default password `password123`
- ✅ Students auto-enrolled in program sections
- ✅ Email validation (must be @lpulaguna.edu.ph)
- ✅ Duplicate prevention (student_number unique)

### 3. Evaluation Period Testing

**Steps:**
1. Login as Admin
2. Navigate to Evaluation Period Management
3. Create new evaluation period:
   - Name: "Midterm 2025"
   - Start Date: Today
   - End Date: 30 days from now
   - Status: Active
4. Set as active period

**Expected Results:**
- ✅ Only one active period at a time
- ✅ Students can only evaluate during active period
- ✅ Past periods become read-only

### 4. Course Evaluation Testing (31 Questions)

**Prerequisites:**
- Active evaluation period
- Student enrolled in courses
- Course sections with instructors

**Steps:**
1. Login as student
2. View available courses to evaluate
3. Complete 31-question evaluation form:
   - Questions 1-28: Likert scale (1-5)
   - Question 29: Text feedback
   - Question 30: Course rating (1-5)
   - Question 31: Additional comments
4. Submit evaluation

**Expected Results:**
- ✅ All required questions must be answered
- ✅ ML sentiment analysis runs automatically
- ✅ DBSCAN anomaly detection processes response
- ✅ Student cannot re-evaluate same course in same period
- ✅ Confirmation message displayed

### 5. Sentiment Analysis Testing

**Steps:**
1. Login as Department Head or Secretary
2. Navigate to Sentiment Analysis page
3. Select evaluation period
4. Select program (if applicable)
5. View sentiment results

**Expected Results:**
- ✅ Sentiment categories: Positive, Neutral, Negative
- ✅ Distribution charts visible
- ✅ Sample comments displayed
- ✅ Filter by instructor works
- ✅ No data message if no evaluations

### 6. Anomaly Detection Testing

**Steps:**
1. Login as Department Head or Secretary
2. Navigate to Anomaly Detection page
3. Select evaluation period
4. View detected anomalies

**Expected Results:**
- ✅ Anomalies classified by severity (Low, Medium, High)
- ✅ Response patterns flagged (e.g., all 1s, all 5s)
- ✅ Suspicious responses highlighted
- ✅ Instructor/course details shown
- ✅ Filter by severity works

### 7. Course Management Testing

**Steps:**
1. Login as Admin
2. Navigate to Course Management
3. Test CRUD operations:
   - **Create:** Add new course with code, name, program
   - **Read:** View course list with filters
   - **Update:** Edit course details
   - **Delete:** Remove course (soft delete)
4. Test bulk import via CSV
5. Test export functionality

**Expected Results:**
- ✅ Course codes unique per program
- ✅ Bulk import creates multiple courses
- ✅ Filters work (program, year level, status)
- ✅ Search finds courses by code/name
- ✅ Export generates CSV/Excel

### 8. User Management Testing

**Steps:**
1. Login as Admin
2. Navigate to User Management
3. Test operations:
   - Create new user (all roles)
   - Edit user details
   - Change user role
   - Deactivate user
   - Reset password
4. View Program Sections tab
5. Create/edit program sections

**Expected Results:**
- ✅ Email validation enforced
- ✅ Role-based field requirements (e.g., program for dept head)
- ✅ Deactivated users cannot login
- ✅ Password reset generates new password
- ✅ Program sections auto-enroll students

---

## 🔗 API Endpoints Reference

### Authentication
```
POST /api/auth/login
Body: { "email": "string", "password": "string" }
Response: { "access_token": "jwt_token", "user": {...} }

GET /api/auth/me
Headers: { "Authorization": "Bearer {token}" }
Response: { "id": 1, "email": "...", "role": "..." }
```

### Student Operations
```
GET /api/students/courses
GET /api/students/submit-evaluation
POST /api/students/submit-evaluation
Body: { "course_id": 1, "responses": [...], "comments": "..." }
```

### Admin Operations
```
GET /api/admin/dashboard-stats
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/{id}
DELETE /api/admin/users/{id}

GET /api/admin/courses
POST /api/admin/courses/bulk-import
FormData: { "file": enrollment_list.csv }

GET /api/admin/evaluation-periods
POST /api/admin/evaluation-periods
PUT /api/admin/evaluation-periods/{id}
```

### Staff Operations (Dept Head / Secretary)
```
GET /api/staff/evaluation-periods
GET /api/staff/sentiment-analysis?period_id=1&program=BSIT
GET /api/staff/anomaly-detection?period_id=1
GET /api/staff/non-respondents?period_id=1
```

---

## ✅ Expected Behaviors

### Security
- ✅ JWT token expires after 24 hours
- ✅ Passwords hashed with bcrypt
- ✅ Role-based access control enforced
- ✅ SQL injection protection (SQLAlchemy)
- ✅ CORS configured for localhost

### Data Validation
- ✅ Email format validation
- ✅ Required field validation
- ✅ Unique constraints (student_number, email)
- ✅ Date range validation (evaluation periods)
- ✅ File type validation (CSV only)

### UI/UX
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states during API calls
- ✅ Error messages displayed clearly
- ✅ Success notifications
- ✅ Confirmation modals for destructive actions

### Machine Learning
- ✅ SVM model auto-loads on server start
- ✅ Sentiment analysis runs on evaluation submit
- ✅ DBSCAN detects patterns in real-time
- ✅ ML results cached for performance
- ✅ Fallback to manual review if ML fails

---

## ⚠️ Common Issues & Solutions

### Issue 1: CSV Import Fails
**Symptom:** Error "Invalid CSV format"  
**Solution:**
- Ensure CSV has exact column headers (see template)
- Check for extra commas or quotes
- Verify encoding is UTF-8
- Remove empty rows at end of file

### Issue 2: Students Cannot Login
**Symptom:** "Invalid credentials" after import  
**Solution:**
- Default password is `password123`
- Email must match CSV exactly
- Check if user is active (not deactivated)
- Verify student was imported successfully

### Issue 3: Evaluation Form Won't Submit
**Symptom:** Submit button disabled or error  
**Solution:**
- Ensure all 31 questions answered
- Check if evaluation period is active
- Verify student is enrolled in course
- Check if already submitted evaluation

### Issue 4: Sentiment Analysis Shows No Data
**Symptom:** Empty charts/tables  
**Solution:**
- Verify evaluations exist for selected period
- Check if ML models trained (run `train_ml_models.py`)
- Ensure comments contain text (not just ratings)
- Check console for API errors

### Issue 5: Anomaly Detection Not Working
**Symptom:** No anomalies detected  
**Solution:**
- Requires at least 10 evaluations for DBSCAN
- Check if responses have variation (not all same)
- Verify ML service running
- Check server logs for sklearn errors

---

## 📊 Test Data Generation (For Claude AI)

### Prompt for Claude to Generate Test Users

```
Generate a CSV file with 50 test students for the LPU Course Feedback System using this format:

student_number,first_name,last_name,middle_name,email,program_code,year_level,college_code,college_name

Requirements:
1. Use realistic Filipino names (first_name, last_name, middle_name)
2. Student numbers: Format YYYY-XXXXX (e.g., 2022-00001 to 2022-00050)
3. Email: first initial + last name @lpulaguna.edu.ph (lowercase, no spaces)
4. Programs: Distribute across BSIT (15), BSCS-DS (15), BSPSY (10), ABCOMM (10)
5. Year levels: Distribute evenly (1-4)
6. College codes:
   - BSIT, BSCS-DS → CCAS (College of Computer and Applied Sciences)
   - BSPSY → CAS (College of Arts and Sciences)
   - ABCOMM → CCSEAS (College of Communication and Social and Educational Applied Sciences)
7. No duplicate emails or student numbers

Generate the complete CSV ready for import.
```

### Prompt for Claude to Generate Test Courses

```
Generate a CSV file with 20 test courses for LPU using this format:

course_code,course_name,program_code,year_level,semester,units,instructor_email

Requirements:
1. Course codes: Follow pattern PROGRAM + NUMBER (e.g., BSIT101, BSCS201)
2. Course names: Realistic IT/CS/Psychology/Communication courses
3. Programs: BSIT, BSCS-DS, BSPSY, ABCOMM
4. Year levels: 1-4
5. Semester: 1st Semester, 2nd Semester, Summer
6. Units: 3 or 6
7. Instructor email: instructor1@lpu.edu.ph to instructor10@lpu.edu.ph

Generate the complete CSV ready for import.
```

---

## 🎯 Success Criteria

After completing all test scenarios, verify:

- ✅ All user roles can login and access appropriate pages
- ✅ Students can submit evaluations with 31 questions
- ✅ CSV import creates users/courses correctly
- ✅ Sentiment analysis displays results
- ✅ Anomaly detection flags suspicious responses
- ✅ Admin can manage users, courses, evaluation periods
- ✅ Role-based access control works
- ✅ ML models process evaluations automatically
- ✅ UI is responsive and user-friendly
- ✅ Error handling provides clear messages

---

## 📞 Support

**Developer:** Jose Iturralde  
**Institution:** Lyceum of the Philippines University - Batangas  
**Repository:** https://github.com/Haacchhii/CourseFeedback  
**Branch:** `main`

---

**Last Updated:** December 8, 2025  
**Document Version:** 1.0
