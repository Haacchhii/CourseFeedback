# System Administrator Role - Complete Guide

## 🎯 Overview

The **System Administrator** role has been implemented with complete control over the entire Course Feedback system. This role is separate from Department Heads and Secretaries, providing enhanced management capabilities.

---

## 👥 User Role Hierarchy

### 1. **Students**
- **Role**: `student`
- **Access**: Evaluate their enrolled courses
- **Dashboard**: Student course listing and evaluation forms
- **Permissions**: Submit evaluations only

### 2. **Department Heads**
- **Role**: `head`
- **Access**: View data for assigned programs only (e.g., BSIT, BSCS)
- **Dashboard**: Standard analytics dashboard (filtered by program)
- **Permissions**: View-only access to their program data

### 3. **Secretaries/Administrative Staff**
- **Role**: `secretary` or `admin` (legacy)
- **Access**: View data for ALL programs
- **Dashboard**: Standard analytics dashboard (no filters)
- **Permissions**: View-only access to all system data

### 4. **System Administrators** ⭐ NEW
- **Role**: `system-admin`
- **Access**: FULL CONTROL over entire system
- **Dashboard**: Dedicated admin control panel at `/admin/dashboard`
- **Permissions**: Complete management capabilities

---

## 🔐 Login Credentials

### System Administrators
1. **Primary Admin**
   - Email: `admin@lpubatangas.edu.ph`
   - Password: `admin123`
   - Name: System Administrator

2. **Super Admin**
   - Email: `superadmin@lpubatangas.edu.ph`
   - Password: `superadmin123`
   - Name: Super Administrator

### Secretaries (View-Only)
1. Email: `secretary@lpubatangas.edu.ph` / Password: `secretary123`
2. Email: `registrar.secretary@lpubatangas.edu.ph` / Password: `secretary123`

### Department Heads (Program-Specific)
1. **IT**: `melodydimaano@lpubatangas.edu.ph` (BSIT only)
2. **CS**: `dr.rivera@lpubatangas.edu.ph` (BSCS, BSCS-DS)
3. **CY**: `prof.santos@lpubatangas.edu.ph` (BS-CY only)
4. **Multimedia**: `dr.mendoza@lpubatangas.edu.ph` (BMA only)

---

## 🛠️ System Administrator Capabilities

### 1. **User Management** 🧑‍💼
**Permission**: `userManagement`

**What they can do:**
- ✅ Create new user accounts (Students, Department Heads, Secretaries)
- ✅ Edit existing user information
- ✅ Delete user accounts
- ✅ Assign and modify user roles
- ✅ Reset user passwords
- ✅ Activate/deactivate accounts
- ✅ View user activity logs
- ✅ Bulk import/export users

**Use Cases:**
- New student enrollment
- Assigning new department heads
- Removing graduated students
- Password recovery

**Route**: `/admin/users`

---

### 2. **Course Management** 📚
**Permission**: `courseManagement`

**What they can do:**
- ✅ Create new courses across ALL programs
- ✅ Edit course details (name, code, instructor, schedule)
- ✅ Delete courses (with safety checks)
- ✅ Assign instructors to courses
- ✅ Manage course schedules and semesters
- ✅ Bulk import/export courses
- ✅ Archive old courses
- ✅ Set enrollment limits

**Use Cases:**
- Adding new courses for upcoming semester
- Reassigning instructors
- Closing old courses
- Managing course capacity

**Route**: `/courses` (with enhanced admin controls)

---

### 3. **Evaluation Management** 📊
**Permission**: `evaluationManagement`

**What they can do:**
- ✅ Create custom evaluation questionnaires
- ✅ Edit question sets
- ✅ Set evaluation periods (open/close dates)
- ✅ Configure rating scales
- ✅ Assign questionnaires to specific courses/programs
- ✅ View all evaluation responses
- ✅ Delete inappropriate evaluations
- ✅ Export evaluation data
- ✅ Generate evaluation reports

**Use Cases:**
- Creating midterm and final evaluation forms
- Setting evaluation deadlines
- Moderating offensive content
- Generating semester reports

**Route**: `/evaluation-questions`

---

### 4. **System Configuration** ⚙️
**Permission**: `systemConfiguration`

**What they can do:**
- ✅ Configure system-wide settings
- ✅ Set academic terms and semesters
- ✅ Manage evaluation deadlines
- ✅ Configure email notification templates
- ✅ Set minimum participation thresholds
- ✅ Configure rating scale ranges
- ✅ Set anomaly detection thresholds
- ✅ Manage system maintenance windows

**Use Cases:**
- Setting semester start/end dates
- Configuring automatic reminders
- Adjusting performance thresholds
- System maintenance scheduling

**Route**: `/admin/settings`

---

### 5. **Analytics & Reporting** 📈
**Permission**: `viewAllData`

**What they can do:**
- ✅ View cross-department comparisons
- ✅ Access system-wide trends and insights
- ✅ Generate comprehensive reports
- ✅ Create custom dashboard views
- ✅ Compare program performance
- ✅ Track historical data trends
- ✅ Identify system-wide patterns

**Use Cases:**
- Annual performance reports
- Department comparisons
- Identifying improvement areas
- Strategic planning data

**Route**: `/admin/dashboard`

---

### 6. **Data Export** 📥
**Permission**: `dataExport`

**What they can do:**
- ✅ Export all system data
- ✅ Choose export formats (CSV, PDF, Excel, JSON)
- ✅ Filter data by date range, program, course
- ✅ Schedule automated exports
- ✅ Export user data (GDPR compliant)
- ✅ Export evaluation responses
- ✅ Generate formatted reports

**Use Cases:**
- Compliance reporting
- Data backup
- Integration with other systems
- Academic planning

**Route**: `/admin/export`

---

### 7. **Security & Audit** 🔒
**Permission**: `auditLogs`

**What they can do:**
- ✅ View comprehensive system logs
- ✅ Track user actions and changes
- ✅ Monitor login attempts
- ✅ Review data modifications
- ✅ Identify suspicious activities
- ✅ View security events
- ✅ Generate audit reports
- ✅ Manage data retention policies

**Use Cases:**
- Security investigations
- Compliance audits
- Troubleshooting issues
- User activity monitoring

**Route**: `/admin/audit-logs`

---

### 8. **Delete Evaluations** 🗑️
**Permission**: `deleteEvaluations`

**What they can do:**
- ✅ Remove inappropriate evaluations
- ✅ Delete spam or offensive content
- ✅ Remove duplicate submissions
- ⚠️ **High-risk permission** - use with caution

**Use Cases:**
- Moderating offensive content
- Removing spam
- Handling duplicate submissions
- Correcting data entry errors

**Route**: Available in evaluation management views

---

### 9. **Password Reset** 🔑
**Permission**: `resetPasswords`

**What they can do:**
- ✅ Reset any user's password
- ✅ Generate temporary passwords
- ✅ Send password reset emails
- ✅ Unlock locked accounts
- ⚠️ **Sensitive permission** - logged for audit

**Use Cases:**
- User password recovery
- Unlocking accounts after failed login attempts
- Emergency access restoration

**Route**: Available in user management

---

## 🎨 Admin Dashboard Features

### **Main Dashboard** (`/admin/dashboard`)

**Quick Stats Cards:**
1. **Total Users** - System-wide user count
2. **Total Courses** - All courses across programs
3. **Total Evaluations** - All evaluation responses
4. **System Health** - System operational status

**Management Panels:**
- **User Management** - Create/edit/delete users
- **Course Management** - Manage all courses
- **Evaluation Management** - Configure questionnaires
- **System Settings** - Configure system parameters
- **Data Export** - Export system data
- **Audit Logs** - View security logs

**Analytics Charts:**
- Program distribution (courses, students, evaluations)
- User roles distribution (pie chart)
- Sentiment analysis overview
- Cross-program performance comparison

---

## 🔄 Role Comparison

| Feature | Student | Dept. Head | Secretary | System Admin |
|---------|---------|------------|-----------|--------------|
| Submit Evaluations | ✅ | ❌ | ❌ | ❌ |
| View Own Program Data | ✅ | ✅ | ❌ | ❌ |
| View All Program Data | ❌ | ❌ | ✅ | ✅ |
| Create/Edit Courses | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| Configure System | ❌ | ❌ | ❌ | ✅ |
| Delete Evaluations | ❌ | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ✅ |
| Export All Data | ❌ | ❌ | ❌ | ✅ |
| Reset Passwords | ❌ | ❌ | ❌ | ✅ |

---

## 🚀 Getting Started as System Admin

### Step 1: Login
1. Go to login page
2. Enter admin credentials
3. System automatically routes to `/admin/dashboard`

### Step 2: Explore Dashboard
- View system-wide statistics
- Check program distributions
- Monitor system health

### Step 3: Manage Components
- Click on management cards to navigate
- Use navigation to access different modules
- All admin tools accessible from dashboard

---

## ⚠️ Important Security Notes

1. **Sensitive Permissions**
   - `deleteEvaluations` - Can remove student feedback
   - `resetPasswords` - Can access any account
   - `userManagement` - Can modify roles
   - All actions are logged for audit

2. **Best Practices**
   - Only grant System Admin role to trusted personnel
   - Regularly review audit logs
   - Use strong passwords
   - Enable two-factor authentication (when implemented)
   - Don't share admin credentials

3. **Separation of Concerns**
   - System Admins focus on technical management
   - Department Heads focus on academic oversight
   - Secretaries handle data viewing and reporting

---

## 📝 Future Enhancements

Planned features for System Administrators:
- [ ] Two-factor authentication
- [ ] Role-based access control (RBAC) builder
- [ ] Automated backup scheduling
- [ ] Real-time system monitoring dashboard
- [ ] Email notification system
- [ ] Advanced reporting tools
- [ ] Integration with external systems
- [ ] Custom permission sets
- [ ] API key management
- [ ] Webhook configuration

---

## 🆘 Support

For System Administrator support:
- Contact IT Services
- Email: admin@lpubatangas.edu.ph
- Review audit logs for troubleshooting
- Check system documentation

---

**Version**: 1.0.0  
**Last Updated**: October 15, 2025  
**Maintained By**: System Administration Team
