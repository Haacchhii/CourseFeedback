# Admin Role - Major Overhaul Plan

**Date**: November 16, 2025  
**Status**: Planning Phase - DO NOT IMPLEMENT YET  
**Scope**: Admin role pages only

---

## 📋 **OVERVIEW**

This document outlines the planned major changes to the Admin role functionality. These changes focus on:
- Simplifying the admin interface
- Adding bulk operation capabilities
- Improving data import efficiency
- Streamlining evaluation period management
- Refining role-specific features

---

## 🎯 **CURRENT STATE (BEFORE CHANGES)**

### Admin Pages (8 total)
1. **AdminDashboard.jsx** - Overview with system health, stats, and sentiment
2. **UserManagement.jsx** - CRUD for users with individual add/edit
3. **EvaluationPeriodManagement.jsx** - Period management (limited functionality)
4. **EnhancedCourseManagement.jsx** - Course CRUD with analytics tab
5. **SystemSettings.jsx** - General, Email, Security, Backup tabs
6. **DataExportCenter.jsx** - Export with format selection tabs
7. **AuditLogViewer.jsx** - System audit logs (NO CHANGES)
8. **EmailNotifications.jsx** - Email sending interface (NO CHANGES)

### Admin Backend Routes
- `/api/admin/*` - 40+ endpoints for admin operations

---

## 🔄 **PLANNED CHANGES**

---

## 1️⃣ **ADMIN DASHBOARD PAGE** (`AdminDashboard.jsx`)

### **Current Features**
- System Health Status card (server, database, API)
- Total stats (users, evaluations, courses, active periods)
- Recent activity list
- Email notifications shortcut
- Sentiment Analysis Overview chart
- Quick action cards to other pages

### **Changes Required**

#### ❌ **REMOVE**
1. **System Health Status card** - Remove entire card
   - Lines showing server status, database status, API status
   - This technical info not needed for admin user

2. **Sentiment Analysis Overview** - Remove chart section
   - Bar chart showing positive/neutral/negative sentiment
   - Reason: Not the goal of admin role
   - Sentiment analysis should be for staff roles (secretary, dept head, instructor)

#### ✅ **MODIFY**
1. **Make all cards clickable** - Add navigation to respective pages
   - Total Users card → Navigate to `/admin/users`
   - Total Evaluations card → Navigate to `/admin/evaluations` (or relevant page)
   - Total Courses card → Navigate to `/admin/courses`
   - Active Periods card → Navigate to `/admin/periods`

2. **Keep these features**
   - Recent activity list (useful for monitoring)
   - Email notifications shortcut (already implemented)
   - Quick action cards layout

### **Implementation Tasks**
- [ ] Remove SystemHealthStatus component/section
- [ ] Remove SentimentAnalysisOverview component/section
- [ ] Add onClick handlers to stat cards
- [ ] Add hover effects to indicate cards are clickable
- [ ] Test navigation from each card

---

## 2️⃣ **USER MANAGEMENT PAGE** (`UserManagement.jsx`)

### **Current Features**
- User list table with filters (role, search)
- Add User button → Modal form
- Edit User action → Edit modal with "Reset Password" button
- Delete User action
- Individual user creation (one at a time)
- Reset Password action in table
- User statistics

### **Changes Required**

#### ✅ **ADD NEW FEATURE**
1. **Bulk Import Function**
   - **Why**: Many students need to be added, manual one-by-one is inefficient
   - **Format**: CSV/Excel file upload
   - **Required Columns**:
     - `email` (required, unique)
     - `first_name` (required)
     - `last_name` (required)
     - `role` (required: student, instructor, secretary, department_head, admin)
     - `password` (optional, auto-generate if blank)
     - `program` (for students - BSCS-DS, BSIT, BSPSY, etc.)
     - `year_level` (for students - 1st/2nd/3rd/4th Year)
     - `student_number` (for students, optional)
   
   - **UI Components**:
     - "Bulk Import Users" button next to "Add User" button
     - Upload modal with:
       - File upload area (drag & drop)
       - Download CSV template button
       - Preview table (shows first 5 rows)
       - Validation messages (duplicate emails, invalid roles, etc.)
       - Import progress bar
       - Success/Error summary after import
   
   - **Validation Rules**:
     - Check for duplicate emails (in file and in database)
     - Validate role values (must be one of 5 roles)
     - Validate program codes against database
     - Validate year levels (1st/2nd/3rd/4th Year)
     - Show errors for each invalid row
     - Option to skip invalid rows or cancel entire import

   - **Backend Endpoint**: `POST /api/admin/users/bulk-import`

#### ❌ **REMOVE**
2. **Reset Password in Edit User Modal**
   - Currently: Edit modal has "Reset Password" button
   - Reason: There's already a dedicated "Reset Password" action in the table
   - Redundant functionality
   - Keep only the table action button

### **Implementation Tasks**
- [ ] Create CSV template file for bulk import
- [ ] Add "Bulk Import Users" button to UI
- [ ] Create bulk import modal component
- [ ] Add file upload functionality (CSV/Excel parsing)
- [ ] Implement preview table for uploaded data
- [ ] Add validation logic for bulk data
- [ ] Create backend endpoint for bulk user creation
- [ ] Add transaction handling (rollback on error)
- [ ] Implement progress indicator
- [ ] Create success/error summary report
- [ ] Remove "Reset Password" button from Edit User modal
- [ ] Test with 100+ user imports

---

## 3️⃣ **EVALUATION PERIOD MANAGEMENT PAGE** (`EvaluationPeriodManagement.jsx`)

### **Current Features**
- Period list table (name, semester, academic year, dates, status)
- Add Period button → Modal with "name" input
- Edit/Delete actions
- Status toggle (active/inactive)
- **Limited functionality** - needs completion

### **Changes Required**

#### ✅ **ADD FUNCTIONALITY**
1. **Complete Period Management Features**
   - Full CRUD operations (already partially implemented)
   - Backend integration for all actions
   - Period activation/deactivation workflow
   - Validation for overlapping periods

#### ✅ **MODIFY ADD/EDIT PERIOD FORM**
2. **Remove "Name" field**
   - Current: Manual text input for period name
   - New: Auto-generate name from semester + academic year
   - Format: `{Semester} {Academic Year}` (e.g., "1st Semester 2025-2026")

3. **Add Semester Selection**
   - Dropdown with options:
     - `1st Semester`
     - `2nd Semester`
     - `Summer`
   - Required field

4. **Add Academic Year Selection**
   - Format: `YYYY-YYYY` (e.g., "2025-2026")
   - Options: Current year ± 2 years
   - Or: Custom input field with validation

5. **Date Validation - No Past Dates**
   - **Rule**: Cannot select dates that have already passed
   - **Example**: Today is November 16, 2025
     - ❌ Cannot select November 15, 2025 or earlier
     - ✅ Can only select November 16, 2025 or later
   
   - **Implementation**:
     - Start Date: `min={today}` in date picker
     - End Date: `min={startDate || today}` in date picker
     - Show error message if user tries to enter past date
     - Validation on form submit (frontend + backend)
   
   - **Edge Cases**:
     - Editing existing period: Allow keeping current dates even if in past
     - End date must be after start date
     - Warn if period is very short (< 7 days) or very long (> 180 days)

### **Implementation Tasks**
- [ ] Complete backend CRUD operations
- [ ] Remove "name" field from form
- [ ] Add semester dropdown (3 options)
- [ ] Add academic year selection
- [ ] Implement auto-name generation: `{semester} {academicYear}`
- [ ] Add date picker validation (no past dates)
- [ ] Set `min` attribute on date inputs
- [ ] Add client-side validation messages
- [ ] Add backend validation for dates
- [ ] Test edge cases (editing old periods, date ranges)
- [ ] Implement period activation workflow
- [ ] Test period overlap detection

---

## 4️⃣ **COURSE MANAGEMENT PAGE** (`EnhancedCourseManagement.jsx`)

### **Current Features**
- Course list with sections
- Tabs: Courses, Sections, Enrollments, Analytics
- Actions per course:
  - View Details (eye icon)
  - Edit (pencil icon)
  - Archive (box icon)
- Create Section modal
- Analytics tab with charts

### **Changes Required**

#### ❌ **REMOVE**
1. **View Details Action Icon (Eye Icon)**
   - Remove eye icon from actions column
   - Keep the functionality but change the trigger

2. **Analytics Tab**
   - Remove entire Analytics tab from admin view
   - Reason: Analytics should be for Secretary and Department Head roles
   - Admin focuses on CRUD operations, not analysis

#### ✅ **MODIFY**
3. **Replace Archive Icon with View Details (Eye Icon)**
   - Current flow: Archive icon → Archives course
   - New flow: Eye icon (moved from View Details) → Shows course details/sections
   - Result: Only 2 action icons per course
     - Eye icon → View course details (replaces archive)
     - Pencil icon → Edit course (stays same)
   
   - **Note**: Archive functionality removed from admin
     - Courses can be deleted if needed
     - Or: Add "status" field (active/inactive) instead of archive

#### ✅ **ADD NEW FEATURE**
4. **Bulk Enrollment in Enrollment Tab**
   - **Why**: Many subjects and students, manual enrollment is time-consuming
   - **Format**: CSV/Excel upload
   
   - **Required Columns**:
     - `student_number` or `student_email` (to identify student)
     - `class_section_id` or `class_code` (to identify section)
     - `semester` (e.g., "1st Semester")
     - `academic_year` (e.g., "2025-2026")
   
   - **UI Components**:
     - "Bulk Enroll Students" button in Enrollments tab
     - Upload modal similar to bulk user import:
       - CSV template download
       - File upload (drag & drop)
       - Preview table
       - Validation (check if student/section exists)
       - Progress indicator
       - Success/Error summary
   
   - **Validation Rules**:
     - Verify student exists in database
     - Verify section exists and is active
     - Check if student already enrolled (prevent duplicates)
     - Verify student's program matches course requirements
     - Validate semester and academic year format
   
   - **Backend Endpoint**: `POST /api/admin/sections/bulk-enroll`

### **Implementation Tasks**
- [ ] Remove "View Details" eye icon from actions
- [ ] Remove "Analytics" tab entirely
- [ ] Replace archive icon with eye icon (for view details)
- [ ] Update onClick handler for eye icon
- [ ] Remove archive functionality (or convert to status toggle)
- [ ] Create bulk enrollment CSV template
- [ ] Add "Bulk Enroll Students" button in Enrollments tab
- [ ] Create bulk enrollment modal component
- [ ] Add CSV parsing for enrollment data
- [ ] Implement enrollment preview table
- [ ] Add validation for enrollment data
- [ ] Create backend endpoint for bulk enrollment
- [ ] Handle enrollment conflicts (already enrolled)
- [ ] Show enrollment progress
- [ ] Display success/error summary
- [ ] Test with 500+ enrollment records

---

## 5️⃣ **SYSTEM SETTINGS PAGE** (`SystemSettings.jsx`)

### **Current Features**
- Tabs: General, Email, Security, Backup
- General tab: System name, maintenance mode, etc.
- Email tab: SMTP configuration
- Security tab: Password policies, session timeout
- Backup tab: Database backup/restore

### **Changes Required**

#### ❌ **REMOVE**
1. **General Tab**
   - Remove entire tab
   - Settings like system name, maintenance mode not needed for admin

2. **Email Tab**
   - Remove entire tab
   - Email configuration can be done in backend config files
   - Not needed in admin UI

#### ✅ **KEEP**
3. **Security Tab** - KEEP AS IS
   - Password policies (min length, complexity)
   - Session timeout settings
   - Login attempt limits
   - Account lockout settings

4. **Backup Tab** - KEEP AS IS
   - Manual database backup
   - Backup restore functionality
   - Backup schedule configuration
   - Backup history/list

### **Implementation Tasks**
- [ ] Remove "General" tab component
- [ ] Remove "Email" tab component
- [ ] Update tab navigation (only 2 tabs now)
- [ ] Verify Security tab still works
- [ ] Verify Backup tab still works
- [ ] Update page layout for fewer tabs
- [ ] Test all remaining functionality

---

## 6️⃣ **DATA EXPORT CENTER PAGE** (`DataExportCenter.jsx`)

### **Current Features**
- Export format selection tabs at top (CSV, Excel, JSON, PDF)
- Export categories:
  - Export Users
  - Export Evaluations
  - Export Courses
  - Export Analytics
- Each category button triggers download in selected format
- Export history table

### **Changes Required**

#### ❌ **REMOVE**
1. **Export Format Selection Tabs at Top**
   - Remove: CSV | Excel | JSON | PDF tabs
   - Current flow: Select format → Click export category → Download
   - Too many steps, format selection should be per-export

#### ✅ **MODIFY - NEW FLOW**
2. **Format Selection via Modal Pop-up**
   - **New Flow**:
     1. User clicks "Export Users" (or any category)
     2. Modal pops up with:
        - Title: "Export Users"
        - Radio buttons for format selection:
          - ○ CSV (.csv)
          - ○ Excel (.xlsx)
          - ○ JSON (.json)
          - ○ PDF (.pdf)
        - Optional filters (date range, role, etc.)
        - "Export" button
        - "Cancel" button
     3. User selects format
     4. User clicks "Export" → File downloads
   
   - **Benefits**:
     - Fewer clicks
     - Format choice is contextual
     - Can add category-specific options in same modal
     - Cleaner UI without top tabs

   - **Modal Options per Category**:
     - **Export Users**:
       - Format selection (CSV/Excel/JSON/PDF)
       - Role filter (All, Students, Instructors, etc.)
       - Program filter (for students)
     
     - **Export Evaluations**:
       - Format selection
       - Date range picker
       - Program filter
       - Semester filter
       - Instructor filter
     
     - **Export Courses**:
       - Format selection
       - Program filter
       - Status filter (Active/Archived)
     
     - **Export Analytics**:
       - Format selection
       - Report type (Summary, Detailed, Trends)
       - Date range

### **Implementation Tasks**
- [ ] Remove format selection tabs from top
- [ ] Create ExportModal component
- [ ] Add format radio button group
- [ ] Add category-specific filter options
- [ ] Connect modal to each export button
- [ ] Update export API calls to include format parameter
- [ ] Test each export category
- [ ] Verify file downloads correctly
- [ ] Test with different format selections
- [ ] Update export history to show chosen format

---

## 📊 **IMPACT SUMMARY**

### **Pages Modified: 6 of 8 Admin Pages**

| Page | Changes | Complexity | Estimated Time |
|------|---------|------------|----------------|
| AdminDashboard | Remove 2 sections, add click handlers | Low | 2 hours |
| UserManagement | Add bulk import, remove button | High | 8 hours |
| EvaluationPeriodManagement | Add functionality, modify form, date validation | Medium | 6 hours |
| EnhancedCourseManagement | Remove tab, change icons, add bulk enrollment | High | 10 hours |
| SystemSettings | Remove 2 tabs | Low | 1 hour |
| DataExportCenter | Change flow, add modal | Medium | 4 hours |
| **Total Estimated Time** | | | **~31 hours** |

### **New Features Added: 2**
1. Bulk User Import (CSV/Excel)
2. Bulk Student Enrollment (CSV/Excel)

### **Features Removed: 6**
1. System Health Status card
2. Sentiment Analysis Overview
3. Analytics tab (moved to staff roles)
4. General Settings tab
5. Email Settings tab
6. Export format tabs

### **Backend Endpoints to Add: 2**
1. `POST /api/admin/users/bulk-import`
2. `POST /api/admin/sections/bulk-enroll`

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Quick Wins (3-4 hours)**
1. AdminDashboard - Remove sections, add click handlers
2. SystemSettings - Remove tabs
3. DataExportCenter - Remove format tabs (prepare for modal)

### **Phase 2: Form Modifications (6-8 hours)**
4. EvaluationPeriodManagement - Modify form, add date validation
5. EnhancedCourseManagement - Remove analytics tab, change icons
6. UserManagement - Remove reset password button from modal

### **Phase 3: Bulk Import Features (16-20 hours)**
7. UserManagement - Add bulk import functionality
8. EnhancedCourseManagement - Add bulk enrollment
9. Create backend endpoints for bulk operations
10. Extensive testing with large datasets

### **Phase 4: Export Modal (4-5 hours)**
11. DataExportCenter - Create export modal
12. Add category-specific filters
13. Test all export formats

---

## ⚠️ **IMPORTANT NOTES**

1. **DO NOT START IMPLEMENTATION YET**
   - This is a planning document only
   - Wait for approval before making changes

2. **Backup Before Changes**
   - Create git branch: `admin-overhaul`
   - Backup database before testing bulk imports
   - Keep current version for rollback

3. **Testing Requirements**
   - Test bulk import with 100+ users
   - Test bulk enrollment with 500+ records
   - Test date validation edge cases
   - Verify all navigation links work
   - Check mobile responsiveness

4. **Data Migration**
   - Existing data should not be affected
   - Old evaluation periods keep their manual names
   - New periods use auto-generated names

5. **User Communication**
   - Create CSV template documentation
   - Write user guide for bulk import
   - Document new export modal flow

---

## 📝 **CURRENT ADMIN FILES TO MODIFY**

### **Frontend Files**
```
New/capstone/src/pages/admin/
├── AdminDashboard.jsx          ← MODIFY (remove sections, add clicks)
├── UserManagement.jsx          ← MODIFY (add bulk import, remove button)
├── EvaluationPeriodManagement.jsx  ← MODIFY (add functionality, change form)
├── EnhancedCourseManagement.jsx    ← MODIFY (remove tab, add bulk enroll)
├── SystemSettings.jsx          ← MODIFY (remove 2 tabs)
├── DataExportCenter.jsx        ← MODIFY (add modal, remove tabs)
├── AuditLogViewer.jsx          ← NO CHANGES
└── EmailNotifications.jsx      ← NO CHANGES
```

### **Backend Files**
```
Back/App/routes/
├── system_admin.py     ← ADD bulk import/enroll endpoints
└── admin.py           ← MODIFY existing endpoints if needed
```

---

## ✅ **APPROVAL CHECKLIST**

- [ ] User reviewed all planned changes
- [ ] User approved dashboard modifications
- [ ] User approved bulk import requirements
- [ ] User approved evaluation period changes
- [ ] User approved course management changes
- [ ] User approved system settings simplification
- [ ] User approved data export flow changes
- [ ] User confirmed CSV template format
- [ ] User ready to proceed with implementation

---

**Document Status**: ✅ **COMPLETE - AWAITING APPROVAL**  
**Next Step**: User reviews and approves before implementation begins

---

**Created**: November 16, 2025  
**Last Updated**: November 16, 2025  
**Version**: 1.0
