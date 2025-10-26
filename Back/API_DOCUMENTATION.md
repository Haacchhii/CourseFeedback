# Course Feedback System - Backend API Documentation

## Overview
FastAPI backend with comprehensive role-based API endpoints for System Administrators, Department Heads, Secretaries, and Students.

**Base URL**: `http://localhost:8000`
**Frontend**: New/capstone (React + Vite on port 5173)

---

## Database Models Enhanced

### New Models Added:
1. **EvaluationPeriod** - Manage evaluation cycles with status tracking
2. **AuditLog** - Security and activity logging with severity levels
3. **SystemSettings** - Flexible JSONB-based settings by category
4. **Secretary** - Secretary user profile with program access

### Existing Models:
- User, Student, DepartmentHead, Course, ClassSection
- Enrollment, Evaluation, Program, AnalysisResult
- FirebaseSyncLog, NotificationQueue

---

## Authentication

### POST `/api/auth/login`
Login with email and password (bcrypt verification)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin",
    "name": "John Doe",
    "department": "IT"
  }
}
```

---

## System Administrator Routes
**Prefix**: `/api/admin`

### User Management

#### GET `/api/admin/users`
Get paginated list of all users with filters

**Query Parameters:**
- `page` (int, default: 1)
- `page_size` (int, default: 10, max: 100)
- `search` (string) - Search by name or email
- `role` (string) - Filter by role (student, department_head, secretary, admin)
- `status` (string) - Filter by status (active, inactive)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "student",
      "department": "IT",
      "is_active": true,
      "last_login": "2025-10-21T10:30:00",
      "created_at": "2025-01-15T09:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total": 828,
    "total_pages": 83
  }
}
```

#### POST `/api/admin/users`
Create a new user

**Query Parameters:**
- `current_user_id` (int, required) - ID of admin creating the user

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "student",
  "department": "IT",
  "program_id": 1,
  "year_level": 1,
  "password": "SecurePass123!"
}
```

#### PUT `/api/admin/users/{user_id}`
Update an existing user

#### DELETE `/api/admin/users/{user_id}`
Delete (soft delete) a user

#### POST `/api/admin/users/{user_id}/reset-password`
Reset user password

**Request Body:**
```json
{
  "new_password": "NewSecurePass123!"
}
```

#### GET `/api/admin/users/stats`
Get user statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 828,
    "students": 800,
    "dept_heads": 7,
    "secretaries": 20,
    "admins": 1,
    "active_users": 820
  }
}
```

### Evaluation Period Management

#### GET `/api/admin/evaluation-periods`
Get all evaluation periods

**Query Parameters:**
- `status` (string) - Filter by status (draft, active, closed)

#### POST `/api/admin/evaluation-periods`
Create a new evaluation period

**Request Body:**
```json
{
  "name": "First Semester Evaluation 2024-2025",
  "semester": "First Semester",
  "academic_year": "2024-2025",
  "start_date": "2025-10-01T00:00:00",
  "end_date": "2025-10-31T23:59:59"
}
```

#### PUT `/api/admin/evaluation-periods/{period_id}/status`
Update evaluation period status

**Request Body:**
```json
{
  "status": "active"
}
```

**Status Values**: draft, active, closed

#### GET `/api/admin/evaluation-periods/active`
Get currently active evaluation period

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "First Semester Evaluation 2024-2025",
    "semester": "First Semester",
    "academic_year": "2024-2025",
    "start_date": "2025-10-01T00:00:00",
    "end_date": "2025-10-31T23:59:59",
    "total_students": 1200,
    "completed_evaluations": 756,
    "participation_rate": 63.0,
    "days_remaining": 10
  }
}
```

### Course Management

#### GET `/api/admin/courses`
Get paginated list of all courses

**Query Parameters:**
- `page`, `page_size`, `search`, `program_id`, `year_level`

### System Settings

#### GET `/api/admin/settings/{category}`
Get system settings for a category

**Categories**: general, email, security, backup

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "general",
    "settings": {
      "institution_name": "University of Example",
      "academic_year": "2024-2025",
      "semester": "First Semester",
      "rating_scale": 5
    },
    "updated_at": "2025-10-20T15:30:00"
  }
}
```

#### PUT `/api/admin/settings`
Update system settings

**Request Body:**
```json
{
  "category": "security",
  "settings": {
    "password_min_length": 8,
    "require_uppercase": true,
    "session_timeout": 60,
    "max_login_attempts": 5
  }
}
```

### Audit Logs

#### GET `/api/admin/audit-logs`
Get paginated audit logs

**Query Parameters:**
- `page`, `page_size` (default: 15)
- `action` (string) - Filter by action type
- `severity` (string) - Filter by severity (Info, Warning, Critical)
- `user_id` (int) - Filter by user
- `start_date`, `end_date` (datetime) - Date range filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "user_email": "admin@example.com",
      "action": "USER_CREATED",
      "category": "User Management",
      "severity": "Info",
      "status": "Success",
      "ip_address": "192.168.1.100",
      "details": {"email": "newuser@example.com", "role": "student"},
      "created_at": "2025-10-21T10:30:00"
    }
  ],
  "pagination": {...}
}
```

#### GET `/api/admin/audit-logs/stats`
Get audit log statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "total_logs": 1543,
    "last_24h": 87,
    "critical_events": 3,
    "failed_blocked": 12
  }
}
```

### Data Export

#### GET `/api/admin/export/users`
Export all users

**Query Parameters:**
- `format` (string) - csv or json (default: csv)

#### GET `/api/admin/export/evaluations`
Export all evaluations

#### GET `/api/admin/dashboard-stats`
Get overall dashboard statistics

---

## Department Head Routes
**Prefix**: `/api/dept-head`

### Dashboard

#### GET `/api/dept-head/dashboard`
Get department head dashboard overview

**Query Parameters:**
- `user_id` (int, required) - Department head user ID

**Response:**
```json
{
  "success": true,
  "data": {
    "department": "Information Technology",
    "total_courses": 45,
    "total_evaluations": 523,
    "average_rating": 4.2,
    "sentiment": {
      "positive": 412,
      "neutral": 89,
      "negative": 22
    },
    "anomalies": 5
  }
}
```

### Evaluations

#### GET `/api/dept-head/evaluations`
Get department evaluations with filters

**Query Parameters:**
- `user_id` (int, required)
- `page`, `page_size`
- `course_id` (int) - Filter by course
- `sentiment` (string) - Filter by sentiment (positive, neutral, negative)
- `anomaly_only` (bool) - Show only anomalous evaluations

### Sentiment Analysis

#### GET `/api/dept-head/sentiment-analysis`
Get sentiment trends over time

**Query Parameters:**
- `user_id` (int, required)
- `time_range` (string) - week, month, semester, year (default: month)

**Response:**
```json
{
  "success": true,
  "data": {
    "time_range": "month",
    "trends": [
      {
        "date": "2025-10-01",
        "positive": 45,
        "neutral": 12,
        "negative": 3
      }
    ]
  }
}
```

### Course Reports

#### GET `/api/dept-head/courses`
Get all department courses with stats

#### GET `/api/dept-head/courses/{course_id}/report`
Get detailed report for a specific course

**Response:**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": 1,
      "code": "IT-101",
      "name": "Introduction to Programming",
      "year_level": 1,
      "semester": 1,
      "units": 3
    },
    "sections": [
      {
        "class_code": "IT-101-A",
        "instructor": "Prof. John Smith",
        "schedule": "MWF 9:00-10:00",
        "room": "IT-201",
        "evaluations_count": 38,
        "avg_ratings": {
          "overall": 4.5,
          "teaching": 4.6,
          "content": 4.4,
          "engagement": 4.3
        },
        "sentiment": {
          "positive": 32,
          "neutral": 5,
          "negative": 1
        }
      }
    ]
  }
}
```

### Instructor Performance

#### GET `/api/dept-head/instructors`
Get performance metrics for all instructors

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Prof. John Smith",
      "courses_count": 3,
      "courses": ["IT-101", "IT-202", "IT-303"],
      "total_evaluations": 112,
      "avg_rating": 4.5,
      "sentiment": {
        "positive": 95,
        "neutral": 15,
        "negative": 2
      }
    }
  ]
}
```

### Anomaly Detection

#### GET `/api/dept-head/anomalies`
Get detected anomalies in evaluations

### Trend Analysis

#### GET `/api/dept-head/trends`
Get trend analysis over time

**Query Parameters:**
- `user_id` (int, required)
- `metric` (string) - rating, sentiment, or engagement

---

## Secretary Routes
**Prefix**: `/api/secretary`

### Dashboard

#### GET `/api/secretary/dashboard`
Get secretary dashboard overview

**Query Parameters:**
- `user_id` (int, required)

**Response:**
```json
{
  "success": true,
  "data": {
    "department": "Information Technology",
    "total_courses": 45,
    "total_sections": 82,
    "total_evaluations": 523
  }
}
```

### Course Management

#### GET `/api/secretary/courses`
Get courses managed by secretary

**Query Parameters:**
- `user_id` (int, required)
- `page`, `page_size`, `search`, `program_id`

#### POST `/api/secretary/courses`
Create a new course

**Request Body:**
```json
{
  "course_code": "IT-401",
  "course_name": "Advanced Web Development",
  "program_id": 1,
  "year_level": 4,
  "semester": 1,
  "units": 3
}
```

#### PUT `/api/secretary/courses/{course_id}`
Update an existing course

#### DELETE `/api/secretary/courses/{course_id}`
Delete a course (only if no sections exist)

### Class Section Management

#### GET `/api/secretary/courses/{course_id}/sections`
Get all sections for a course

#### POST `/api/secretary/sections`
Create a new class section

**Request Body:**
```json
{
  "course_id": 1,
  "class_code": "IT-401-A",
  "instructor_name": "Prof. Jane Doe",
  "instructor_id": 5,
  "schedule": "TTH 1:00-2:30 PM",
  "room": "IT-305",
  "max_students": 40,
  "semester": "First Semester",
  "academic_year": "2024-2025"
}
```

#### PUT `/api/secretary/sections/{section_id}/assign-instructor`
Assign instructor to a class section

**Request Body:**
```json
{
  "instructor_name": "Prof. John Smith",
  "instructor_id": 3
}
```

### Programs

#### GET `/api/secretary/programs`
Get programs managed by secretary

### Reports

#### GET `/api/secretary/reports/evaluations-summary`
Get evaluation summary for secretary's programs

---

## Student Routes
**Prefix**: `/api/student`

### GET `/api/student/{student_id}/courses`
Get all courses for a student

### POST `/api/student/evaluations`
Submit a course evaluation

**Request Body:**
```json
{
  "course_id": 1,
  "ratings": {
    "teaching": 5,
    "content": 4,
    "engagement": 5,
    "overall": 5
  },
  "comment": "Great course! Very informative."
}
```

---

## Error Responses

All endpoints follow consistent error response format:

```json
{
  "detail": "Error message description"
}
```

**Common HTTP Status Codes:**
- 200: Success
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden (access denied)
- 404: Not Found
- 500: Internal Server Error

---

## Running the Backend

1. **Activate Python environment:**
   ```bash
   .venv\Scripts\Activate.ps1
   ```

2. **Install dependencies:**
   ```bash
   cd Back
   pip install -r requirements.txt
   ```

3. **Configure database:**
   - Update `Back/App/.env` with your database credentials
   - Run migrations if needed

4. **Start the server:**
   ```bash
   cd App
   python main.py
   ```

5. **Access API documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

---

## Frontend Integration

The New/capstone frontend is configured to connect to this backend:

**API Service Location**: `New/capstone/src/services/api.js`

**CORS Configured Ports**: 5173, 5174 (Vite default ports)

**Example API Call:**
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const getUsers = async (page = 1, pageSize = 10) => {
  const response = await axios.get(`${API_URL}/admin/users`, {
    params: { page, page_size: pageSize }
  });
  return response.data;
};
```

---

## Security Features

1. **Password Hashing**: bcrypt with salt
2. **Audit Logging**: All admin actions logged
3. **Role-Based Access Control**: Endpoint-level permissions
4. **CORS Protection**: Only allowed frontend origins
5. **SQL Injection Prevention**: SQLAlchemy parameterized queries
6. **Soft Deletes**: User data preserved, not permanently deleted

---

## Next Steps

1. **JWT Token Implementation**: Add token-based authentication
2. **Rate Limiting**: Prevent API abuse
3. **Caching**: Redis for frequently accessed data
4. **File Upload**: Handle bulk imports (CSV)
5. **Email Service**: Notification system integration
6. **WebSocket**: Real-time updates for dashboard
7. **ML Integration**: Sentiment analysis service
8. **Testing**: Unit tests and integration tests

---

## Support

For questions or issues, refer to:
- Backend code: `Back/App/routes/`
- Models: `Back/App/models/enhanced_models.py`
- Database schema: `Back/enhanced_database_schema.sql`
