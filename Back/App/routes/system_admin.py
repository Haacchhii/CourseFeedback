"""
System Administrator Routes for Course Feedback System
Handles all system-level administrative functions including:
- User Management (CRUD)
- Evaluation Period Management
- Course Management
- System Settings
- Audit Logs
- Data Export
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from database.connection import get_db
from models.enhanced_models import (
    User, Student, DepartmentHead, Secretary, Course, ClassSection,
    Evaluation, EvaluationPeriod, AuditLog, SystemSettings, Program,
    Enrollment, Instructor
)
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import logging
import bcrypt
import json

logger = logging.getLogger(__name__)
router = APIRouter()

# ===========================
# Pydantic Models for Requests
# ===========================

class UserCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str  # student, department_head, secretary, admin
    department: Optional[str] = None
    program_id: Optional[int] = None
    year_level: Optional[int] = None
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class EvaluationPeriodCreate(BaseModel):
    name: str
    semester: str
    academic_year: str
    start_date: datetime
    end_date: datetime

class SystemSettingsUpdate(BaseModel):
    category: str
    settings: dict

class AuditLogCreate(BaseModel):
    action: str
    category: str
    severity: str = "Info"
    status: str = "Success"
    ip_address: Optional[str] = None
    details: Optional[dict] = None

# Helper function to log audit events
async def create_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    category: str,
    severity: str = "Info",
    status: str = "Success",
    ip_address: Optional[str] = None,
    details: Optional[dict] = None
):
    """Create an audit log entry"""
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            category=category,
            severity=severity,
            status=status,
            ip_address=ip_address,
            details=details
        )
        db.add(audit_log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
        db.rollback()

# ===========================
# USER MANAGEMENT ENDPOINTS
# ===========================

@router.get("/users")
async def get_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=10000),  # Increased limit to 10000 to accommodate large user lists
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get paginated list of all users with filters"""
    try:
        # Build base query
        query = db.query(User)
        
        # Apply filters
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.ilike(search_filter),
                    User.first_name.ilike(search_filter),
                    User.last_name.ilike(search_filter)
                )
            )
        
        if role:
            query = query.filter(User.role == role)
        
        if status:
            is_active = status == "active"
            query = query.filter(User.is_active == is_active)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        users = query.offset(offset).limit(page_size).all()
        
        # Format response
        users_data = []
        for user in users:
            user_dict = {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "department": user.department,
                "is_active": user.is_active,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            users_data.append(user_dict)
        
        return {
            "success": True,
            "data": users_data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users")
async def create_user(
    user_data: UserCreate,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new user"""
    try:
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Hash password
        password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user
        new_user = User(
            email=user_data.email,
            password_hash=password_hash,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role,
            department=user_data.department,
            is_active=True
        )
        db.add(new_user)
        db.flush()  # Get the user ID
        
        # Create role-specific record
        if user_data.role == "student" and user_data.program_id:
            student = Student(
                user_id=new_user.id,
                student_number=f"STU{new_user.id:05d}",  # Fixed: was student_id
                program_id=user_data.program_id,
                year_level=user_data.year_level or 1
            )
            db.add(student)
        elif user_data.role == "department_head":
            dept_head = DepartmentHead(
                user_id=new_user.id,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                department=user_data.department
            )
            db.add(dept_head)
        elif user_data.role == "secretary":
            secretary = Secretary(
                user_id=new_user.id,
                name=f"{user_data.first_name} {user_data.last_name}",
                department=user_data.department
            )
            db.add(secretary)
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "USER_CREATED", "User Management",
            details={"email": user_data.email, "role": user_data.role}
        )
        
        return {
            "success": True,
            "message": "User created successfully",
            "user_id": new_user.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update an existing user"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update fields
        if user_data.email:
            user.email = user_data.email
        if user_data.first_name:
            user.first_name = user_data.first_name
        if user_data.last_name:
            user.last_name = user_data.last_name
        if user_data.role:
            user.role = user_data.role
        if user_data.department is not None:
            user.department = user_data.department
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        
        user.updated_at = datetime.utcnow()
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "USER_UPDATED", "User Management",
            details={"user_id": user_id, "email": user.email}
        )
        
        return {
            "success": True,
            "message": "User updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Delete a user (soft delete by setting is_active=False)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Soft delete
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "USER_DELETED", "User Management",
            details={"user_id": user_id, "email": user.email}
        )
        
        return {
            "success": True,
            "message": "User deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    new_password: str = Body(..., embed=True),
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Reset a user's password"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Hash new password
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user.password_hash = password_hash
        user.updated_at = datetime.utcnow()
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "PASSWORD_RESET", "User Management", severity="Warning",
            details={"user_id": user_id, "email": user.email}
        )
        
        return {
            "success": True,
            "message": "Password reset successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/stats")
async def get_user_stats(db: Session = Depends(get_db)):
    """Get user statistics"""
    try:
        total_users = db.query(func.count(User.id)).scalar()
        students = db.query(func.count(User.id)).filter(User.role == "student").scalar()
        dept_heads = db.query(func.count(User.id)).filter(User.role == "department_head").scalar()
        secretaries = db.query(func.count(User.id)).filter(User.role == "secretary").scalar()
        admins = db.query(func.count(User.id)).filter(User.role == "admin").scalar()
        active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
        
        return {
            "success": True,
            "data": {
                "total_users": total_users or 0,
                "students": students or 0,
                "dept_heads": dept_heads or 0,
                "secretaries": secretaries or 0,
                "admins": admins or 0,
                "active_users": active_users or 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching user stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# EVALUATION PERIOD MANAGEMENT
# ===========================

@router.get("/evaluation-periods")
async def get_evaluation_periods(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all evaluation periods"""
    try:
        query = db.query(EvaluationPeriod)
        
        if status:
            query = query.filter(EvaluationPeriod.status == status)
        
        periods = query.order_by(EvaluationPeriod.start_date.desc()).all()
        
        periods_data = [{
            "id": p.id,
            "name": p.name,
            "semester": p.semester,
            "academic_year": p.academic_year,
            "start_date": p.start_date.isoformat(),
            "end_date": p.end_date.isoformat(),
            "status": p.status,
            "total_students": p.total_students,
            "completed_evaluations": p.completed_evaluations,
            "participation_rate": (p.completed_evaluations / p.total_students * 100) if p.total_students > 0 else 0,
            "created_at": p.created_at.isoformat()
        } for p in periods]
        
        return {
            "success": True,
            "data": periods_data
        }
        
    except Exception as e:
        logger.error(f"Error fetching evaluation periods: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluation-periods")
async def create_evaluation_period(
    period_data: EvaluationPeriodCreate,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new evaluation period"""
    try:
        # Get total students for this period
        total_students = db.query(func.count(Student.id)).scalar() or 0
        
        new_period = EvaluationPeriod(
            name=period_data.name,
            semester=period_data.semester,
            academic_year=period_data.academic_year,
            start_date=period_data.start_date,
            end_date=period_data.end_date,
            status="draft",
            total_students=total_students,
            created_by=current_user_id
        )
        db.add(new_period)
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "PERIOD_CREATED", "Evaluation Management",
            details={"period_name": period_data.name}
        )
        
        return {
            "success": True,
            "message": "Evaluation period created successfully",
            "period_id": new_period.id
        }
        
    except Exception as e:
        logger.error(f"Error creating evaluation period: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/evaluation-periods/{period_id}/status")
async def update_period_status(
    period_id: int,
    status: str = Body(..., embed=True),
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update evaluation period status (draft -> active -> closed)"""
    try:
        period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == period_id).first()
        if not period:
            raise HTTPException(status_code=404, detail="Evaluation period not found")
        
        # Close any other active periods if opening this one
        if status == "active":
            db.query(EvaluationPeriod).filter(
                EvaluationPeriod.status == "active"
            ).update({"status": "closed"})
        
        period.status = status
        period.updated_at = datetime.utcnow()
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, f"PERIOD_{status.upper()}", "Evaluation Management",
            severity="Warning" if status == "closed" else "Info",
            details={"period_id": period_id, "period_name": period.name}
        )
        
        return {
            "success": True,
            "message": f"Evaluation period {status} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating period status: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluation-periods/active")
async def get_active_period(db: Session = Depends(get_db)):
    """Get the currently active evaluation period"""
    try:
        period = db.query(EvaluationPeriod).filter(
            EvaluationPeriod.status == "active"
        ).first()
        
        if not period:
            return {
                "success": True,
                "data": None,
                "message": "No active evaluation period"
            }
        
        # Calculate stats
        completed = db.query(func.count(Evaluation.id)).scalar() or 0
        period.completed_evaluations = completed
        db.commit()
        
        return {
            "success": True,
            "data": {
                "id": period.id,
                "name": period.name,
                "semester": period.semester,
                "academic_year": period.academic_year,
                "start_date": period.start_date.isoformat(),
                "end_date": period.end_date.isoformat(),
                "total_students": period.total_students,
                "completed_evaluations": period.completed_evaluations,
                "participation_rate": (completed / period.total_students * 100) if period.total_students > 0 else 0,
                "days_remaining": (period.end_date - datetime.now()).days
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching active period: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# COURSE MANAGEMENT
# ===========================

@router.get("/courses")
async def get_all_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=10000),  # Increased limit to 10000 to accommodate large course lists
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    year_level: Optional[int] = None,
    status: Optional[str] = None,  # Add status filter (Active, Archived)
    db: Session = Depends(get_db)
):
    """Get paginated list of all courses"""
    try:
        # Simplified query for faster loading of large course lists
        query_str = """
            SELECT 
                c.id,
                c.subject_code,
                c.subject_name,
                c.program_id,
                c.year_level,
                c.semester,
                c.units,
                c.created_at,
                p.program_code as program_code,
                c.is_active
            FROM courses c
            LEFT JOIN programs p ON c.program_id = p.id
            WHERE 1=1
        """
        
        params = {}
        
        if search:
            query_str += " AND (c.subject_code ILIKE :search OR c.subject_name ILIKE :search)"
            params['search'] = f"%{search}%"
        
        if program_id:
            query_str += " AND c.program_id = :program_id"
            params['program_id'] = program_id
        
        if year_level:
            query_str += " AND c.year_level = :year_level"
            params['year_level'] = year_level
        
        # Add status filter
        if status:
            if status == "Archived":
                query_str += " AND c.is_active = false"
            elif status == "Active":
                query_str += " AND c.is_active = true"
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM ({query_str}) as subq"
        total = db.execute(text(count_query), params).scalar()
        
        # Add pagination
        query_str += " ORDER BY c.subject_code LIMIT :limit OFFSET :offset"
        params['limit'] = page_size
        params['offset'] = (page - 1) * page_size
        
        result = db.execute(text(query_str), params)
        courses = []
        
        for row in result:
            # Use default values for expensive calculations
            is_active = row[9]  # is_active field from query
            courses.append({
                "id": row[0],
                "course_code": row[1] or "",
                "classCode": row[1] or "",  # Alternative field name
                "course_name": row[2] or "",
                "name": row[2] or "",  # Alternative field name
                "program_id": row[3],
                "program": row[8] or "Unknown",  # program code
                "year_level": row[4],
                "yearLevel": row[4],  # Alternative field name
                "semester": row[5],
                "units": row[6],
                "created_at": row[7].isoformat() if row[7] else None,
                "instructor": "Not assigned",  # Simplified - no per-course query
                "sectionCount": 0,  # Simplified for performance
                "enrolledStudents": 0,  # Simplified for performance
                "enrolled_students": 0,  # Alternative field name
                "status": "Active" if is_active else "Archived"
            })
        
        return {
            "success": True,
            "data": courses,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class CourseCreate(BaseModel):
    name: str
    classCode: str
    instructor: Optional[str] = None
    program: str
    yearLevel: int
    semester: str
    academicYear: str
    status: str = "Active"

@router.post("/courses")
async def create_course(
    course_data: CourseCreate,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new course"""
    try:
        # Get program ID from program code
        program = db.query(Program).filter(Program.program_code == course_data.program).first()
        if not program:
            raise HTTPException(status_code=404, detail=f"Program {course_data.program} not found")
        
        # Convert semester string to integer (1 or 2)
        semester_int = None
        if course_data.semester:
            semester_lower = course_data.semester.lower()
            if 'first' in semester_lower or semester_lower == '1':
                semester_int = 1
            elif 'second' in semester_lower or semester_lower == '2':
                semester_int = 2
            else:
                raise HTTPException(status_code=400, detail="Invalid semester. Use 'First Semester', 'Second Semester', '1', or '2'")
        
        # Create course (Note: academic_year is stored in class_sections, not courses)
        new_course = Course(
            subject_code=course_data.classCode,
            subject_name=course_data.name,
            program_id=program.id,
            year_level=course_data.yearLevel,
            semester=semester_int,
            is_active=(course_data.status == "Active")
        )
        db.add(new_course)
        db.commit()
        db.refresh(new_course)
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "COURSE_CREATED", "Course Management",
            details={"course_code": course_data.classCode, "course_name": course_data.name}
        )
        
        return {
            "success": True,
            "message": "Course created successfully",
            "data": {
                "id": new_course.id,
                "classCode": new_course.subject_code,
                "name": new_course.subject_name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating course: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/courses/{course_id}")
async def update_course(
    course_id: int,
    course_data: dict = Body(...),
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update an existing course"""
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Update fields (Note: academic_year is not in Course model)
        if "name" in course_data:
            course.subject_name = course_data["name"]
        if "classCode" in course_data:
            course.subject_code = course_data["classCode"]
        if "yearLevel" in course_data:
            course.year_level = course_data["yearLevel"]
        if "semester" in course_data:
            # Convert semester string to integer (1 or 2)
            semester_value = course_data["semester"]
            if isinstance(semester_value, str):
                semester_lower = semester_value.lower()
                if 'first' in semester_lower or semester_lower == '1':
                    course.semester = 1
                elif 'second' in semester_lower or semester_lower == '2':
                    course.semester = 2
                else:
                    raise HTTPException(status_code=400, detail="Invalid semester. Use 'First Semester', 'Second Semester', '1', or '2'")
            else:
                course.semester = semester_value
        if "status" in course_data:
            course.is_active = (course_data["status"] == "Active")
        
        # Only set updated_at if column exists
        try:
            course.updated_at = datetime.utcnow()
        except:
            pass  # Column doesn't exist in database
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "COURSE_UPDATED", "Course Management",
            details={"course_id": course_id}
        )
        
        return {
            "success": True,
            "message": "Course updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating course: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Delete a course"""
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course_name = course.subject_name
        db.delete(course)
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "COURSE_DELETED", "Course Management",
            severity="Warning",
            details={"course_id": course_id, "course_name": course_name}
        )
        
        return {
            "success": True,
            "message": "Course deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting course: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/programs")
async def get_programs(db: Session = Depends(get_db)):
    """Get all programs"""
    try:
        programs = db.query(Program).all()
        
        programs_data = [{
            "id": p.id,
            "code": p.program_code,  # Map program_code to code for frontend
            "name": p.program_name,  # Map program_name to name for frontend
            "department": p.department
        } for p in programs]
        
        return {
            "success": True,
            "data": programs_data
        }
        
    except Exception as e:
        logger.error(f"Error fetching programs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# SECTION MANAGEMENT
# ===========================

@router.get("/sections")
async def get_sections(
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    year_level: Optional[int] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all class sections with enrollment counts"""
    try:
        # Query class sections with course and enrollment details
        query = text("""
            SELECT 
                cs.id,
                cs.course_id,
                c.subject_code,
                c.subject_name,
                cs.class_code,
                c.program_id,
                c.year_level,
                cs.semester,
                cs.academic_year,
                cs.max_students,
                COALESCE(i.first_name || ' ' || i.last_name, 'No instructor') as instructor_name,
                COUNT(DISTINCT e.student_id) as enrolled_count
            FROM class_sections cs
            LEFT JOIN courses c ON cs.course_id = c.id
            LEFT JOIN instructors ins ON cs.instructor_id = ins.id
            LEFT JOIN users i ON ins.user_id = i.id
            LEFT JOIN enrollments e ON cs.id = e.class_section_id
            WHERE 1=1
        """)
        
        params = {}
        
        # Add filters
        if search:
            query = text(str(query) + " AND (c.subject_code ILIKE :search OR c.subject_name ILIKE :search OR cs.class_code ILIKE :search)")
            params['search'] = f"%{search}%"
        
        if program_id:
            query = text(str(query) + " AND c.program_id = :program_id")
            params['program_id'] = program_id
        
        if year_level:
            query = text(str(query) + " AND c.year_level = :year_level")
            params['year_level'] = year_level
        
        if semester:
            query = text(str(query) + " AND cs.semester = :semester")
            params['semester'] = semester
        
        query = text(str(query) + """
            GROUP BY cs.id, cs.course_id, c.subject_code, c.subject_name, 
                     cs.class_code, c.program_id, c.year_level, cs.semester, 
                     cs.academic_year, cs.max_students, 
                     ins.id, i.first_name, i.last_name
            ORDER BY c.subject_code, cs.class_code
        """)
        
        result = db.execute(query, params)
        sections = [dict(row._mapping) for row in result]
        
        return {
            "success": True,
            "data": sections
        }
        
    except Exception as e:
        logger.error(f"Error fetching sections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class SectionCreate(BaseModel):
    course_id: int
    instructor_id: int
    class_code: str
    semester: int
    academic_year: str
    max_students: int = 40

@router.post("/sections")
async def create_section(
    section_data: SectionCreate,
    db: Session = Depends(get_db)
):
    """Create a new class section"""
    try:
        # Verify course exists
        course = db.query(Course).filter(Course.id == section_data.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Verify instructor exists
        instructor = db.query(User).filter(
            User.id == section_data.instructor_id,
            User.role == 'instructor'
        ).first()
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        # Check if class code already exists
        existing = db.query(ClassSection).filter(
            ClassSection.class_code == section_data.class_code,
            ClassSection.academic_year == section_data.academic_year
        ).first()
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Class code '{section_data.class_code}' already exists for {section_data.academic_year}"
            )
        
        # Create section
        new_section = ClassSection(
            course_id=section_data.course_id,
            instructor_id=section_data.instructor_id,
            class_code=section_data.class_code,
            semester=section_data.semester,
            academic_year=section_data.academic_year,
            max_students=section_data.max_students
        )
        db.add(new_section)
        db.commit()
        db.refresh(new_section)
        
        return {
            "success": True,
            "message": "Section created successfully",
            "data": {
                "id": new_section.id,
                "course_id": new_section.course_id,
                "instructor_id": new_section.instructor_id,
                "class_code": new_section.class_code,
                "semester": new_section.semester,
                "academic_year": new_section.academic_year,
                "max_students": new_section.max_students
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating section: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/sections/{section_id}")
async def update_section(
    section_id: int,
    section_data: dict = Body(...),
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update an existing class section"""
    try:
        section = db.query(ClassSection).filter(ClassSection.id == section_id).first()
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        # Update fields if provided
        if "course_id" in section_data:
            course = db.query(Course).filter(Course.id == section_data["course_id"]).first()
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")
            section.course_id = section_data["course_id"]
        
        if "instructor_id" in section_data:
            instructor = db.query(User).filter(
                User.id == section_data["instructor_id"],
                User.role == 'instructor'
            ).first()
            if not instructor:
                raise HTTPException(status_code=404, detail="Instructor not found")
            section.instructor_id = section_data["instructor_id"]
        
        if "class_code" in section_data:
            # Check if class code already exists (excluding current section)
            existing = db.query(ClassSection).filter(
                ClassSection.class_code == section_data["class_code"],
                ClassSection.academic_year == section_data.get("academic_year", section.academic_year),
                ClassSection.id != section_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Class code '{section_data['class_code']}' already exists"
                )
            section.class_code = section_data["class_code"]
        
        if "semester" in section_data:
            section.semester = section_data["semester"]
        
        if "academic_year" in section_data:
            section.academic_year = section_data["academic_year"]
        
        if "max_students" in section_data:
            section.max_students = section_data["max_students"]
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "SECTION_UPDATED", "Section Management",
            details={"section_id": section_id, "class_code": section.class_code}
        )
        
        return {
            "success": True,
            "message": "Section updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating section: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sections/{section_id}")
async def delete_section(
    section_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Delete a class section and all its enrollments"""
    try:
        section = db.query(ClassSection).filter(ClassSection.id == section_id).first()
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        # Delete all enrollments first
        db.query(Enrollment).filter(Enrollment.class_section_id == section_id).delete()
        
        # Delete the section
        db.delete(section)
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "SECTION_DELETED", "Section Management",
            details={"section_id": section_id, "class_code": section.class_code}
        )
        
        return {
            "success": True,
            "message": "Section deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting section: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sections/{section_id}/students")
async def get_section_students(section_id: int, db: Session = Depends(get_db)):
    """Get all enrolled students for a specific section"""
    try:
        # Query enrolled students with their details
        query = text("""
            SELECT 
                s.id,
                s.student_number,
                u.first_name,
                u.last_name,
                u.email,
                p.program_code as program_code,
                s.year_level,
                e.enrollment_date
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE e.class_section_id = :section_id
            ORDER BY u.last_name, u.first_name
        """)
        
        result = db.execute(query, {"section_id": section_id})
        students = [dict(row._mapping) for row in result]
        
        return {
            "success": True,
            "data": students
        }
        
    except Exception as e:
        logger.error(f"Error fetching section students: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sections/{section_id}/available-students")
async def get_available_students(
    section_id: int,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get students with accounts who are NOT enrolled in this section"""
    try:
        # First get the section's program and year level
        section_query = text("""
            SELECT c.program_id, c.year_level
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            WHERE cs.id = :section_id
        """)
        
        section_result = db.execute(section_query, {"section_id": section_id}).fetchone()
        
        if not section_result:
            raise HTTPException(status_code=404, detail="Section not found")
        
        program_id = section_result[0]
        year_level = section_result[1]
        
        # Query students with accounts who are not enrolled in this section
        query_str = """
            SELECT 
                s.id,
                s.student_number,
                u.first_name,
                u.last_name,
                u.email,
                p.program_code as program_code,
                s.year_level
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE s.program_id = :program_id 
            AND s.year_level = :year_level
            AND u.is_active = true
            AND s.id NOT IN (
                SELECT student_id 
                FROM enrollments 
                WHERE class_section_id = :section_id
            )
        """
        
        params = {
            "section_id": section_id,
            "program_id": program_id,
            "year_level": year_level
        }
        
        if search:
            query_str += " AND (u.first_name ILIKE :search OR u.last_name ILIKE :search OR s.student_number ILIKE :search)"
            params['search'] = f"%{search}%"
        
        query_str += " ORDER BY u.last_name, u.first_name"
        
        result = db.execute(text(query_str), params)
        students = [dict(row._mapping) for row in result]
        
        return {
            "success": True,
            "data": students
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching available students: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sections/{section_id}/enroll")
async def enroll_students(
    section_id: int,
    student_ids: List[int] = Body(..., embed=True),
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Enroll multiple students in a section"""
    try:
        # Verify section exists
        section = db.query(ClassSection).filter(ClassSection.id == section_id).first()
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        enrolled_count = 0
        skipped_count = 0
        
        for student_id in student_ids:
            # Check if already enrolled
            existing = db.query(Enrollment).filter(
                Enrollment.class_section_id == section_id,
                Enrollment.student_id == student_id
            ).first()
            
            if existing:
                skipped_count += 1
                continue
            
            # Create enrollment
            enrollment = Enrollment(
                student_id=student_id,
                class_section_id=section_id,
                enrollment_date=datetime.utcnow(),
                status='enrolled'
            )
            db.add(enrollment)
            enrolled_count += 1
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "ENROLL_STUDENTS", "Section Management",
            details={"section_id": section_id, "enrolled_count": enrolled_count, "skipped_count": skipped_count}
        )
        
        return {
            "success": True,
            "message": f"Enrolled {enrolled_count} students successfully",
            "enrolled_count": enrolled_count,
            "skipped_count": skipped_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enrolling students: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sections/{section_id}/students/{student_id}")
async def remove_student_from_section(
    section_id: int,
    student_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Remove a student from a section"""
    try:
        # Find enrollment
        enrollment = db.query(Enrollment).filter(
            Enrollment.class_section_id == section_id,
            Enrollment.student_id == student_id
        ).first()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Get student info for audit log
        student = db.query(Student).join(User).filter(Student.id == student_id).first()
        student_name = f"{student.user.first_name} {student.user.last_name}" if student else "Unknown"
        
        db.delete(enrollment)
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "REMOVE_STUDENT_FROM_SECTION", "Section Management",
            details={"section_id": section_id, "student_id": student_id, "student_name": student_name}
        )
        
        return {
            "success": True,
            "message": f"Student {student_name} removed from section successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing student: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# SYSTEM SETTINGS
# ===========================

@router.get("/settings/{category}")
async def get_system_settings(category: str, db: Session = Depends(get_db)):
    """Get system settings for a specific category"""
    try:
        # Query all settings for this category from the new structure
        settings_query = text("""
            SELECT key, value, data_type, description
            FROM system_settings
            WHERE category = :category
            ORDER BY key
        """)
        
        result = db.execute(settings_query, {"category": category})
        settings_dict = {}
        
        for row in result:
            key = row[0]
            value = row[1]
            data_type = row[2]
            
            # Convert value based on data_type
            if data_type == 'boolean':
                settings_dict[key] = value.lower() == 'true'
            elif data_type == 'number':
                try:
                    settings_dict[key] = int(value) if '.' not in value else float(value)
                except:
                    settings_dict[key] = value
            elif data_type == 'json':
                try:
                    settings_dict[key] = json.loads(value) if value else {}
                except:
                    settings_dict[key] = value
            else:
                settings_dict[key] = value
        
        # If no settings found, return defaults
        if not settings_dict:
            default_settings = {
                "general": {
                    "institution_name": "Lyceum of the Philippines University - Batangas",
                    "institution_short_name": "LPU Batangas",
                    "academic_year": "2024-2025",
                    "current_semester": "First Semester",
                    "rating_scale": 4,
                    "timezone": "Asia/Manila",
                    "date_format": "MM/DD/YYYY",
                    "language": "English"
                },
                "email": {
                    "smtp_host": "smtp.gmail.com",
                    "smtp_port": 587,
                    "smtp_username": "noreply@lpubatangas.edu.ph",
                    "smtp_password": "",
                    "from_email": "noreply@lpubatangas.edu.ph",
                    "from_name": "LPU Evaluation System",
                    "enable_notifications": True,
                    "reminder_frequency": 3
                },
                "security": {
                    "password_min_length": 8,
                    "password_require_uppercase": True,
                    "password_require_lowercase": True,
                    "password_require_numbers": True,
                    "password_require_special_chars": True,
                    "session_timeout": 60,
                    "max_login_attempts": 5,
                    "lockout_duration": 30,
                    "two_factor_auth": False,
                    "allowed_domains": "@lpubatangas.edu.ph"
                },
                "backup": {
                    "auto_backup": True,
                    "backup_frequency": "daily",
                    "backup_time": "02:00",
                    "retention_days": 30,
                    "include_evaluations": True,
                    "include_users": True,
                    "include_courses": True,
                    "backup_location": "cloud"
                }
            }
            settings_dict = default_settings.get(category, {})
        
        return {
            "success": True,
            "data": {
                "category": category,
                "settings": settings_dict
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching system settings: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/settings")
async def update_system_settings(
    settings_data: SystemSettingsUpdate,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update system settings"""
    try:
        category = settings_data.category
        settings = settings_data.settings
        
        # Update each setting individually
        for key, value in settings.items():
            # Determine data type
            if isinstance(value, bool):
                data_type = 'boolean'
                str_value = 'true' if value else 'false'
            elif isinstance(value, (int, float)):
                data_type = 'number'
                str_value = str(value)
            elif isinstance(value, dict) or isinstance(value, list):
                data_type = 'json'
                str_value = json.dumps(value)
            else:
                data_type = 'string'
                str_value = str(value)
            
            # Upsert setting
            upsert_query = text("""
                INSERT INTO system_settings (category, key, value, data_type, updated_by, updated_at)
                VALUES (:category, :key, :value, :data_type, :user_id, CURRENT_TIMESTAMP)
                ON CONFLICT (category, key) 
                DO UPDATE SET 
                    value = :value,
                    data_type = :data_type,
                    updated_by = :user_id,
                    updated_at = CURRENT_TIMESTAMP
            """)
            
            db.execute(upsert_query, {
                "category": category,
                "key": key,
                "value": str_value,
                "data_type": data_type,
                "user_id": current_user_id
            })
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "SETTINGS_UPDATED", "System Settings",
            severity="Warning",
            details={"category": category, "keys_updated": list(settings.keys())}
        )
        
        return {
            "success": True,
            "message": f"{category.title()} settings updated successfully"
        }
        
        
    except Exception as e:
        logger.error(f"Error updating system settings: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# AUDIT LOGS
# ===========================

@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    action: Optional[str] = None,
    severity: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Get paginated audit logs with filters"""
    try:
        # Build query using raw SQL for flexibility
        conditions = ["1=1"]
        params = {}
        
        if action:
            conditions.append("action = :action")
            params["action"] = action
        
        if severity:
            conditions.append("severity = :severity")
            params["severity"] = severity
        
        if user_id:
            conditions.append("user_id = :user_id")
            params["user_id"] = user_id
        
        if start_date:
            conditions.append("created_at >= :start_date")
            params["start_date"] = start_date
        
        if end_date:
            conditions.append("created_at <= :end_date")
            params["end_date"] = end_date
        
        where_clause = " AND ".join(conditions)
        
        # Get total count
        count_query = text(f"""
            SELECT COUNT(*) FROM audit_logs
            WHERE {where_clause}
        """)
        total = db.execute(count_query, params).scalar()
        
        # Get paginated logs with user info
        offset = (page - 1) * page_size
        params["offset"] = offset
        params["limit"] = page_size
        
        logs_query = text(f"""
            SELECT 
                al.id,
                al.user_id,
                COALESCE(u.email, 'System') as user_email,
                COALESCE(u.first_name || ' ' || u.last_name, 'System') as user_name,
                al.action,
                al.category,
                al.severity,
                al.status,
                al.ip_address,
                al.details,
                al.created_at
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE {where_clause}
            ORDER BY al.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        result = db.execute(logs_query, params)
        logs_data = []
        
        for row in result:
            logs_data.append({
                "id": row[0],
                "user_id": row[1],
                "user": row[3] if row[1] else "System",
                "action": row[4],
                "category": row[5],
                "severity": row[6],
                "status": row[7],
                "ipAddress": row[8],
                "details": row[9] if isinstance(row[9], dict) else {},
                "timestamp": row[10].isoformat() if row[10] else None
            })
        
        return {
            "success": True,
            "data": logs_data,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching audit logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit-logs/stats")
async def get_audit_log_stats(db: Session = Depends(get_db)):
    """Get audit log statistics"""
    try:
        # Use raw SQL for better performance
        stats_query = text("""
            SELECT 
                COUNT(*) as total_logs,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as last_24h,
                COUNT(*) FILTER (WHERE severity = 'Critical') as critical_events,
                COUNT(*) FILTER (WHERE status IN ('Failed', 'Blocked')) as failed_blocked
            FROM audit_logs
        """)
        
        result = db.execute(stats_query).fetchone()
        
        return {
            "success": True,
            "data": {
                "total_logs": result[0] or 0,
                "last_24h": result[1] or 0,
                "critical_events": result[2] or 0,
                "failed_blocked": result[3] or 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching audit log stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# DATA EXPORT
# ===========================

def log_export(db: Session, user_id: int, export_type: str, format: str, record_count: int):
    """Helper function to log export actions to audit log"""
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            action=f"EXPORT_{export_type.upper()}",
            category="Data Export",
            severity="Info",
            status="Success",
            details={
                "export_type": export_type,
                "format": format,
                "record_count": record_count,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log export: {e}")
        # Don't fail the export if logging fails
        db.rollback()

@router.get("/export/history")
async def get_export_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get export history"""
    try:
        offset = (page - 1) * page_size
        
        history_query = text("""
            SELECT 
                eh.id,
                eh.user_id,
                COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as user_name,
                eh.export_type,
                eh.format,
                eh.filters,
                eh.file_size,
                eh.record_count,
                eh.status,
                eh.created_at
            FROM export_history eh
            LEFT JOIN users u ON eh.user_id = u.id
            ORDER BY eh.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        result = db.execute(history_query, {"limit": page_size, "offset": offset})
        
        exports = []
        for row in result:
            exports.append({
                "id": row[0],
                "user": row[2],
                "type": row[3],
                "format": row[4],
                "filters": row[5] if isinstance(row[5], dict) else {},
                "fileSize": row[6],
                "records": row[7],
                "status": row[8],
                "date": row[9].isoformat() if row[9] else None
            })
        
        # Get total count
        count_query = text("SELECT COUNT(*) FROM export_history")
        total = db.execute(count_query).scalar()
        
        return {
            "success": True,
            "data": {
                "exports": exports,
                "total": total,
                "page": page,
                "page_size": page_size
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching export history: {e}")
        # Return empty list instead of error for backwards compatibility
        return {
            "success": True,
            "data": {
                "exports": [],
                "total": 0,
                "message": "Export history tracking is being set up"
            }
        }

@router.get("/export/users")
async def export_users(
    format: str = Query("csv", regex="^(csv|json)$"),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Export all users data"""
    try:
        users = db.query(User).all()
        
        if format == "json":
            users_data = [{
                "id": u.id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "role": u.role,
                "department": u.department,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None
            } for u in users]
            
            # Log export
            log_export(db, user_id, 'users', format, len(users_data))
            
            return {"success": True, "data": users_data}
        
        # CSV format would be handled by frontend
        # Log export
        log_export(db, user_id, 'users', format, len(users))
        
        return {"success": True, "data": users}
        
    except Exception as e:
        logger.error(f"Error exporting users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/evaluations")
async def export_evaluations(
    format: str = Query("csv", regex="^(csv|json)$"),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Export all evaluations data"""
    try:
        evaluations = db.query(Evaluation).all()
        
        eval_data = [{
            "id": e.id,
            "student_id": e.student_id,
            "class_section_id": e.class_section_id,
            "rating_teaching": e.rating_teaching,
            "rating_content": e.rating_content,
            "rating_engagement": e.rating_engagement,
            "rating_overall": e.rating_overall,
            "comments": e.comments,
            "sentiment": e.sentiment,
            "sentiment_score": e.sentiment_score,
            "submission_date": e.submission_date.isoformat() if e.submission_date else None
        } for e in evaluations]
        
        # Log export
        log_export(db, user_id, 'evaluations', format, len(eval_data))
        
        return {"success": True, "data": eval_data}
        
    except Exception as e:
        logger.error(f"Error exporting evaluations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/courses")
async def export_courses(
    format: str = Query("json", regex="^(csv|json)$"),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Export all courses data"""
    try:
        courses = db.query(Course).all()
        
        courses_data = [{
            "id": c.id,
            "subject_code": c.subject_code,
            "subject_name": c.subject_name,
            "program_id": c.program_id,
            "year_level": c.year_level,
            "semester": c.semester,
            "is_active": c.is_active,
            "created_at": c.created_at.isoformat() if c.created_at else None
            # Note: updated_at not included as it may not exist in database
        } for c in courses]
        
        # Log export
        log_export(db, user_id, 'courses', format, len(courses_data))
        
        return {"success": True, "data": courses_data}
        
    except Exception as e:
        logger.error(f"Error exporting courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/analytics")
async def export_analytics(
    format: str = Query("json", regex="^(csv|json)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Export analytics data"""
    try:
        # Get evaluation statistics
        query = db.query(Evaluation)
        
        if start_date:
            query = query.filter(Evaluation.submission_date >= start_date)
        if end_date:
            query = query.filter(Evaluation.submission_date <= end_date)
        
        evaluations = query.all()
        
        # Calculate analytics
        total_evaluations = len(evaluations)
        avg_teaching = sum([e.rating_teaching for e in evaluations if e.rating_teaching]) / total_evaluations if total_evaluations > 0 else 0
        avg_content = sum([e.rating_content for e in evaluations if e.rating_content]) / total_evaluations if total_evaluations > 0 else 0
        avg_engagement = sum([e.rating_engagement for e in evaluations if e.rating_engagement]) / total_evaluations if total_evaluations > 0 else 0
        avg_overall = sum([e.rating_overall for e in evaluations if e.rating_overall]) / total_evaluations if total_evaluations > 0 else 0
        
        # Sentiment breakdown
        positive = sum([1 for e in evaluations if e.sentiment and e.sentiment.lower() == 'positive'])
        neutral = sum([1 for e in evaluations if e.sentiment and e.sentiment.lower() == 'neutral'])
        negative = sum([1 for e in evaluations if e.sentiment and e.sentiment.lower() == 'negative'])
        
        analytics_data = {
            "total_evaluations": total_evaluations,
            "average_ratings": {
                "teaching": round(avg_teaching, 2),
                "content": round(avg_content, 2),
                "engagement": round(avg_engagement, 2),
                "overall": round(avg_overall, 2)
            },
            "sentiment_breakdown": {
                "positive": positive,
                "neutral": neutral,
                "negative": negative
            },
            "date_range": {
                "start": start_date,
                "end": end_date
            }
        }
        
        # Log export
        log_export(db, user_id, 'analytics', format, total_evaluations)
        
        return {"success": True, "data": analytics_data}
        
    except Exception as e:
        logger.error(f"Error exporting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export/custom")
async def export_custom(
    export_params: dict = Body(...),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Export custom query data"""
    try:
        format_type = export_params.get('format', 'json')
        tables = export_params.get('tables', [])
        
        result = {}
        total_records = 0
        
        # Export based on selected tables
        if 'users' in tables:
            users = db.query(User).all()
            result['users'] = [{
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active
            } for u in users]
            total_records += len(users)
        
        if 'courses' in tables:
            courses = db.query(Course).all()
            result['courses'] = [{
                "id": c.id,
                "subject_code": c.subject_code,
                "subject_name": c.subject_name
            } for c in courses]
            total_records += len(courses)
        
        if 'evaluations' in tables:
            evaluations = db.query(Evaluation).all()
            result['evaluations'] = [{
                "id": e.id,
                "rating_overall": e.rating_overall,
                "sentiment": e.sentiment
            } for e in evaluations]
            total_records += len(evaluations)
        
        # Log export
        export_type = f"custom_{'_'.join(tables)}" if tables else "custom"
        log_export(db, user_id, export_type, format_type, total_records)
        
        return {"success": True, "data": result}
        
    except Exception as e:
        logger.error(f"Error exporting custom data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard-stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get overall dashboard statistics for system admin"""
    try:
        # User stats
        total_users = db.query(func.count(User.id)).scalar() or 0
        active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
        
        # User roles breakdown
        students_count = db.query(func.count(User.id)).filter(User.role == 'student').scalar() or 0
        dept_heads_count = db.query(func.count(User.id)).filter(User.role == 'department_head').scalar() or 0
        secretaries_count = db.query(func.count(User.id)).filter(User.role == 'secretary').scalar() or 0
        admins_count = db.query(func.count(User.id)).filter(User.role == 'admin').scalar() or 0
        instructors_count = db.query(func.count(User.id)).filter(User.role == 'instructor').scalar() or 0
        
        # Course stats
        total_courses = db.query(func.count(Course.id)).scalar() or 0
        total_programs = db.query(func.count(func.distinct(Program.id))).scalar() or 0
        
        # Evaluation stats
        total_evaluations = db.query(func.count(Evaluation.id)).scalar() or 0
        
        # Calculate participation rate
        total_possible_evaluations = db.query(func.count(Enrollment.id)).scalar() or 0
        participation_rate = round((total_evaluations / total_possible_evaluations * 100), 1) if total_possible_evaluations > 0 else 0
        
        # Program stats
        program_stats_query = text("""
            SELECT 
                p.program_code as program,
                COUNT(DISTINCT c.id) as courses,
                COUNT(DISTINCT s.id) as students,
                COUNT(DISTINCT e.id) as evaluations
            FROM programs p
            LEFT JOIN courses c ON p.id = c.program_id
            LEFT JOIN students s ON p.id = s.program_id
            LEFT JOIN enrollments enr ON s.id = enr.student_id
            LEFT JOIN evaluations e ON enr.class_section_id = e.class_section_id AND s.id = e.student_id
            GROUP BY p.program_code, p.id
            ORDER BY p.program_code
        """)
        
        program_stats_result = db.execute(program_stats_query)
        program_stats = {}
        for row in program_stats_result:
            program_stats[row[0]] = {
                "courses": row[1] or 0,
                "students": row[2] or 0,
                "evaluations": row[3] or 0
            }
        
        # Sentiment stats (if sentiment analysis is available)
        sentiment_stats = {
            "positive": db.query(func.count(Evaluation.id)).filter(Evaluation.sentiment_score > 0.3).scalar() or 0,
            "neutral": db.query(func.count(Evaluation.id)).filter(
                and_(Evaluation.sentiment_score >= -0.3, Evaluation.sentiment_score <= 0.3)
            ).scalar() or 0,
            "negative": db.query(func.count(Evaluation.id)).filter(Evaluation.sentiment_score < -0.3).scalar() or 0
        }
        
        return {
            "success": True,
            "data": {
                "totalUsers": total_users,
                "activeUsers": active_users,
                "totalCourses": total_courses,
                "totalPrograms": total_programs,
                "totalEvaluations": total_evaluations,
                "participationRate": participation_rate,
                "userRoles": {
                    "students": students_count,
                    "departmentHeads": dept_heads_count,
                    "secretaries": secretaries_count,
                    "admins": admins_count,
                    "instructors": instructors_count
                },
                "programStats": program_stats,
                "sentimentStats": sentiment_stats
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# Email Notification Endpoints
# ===========================

class EmailNotificationRequest(BaseModel):
    notification_type: str  # period_start, reminder, period_ending, test
    period_id: Optional[int] = None
    recipient_emails: Optional[List[str]] = None
    test_email: Optional[str] = None

@router.post("/send-notification")
async def send_email_notification(
    request: EmailNotificationRequest,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Send email notifications to students"""
    try:
        from services.email_service import email_service
        
        # Log action
        log_audit(
            db=db,
            user_id=current_user_id,
            action=f"send_email_notification_{request.notification_type}",
            details={"notification_type": request.notification_type, "period_id": request.period_id}
        )
        
        # Test email
        if request.notification_type == "test":
            if not request.test_email:
                raise HTTPException(status_code=400, detail="Test email address required")
            
            success = email_service.send_email(
                to_emails=[request.test_email],
                subject="🧪 Test Email from LPU Course Feedback System",
                html_body="""
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #667eea;">✅ Email Configuration Test</h2>
                    <p>Congratulations! Your email service is configured correctly.</p>
                    <p>This is a test email from the LPU Course Feedback System.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        Sent at: {}<br>
                        System: LPU Batangas Course Feedback
                    </p>
                </body>
                </html>
                """.format(datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                text_body=f"Test email sent successfully at {datetime.now()}"
            )
            
            return {
                "success": success,
                "message": "Test email sent" if success else "Failed to send test email"
            }
        
        # Get evaluation period
        if not request.period_id:
            raise HTTPException(status_code=400, detail="Period ID required")
        
        period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == request.period_id).first()
        if not period:
            raise HTTPException(status_code=404, detail="Evaluation period not found")
        
        # Get recipient emails
        recipient_emails = request.recipient_emails
        if not recipient_emails:
            # Get all active students
            students = db.query(User).join(Student).filter(
                User.role == "student",
                User.is_active == True
            ).all()
            recipient_emails = [user.email for user in students if user.email]
        
        if not recipient_emails:
            return {
                "success": False,
                "message": "No recipient emails found",
                "sent_count": 0
            }
        
        # Send notifications based on type
        sent_count = 0
        failed_count = 0
        
        if request.notification_type == "period_start":
            # Get course count for this period
            courses_count = db.query(func.count(ClassSection.id)).filter(
                ClassSection.semester == period.semester,
                ClassSection.academic_year == period.academic_year
            ).scalar() or 0
            
            for email in recipient_emails:
                success = email_service.send_evaluation_period_start(
                    to_emails=[email],
                    period_name=period.name,
                    start_date=period.start_date.strftime("%B %d, %Y"),
                    end_date=period.end_date.strftime("%B %d, %Y"),
                    courses_count=courses_count
                )
                if success:
                    sent_count += 1
                else:
                    failed_count += 1
        
        elif request.notification_type == "reminder":
            # Send reminder to students with pending evaluations
            for email in recipient_emails:
                # Get student
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    continue
                
                student = db.query(Student).filter(Student.user_id == user.id).first()
                if not student:
                    continue
                
                # Get pending courses (enrolled but not evaluated)
                enrolled_sections = db.query(ClassSection).filter(
                    ClassSection.semester == period.semester,
                    ClassSection.academic_year == period.academic_year
                ).all()
                
                evaluated_courses = db.query(Evaluation.class_section_id).filter(
                    Evaluation.student_id == student.id,
                    Evaluation.evaluation_period_id == period.id
                ).all()
                evaluated_ids = [e[0] for e in evaluated_courses]
                
                pending_courses = [
                    section.course.name for section in enrolled_sections 
                    if section.id not in evaluated_ids
                ]
                
                if pending_courses:
                    days_remaining = (period.end_date - datetime.now()).days
                    success = email_service.send_evaluation_reminder(
                        to_emails=[email],
                        period_name=period.name,
                        end_date=period.end_date.strftime("%B %d, %Y"),
                        pending_courses=pending_courses,
                        days_remaining=max(0, days_remaining)
                    )
                    if success:
                        sent_count += 1
                    else:
                        failed_count += 1
        
        elif request.notification_type == "period_ending":
            hours_remaining = int((period.end_date - datetime.now()).total_seconds() / 3600)
            hours_remaining = max(0, hours_remaining)
            
            for email in recipient_emails:
                success = email_service.send_evaluation_period_ending(
                    to_emails=[email],
                    period_name=period.name,
                    end_date=period.end_date.strftime("%B %d, %Y %I:%M %p"),
                    hours_remaining=hours_remaining
                )
                if success:
                    sent_count += 1
                else:
                    failed_count += 1
        
        else:
            raise HTTPException(status_code=400, detail="Invalid notification type")
        
        return {
            "success": True,
            "message": f"Notifications sent successfully",
            "sent_count": sent_count,
            "failed_count": failed_count,
            "total_recipients": len(recipient_emails)
        }
        
    except Exception as e:
        logger.error(f"Error sending email notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/email-config-status")
async def get_email_config_status(current_user_id: int = Query(...)):
    """Check if email service is configured"""
    try:
        from services.email_service import email_service
        
        return {
            "success": True,
            "data": {
                "enabled": email_service.enabled,
                "smtp_server": email_service.smtp_server if email_service.enabled else None,
                "smtp_port": email_service.smtp_port if email_service.enabled else None,
                "from_email": email_service.smtp_from_email if email_service.enabled else None,
                "from_name": email_service.smtp_from_name if email_service.enabled else None
            }
        }
    except Exception as e:
        logger.error(f"Error checking email config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

