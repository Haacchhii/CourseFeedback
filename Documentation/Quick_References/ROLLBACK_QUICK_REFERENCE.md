# ⏪ ROLLBACK QUICK REFERENCE CARD

## 🆘 EMERGENCY: I Advanced Students By Mistake!

### **STEP 1: Don't Panic** ✅
You have a snapshot backup created automatically!

### **STEP 2: Go to Rollback Tab** 🏃
Admin Dashboard → Student Management → ⏪ Rollback/Undo tab

### **STEP 3: Preview First** 🔍
- Select latest snapshot (or specific one)
- ✅ Keep "Dry Run Mode" CHECKED
- Click "Preview Rollback"
- Review the changes

### **STEP 4: Execute** ⚡
- ☐ Uncheck "Dry Run Mode"
- Click "Execute Rollback"
- Confirm warning
- ✅ Done! Students restored!

---

## 📋 When to Use

### ✅ **USE ROLLBACK:**
- Advanced too early (wrong date)
- Advanced wrong program
- Advanced wrong year level
- System error during advancement
- Testing that went wrong

### ❌ **DON'T USE ROLLBACK:**
- Students already evaluated in new semester
- Enrollments already created for new period
- Data already exported/reported
- More than 24 hours have passed

---

## 🔑 Key Features

- **Automatic**: Snapshot created every time you advance
- **Fast**: Rollback takes seconds
- **Safe**: Dry run mode prevents accidents
- **Complete**: Restores exact state before advancement
- **Tracked**: Full audit log of all operations

---

## 💾 Where Snapshots Come From

**Automatic Creation:**
- Every year advancement operation
- Before any student year level changes

**Manual Creation:**
- Admin Dashboard → Student Management → Rollback tab
- Click "Create Manual Snapshot" (if added)

---

## 🎯 What Gets Rolled Back

### ✅ **YES - Rolled Back:**
- Student year levels (1, 2, 3, 4)
- Exact state from snapshot

### ❌ **NO - Not Affected:**
- Enrollments (separate operation)
- Evaluations already submitted
- Student personal data
- Programs or sections

---

## 📞 Support

**If rollback doesn't work:**
1. Check database backup
2. Review audit logs
3. Manual SQL update as last resort
4. Contact system administrator

---

## 🎓 Success Story

**Before Rollback:**
- 175 students accidentally advanced in January
- Should happen in May after 3rd semester
- Students seeing wrong year level

**After Rollback:**
- Selected snapshot from 5 minutes ago
- Previewed changes (175 students)
- Executed rollback
- ✅ All students back to correct year level
- Total time: 2 minutes

---

**Remember: Always preview first! The dry run is your friend.** 🛡️
