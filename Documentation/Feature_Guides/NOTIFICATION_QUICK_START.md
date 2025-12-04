# Notification System - Quick Start Guide

## For Developers: How to Send Notifications

### 1. Import the Service
```python
from services.notification_service import notification_service, notification_templates
from database.connection import get_db
```

### 2. Get Database Session
```python
db = next(get_db())
```

### 3. Send Notification

#### Option A: Send to Specific User
```python
notification_service.send_notification(
    db=db,
    user_id=123,
    title="Evaluation Submitted",
    message="Your evaluation for BSCS 101 has been submitted successfully.",
    notification_type="success",  # info, success, warning, error
    link="/student/evaluations"  # Optional URL
)
```

#### Option B: Use Pre-defined Template
```python
# Get template
title, message, type = notification_templates.evaluation_submitted("BSCS 101")

# Send notification
notification_service.send_notification(
    db=db,
    user_id=123,
    title=title,
    message=message,
    notification_type=type
)
```

#### Option C: Broadcast to Role
```python
# Send to all students
notification_service.broadcast_to_role(
    db=db,
    role="student",
    title="New Evaluation Period",
    message="Midterm evaluations are now open. Please complete by Dec 31.",
    notification_type="info"
)
```

#### Option D: Broadcast to Everyone
```python
# Send to all active users
notification_service.broadcast_to_all(
    db=db,
    title="System Maintenance",
    message="The system will be down for maintenance on Dec 25 from 2-4 AM.",
    notification_type="warning"
)
```

---

## Available Templates

### Evaluation-Related
```python
# Evaluation period started
title, msg, type = notification_templates.evaluation_period_started(
    period_name="Midterm 2024",
    deadline="Dec 31, 2024"
)

# Evaluation period ending soon
title, msg, type = notification_templates.evaluation_period_ending_soon(
    period_name="Midterm 2024",
    days_left=3
)

# Evaluation submitted
title, msg, type = notification_templates.evaluation_submitted(
    course_name="BSCS 101"
)

# Results available
title, msg, type = notification_templates.evaluation_results_ready(
    period_name="Midterm 2024"
)
```

### Alert Templates
```python
# Anomaly detected
title, msg, type = notification_templates.anomaly_detected(
    course_name="BSCS 101",
    instructor_name="Prof. Smith"
)

# Negative sentiment alert
title, msg, type = notification_templates.negative_sentiment_alert(
    course_name="BSCS 101"
)
```

### Account Templates
```python
# Welcome message
title, msg, type = notification_templates.welcome_message(
    user_name="John Doe",
    role="student"
)

# Password changed
title, msg, type = notification_templates.password_changed()

# Account activated
title, msg, type = notification_templates.account_activated()

# Account deactivated
title, msg, type = notification_templates.account_deactivated()
```

### Student Advancement
```python
# Student advanced to next year
title, msg, type = notification_templates.student_advanced(
    new_year_level=3
)
```

---

## Integration Examples

### Example 1: Send Notification When Evaluation Submitted
```python
# In routes/student.py - after evaluation submission
from services.notification_service import notification_service, notification_templates

@router.post("/evaluations")
async def submit_evaluation(evaluation: dict, db: Session = Depends(get_db)):
    # ... save evaluation logic ...
    
    # Send notification to student
    title, message, type = notification_templates.evaluation_submitted(
        course_name=evaluation['course_name']
    )
    notification_service.send_notification(
        db=db,
        user_id=evaluation['student_id'],
        title=title,
        message=message,
        notification_type=type,
        link=f"/student/evaluations/{evaluation_id}"
    )
    
    return {"success": True}
```

### Example 2: Notify When Evaluation Period Opens
```python
# In routes/evaluation_periods.py - when period is activated
from services.notification_service import notification_service, notification_templates

@router.put("/evaluation-periods/{period_id}/status")
async def update_period_status(
    period_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    # ... update period status ...
    
    if status == "active":
        # Get period details
        period = get_period_by_id(db, period_id)
        
        # Notify all students
        title, message, type = notification_templates.evaluation_period_started(
            period_name=period['name'],
            deadline=period['end_date'].strftime('%B %d, %Y')
        )
        notification_service.broadcast_to_role(
            db=db,
            role="student",
            title=title,
            message=message,
            notification_type=type,
            link="/student/evaluations"
        )
    
    return {"success": True}
```

### Example 3: Alert Department Head on Anomaly
```python
# In ML analysis - when anomaly detected
from services.notification_service import notification_service, notification_templates

def analyze_feedback(db, section_id):
    # ... ML analysis logic ...
    
    if anomaly_detected:
        # Get department head
        dept_head_id = get_department_head_for_section(db, section_id)
        
        # Send alert
        title, message, type = notification_templates.anomaly_detected(
            course_name=section['course_name'],
            instructor_name=section['instructor_name']
        )
        notification_service.send_notification(
            db=db,
            user_id=dept_head_id,
            title=title,
            message=message,
            notification_type="warning",
            link=f"/dept-head/anomalies?section={section_id}"
        )
```

### Example 4: Welcome New Users
```python
# In routes/admin.py - when creating new user
from services.notification_service import notification_service, notification_templates

@router.post("/users")
async def create_user(user: dict, db: Session = Depends(get_db)):
    # ... create user logic ...
    
    # Send welcome notification
    title, message, type = notification_templates.welcome_message(
        user_name=f"{user['first_name']} {user['last_name']}",
        role=user['role']
    )
    notification_service.send_notification(
        db=db,
        user_id=new_user_id,
        title=title,
        message=message,
        notification_type=type,
        link="/profile"
    )
    
    return {"success": True, "user_id": new_user_id}
```

---

## Frontend Integration

### Add to Layout/Navbar
```jsx
// In your main layout or navbar component
import NotificationBell from '@/components/NotificationBell';

function Navbar() {
  const currentUser = useAuth(); // Your auth hook
  
  return (
    <AppBar>
      <Toolbar>
        {/* ... other navbar items ... */}
        
        {/* Add notification bell */}
        <NotificationBell userId={currentUser.id} />
        
        {/* ... other navbar items ... */}
      </Toolbar>
    </AppBar>
  );
}
```

### Customize Polling Interval
```jsx
// In NotificationBell.jsx, change the interval (default: 30 seconds)
useEffect(() => {
  // ...
  const interval = setInterval(() => {
    fetchUnreadCount();
  }, 60000); // Change to 60 seconds
  // ...
}, [userId]);
```

---

## API Endpoints Available

### GET /api/notifications
Get user's notifications
- **Query Params:**
  - `user_id` (required): User ID
  - `unread_only` (optional): Show only unread
  - `limit` (optional): Max results (default: 20)

### GET /api/notifications/unread-count
Get unread count
- **Query Params:**
  - `user_id` (required): User ID

### POST /api/notifications/{notification_id}/mark-read
Mark notification as read
- **Query Params:**
  - `user_id` (required): User ID

### POST /api/notifications/mark-all-read
Mark all as read
- **Query Params:**
  - `user_id` (required): User ID

### POST /api/notifications
Create notification (admin only)
- **Body:**
  ```json
  {
    "user_id": 123,
    "title": "Title",
    "message": "Message",
    "type": "info",
    "link": "/path"
  }
  ```

### POST /api/notifications/broadcast
Broadcast to role/all (admin only)
- **Query Params:**
  - `title` (required): Notification title
  - `message` (required): Notification message
  - `type` (optional): Notification type (default: info)
  - `role` (optional): Target role (all if not specified)

### DELETE /api/notifications/{notification_id}
Delete notification
- **Query Params:**
  - `user_id` (required): User ID

---

## Testing

### Test Backend
```bash
# Import test
python -c "from routes.notifications import router; print('✅ Notifications loaded')"

# Database test
python -c "from database.connection import get_db; from sqlalchemy import text; db=next(get_db()); print(db.execute(text('SELECT COUNT(*) FROM notifications')).scalar())"
```

### Test Frontend
```bash
# In browser console
fetch('http://localhost:8000/api/notifications/unread-count?user_id=1')
  .then(r => r.json())
  .then(d => console.log(d));
```

### Manual Test Flow
1. Start backend: `python main.py`
2. Start frontend: `npm run dev`
3. Login as user
4. Check notification bell appears in navbar
5. Send test notification via API
6. Verify notification appears in dropdown
7. Click notification to mark as read
8. Delete notification

---

## Troubleshooting

### Notifications Not Showing
1. Check user_id is correct
2. Verify notifications table exists: `SELECT * FROM notifications LIMIT 1`
3. Check API response in browser Network tab
4. Verify frontend component is imported correctly

### Polling Not Working
1. Check browser console for errors
2. Verify CORS is configured correctly
3. Check API URL is correct (http://localhost:8000)
4. Verify user_id is being passed

### Database Errors
1. Ensure notifications table exists: `python create_notifications_table.py`
2. Check foreign key constraints
3. Verify user_id exists in users table

---

## Best Practices

1. **Always use templates** for common notifications (consistent messaging)
2. **Include links** when possible (better UX)
3. **Use appropriate types:**
   - `info`: General information
   - `success`: Successful actions
   - `warning`: Important alerts
   - `error`: Critical issues
4. **Keep messages concise** (2-3 sentences max)
5. **Batch notifications** when possible (don't spam users)
6. **Clean up old notifications** (add cron job to delete after 30 days)

---

## Notification Type Guidelines

| Type | When to Use | Example |
|------|-------------|---------|
| `info` | General updates, reminders | "New evaluation period is open" |
| `success` | Completed actions | "Evaluation submitted successfully" |
| `warning` | Important alerts, deadlines | "Evaluation period ends in 2 days" |
| `error` | Critical issues, failures | "System error - please contact support" |

---

## Need Help?

- **API Docs:** http://localhost:8000/docs
- **System Report:** SYSTEM_DIAGNOSTIC_REPORT.md
- **Implementation Details:** OPTIONAL_FEATURES_IMPLEMENTATION.md
