# Quick Setup Guide for Presentation Demo Data

## Problem
You need test users for tomorrow's presentation but don't have access to real LPU accounts.

## Solution: Use Demo Email Domain

Since your system **doesn't send real emails** (you removed that feature), emails are just identifiers. You can use fake but realistic-looking emails.

---

## Step-by-Step Setup (15 minutes)

### Step 1: Generate Demo Users CSV Files

```bash
cd "C:\Users\Jose Iturralde\Documents\1 thesis"
python create_demo_users.py
```

This creates:
- `demo_users_all.csv` - All 226 users (2 admins, 7 dept heads, 7 secretaries, 210 students)
- `demo_users_system_admin.csv` - 2 admins
- `demo_users_department_head.csv` - 7 department heads
- `demo_users_secretary.csv` - 7 secretaries  
- `demo_users_student.csv` - 210 students across all programs

### Step 2: Import Users via Admin Panel

1. **Start your backend:**
   ```bash
   cd "Back\App"
   python main.py
   ```

2. **Login as existing admin** (or create one manually in database)

3. **Go to User Management** → **Import CSV**

4. **Upload** one of the generated CSV files:
   - Start with `demo_users_all.csv` for bulk import
   - Or import role-by-role if you prefer

### Step 3: Test Demo Accounts

**System Admin:**
- Email: `admin1@demo.lpu.edu.ph`
- Password: `lpub@admin1`

**Department Head (BSIT):**
- Email: `depthead1@demo.lpu.edu.ph`
- Password: `lpub@dept1`

**Secretary (BSIT):**
- Email: `secretary1@demo.lpu.edu.ph`
- Password: `lpub@sec1`

**Student:**
- Email: `student1@demo.lpu.edu.ph`
- Password: `lpub@20210001`

---

## What Makes This Safe for Demo

✅ **Fake but realistic emails**: `@demo.lpu.edu.ph` - clearly test data
✅ **No real emails sent**: You removed email functionality
✅ **Consistent passwords**: Easy to remember for demo (`lpub@` + identifier)
✅ **Complete data**: 210 students across 7 programs
✅ **Ready for evaluation**: Students can submit evaluations immediately

---

## Generated User Breakdown

| Role | Count | Email Pattern | Password Pattern |
|------|-------|---------------|------------------|
| System Admin | 2 | `admin1@demo.lpu.edu.ph` | `lpub@admin1` |
| Department Head | 7 | `depthead1-7@demo.lpu.edu.ph` | `lpub@dept1-7` |
| Secretary | 7 | `secretary1-7@demo.lpu.edu.ph` | `lpub@sec1-7` |
| Student | 210 | `student1-210@demo.lpu.edu.ph` | `lpub@20210001-20210210` |
| **TOTAL** | **226** | | |

**Programs covered:** BSIT, BSCS-DS, BAPSY, BSPSY, ABCOMM, BMA, BS-CYBER
**Students per program:** 30 (distributed across year levels 1-4)

---

## Alternative: If CSV Import Doesn't Work

If your CSV import has issues, you can create users manually via SQL:

```bash
cd "Back\App"
python create_demo_users_sql.py  # Will create this next if needed
```

---

## After Presentation

You can:
1. **Keep the demo data** - Just change passwords for security
2. **Delete demo users** - Filter by `@demo.lpu.edu.ph` and bulk delete
3. **Start fresh** - Drop all tables and recreate with real data later

---

## Troubleshooting

**Q: Import shows "Email already exists"**
A: Skip duplicates or clear existing users first

**Q: Can't login with demo accounts**
A: Check that users were created with `first_login = false` so password is already set

**Q: Need more students?**
A: Edit `create_demo_users.py` and change `range(30)` to `range(50)` for 50 students per program

**Q: Want different passwords?**
A: Edit the script before running, change password pattern

---

## Quick Commands Reference

```bash
# Generate demo users
python create_demo_users.py

# Start backend
cd Back\App
python main.py

# Check if users created (via database)
cd Back\App
python check_users.py
```

---

## Presentation Tips

🎯 **During demo:**
- Mention this is test data for demonstration
- Use `admin1@demo.lpu.edu.ph` for admin features
- Use `student1@demo.lpu.edu.ph` for student view
- Show different programs by logging in as different dept heads

📊 **For evaluation demo:**
- Students can submit evaluations immediately
- ML models will analyze submissions in real-time
- Anomaly detection will flag suspicious patterns
- Reports show all 7 programs' data

🎨 **Make it realistic:**
- Diverse names (already included)
- Multiple year levels (auto-distributed)
- Complete program coverage (all 7 programs)
- Realistic student numbers (2021xxxx format)

---

**You're ready! Generate the CSVs, import them, and you have a fully populated system for tomorrow's presentation.** 🚀
