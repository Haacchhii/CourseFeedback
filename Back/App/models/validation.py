"""
Pydantic validation models for API endpoints
Ensures data integrity and prevents errors from invalid input
"""
from pydantic import BaseModel, validator, Field
from typing import Optional, Dict, List
from datetime import datetime

class EvaluationCreate(BaseModel):
    """Validation for creating evaluations"""
    student_id: int = Field(..., gt=0, description="Student ID must be positive")
    course_id: int = Field(..., gt=0, description="Course ID must be positive")
    class_section_id: int = Field(..., gt=0, description="Class section ID must be positive")
    evaluation_period_id: int = Field(..., gt=0, description="Evaluation period ID must be positive")
    ratings: Dict = Field(..., description="Ratings dictionary with question IDs and scores")
    comments: Optional[str] = Field(None, max_length=5000, description="Optional comments")
    
    @validator('ratings')
    def validate_ratings(cls, v):
        if not isinstance(v, dict):
            raise ValueError('Ratings must be a dictionary')
        if len(v) == 0:
            raise ValueError('Ratings cannot be empty')
        # Validate rating values are within 1-5 range
        for key, value in v.items():
            if not isinstance(value, (int, float)):
                raise ValueError(f'Rating value for {key} must be a number')
            if value < 1 or value > 5:
                raise ValueError(f'Rating value for {key} must be between 1 and 5')
        return v

class UserCreate(BaseModel):
    """Validation for creating users"""
    email: str = Field(..., min_length=5, max_length=255, description="Valid email address")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    role: str = Field(..., description="User role")
    password: Optional[str] = Field(None, min_length=8, description="Password (min 8 characters)")
    student_number: Optional[str] = Field(None, max_length=50, description="Student number (if student)")
    program_id: Optional[int] = Field(None, gt=0, description="Program ID (if student)")
    year_level: Optional[int] = Field(None, ge=1, le=5, description="Year level 1-5 (if student)")
    
    @validator('email')
    def validate_email(cls, v):
        if '@' not in v or '.' not in v:
            raise ValueError('Invalid email format')
        # Enforce @lpubatangas.edu.ph domain
        if not v.lower().endswith('@lpubatangas.edu.ph'):
            raise ValueError('Email must be from @lpubatangas.edu.ph domain')
        return v.lower()
    
    @validator('role')
    def validate_role(cls, v):
        valid_roles = ['admin', 'student', 'instructor', 'secretary', 'department_head']
        if v not in valid_roles:
            raise ValueError(f'Role must be one of: {", ".join(valid_roles)}')
        return v

class CourseCreate(BaseModel):
    """Validation for creating courses"""
    course_code: str = Field(..., min_length=1, max_length=50, description="Course code")
    course_name: str = Field(..., min_length=1, max_length=255, description="Course name")
    program_id: int = Field(..., gt=0, description="Program ID")
    year_level: int = Field(..., ge=1, le=5, description="Year level 1-5")
    semester: int = Field(..., ge=1, le=3, description="Semester 1-3")
    units: Optional[int] = Field(3, ge=1, le=6, description="Course units")
    
    @validator('course_code')
    def validate_course_code(cls, v):
        return v.upper().strip()

class SectionCreate(BaseModel):
    """Validation for creating class sections"""
    course_id: int = Field(..., gt=0, description="Course ID")
    instructor_id: int = Field(..., gt=0, description="Instructor ID")
    section_name: str = Field(..., min_length=1, max_length=100, description="Section name")
    schedule: Optional[str] = Field(None, max_length=255, description="Class schedule")
    semester: int = Field(..., ge=1, le=3, description="Semester 1-3")
    school_year: str = Field(..., pattern=r'^\d{4}-\d{4}$', description="School year format: YYYY-YYYY")

class EvaluationPeriodCreate(BaseModel):
    """Validation for creating evaluation periods"""
    name: str = Field(..., min_length=1, max_length=255, description="Period name")
    start_date: datetime = Field(..., description="Start date and time")
    end_date: datetime = Field(..., description="End date and time")
    semester: int = Field(..., ge=1, le=3, description="Semester 1-3")
    school_year: str = Field(..., pattern=r'^\d{4}-\d{4}$', description="School year format: YYYY-YYYY")
    is_active: bool = Field(False, description="Active status")
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

class NotificationCreate(BaseModel):
    """Validation for creating notifications"""
    user_id: int = Field(..., gt=0, description="User ID")
    title: str = Field(..., min_length=1, max_length=200, description="Notification title")
    message: str = Field(..., min_length=1, max_length=1000, description="Notification message")
    type: str = Field("info", description="Notification type")
    link: Optional[str] = Field(None, max_length=500, description="Optional URL")
    
    @validator('type')
    def validate_type(cls, v):
        valid_types = ['info', 'success', 'warning', 'error']
        if v not in valid_types:
            raise ValueError(f'Type must be one of: {", ".join(valid_types)}')
        return v

class PasswordChange(BaseModel):
    """Validation for password changes"""
    user_id: int = Field(..., gt=0, description="User ID")
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c in '!@#$%^&*(),.?":{}|<>' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v

class EnrollmentCreate(BaseModel):
    """Validation for student enrollments"""
    student_id: int = Field(..., gt=0, description="Student ID")
    section_id: int = Field(..., gt=0, description="Section ID")
    enrollment_date: Optional[datetime] = Field(None, description="Enrollment date")

class IDListRequest(BaseModel):
    """Validation for batch operations with ID lists"""
    ids: List[int] = Field(..., min_items=1, description="List of IDs")
    
    @validator('ids')
    def validate_ids(cls, v):
        if not all(isinstance(id, int) and id > 0 for id in v):
            raise ValueError('All IDs must be positive integers')
        return list(set(v))  # Remove duplicates

# Response models for consistency
class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: str
    data: Optional[Dict] = None

class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)
