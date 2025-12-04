# First-Time Login Feature - Setup & Testing Guide

## Overview
The first-time login feature has been implemented to provide a professional onboarding experience for new users. When a student, secretary, or department head account is created, they receive a temporary password based on their school ID and must change it on first login.

## Feature Implementation Status

### ✅ COMPLETED
1. **Database Schema** - SQL migration created with new columns
2. **Backend Models** - User model updated with school_id and first_login fields
3. **Backend Routes** - Auto-password generation and first-login detection
4. **Frontend UI** - FirstTimeLogin page with comprehensive validation
5. **Login Flow** - Redirect logic for first-time users
6. **CSV Import** - Updated template with school_id field
7. **Email Service** - Welcome email template and service created

### ⚠️ PENDING
1. **Execute SQL migration** on database
2. **Configure SMTP** for actual email sending
3. **End-to-end testing** of complete flow
4. **Update production URLs** in code

---

## Step 1: Execute Database Migration

### Run the SQL Migration
```powershell
# Navigate to database schema directory
cd "c:\Users\Jose Iturralde\Documents\1 thesis\Back\database_schema"

# Connect to PostgreSQL (adjust credentials as needed)
psql -U postgres -d CourseFeedback

# Execute the migration
\i '08_ADD_SCHOOL_ID_FIRST_LOGIN.sql'

# Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('school_id', 'first_login');

# Check sample data
SELECT id, email, school_id, first_login, role 
FROM users 
LIMIT 5;
```

### Expected Results
- `school_id` column added (VARCHAR 50, nullable)
- `first_login` column added (BOOLEAN, default TRUE)
- Index created on `school_id`
- Existing users have `first_login = FALSE`
- Student school_id values migrated from student_number

---

## Step 2: Configure Email Service (Optional)

### Option A: Use Gmail SMTP
Edit `Back/App/services/welcome_email_service.py` and uncomment lines 105-115:

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

msg = MIMEMultipart('alternative')
msg['Subject'] = subject
msg['From'] = 'noreply@lpubatangas.edu.ph'  # Your Gmail address
msg['To'] = email
msg.attach(MIMEText(email_html, 'html'))

with smtplib.SMTP('smtp.gmail.com', 587) as server:
    server.starttls()
    server.login('your-email@lpubatangas.edu.ph', 'your-app-password')
    server.send_message(msg)
```

**Setup Gmail App Password:**
1. Go to Google Account Settings
2. Security → 2-Step Verification → App passwords
3. Generate app password for "Mail"
4. Use generated password in code

### Option B: Use SendGrid
```bash
pip install sendgrid
```

Update the email service:
```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

message = Mail(
    from_email='noreply@lpubatangas.edu.ph',
    to_emails=email,
    subject=subject,
    html_content=email_html
)

sg = SendGridAPIClient('YOUR_SENDGRID_API_KEY')
response = sg.send(message)
```

### Option C: Skip Email (Testing Mode)
The current implementation logs email content without actually sending. This is sufficient for testing the flow without email infrastructure.

---

## Step 3: Test the Complete Flow

### Test 1: Create User with School ID

1. **Login as admin** (http://localhost:5173/login)

2. **Navigate to User Management** → Add User

3. **Fill in the form:**
   - Email: `testuser@lpubatangas.edu.ph`
   - First Name: `Test`
   - Last Name: `User`
   - School ID: `23130999`
   - Role: `Student`
   - Program: Select any program (e.g., BSIT)
   - Year Level: `1`

4. **Click Create** - You should see:
   - Success message
   - Generated password: `lpub@23130999`
   - Email status: "prepared" (or "sent" if SMTP configured)

5. **Check backend logs** - Should show:
   ```
   📧 Welcome email prepared for testuser@lpubatangas.edu.ph
      Name: Test User
      School ID: 23130999
      Role: Student
      Temp Password: lpub@23130999
   ```

### Test 2: First-Time Login Flow

1. **Logout from admin account**

2. **Login with temporary credentials:**
   - Email: `testuser@lpubatangas.edu.ph`
   - Password: `lpub@23130999`

3. **Expected behavior:**
   - Should automatically redirect to `/first-time-login` page
   - Page shows "Welcome! Let's secure your account"
   - Form has fields: Current Password, New Password, Confirm Password

4. **Change password:**
   - Current Password: `lpub@23130999`
   - New Password: `NewSecure123!`
   - Confirm Password: `NewSecure123!`
   - Check password requirements (all should turn green)
   - Password strength meter should show "Strong" or "Very Strong"

5. **Click "Change Password"**
   - Should redirect to `/student/courses` (student dashboard)
   - Top bar should show "Test User"

6. **Verify database update:**
   ```sql
   SELECT email, first_login, must_change_password 
   FROM users 
   WHERE email = 'testuser@lpubatangas.edu.ph';
   ```
   Both should be `FALSE`

### Test 3: Bulk Import with School IDs

1. **Download CSV template** from User Management

2. **Create test CSV file** (`test_users.csv`):
   ```csv
   email,first_name,last_name,school_id,role,program,year_level
   student1@lpubatangas.edu.ph,Juan,Dela Cruz,23130001,student,BSIT,1
   student2@lpubatangas.edu.ph,Maria,Santos,23130002,student,BSCS,2
   secretary1@lpubatangas.edu.ph,Ana,Reyes,23140001,secretary,,
   ```

3. **Import via Bulk Import:**
   - Upload the CSV file
   - Review preview
   - Click "Import All Users"
   - Check success messages for each user

4. **Test login for bulk-imported user:**
   - Logout
   - Login as `student1@lpubatangas.edu.ph` with password `lpub@23130001`
   - Should redirect to first-time login page
   - Change password successfully

### Test 4: Secretary/Department Head

1. **Create secretary with school ID:**
   - Email: `secretary@lpubatangas.edu.ph`
   - School ID: `23140050`
   - Role: Secretary
   - Generated password: `lpub@23140050`

2. **Login with temp password** → Should trigger first-time login flow

3. **Create department head without school ID:**
   - Email: `depthead@lpubatangas.edu.ph`
   - School ID: (leave empty)
   - Role: Department Head
   - Should NOT get auto-generated password

---

## Step 4: Update Production URLs

Before deploying to production, update these URLs:

### Backend (`system_admin.py` line ~290)
```python
email_result = await send_welcome_email(
    email=user_data.email,
    first_name=user_data.first_name,
    last_name=user_data.last_name,
    school_id=school_id,
    role=user_data.role,
    temp_password=generated_password_info,
    login_url="https://your-production-domain.com/login"  # UPDATE THIS
)
```

### Email Service (`welcome_email_service.py` line ~81)
```python
async def send_welcome_email(
    email: str,
    first_name: str,
    last_name: str,
    school_id: str,
    role: str,
    temp_password: str,
    login_url: str = "https://your-production-domain.com/login"  # UPDATE THIS
) -> Dict[str, Any]:
```

---

## Password Pattern Reference

### Auto-Generated Passwords
- **Pattern:** `lpub@{school_id}` (lowercase)
- **Example:** School ID `23130778` → Password `lpub@23130778`

### Applies to:
- ✅ **Students** - ALWAYS (when school_id provided)
- ✅ **Secretary** - If school_id provided
- ✅ **Department Head** - If school_id provided
- ❌ **Instructors** - Manual password only
- ❌ **Admins** - Manual password only

### Password Requirements (after first login)
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Password strength scoring: Weak → Fair → Good → Strong → Very Strong → Excellent

---

## CSV Template Format

### Headers (Required)
```
email,first_name,last_name,school_id,role,program,year_level
```

### Example Rows
```csv
email,first_name,last_name,school_id,role,program,year_level
iturraldejose@lpubatangas.edu.ph,Jose,Iturralde,23130778,student,BSIT,1
juandelacruz@lpubatangas.edu.ph,Juan,Dela Cruz,23130779,student,BSCS,2
mariasantos@lpubatangas.edu.ph,Maria,Santos,23130780,student,BSPSY,3
secretary@lpubatangas.edu.ph,Ana,Reyes,23140001,secretary,,
depthead@lpubatangas.edu.ph,Pedro,Garcia,23150001,department_head,,
```

### Notes
- `school_id` is REQUIRED for auto-password generation
- `program` and `year_level` only needed for students
- Secretary and department_head can have empty program/year_level

---

## Troubleshooting

### Issue: "User already exists" error
**Solution:** Check database for existing user:
```sql
SELECT * FROM users WHERE email = 'user@lpubatangas.edu.ph';
DELETE FROM users WHERE email = 'user@lpubatangas.edu.ph'; -- if needed
```

### Issue: Not redirecting to first-time login page
**Check:**
1. Database has `first_login = TRUE` for the user
2. Backend returns `firstLogin: true` in login response (check Network tab)
3. Login.jsx has the redirect logic (line 66-75)
4. App.jsx has the route defined (line 42)

### Issue: Password change fails
**Check:**
1. User is entering correct temporary password
2. New password meets all requirements
3. Backend logs for error messages
4. Database connection is active

### Issue: Email not sending
**Check:**
1. SMTP configuration is correct
2. Gmail app password is valid (not regular password)
3. Firewall allows SMTP connections
4. Check backend logs for email service errors

---

## Database Schema Reference

### New Columns Added
```sql
-- users table
school_id          VARCHAR(50)      -- User's LPU school ID number (e.g., "23130778")
first_login        BOOLEAN          -- TRUE if user hasn't logged in yet, FALSE after first login

-- Index for performance
CREATE INDEX idx_users_school_id ON users(school_id);
```

### Migration Details
- Migrates existing `students.student_number` to `users.school_id`
- Sets `first_login = FALSE` for all existing users (won't disrupt their access)
- New users created after migration have `first_login = TRUE` by default

---

## File Structure Reference

### Backend Files
```
Back/App/
  models/
    enhanced_models.py          # User model with school_id, first_login
  routes/
    auth.py                     # Login, change password (returns firstLogin flag)
    system_admin.py             # User creation with auto-password
  services/
    welcome_email_service.py    # Email templates and sending logic
Back/database_schema/
  08_ADD_SCHOOL_ID_FIRST_LOGIN.sql  # Database migration
```

### Frontend Files
```
New/capstone/src/
  pages/
    auth/
      FirstTimeLogin.jsx        # Password change page for first-time users
    common/
      Login.jsx                 # Login page with first-login detection
    admin/
      UserManagement.jsx        # User creation with school_id field
  App.jsx                       # Routing configuration
```

---

## Next Steps

1. ✅ **Execute SQL migration** (Step 1 above)
2. ⚠️ **Test complete flow** (Step 3 above)
3. 📧 **Configure email** if needed (Step 2 above)
4. 🚀 **Deploy to production** with updated URLs (Step 4 above)
5. 📝 **Document for admins** - Create user guide for creating users with school IDs

---

## Admin Quick Reference

### Creating a Student User
1. Navigate to User Management → Add User
2. Fill in: Email, First/Last Name, **School ID**, Role (Student), Program, Year Level
3. Click Create
4. Note the generated password: `lpub@{school_id}`
5. Communicate password to student (or email will be sent automatically)

### What Students See
1. Receive welcome email with temporary password
2. Login with email and temp password
3. Automatically redirected to password change page
4. Create new secure password
5. Access student dashboard

### Bulk Import Workflow
1. Download CSV template
2. Fill with student data (include school_id column)
3. Upload CSV file
4. Review preview and errors
5. Import all users
6. System auto-generates passwords for all students

---

## Support & Documentation

For questions or issues:
1. Check backend logs: `Back/App/` directory
2. Check browser console for frontend errors
3. Verify database state with SQL queries
4. Review this guide for troubleshooting steps

**Feature implemented by:** GitHub Copilot (Claude Sonnet 4.5)
**Date:** 2024
**Version:** 1.0
