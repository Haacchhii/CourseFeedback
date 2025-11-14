# Filter Fixes and Infinite Loop Resolution Summary

## Issues Addressed

### 1. Empty Filter Dropdowns
**Problem**: Year level and program filter dropdowns were showing no options on staff pages (Dashboard, SentimentAnalysis, Evaluations)
**Root Cause**: Frontend components had hardcoded empty arrays: `const yearLevelOptions = []` and similar

### 2. Infinite Loading Loop
**Problem**: Staff pages (instructor, department_head, secretary) were experiencing infinite loading loops
**Root Cause**: Components were using `getCurrentUser()` from `roleUtils.js` which creates a new object reference on every call, causing infinite re-renders in useEffect dependencies

## Solution Implementation

### Backend Changes

#### 1. Added Filter Endpoints to instructor.py
**File**: `Back/App/routes/instructor.py`
**Lines**: 420-485

```python
@router.get("/programs")
async def get_programs(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Get all programs for filtering"""
    # Returns all programs from database
    
@router.get("/year-levels")
async def get_year_levels(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Get year levels for filtering"""
    # Returns years 1-4 with labels
```

#### 2. Added Filter Endpoints to department_head.py
**File**: `Back/App/routes/department_head.py`
**Lines**: 800-865

```python
@router.get("/programs")
async def get_programs(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Get programs managed by department head"""
    # Returns only programs assigned to this dept head
    # Uses parse_program_ids() to filter by dept_head.programs
    
@router.get("/year-levels")
async def get_year_levels(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Get year levels for filtering"""
    # Returns years 1-4 with labels
```

#### 3. Added Year Levels Endpoint to secretary.py
**File**: `Back/App/routes/secretary.py`
**Lines**: 515-541

```python
@router.get("/year-levels")
async def get_year_levels(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Get year levels for filtering"""
    # Returns years 1-4 with labels
```

*Note*: secretary.py already had `/programs` endpoint

### Frontend Changes

#### 1. Updated API Service
**File**: `New/capstone/src/services/api.js`

**Added to instructorAPI**:
```javascript
getPrograms: async () => {
  const currentUser = authAPI.getCurrentUser()
  return apiClient.get(`/instructor/programs?user_id=${currentUser?.id}`)
},

getYearLevels: async () => {
  const currentUser = authAPI.getCurrentUser()
  return apiClient.get(`/instructor/year-levels?user_id=${currentUser?.id}`)
},
```

**Added to deptHeadAPI**:
```javascript
getPrograms: async () => {
  const currentUser = authAPI.getCurrentUser()
  return apiClient.get(`/dept-head/programs?user_id=${currentUser?.id}`)
},

getYearLevels: async () => {
  const currentUser = authAPI.getCurrentUser()
  return apiClient.get(`/dept-head/year-levels?user_id=${currentUser?.id}`)
},
```

**Added to secretaryAPI**:
```javascript
getYearLevels: async () => {
  const currentUser = authAPI.getCurrentUser()
  return apiClient.get(`/secretary/year-levels?user_id=${currentUser?.id}`)
},
```

#### 2. Updated Dashboard.jsx
**File**: `New/capstone/src/pages/staff/Dashboard.jsx`

**Changes**:
1. **Fixed Infinite Loop**: Changed from `getCurrentUser()` to `useAuth()` hook
   ```javascript
   // Before
   const currentUser = getCurrentUser()
   
   // After
   import { useAuth } from '../../context/AuthContext'
   const { user: currentUser } = useAuth()
   ```

2. **Added Dynamic Filters**: Added state and fetch logic for filter options
   ```javascript
   const [programOptions, setProgramOptions] = useState([])
   const [yearLevelOptions, setYearLevelOptions] = useState([])
   
   useEffect(() => {
     const fetchFilterOptions = async () => {
       // Fetch programs and year levels based on user role
       // Store in state for dropdown population
     }
     fetchFilterOptions()
   }, [currentUser?.role])
   ```

#### 3. Updated SentimentAnalysis.jsx
**File**: `New/capstone/src/pages/staff/SentimentAnalysis.jsx`

**Changes**:
1. **Fixed Infinite Loop**: Changed from `getCurrentUser()` to `useAuth()` hook
   ```javascript
   const { user: currentUser } = useAuth()
   ```

*Note*: SentimentAnalysis has filter options hidden in UI (line 182: "Filters temporarily hidden - API doesn't support filtering yet")

#### 4. Updated Evaluations.jsx
**File**: `New/capstone/src/pages/staff/Evaluations.jsx`

**Changes**:
1. **Fixed Infinite Loop**: Changed from `getCurrentUser()` to `useAuth()` hook
   ```javascript
   const { user: currentUser } = useAuth()
   ```

2. **Added Dynamic Filters**: Added state and fetch logic
   ```javascript
   const [programOptions, setProgramOptions] = useState([])
   const [yearLevelOptions, setYearLevelOptions] = useState([])
   
   useEffect(() => {
     const fetchFilterOptions = async () => {
       // Fetch from appropriate API based on role
     }
     fetchFilterOptions()
   }, [currentUser?.role])
   ```

3. **Updated Dropdown Rendering**:
   ```javascript
   // Programs dropdown
   {programOptions.map(program => (
     <option key={program.id} value={program.code}>
       {program.code} - {program.name}
     </option>
   ))}
   
   // Year levels dropdown
   {yearLevelOptions.map(yearLevel => (
     <option key={yearLevel.value} value={yearLevel.value}>
       {yearLevel.label}
     </option>
   ))}
   ```

## API Endpoints Summary

### Instructor Routes
- `GET /api/instructor/programs` - Returns all programs
- `GET /api/instructor/year-levels` - Returns years 1-4

### Department Head Routes
- `GET /api/dept-head/programs` - Returns only programs managed by this dept head
- `GET /api/dept-head/year-levels` - Returns years 1-4

### Secretary Routes
- `GET /api/secretary/programs` - Returns programs assigned to secretary (existing)
- `GET /api/secretary/year-levels` - Returns years 1-4 (new)

## Technical Details

### Infinite Loop Fix Explanation

**Problem**: Using `getCurrentUser()` from roleUtils.js:
```javascript
export function getCurrentUser() {
  const user = localStorage.getItem('currentUser')
  return user ? JSON.parse(user) : null  // Creates NEW object every time
}
```

Every call to `getCurrentUser()` creates a new object reference, even if the data is identical. When used in useEffect dependencies, this causes infinite re-renders:
```javascript
// BAD - Causes infinite loop
const currentUser = getCurrentUser()  // New object on every render
useEffect(() => {
  // Fetch data
}, [currentUser?.id])  // Dependency changes every render!
```

**Solution**: Use AuthContext which provides stable object references:
```javascript
// GOOD - Stable reference
const { user: currentUser } = useAuth()  // Same object reference
useEffect(() => {
  // Fetch data
}, [currentUser?.id])  // Dependency only changes when actual user changes
```

The `useAuth()` hook from AuthContext maintains a single user object in React state, which doesn't change reference unless the actual user data changes (login/logout).

### Filter Data Flow

1. **User lands on staff page** → Page component mounts
2. **useEffect triggers** → Fetches filter options based on user role
3. **Backend returns data** → Programs list + Year levels list
4. **State updates** → `setProgramOptions()` and `setYearLevelOptions()`
5. **Dropdowns populate** → User can now select filter options
6. **User changes filter** → useApiWithTimeout re-fetches data with new filters

### Department Head Filtering

Department heads have role-specific filtering:
- Their `programs` field contains array of program IDs they manage
- The `/programs` endpoint filters: `WHERE Program.id.in_(program_ids)`
- This ensures dept heads only see their assigned programs

## Testing Notes

### To Test Filters:
1. Login as instructor/dept_head/secretary
2. Navigate to Dashboard or Evaluations page
3. Verify program and year level dropdowns are populated
4. Select filter options and verify data updates

### To Verify No Infinite Loop:
1. Open browser DevTools → Network tab
2. Navigate to any staff page
3. Should see API calls complete without repeating indefinitely
4. Check Console for no repeated "fetching" logs

## Files Modified

### Backend (3 files)
1. `Back/App/routes/instructor.py` - Added /programs and /year-levels
2. `Back/App/routes/department_head.py` - Added /programs and /year-levels
3. `Back/App/routes/secretary.py` - Added /year-levels

### Frontend (4 files)
1. `New/capstone/src/services/api.js` - Added filter API methods to all 3 staff APIs
2. `New/capstone/src/pages/staff/Dashboard.jsx` - Added filter fetch + fixed infinite loop
3. `New/capstone/src/pages/staff/SentimentAnalysis.jsx` - Fixed infinite loop
4. `New/capstone/src/pages/staff/Evaluations.jsx` - Added filter fetch + fixed infinite loop

## Server Status

✅ Backend server restarted successfully
✅ All new endpoints registered:
  - GET /api/instructor/programs
  - GET /api/instructor/year-levels
  - GET /api/dept-head/programs
  - GET /api/dept-head/year-levels
  - GET /api/secretary/year-levels

## Next Steps

1. **Test filter functionality** on each staff role
2. **Verify no infinite loops** by checking network activity
3. **Test filtering logic** - ensure selected filters actually filter data
4. **Consider adding semester filter** if needed in future

## Notes

- Program filter uses `program.code` as value (e.g., "BSIT", "BSCS-DS")
- Year level filter uses numeric value (1-4)
- Semester filter already exists in Evaluations page
- SentimentAnalysis page has filters hidden by design (API limitation noted in code)
- Dashboard page fetches filter options but may not have UI elements yet (pending verification)
