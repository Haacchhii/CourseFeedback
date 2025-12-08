# Appendix I: User's Manual

## Course Insight Guardian - Instructor and Course Evaluation System

---

## Introduction

The **Course Insight Guardian** is a web-based evaluation system developed for Lyceum of the Philippines University - Batangas. This platform enables students to evaluate their courses and instructors, providing valuable feedback for continuous improvement of academic programs and teaching quality.

The system replaces traditional paper-based evaluation forms with a secure, efficient, and anonymous digital platform. It allows students to submit feedback conveniently, while providing administrators and academic staff with real-time analytics and comprehensive reports to support data-driven decision-making.

### Key Features
- **Anonymous Student Evaluations**: Students can evaluate courses and instructors securely and anonymously
- **Role-Based Access Control**: Customized interfaces for System Admins, Department Heads, Secretaries, Instructors, and Students
- **Evaluation Period Management**: Schedule and control when evaluations are open or closed
- **Real-Time Analytics Dashboard**: View completion rates, participation statistics, and trends
- **Bulk User Import**: Efficiently import multiple users via CSV files
- **Automated Email Notifications**: Welcome emails with login credentials sent automatically
- **Comprehensive Reporting**: Generate detailed reports by department, course, or instructor
- **Audit Trail**: Complete system activity logs for compliance and security

---

## Intended Users

**System Administrator** – Manages all users, evaluation periods, courses, system settings, and generates system-wide reports.

**Department Head** – Views department-specific analytics, evaluation results, and instructor performance reports.

**Secretary** – Manages student enrollments, checks evaluation status, and provides administrative support.

**Instructor** – Views evaluation results for assigned courses after the evaluation period closes.

**Student** – Submits anonymous evaluations for enrolled courses during active evaluation periods.

---

## System Requirements

### Hardware Requirements

| Component | Minimum Specification |
|-----------|----------------------|
| Processor | Intel i3 / AMD Ryzen 3 or higher |
| Memory | 4 GB RAM or higher |
| Storage | 100 MB of free disk space |
| Display | 1366×768 resolution or higher |
| Internet | Stable connection (5 Mbps or higher) |

### Software Requirements

| Software | Minimum Version |
|----------|----------------|
| Web Browser | Google Chrome, Firefox, Edge, Safari (latest) |
| Operating System | Windows 10 / macOS 10.15 / Linux |
| Email | Valid @lpubatangas.edu.ph email address |

**Note**: The system is a web application and does not require installation. Simply access it through a web browser.

---

## Installation Guide

### Accessing the System

1. Open your preferred web browser (Google Chrome recommended).
2. Navigate to the website URL: **https://course-feedback-ochre.vercel.app**
3. Wait for the homepage to load.
4. You can now log in to your account or reset your password if needed.

**No Installation Required** – The system runs entirely in your web browser.

---

## Using the System

### 1. Login and Registration

#### To Log In
1. Navigate to https://course-feedback-ochre.vercel.app
2. Click the **"Login"** button on the homepage
3. Enter your registered **@lpubatangas.edu.ph** email address
4. Enter your password
5. Click **"Sign In"**

#### First-Time Login Process
If you are logging in for the first time:

1. **Receive Welcome Email**
   - Check your @lpubatangas.edu.ph email inbox
   - Look for subject: *"Welcome to Course Insight Guardian - Your Account is Ready!"*
   - Note your temporary password (format: `lpub@[student_number]` for students)

2. **Initial Login**
   - Go to the login page
   - Enter your email and temporary password
   - Click **"Sign In"**

3. **Change Password (Required)**
   - You will be automatically redirected to the password change page
   - Enter your current temporary password
   - Create a new password meeting these requirements:
     * Minimum 8 characters
     * At least one uppercase letter (A-Z)
     * At least one lowercase letter (a-z)
     * At least one number (0-9)
     * At least one special character (!@#$%^&*)
   - Confirm your new password
   - Click **"Change Password"**

4. **Login with New Password**
   - After password change, you will be returned to the login page
   - Log in with your email and new password
   - You will be directed to your role-specific dashboard

#### Forgot Password
If you forget your password:

1. Click **"Forgot Password?"** on the login page
2. Enter your registered @lpubatangas.edu.ph email address
3. Click **"Send Reset Link"**
4. Check your email for the password reset link
5. Click the reset link (valid for 1 hour)
6. Enter and confirm your new password
7. Click **"Reset Password"**
8. Return to the login page and sign in with your new credentials

---

## User Roles and Permissions

The system implements role-based access control to ensure appropriate access levels for different users.

### System Administrator
**Full system access and control**

**Permissions:**
- Create, edit, and delete all user accounts
- Manage evaluation periods (create, extend, close, reopen)
- Manage courses, programs, and class sections
- Enroll program sections in evaluation periods
- View all analytics, reports, and dashboards
- Configure system settings
- Access complete audit logs
- Export data and generate system-wide reports
- Force delete users and all related data

### Department Head
**Department-level management and reporting**

**Permissions:**
- View department-specific analytics and dashboards
- Access evaluation results for all courses in the department
- View instructor performance metrics
- Generate department reports
- Compare course evaluations across the department
- Monitor evaluation completion rates within department

### Secretary
**Administrative support and data management**

**Permissions:**
- Manage student enrollments in class sections
- View evaluation status and completion rates
- Support bulk import operations
- Generate enrollment and completion reports
- Verify student information
- Assist with evaluation period setup

### Instructor
**Course-level access to evaluation results**

**Permissions:**
- View assigned courses and class sections
- Access evaluation results for own courses (after period closes)
- View anonymous student feedback and ratings
- Generate course-specific reports
- Track evaluation completion rates per course
- Update personal profile information

**Note**: Instructors cannot see evaluation results while the period is active, ensuring student anonymity.

### Student
**Evaluation submission and personal profile management**

**Permissions:**
- View list of enrolled courses
- Submit anonymous evaluations during active periods
- View evaluation history (own submissions)
- Track evaluation deadlines
- Update personal profile and password
- View courses requiring evaluation

---

## 2. System Administrator Features

### Admin Dashboard
Upon login, the administrator dashboard displays:
- **Total Users**: Count of all active system users by role
- **Active Evaluations**: Number of ongoing evaluation submissions
- **Completion Rate**: Percentage of completed vs. pending evaluations
- **Recent Activity**: Latest system events and user actions
- **System Statistics**: Real-time insights and analytics

The navigation sidebar provides quick access to:
- Dashboard
- User Management
- Evaluation Period Management
- Course Management
- Programs and Sections
- Reports and Analytics
- Audit Logs
- System Settings

### User Management

The User Management page displays a list of all registered users with search and filter options.

#### Adding a Single User

1. Navigate to **User Management** from the sidebar menu
2. Click the **"Add User"** button (top right corner)
3. Fill in the user registration form:
   - **Email**: Must be @lpubatangas.edu.ph domain (required)
   - **First Name**: User's first name (required)
   - **Last Name**: User's last name (required)
   - **Role**: Select from dropdown (Student, Instructor, Secretary, Department Head, System Admin) (required)
   - **Department**: Select department (optional)
   - **Student/Employee Number**: For students and staff (required for students)
   - **Program**: Select program (for students only)
   - **Year Level**: Select 1, 2, 3, or 4 (for students only)
4. Click **"Create User"** to save
5. The system automatically:
   - Creates the user account
   - Generates a temporary password
   - Sends a welcome email with login credentials to the user's email address
6. The user will appear in the user list immediately

#### Bulk Import Users via CSV

The system supports efficient bulk importing of multiple users simultaneously using CSV files.

1. Navigate to **User Management** from the sidebar
2. Click the **"Bulk Import"** button
3. Click **"Download CSV Template"** to get the correct format
4. Fill in the CSV template with user data

**CSV Template Example:**
```csv
first_name,last_name,email,role,department,school_id,program,year_level
Juan,Dela Cruz,juan.delacruz@lpubatangas.edu.ph,student,CCS,20210001,BSCS,3
Maria,Santos,maria.santos@lpubatangas.edu.ph,instructor,CCS,INS001,,
Pedro,Reyes,pedro.reyes@lpubatangas.edu.ph,student,COE,20210002,BSCE,2
```

5. **CSV Column Specifications**:

| Column | Required | Description | Valid Values |
|--------|----------|-------------|--------------|
| first_name | Yes | User's first name | Alphabetic characters |
| last_name | Yes | User's last name | Alphabetic characters |
| email | Yes | Official email address | Must end with @lpubatangas.edu.ph |
| role | Yes | System role | student, instructor, secretary, department_head, admin |
| department | No | Department code | CCS, COE, CBA, etc. |
| school_id | Yes (for students) | Student/Employee number | Numeric, unique |
| program | No (for students) | Program code | BSCS, BSIT, BSCE, etc. |
| year_level | No (for students) | Academic year level | 1, 2, 3, or 4 |

6. Upload the completed CSV file
7. The system will display a preview of the first 5 rows for verification
8. Review the preview for any errors highlighted in red
9. Click **"Import Users"** to proceed
10. The system processes the import and displays results:
    - ✅ **Successfully imported**: Number of users created
    - ❌ **Failed**: Number of users with errors
    - **Error Details**: Specific errors for failed imports (e.g., duplicate email, invalid format)

**Important Notes:**
- The import completes in under 5 seconds for up to 1000 users
- Welcome emails are sent automatically in the background to all imported users
- Users with errors are not created; fix the CSV and re-import
- Common errors: duplicate emails, missing required fields, invalid email domain

#### Editing User Information

1. Locate the user in the user list (use search or filters)
2. Click the **"Edit"** button (pencil icon) next to the user
3. Modify the user details in the form:
   - Email, name, role, department, student number, program, year level
4. Click **"Save Changes"** to update
5. The changes are reflected immediately in the system

#### Deleting Users

The system provides two deletion options:

**Soft Delete (Recommended):**
- Marks the user as inactive without removing data
- User cannot log in but historical data is preserved
- Can be reactivated later if needed

**Steps:**
1. Click the **"Delete"** button (trash icon) next to the user
2. Confirm the deletion in the popup dialog
3. User status changes to "Inactive"
4. User data (evaluations, enrollments) remains in the database

**Force Delete (Permanent):**
- Permanently removes the user and ALL related data from the system
- This action is irreversible

**Steps:**
1. Click the **"Force Delete"** button (dark red with ⚠️ warning icon)
2. Read the warning message carefully
3. Confirm permanent deletion
4. The user and all associated data are removed:
   - User account
   - Student/Instructor profile
   - Evaluation submissions
   - Enrollment records
   - Audit log entries

⚠️ **Warning**: Force delete cannot be undone. Use only when absolutely necessary (e.g., test accounts, data privacy requests).

### Evaluation Period Management

Evaluation periods control when students can submit evaluations. Only one period can be active at a time.

#### Creating an Evaluation Period

1. Navigate to **"Evaluation Period Management"** from the sidebar
2. Click the **"Create New Period"** button
3. Fill in the evaluation period form:
   - **Semester**: Select from dropdown (1st Semester, 2nd Semester, Summer)
   - **Academic Year**: Enter in format YYYY-YYYY (e.g., 2025-2026)
   - **Start Date**: Select the period start date (cannot be in the past)
   - **End Date**: Select the period end date (must be after start date)
   - **Notify Users**: Check this option to send email notifications to all users

4. The system auto-generates the period name: **"[Semester] [Academic Year]"**
   - Example: "1st Semester 2025-2026"

5. Review the information and click **"Create Period"**
6. The new evaluation period is created and becomes active immediately
7. Students enrolled in program sections can now submit evaluations

⚠️ **Important**: 
- Only one evaluation period can be **open** (active) at a time
- You must close the current period before creating a new one
- Date ranges cannot overlap with existing periods

#### Managing Active Period

**View Statistics**:
- Total Evaluations
- Completed Evaluations
- Participation Rate
- Days Remaining

**Extending a Period**:
1. Click **Extend** button
2. Select new end date
3. Click **Extend Period**
4. Users are notified of extension

**Closing a Period**:
1. Click **Close Period**
2. Confirm closure
3. Students can no longer submit evaluations
4. Period moves to "Past Periods" section

**Reopening a Closed Period**:
1. Go to Past Periods section
2. Click **Extend & Reopen** on desired period
3. Set new end date
4. Period becomes active again

#### Enrolling Program Sections

1. In active period view, click **Enroll Section**
2. Select a Program Section (e.g., BSCS-3A)
3. Click **Enable**
4. System creates evaluation records for all students in that section
5. Students can now evaluate ALL their enrolled courses

**What Happens**:
- Evaluations created for each student-course combination
- One enrollment action enables entire class section
- Shows enrolled students count and evaluations created

**Removing Enrolled Section**:
1. Click **Remove** on enrolled section
2. Confirm removal
3. All evaluation records for that section are deleted

### Course Management

#### Managing Programs

1. Navigate to **Programs**
2. View list of academic programs
3. Add/Edit/Delete programs as needed

#### Managing Class Sections

1. Navigate to **Class Sections**
2. View all course sections
3. Filter by semester, program, or instructor
4. Assign instructors to sections
5. Manage student enrollments

### Reports and Analytics

#### Dashboard Statistics

View real-time metrics:
- User distribution by role
- Evaluation completion rates
- Active vs inactive users
- Recent system activity

#### Evaluation Reports

1. Navigate to **Reports**
2. Select evaluation period
3. Filter by:
   - Department
   - Program
   - Course
   - Instructor
4. Generate report
5. Export to CSV or PDF

#### Audit Logs

1. Navigate to **Audit Logs**
2. View all system actions:
   - User logins
   - User creation/modification/deletion
   - Evaluation submissions
   - Period changes
3. Filter by:
   - Date range
   - User
   - Action type
4. Export logs for compliance

---

## Department Head Guide

### Dashboard

View department-specific metrics:
- Department courses
- Instructor performance
- Evaluation completion rates
- Student feedback summaries

### Viewing Reports

1. Navigate to **Reports**
2. Automatically filtered to your department
3. Select evaluation period
4. View course-wise reports
5. Compare instructor performance

### Accessing Evaluation Results

1. Navigate to **Evaluations**
2. View list of department courses
3. Click on a course to see:
   - Average ratings
   - Student comments
   - Response rate
   - Trend analysis

---

## Secretary Guide

### Managing Enrollments

1. Navigate to **Enrollments**
2. View student enrollment lists
3. Add students to class sections
4. Remove students from sections
5. Update enrollment status

### Checking Evaluation Status

1. Navigate to **Evaluation Status**
2. View which students have completed evaluations
3. Send reminders to students with pending evaluations
4. Generate completion reports

### Data Entry Support

1. Assist with bulk imports
2. Verify student information
3. Update course sections
4. Support evaluation period setup

---

## Instructor Guide

### Dashboard

View your courses and evaluation status:
- Assigned courses
- Active evaluations
- Completion rates per course
- Recent feedback

### Viewing Course Evaluations

1. Navigate to **My Courses**
2. Click on a course
3. View evaluation results:
   - Overall rating
   - Question-by-question breakdown
   - Student comments (anonymous)
   - Response rate

**Note**: Results are only visible after evaluation period closes.

### Generating Reports

1. Select a course
2. Choose evaluation period
3. Click **Generate Report**
4. Download PDF or CSV format

### Profile Management

1. Click on profile icon (top right)
2. Select **Profile**
3. Update:
   - Contact information
   - Office hours
   - Bio
4. Click **Save Changes**

---

## Student Guide

### Dashboard

Your dashboard shows:
- Enrolled courses
- Pending evaluations
- Completed evaluations
- Deadlines

### Submitting Evaluations

1. Navigate to **My Evaluations**
2. View list of courses requiring evaluation
3. Click **Evaluate** on a course
4. Answer all questions:
   - **Rating Questions**: Select 1-5 stars
   - **Multiple Choice**: Select one option
   - **Text Questions**: Provide written feedback
5. Review your responses
6. Click **Submit Evaluation**
7. Confirm submission

**Important**:
- Evaluations are **anonymous** to instructors
- Cannot edit after submission
- Must complete during active evaluation period
- All questions are required

### Evaluation Questions

Typical evaluation includes:
1. **Course Content**:
   - Clarity of learning objectives
   - Relevance of course material
   - Difficulty level
   
2. **Teaching Effectiveness**:
   - Instructor knowledge
   - Communication skills
   - Engagement methods
   - Availability for consultation

3. **Assessment**:
   - Fairness of grading
   - Quality of feedback
   - Variety of assessment methods

4. **Overall**:
   - Course rating
   - Instructor rating
   - Would recommend to others
   - Comments and suggestions

### Viewing Evaluation History

1. Navigate to **My Evaluations**
2. Click **History** tab
3. View:
   - Completed evaluations
   - Submission dates
   - Courses evaluated
   - Evaluation periods

### Profile Management

1. Click profile icon (top right)
2. Select **My Profile**
3. Update:
   - Contact information
   - Password
4. Click **Save**

---

## Troubleshooting

### Login Issues

**Problem**: Cannot login
**Solutions**:
- Verify email address (must be @lpubatangas.edu.ph)
- Check password (case-sensitive)
- Clear browser cache and cookies
- Try different browser
- Use "Forgot Password" to reset

**Problem**: "First login" page keeps appearing
**Solutions**:
- Ensure you changed password successfully
- Try logging out and back in
- Contact system admin if persists

### Email Issues

**Problem**: Not receiving welcome email
**Solutions**:
- Check spam/junk folder
- Verify email address is correct
- Wait 2-3 minutes (emails sent in background)
- Contact system admin to resend

**Problem**: Password reset email not received
**Solutions**:
- Check spam folder
- Verify email address spelling
- Wait 5 minutes before requesting again
- Link expires after 1 hour - request new one

### Evaluation Issues

**Problem**: Cannot see courses to evaluate
**Solutions**:
- Verify evaluation period is open
- Ensure you're enrolled in courses
- Refresh the page
- Contact secretary to verify enrollment

**Problem**: Evaluation submission fails
**Solutions**:
- Answer all required questions
- Check internet connection
- Try submitting again
- Contact system admin if error persists

### Performance Issues

**Problem**: Slow page loading
**Solutions**:
- Check internet connection speed
- Clear browser cache
- Close unnecessary browser tabs
- Try during off-peak hours
- Use recommended browsers (Chrome, Firefox)

**Problem**: Bulk import timeout
**Solutions**:
- Import takes <5 seconds normally
- If timeout occurs, check if users were imported (refresh page)
- Try importing in smaller batches (50 users at a time)
- Contact system admin if consistent issues

### Access Issues

**Problem**: 404 error when reloading page
**Solutions**:
- This is fixed - page should reload correctly
- Clear cache if issue persists
- Bookmark the main URL instead of specific pages

**Problem**: Unauthorized access errors
**Solutions**:
- Verify your role has permission for that page
- Re-login to refresh session
- Contact admin if you should have access

---

## FAQs

### General

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions). Chrome is recommended for best performance.

**Q: Can I access the system on mobile?**
A: Yes, the system is responsive and works on mobile devices, though desktop is recommended for better experience.

**Q: Is my data secure?**
A: Yes, all data is encrypted in transit (HTTPS) and at rest. Passwords are hashed using bcrypt. Evaluations are anonymous to instructors.

**Q: How often should I change my password?**
A: Change your password every 90 days or immediately if you suspect compromise.

### For Students

**Q: Are my evaluations really anonymous?**
A: Yes, instructors cannot see who submitted which evaluation. System admins can see this data for audit purposes only.

**Q: Can I change my evaluation after submitting?**
A: No, evaluations are final once submitted. Review carefully before submitting.

**Q: What if I miss the evaluation deadline?**
A: You cannot submit after the period closes. Ensure you complete evaluations before the deadline.

**Q: Do evaluations affect my grades?**
A: No, evaluations are separate from grading. They help improve course quality.

### For Instructors

**Q: When can I see evaluation results?**
A: Results are visible only after the evaluation period closes, ensuring anonymity during active evaluation.

**Q: Can I see individual student responses?**
A: No, you can only see aggregated data and anonymous comments.

**Q: What if I disagree with evaluation feedback?**
A: Discuss concerns with your department head. Evaluations are one of many performance indicators.

### For Admins

**Q: What's the difference between delete and force delete?**
A: Delete marks user as inactive (data preserved). Force delete permanently removes user and ALL related data (irreversible).

**Q: Can I have multiple evaluation periods open?**
A: No, only one period can be open at a time to avoid confusion.

**Q: How do I handle bulk import errors?**
A: Review the error list shown after import. Common issues: duplicate emails, invalid email domain, missing required fields.

**Q: How long are audit logs kept?**
A: Audit logs are kept indefinitely for compliance. You can export them for archival.

**Q: Can I customize evaluation questions?**
A: Contact the system developer for question customization. Questions are currently configured in the backend.

### Technical

**Q: What if the system is down?**
A: The system is hosted on Railway (99.9% uptime). Check https://status.railway.app for service status.

**Q: How is data backed up?**
A: Supabase provides automatic daily backups. Database backups are also stored in the repository.

**Q: Can I export all data?**
A: Yes, admins can export data via CSV from various sections (users, evaluations, reports).

**Q: What's the maximum CSV import size?**
A: Recommended 1000 users per import. Larger files should be split into batches.

---

## Support

### Getting Help

**System Administrator**:
- Email: admin@lpubatangas.edu.ph
- Office: IT Department

**Technical Support**:
- Report bugs and issues via system admin
- Include: Error message, steps to reproduce, browser used

**Training**:
- Training sessions available upon request
- User guides available in the system
- Video tutorials coming soon

### System Updates

The system is regularly updated with:
- Bug fixes
- Performance improvements
- New features
- Security patches

Updates are deployed automatically with minimal downtime (usually <5 minutes).

---

## Appendix

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

### Email Domain

All users must have **@lpubatangas.edu.ph** email addresses.

### CSV Template Fields

```csv
first_name,last_name,email,role,department,school_id,program,year_level
```

**Field Descriptions**:
- `first_name`: Required, alphabetic characters
- `last_name`: Required, alphabetic characters
- `email`: Required, must be @lpubatangas.edu.ph
- `role`: Required, one of: student, instructor, secretary, department_head, admin
- `department`: Optional, department code
- `school_id`: Required for students, student/employee number
- `program`: Optional for students, program code (BSCS, BSIT, etc.)
- `year_level`: Optional for students, 1-4

### Role Permissions Matrix

| Feature | Student | Instructor | Secretary | Dept Head | Admin |
|---------|---------|------------|-----------|-----------|-------|
| Submit Evaluations | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Own Results | ✗ | ✓ | ✗ | ✗ | ✗ |
| Manage Enrollments | ✗ | ✗ | ✓ | ✗ | ✓ |
| View Dept Reports | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage Users | ✗ | ✗ | ✗ | ✗ | ✓ |
| Manage Periods | ✗ | ✗ | ✗ | ✗ | ✓ |
| View Audit Logs | ✗ | ✗ | ✗ | ✗ | ✓ |
| System Settings | ✗ | ✗ | ✗ | ✗ | ✓ |

---

**Document Version**: 1.0  
**Last Updated**: December 8, 2025  
**System Version**: Course Insight Guardian v1.0  

**© 2025 Lyceum of the Philippines University - Batangas**
