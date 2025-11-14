# 🔧 CRITICAL FIX - STEP BY STEP INSTRUCTIONS

**Problem:** Evaluation submission showing "[object Object]" error
**Root Cause:** Database schema missing columns for 21-question evaluation system
**Time to Fix:** 10 minutes

---

## STEP 1: Run the Database Migration SQL

### Option A: Using pgAdmin (Recommended)

1. **Open pgAdmin** (your PostgreSQL management tool)

2. **Connect to your database:**
   - Find your database in the left sidebar (probably named something like `course_feedback` or `thesis_db`)
   - Right-click on it

3. **Open Query Tool:**
   - Click "Query Tool" from the menu
   - OR press `Alt+Shift+Q`

4. **Load the SQL file:**
   - Click "Open File" button (folder icon)
   - Navigate to: `Back/database_schema/02_UPGRADE_EVALUATION_SCHEMA.sql`
   - Click Open

5. **Execute the SQL:**
   - Click the "Execute/Run" button (▶️ play icon)
   - OR press `F5`

6. **Verify Success:**
   - You should see messages like:
     ```
     ✅ Converted courses.semester from VARCHAR to INTEGER
     ✅ Added missing columns to evaluations table
     ✅ Created performance indexes
     ✅ DATABASE SCHEMA UPGRADE COMPLETE!
     ```

7. **Check Results:**
   - Scroll down in the output panel
   - You should see tables showing the new columns

---

### Option B: Using Command Line (psql)

1. **Open PowerShell**

2. **Navigate to database_schema folder:**
   ```powershell
   cd "C:\Users\Jose Iturralde\Documents\1 thesis\Back\database_schema"
   ```

3. **Run the SQL file:**
   ```powershell
   psql -U postgres -d your_database_name -f 02_UPGRADE_EVALUATION_SCHEMA.sql
   ```
   
   Replace:
   - `postgres` with your database username
   - `your_database_name` with your actual database name (check Supabase dashboard or your connection string)

4. **Enter password when prompted**

5. **Verify output shows success messages**

---

### Option C: Using Supabase Dashboard (If using Supabase)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Open your project

2. **Navigate to SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy the SQL content:**
   - Open `Back/database_schema/02_UPGRADE_EVALUATION_SCHEMA.sql`
   - Copy ALL the content (Ctrl+A, Ctrl+C)

4. **Paste and Run:**
   - Paste into Supabase SQL Editor
   - Click "Run" button (bottom right)

5. **Wait for completion:**
   - Should take 2-5 seconds
   - Check for success messages

---

## STEP 2: Restart Your Backend Server

After running the SQL:

1. **Stop the current backend:**
   - In VS Code, find the terminal running `uvicorn`
   - Press `Ctrl+C` to stop it

2. **Restart the backend:**
   - The server should auto-restart (watch mode)
   - OR manually run:
     ```powershell
     cd Back\App
     uvicorn main:app --reload --port 8000
     ```

3. **Verify startup:**
   - Look for: `✅ Database connection successful!`
   - Look for: `INFO: Application startup complete.`

---

## STEP 3: Test Evaluation Submission

1. **Open your frontend** (if not already open)
   ```powershell
   cd New\capstone
   npm run dev
   ```

2. **Login as a student:**
   - Email: `student1@lpu.edu.ph`
   - Password: `student123`

3. **Go to evaluation page**

4. **Select a course**

5. **Fill all 21 questions** (rate 1-4 for each)

6. **Add optional comment**

7. **Click "Submit Evaluation"**

8. **Check for success:**
   - ✅ Should see: "Evaluation submitted successfully!"
   - ❌ If still error: Check backend terminal for error messages

---

## STEP 4: Verify in Database

After successful submission:

1. **Go back to pgAdmin/Supabase**

2. **Run this query:**
   ```sql
   SELECT 
       id,
       student_id,
       ratings,
       sentiment,
       sentiment_score,
       is_anomaly,
       submitted_at
   FROM evaluations
   ORDER BY id DESC
   LIMIT 5;
   ```

3. **Check results:**
   - `ratings` column should have JSON like: `{"1": 3, "2": 4, "3": 3, ...}`
   - `sentiment` should show: `positive`, `neutral`, or `negative`
   - `is_anomaly` should be `false` (or `true` if detected)

---

## 🚨 TROUBLESHOOTING

### Error: "relation evaluations does not exist"
**Solution:** Run the main database setup first:
```sql
-- In pgAdmin, run this first:
\i 'C:/Users/Jose Iturralde/Documents/1 thesis/Back/database_schema/DATABASE_COMPLETE_SETUP.sql'
```

### Error: "permission denied"
**Solution:** Make sure you're connected as database owner or superuser

### Error: "column ratings already exists"
**Solution:** This is OK! The script uses `ADD COLUMN IF NOT EXISTS`, so it won't fail. Just means it was already added.

### Still showing "[object Object]" error:
1. Check backend terminal for actual error
2. Verify SQL ran successfully (check for ✅ messages)
3. Verify backend restarted after SQL changes
4. Clear browser cache (Ctrl+Shift+R)
5. Check browser console (F12) for frontend errors

### Error: "column c.units does not exist"
**Solution:** The SQL script adds this. Make sure:
1. SQL script ran successfully
2. Backend was restarted AFTER running SQL
3. Check with: `SELECT column_name FROM information_schema.columns WHERE table_name='courses' AND column_name='units';`

---

## 📝 WHAT THE SQL SCRIPT DOES

1. **Adds missing columns to `evaluations` table:**
   - `ratings` (JSONB) - Stores all 21 question responses
   - `sentiment_score` (FLOAT) - ML confidence
   - `is_anomaly` (BOOLEAN) - Anomaly flag
   - `anomaly_score` (FLOAT) - Anomaly confidence
   - `metadata` (JSONB) - Tracking data
   - `text_feedback` (TEXT) - Additional comments
   - `processing_status` (VARCHAR) - Workflow state

2. **Fixes `courses.semester` type:**
   - Converts from VARCHAR to INTEGER
   - Maps "First Semester" → 1, "Second Semester" → 2

3. **Ensures `courses.units` exists:**
   - Adds column if missing

4. **Creates performance indexes:**
   - Speeds up queries on sentiment, anomalies, ratings

---

## ✅ SUCCESS INDICATORS

After completing all steps, you should see:

1. **In Backend Terminal:**
   ```
   INFO: Application startup complete.
   (No errors about missing columns)
   ```

2. **In Frontend:**
   - Evaluation form submits without "[object Object]" error
   - Shows success message
   - Redirects or updates UI

3. **In Database:**
   - New evaluation records with `ratings` JSON data
   - `sentiment` column populated
   - `is_anomaly` set to true/false

---

**Next Steps After This Fix:**
- Test with multiple evaluations
- Check if sentiment analysis works
- Verify anomaly detection
- Test as different user roles

**Estimated Time:** 10 minutes total
**Difficulty:** Easy (just run SQL and restart)

---

**Need Help?** 
- If stuck at any step, take a screenshot of the error
- Check the backend terminal output
- Verify which step failed
