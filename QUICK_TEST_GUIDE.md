# 🧪 Quick Test Guide - Three New Features

## ✅ Feature 1: Real-Time Dashboard Cards

**Location**: User Management page (top cards)

**Test Steps**:
1. Navigate to `User Management`
2. Check top 4 cards show real numbers (not 0)
3. Create a new student user
4. Verify cards update immediately
5. Delete a user
6. Verify cards update again

**Expected Results**:
- Total Users: Accurate count
- Students: Count of role='student'
- Dept Heads: Count of role='department_head'
- Staff Members: Count of secretaries + admins

---

## ✅ Feature 2: Section Management

**Location**: Course Management → Enrollment Tab

**Test Steps**:

### View Sections
1. Navigate to `Course Management`
2. Click **Enrollment** tab
3. Should see grid of all class sections with:
   - Course code (e.g., "CS101")
   - Course name
   - Section name (e.g., "A", "B")
   - Enrolled student count (large number)
   - Instructor name
   - Schedule and room

### Manage Section Enrollments
4. Click any section card
5. Modal opens showing:
   - **Left**: Currently enrolled students
   - **Right**: Available students (with accounts, not enrolled)

### Enroll Students
6. In right panel, search for student by name or number
7. Check 2-3 students using checkboxes
8. Click **"Enroll (3) Students"** button
9. Should see:
   - Success message
   - Students move from right to left panel
   - Enrolled count updates

### Remove Students
10. In left panel, find a student
11. Click **Remove** button
12. Confirm removal
13. Should see:
    - Success message
    - Student moves from left to right panel
    - Enrolled count decreases

**Expected Behavior**:
- ✅ Only students with user accounts appear
- ✅ Students filtered by program and year level
- ✅ Duplicate enrollments prevented
- ✅ Real-time count updates
- ✅ Search works instantly

---

## ✅ Feature 3: Password Reset

**Location**: User Management page (user table)

**Test Steps**:
1. Navigate to `User Management`
2. Scroll to user table
3. Find any user row
4. Click **Reset Password** button
5. Popup appears asking for new password
6. Enter password: `testpass123` (8+ characters)
7. Click OK
8. Should see success message
9. **Verify**: Log out and log in as that user with new password

**Expected Results**:
- ✅ Password validation (minimum 8 characters)
- ✅ Success message shown
- ✅ Can log in with new password
- ✅ Old password no longer works

**Security Check**:
- Password is bcrypt hashed (not stored in plain text)
- Audit log created (who reset whose password)

---

## 🎯 Quick Smoke Test (2 minutes)

Run this to verify all 3 features work:

1. **Dashboard Cards**: 
   - Visit User Management → Check cards show numbers ✅

2. **Section Management**: 
   - Visit Course Management → Enrollment tab → Click any section → Verify modal opens ✅

3. **Password Reset**: 
   - Visit User Management → Click Reset Password on any user → Enter "changeme123" → Click OK ✅

---

## 🐛 Troubleshooting

### Dashboard shows 0 students
- **Check**: Are there users with `role='student'` in database?
- **Fix**: Create a test student user

### No sections appear in Enrollment tab
- **Check**: Are there class sections in database?
- **Fix**: Create class sections from Courses tab first
- **Note**: Need courses → sections → enrollments hierarchy

### Available students list empty
- **Check**: Are students assigned to correct program and year level?
- **Check**: Do students have user accounts (user_id not null)?
- **Fix**: Create student user accounts or adjust filters

### Password reset fails
- **Check**: Is backend server running on port 8000?
- **Check**: Browser console for error messages
- **Fix**: Restart backend server

---

## 📊 Backend API Test (Using Browser Console or Postman)

### Test Stats Endpoint
```javascript
fetch('http://localhost:8000/admin/users/stats', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(data => console.log(data))
// Should return: { success: true, data: { total_users, students, dept_heads, ... }}
```

### Test Sections Endpoint
```javascript
fetch('http://localhost:8000/admin/sections', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(data => console.log(data))
// Should return: { success: true, data: [...sections with enrollment counts] }
```

### Test Password Reset
```javascript
fetch('http://localhost:8000/admin/users/1/reset-password?current_user_id=1', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ new_password: 'testpass123' })
})
.then(r => r.json())
.then(data => console.log(data))
// Should return: { success: true, message: "Password reset successfully" }
```

---

## ✅ All Tests Passing = Ready for Production! 🚀
