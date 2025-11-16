# Secretary/Department Head Role - Major Overhaul Plan

**Date**: November 16, 2025  
**Status**: Planning Phase - DO NOT IMPLEMENT YET  
**Scope**: Secretary and Department Head roles (merged into one access level)

---

## 📋 **OVERVIEW**

This document outlines the planned major changes to the Secretary and Department Head roles. These changes focus on:
- **Merging both roles** into one access level (department-wide data access)
- **Removing Instructor role** entirely from the system
- Simplifying the dashboard and removing unnecessary features
- Merging related pages (Sentiment + Anomaly Detection)
- Enhancing course detail analysis with category-level metrics
- Refocusing role on **monitoring and reporting** (not management)

---

## 🎯 **CURRENT STATE (BEFORE CHANGES)**

### Staff Pages (6 total)
1. **Dashboard.jsx** - Overview with participation, issues, sentiment
2. **Courses.jsx** - Course list with section creation
3. **Evaluations.jsx** - Evaluation list with filters
4. **SentimentAnalysis.jsx** - Sentiment trends and analysis
5. **AnomalyDetection.jsx** - Anomaly detection and flagged evaluations
6. **EvaluationQuestions.jsx** - Question template management

### Current Role Differences
- **Secretary**: Full department access (all programs)
- **Department Head**: Limited to assigned programs
- **Instructor**: Own courses only

### Backend Routes
- `/api/secretary/*` - Secretary endpoints
- `/api/dept-head/*` - Department head endpoints  
- `/api/instructor/*` - Instructor endpoints

---

## 🔄 **PLANNED CHANGES**

---

## ⚠️ **CRITICAL: ROLE ACCESS RESTRUCTURE**

### **1. MERGE SECRETARY & DEPARTMENT HEAD ROLES**

#### **New Access Model**
- **Before**: 
  - Secretary = All programs (department-wide)
  - Dept Head = Assigned programs only
  
- **After**:
  - **Secretary = Department Head = Same Access**
  - Both roles have **full department-wide data access**
  - No difference in permissions or features
  - Both see all programs, all courses, all evaluations in department

#### **Implementation**
1. **Backend Changes**:
   - Keep both role names in database (for user records)
   - Merge route handlers: `secretary.py` and `department_head.py` → Use same logic
   - Or: Create single `staff.py` route file for both roles
   - All queries return department-wide data (no program filtering)

2. **Frontend Changes**:
   - Both roles use same pages (staff folder)
   - No conditional rendering based on secretary vs dept_head
   - Navigation and features identical for both

3. **Database**:
   - Keep `role` field with values: 'secretary', 'department_head'
   - Remove program assignments for dept heads (no longer needed)
   - Or: Keep assignments but don't filter by them

### **2. REMOVE INSTRUCTOR ROLE ENTIRELY**

#### **Rationale**
- System focus is on **administrative monitoring**, not instructor self-service
- Secretary/Dept Head monitor all courses (including instructor performance)
- Instructors don't need system access to view their own evaluations
- Simplifies system architecture and permissions

#### **Implementation**
1. **Database**:
   - Remove `role = 'instructor'` from users table (or mark inactive)
   - Keep instructor records in `users` table for course assignments
   - But instructors cannot log in to system

2. **Backend**:
   - Delete `/api/instructor/*` routes entirely
   - Remove `instructor.py` file
   - Update course sections to still link to instructor user records

3. **Frontend**:
   - Delete `pages/staff/Instructor*` files if they exist
   - Remove instructor navigation from sidebar
   - Update login to reject instructor role

4. **Course Assignments**:
   - Courses still assigned to instructor users (for data purposes)
   - But instructors have no login/access
   - Secretary/Dept Head see instructor names in course data

### **Implementation Tasks**
- [ ] Merge secretary and dept_head backend routes
- [ ] Remove program filtering from dept_head queries
- [ ] Test both roles have identical data access
- [ ] Delete instructor backend routes (`instructor.py`)
- [ ] Delete instructor frontend pages
- [ ] Update login to reject instructor role
- [ ] Update user management (admin) to not create instructor logins
- [ ] Test instructor users cannot log in
- [ ] Verify course data still shows instructor names

---

## 1️⃣ **DASHBOARD PAGE** (`Dashboard.jsx`)

### **Current Features**
- Key metrics cards (total evaluations, avg sentiment, completion rate, participation rate)
- Survey Participation Card (by program/year level)
- Issues Detected Card (anomalies, low ratings)
- Sentiment Distribution (pie chart)
- Year Level Analysis (bar chart)
- "Manage Evaluation Questions" button

### **Changes Required**

#### ❌ **REMOVE FEATURES**
1. **Survey Participation Card**
   - Remove entire card showing participation by program
   - Reason: Simplify dashboard, focus on key metrics

2. **Issues Detected Card**
   - Remove card showing anomalies and flagged issues
   - Reason: This info available in dedicated Anomaly Detection page

3. **"Manage Evaluation Questions" Button**
   - Remove button from dashboard
   - Reason: Questions page being deleted (see below)

#### ✅ **KEEP FEATURES**
4. **Key Metrics Cards** - KEEP
   - Total Evaluations
   - Average Sentiment Score
   - Completion Rate
   - Any other summary metrics

5. **Charts** - KEEP
   - Sentiment Distribution (Pie Chart)
   - Year Level Analysis (Bar Chart)
   - Program-wise charts (if any)

6. **Filters** - KEEP
   - Program filter
   - Year Level filter
   - Semester filter

### **New Dashboard Focus**
Dashboard should answer:
- How many students have evaluated? (completion rate)
- How many evaluations per course? (course performance card)
- Overall sentiment summary
- Basic trends by program/year level

### **Implementation Tasks**
- [ ] Remove Survey Participation card component
- [ ] Remove Issues Detected card component
- [ ] Remove "Manage Evaluation Questions" button
- [ ] Adjust dashboard layout (3-4 cards instead of 6)
- [ ] Test filters still work with remaining components
- [ ] Ensure dashboard loads quickly

---

## 2️⃣ **EVALUATION QUESTIONS PAGE** (`EvaluationQuestions.jsx`)

### **Current Features**
- View list of question templates
- Add/Edit/Delete questions
- Organize questions by category
- Enable/Disable questions

### **Changes Required**

#### ❌ **DELETE ENTIRE PAGE**
1. **Remove EvaluationQuestions.jsx**
   - Reason: System has **ONE fixed question template** (31 questions, 6 categories)
   - Questions are **embedded in the system** (hardcoded in config)
   - No need for dynamic question management
   - Questions don't change per semester or program

2. **Question Template Source**
   - Questions stored in: `src/data/questionnaireConfig.js`
   - This file is the single source of truth
   - No database storage for questions
   - Frontend reads directly from config file

### **Implementation Tasks**
- [ ] Delete `EvaluationQuestions.jsx` file
- [ ] Remove route from App.jsx
- [ ] Remove navigation link from sidebar
- [ ] Remove "Manage Questions" button from Dashboard
- [ ] Verify question config file is complete and correct
- [ ] Update documentation (questions are fixed)

---

## 3️⃣ **SENTIMENT ANALYSIS PAGE** (`SentimentAnalysis.jsx`)

### **Current Features**
- Sentiment overview (positive/neutral/negative counts)
- Sentiment trend over time (line chart)
- Sentiment by year level (bar chart)
- Sentiment by program (if filtered)
- Filters (program, year level, semester)

### **Changes Required**

#### ✅ **MERGE WITH ANOMALY DETECTION PAGE**
1. **Keep SentimentAnalysis.jsx as Main Page**
   - This becomes the combined "Sentiment & Anomaly Analysis" page
   - Rename to "Sentiment Analysis" in navigation (or "Analysis")

2. **Add Anomaly Detection Content**
   - **From AnomalyDetection.jsx, bring over**:
     - Anomaly overview card (X anomalies detected)
     - List of flagged evaluations table
     - Anomaly types: Straight-lining, Outliers, Contradictory responses
     - Filter by anomaly type
     - View anomaly details
   
   - **New Page Structure**:
     ```
     ┌─────────────────────────────────────────┐
     │ SENTIMENT ANALYSIS & ANOMALY DETECTION  │
     └─────────────────────────────────────────┘
     
     [Filters: Program | Year Level | Semester]
     
     ┌──────────────────────────────────────────────────┐
     │ SENTIMENT OVERVIEW                                │
     │ Positive: 250 | Neutral: 100 | Negative: 50      │
     │ [Pie Chart]         [Trend Line Chart]           │
     └──────────────────────────────────────────────────┘
     
     ┌──────────────────────────────────────────────────┐
     │ ANOMALY DETECTION                                 │
     │ Total Anomalies: 15                               │
     │ Straight-lining: 8 | Outliers: 5 | Other: 2     │
     │                                                   │
     │ [Table: Flagged Evaluations]                     │
     │ Student | Course | Anomaly Type | Details | Date │
     └──────────────────────────────────────────────────┘
     ```

3. **Combine Filtering**
   - Single filter set applies to both sentiment and anomaly data
   - Filter by program, year level, semester
   - Add anomaly type filter (for anomaly section only)

### **Implementation Tasks**
- [ ] Copy anomaly detection components to SentimentAnalysis.jsx
- [ ] Combine API calls (fetch sentiment + anomalies together)
- [ ] Merge filter logic
- [ ] Create tabbed layout or two-section layout
- [ ] Style anomaly table to match sentiment charts
- [ ] Delete AnomalyDetection.jsx file
- [ ] Update navigation (remove Anomaly Detection link)
- [ ] Test combined page performance
- [ ] Ensure both datasets load correctly

---

## 4️⃣ **ANOMALY DETECTION PAGE** (`AnomalyDetection.jsx`)

### **Changes Required**

#### ❌ **DELETE PAGE - MERGE INTO SENTIMENT ANALYSIS**
1. **This page will be deleted**
   - All functionality moved to SentimentAnalysis.jsx
   - See changes in Section 3 above

### **Implementation Tasks**
- [ ] Ensure all features copied to SentimentAnalysis.jsx
- [ ] Delete AnomalyDetection.jsx file
- [ ] Remove route from App.jsx
- [ ] Remove navigation link

---

## 5️⃣ **COURSES PAGE** (`Courses.jsx`)

### **Current Features**
- List of courses with sections
- Add Course button (for secretary)
- Create Section modal
- View Details popup for each course
- Edit/Delete course actions
- Filters by program, search

### **Changes Required**

#### ❌ **REMOVE "ADD COURSE" FEATURE**
1. **Delete "Add Course" Button**
   - Reason: Course creation should be admin-only
   - Secretary/Dept Head role is to **monitor**, not manage
   - Simplifies permissions

2. **Keep These Features**:
   - View course list
   - Search and filter courses
   - View Details popup (see modifications below)

#### ✅ **ENHANCE VIEW DETAILS POPUP**

### **Current View Details Structure**
- Overview tab: Basic course info, average rating, sentiment
- Evaluation statistics: Count, completion rate
- Detailed analysis: Individual evaluations (maybe)

### **New View Details Structure**

#### **Overview Tab - Show Category Averages**

```
┌────────────────────────────────────────────────────────┐
│ Course: Introduction to Programming (CSIT101)           │
│ Instructor: John Doe | Program: BSCS-DS | Students: 45 │
└────────────────────────────────────────────────────────┘

CATEGORY AVERAGE RATINGS
┌──────────────────────────────────────────────┐
│ I. Relevance of Course           ⭐ 3.8 / 4.0 │
│ II. Course Organization & ILOs   ⭐ 3.6 / 4.0 │
│ III. Teaching-Learning           ⭐ 3.9 / 4.0 │
│ IV. Assessment                   ⭐ 3.7 / 4.0 │
│ V. Learning Environment          ⭐ 3.5 / 4.0 │
│ VI. Counseling                   ⭐ 3.4 / 4.0 │
│ ────────────────────────────────────────────  │
│ Overall Average                  ⭐ 3.65 / 4.0 │
└──────────────────────────────────────────────┘

EVALUATION STATISTICS
- Total Evaluations: 42 / 45 (93.3%)
- Completion Rate: 93.3%
- Average Sentiment: Positive (85%)
- Last Updated: November 15, 2025
```

**What to Show**:
1. **6 Category Averages** (matching the 6 question categories)
   - Calculate average rating for each category
   - Show score out of 4.0
   - Visual indicator (stars or progress bars)

2. **Evaluation Statistics** (keep current)
   - Total evaluations submitted
   - Completion rate percentage
   - Sentiment distribution
   - Date range

#### **Detailed Analysis Tab - Question-Level Breakdown**

```
┌────────────────────────────────────────────────────────┐
│ DETAILED ANALYSIS - RESPONSE BREAKDOWN                  │
└────────────────────────────────────────────────────────┘

I. RELEVANCE OF COURSE (Average: 3.8 / 4.0)

1. The course content was relevant to my program
   Rating 1: ▪▪▪ 2 responses (4.8%)
   Rating 2: ▪▪▪▪▪▪ 5 responses (11.9%)
   Rating 3: ▪▪▪▪▪▪▪▪▪▪▪▪ 15 responses (35.7%)
   Rating 4: ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪ 20 responses (47.6%)
   Average: 3.3 / 4.0

2. The course objectives were clearly defined
   Rating 1: ▪▪ 1 response (2.4%)
   Rating 2: ▪▪▪▪ 3 responses (7.1%)
   Rating 3: ▪▪▪▪▪▪▪▪▪ 12 responses (28.6%)
   Rating 4: ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪ 26 responses (61.9%)
   Average: 3.5 / 4.0

[... repeat for all questions in category ...]

II. COURSE ORGANIZATION & ILOS (Average: 3.6 / 4.0)

3. The syllabus was clear and comprehensive
   Rating 1: ▪ 1 response (2.4%)
   Rating 2: ▪▪▪▪▪ 4 responses (9.5%)
   Rating 3: ▪▪▪▪▪▪▪▪▪▪▪ 14 responses (33.3%)
   Rating 4: ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪ 23 responses (54.8%)
   Average: 3.4 / 4.0

[... continue for all 31 questions ...]
```

**What to Show**:
1. **For Each Category**:
   - Category name and average rating
   - List all questions in that category

2. **For Each Question**:
   - Question text
   - Response distribution (1-4 scale):
     - Count of responses for each rating (1, 2, 3, 4)
     - Percentage of total for each rating
     - Visual bar (using characters or progress bars)
   - Average rating for that specific question

3. **Format**:
   - Grouped by category (6 sections)
   - Questions numbered (1-31)
   - Clear visual separation between categories
   - Easy to scan and compare

**Benefits**:
- Shows exactly where course excels or needs improvement
- Identifies specific questions with low ratings
- Helps pinpoint issues (e.g., "Assessment" category low)
- Data-driven insights for course improvement

### **Implementation Tasks**
- [ ] Remove "Add Course" button
- [ ] Calculate category averages from evaluation data
- [ ] Update Overview tab to show 6 category averages
- [ ] Create Detailed Analysis tab layout
- [ ] Query database for question-level response counts
- [ ] Group questions by category (use questionnaireConfig.js)
- [ ] Calculate response distribution (count per rating 1-4)
- [ ] Display visual bars for response distribution
- [ ] Add percentage calculations
- [ ] Style detailed analysis for readability
- [ ] Test with courses that have many evaluations
- [ ] Test with courses that have few evaluations
- [ ] Optimize performance (caching, pagination if needed)

---

## 📊 **NEW ROLE FOCUS: MONITORING & REPORTING**

Based on professor consultation, the Secretary/Department Head role should focus on:

### **Primary Responsibilities**

1. **Monitor Evaluation Completion**
   - Track how many students have evaluated
   - See completion rate per course
   - Identify courses with low participation
   - View pending vs completed evaluations

2. **View Evaluation Summary**
   - Overall sentiment by course/program
   - Category-level performance (6 categories)
   - Question-level detailed analysis
   - Trend over time (semester comparison)

3. **Track Evaluations Per Course**
   - How many evaluations each course received
   - Which courses need follow-up
   - Completion percentage by course

4. **Contact Admin for Issues**
   - Report anomalies (straight-lining, outliers)
   - Flag low-performing courses
   - Request administrative action
   - Escalate technical issues

### **What They CANNOT Do** (Read-Only Focus)
- ❌ Cannot add/edit courses (admin only)
- ❌ Cannot manage users (admin only)
- ❌ Cannot create evaluation periods (admin only)
- ❌ Cannot modify question templates (fixed in system)
- ✅ CAN view, filter, analyze, export data

### **New Features Needed**

1. **Evaluation Completion Tracker**
   - Dashboard widget: "X% of students have evaluated"
   - List of students who haven't evaluated (per course)
   - Send reminders (through admin)

2. **Course Completion Status**
   - Table showing all courses with completion rates
   - Sort by lowest completion first
   - Flag courses below threshold (e.g., <70%)

3. **Contact Admin Feature**
   - Button: "Report Issue to Admin"
   - Form to describe issue
   - Attach course/student data
   - Send notification to admin

### **Implementation Tasks**
- [ ] Add completion tracker widget to dashboard
- [ ] Create course completion status table
- [ ] Add "Report to Admin" button on relevant pages
- [ ] Create issue reporting modal/form
- [ ] Backend endpoint to notify admin
- [ ] Update role permissions (remove edit capabilities)
- [ ] Test read-only access
- [ ] Verify monitoring features work

---

## 📊 **IMPACT SUMMARY**

### **Pages Modified/Deleted: 6 of 6 Staff Pages**

| Page | Changes | Complexity | Estimated Time |
|------|---------|------------|----------------|
| Dashboard | Remove 2 cards, remove button | Low | 2 hours |
| Courses | Remove add button, enhance view details popup | High | 8 hours |
| Evaluations | No changes (keep as is) | None | 0 hours |
| SentimentAnalysis | Merge with anomaly detection | High | 6 hours |
| AnomalyDetection | DELETE (merged into sentiment) | Low | 1 hour |
| EvaluationQuestions | DELETE (no longer needed) | Low | 1 hour |
| **NEW: Completion Tracker** | Create monitoring features | Medium | 4 hours |
| **NEW: Contact Admin** | Create reporting feature | Medium | 3 hours |
| **Total Estimated Time** | | | **~25 hours** |

### **Role Changes: MAJOR RESTRUCTURE**
1. **Merge Secretary + Dept Head** → Both have department-wide access
2. **Remove Instructor role** → Instructors cannot log in

### **New Features Added: 2**
1. Evaluation Completion Tracker (monitoring)
2. Contact Admin / Report Issue (escalation)

### **Features Removed: 5**
1. Survey Participation card
2. Issues Detected card
3. Add Course button (secretary)
4. Evaluation Questions page (entire page)
5. Anomaly Detection page (merged)
6. Instructor role access (entire role removed)

### **Backend Changes Required**
- Merge `/api/secretary/*` and `/api/dept-head/*` logic
- Delete `/api/instructor/*` routes
- Add category-level aggregation queries
- Add question-level response distribution queries
- Add completion tracking endpoints
- Add admin notification endpoint

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Role Restructure (4-6 hours)**
1. Merge secretary and dept_head backend routes
2. Remove instructor routes and pages
3. Update login validation
4. Test role access changes

### **Phase 2: Page Deletions & Cleanup (2-3 hours)**
5. Delete EvaluationQuestions.jsx
6. Delete AnomalyDetection.jsx
7. Update routing and navigation
8. Remove unused components

### **Phase 3: Dashboard Simplification (2-3 hours)**
9. Remove Survey Participation card
10. Remove Issues Detected card
11. Remove Manage Questions button
12. Test dashboard layout

### **Phase 4: Sentiment + Anomaly Merge (6-8 hours)**
13. Copy anomaly components to SentimentAnalysis.jsx
14. Combine data fetching
15. Create unified layout
16. Test combined page

### **Phase 5: Course Details Enhancement (8-10 hours)**
17. Remove Add Course button
18. Add category average calculations
19. Create detailed analysis tab
20. Build question-level breakdown UI
21. Optimize performance

### **Phase 6: Monitoring Features (6-8 hours)**
22. Create completion tracker widget
23. Build course completion status table
24. Add "Contact Admin" feature
25. Test monitoring workflows

---

## ⚠️ **IMPORTANT NOTES**

1. **DO NOT START IMPLEMENTATION YET**
   - This is a planning document only
   - Wait for approval before making changes

2. **Major Role Changes**
   - Removing instructor role affects existing users
   - Need migration plan for current instructor accounts
   - Consider: Convert instructors to "view-only" users?

3. **Data Considerations**
   - Course-instructor assignments still needed (for display)
   - Keep instructor user records (just disable login)
   - Question template in `questionnaireConfig.js` must be complete

4. **Performance Concerns**
   - Detailed analysis (31 questions x multiple ratings) = heavy query
   - May need caching or background processing
   - Consider pagination for courses with 100+ evaluations

5. **Testing Requirements**
   - Test with both secretary and dept_head accounts (should be identical)
   - Test instructor login blocked
   - Test detailed analysis with various data volumes
   - Verify category calculations are correct
   - Test monitoring features

---

## 📝 **FILES TO MODIFY/DELETE**

### **Frontend Files**
```
New/capstone/src/pages/staff/
├── Dashboard.jsx              ← MODIFY (remove cards/button)
├── Courses.jsx                ← MODIFY (remove add, enhance details)
├── Evaluations.jsx            ← NO CHANGES
├── SentimentAnalysis.jsx      ← MODIFY (merge anomaly content)
├── AnomalyDetection.jsx       ← DELETE
└── EvaluationQuestions.jsx    ← DELETE

New/capstone/src/pages/instructor/
└── [all files]                ← DELETE (instructor role removed)
```

### **Backend Files**
```
Back/App/routes/
├── secretary.py               ← MODIFY (merge logic)
├── department_head.py         ← MODIFY (merge logic)
└── instructor.py              ← DELETE (role removed)
```

### **New Files to Create**
```
New/capstone/src/components/staff/
├── CompletionTracker.jsx      ← NEW (monitoring widget)
├── CourseCompletionTable.jsx  ← NEW (completion status)
└── ContactAdminModal.jsx      ← NEW (report issues)
```

---

## 🔍 **CATEGORY CALCULATION LOGIC**

### **6 Question Categories**
Based on LPU evaluation form structure:

1. **I. Relevance of Course** (Questions 1-5)
2. **II. Course Organization & ILOs** (Questions 6-10)
3. **III. Teaching - Learning** (Questions 11-20)
4. **IV. Assessment** (Questions 21-25)
5. **V. Learning Environment** (Questions 26-28)
6. **VI. Counseling** (Questions 29-31)

### **Calculation Method**
```sql
-- Example: Category I average
SELECT AVG((ratings->>'q1')::int + 
           (ratings->>'q2')::int + 
           (ratings->>'q3')::int + 
           (ratings->>'q4')::int + 
           (ratings->>'q5')::int) / 5.0 AS category_1_avg
FROM evaluations
WHERE class_section_id = :section_id;
```

### **Response Distribution Query**
```sql
-- Example: Question 1 distribution
SELECT 
  SUM(CASE WHEN (ratings->>'q1')::int = 1 THEN 1 ELSE 0 END) AS rating_1_count,
  SUM(CASE WHEN (ratings->>'q1')::int = 2 THEN 1 ELSE 0 END) AS rating_2_count,
  SUM(CASE WHEN (ratings->>'q1')::int = 3 THEN 1 ELSE 0 END) AS rating_3_count,
  SUM(CASE WHEN (ratings->>'q1')::int = 4 THEN 1 ELSE 0 END) AS rating_4_count,
  COUNT(*) AS total_responses
FROM evaluations
WHERE class_section_id = :section_id;
```

---

## ✅ **APPROVAL CHECKLIST**

- [ ] User reviewed all planned changes
- [ ] User approved merging secretary + dept head roles
- [ ] User approved removing instructor role entirely
- [ ] User approved dashboard simplifications
- [ ] User approved deleting Questions page
- [ ] User approved merging Sentiment + Anomaly pages
- [ ] User approved enhanced course details (category averages)
- [ ] User approved detailed analysis format
- [ ] User approved removing Add Course button
- [ ] User confirmed new monitoring focus
- [ ] User ready to proceed with implementation

---

**Document Status**: ✅ **COMPLETE - AWAITING APPROVAL**  
**Next Step**: User reviews and approves before implementation begins

---

**Created**: November 16, 2025  
**Last Updated**: November 16, 2025  
**Version**: 1.0
