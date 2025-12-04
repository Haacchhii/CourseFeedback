# 🌐 Web Interface: Student Year Level Advancement
**Complete User Guide for Admin Dashboard**

---

## 📍 How to Access

1. **Login as Admin**
   - Go to your system URL (e.g., `http://localhost:5173`)
   - Login with admin credentials

2. **Navigate to Student Management**
   - From Admin Dashboard, click **"Student Management"** card
   - OR go directly to: `/admin/student-management`

---

## 🎯 Three Main Features

### **1. 📊 Overview Tab**
View current student distribution and advancement eligibility.

**What You'll See:**
- Total students eligible for advancement
- Breakdown by year transitions (Year 1→2, 2→3, 3→4)
- Detailed program-by-program breakdown
- Student counts per year level per program

**Example Display:**
```
Total Eligible: 175 students
  Year 1 → Year 2: 57 students
  Year 2 → Year 3: 60 students
  Year 3 → Year 4: 58 students

BSIT (Information Technology):
  Year 1: 15 students
  Year 2: 15 students
  Year 3: 13 students
  Total: 43 eligible
```

---

### **2. 🎓 Year Advancement Tab**
Advance students to next year level after completing academic year.

#### **Step-by-Step Process:**

**Step 1: Apply Filters (Optional)**
- **Filter by Program**: Select specific program (e.g., BSIT only)
- **Filter by Year Level**: Select specific year (e.g., Year 1 only)
- Leave blank to advance ALL eligible students

**Step 2: Dry Run (RECOMMENDED)**
- ✅ Keep "Dry Run Mode" checked
- Click **"🔍 Preview Advancement"**
- Review preview results:
  - See exactly which students will be advanced
  - View how many students per transition
  - Check student names and programs

**Step 3: Execute (After Confirming Preview)**
- ☑️ Uncheck "Dry Run Mode"
- Click **"✅ Execute Advancement"**
- Confirm warning dialog
- System advances students permanently

**Safety Features:**
- Dry run shows preview without changes
- Confirmation modal for real execution
- Only Years 1-3 are advanced (Year 4 stays)
- Clear success/error messages

---

### **3. 🔄 Enrollment Transition Tab**
Copy enrollments from one evaluation period to another.

#### **When to Use:**
- **Same Year Transition** (1st→2nd sem, 2nd→3rd sem):
  - Leave "Advance Year Level" unchecked
  - Students keep same year level
  
- **New Academic Year** (3rd sem→1st sem next year):
  - ✅ Check "Advance Year Level"
  - Students advance to next year

#### **Step-by-Step Process:**

**Step 1: Select Periods**
- **From Period**: Source evaluation period (e.g., "1st Semester 2024-2025")
- **To Period**: Target evaluation period (e.g., "2nd Semester 2024-2025")

**Step 2: Year Advancement Option**
- ☑️ Check "Advance Year Level" ONLY if transitioning to new academic year
- Leave unchecked for same-year semester transitions

**Step 3: Dry Run (RECOMMENDED)**
- ✅ Keep "Dry Run Mode" checked
- Click **"🔍 Preview Transition"**
- Review preview:
  - Students affected count
  - Enrollments to be created
  - Whether year will advance
  - New academic year detection

**Step 4: Execute (After Confirming Preview)**
- ☑️ Uncheck "Dry Run Mode"
- Click **"✅ Execute Transition"**
- Confirm warning dialog
- System creates enrollments permanently

---

## 📅 Typical School Year Workflow

### **Scenario 1: End of 1st Semester → Start 2nd Semester**

**Goal**: Move students to 2nd semester (SAME year level)

1. Go to **"🔄 Enrollment Transition"** tab
2. From Period: `1st Semester 2024-2025`
3. To Period: `2nd Semester 2024-2025`
4. ☐ Leave "Advance Year Level" **UNCHECKED**
5. ✅ Dry Run → Preview
6. ☐ Uncheck Dry Run → Execute

**Result**: Students enrolled in 2nd semester courses, year level stays same

---

### **Scenario 2: End of 2nd Semester → Start 3rd Semester**

**Goal**: Move students to 3rd semester (SAME year level)

1. Go to **"🔄 Enrollment Transition"** tab
2. From Period: `2nd Semester 2024-2025`
3. To Period: `3rd Semester 2024-2025`
4. ☐ Leave "Advance Year Level" **UNCHECKED**
5. ✅ Dry Run → Preview
6. ☐ Uncheck Dry Run → Execute

**Result**: Students enrolled in summer courses, year level stays same

---

### **Scenario 3: End of 3rd Semester → New Academic Year (1st Semester)**

**Goal**: Advance students AND transition enrollments

#### **Option A: Two-Step Process (RECOMMENDED)**

**First: Advance Students**
1. Go to **"🎓 Year Advancement"** tab
2. Leave filters blank (all students)
3. ✅ Dry Run → Preview
4. ☐ Uncheck Dry Run → Execute
   - Year 1 → Year 2 ✓
   - Year 2 → Year 3 ✓
   - Year 3 → Year 4 ✓

**Then: Transition Enrollments**
1. Go to **"🔄 Enrollment Transition"** tab
2. From Period: `3rd Semester 2024-2025`
3. To Period: `1st Semester 2025-2026`
4. ☐ Leave "Advance Year Level" **UNCHECKED** (already done)
5. ✅ Dry Run → Preview
6. ☐ Uncheck Dry Run → Execute

#### **Option B: One-Step Process**

1. Go to **"🔄 Enrollment Transition"** tab
2. From Period: `3rd Semester 2024-2025`
3. To Period: `1st Semester 2025-2026`
4. ☑️ **CHECK "Advance Year Level"**
5. ✅ Dry Run → Preview
6. ☐ Uncheck Dry Run → Execute

**Result**: Students advanced to next year AND enrolled in new semester

---

## 🔐 Security & Safety Features

### **Dry Run Mode (Default)**
- ✅ Always enabled by default
- Shows preview of changes
- NO database modifications
- Safe to run multiple times
- Recommended before every execution

### **Confirmation Dialogs**
- ⚠️ Warning modal before real execution
- Clear description of permanent changes
- Cancel button to abort
- Prevents accidental execution

### **Access Control**
- 🔒 Admin-only access to Year Advancement
- 🔒 Admin/Secretary access to Enrollment Transitions
- Role-based permissions enforced
- JWT authentication required

### **Error Handling**
- Clear error messages
- Failed operations don't partially complete
- Rollback support for issues
- Audit logs track all changes

---

## 📊 Results Display

### **After Dry Run:**
```
🔍 Preview Results

175 students WOULD BE advanced

Year 1 → Year 2: 57 students
  • 2022-00003 - Pedro Santos (BSCS-DS)
  • 2022-00004 - Ana Garcia (BSCS-DS)
  ... and 52 more

💡 This was a preview. Uncheck "Dry Run Mode" to execute.
```

### **After Real Execution:**
```
✅ Advancement Complete!

175 students WERE advanced

Year 1 → Year 2: 57 students
Year 2 → Year 3: 60 students
Year 3 → Year 4: 58 students
```

### **Transition Results:**
```
✅ Transition Complete!

From Period: 1st Semester 2024-2025
To Period: 2nd Semester 2024-2025
New Academic Year: No
Students Affected: 240
Enrollments Created: 1,200
Students Advanced: 0
```

---

## 🎨 UI Components

### **Tab Navigation**
- 📊 **Overview**: View eligibility
- 🎓 **Year Advancement**: Promote students
- 🔄 **Enrollment Transition**: Move enrollments

### **Color Coding**
- 🔴 **Red (Maroon)**: LPU brand, primary actions
- 🔵 **Blue**: Preview/Info messages
- 🟡 **Yellow**: Dry run warnings
- 🟢 **Green**: Success confirmations
- ⚠️ **Orange**: Warning confirmations

### **Interactive Elements**
- Dropdown filters (programs, year levels, periods)
- Checkboxes (dry run, auto-advance)
- Action buttons (preview, execute, reset)
- Modal confirmations
- Loading spinners
- Error alerts

---

## 💡 Best Practices

### **1. Always Preview First**
- ✅ Use dry run for every operation
- Review student lists carefully
- Check counts match expectations
- Verify programs and year levels

### **2. Backup Before Major Changes**
- Export data before year-end advancement
- Use Data Export Center
- Keep CSV backups of students/enrollments

### **3. Schedule During Off-Hours**
- Run advancement when students aren't active
- Avoid peak evaluation periods
- Inform staff of maintenance window

### **4. Test Incrementally**
- Try advancing one program first
- Verify results before advancing all
- Use filters to test small batches

### **5. Document Changes**
- Note dates of advancement
- Keep records of transitions
- Log any issues encountered

---

## 🚨 Troubleshooting

### **"No students eligible for advancement"**
- Check if students are marked `is_active = true`
- Verify year levels are 1, 2, or 3 (Year 4 not advanced)
- Ensure students exist in database

### **"Evaluation period not found"**
- Create evaluation periods first (Admin → Periods)
- Verify period IDs are correct
- Check period status (active/closed/upcoming)

### **"Operation timed out"**
- Large dataset may take time
- Refresh and check if operation completed
- Check backend logs for errors

### **"No enrollments created"**
- Verify class sections exist for target period
- Check course-program-year level matching
- Ensure students have valid program assignments

---

## 🎓 Real-World Example

### **LPU Lyceum - End of Academic Year 2024-2025**

**Current State:**
- 240 students across 7 programs
- Completed 3rd Semester (Summer)
- Ready for Academic Year 2025-2026

**Admin Process:**

1. **Login**: Admin Maria logs in
2. **Navigate**: Admin Dashboard → Student Management
3. **Check Overview**: 175 students eligible
4. **Preview**: Dry run shows correct counts
5. **Advance**: Execute year advancement
   - 57 students: Year 1 → Year 2 ✓
   - 60 students: Year 2 → Year 3 ✓
   - 58 students: Year 3 → Year 4 ✓
6. **Create New Period**: Create "1st Semester 2025-2026"
7. **Transition**: Copy enrollments from Period 14 → Period 15
8. **Verify**: Check enrollment counts
9. **Open Period**: Activate new evaluation period
10. **Notify**: Email students about new semester

**Result**: ✅ All students advanced and enrolled for new year!

---

## 📞 Need Help?

**For Technical Issues:**
- Check backend server logs
- Review API responses in browser console
- Contact system administrator

**For Academic Questions:**
- Consult registrar's office
- Verify student year level policies
- Confirm advancement requirements

---

**System Status:** ✅ Production Ready  
**Last Updated:** December 2, 2025  
**Version:** 1.0.0
