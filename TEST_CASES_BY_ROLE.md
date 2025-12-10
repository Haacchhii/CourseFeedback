# 🧪 TEST CASES BY ROLE - Course Insight Guardian System

**Document Version**: 1.0  
**Date Created**: December 10, 2025  
**System Version**: Course Insight Guardian v1.0

---

## Table of Contents
1. [Admin Role Test Cases](#admin-role-test-cases)
2. [Staff Role Test Cases (Secretary & Department Head)](#staff-role-test-cases)
3. [Student Role Test Cases](#student-role-test-cases)
4. [Cross-Role Test Cases](#cross-role-test-cases)

---

## ADMIN ROLE TEST CASES

### 1. Authentication & Login

#### TC-ADMIN-001: Admin Login with Valid Credentials
**Preconditions**: Admin account exists  
**Test Data**: Email: `admin@lpu.edu.ph`, Password: `admin123`  
**Steps**:
1. Navigate to login page
2. Enter admin email and password
3. Click "Sign In"

**Expected Result**: 
- Login successful
- Redirected to `/admin/dashboard`
- User role displays as "Admin"

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-002: Admin Login with Invalid Credentials
**Preconditions**: None  
**Test Data**: Email: `admin@lpu.edu.ph`, Password: `wrongpassword`  
**Steps**:
1. Navigate to login page
2. Enter admin email and incorrect password
3. Click "Sign In"

**Expected Result**: 
- Login fails
- Error message: "Invalid email or password"
- User remains on login page

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-003: Admin First-Time Login Password Change
**Preconditions**: New admin account created with temporary password  
**Test Data**: Email: `newadmin@lpu.edu.ph`, Temp Password: `lpub@12345`  
**Steps**:
1. Login with temporary password
2. System prompts for password change
3. Enter current password and new password (min 8 characters)
4. Submit password change

**Expected Result**: 
- Password change modal appears
- New password accepted
- Redirected to admin dashboard
- Can login with new password

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 2. User Management

#### TC-ADMIN-004: Create New Student User
**Preconditions**: Admin logged in, at least one program exists  
**Test Data**: 
- Email: `jdoe@lpulaguna.edu.ph`
- Name: `John Doe`
- School ID: `23140123`
- Program: `BSIT`
- Year Level: `2`

**Steps**:
1. Navigate to "User Management"
2. Click "Add User" button
3. Fill in student details
4. Select role: "Student"
5. Click "Create User"

**Expected Result**: 
- User created successfully
- Auto-generated password: `lpub@23140123`
- Welcome email sent to `jdoe@lpulaguna.edu.ph`
- User appears in user list
- Student record created in database

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-005: Create Staff User (Secretary)
**Preconditions**: Admin logged in  
**Test Data**: 
- Email: `secretary1@lpu.edu.ph`
- Name: `Maria Santos`
- Role: `Secretary`
- Department: `Computer Science`
- Assigned Programs: `All Programs`

**Steps**:
1. Navigate to "User Management"
2. Click "Add User"
3. Fill in secretary details
4. Select role: "Secretary"
5. Assign programs
6. Click "Create User"

**Expected Result**: 
- Secretary account created
- Secretary record created with all programs assigned
- Can access staff dashboard features
- Welcome email sent

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-006: Create Department Head User
**Preconditions**: Admin logged in  
**Test Data**: 
- Email: `depthead@lpu.edu.ph`
- Name: `Dr. Robert Cruz`
- Role: `Department Head`
- Department: `Information Technology`
- Assigned Programs: `BSIT, BSCS`

**Steps**:
1. Navigate to "User Management"
2. Click "Add User"
3. Fill in department head details
4. Select role: "Department Head"
5. Select assigned programs
6. Click "Create User"

**Expected Result**: 
- Department head account created
- Department head record created with selected programs
- Can access staff dashboard
- Programs correctly assigned

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-007: Edit User Information
**Preconditions**: User exists in system  
**Test Data**: Change student's year level from 2 to 3  
**Steps**:
1. Navigate to "User Management"
2. Search for user
3. Click "Edit" button
4. Modify year level
5. Click "Update User"

**Expected Result**: 
- User information updated
- Changes reflected in user list
- Database updated correctly
- Audit log entry created

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-008: Soft Delete User
**Preconditions**: Active user exists  
**Test Data**: Any student user  
**Steps**:
1. Navigate to "User Management"
2. Find user to delete
3. Click "Delete" button (trash icon)
4. Confirm deletion in modal

**Expected Result**: 
- User status changed to "Inactive"
- User cannot login
- Historical data preserved (evaluations, enrollments)
- User still appears in list with "Inactive" status

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-009: Force Delete User
**Preconditions**: User exists in system  
**Test Data**: Test student account  
**Steps**:
1. Navigate to "User Management"
2. Find user to delete
3. Click "Force Delete" button (red warning icon)
4. Read warning message
5. Confirm permanent deletion

**Expected Result**: 
- User permanently removed from database
- All related data deleted (student record, enrollments, evaluations)
- User no longer appears in list
- Action cannot be undone

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-010: Reset User Password
**Preconditions**: User account exists  
**Test Data**: Student email: `student@lpulaguna.edu.ph`  
**Steps**:
1. Navigate to "User Management"
2. Find user
3. Click "Reset Password" button
4. Enter new password
5. Confirm reset

**Expected Result**: 
- Password reset successfully
- User can login with new password
- Password reset email sent (if configured)
- Old password no longer works

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-011: Bulk Import Users via CSV
**Preconditions**: CSV file prepared with correct format  
**Test Data**: CSV with 5 students  
**Steps**:
1. Navigate to "User Management"
2. Click "Import CSV" button
3. Select CSV file
4. Review import preview
5. Confirm import

**Expected Result**: 
- All 5 users created successfully
- Auto-generated passwords assigned
- Welcome emails sent to all
- Users appear in user list
- Error report shows any failures

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-012: Search and Filter Users
**Preconditions**: Multiple users in system  
**Test Data**: 
- Search: "John"
- Filter by Role: "Student"
- Filter by Program: "BSIT"

**Steps**:
1. Navigate to "User Management"
2. Enter search term
3. Apply role filter
4. Apply program filter

**Expected Result**: 
- Only matching users displayed
- Pagination works correctly
- Filters combine properly (AND logic)
- Results update in real-time

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 3. Evaluation Period Management

#### TC-ADMIN-013: Create Evaluation Period
**Preconditions**: Admin logged in  
**Test Data**: 
- Name: "Midterm 2024-2025"
- Start Date: "2024-10-01"
- End Date: "2024-10-15"
- Status: "Open"

**Steps**:
1. Navigate to "Evaluation Periods"
2. Click "Create Period"
3. Fill in period details
4. Click "Create"

**Expected Result**: 
- Period created successfully
- Appears in period list
- Status is "Open"
- Students can see courses for this period

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-014: Update Period Status to Active
**Preconditions**: Period exists with status "Open"  
**Test Data**: Existing period  
**Steps**:
1. Navigate to "Evaluation Periods"
2. Find period
3. Click "Activate" button
4. Confirm activation

**Expected Result**: 
- Period status changes to "Active"
- Students can submit evaluations
- Period highlighted as current
- Only one active period allowed

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-015: Close Evaluation Period
**Preconditions**: Active evaluation period exists  
**Test Data**: Active period  
**Steps**:
1. Navigate to "Evaluation Periods"
2. Find active period
3. Click "Close" button
4. Confirm closure

**Expected Result**: 
- Period status changes to "Closed"
- Students can no longer submit evaluations
- Results become available for viewing
- Completion statistics finalized

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-016: Delete Evaluation Period
**Preconditions**: Evaluation period exists with no enrollments  
**Test Data**: Empty period  
**Steps**:
1. Navigate to "Evaluation Periods"
2. Find period without enrollments
3. Click "Delete" button
4. Confirm deletion

**Expected Result**: 
- Period deleted successfully
- Removed from list
- Cannot delete period with existing evaluations

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 4. Course Management

#### TC-ADMIN-017: Create New Course Manually
**Preconditions**: Admin logged in, program exists  
**Test Data**: 
- Subject Code: "CS101"
- Subject Name: "Introduction to Programming"
- Program: "BSIT"
- Year Level: "1"
- Semester: "1st Semester"

**Steps**:
1. Navigate to "Course Management"
2. Click "Add Course"
3. Fill in course details
4. Click "Create Course"

**Expected Result**: 
- Course created successfully
- Appears in course list
- Associated with correct program
- Can be assigned to class sections

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-018: Bulk Import Courses via CSV
**Preconditions**: CSV file with course data prepared  
**Test Data**: CSV with 10 courses  
**Steps**:
1. Navigate to "Course Management"
2. Click "Import Courses"
3. Select CSV file
4. Review preview
5. Confirm import

**Expected Result**: 
- All 10 courses imported
- Validation errors shown for invalid data
- Duplicate prevention works
- Success/error summary displayed

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-019: Edit Course Information
**Preconditions**: Course exists  
**Test Data**: Change semester from "1st" to "2nd"  
**Steps**:
1. Navigate to "Course Management"
2. Find course
3. Click "Edit"
4. Modify semester
5. Save changes

**Expected Result**: 
- Course updated successfully
- Changes reflected in course list
- Class sections inherit changes
- Database updated

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-020: Delete Course
**Preconditions**: Course with no evaluations exists  
**Test Data**: Course without enrollments  
**Steps**:
1. Navigate to "Course Management"
2. Find course
3. Click "Delete"
4. Confirm deletion

**Expected Result**: 
- Course deleted successfully
- Removed from list
- Cannot delete if evaluations exist
- Related sections also deleted

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 5. Enrollment Management

#### TC-ADMIN-021: Create Enrollment List for Period
**Preconditions**: Active period exists, students and sections exist  
**Test Data**: Evaluation period, section BSIT-2A  
**Steps**:
1. Navigate to "Enrollment List"
2. Select evaluation period
3. Select program section
4. Select courses
5. Add students to enrollment
6. Save enrollment

**Expected Result**: 
- Students enrolled in selected courses
- Enrollment tied to evaluation period
- Students can see courses in their list
- Enrollment status "Active"

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-022: Bulk Enrollment via CSV
**Preconditions**: CSV file with enrollment data  
**Test Data**: CSV with student IDs, section IDs, period ID  
**Steps**:
1. Navigate to "Enrollment List"
2. Click "Import Enrollments"
3. Select CSV file
4. Map columns
5. Confirm import

**Expected Result**: 
- Enrollments created for all valid entries
- Validation errors shown
- Duplicate enrollments prevented
- Success/error report displayed

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 6. Student Advancement

#### TC-ADMIN-023: Advance Students to Next Year Level
**Preconditions**: Students exist in year level 1-3  
**Test Data**: All BSIT Year 2 students  
**Steps**:
1. Navigate to "Student Management"
2. Select program: "BSIT"
3. Select current year: "2"
4. Click "Advance Students"
5. Confirm advancement

**Expected Result**: 
- All Year 2 students promoted to Year 3
- Year 4 students graduate (status changes)
- Student records updated
- Audit log created

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 7. Program Section Management

#### TC-ADMIN-024: Create Program Section
**Preconditions**: Program exists  
**Test Data**: 
- Program: "BSIT"
- Year Level: "2"
- Section: "A"
- Name: "BSIT-2A"

**Steps**:
1. Navigate to "Program Sections" tab
2. Click "Add Section"
3. Fill in details
4. Save section

**Expected Result**: 
- Program section created
- Appears in section list
- Can be used for enrollments
- Students can be assigned

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-025: Assign Students to Program Section
**Preconditions**: Program section exists, students exist  
**Test Data**: BSIT-2A section, 5 students  
**Steps**:
1. Navigate to "Program Sections"
2. Select section BSIT-2A
3. Click "Assign Students"
4. Select 5 students
5. Save assignment

**Expected Result**: 
- Students assigned to section
- Appears in section student list
- Students see section in profile
- Enrollment uses section

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 8. Reports and Analytics

#### TC-ADMIN-026: View Admin Dashboard Statistics
**Preconditions**: System has data (users, evaluations, courses)  
**Steps**:
1. Login as admin
2. Navigate to Admin Dashboard

**Expected Result**: 
- Total users displayed correctly
- Active evaluations count shown
- Completion rate calculated
- Charts render correctly
- Recent activity shown

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-027: Export Evaluation Data
**Preconditions**: Evaluations exist in system  
**Test Data**: Export format: CSV  
**Steps**:
1. Navigate to "Data Export"
2. Select "Evaluations"
3. Choose date range
4. Select CSV format
5. Click "Export"

**Expected Result**: 
- CSV file downloads
- Contains all evaluation data
- Export history logged
- File format correct

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-ADMIN-028: View Audit Logs
**Preconditions**: System activities have occurred  
**Steps**:
1. Navigate to "Audit Logs"
2. View log entries
3. Filter by date
4. Search by user

**Expected Result**: 
- All admin actions logged
- Timestamps accurate
- User information shown
- Can filter and search logs

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

## STAFF ROLE TEST CASES

### 1. Authentication & Login

#### TC-STAFF-001: Secretary Login
**Preconditions**: Secretary account exists  
**Test Data**: Email: `secretary@lpu.edu.ph`, Password: `secretary123`  
**Steps**:
1. Navigate to login page
2. Enter secretary credentials
3. Click "Sign In"

**Expected Result**: 
- Login successful
- Redirected to `/dashboard` (staff dashboard)
- User role displays as "Secretary"
- Navigation shows staff menu items

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STAFF-002: Department Head Login
**Preconditions**: Department head account exists  
**Test Data**: Email: `depthead@lpu.edu.ph`, Password: `depthead123`  
**Steps**:
1. Navigate to login page
2. Enter department head credentials
3. Click "Sign In"

**Expected Result**: 
- Login successful
- Redirected to `/dashboard`
- User role displays as "Department Head"
- Same features as secretary

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 2. Dashboard & Analytics

#### TC-STAFF-003: View Staff Dashboard
**Preconditions**: Staff logged in, active period exists  
**Steps**:
1. Login as secretary/dept head
2. Navigate to Dashboard

**Expected Result**: 
- Total courses displayed
- Total sections shown
- Total evaluations count
- Participation rate calculated
- Sentiment distribution chart
- Anomaly count shown
- Filter by evaluation period works

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STAFF-004: Filter Dashboard by Evaluation Period
**Preconditions**: Multiple evaluation periods exist  
**Test Data**: Select "Midterm 2024-2025"  
**Steps**:
1. Navigate to Dashboard
2. Select period from dropdown
3. View updated statistics

**Expected Result**: 
- Dashboard data filtered to selected period
- Statistics recalculated
- Charts update accordingly
- Period name displayed

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 3. Course Management

#### TC-STAFF-005: View Courses List
**Preconditions**: Staff logged in, courses exist  
**Steps**:
1. Navigate to "Courses"
2. View course list

**Expected Result**: 
- All courses displayed
- Course details shown (code, name, program)
- Evaluation count shown
- Average rating displayed
- Can filter by program/year level

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STAFF-006: View Course Details and Evaluations
**Preconditions**: Course with evaluations exists  
**Test Data**: Course: "CS101"  
**Steps**:
1. Navigate to "Courses"
2. Click on course name
3. View course details

**Expected Result**: 
- Course information displayed
- All sections shown
- Evaluation count per section
- Average ratings per section
- Sentiment distribution
- Category analysis shown

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STAFF-007: Filter Courses by Program
**Preconditions**: Courses from multiple programs exist  
**Test Data**: Filter: "BSIT"  
**Steps**:
1. Navigate to "Courses"
2. Select program filter "BSIT"
3. View filtered results

**Expected Result**: 
- Only BSIT courses shown
- Course count updates
- Other filters still work
- Can clear filter

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 4. Evaluation Management

#### TC-STAFF-008: View All Evaluations
**Preconditions**: Staff logged in, evaluations exist  
**Steps**:
1. Navigate to "Evaluations"
2. View evaluation list

**Expected Result**: 
- All evaluations displayed
- Student name shown
- Course/section shown
- Submission date shown
- Rating shown
- Sentiment displayed
- Pagination works

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STAFF-009: View Evaluation Details
**Preconditions**: Evaluation exists  
**Test Data**: Any submitted evaluation  
**Steps**:
1. Navigate to "Evaluations"
2. Click on evaluation
3. View full details

**Expected Result**: 
- All 31 questions shown
- Individual ratings displayed
- Comments shown
- Category breakdown
- Sentiment analysis
- Student info (anonymous/ID)

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STAFF-010: Filter Evaluations by Sentiment
**Preconditions**: Evaluations with different sentiments exist  
**Test Data**: Filter: "Negative"  
**Steps**:
1. Navigate to "Evaluations"
2. Select sentiment filter "Negative"
3. View results

**Expected Result**: 
- Only negative evaluations shown
- Count updates
- Can combine with other filters
- Sentiment badge shows correctly

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STAFF-011: Filter Evaluations by Course
**Preconditions**: Multiple courses with evaluations  
**Test Data**: Course: "CS101"  
**Steps**:
1. Navigate to "Evaluations"
2. Select course filter
3. View filtered evaluations

**Expected Result**: 
- Only evaluations for selected course
- All sections of course included
- Statistics recalculated
- Can clear filter

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 5. Sentiment & Anomaly Analysis

#### TC-STAFF-012: View Sentiment Analysis Dashboard
**Preconditions**: Staff logged in, evaluations with ML analysis exist  
**Steps**:
1. Navigate to "Sentiment & Anomalies"
2. View analysis dashboard

**Expected Result**: 
- Overall sentiment distribution shown
- Positive/Neutral/Negative counts
- ML confidence scores displayed
- Sentiment trends over time
- Top positive/negative courses

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STAFF-013: View Anomaly Detection Results
**Preconditions**: Anomalies detected in system  
**Steps**:
1. Navigate to "Sentiment & Anomalies"
2. View anomaly list

**Expected Result**: 
- Anomalous evaluations flagged
- Anomaly type shown
- Course/instructor identified
- Can drill down for details
- Filter by anomaly type

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 6. Non-Respondent Tracking

#### TC-STAFF-014: View Non-Respondents List
**Preconditions**: Active period with incomplete evaluations  
**Steps**:
1. Navigate to "Non-Respondents"
2. View student list

**Expected Result**: 
- Students who haven't evaluated shown
- Course they need to evaluate listed
- Enrollment details shown
- Period end date warning
- Can filter by program/section

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 7. Report Generation

#### TC-STAFF-015: Generate Evaluation Summary Report
**Preconditions**: Staff logged in, evaluation data exists  
**Test Data**: Period: "Midterm 2024-2025"  
**Steps**:
1. Navigate to Reports
2. Select "Evaluation Summary"
3. Choose period
4. Generate report

**Expected Result**: 
- Report generated successfully
- Summary statistics shown
- Completion rates
- Sentiment breakdown
- Program-wise analysis
- Can export as PDF/CSV

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 8. Access Control

#### TC-STAFF-016: Secretary Cannot Access Admin Features
**Preconditions**: Secretary logged in  
**Steps**:
1. Try to access `/admin/users`
2. Try to access `/admin/periods`

**Expected Result**: 
- Access denied
- Redirected to dashboard
- Error message shown
- Admin menu not visible

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STAFF-017: Department Head Same Permissions as Secretary
**Preconditions**: Dept head logged in  
**Steps**:
1. Navigate through all staff features
2. Compare with secretary access

**Expected Result**: 
- Can access all staff features
- Dashboard same as secretary
- Reports same as secretary
- Course management same
- No admin features accessible

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

## STUDENT ROLE TEST CASES

### 1. Authentication & Login

#### TC-STUDENT-001: Student Login with Valid Credentials
**Preconditions**: Student account exists  
**Test Data**: Email: `jdoe@lpulaguna.edu.ph`, Password: `student123`  
**Steps**:
1. Navigate to login page
2. Enter student credentials
3. Click "Sign In"

**Expected Result**: 
- Login successful
- Redirected to `/student/courses`
- Student name displayed
- Program and year level shown

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-002: Student First-Time Login
**Preconditions**: New student account with temp password  
**Test Data**: Email: `newstudent@lpulaguna.edu.ph`, Password: `lpub@23140456`  
**Steps**:
1. Login with temporary password
2. Password change prompt appears
3. Enter new password
4. Confirm new password
5. Submit

**Expected Result**: 
- Password change required
- New password accepted
- Redirected to courses page
- Can login with new password

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 2. Course Viewing

#### TC-STUDENT-003: View Enrolled Courses
**Preconditions**: Student enrolled in courses, active period exists  
**Steps**:
1. Login as student
2. View "My Courses" page

**Expected Result**: 
- All enrolled courses displayed
- Course code and name shown
- Instructor name displayed
- Section shown
- Semester shown
- Evaluation status (Pending/Evaluated) shown
- Active period courses only

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-004: View Course with No Active Period
**Preconditions**: Student enrolled but no active period  
**Steps**:
1. Login as student
2. View "My Courses" page

**Expected Result**: 
- Message: "No courses available for evaluation"
- Empty course list OR only closed period courses
- Evaluation history still accessible
- No "Evaluate" buttons

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-005: Filter Courses by Semester
**Preconditions**: Student has courses in multiple semesters  
**Test Data**: Filter: "1st Semester"  
**Steps**:
1. Navigate to "My Courses"
2. Select semester filter
3. View filtered courses

**Expected Result**: 
- Only 1st semester courses shown
- Course count updates
- Evaluation status preserved
- Can clear filter

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 3. Evaluation Submission

#### TC-STUDENT-006: Submit Course Evaluation (First Time)
**Preconditions**: 
- Student enrolled in course
- Active evaluation period
- Not yet evaluated

**Test Data**: Course: "CS101 - Introduction to Programming"  
**Steps**:
1. Navigate to "My Courses"
2. Click "Evaluate Now" button
3. Read instructions
4. Rate all 31 questions (1-4 scale)
5. Enter comments (optional)
6. Click "Submit Evaluation"
7. Confirm submission

**Expected Result**: 
- All questions answered
- Submission successful
- Confirmation message shown
- Redirected to courses page
- Course shows "Evaluated" status
- Timestamp recorded
- ML sentiment analysis performed
- Cannot submit again

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-007: Attempt to Submit Incomplete Evaluation
**Preconditions**: Student on evaluation form  
**Test Data**: Answer only 20 out of 31 questions  
**Steps**:
1. Start evaluation
2. Answer some questions
3. Leave others blank
4. Click "Submit"

**Expected Result**: 
- Validation error
- Message: "Please answer all questions"
- Unanswered questions highlighted
- Cannot submit until all answered
- Partial progress saved (if implemented)

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-008: Submit Evaluation with Low Ratings
**Preconditions**: Student on evaluation form  
**Test Data**: Rate most questions as 1 (Poor)  
**Steps**:
1. Start evaluation
2. Rate questions with low scores
3. Add comment explaining issues
4. Submit evaluation

**Expected Result**: 
- Submission successful
- Sentiment classified as "Negative"
- Anomaly detection triggered (if very low)
- Comment stored
- No error messages

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-009: Submit Evaluation with High Ratings
**Preconditions**: Student on evaluation form  
**Test Data**: Rate most questions as 4 (Excellent)  
**Steps**:
1. Start evaluation
2. Rate questions with high scores
3. Add positive comment
4. Submit evaluation

**Expected Result**: 
- Submission successful
- Sentiment classified as "Positive"
- Average rating calculated correctly
- Comment stored

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-010: Attempt Duplicate Evaluation Submission
**Preconditions**: Student already evaluated course in current period  
**Steps**:
1. Try to access evaluation form for evaluated course
2. Or click "Evaluate Now" again

**Expected Result**: 
- Prevented from accessing form
- Message: "You have already evaluated this course"
- Redirected to courses page
- Status remains "Evaluated"

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-011: Submit Evaluation with Comments
**Preconditions**: Student on evaluation form  
**Test Data**: 
- Ratings: mixed
- Comment: "Great instructor, clear explanations"

**Steps**:
1. Complete evaluation
2. Enter detailed comment
3. Submit

**Expected Result**: 
- Comment saved correctly
- Character limit enforced (if any)
- Comment appears in evaluation details (for staff)
- ML sentiment analysis includes comment

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-012: Submit Evaluation Near Period End
**Preconditions**: Evaluation period ends in 1 day  
**Steps**:
1. Login as student
2. View courses page
3. Note warning message
4. Submit evaluation

**Expected Result**: 
- Warning message shown: "Period ending soon"
- End date displayed prominently
- Can still submit
- Submission successful

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-013: Attempt Evaluation After Period Closed
**Preconditions**: Evaluation period status changed to "Closed"  
**Steps**:
1. Login as student
2. Try to access evaluation form

**Expected Result**: 
- Cannot access evaluation form
- Message: "Evaluation period has ended"
- Courses no longer show "Evaluate" button
- Past evaluations still viewable

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 4. Evaluation History

#### TC-STUDENT-014: View Evaluation History
**Preconditions**: Student has submitted evaluations  
**Steps**:
1. Login as student
2. Navigate to "My Courses"
3. Scroll to "Evaluation History" section

**Expected Result**: 
- All past evaluations shown
- Course name displayed
- Evaluation period shown
- Submission date shown
- Average rating shown
- Sentiment displayed
- Sorted by date (newest first)

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-015: Filter History by Evaluation Period
**Preconditions**: Student has evaluations in multiple periods  
**Test Data**: Select "Midterm 2024-2025"  
**Steps**:
1. View evaluation history
2. Select period filter
3. View filtered history

**Expected Result**: 
- Only evaluations from selected period shown
- Period name displayed
- Can view all periods
- Count updates

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 5. Access Control

#### TC-STUDENT-016: Student Cannot Access Admin Features
**Preconditions**: Student logged in  
**Steps**:
1. Try to access `/admin/dashboard`
2. Try to access `/admin/users`

**Expected Result**: 
- Access denied (403 error)
- Redirected to student courses page
- Error message shown
- Admin menu not visible

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-017: Student Cannot Access Staff Features
**Preconditions**: Student logged in  
**Steps**:
1. Try to access `/dashboard` (staff dashboard)
2. Try to access `/courses` (staff courses)

**Expected Result**: 
- Access denied
- Redirected to student courses
- Staff menu not visible
- Cannot view other students' data

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-STUDENT-018: Student Cannot View Other Students' Courses
**Preconditions**: Two student accounts exist  
**Test Data**: Student A ID: 1, Student B ID: 2  
**Steps**:
1. Login as Student A
2. Try to access `/student/2/courses` via URL

**Expected Result**: 
- Access denied (403 error)
- Message: "You can only access your own data"
- Redirected or error shown
- Cannot see other student's enrollments

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 6. Anonymous Feedback

#### TC-STUDENT-019: Verify Evaluation Anonymity
**Preconditions**: Student submitted evaluation  
**Steps**:
1. Submit evaluation as student
2. Login as staff/admin
3. View evaluation details

**Expected Result**: 
- Student name not visible to staff
- Only student ID shown (if any)
- Cannot trace back to specific student
- Instructors cannot see who rated them
- System maintains traceability (backend only)

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

## CROSS-ROLE TEST CASES

### 1. Authentication

#### TC-CROSS-001: Password Reset Flow
**Preconditions**: User account exists  
**Test Data**: Email: `user@lpu.edu.ph`  
**Steps**:
1. Click "Forgot Password"
2. Enter email
3. Check email for reset link
4. Click link
5. Enter new password
6. Login with new password

**Expected Result**: 
- Reset email sent
- Link valid for limited time
- Password updated
- Can login with new password
- Old password invalid

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-CROSS-002: Session Timeout
**Preconditions**: User logged in  
**Steps**:
1. Login to system
2. Leave idle for extended period
3. Try to perform action

**Expected Result**: 
- Session expires after timeout
- Redirected to login page
- Message: "Session expired"
- Must login again

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-CROSS-003: Concurrent Login Sessions
**Preconditions**: User account exists  
**Steps**:
1. Login from Browser A
2. Login from Browser B (same user)
3. Perform actions in both

**Expected Result**: 
- Both sessions work OR
- Second login invalidates first OR
- Warning about multiple sessions
- Behavior documented

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 2. Data Integrity

#### TC-CROSS-004: Enrollment Period Consistency
**Preconditions**: Active period, student enrolled  
**Test Data**: Close active period  
**Steps**:
1. Student enrolled in active period
2. Admin closes period
3. Student tries to evaluate

**Expected Result**: 
- Courses no longer available for evaluation
- Existing evaluations preserved
- Status updates immediately
- No data loss

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

#### TC-CROSS-005: Course Deletion with Evaluations
**Preconditions**: Course with evaluations exists  
**Steps**:
1. Admin tries to delete course with evaluations
2. System prevents deletion

**Expected Result**: 
- Deletion prevented
- Error message: "Cannot delete course with evaluations"
- Evaluations preserved
- Course remains in system

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 3. Performance

#### TC-CROSS-006: Large Dataset Performance
**Preconditions**: 1000+ students, 100+ courses, 5000+ evaluations  
**Steps**:
1. Login as admin
2. View dashboard
3. Navigate to user management
4. Search and filter users

**Expected Result**: 
- Page loads within 3 seconds
- Pagination works smoothly
- Filters apply quickly
- No crashes or errors
- Database queries optimized

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

### 4. Reporting

#### TC-CROSS-007: Export Data Accuracy
**Preconditions**: Evaluations exist  
**Steps**:
1. Admin exports evaluation data
2. Compare export with database
3. Verify all fields present

**Expected Result**: 
- All data exported correctly
- No data loss
- Format correct (CSV/JSON)
- Timestamps accurate
- Special characters handled

**Status**: ☐ Pass ☐ Fail  
**Notes**: _________________________

---

## TEST EXECUTION SUMMARY

### Statistics
- **Total Test Cases**: 89+
- **Admin Test Cases**: 28
- **Staff Test Cases**: 17
- **Student Test Cases**: 19
- **Cross-Role Test Cases**: 7

### Test Coverage
- ✅ Authentication & Login
- ✅ User Management
- ✅ Evaluation Period Management
- ✅ Course Management
- ✅ Enrollment Management
- ✅ Evaluation Submission
- ✅ Dashboard & Analytics
- ✅ Sentiment Analysis
- ✅ Report Generation
- ✅ Access Control
- ✅ Data Integrity

---

## Notes for Testing

### Test Environment Setup
1. Fresh database with sample data
2. At least one user per role
3. Active evaluation period
4. Enrolled students in courses
5. Some completed evaluations

### Test Data Requirements
- 3-5 users per role
- 10+ courses across multiple programs
- 20+ students
- 2+ evaluation periods
- 50+ evaluations

### Recommended Testing Order
1. Start with Admin tests (setup)
2. Create test data via admin features
3. Test Staff features
4. Test Student features
5. Test Cross-role scenarios

### Critical Test Cases (Must Pass)
- TC-ADMIN-004: Create Student User
- TC-ADMIN-013: Create Evaluation Period
- TC-STUDENT-006: Submit Evaluation
- TC-STAFF-003: View Dashboard
- TC-CROSS-004: Enrollment Period Consistency

---

**Document End**
