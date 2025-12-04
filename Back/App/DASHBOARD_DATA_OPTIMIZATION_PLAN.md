# 🎯 DASHBOARD DATA OPTIMIZATION PLAN
## Functional Requirements for Data Management & Display

**Date:** December 2, 2025  
**Issue:** System needs intelligent data filtering to handle multiple semesters of evaluation data  
**Focus:** Functional requirements (what data to show) before non-functional (performance optimization)

---

## 🔍 CURRENT PROBLEM ANALYSIS

### What's Currently Happening:
1. **Secretary Dashboard** - Filters by active evaluation period only ✅
2. **Department Head Dashboard** - Filters by active evaluation period only ✅
3. **Admin Dashboard** - Shows **ALL DATA** from all periods ❌ (Problem!)
4. **Reports/Analytics** - No period filtering ❌ (Problem!)
5. **Course Lists** - Shows all evaluations ever submitted ❌ (Problem!)

### Why This Is a Problem:
- After 3+ semesters, dashboards will show overwhelming amounts of data
- Users can't distinguish current semester from past semesters
- Performance will degrade with thousands of evaluations
- No way to view historical data when needed

---

## ✅ FUNCTIONAL REQUIREMENTS (Must Have)

### 1. **Default Data Scope** (What shows automatically)
Every dashboard and report should **default to the current active evaluation period**.

**Rule:** If no period selected → show active period data only

**Applies to:**
- Secretary Dashboard ✅ (Already implemented)
- Department Head Dashboard ✅ (Already implemented)
- Admin Dashboard ❌ (Needs fixing - currently shows all data)
- All Reports ❌ (Needs period filter)
- Course Lists ❌ (Needs period filter)
- Analytics ❌ (Needs period filter)

---

### 2. **Period Selection Dropdown** (Must be on every page)
Add evaluation period selector to:

```
┌─────────────────────────────────────┐
│ Dashboard                           │
│                                     │
│ Evaluation Period: [▼ Select]      │
│   • First Semester 2024-2025 ⭐    │
│   • Second Semester 2023-2024      │
│   • First Semester 2023-2024       │
└─────────────────────────────────────┘
```

**Required on:**
- [x] Secretary Dashboard (already has it)
- [x] Department Head Dashboard (already has it)
- [ ] Admin Dashboard
- [ ] Course Management Page
- [ ] Reports Page
- [ ] Analytics Page
- [ ] Student Evaluations Page (student view)

---

### 3. **"All Time" Option** (For historical analysis)
Add "All Periods" option for comprehensive reports:

```sql
-- Example query structure:
WHERE evaluation_period_id = :period_id  -- Specific period
OR :show_all_time = true                  -- All periods
```

**Use Cases:**
- Admin viewing system-wide trends
- Department head comparing semester performance
- Generating annual reports

---

### 4. **Data Archiving Strategy** (For longevity)
**Instead of deleting old data, implement status flags:**

```sql
-- Add to evaluation_periods table:
ALTER TABLE evaluation_periods 
ADD COLUMN archived BOOLEAN DEFAULT false;

-- Update old periods:
UPDATE evaluation_periods 
SET archived = true 
WHERE end_date < NOW() - INTERVAL '1 year';
```

**Query Logic:**
```sql
-- Default: Active + Recent (not archived)
WHERE archived = false

-- Historical reports: Include archived
WHERE archived = true OR archived = false
```

---

## 🛠️ IMPLEMENTATION TASKS

### **TASK 1: Fix Admin Dashboard** (HIGH PRIORITY)
**File:** `Back/App/routes/admin.py`

**Current Issue:** Shows ALL evaluations from all periods

**Fix:**
```python
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    period_id: Optional[int] = Query(None),  # ADD THIS
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
    # Get active period if not specified
    if not period_id:
        period = db.query(EvaluationPeriod).filter(
            EvaluationPeriod.status == 'active'
        ).first()
        period_id = period.id if period else None
    
    # Add WHERE evaluation_period_id = :period_id to ALL queries
    # - total_evaluations query
    # - sentiment_stats query
    # - recent_evaluations query
```

---

### **TASK 2: Add Period Filter to Course Lists**
**File:** `Back/App/routes/secretary.py` - Line ~190

**Current Issue:** `/courses` endpoint shows evaluations from all periods

**Fix:**
```python
@router.get("/courses")
async def get_courses(
    user_id: int = Query(...),
    period_id: Optional[int] = Query(None),  # ADD THIS
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Get active period if not specified
    if not period_id:
        period = db.query(EvaluationPeriod).filter(
            EvaluationPeriod.status == 'active'
        ).first()
        period_id = period.id if period else None
    
    # Update evaluation count subquery:
    eval_count_subq = db.query(
        Evaluation.class_section_id,
        func.count(Evaluation.id).label('eval_count'),
        func.avg(Evaluation.rating_overall).label('avg_rating')
    ).filter(
        Evaluation.status == 'completed',
        Evaluation.evaluation_period_id == period_id  # ADD THIS
    ).group_by(Evaluation.class_section_id).subquery()
    
    # Update enrollment count subquery:
    enroll_count_subq = db.query(
        Enrollment.class_section_id,
        func.count(Enrollment.id).label('enroll_count')
    ).filter(
        Enrollment.status == 'active',
        Enrollment.evaluation_period_id == period_id  # ADD THIS
    ).group_by(Enrollment.class_section_id).subquery()
```

---

### **TASK 3: Add Period Dropdown to Frontend**
**Files:**
- `New/capstone/src/pages/admin/Dashboard.jsx`
- `New/capstone/src/pages/secretary/Dashboard.jsx`
- `New/capstone/src/pages/department-head/Dashboard.jsx`

**Add Component:**
```jsx
import { useState, useEffect } from 'react';

function PeriodSelector({ onPeriodChange }) {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  
  useEffect(() => {
    // Fetch evaluation periods
    fetch('/api/evaluation-periods', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      setPeriods(data.data);
      // Auto-select active period
      const active = data.data.find(p => p.status === 'active');
      if (active) {
        setSelectedPeriod(active.id);
        onPeriodChange(active.id);
      }
    });
  }, []);
  
  return (
    <select 
      value={selectedPeriod || ''} 
      onChange={(e) => {
        setSelectedPeriod(e.target.value);
        onPeriodChange(e.target.value);
      }}
      className="border rounded px-3 py-2"
    >
      <option value="">All Periods</option>
      {periods.map(p => (
        <option key={p.id} value={p.id}>
          {p.name} {p.status === 'active' ? '⭐' : ''}
        </option>
      ))}
    </select>
  );
}
```

---

### **TASK 4: Add Evaluation Period API Endpoint**
**File:** `Back/App/routes/evaluation_periods.py` (or create new)

**Add Endpoint:**
```python
@router.get("/evaluation-periods")
async def get_evaluation_periods(
    include_archived: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get all evaluation periods for dropdown selection"""
    query = db.query(EvaluationPeriod)
    
    if not include_archived:
        query = query.filter(
            or_(
                EvaluationPeriod.archived == False,
                EvaluationPeriod.archived.is_(None)
            )
        )
    
    periods = query.order_by(
        EvaluationPeriod.end_date.desc()
    ).all()
    
    return {
        "success": True,
        "data": [
            {
                "id": p.id,
                "name": p.name,
                "semester": p.semester,
                "academic_year": p.academic_year,
                "status": p.status,
                "start_date": p.start_date.isoformat(),
                "end_date": p.end_date.isoformat(),
                "is_active": p.status == 'active'
            }
            for p in periods
        ]
    }
```

---

### **TASK 5: Add Data Archiving**
**File:** `Back/App/archive_old_periods.py` (new script)

```python
"""
Archive evaluation periods older than 1 year
Run this script at the end of each academic year
"""
from database.connection import get_db
from sqlalchemy import text
from datetime import datetime, timedelta

db = next(get_db())

# Archive periods older than 1 year
one_year_ago = datetime.now() - timedelta(days=365)

result = db.execute(text("""
    UPDATE evaluation_periods
    SET archived = true
    WHERE end_date < :cutoff_date
    AND archived = false
    RETURNING id, name;
"""), {"cutoff_date": one_year_ago})

archived = result.fetchall()

print(f"✅ Archived {len(archived)} evaluation periods:")
for period in archived:
    print(f"  - Period {period[0]}: {period[1]}")

db.commit()
db.close()
```

---

## 📊 QUERY OPTIMIZATION PATTERNS

### **Pattern 1: Period-Scoped Queries**
```sql
-- BEFORE (slow - scans all data):
SELECT COUNT(*) FROM evaluations;

-- AFTER (fast - uses period index):
SELECT COUNT(*) 
FROM evaluations 
WHERE evaluation_period_id = 7;
```

### **Pattern 2: Conditional "All Time" Queries**
```sql
-- Frontend sends: period_id=null → show all
--                 period_id=7 → show period 7
SELECT * FROM evaluations
WHERE (:period_id IS NULL OR evaluation_period_id = :period_id)
AND status = 'completed';
```

### **Pattern 3: Exclude Archived by Default**
```sql
SELECT * FROM evaluation_periods ep
JOIN evaluations e ON e.evaluation_period_id = ep.id
WHERE (ep.archived = false OR ep.archived IS NULL)
AND e.status = 'completed';
```

---

## 🎯 PRIORITY ORDER

### **Phase 1: Core Functionality** (This Week)
1. ✅ Add `period_id` parameter to admin dashboard
2. ✅ Add `period_id` parameter to course lists
3. ✅ Add `period_id` parameter to all reports
4. ✅ Create evaluation periods API endpoint

### **Phase 2: Frontend Integration** (Next Week)
1. ✅ Add period selector component
2. ✅ Integrate selector into all dashboards
3. ✅ Update API calls to include period_id
4. ✅ Add "All Periods" option for historical reports

### **Phase 3: Data Management** (Future)
1. ⚠️ Add `archived` column to evaluation_periods table
2. ⚠️ Create archiving script for old periods
3. ⚠️ Implement data retention policy
4. ⚠️ Add bulk export for archived data

---

## ✅ SUCCESS CRITERIA

After implementation:
- ✅ Dashboards load in < 2 seconds (even with 1000+ evaluations)
- ✅ Default view shows current semester only
- ✅ Users can easily switch between periods
- ✅ Historical data accessible but not overwhelming
- ✅ System scales to 5+ years of data
- ✅ No confusion about which semester is displayed

---

## 📝 DATABASE SCHEMA CHANGES NEEDED

```sql
-- 1. Add archived flag to evaluation_periods
ALTER TABLE evaluation_periods 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- 2. Update existing old periods (optional)
UPDATE evaluation_periods
SET archived = true
WHERE end_date < NOW() - INTERVAL '1 year';

-- 3. Add index for archived queries
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_archived 
ON evaluation_periods(archived, end_date DESC);
```

---

## 🚀 IMPLEMENTATION ESTIMATE

- **Backend Changes:** 2-3 hours
  - Add period_id parameters: 1 hour
  - Update queries: 1 hour
  - Create new endpoint: 30 min
  - Testing: 30 min

- **Frontend Changes:** 2-3 hours
  - Create period selector: 1 hour
  - Integrate into pages: 1 hour
  - Update API calls: 30 min
  - Testing: 30 min

- **Database Changes:** 30 minutes
  - Add column: 5 min
  - Create index: 5 min
  - Create archiving script: 20 min

**Total:** 5-7 hours of development

---

## 💡 KEY INSIGHT

> **The problem is NOT about deleting data or performance optimization.**  
> **It's about SMART FILTERING - showing the right data at the right time.**

By defaulting to the **active evaluation period** and allowing users to select other periods when needed, the system will:
- ✅ Feel fast and responsive
- ✅ Show relevant data by default
- ✅ Keep historical data accessible
- ✅ Scale to many years of usage
- ✅ Meet functional requirements for school deployment

---

## 📚 NEXT STEPS

1. **Review this plan** - Confirm approach makes sense
2. **Implement Phase 1** - Backend period filtering
3. **Test with real data** - Verify queries work correctly
4. **Implement Phase 2** - Frontend period selector
5. **Deploy and monitor** - Ensure dashboards load fast

**Ready to start implementation?** Let me know which task to tackle first!
