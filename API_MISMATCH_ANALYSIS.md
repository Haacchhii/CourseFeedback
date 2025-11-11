# 🔧 FRONTEND/BACKEND API MISMATCH ISSUES

## 🔴 CRITICAL PROBLEMS IDENTIFIED

### **Root Cause:**
The frontend (`api.js`) is calling endpoints that don't exist in the backend routes, causing "Failed to fetch" errors and infinite loading.

---

## 📋 MISSING ENDPOINTS BY ROLE

### **STUDENT (Priority: CRITICAL)**

#### ✅ Working:
- None yet - all broken

#### ❌ Missing/Broken:
1. **GET `/api/student/student/{student_id}/courses`** 
   - Frontend expects: `studentAPI.getCourses(studentId)`
   - Backend has: `/student/{student_id}/courses` (wrong prefix)
   - **FIX:** Change backend route or frontend call

2. **POST `/api/student/student/evaluations`**
   - Frontend expects: `studentAPI.submitEvaluation()`
   - Backend has: `/student/evaluations` (wrong prefix)
   - **FIX:** Align routes

3. **GET `/api/student/student/{student_id}/evaluations`**
   - Frontend expects: `studentAPI.getEvaluations()`
   - Backend: Probably missing
   - **FIX:** Add endpoint

---

### **INSTRUCTOR/SECRETARY/DEPT HEAD (Priority: HIGH)**

#### ❌ Missing Endpoints:
1. **GET `/api/instructor/dashboard?user_id=X`**
   - Exists but may not be working properly

2. **GET `/api/instructor/courses?user_id=X`**
   - Exists but may not be working

3. **GET `/api/instructor/evaluations?user_id=X`**
   - May be missing

4. **GET `/api/secretary/dashboard?user_id=X`**
   - Missing entirely

5. **GET `/api/secretary/courses?user_id=X`**
   - Missing

6. **GET `/api/dept-head/dashboard?department=X`**
   - Missing

7. **GET `/api/dept-head/courses?department=X`**
   - Missing

8. **GET `/api/dept-head/sentiment-analysis`**
   - Missing

9. **GET `/api/dept-head/evaluations`**
   - Missing

---

## 🔧 IMMEDIATE FIXES NEEDED

### Fix 1: Student Routes (CRITICAL)
The student routes have a double `/student/student/` prefix issue.

**Current Frontend:**
```javascript
getCourses: async (studentId) => {
    return apiClient.get(`/student/student/${studentId}/courses`)
}
```

**Backend Route:**
```python
@router.get("/student/{student_id}/courses")
```

**Result:** Frontend calls `/api/student/student/1/courses` but backend expects `/api/student/1/courses`

**Solution:** Fix frontend to remove double prefix OR fix backend to match.

---

### Fix 2: Add Missing Basic Endpoints
Many staff routes return mock data or don't exist. Need to either:
1. Create actual backend endpoints
2. OR make frontend use mock data gracefully
3. OR redirect staff roles to use same endpoints

---

### Fix 3: Secretary/Dept Head Share Routes
Since they have same access, they should share the same backend routes.

Currently:
- Frontend calls `/secretary/dashboard` and `/dept-head/dashboard`
- But backend probably doesn't have these

**Solution:** Make both use `/staff/dashboard` or similar

---

## 🚀 QUICK FIX STRATEGY

### Phase 1: Fix Student (5 minutes) ✅
1. Fix the `/student/student/` prefix issue in frontend
2. Add missing student evaluations endpoint
3. Test student login → courses → evaluations

### Phase 2: Fix Instructor Dashboard (5 minutes) ✅
1. Verify instructor dashboard endpoint returns data
2. Add mock data if database is empty
3. Fix courses endpoint to return instructor's classes

### Phase 3: Fix Staff Routes (10 minutes) ✅
1. Create unified staff routes for secretary/dept head/instructor
2. They all share same features anyway
3. Return mock data with proper structure

### Phase 4: Fix Questions Page ✅
1. Fix the `sets.filter is not a function` error
2. Ensure questions endpoint returns proper array

---

## 📝 SPECIFIC ERROR FIXES

### Error: "Failed to fetch student courses"
**Cause:** Route mismatch (`/student/student/` vs `/student/`)
**Fix:** Update frontend api.js line ~420

### Error: "TypeError: Cannot read properties of null (reading 'courses')"
**Cause:** API returns null or wrong structure
**Fix:** Add null checks in frontend + fix backend response

### Error: "TypeError: sets.filter is not a function"
**Cause:** `questionSets` is not an array or undefined
**Fix:** Ensure questions endpoint returns `{ data: { questionSets: [] } }`

### Error: Infinite loading on dashboard/courses/evaluations
**Cause:** Endpoints don't exist or return 404/500
**Fix:** Add all missing endpoints with mock or real data

---

## 🎯 IMPLEMENTATION ORDER

1. ✅ **Fix student routes** (highest priority - user reported first)
2. ✅ **Fix instructor/secretary/dept_head dashboard** (all share same issue)
3. ✅ **Fix courses endpoints** (used by all roles)
4. ✅ **Fix evaluations endpoints**
5. ✅ **Fix questions page**
6. ✅ **Fix sentiment/anomaly pages**

---

**I'll now implement these fixes systematically.**
