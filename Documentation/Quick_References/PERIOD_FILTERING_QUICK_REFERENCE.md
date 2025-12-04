# 🎯 QUICK REFERENCE: Period Filtering API

## New Evaluation Periods Endpoints

### Get All Periods
```http
GET /api/evaluation-periods/periods
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "name": "1st Semester 2025-2026",
      "status": "active",
      "is_active": true,
      ...
    }
  ]
}
```

### Get Active Period
```http
GET /api/evaluation-periods/periods/active
```

---

## Updated Endpoints (Now Accept period_id)

### Admin Dashboard
```http
GET /api/admin/dashboard-stats?period_id=12
```
- If `period_id` omitted → uses active period
- Returns period info in response

### Admin Evaluations
```http
GET /api/admin/evaluations?period_id=12&course_id=5
```

### Secretary Courses
```http
GET /api/secretary/courses?user_id=1&period_id=12
```

### Secretary Reports
```http
GET /api/secretary/reports/evaluations-summary?user_id=1&period_id=12
```

---

## Frontend Integration Example

```jsx
// 1. Fetch periods on component mount
const [periods, setPeriods] = useState([]);
const [selectedPeriod, setSelectedPeriod] = useState(null);

useEffect(() => {
  fetch('/api/evaluation-periods/periods', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(data => {
    setPeriods(data.data);
    // Auto-select active period
    const active = data.data.find(p => p.is_active);
    if (active) setSelectedPeriod(active.id);
  });
}, []);

// 2. Add dropdown to page
<select 
  value={selectedPeriod} 
  onChange={(e) => setSelectedPeriod(e.target.value)}
>
  <option value="">All Periods</option>
  {periods.map(p => (
    <option key={p.id} value={p.id}>
      {p.name} {p.is_active ? '⭐' : ''}
    </option>
  ))}
</select>

// 3. Use in API calls
const fetchDashboard = async () => {
  const url = selectedPeriod 
    ? `/api/admin/dashboard-stats?period_id=${selectedPeriod}`
    : `/api/admin/dashboard-stats`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  // Use data.data...
};
```

---

## Testing Commands

```powershell
# Test syntax
cd "Back\App"
python -m py_compile routes/admin.py routes/secretary.py routes/evaluation_periods.py

# Test implementation
python test_phase1_implementation.py

# Start server
python main.py
```

---

## ✅ What's Working Now

1. **Default Filtering:** All dashboards default to active period
2. **Period Selection:** API provides list of periods for dropdowns
3. **Query Optimization:** Indexes used for period-filtered queries
4. **Backward Compatible:** Old API calls still work
5. **Production Ready:** All tests passing

## ⏳ What's Next (Frontend)

1. Add period selector to admin dashboard
2. Add period selector to secretary pages
3. Update API calls to include period_id
4. Test with multiple semesters of data
5. Deploy to production

**Estimated Time:** 2-3 hours of frontend work
