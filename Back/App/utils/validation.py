"""
Input validation utilities for API endpoints
Provides comprehensive validation for filters, parameters, and user inputs
"""

from typing import Optional, List, Any
from datetime import datetime
from fastapi import HTTPException
import re

class ValidationError(Exception):
    """Custom validation error"""
    pass

class InputValidator:
    """Centralized input validation"""
    
    # Valid values
    VALID_ROLES = ['admin', 'student', 'secretary', 'department_head', 'instructor']
    VALID_FORMATS = ['csv', 'json', 'excel', 'pdf']
    VALID_SEMESTERS = ['1', '2', '3', '1st', '2nd', '1st Semester', '2nd Semester', 'Summer', 'all']
    VALID_STATUSES = ['active', 'inactive', 'draft', 'closed', 'all', 'Active', 'Archived']
    VALID_YEAR_LEVELS = [1, 2, 3, 4, 0]  # 0 means 'all'
    VALID_SENTIMENTS = ['positive', 'neutral', 'negative', 'all']
    VALID_ANOMALY_SEVERITIES = ['High', 'Medium', 'Low', 'all']
    
    # Max lengths
    MAX_STRING_LENGTH = 255
    MAX_EMAIL_LENGTH = 320
    MAX_TEXT_LENGTH = 5000
    
    @staticmethod
    def validate_format(format_value: str, allowed_formats: Optional[List[str]] = None) -> str:
        """Validate export format"""
        if not format_value:
            raise ValidationError("Format is required")
        
        format_value = format_value.lower().strip()
        allowed = allowed_formats or InputValidator.VALID_FORMATS
        
        if format_value not in allowed:
            raise ValidationError(
                f"Invalid format '{format_value}'. Allowed: {', '.join(allowed)}"
            )
        return format_value
    
    @staticmethod
    def validate_role(role: Optional[str]) -> Optional[str]:
        """Validate user role"""
        if not role or role == 'all':
            return None
        
        role = role.lower().strip()
        if role not in InputValidator.VALID_ROLES:
            raise ValidationError(
                f"Invalid role '{role}'. Allowed: {', '.join(InputValidator.VALID_ROLES)}"
            )
        return role
    
    @staticmethod
    def validate_semester(semester: Optional[str]) -> Optional[str]:
        """Validate semester value"""
        if not semester or semester == 'all':
            return None
        
        semester = semester.strip()
        
        # Normalize semester values
        semester_map = {
            '1': '1',
            '2': '2',
            '3': '3',
            '1st': '1',
            '2nd': '2',
            '1st Semester': '1',
            '2nd Semester': '2',
            'First Semester': '1',
            'Second Semester': '2',
            'Summer': '3'
        }
        
        normalized = semester_map.get(semester)
        if not normalized:
            raise ValidationError(
                f"Invalid semester '{semester}'. Allowed: {', '.join(InputValidator.VALID_SEMESTERS)}"
            )
        return normalized
    
    @staticmethod
    def validate_year_level(year_level: Optional[int]) -> Optional[int]:
        """Validate year level (1-4 or 0 for all)"""
        if year_level is None or year_level == 0:
            return None
        
        if not isinstance(year_level, int):
            try:
                year_level = int(year_level)
            except (ValueError, TypeError):
                raise ValidationError(f"Year level must be an integer, got '{year_level}'")
        
        if year_level not in InputValidator.VALID_YEAR_LEVELS:
            raise ValidationError(
                f"Invalid year level {year_level}. Allowed: 1, 2, 3, 4"
            )
        return year_level
    
    @staticmethod
    def validate_academic_year(academic_year: Optional[str]) -> Optional[str]:
        """Validate academic year format (YYYY-YYYY)"""
        if not academic_year or academic_year == 'all':
            return None
        
        academic_year = academic_year.strip()
        
        # Pattern: 2024-2025
        if not re.match(r'^\d{4}-\d{4}$', academic_year):
            raise ValidationError(
                f"Invalid academic year format '{academic_year}'. Expected format: YYYY-YYYY (e.g., 2024-2025)"
            )
        
        # Validate years are consecutive
        start_year, end_year = map(int, academic_year.split('-'))
        if end_year != start_year + 1:
            raise ValidationError(
                f"Invalid academic year '{academic_year}'. Years must be consecutive (e.g., 2024-2025)"
            )
        
        # Validate reasonable year range (1900-2100)
        if start_year < 1900 or end_year > 2100:
            raise ValidationError(
                f"Academic year '{academic_year}' is out of reasonable range"
            )
        
        return academic_year
    
    @staticmethod
    def validate_date(date_str: Optional[str], field_name: str = "date") -> Optional[datetime]:
        """Validate date string and convert to datetime"""
        if not date_str:
            return None
        
        date_str = date_str.strip()
        
        # Try multiple date formats
        formats = [
            '%Y-%m-%d',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%S.%f',
            '%d/%m/%Y',
            '%m/%d/%Y'
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        raise ValidationError(
            f"Invalid {field_name} format '{date_str}'. Expected: YYYY-MM-DD"
        )
    
    @staticmethod
    def validate_date_range(start_date: Optional[str], end_date: Optional[str]) -> tuple:
        """Validate date range (start must be before end)"""
        start_dt = InputValidator.validate_date(start_date, "start_date")
        end_dt = InputValidator.validate_date(end_date, "end_date")
        
        if start_dt and end_dt and start_dt > end_dt:
            raise ValidationError(
                f"Start date ({start_date}) must be before end date ({end_date})"
            )
        
        return start_dt, end_dt
    
    @staticmethod
    def validate_program_code(program_code: Optional[str]) -> Optional[str]:
        """Validate program code"""
        if not program_code or program_code == 'all':
            return None
        
        program_code = program_code.upper().strip()
        
        # Program codes should be alphanumeric with optional hyphens
        if not re.match(r'^[A-Z0-9\-]+$', program_code):
            raise ValidationError(
                f"Invalid program code '{program_code}'. Must contain only letters, numbers, and hyphens"
            )
        
        if len(program_code) > 20:
            raise ValidationError(
                f"Program code '{program_code}' is too long (max 20 characters)"
            )
        
        return program_code
    
    @staticmethod
    def validate_status(status: Optional[str]) -> Optional[str]:
        """Validate status value"""
        if not status or status == 'all':
            return None
        
        status = status.strip()
        
        # Normalize to lowercase for comparison
        status_lower = status.lower()
        valid_lower = [s.lower() for s in InputValidator.VALID_STATUSES]
        
        if status_lower not in valid_lower:
            raise ValidationError(
                f"Invalid status '{status}'. Allowed: {', '.join(InputValidator.VALID_STATUSES)}"
            )
        
        return status
    
    @staticmethod
    def validate_id(id_value: Optional[int], field_name: str = "id") -> Optional[int]:
        """Validate integer ID"""
        if id_value is None:
            return None
        
        if not isinstance(id_value, int):
            try:
                id_value = int(id_value)
            except (ValueError, TypeError):
                raise ValidationError(f"{field_name} must be an integer, got '{id_value}'")
        
        if id_value < 1:
            raise ValidationError(f"{field_name} must be a positive integer, got {id_value}")
        
        return id_value
    
    @staticmethod
    def validate_page_params(page: int = 1, page_size: int = 20) -> tuple:
        """Validate pagination parameters"""
        if not isinstance(page, int) or page < 1:
            raise ValidationError(f"Page must be a positive integer, got {page}")
        
        if not isinstance(page_size, int) or page_size < 1:
            raise ValidationError(f"Page size must be a positive integer, got {page_size}")
        
        if page_size > 1000:
            raise ValidationError(f"Page size too large (max 1000), got {page_size}")
        
        return page, page_size
    
    @staticmethod
    def validate_email(email: Optional[str]) -> Optional[str]:
        """Validate email format"""
        if not email:
            return None
        
        email = email.strip().lower()
        
        # Basic email regex
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValidationError(f"Invalid email format: {email}")
        
        if len(email) > InputValidator.MAX_EMAIL_LENGTH:
            raise ValidationError(f"Email too long (max {InputValidator.MAX_EMAIL_LENGTH} characters)")
        
        return email
    
    @staticmethod
    def validate_string_length(value: Optional[str], field_name: str, 
                              min_length: int = 0, max_length: int = MAX_STRING_LENGTH) -> Optional[str]:
        """Validate string length"""
        if not value:
            return None
        
        value = value.strip()
        
        if len(value) < min_length:
            raise ValidationError(
                f"{field_name} too short (min {min_length} characters), got {len(value)}"
            )
        
        if len(value) > max_length:
            raise ValidationError(
                f"{field_name} too long (max {max_length} characters), got {len(value)}"
            )
        
        return value
    
    @staticmethod
    def validate_sentiment(sentiment: Optional[str]) -> Optional[str]:
        """Validate sentiment value"""
        if not sentiment or sentiment == 'all':
            return None
        
        sentiment = sentiment.lower().strip()
        
        if sentiment not in InputValidator.VALID_SENTIMENTS:
            raise ValidationError(
                f"Invalid sentiment '{sentiment}'. Allowed: {', '.join(InputValidator.VALID_SENTIMENTS)}"
            )
        
        return sentiment
    
    @staticmethod
    def validate_severity(severity: Optional[str]) -> Optional[str]:
        """Validate anomaly severity"""
        if not severity or severity == 'all':
            return None
        
        severity = severity.strip()
        
        if severity not in InputValidator.VALID_ANOMALY_SEVERITIES:
            raise ValidationError(
                f"Invalid severity '{severity}'. Allowed: {', '.join(InputValidator.VALID_ANOMALY_SEVERITIES)}"
            )
        
        return severity
    
    @staticmethod
    def sanitize_search_query(query: Optional[str]) -> Optional[str]:
        """Sanitize search query to prevent SQL injection"""
        if not query:
            return None
        
        query = query.strip()
        
        # Remove potentially dangerous characters
        # Allow: letters, numbers, spaces, basic punctuation
        query = re.sub(r'[^\w\s\-@.\'"]', '', query)
        
        if len(query) > 100:
            raise ValidationError("Search query too long (max 100 characters)")
        
        return query
    
    @staticmethod
    def validate_rating(rating: Optional[int], field_name: str = "rating") -> Optional[int]:
        """Validate rating value (1-4 or 1-5)"""
        if rating is None:
            return None
        
        if not isinstance(rating, int):
            try:
                rating = int(rating)
            except (ValueError, TypeError):
                raise ValidationError(f"{field_name} must be an integer, got '{rating}'")
        
        if rating < 1 or rating > 5:
            raise ValidationError(f"{field_name} must be between 1 and 5, got {rating}")
        
        return rating


def validate_export_filters(
    format: str,
    role: Optional[str] = None,
    program: Optional[str] = None,
    semester: Optional[str] = None,
    academic_year: Optional[str] = None,
    year_level: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> dict:
    """
    Validate all export filter parameters
    Returns dict of validated values or raises ValidationError
    """
    try:
        validated = {
            'format': InputValidator.validate_format(format),
            'role': InputValidator.validate_role(role),
            'program': InputValidator.validate_program_code(program),
            'semester': InputValidator.validate_semester(semester),
            'academic_year': InputValidator.validate_academic_year(academic_year),
            'year_level': InputValidator.validate_year_level(year_level),
            'status': InputValidator.validate_status(status)
        }
        
        # Validate date range
        start_dt, end_dt = InputValidator.validate_date_range(start_date, end_date)
        validated['start_date'] = start_dt
        validated['end_date'] = end_dt
        
        return validated
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
