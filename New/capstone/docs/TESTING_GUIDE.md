# Testing Guide: Course Evaluation Questionnaire System

## ✅ All Courses Now Active!

All **83 courses** across **7 programs** have been activated and are now available for student evaluation.

---

## 🧪 Testing the System

### Step 1: Login as a Student

**Test Accounts:**

#### BSIT Students
- **Email:** `maria.santos.bsit1@lpubatangas.edu.ph`
- **Password:** `changeme`
- **Program:** BSIT Year 1
- **Can Evaluate:** 5 courses (Year 1 courses)

#### BSCS-DS Students
- **Email:** `sophia.martinez.bscsds1@lpubatangas.edu.ph`
- **Password:** `changeme`
- **Program:** BSCS-DS Year 1
- **Can Evaluate:** 4 courses

#### BS-CY Students
- **Email:** `lucas.hernandez.bscy1@lpubatangas.edu.ph`
- **Password:** `changeme`
- **Program:** BS-CY Year 1
- **Can Evaluate:** 3 courses

#### BMA Students
- **Email:** `zoe.valdez.bma1@lpubatangas.edu.ph`
- **Password:** `changeme`
- **Program:** BMA Year 1
- **Can Evaluate:** 3 courses

#### BS-Psychology Students
- **Email:** `emma.santos.bspsy1@lpubatangas.edu.ph`
- **Password:** `changeme`
- **Program:** BS-Psychology Year 1
- **Can Evaluate:** 4 courses

#### AB-Psychology Students
- **Email:** `ava.torres.abpsy1@lpubatangas.edu.ph`
- **Password:** `changeme`
- **Program:** AB-Psychology Year 1
- **Can Evaluate:** 4 courses

---

### Step 2: Navigate to Course Evaluation

1. After login, click **"Course Evaluation"** in the navigation menu
2. You should see a list of **active courses** for your program and year level
3. All courses should show a green **"Active"** badge
4. Click **"Evaluate"** button on any course

---

### Step 3: Complete the Questionnaire

**What to Test:**

#### ✅ Visual Elements
- [ ] Modal opens with course information displayed
- [ ] Instructions section shows 4-point rating scale
- [ ] All 6 categories are visible
- [ ] 27 questions total (count them)
- [ ] Rating buttons (1-4) for each question
- [ ] Comments textarea at the bottom

#### ✅ Interaction
- [ ] Click on different rating values - they should highlight in LPU red
- [ ] All selected ratings stay highlighted
- [ ] Can change selections before submitting
- [ ] Scroll works properly through all categories
- [ ] Cancel button closes modal without saving
- [ ] Submit button works

#### ✅ Validation
- [ ] Try submitting without answering all questions (if validation exists)
- [ ] Check if comments are optional
- [ ] Verify submission shows success message

#### ✅ Data Display
After submission, check the console log for:
```javascript
{
  responses: { /* 27 question responses */ },
  categoryAverages: { /* 6 category averages */ },
  overallAverage: "4.XX",
  sentiment: "positive/neutral/negative",
  comments: "..."
}
```

---

### Step 4: Test Admin Dashboard

**Login as Admin:**
- **Email:** `admin@lpubatangas.edu.ph`
- **Password:** `admin123`

**What to Check:**

#### ✅ Dashboard Display
- [ ] "Detailed Evaluation Category Performance" section appears
- [ ] Bar chart shows 6 categories
- [ ] Color-coded bars (green = good, red = poor)
- [ ] Overall average displayed
- [ ] Performance label shown (Excellent, Very Good, etc.)

#### ✅ Performance Highlights Widget
- [ ] "Top 3 Performing Areas" section (green)
- [ ] "Areas for Improvement" section (orange)
- [ ] Shows category names and averages

#### ✅ Detailed Table
- [ ] All 6 categories listed
- [ ] Average ratings displayed
- [ ] Performance labels shown
- [ ] Response counts visible

#### ✅ Category Legend
- [ ] Shows all category names
- [ ] Number of questions per category
- [ ] Clean, readable layout

---

### Step 5: Test Department Head View

**Login as Department Head:**
- **Email:** `melodydimaano@lpubatangas.edu.ph`
- **Password:** `changeme`
- **Department:** Information Technology (BSIT only)

**Expected Behavior:**
- [ ] Same dashboard features as admin
- [ ] Only sees BSIT data
- [ ] Cannot see other programs
- [ ] All category metrics work

---

## 🐛 Common Issues to Watch For

### Issue #1: No Courses Showing
**Symptom:** Student sees "No courses available"
**Cause:** Student year level doesn't match course year levels
**Solution:** Use Year 1 students to see Year 1 courses

### Issue #2: "Not Ready" or "Evaluation Closed"
**Symptom:** Can't click "Evaluate" button
**Cause:** Course status not set to "active"
**Solution:** Already fixed - all courses are now "Active"

### Issue #3: Empty Dashboard Charts
**Symptom:** No data in category performance charts
**Cause:** No evaluations submitted yet
**Solution:** Submit at least one evaluation first

### Issue #4: Categories Not Displaying
**Symptom:** Questionnaire doesn't show 6 categories
**Check:** Browser console for errors
**Verify:** `questionnaireConfig.js` is loaded correctly

### Issue #5: Calculations Incorrect
**Symptom:** Overall average doesn't match individual ratings
**Check:** Console log after submission
**Verify:** All 27 questions were answered

---

## 📊 Expected Test Results

### After Submitting an Evaluation

**If you rate everything 5 (Strongly Agree):**
- Overall Average: **5.0**
- Sentiment: **Positive**
- All Category Averages: **4.0**
- Performance Label: **Excellent**

**If you rate everything 3 (Agree):**
- Overall Average: **3.0**
- Sentiment: **Positive**
- All Category Averages: **3.0**
- Performance Label: **Good**

**If you rate everything 2 (Disagree):**
- Overall Average: **2.0**
- Sentiment: **Negative**
- All Category Averages: **2.0**
- Performance Label: **Needs Improvement**

**For Mixed Ratings:**
- Should see variance across categories
- Some categories higher/lower than others
- Overall average should be the mean of all 27 responses

---

## 🎯 Success Criteria

### ✅ System is Working If:

1. **Student Side:**
   - ✅ Can see active courses
   - ✅ Questionnaire opens properly
   - ✅ All 27 questions visible
   - ✅ Can select ratings 1-4
   - ✅ Submission shows success message
   - ✅ Console log shows correct data structure

2. **Admin Side:**
   - ✅ Category performance chart displays
   - ✅ Shows 6 categories with data
   - ✅ Colors match performance levels
   - ✅ Performance highlights widget works
   - ✅ Detailed table shows correct info
   - ✅ Category legend is complete

3. **Data Quality:**
   - ✅ Sentiment calculated correctly
   - ✅ Category averages accurate
   - ✅ Overall average is correct
   - ✅ Performance labels appropriate

---

## 🔍 Detailed Testing Checklist

### Frontend Testing

- [ ] **StudentEvaluation.jsx**
  - [ ] Course list loads
  - [ ] Filter by semester works
  - [ ] Search functionality works
  - [ ] Status badges display correctly
  - [ ] Evaluate button opens modal
  - [ ] Modal shows all categories
  - [ ] Rating buttons work
  - [ ] Submit button functions
  - [ ] Cancel button closes modal

- [ ] **Dashboard.jsx**
  - [ ] Category metrics component renders
  - [ ] Bar chart displays correctly
  - [ ] Tooltips show on hover
  - [ ] Performance widget appears
  - [ ] Detailed table is readable
  - [ ] Legend is complete

- [ ] **CategoryMetricsDisplay.jsx**
  - [ ] Chart colors are correct
  - [ ] X-axis labels readable
  - [ ] Y-axis scale is 0-4
  - [ ] Bars show proper heights
  - [ ] Hover tooltips work
  - [ ] Table rows display data

### Data Flow Testing

- [ ] **Questionnaire Config**
  - [ ] All 27 questions load
  - [ ] Categories organized correctly
  - [ ] Rating scale defined
  - [ ] Helper functions work

- [ ] **Data Transformer**
  - [ ] Legacy data transforms
  - [ ] Category averages calculate
  - [ ] Overall average accurate
  - [ ] Sentiment determination correct
  - [ ] Performance colors/labels right

### Integration Testing

- [ ] **Student to Dashboard Flow**
  1. Student submits evaluation
  2. Data saved (console log)
  3. Admin views dashboard
  4. New data reflected in charts
  5. Metrics updated correctly

---

## 📝 Testing Script

Use this script to systematically test the system:

```
1. Open browser, clear cache
2. Navigate to application
3. Login as maria.santos.bsit1@lpubatangas.edu.ph / changeme
4. Go to Course Evaluation
5. Verify 5 courses shown (all Active)
6. Click "Evaluate" on "Introduction to Computing"
7. Verify modal opens with course info
8. Verify 6 category sections visible
9. Count questions - should be 27 total
10. Fill out all questions with rating 5
11. Add comment: "Testing comprehensive questionnaire"
12. Click Submit
13. Verify success message appears
14. Check browser console for data structure
15. Logout
16. Login as admin@lpubatangas.edu.ph / admin123
17. Go to Dashboard
18. Scroll to "Detailed Evaluation Category Performance"
19. Verify chart displays
20. Verify "Performance Highlights" widget shows
21. Check detailed table for data
22. Verify category legend complete
23. Success! ✅
```

---

## 🚨 If Something Goes Wrong

### Debugging Steps:

1. **Open Browser Console (F12)**
   - Check for JavaScript errors
   - Look for failed imports
   - Verify data structure logs

2. **Check Network Tab**
   - Verify all files loaded
   - No 404 errors
   - CSS and JS bundles present

3. **Verify File Structure**
   ```
   src/
   ├── data/
   │   ├── questionnaireConfig.js ✓
   │   └── mock.js ✓
   ├── utils/
   │   └── evaluationDataTransformer.js ✓
   ├── components/
   │   └── CategoryMetricsDisplay.jsx ✓
   └── pages/
       ├── student/
       │   └── StudentEvaluation.jsx ✓
       └── admin/
           └── Dashboard.jsx ✓
   ```

4. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   # or
   yarn dev
   ```

5. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear all browser data

---

## 📈 Performance Benchmarks

**Expected Load Times:**
- Questionnaire modal: < 500ms
- Category chart render: < 1s
- Dashboard full load: < 2s

**Expected Behavior:**
- Smooth scrolling through questionnaire
- No lag when clicking ratings
- Instant feedback on selections
- Fast chart rendering

---

## 🎓 Next Steps After Testing

Once testing is complete:

1. **Document Findings**
   - Note any issues encountered
   - Screenshot interesting results
   - List improvement suggestions

2. **User Feedback**
   - Show to actual students
   - Get instructor opinions
   - Collect admin feedback

3. **Refinements**
   - Adjust questions if needed
   - Tweak UI based on feedback
   - Optimize performance

4. **Deployment Planning**
   - Backend API integration
   - Database schema design
   - Production deployment

---

**Happy Testing! 🚀**

*If you encounter any issues, check the browser console first, then review the implementation files.*
