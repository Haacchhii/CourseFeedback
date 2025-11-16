# Student Role - Major Overhaul Plan

**Date**: November 16, 2025  
**Status**: Planning Phase - DO NOT IMPLEMENT YET  
**Scope**: Student role pages only

---

## 📋 **OVERVIEW**

This document outlines the planned major changes to the Student role functionality. These changes focus on:
- Simplifying the student interface
- Improving evaluation status visibility
- Adding edit evaluation capability
- Streamlining the evaluation form UI
- Removing unnecessary pages and redundancy

---

## 🎯 **CURRENT STATE (BEFORE CHANGES)**

### Student Pages (3 total)
1. **StudentCourses.jsx** - List of enrolled courses with evaluation status
2. **StudentEvaluation.jsx** - Main evaluation landing page (redundant)
3. **EvaluateCourse.jsx** - Individual course evaluation form

### Student Backend Routes
- `GET /api/student/{id}/courses` - Fetch enrolled courses
- `POST /api/student/evaluations` - Submit evaluation
- `GET /api/student/{id}/evaluations` - View evaluation history

---

## 🔄 **PLANNED CHANGES**

---

## 1️⃣ **MY EVALUATIONS PAGE** (`StudentEvaluation.jsx`)

### **Current Features**
- Landing page for student evaluations
- Shows list of courses to evaluate
- Search and filter by semester
- Navigate to evaluation form

### **Changes Required**

#### ❌ **REMOVE ENTIRE PAGE**
1. **Delete StudentEvaluation.jsx**
   - Reason: Redundant with StudentCourses page
   - Goal of student is to just evaluate courses
   - StudentCourses already shows all courses with evaluation status
   - No need for separate evaluation landing page

2. **Update Routing**
   - Remove `/student-evaluation` route
   - Student login should redirect directly to `/student/courses`
   - All evaluation access should be from StudentCourses page

### **Implementation Tasks**
- [ ] Delete `StudentEvaluation.jsx` file
- [ ] Remove route from `App.jsx` or router config
- [ ] Update student login redirect to `/student/courses`
- [ ] Remove any navigation links to this page
- [ ] Test student login flow

---

## 2️⃣ **MY COURSES PAGE** (`StudentCourses.jsx`)

### **Current Features**
- Lists enrolled courses in table/card view
- Shows course code, name, instructor, semester
- Status column: "Pending" or "Done"
- Action column: "Evaluate" button or "Completed" text
- Search by course name/code
- Filter by semester

### **Changes Required**

#### ✅ **MODIFY STATUS DISPLAY**
1. **Change Status Labels**
   - **Current**: "Pending" | "Done"
   - **New**: "Evaluate" | "Evaluated"
   
   - **"Evaluate" Status** (Not yet submitted):
     - Badge color: Yellow/Orange (#f59e0b or #fb923c)
     - Text: "Evaluate"
     - Icon: Exclamation mark or pencil icon
     - Indicates action needed
   
   - **"Evaluated" Status** (Already submitted):
     - Badge color: Green (#10b981 or #22c55e)
     - Text: "Evaluated"
     - Icon: Checkmark icon
     - Indicates completed

2. **Different Visual Look for Evaluated Courses**
   - **Table Row Styling**:
     - Evaluated courses: Slightly lighter background (#f9fafb)
     - Or: Add subtle green left border (4px green border-left)
   
   - **Card Styling** (Mobile view):
     - Evaluated cards: Green border or green accent
     - Gray out course name slightly (70% opacity)
     - Larger checkmark icon
   
   - **Typography**:
     - Evaluated course names: Regular weight (not bold)
     - Not evaluated: Bold weight (to draw attention)

#### ❌ **REMOVE ACTION COLUMN**
3. **Delete Action Column from Table**
   - Current: Separate "Action" column with "Evaluate" button
   - New: Remove entire column
   - Reason: Status itself becomes clickable/actionable

#### ✅ **ADD EDIT EVALUATION BUTTON**
4. **Edit Evaluation Feature**
   - **When to Show**:
     - Only for courses with "Evaluated" status
     - Only if evaluation period end date has NOT passed
     - Check: `current_date <= evaluation_period.end_date`
   
   - **Button Placement**:
     - In Status column (or next to Evaluated badge)
     - Small secondary button: "Edit" or pencil icon
     - Or: "Evaluated" badge becomes a dropdown:
       - "View Evaluation" (optional)
       - "Edit Evaluation"
   
   - **Button Styling**:
     - Small size (sm or xs)
     - Secondary/outline style
     - Blue color (#3b82f6)
     - Icon: Pencil/edit icon
   
   - **Validation**:
     - Frontend check: Compare current date vs period end date
     - Backend check: Verify period still active
     - Show tooltip if period ended: "Evaluation period has ended"
   
   - **Flow**:
     1. Student clicks "Edit" button
     2. Navigate to `/student/evaluate/{courseId}`
     3. Form pre-fills with existing ratings and comment
     4. Student can modify and re-submit
     5. Backend updates existing evaluation record (not create new)

#### ✅ **MODIFY ROW/CARD INTERACTIONS**
5. **Make Rows/Cards Clickable**
   - **For "Evaluate" Status**:
     - Click row/card → Navigate to evaluation form
     - Entire row is clickable (cursor: pointer)
     - Hover effect: Light background color change
   
   - **For "Evaluated" Status**:
     - If period active: Click opens edit form
     - If period ended: Click does nothing (or shows view-only)
     - Add visual indicator (hover effect only if clickable)

### **Implementation Tasks**
- [ ] Change status labels: "Pending" → "Evaluate", "Done" → "Evaluated"
- [ ] Update badge colors (orange for Evaluate, green for Evaluated)
- [ ] Add checkmark icon to Evaluated badge
- [ ] Remove Action column from table
- [ ] Add different styling for evaluated courses (background or border)
- [ ] Add "Edit" button next to Evaluated status
- [ ] Check evaluation period end date (frontend)
- [ ] Create backend endpoint: `PUT /api/student/evaluations/{id}`
- [ ] Add edit evaluation validation (period still active)
- [ ] Make table rows/cards clickable
- [ ] Add hover effects for clickable items
- [ ] Pre-fill evaluation form with existing data when editing
- [ ] Update backend to handle evaluation updates (not just insert)
- [ ] Test edit flow end-to-end
- [ ] Test period expiration validation
- [ ] Test mobile card view styling

---

## 3️⃣ **EVALUATION PAGE** (`EvaluateCourse.jsx`)

### **Current Features**
- Displays course info: Course name, instructor name
- 31 questions across 6 categories
- Rating scale: 1-4 with labels
- Scale labels on both sides: "Strongly Disagree" ← → "Strongly Agree"
- Centered rating buttons (1, 2, 3, 4)
- Comment box with placeholder text and suggestions
- Category navigation (Previous/Next buttons)
- Progress tracking per category
- Submit button

### **Changes Required**

#### ✅ **MODIFY HEADER INFORMATION**
1. **Remove Instructor Name**
   - Current: Shows "Instructor: John Doe"
   - Reason: Not necessary for evaluation
   - Students focus on course, not specific instructor

2. **Replace with Course Name**
   - **Current Header**:
     ```
     Evaluating: CSIT101
     Instructor: John Doe
     ```
   
   - **New Header**:
     ```
     Evaluating: Introduction to Programming (CSIT101)
     1st Semester, 2025-2026
     ```
   
   - Show full course name + course code
   - Show semester and academic year
   - Larger, more prominent course name

#### ✅ **REMOVE SCALE LABEL REDUNDANCY**
3. **Simplify Rating Scale Display**
   - **Current**: Labels on BOTH sides of rating buttons
     ```
     Strongly Disagree  [1] [2] [3] [4]  Strongly Agree
     ```
   
   - **New**: Labels ONLY at the top (once per category or once at top of form)
     ```
     Rating Scale: 1 = Strongly Disagree, 2 = Disagree, 3 = Agree, 4 = Strongly Agree
     
     Question 1: The course content was relevant...
     [1] [2] [3] [4]
     
     Question 2: The instructor explained concepts clearly...
     [1] [2] [3] [4]
     ```
   
   - **Option A**: Show scale legend at the top of each category
   - **Option B**: Show scale legend once at the top of the form (sticky header)
   - Removes repetitive text for every question
   - Cleaner, less cluttered UI

#### ✅ **CHANGE RATING ALIGNMENT**
4. **Left-Align Rating Buttons with Questions**
   - **Current**: Rating buttons (1, 2, 3, 4) are centered
   - **New**: Left-aligned, directly under question text
   
   - **Current Layout**:
     ```
                  Question text here
          [ 1 ]   [ 2 ]   [ 3 ]   [ 4 ]
     ```
   
   - **New Layout**:
     ```
     Question text here
     [ 1 ]   [ 2 ]   [ 3 ]   [ 4 ]
     ```
   
   - Improves readability (vertical flow)
   - Faster to scan questions and select ratings
   - More compact design

#### ✅ **SIMPLIFY COMMENT BOX**
5. **Remove Suggestion Text from Placeholder**
   - **Current Placeholder**:
     ```
     Enter your comments here... For example: The course materials 
     were very informative but could use more practical examples.
     ```
   
   - **New Placeholder**:
     ```
     Enter your additional comments here... (optional)
     ```
   
   - Reason: "Optional" label already exists above comment box
   - Long placeholder text is redundant
   - Simpler, cleaner input field

6. **Update Label**
   - **Current**: 
     ```
     Additional Comments and Suggestions
     Please provide any additional feedback or suggestions for improvement (optional)
     ```
   
   - **New**:
     ```
     Additional Comments and Suggestions (Optional)
     Share any additional feedback or suggestions
     ```
   
   - More concise
   - "(Optional)" in the label itself

### **Visual Mockup - New Layout**

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Courses                                      │
│                                                          │
│  Evaluating: Introduction to Programming (CSIT101)      │
│  1st Semester, 2025-2026                                │
│                                                          │
│  Overall Progress: 31 of 31 questions answered          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  I. Relevance of Course                                  │
│  Evaluation of course relevance and usefulness           │
│                                                          │
│  Rating Scale:                                           │
│  1 = Strongly Disagree                                   │
│  2 = Disagree                                            │
│  3 = Agree                                               │
│  4 = Strongly Agree                                      │
│  ───────────────────────────────────────────────────    │
│                                                          │
│  1. The course content was relevant to my program        │
│     Subject Matter                                       │
│     ○ 1   ○ 2   ○ 3   ● 4                              │
│                                                          │
│  2. The course objectives were clearly defined           │
│     Course Clarity                                       │
│     ○ 1   ○ 2   ● 3   ○ 4                              │
│                                                          │
│  [ ← Previous ]  Category 1 of 6  [ Next → ]           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Additional Comments and Suggestions (Optional)          │
│  Share any additional feedback or suggestions            │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Enter your additional comments here... (optional) │  │
│  │                                                    │  │
│  │                                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ✓ Ready to submit!          [ Submit Evaluation ]      │
└─────────────────────────────────────────────────────────┘
```

### **Implementation Tasks**
- [ ] Remove instructor name from header
- [ ] Add full course name to header (not just code)
- [ ] Add semester and academic year to header
- [ ] Remove scale labels from each question row
- [ ] Add scale legend at top of each category (or top of form)
- [ ] Change rating button alignment from center to left
- [ ] Update CSS for left-aligned ratings
- [ ] Simplify comment box placeholder text
- [ ] Update comment box label (add "Optional" to title)
- [ ] Test layout on mobile (ensure left-align works well)
- [ ] Test with long question text
- [ ] Verify accessibility (screen readers)

---

## 📊 **IMPACT SUMMARY**

### **Pages Modified: 2 of 3 Student Pages**

| Page | Changes | Complexity | Estimated Time |
|------|---------|------------|----------------|
| StudentEvaluation | DELETE entire page | Low | 1 hour |
| StudentCourses | Change status labels, remove action column, add edit button, styling | High | 6 hours |
| EvaluateCourse | Remove instructor, simplify scale, change alignment, update comment box | Medium | 4 hours |
| **Total Estimated Time** | | | **~11 hours** |

### **New Features Added: 1**
1. Edit Evaluation (before period ends)

### **Features Removed: 2**
1. My Evaluations landing page (redundant)
2. Action column in courses table (merged with status)

### **Backend Endpoints to Add/Modify: 2**
1. `PUT /api/student/evaluations/{id}` - Update existing evaluation
2. `GET /api/student/evaluations/{id}` - Get evaluation for editing (pre-fill form)

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Quick Wins (1-2 hours)**
1. Delete StudentEvaluation.jsx page
2. Update routing and navigation
3. Change status labels (Pending → Evaluate, Done → Evaluated)

### **Phase 2: StudentCourses Enhancements (5-6 hours)**
4. Remove Action column
5. Update status badge colors and icons
6. Add different styling for evaluated courses
7. Add Edit button with period validation
8. Make rows/cards clickable
9. Test mobile responsiveness

### **Phase 3: EvaluateCourse Form Improvements (4-5 hours)**
10. Update header (remove instructor, add full course info)
11. Remove scale label redundancy
12. Change rating alignment to left
13. Simplify comment box
14. Test form layout changes

### **Phase 4: Edit Evaluation Backend (2-3 hours)**
15. Create PUT endpoint for updating evaluations
16. Add validation for period expiration
17. Pre-fill form with existing data
18. Test edit flow end-to-end

---

## ⚠️ **IMPORTANT NOTES**

1. **DO NOT START IMPLEMENTATION YET**
   - This is a planning document only
   - Wait for approval before making changes

2. **Backup Before Changes**
   - Continue on `admin-overhaul` branch or create `student-overhaul`
   - Keep current version for rollback

3. **Testing Requirements**
   - Test with expired evaluation periods
   - Test edit evaluation flow
   - Test mobile view (cards and forms)
   - Verify evaluation data integrity
   - Test multiple edit attempts
   - Check permissions (students can only edit their own)

4. **Data Considerations**
   - Edit evaluation should UPDATE, not CREATE new record
   - Maintain evaluation history (optional: add `updated_at` timestamp)
   - Consider audit trail for edited evaluations

5. **User Experience**
   - Clear indication of which evaluations can be edited
   - Helpful tooltip when period has expired
   - Confirmation before submitting edited evaluation
   - Success message after edit

---

## 📝 **CURRENT STUDENT FILES TO MODIFY**

### **Frontend Files**
```
New/capstone/src/pages/student/
├── StudentCourses.jsx          ← MODIFY (status, remove action, add edit)
├── StudentEvaluation.jsx       ← DELETE (redundant page)
└── EvaluateCourse.jsx          ← MODIFY (header, layout, comment box)
```

### **Backend Files**
```
Back/App/routes/
└── student.py                  ← ADD PUT endpoint, modify GET for edit
```

### **Routing Files**
```
New/capstone/src/
├── App.jsx                     ← REMOVE StudentEvaluation route
└── ...                         ← UPDATE navigation links
```

---

## 🎨 **DESIGN SPECIFICATIONS**

### **Status Badge Colors**
- **"Evaluate"**: 
  - Background: `#fef3c7` (light yellow)
  - Text: `#92400e` (dark amber)
  - Border: `#f59e0b` (amber-500)
  - Icon: `⚠️` or pencil

- **"Evaluated"**:
  - Background: `#d1fae5` (light green)
  - Text: `#065f46` (dark green)
  - Border: `#10b981` (green-500)
  - Icon: `✓` checkmark

### **Evaluated Course Row Styling**
```css
.evaluated-row {
  background-color: #f9fafb;
  border-left: 4px solid #10b981;
}

.evaluated-row .course-name {
  font-weight: normal;
  color: #6b7280;
}
```

### **Edit Button**
```css
.edit-button {
  background: white;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  padding: 4px 12px;
  font-size: 0.875rem;
  border-radius: 4px;
}

.edit-button:hover {
  background: #eff6ff;
}

.edit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### **Rating Scale Legend**
```css
.rating-legend {
  background: #f3f4f6;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: #4b5563;
}
```

---

## 🔍 **VALIDATION RULES**

### **Edit Evaluation Permission**
1. **Frontend Checks**:
   - Student is logged in
   - Student owns the evaluation
   - Evaluation period end date >= current date
   - Course evaluation exists (already submitted)

2. **Backend Checks**:
   - Verify student_id matches logged-in user
   - Verify evaluation belongs to student
   - Check evaluation_period.end_date > NOW()
   - Verify evaluation record exists

3. **Error Messages**:
   - "Evaluation period has ended" (if past end date)
   - "You haven't submitted an evaluation for this course yet"
   - "Unauthorized: You can only edit your own evaluations"

### **Edit Evaluation Data Validation**
- All ratings still required (1-4 range)
- Comment optional (can be blank)
- Cannot edit after period ends
- Cannot create duplicate evaluations

---

## ✅ **APPROVAL CHECKLIST**

- [ ] User reviewed all planned changes
- [ ] User approved StudentEvaluation page deletion
- [ ] User approved status label changes
- [ ] User approved edit evaluation feature
- [ ] User approved evaluation form layout changes
- [ ] User confirmed instructor name removal
- [ ] User confirmed scale simplification
- [ ] User confirmed comment box changes
- [ ] User ready to proceed with implementation

---

**Document Status**: ✅ **COMPLETE - AWAITING APPROVAL**  
**Next Step**: User reviews and approves before implementation begins

---

**Created**: November 16, 2025  
**Last Updated**: November 16, 2025  
**Version**: 1.0
