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
    Evaluation, EvaluationPeriod, AuditLog, ExportHistory, SystemSettings, Program,
    Enrollment
)
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, date, timezone
import logging
import bcrypt
import json
from config import now_local
from services.welcome_email_service import send_welcome_email, send_bulk_welcome_emails

logger = logging.getLogger(__name__)
router = APIRouter()

# ===========================
# Pydantic Models for Requests
# ===========================

class UserCreate(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from frontend
    
    email: EmailStr
    first_name: str
    last_name: str
    role: str  # student, department_head, secretary, admin
    department: Optional[str] = None
    school_id: Optional[str] = None  # School ID number (required for students)
    program_id: Optional[int] = None
    year_level: Optional[int] = None
    password: str

class UserUpdate(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from frontend
    
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class EvaluationPeriodCreate(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from frontend
    
    name: str
    semester: str
    academic_year: str
    start_date: date  # Accept date format
    end_date: date    # Accept date format

class SystemSettingsUpdate(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from frontend
    
    category: str
    settings: dict

class AuditLogCreate(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from frontend
    
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
    program: Optional[str] = None,
    year_level: Optional[int] = None,
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
        
        # Filter by program and/or year level (for students)
        # Build single subquery with both conditions to avoid conflicts
        if program or year_level:
            student_subquery = db.query(Student.user_id)
            
            if program:
                student_subquery = student_subquery.join(Program).filter(
                    Program.program_code == program
                )
                logger.info(f"Filtering by program: {program}")
            
            if year_level:
                student_subquery = student_subquery.filter(
                    Student.year_level == year_level
                )
                logger.info(f"Filtering by year_level: {year_level}")
            
            student_ids_result = student_subquery.all()
            logger.info(f"Found {len(student_ids_result)} students matching filter. User IDs: {[sid[0] for sid in student_ids_result[:5]]}")
            
            student_ids = [sid[0] for sid in student_ids_result]
            if student_ids:
                query = query.filter(User.id.in_(student_ids))
            else:
                # No students match - return empty result
                logger.warning(f"No students found matching program={program}, year_level={year_level}")
                query = query.filter(User.id == -1)  # Force empty result
        
        # Get total count
        total = query.count()
        logger.info(f"Total users after filters: {total}")
        
        # Apply pagination
        offset = (page - 1) * page_size
        users = query.offset(offset).limit(page_size).all()
        
        # Format response with program information
        users_data = []
        for user in users:
            user_dict = {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "department": user.department,
                "school_id": user.school_id,
                "is_active": user.is_active,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            
            # Add program information for students
            if user.role == "student":
                student = db.query(Student).filter(Student.user_id == user.id).first()
                if student and student.program_id:
                    program = db.query(Program).filter(Program.id == student.program_id).first()
                    if program:
                        user_dict["program"] = program.program_code
                        user_dict["program_name"] = program.program_name
                        user_dict["year_level"] = student.year_level
                        user_dict["student_number"] = student.student_number
            
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
        
        # Determine school_id and auto-generate password for students
        must_change_password = False
        first_login = False
        actual_password = user_data.password
        generated_password_info = None
        school_id = user_data.school_id
        
        # Auto-generate password using pattern: lpub@{school_id}
        if user_data.role == "student":
            # If school_id not provided, extract from email
            if not school_id:
                email_parts = user_data.email.split('@')
                if len(email_parts) > 0:
                    school_id = email_parts[0]  # Get the part before @
            
            # Generate temporary password: lpub@{school_id}
            if school_id:
                actual_password = f"lpub@{school_id}"
                must_change_password = True
                first_login = True
                generated_password_info = actual_password
                logger.info(f"Auto-generated password for student {user_data.email}: {actual_password}")
        
        # For secretary and department_head, also set first_login
        elif user_data.role in ["secretary", "department_head"]:
            first_login = True
            must_change_password = True
            # If school_id provided, use it for password generation
            if school_id:
                actual_password = f"lpub@{school_id}"
                generated_password_info = actual_password
        
        # Hash password
        password_hash = bcrypt.hashpw(actual_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user
        new_user = User(
            email=user_data.email,
            password_hash=password_hash,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role,
            department=user_data.department,
            school_id=school_id,
            is_active=True,
            must_change_password=must_change_password,
            first_login=first_login
        )
        db.add(new_user)
        db.flush()  # Get the user ID
        
        # Create role-specific record
        if user_data.role == "student" and user_data.program_id:
            # Use school_id as student_number
            student_number = school_id or f"STU{new_user.id:05d}"
            
            student = Student(
                user_id=new_user.id,
                student_number=student_number,
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
        
        # Send welcome email with credentials
        email_result = None
        if generated_password_info and school_id:
            email_result = await send_welcome_email(
                email=user_data.email,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                school_id=school_id,
                role=user_data.role,
                temp_password=generated_password_info,
                login_url="http://localhost:5173/login"  # Update with production URL
            )
            logger.info(f"Welcome email sent to {user_data.email}: {email_result['message']}")
        
        # Build response with generated password info if applicable
        response = {
            "success": True,
            "message": "User created successfully",
            "user_id": new_user.id
        }
        
        # Include generated password and email status
        if generated_password_info:
            response["generated_password"] = generated_password_info
            response["message"] = f"User created successfully. Temporary password: {generated_password_info} (student must change on first login)"
            
            if email_result:
                response["email_sent"] = email_result.get("email_sent", False)
                response["email_status"] = "prepared" if not email_result.get("email_sent") else "sent"
        
        return response
        
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
        
        user.updated_at = now_local()
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
        user.updated_at = now_local()
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
        user.updated_at = now_local()
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
        
        periods_data = []
        for p in periods:
            # Calculate total evaluations needed (students × enrolled sections)
            total_evaluations = db.execute(text("""
                SELECT COUNT(DISTINCT e.id)
                FROM enrollments e
                WHERE e.evaluation_period_id = :period_id
            """), {"period_id": p.id}).scalar() or 0
            
            # Calculate completed evaluations
            completed_evaluations = db.execute(text("""
                SELECT COUNT(DISTINCT ev.id)
                FROM evaluations ev
                JOIN enrollments e ON ev.student_id = e.student_id 
                    AND ev.class_section_id = e.class_section_id
                WHERE e.evaluation_period_id = :period_id
                AND ev.submission_date IS NOT NULL
            """), {"period_id": p.id}).scalar() or 0
            
            # Calculate participation rate
            participation_rate = round((completed_evaluations / total_evaluations * 100), 1) if total_evaluations > 0 else 0
            
            # Calculate days remaining
            today = date.today()
            # Convert end_date to date object if it's datetime
            if isinstance(p.end_date, datetime):
                end_date = p.end_date.date()
            else:
                end_date = p.end_date
            days_remaining = max(0, (end_date - today).days)
            
            periods_data.append({
                "id": p.id,
                "name": p.name,
                "semester": p.semester,
                "academicYear": p.academic_year,  # camelCase for frontend
                "startDate": p.start_date.isoformat(),
                "endDate": p.end_date.isoformat(),
                "status": p.status,
                "totalEvaluations": total_evaluations,
                "completedEvaluations": completed_evaluations,
                "participationRate": participation_rate,
                "daysRemaining": days_remaining,
                "createdAt": p.created_at.isoformat()
            })
        
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
        
        # Close any currently open periods
        db.query(EvaluationPeriod).filter(
            EvaluationPeriod.status == "Open"
        ).update({"status": "Closed"})
        
        new_period = EvaluationPeriod(
            name=period_data.name,
            semester=period_data.semester,
            academic_year=period_data.academic_year,
            start_date=period_data.start_date,
            end_date=period_data.end_date,
            status="Open",
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
        
        # Validate status values
        valid_statuses = ["Open", "Closed"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        # Close any other open periods if opening this one
        if status == "Open":
            db.query(EvaluationPeriod).filter(
                EvaluationPeriod.status == "Open",
                EvaluationPeriod.id != period_id
            ).update({"status": "Closed"})
        
        period.status = status
        period.updated_at = now_local()
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
# PERIOD ENROLLMENT MANAGEMENT
# ===========================

@router.post("/evaluation-periods/{period_id}/enroll-section")
async def enroll_section_in_period(
    period_id: int,
    section_id: int = Body(..., embed=True),
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Enable a class section (block section) for evaluation in a specific period
    All students enrolled in this section will be able to evaluate during this period
    """
    try:
        # Verify period exists
        period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == period_id).first()
        if not period:
            raise HTTPException(status_code=404, detail="Evaluation period not found")
        
        # Verify section exists and get details
        section_info = db.execute(text("""
            SELECT 
                cs.id, cs.class_code, cs.course_id,
                c.subject_code, c.subject_name, c.program_id,
                p.program_name, p.program_code
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            JOIN programs p ON c.program_id = p.id
            WHERE cs.id = :section_id
        """), {"section_id": section_id}).fetchone()
        
        if not section_info:
            raise HTTPException(status_code=404, detail="Class section not found")
        
        # Check if already enrolled
        existing = db.execute(text("""
            SELECT id FROM period_enrollments 
            WHERE evaluation_period_id = :period_id 
            AND class_section_id = :section_id
        """), {
            "period_id": period_id,
            "section_id": section_id
        }).fetchone()
        
        if existing:
            return {
                "success": False,
                "message": f"Section {section_info.class_code} is already enrolled in this period"
            }
        
        # Get count of students in this section
        student_count = db.execute(text("""
            SELECT COUNT(DISTINCT e.student_id)
            FROM enrollments e
            WHERE e.class_section_id = :section_id
            AND e.status = 'active'
        """), {"section_id": section_id}).scalar() or 0
        
        # Update all enrollments for this section to link to the evaluation period
        db.execute(text("""
            UPDATE enrollments
            SET evaluation_period_id = :period_id
            WHERE class_section_id = :section_id
            AND status = 'active'
        """), {
            "period_id": period_id,
            "section_id": section_id
        })
        
        # Create evaluation records for all enrolled students
        # This allows students to see pending evaluations when the period becomes active
        db.execute(text("""
            INSERT INTO evaluations (
                student_id, class_section_id, evaluation_period_id, status, created_at
            )
            SELECT 
                e.student_id, 
                e.class_section_id, 
                :period_id,
                'pending',
                NOW()
            FROM enrollments e
            WHERE e.class_section_id = :section_id
            AND e.status = 'active'
            AND NOT EXISTS (
                SELECT 1 FROM evaluations ev
                WHERE ev.student_id = e.student_id
                AND ev.class_section_id = e.class_section_id
                AND ev.evaluation_period_id = :period_id
            )
        """), {
            "period_id": period_id,
            "section_id": section_id
        })
        
        # Record this section enrollment for tracking
        db.execute(text("""
            INSERT INTO period_enrollments (
                evaluation_period_id, class_section_id, enrolled_count, created_by
            ) VALUES (:period_id, :section_id, :student_count, :created_by)
        """), {
            "period_id": period_id,
            "section_id": section_id,
            "student_count": student_count,
            "created_by": current_user_id
        })
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "SECTION_ENROLLED_IN_PERIOD", "Evaluation Management",
            details={
                "period_id": period_id,
                "section_id": section_id,
                "class_code": section_info.class_code,
                "subject": f"{section_info.subject_code} - {section_info.subject_name}",
                "student_count": student_count
            }
        )
        
        return {
            "success": True,
            "message": f"Section {section_info.class_code} enrolled successfully",
            "data": {
                "students_enrolled": student_count,
                "class_code": section_info.class_code,
                "subject": f"{section_info.subject_code} - {section_info.subject_name}"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enrolling program section: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluation-periods/{period_id}/enrolled-sections")
async def get_period_enrolled_sections(
    period_id: int,
    db: Session = Depends(get_db)
):
    """Get all class sections enrolled in an evaluation period"""
    try:
        query = text("""
            SELECT 
                pe.id,
                pe.class_section_id,
                cs.class_code,
                c.subject_code,
                c.subject_name,
                p.program_code,
                p.program_name,
                pe.enrolled_count,
                pe.created_at,
                u.first_name || ' ' || u.last_name as created_by_name
            FROM period_enrollments pe
            JOIN class_sections cs ON pe.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            JOIN programs p ON c.program_id = p.id
            LEFT JOIN users u ON pe.created_by = u.id
            WHERE pe.evaluation_period_id = :period_id
            ORDER BY p.program_code, c.subject_code, cs.class_code
        """)
        
        result = db.execute(query, {"period_id": period_id})
        enrolled_sections = []
        
        for row in result:
            enrolled_sections.append({
                "id": row.id,
                "class_section_id": row.class_section_id,
                "class_code": row.class_code,
                "subject_code": row.subject_code,
                "subject_name": row.subject_name,
                "program_code": row.program_code,
                "program_name": row.program_name,
                "enrolled_count": row.enrolled_count,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "created_by_name": row.created_by_name
            })
        
        return {
            "success": True,
            "data": enrolled_sections
        }
        
    except Exception as e:
        logger.error(f"Error fetching enrolled sections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/evaluation-periods/{period_id}/enrolled-sections/{enrollment_id}")
async def remove_period_enrollment(
    period_id: int,
    enrollment_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Remove a class section enrollment from an evaluation period"""
    try:
        # Get enrollment details before deletion
        enrollment = db.execute(text("""
            SELECT class_section_id
            FROM period_enrollments 
            WHERE id = :enrollment_id AND evaluation_period_id = :period_id
        """), {"enrollment_id": enrollment_id, "period_id": period_id}).fetchone()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment record not found")
        
        # Unlink enrollments from this period (set evaluation_period_id to NULL)
        db.execute(text("""
            UPDATE enrollments
            SET evaluation_period_id = NULL
            WHERE class_section_id = :section_id
            AND evaluation_period_id = :period_id
        """), {
            "section_id": enrollment.class_section_id,
            "period_id": period_id
        })
        
        # Delete the period enrollment record
        db.execute(text("""
            DELETE FROM period_enrollments 
            WHERE id = :enrollment_id AND evaluation_period_id = :period_id
        """), {"enrollment_id": enrollment_id, "period_id": period_id})
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "SECTION_REMOVED_FROM_PERIOD", "Evaluation Management",
            details={
                "period_id": period_id,
                "enrollment_id": enrollment_id,
                "section_id": enrollment.class_section_id
            }
        )
        
        return {
            "success": True,
            "message": "Section removed from evaluation period successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing period enrollment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/evaluation-periods/{period_id}/enrolled-program-sections")
async def get_period_enrolled_program_sections(
    period_id: int,
    db: Session = Depends(get_db)
):
    """Get all program sections enrolled in an evaluation period"""
    try:
        query = text("""
            SELECT 
                pps.id,
                pps.program_section_id,
                ps.section_name,
                ps.year_level,
                ps.semester,
                ps.school_year,
                p.program_code,
                p.program_name,
                pps.enrolled_count,
                pps.created_at,
                u.first_name || ' ' || u.last_name as created_by_name
            FROM period_program_sections pps
            JOIN program_sections ps ON pps.program_section_id = ps.id
            JOIN programs p ON ps.program_id = p.id
            LEFT JOIN users u ON pps.created_by = u.id
            WHERE pps.evaluation_period_id = :period_id
            ORDER BY p.program_code, ps.section_name
        """)
        
        result = db.execute(query, {"period_id": period_id})
        enrolled_sections = []
        
        for row in result:
            enrolled_sections.append({
                "id": row[0],
                "program_section_id": row[1],
                "section_name": row[2],
                "year_level": row[3],
                "semester": row[4],
                "school_year": row[5],
                "program_code": row[6],
                "program_name": row[7],
                "enrolled_count": row[8],
                "created_at": row[9].isoformat() if row[9] else None,
                "created_by_name": row[10]
            })
        
        return {
            "success": True,
            "data": enrolled_sections
        }
        
    except Exception as e:
        logger.error(f"Error fetching enrolled program sections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluation-periods/{period_id}/enroll-program-section")
async def enroll_program_section_in_period(
    period_id: int,
    program_section_id: int = Body(..., embed=True),
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Enroll a program section (student group) into an evaluation period.
    This will create evaluation records for all students in the program section
    for ALL courses they are enrolled in.
    """
    try:
        # Verify period exists
        period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == period_id).first()
        if not period:
            raise HTTPException(status_code=404, detail="Evaluation period not found")
        
        # Verify program section exists and get details
        section_info = db.execute(text("""
            SELECT 
                ps.id, ps.section_name, ps.program_id, ps.year_level, ps.semester, ps.school_year,
                p.program_name, p.program_code
            FROM program_sections ps
            JOIN programs p ON ps.program_id = p.id
            WHERE ps.id = :program_section_id
        """), {"program_section_id": program_section_id}).fetchone()
        
        if not section_info:
            raise HTTPException(status_code=404, detail="Program section not found")
        
        # Check if already enrolled
        existing = db.execute(text("""
            SELECT id FROM period_program_sections 
            WHERE evaluation_period_id = :period_id 
            AND program_section_id = :program_section_id
        """), {
            "period_id": period_id,
            "program_section_id": program_section_id
        }).fetchone()
        
        if existing:
            return {
                "success": False,
                "message": f"Program section {section_info[1]} is already enrolled in this period"
            }
        
        # Get all students in this program section
        students = db.execute(text("""
            SELECT DISTINCT ss.student_id
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            WHERE ss.section_id = :program_section_id
            AND u.is_active = true
            AND u.role = 'student'
        """), {"program_section_id": program_section_id}).fetchall()
        
        student_ids = [row[0] for row in students]
        
        if not student_ids:
            return {
                "success": False,
                "message": "No active students found in this program section"
            }
        
        # Get all class sections these students are enrolled in
        class_sections = db.execute(text("""
            SELECT DISTINCT e.class_section_id
            FROM enrollments e
            WHERE e.student_id = ANY(:student_ids)
            AND e.status = 'active'
        """), {"student_ids": student_ids}).fetchall()
        
        class_section_ids = [row[0] for row in class_sections]
        
        if not class_section_ids:
            return {
                "success": False,
                "message": "No course enrollments found for students in this program section"
            }
        
        # Update enrollments to link to this period
        db.execute(text("""
            UPDATE enrollments
            SET evaluation_period_id = :period_id
            WHERE student_id = ANY(:student_ids)
            AND class_section_id = ANY(:class_section_ids)
            AND status = 'active'
        """), {
            "period_id": period_id,
            "student_ids": student_ids,
            "class_section_ids": class_section_ids
        })
        
        # Create evaluation records for all student-course combinations
        result = db.execute(text("""
            INSERT INTO evaluations (
                student_id, class_section_id, evaluation_period_id, status, created_at
            )
            SELECT 
                e.student_id, 
                e.class_section_id, 
                :period_id,
                'pending',
                NOW()
            FROM enrollments e
            WHERE e.student_id = ANY(:student_ids)
            AND e.class_section_id = ANY(:class_section_ids)
            AND e.status = 'active'
            AND e.evaluation_period_id = :period_id
            AND NOT EXISTS (
                SELECT 1 FROM evaluations ev
                WHERE ev.student_id = e.student_id
                AND ev.class_section_id = e.class_section_id
                AND ev.evaluation_period_id = :period_id
            )
            RETURNING id
        """), {
            "period_id": period_id,
            "student_ids": student_ids,
            "class_section_ids": class_section_ids
        })
        
        evaluations_created = len(result.fetchall())
        
        # Record this program section enrollment for tracking
        db.execute(text("""
            INSERT INTO period_program_sections (
                evaluation_period_id, program_section_id, enrolled_count, created_by
            ) VALUES (:period_id, :program_section_id, :student_count, :created_by)
        """), {
            "period_id": period_id,
            "program_section_id": program_section_id,
            "student_count": len(student_ids),
            "created_by": current_user_id
        })
        
        # Also update period_enrollments for each class section
        for class_section_id in class_section_ids:
            # Check if this class section is already in period_enrollments
            existing_period_enroll = db.execute(text("""
                SELECT id FROM period_enrollments
                WHERE evaluation_period_id = :period_id
                AND class_section_id = :class_section_id
            """), {
                "period_id": period_id,
                "class_section_id": class_section_id
            }).fetchone()
            
            if not existing_period_enroll:
                # Count students from THIS program section in this class
                count = db.execute(text("""
                    SELECT COUNT(DISTINCT e.student_id)
                    FROM enrollments e
                    WHERE e.class_section_id = :class_section_id
                    AND e.student_id = ANY(:student_ids)
                    AND e.status = 'active'
                """), {
                    "class_section_id": class_section_id,
                    "student_ids": student_ids
                }).scalar() or 0
                
                db.execute(text("""
                    INSERT INTO period_enrollments (
                        evaluation_period_id, class_section_id, enrolled_count, created_by
                    ) VALUES (:period_id, :class_section_id, :count, :created_by)
                """), {
                    "period_id": period_id,
                    "class_section_id": class_section_id,
                    "count": count,
                    "created_by": current_user_id
                })
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "PROGRAM_SECTION_ENROLLED_IN_PERIOD", "Evaluation Management",
            details={
                "period_id": period_id,
                "program_section_id": program_section_id,
                "section_name": section_info[1],
                "program_name": f"{section_info[7]} - {section_info[6]}",
                "student_count": len(student_ids),
                "class_sections_count": len(class_section_ids),
                "evaluations_created": evaluations_created
            }
        )
        
        return {
            "success": True,
            "message": f"Program section {section_info[1]} enrolled successfully",
            "data": {
                "students_enrolled": len(student_ids),
                "class_sections_affected": len(class_section_ids),
                "evaluations_created": evaluations_created,
                "section_name": section_info[1],
                "program_name": f"{section_info[7]} - {section_info[6]}"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enrolling program section in period: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to enroll program section: {str(e)}")

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
    semester: Optional[int] = None,
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
        
        if semester:
            query_str += " AND c.semester = :semester"
            params['semester'] = semester
        
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
                "subject_code": row[1] or "",  # Subject code
                "course_name": row[2] or "",
                "name": row[2] or "",  # Alternative field name
                "subject_name": row[2] or "",  # Subject name
                "program_id": row[3],
                "program": row[8] or "Unknown",  # program code
                "year_level": row[4],
                "yearLevel": row[4],  # Alternative field name
                "semester": row[5],
                "units": row[6],
                "created_at": row[7].isoformat() if row[7] else None,
                # Instructor removed - course evaluation only
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
    # instructor removed - evaluating courses not instructors
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
            course.updated_at = now_local()
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
    program_code: Optional[str] = None,
    year_level: Optional[int] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all class sections with enrollment counts"""
    try:
        # Query class sections with course and enrollment details (instructor removed)
        query = text("""
            SELECT 
                cs.id,
                cs.course_id,
                c.subject_code,
                c.subject_name,
                cs.class_code,
                c.program_id,
                p.program_code,
                c.year_level,
                cs.semester,
                cs.academic_year,
                cs.max_students,
                COUNT(DISTINCT e.student_id) as enrolled_count
            FROM class_sections cs
            LEFT JOIN courses c ON cs.course_id = c.id
            LEFT JOIN programs p ON c.program_id = p.id
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
        
        if program_code:
            query = text(str(query) + " AND p.program_code = :program_code")
            params['program_code'] = program_code
        
        if year_level:
            query = text(str(query) + " AND c.year_level = :year_level")
            params['year_level'] = year_level
        
        if semester:
            query = text(str(query) + " AND cs.semester = :semester")
            params['semester'] = semester
        
        query = text(str(query) + """
            GROUP BY cs.id, cs.course_id, c.subject_code, c.subject_name, 
                     cs.class_code, c.program_id, p.program_code, c.year_level, cs.semester, 
                     cs.academic_year, cs.max_students
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
    # instructor_id removed - course evaluation only
    class_code: str
    semester: int
    academic_year: str
    max_students: int = 40

@router.post("/sections")
async def create_section(
    section_data: SectionCreate,
    auto_enroll: bool = Query(False, description="Auto-enroll students from matching program/year"),
    db: Session = Depends(get_db)
):
    """Create a new class section with optional auto-enrollment"""
    try:
        # Verify course exists
        course = db.query(Course).filter(Course.id == section_data.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Instructor validation removed - course evaluation only
        
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
            instructor_id=None,  # No instructor assignment needed
            class_code=section_data.class_code,
            semester=section_data.semester,
            academic_year=section_data.academic_year,
            max_students=section_data.max_students
        )
        db.add(new_section)
        db.commit()
        db.refresh(new_section)
        
        enrolled_count = 0
        
        # Auto-enroll students if requested
        if auto_enroll:
            try:
                # Find all students matching the course's program and year level
                matching_students = db.query(Student).filter(
                    Student.program_id == course.program_id,
                    Student.year_level == course.year_level
                ).all()
                
                for student in matching_students:
                    # Check if not already enrolled
                    existing_enrollment = db.query(Enrollment).filter(
                        Enrollment.class_section_id == new_section.id,
                        Enrollment.student_id == student.id
                    ).first()
                    
                    if not existing_enrollment:
                        new_enrollment = Enrollment(
                            student_id=student.id,
                            class_section_id=new_section.id,
                            enrolled_at=now_local(),
                            status='active'
                        )
                        db.add(new_enrollment)
                        enrolled_count += 1
                
                db.commit()
                logger.info(f"Auto-enrolled {enrolled_count} students into section {new_section.id}")
            except Exception as enroll_error:
                logger.error(f"Error during auto-enrollment: {enroll_error}")
                # Don't fail the section creation if auto-enrollment fails
        
        return {
            "success": True,
            "message": "Section created successfully",
            "data": {
                "id": new_section.id,
                "course_id": new_section.course_id,
                # instructor_id removed
                "class_code": new_section.class_code,
                "semester": new_section.semester,
                "academic_year": new_section.academic_year,
                "max_students": new_section.max_students,
                "enrolled_count": enrolled_count
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
        
        # instructor_id update removed - course evaluation only
        
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
        
        # Delete related records in order (to avoid foreign key constraint errors)
        # 1. Delete evaluations for this section
        db.execute(text("DELETE FROM evaluations WHERE class_section_id = :section_id"), {"section_id": section_id})
        
        # 2. Delete analysis results
        db.execute(text("DELETE FROM analysis_results WHERE class_section_id = :section_id"), {"section_id": section_id})
        
        # 3. Delete period section enrollments if they exist
        db.execute(text("DELETE FROM period_section_enrollments WHERE class_section_id = :section_id"), {"section_id": section_id})
        
        # 4. Delete all enrollments
        db.query(Enrollment).filter(Enrollment.class_section_id == section_id).delete()
        
        # 5. Finally delete the section
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
                e.enrolled_at as enrollment_date
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
                enrolled_at=now_local(),
                status='active'
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

class BulkEnrollmentRequest(BaseModel):
    student_identifier: str
    section_identifier: str
    identifier_type: Optional[str] = "auto"  # 'email', 'student_number', or 'auto'
    notes: Optional[str] = ""

@router.post("/sections/bulk-enroll")
async def bulk_enroll_student(
    enrollment: BulkEnrollmentRequest,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Bulk enroll a single student to a section (designed for CSV batch processing)
    Supports flexible identifiers for both students and sections
    """
    try:
        # Find student by identifier
        student = None
        identifier_type = enrollment.identifier_type.lower()
        
        if identifier_type == "auto":
            # Auto-detect: email has @, student number has hyphen pattern
            if "@" in enrollment.student_identifier:
                identifier_type = "email"
            elif enrollment.student_identifier.replace("-", "").isdigit():
                identifier_type = "student_number"
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot auto-detect identifier type for: {enrollment.student_identifier}"
                )
        
        if identifier_type == "email":
            user = db.query(User).filter(User.email == enrollment.student_identifier).first()
            if user and user.role == "student":
                student = db.query(Student).filter(Student.user_id == user.id).first()
        elif identifier_type == "student_number":
            student = db.query(Student).filter(Student.student_number == enrollment.student_identifier).first()
        else:
            raise HTTPException(status_code=400, detail=f"Invalid identifier_type: {identifier_type}")
        
        if not student:
            raise HTTPException(
                status_code=404, 
                detail=f"Student not found with {identifier_type}: {enrollment.student_identifier}"
            )
        
        # Find section by identifier (can be class_code or section ID)
        section = None
        
        # Try as class_code first (most common in CSV)
        section = db.query(ClassSection).filter(ClassSection.class_code == enrollment.section_identifier).first()
        
        # If not found, try as numeric ID
        if not section and enrollment.section_identifier.isdigit():
            section = db.query(ClassSection).filter(ClassSection.id == int(enrollment.section_identifier)).first()
        
        if not section:
            raise HTTPException(
                status_code=404, 
                detail=f"Section not found: {enrollment.section_identifier}"
            )
        
        # Check if already enrolled
        existing = db.query(Enrollment).filter(
            Enrollment.class_section_id == section.id,
            Enrollment.student_id == student.id
        ).first()
        
        if existing:
            return {
                "success": True,
                "message": "Student already enrolled in section",
                "already_enrolled": True
            }
        
        # Verify student program matches section (optional validation)
        if student.program_id != section.program_id:
            logger.warning(
                f"Program mismatch: Student {student.id} (program {student.program_id}) "
                f"enrolling in section {section.id} (program {section.program_id})"
            )
        
        # Create enrollment
        new_enrollment = Enrollment(
            student_id=student.id,
            class_section_id=section.id,
            enrollment_date=now_local(),
            status='enrolled'
        )
        db.add(new_enrollment)
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "BULK_ENROLL_STUDENT", "Section Management",
            details={
                "student_id": student.id,
                "student_identifier": enrollment.student_identifier,
                "section_id": section.id,
                "section_identifier": enrollment.section_identifier,
                "notes": enrollment.notes
            }
        )
        
        return {
            "success": True,
            "message": f"Student enrolled successfully",
            "student_id": student.id,
            "section_id": section.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk enrollment: {e}")
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

def log_export(db: Session, user_id: int, export_type: str, format: str, record_count: int, filters: dict = None):
    """Helper function to log export actions to both audit log and export history"""
    try:
        # Log to audit log
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
                "timestamp": now_local().isoformat()
            }
        )
        db.add(audit_entry)
        
        # Log to export history
        export_entry = ExportHistory(
            user_id=user_id,
            export_type=export_type,
            format=format,
            filters=filters or {},
            record_count=record_count,
            status="completed"
        )
        db.add(export_entry)
        
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


class ScheduleExportRequest(BaseModel):
    frequency: str  # daily, weekly, monthly
    time: str  # HH:MM format
    format: str  # csv, json, excel
    recipients: str  # comma-separated emails
    day_of_week: Optional[str] = None  # For weekly schedules
    day_of_month: Optional[int] = None  # For monthly schedules
    is_active: bool = True


@router.post("/export/schedule")
async def schedule_export(
    schedule: ScheduleExportRequest,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Schedule automatic exports"""
    try:
        # Create scheduled export entry
        insert_query = text("""
            INSERT INTO scheduled_exports 
            (user_id, frequency, time, format, recipients, day_of_week, day_of_month, is_active, created_at, updated_at)
            VALUES (:user_id, :frequency, :time, :format, :recipients, :day_of_week, :day_of_month, :is_active, :created_at, :updated_at)
            RETURNING id
        """)
        
        result = db.execute(insert_query, {
            "user_id": user_id,
            "frequency": schedule.frequency,
            "time": schedule.time,
            "format": schedule.format,
            "recipients": schedule.recipients,
            "day_of_week": schedule.day_of_week,
            "day_of_month": schedule.day_of_month,
            "is_active": schedule.is_active,
            "created_at": now_local(),
            "updated_at": now_local()
        })
        
        schedule_id = result.fetchone()[0]
        db.commit()
        
        # Log audit
        await create_audit_log(
            db, user_id, "SCHEDULE_EXPORT", "Data Export", severity="Info",
            details={
                "schedule_id": schedule_id,
                "frequency": schedule.frequency,
                "format": schedule.format,
                "recipients": schedule.recipients
            }
        )
        
        logger.info(f"✅ Export scheduled: {schedule.frequency} at {schedule.time} to {schedule.recipients}")
        
        return {
            "success": True,
            "message": f"Export scheduled successfully: {schedule.frequency} at {schedule.time}",
            "data": {
                "schedule_id": schedule_id,
                "frequency": schedule.frequency,
                "time": schedule.time,
                "format": schedule.format,
                "recipients": schedule.recipients
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error scheduling export: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to schedule export: {str(e)}")


@router.get("/export/schedules")
async def get_scheduled_exports(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all scheduled exports"""
    try:
        query = text("""
            SELECT 
                se.id,
                se.user_id,
                COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as user_name,
                se.frequency,
                se.time,
                se.format,
                se.recipients,
                se.day_of_week,
                se.day_of_month,
                se.is_active,
                se.last_run,
                se.next_run,
                se.created_at
            FROM scheduled_exports se
            LEFT JOIN users u ON se.user_id = u.id
            ORDER BY se.created_at DESC
        """)
        
        result = db.execute(query)
        
        schedules = []
        for row in result:
            schedules.append({
                "id": row[0],
                "userId": row[1],
                "userName": row[2],
                "frequency": row[3],
                "time": row[4],
                "format": row[5],
                "recipients": row[6],
                "dayOfWeek": row[7],
                "dayOfMonth": row[8],
                "isActive": row[9],
                "lastRun": row[10].isoformat() if row[10] else None,
                "nextRun": row[11].isoformat() if row[11] else None,
                "createdAt": row[12].isoformat() if row[12] else None
            })
        
        return {
            "success": True,
            "data": schedules
        }
        
    except Exception as e:
        logger.error(f"Error fetching scheduled exports: {e}")
        # Return empty list if table doesn't exist yet
        return {
            "success": True,
            "data": []
        }


@router.delete("/export/schedule/{schedule_id}")
async def delete_scheduled_export(
    schedule_id: int,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Delete a scheduled export"""
    try:
        delete_query = text("""
            DELETE FROM scheduled_exports
            WHERE id = :schedule_id
        """)
        
        db.execute(delete_query, {"schedule_id": schedule_id})
        db.commit()
        
        # Log audit
        await create_audit_log(
            db, user_id, "DELETE_SCHEDULE_EXPORT", "Data Export", severity="Warning",
            details={"schedule_id": schedule_id}
        )
        
        logger.info(f"✅ Scheduled export {schedule_id} deleted")
        
        return {
            "success": True,
            "message": "Scheduled export deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Error deleting scheduled export: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete schedule: {str(e)}")

@router.get("/export/users")
async def export_users(
    format: str = Query("csv", regex="^(csv|json)$"),
    role: Optional[str] = Query(None),
    program: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Export users data with filters"""
    try:
        query = db.query(User)
        
        # Apply filters
        if role and role != 'all':
            query = query.filter(User.role == role)
        
        if status and status != 'all':
            is_active = status.lower() == 'active'
            query = query.filter(User.is_active == is_active)
        
        # Filter by program for students
        if program and program != 'all':
            student_ids = db.query(Student.user_id).join(Program).filter(
                Program.program_code == program
            ).subquery()
            query = query.filter(User.id.in_(student_ids))
        
        users = query.all()
        
        users_data = []
        for u in users:
            user_dict = {
                "id": u.id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "school_id": u.school_id,
                "role": u.role,
                "department": u.department,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            
            # Add student-specific data
            if u.role == "student":
                student = db.query(Student).filter(Student.user_id == u.id).first()
                if student and student.program_id:
                    program_obj = db.query(Program).filter(Program.id == student.program_id).first()
                    if program_obj:
                        user_dict["program"] = program_obj.program_code
                        user_dict["program_name"] = program_obj.program_name
                        user_dict["year_level"] = student.year_level
                        user_dict["student_number"] = student.student_number
            
            users_data.append(user_dict)
        
        # Log export
        filters = {}
        if role: filters['role'] = role
        if program: filters['program'] = program
        if status: filters['status'] = status
        log_export(db, user_id, 'users', format, len(users_data), filters)
        
        return {"success": True, "data": users_data}
        
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
            "text_feedback": e.text_feedback,
            "suggestions": e.suggestions,
            "sentiment": e.sentiment,
            "sentiment_score": e.sentiment_score,
            "is_anomaly": e.is_anomaly,
            "anomaly_score": e.anomaly_score,
            "submission_date": e.submission_date.isoformat() if e.submission_date else None
        } for e in evaluations]
        
        # Log export
        log_export(db, user_id, 'evaluations', format, len(eval_data), {})
        
        return {"success": True, "data": eval_data}
        
    except Exception as e:
        logger.error(f"Error exporting evaluations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/courses")
async def export_courses(
    format: str = Query("json", regex="^(csv|json)$"),
    program: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    year_level: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Export courses data with filters"""
    try:
        query = db.query(Course)
        
        # Apply filters
        if program and program != 'all':
            program_obj = db.query(Program).filter(Program.program_code == program).first()
            if program_obj:
                query = query.filter(Course.program_id == program_obj.id)
        
        if status and status != 'all':
            is_active = status.lower() == 'active'
            query = query.filter(Course.is_active == is_active)
        
        if year_level and year_level != 0:
            query = query.filter(Course.year_level == year_level)
        
        courses = query.all()
        
        courses_data = []
        for c in courses:
            program_obj = db.query(Program).filter(Program.id == c.program_id).first() if c.program_id else None
            courses_data.append({
                "id": c.id,
                "subject_code": c.subject_code,
                "subject_name": c.subject_name,
                "program_code": program_obj.program_code if program_obj else None,
                "program_name": program_obj.program_name if program_obj else None,
                "year_level": c.year_level,
                "semester": c.semester,
                "units": c.units,
                "is_active": c.is_active,
                "created_at": c.created_at.isoformat() if c.created_at else None
            })
        
        # Log export
        filters = {}
        if program: filters['program'] = program
        if status: filters['status'] = status
        if year_level: filters['year_level'] = year_level
        log_export(db, user_id, 'courses', format, len(courses_data), filters)
        
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
        filters = {}
        if start_date:
            filters['start_date'] = start_date
        if end_date:
            filters['end_date'] = end_date
        log_export(db, user_id, 'analytics', format, total_evaluations, filters)
        
        return {"success": True, "data": analytics_data}
        
    except Exception as e:
        logger.error(f"Error exporting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/audit-logs")
async def export_audit_logs(
    format: str = Query("csv", regex="^(csv|json)$"),
    action: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    user: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Export audit logs with filters"""
    try:
        query = db.query(AuditLog)
        
        # Apply filters
        if action and action != 'all':
            query = query.filter(AuditLog.action == action)
        
        if category and category != 'all':
            query = query.filter(AuditLog.category == category)
        
        if severity and severity != 'all':
            query = query.filter(AuditLog.severity == severity)
        
        if user and user != 'all':
            query = query.filter(AuditLog.user_id == int(user))
        
        # Date range filtering
        if start_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(AuditLog.timestamp >= start)
            except:
                pass
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(AuditLog.timestamp <= end)
            except:
                pass
        
        # Order by most recent first
        query = query.order_by(AuditLog.timestamp.desc())
        
        audit_logs = query.all()
        
        logs_data = []
        for log in audit_logs:
            # Get user info
            log_user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
            
            logs_data.append({
                "id": log.id,
                "user_id": log.user_id,
                "user_email": log_user.email if log_user else None,
                "user_name": f"{log_user.first_name} {log_user.last_name}" if log_user else "System",
                "action": log.action,
                "category": log.category,
                "details": log.details,
                "severity": log.severity,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None
            })
        
        # Log this export
        filters = {}
        if action: filters['action'] = action
        if category: filters['category'] = category
        if user: filters['user'] = user
        if start_date: filters['start_date'] = start_date
        if end_date: filters['end_date'] = end_date
        if severity: filters['severity'] = severity
        log_export(db, user_id, 'audit_logs', format, len(logs_data), filters)
        
        return {"success": True, "data": logs_data}
        
    except Exception as e:
        logger.error(f"Error exporting audit logs: {e}")
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
        filters = {"tables": tables} if tables else {}
        log_export(db, user_id, export_type, format_type, total_records, filters)
        
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
        # instructors_count removed - not needed for course evaluation
        
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
                    # instructors removed from stats
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


# ===========================
# Backup & Restore Endpoints
# ===========================

@router.post("/backup/create")
async def create_backup(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Create a database backup"""
    try:
        import subprocess
        import os
        from pathlib import Path
        
        # Create backups directory if it doesn't exist
        backup_dir = Path("backups")
        backup_dir.mkdir(exist_ok=True)
        
        # Generate backup filename with timestamp
        backup_filename = f"backup_{now_local().strftime('%Y%m%d_%H%M%S')}.sql"
        backup_path = backup_dir / backup_filename
        
        # Get database connection details from environment or config
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "course_feedback")
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "")
        
        # Set password environment variable for pg_dump
        env = os.environ.copy()
        if db_password:
            env["PGPASSWORD"] = db_password
        
        # Run pg_dump to create backup
        pg_dump_cmd = [
            "pg_dump",
            "-h", db_host,
            "-p", db_port,
            "-U", db_user,
            "-d", db_name,
            "-F", "p",  # Plain text format
            "-f", str(backup_path)
        ]
        
        result = subprocess.run(
            pg_dump_cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode != 0:
            logger.error(f"pg_dump failed: {result.stderr}")
            raise Exception(f"Backup failed: {result.stderr}")
        
        # Get file size
        file_size = backup_path.stat().st_size
        
        # Store backup metadata in database
        insert_query = text("""
            INSERT INTO backup_history 
            (user_id, filename, file_path, file_size, status, created_at)
            VALUES (:user_id, :filename, :file_path, :file_size, :status, :created_at)
            RETURNING id
        """)
        
        result = db.execute(insert_query, {
            "user_id": user_id,
            "filename": backup_filename,
            "file_path": str(backup_path),
            "file_size": file_size,
            "status": "success",
            "created_at": now_local()
        })
        
        backup_id = result.fetchone()[0]
        db.commit()
        
        # Log audit
        await create_audit_log(
            db, user_id, "CREATE_BACKUP", "System Maintenance", severity="Info",
            details={
                "backup_id": backup_id,
                "filename": backup_filename,
                "file_size": file_size
            }
        )
        
        logger.info(f"✅ Database backup created: {backup_filename} ({file_size} bytes)")
        
        return {
            "success": True,
            "message": "Backup created successfully",
            "data": {
                "backup_id": backup_id,
                "filename": backup_filename,
                "file_size": file_size,
                "created_at": now_local().isoformat()
            }
        }
        
    except subprocess.TimeoutExpired:
        logger.error("Backup timeout - operation took too long")
        raise HTTPException(status_code=500, detail="Backup operation timed out")
    except FileNotFoundError:
        logger.error("pg_dump not found - PostgreSQL client tools not installed")
        raise HTTPException(
            status_code=500, 
            detail="Database backup tools not available. Please install PostgreSQL client tools."
        )
    except Exception as e:
        logger.error(f"❌ Backup creation error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")


@router.post("/backup/restore")
async def restore_backup(
    backup_file: str = Body(..., embed=True),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Restore database from backup file"""
    try:
        import subprocess
        import os
        from pathlib import Path
        
        # Validate backup file exists
        backup_path = Path(backup_file)
        if not backup_path.exists():
            raise HTTPException(status_code=404, detail="Backup file not found")
        
        # Get database connection details
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "course_feedback")
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "")
        
        # Set password environment variable
        env = os.environ.copy()
        if db_password:
            env["PGPASSWORD"] = db_password
        
        # Run psql to restore backup
        psql_cmd = [
            "psql",
            "-h", db_host,
            "-p", db_port,
            "-U", db_user,
            "-d", db_name,
            "-f", str(backup_path)
        ]
        
        result = subprocess.run(
            psql_cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout for restore
        )
        
        if result.returncode != 0:
            logger.error(f"psql restore failed: {result.stderr}")
            raise Exception(f"Restore failed: {result.stderr}")
        
        # Log audit
        await create_audit_log(
            db, user_id, "RESTORE_BACKUP", "System Maintenance", severity="Critical",
            details={
                "backup_file": backup_file,
                "restored_at": now_local().isoformat()
            }
        )
        
        logger.info(f"✅ Database restored from: {backup_file}")
        
        return {
            "success": True,
            "message": "Database restored successfully",
            "data": {
                "backup_file": backup_file,
                "restored_at": now_local().isoformat()
            }
        }
        
    except subprocess.TimeoutExpired:
        logger.error("Restore timeout - operation took too long")
        raise HTTPException(status_code=500, detail="Restore operation timed out")
    except FileNotFoundError:
        logger.error("psql not found - PostgreSQL client tools not installed")
        raise HTTPException(
            status_code=500, 
            detail="Database restore tools not available. Please install PostgreSQL client tools."
        )
    except Exception as e:
        logger.error(f"❌ Restore error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to restore backup: {str(e)}")


@router.get("/backup/history")
async def get_backup_history(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get list of available backups"""
    try:
        query = text("""
            SELECT 
                bh.id,
                bh.filename,
                bh.file_path,
                bh.file_size,
                bh.status,
                bh.created_at,
                COALESCE(u.first_name || ' ' || u.last_name, 'System') as created_by
            FROM backup_history bh
            LEFT JOIN users u ON bh.user_id = u.id
            ORDER BY bh.created_at DESC
            LIMIT 50
        """)
        
        result = db.execute(query)
        
        backups = []
        for row in result:
            backups.append({
                "id": row[0],
                "filename": row[1],
                "filePath": row[2],
                "fileSize": row[3],
                "status": row[4],
                "createdAt": row[5].isoformat() if row[5] else None,
                "createdBy": row[6]
            })
        
        return {
            "success": True,
            "data": backups
        }
        
    except Exception as e:
        logger.error(f"Error fetching backup history: {e}")
        # Return empty list if table doesn't exist yet
        return {
            "success": True,
            "data": []
        }


# ===========================
# Program Sections Management
# ===========================

class ProgramSectionCreate(BaseModel):
    section_name: str
    program_id: int
    year_level: int
    semester: int
    school_year: str

class ProgramSectionUpdate(BaseModel):
    section_name: Optional[str] = None
    program_id: Optional[int] = None
    year_level: Optional[int] = None
    semester: Optional[int] = None
    school_year: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("/program-sections")
async def get_program_sections(
    program_id: Optional[int] = Query(None),
    year_level: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    school_year: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all program sections with optional filters"""
    try:
        query = """
            SELECT 
                ps.id,
                ps.section_name,
                ps.program_id,
                p.program_code,
                p.program_name,
                ps.year_level,
                ps.semester,
                ps.school_year,
                ps.is_active,
                ps.created_at,
                ps.updated_at,
                COUNT(DISTINCT ss.student_id) as student_count
            FROM program_sections ps
            LEFT JOIN programs p ON ps.program_id = p.id
            LEFT JOIN section_students ss ON ps.id = ss.section_id
            WHERE 1=1
        """
        
        params = {}
        
        if program_id is not None:
            query += " AND ps.program_id = :program_id"
            params["program_id"] = program_id
        
        if year_level is not None:
            query += " AND ps.year_level = :year_level"
            params["year_level"] = year_level
        
        if semester is not None:
            query += " AND ps.semester = :semester"
            params["semester"] = semester
        
        if school_year is not None:
            query += " AND ps.school_year = :school_year"
            params["school_year"] = school_year
        
        if is_active is not None:
            query += " AND ps.is_active = :is_active"
            params["is_active"] = is_active
        
        query += """
            GROUP BY ps.id, ps.section_name, ps.program_id, p.program_code, 
                     p.program_name, ps.year_level, ps.semester, ps.school_year,
                     ps.is_active, ps.created_at, ps.updated_at
            ORDER BY ps.school_year DESC, ps.year_level, ps.semester, ps.section_name
        """
        
        result = db.execute(text(query), params)
        
        sections = []
        for row in result:
            sections.append({
                "id": row[0],
                "sectionName": row[1],
                "programId": row[2],
                "programCode": row[3],
                "programName": row[4],
                "yearLevel": row[5],
                "semester": row[6],
                "schoolYear": row[7],
                "isActive": row[8],
                "createdAt": row[9].isoformat() if row[9] else None,
                "updatedAt": row[10].isoformat() if row[10] else None,
                "studentCount": row[11]
            })
        
        return {
            "success": True,
            "data": sections
        }
        
    except Exception as e:
        logger.error(f"Error fetching program sections: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch program sections: {str(e)}")


@router.post("/program-sections")
async def create_program_section(
    section_data: ProgramSectionCreate,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new program section"""
    try:
        # Check if section already exists
        check_query = text("""
            SELECT id FROM program_sections
            WHERE section_name = :section_name
            AND program_id = :program_id
            AND year_level = :year_level
            AND semester = :semester
            AND school_year = :school_year
        """)
        
        existing = db.execute(check_query, {
            "section_name": section_data.section_name,
            "program_id": section_data.program_id,
            "year_level": section_data.year_level,
            "semester": section_data.semester,
            "school_year": section_data.school_year
        }).fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail="Program section already exists")
        
        # Create section
        insert_query = text("""
            INSERT INTO program_sections 
            (section_name, program_id, year_level, semester, school_year, is_active, created_at, updated_at)
            VALUES (:section_name, :program_id, :year_level, :semester, :school_year, true, NOW(), NOW())
            RETURNING id
        """)
        
        result = db.execute(insert_query, {
            "section_name": section_data.section_name,
            "program_id": section_data.program_id,
            "year_level": section_data.year_level,
            "semester": section_data.semester,
            "school_year": section_data.school_year
        })
        
        section_id = result.fetchone()[0]
        db.commit()
        
        # Log the action
        audit_query = text("""
            INSERT INTO audit_logs (user_id, action, category, entity_type, entity_id, details, timestamp)
            VALUES (:user_id, 'CREATE', 'Program Section Management', 'program_section', :entity_id, :details, NOW())
        """)
        
        db.execute(audit_query, {
            "user_id": current_user_id,
            "entity_id": section_id,
            "details": json.dumps({
                "section_name": section_data.section_name,
                "program_id": section_data.program_id,
                "year_level": section_data.year_level,
                "semester": section_data.semester,
                "school_year": section_data.school_year
            })
        })
        db.commit()
        
        return {
            "success": True,
            "message": "Program section created successfully",
            "data": {"id": section_id}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating program section: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create program section: {str(e)}")


@router.put("/program-sections/{section_id}")
async def update_program_section(
    section_id: int,
    section_data: ProgramSectionUpdate,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update a program section"""
    try:
        # Check if section exists
        check_query = text("SELECT id FROM program_sections WHERE id = :section_id")
        existing = db.execute(check_query, {"section_id": section_id}).fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Program section not found")
        
        # Build update query dynamically
        update_fields = []
        params = {"section_id": section_id}
        
        if section_data.section_name is not None:
            update_fields.append("section_name = :section_name")
            params["section_name"] = section_data.section_name
        
        if section_data.program_id is not None:
            update_fields.append("program_id = :program_id")
            params["program_id"] = section_data.program_id
        
        if section_data.year_level is not None:
            update_fields.append("year_level = :year_level")
            params["year_level"] = section_data.year_level
        
        if section_data.semester is not None:
            update_fields.append("semester = :semester")
            params["semester"] = section_data.semester
        
        if section_data.school_year is not None:
            update_fields.append("school_year = :school_year")
            params["school_year"] = section_data.school_year
        
        if section_data.is_active is not None:
            update_fields.append("is_active = :is_active")
            params["is_active"] = section_data.is_active
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = NOW()")
        
        update_query = text(f"""
            UPDATE program_sections
            SET {', '.join(update_fields)}
            WHERE id = :section_id
        """)
        
        db.execute(update_query, params)
        db.commit()
        
        # Log the action
        audit_query = text("""
            INSERT INTO audit_logs (user_id, action, category, entity_type, entity_id, details, timestamp)
            VALUES (:user_id, 'UPDATE', 'Program Section Management', 'program_section', :entity_id, :details, NOW())
        """)
        
        db.execute(audit_query, {
            "user_id": current_user_id,
            "entity_id": section_id,
            "details": json.dumps(section_data.model_dump(exclude_none=True))
        })
        db.commit()
        
        return {
            "success": True,
            "message": "Program section updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating program section: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update program section: {str(e)}")


@router.delete("/program-sections/{section_id}")
async def delete_program_section(
    section_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Delete a program section"""
    try:
        # Check if section exists
        check_query = text("SELECT section_name FROM program_sections WHERE id = :section_id")
        existing = db.execute(check_query, {"section_id": section_id}).fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Program section not found")
        
        section_name = existing[0]
        
        # Delete section (CASCADE will handle section_students)
        delete_query = text("DELETE FROM program_sections WHERE id = :section_id")
        db.execute(delete_query, {"section_id": section_id})
        db.commit()
        
        # Log the action
        audit_query = text("""
            INSERT INTO audit_logs (user_id, action, category, entity_type, entity_id, details, timestamp)
            VALUES (:user_id, 'DELETE', 'Program Section Management', 'program_section', :entity_id, :details, NOW())
        """)
        
        db.execute(audit_query, {
            "user_id": current_user_id,
            "entity_id": section_id,
            "details": json.dumps({"section_name": section_name})
        })
        db.commit()
        
        return {
            "success": True,
            "message": "Program section deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting program section: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete program section: {str(e)}")


@router.get("/program-sections/{section_id}/students")
async def get_section_students(
    section_id: int,
    db: Session = Depends(get_db)
):
    """Get all students assigned to a program section"""
    try:
        query = text("""
            SELECT 
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                s.student_number,
                s.year_level,
                p.program_code,
                p.program_name,
                ss.created_at as assigned_at
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            JOIN students s ON s.user_id = u.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE ss.section_id = :section_id
            ORDER BY u.last_name, u.first_name
        """)
        
        result = db.execute(query, {"section_id": section_id})
        
        students = []
        for row in result:
            students.append({
                "id": row[0],
                "email": row[1],
                "firstName": row[2],
                "lastName": row[3],
                "studentNumber": row[4],
                "yearLevel": row[5],
                "programCode": row[6],
                "programName": row[7],
                "assignedAt": row[8].isoformat() if row[8] else None
            })
        
        return {
            "success": True,
            "data": students
        }
        
    except Exception as e:
        logger.error(f"Error fetching section students: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch section students: {str(e)}")


@router.get("/students-for-assignment")
async def get_students_for_assignment(
    program_id: Optional[int] = Query(None),
    year_level: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    exclude_section_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get students available for assignment with filters"""
    try:
        query = """
            SELECT 
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                s.student_number,
                s.year_level,
                p.program_code,
                p.program_name,
                CASE 
                    WHEN ss.id IS NOT NULL THEN true
                    ELSE false
                END as already_assigned
            FROM users u
            JOIN students s ON s.user_id = u.id
            LEFT JOIN programs p ON s.program_id = p.id
            LEFT JOIN section_students ss ON ss.student_id = u.id 
        """
        
        params = {}
        
        if exclude_section_id is not None:
            query += " AND ss.section_id = :exclude_section_id"
            params["exclude_section_id"] = exclude_section_id
        
        query += " WHERE u.role = 'student' AND u.is_active = true"
        
        if program_id is not None:
            query += " AND s.program_id = :program_id"
            params["program_id"] = program_id
        
        if year_level is not None:
            query += " AND s.year_level = :year_level"
            params["year_level"] = year_level
        
        if search:
            query += """ AND (
                u.first_name ILIKE :search OR 
                u.last_name ILIKE :search OR 
                u.email ILIKE :search OR 
                s.student_number ILIKE :search
            )"""
            params["search"] = f"%{search}%"
        
        query += " ORDER BY u.last_name, u.first_name"
        
        result = db.execute(text(query), params)
        
        students = []
        for row in result:
            students.append({
                "id": row[0],
                "email": row[1],
                "firstName": row[2],
                "lastName": row[3],
                "studentNumber": row[4],
                "yearLevel": row[5],
                "programCode": row[6],
                "programName": row[7],
                "alreadyAssigned": row[8]
            })
        
        return {
            "success": True,
            "data": students
        }
        
    except Exception as e:
        logger.error(f"Error fetching students for assignment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch students: {str(e)}")


class StudentAssignment(BaseModel):
    student_ids: List[int]

@router.post("/program-sections/{section_id}/assign-students")
async def assign_students_to_section(
    section_id: int,
    assignment: StudentAssignment,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Assign multiple students to a program section"""
    try:
        # Check if section exists
        check_query = text("SELECT id FROM program_sections WHERE id = :section_id")
        existing = db.execute(check_query, {"section_id": section_id}).fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Program section not found")
        
        assigned_count = 0
        skipped_count = 0
        
        for student_id in assignment.student_ids:
            # Check if already assigned
            check_student = text("""
                SELECT id FROM section_students 
                WHERE section_id = :section_id AND student_id = :student_id
            """)
            
            already_assigned = db.execute(check_student, {
                "section_id": section_id,
                "student_id": student_id
            }).fetchone()
            
            if already_assigned:
                skipped_count += 1
                continue
            
            # Assign student
            insert_query = text("""
                INSERT INTO section_students (section_id, student_id, created_at)
                VALUES (:section_id, :student_id, NOW())
            """)
            
            db.execute(insert_query, {
                "section_id": section_id,
                "student_id": student_id
            })
            assigned_count += 1
        
        db.commit()
        
        # Log the action
        audit_query = text("""
            INSERT INTO audit_logs (user_id, action, category, entity_type, entity_id, details, timestamp)
            VALUES (:user_id, 'ASSIGN_STUDENTS', 'Program Section Management', 'program_section', :entity_id, :details, NOW())
        """)
        
        db.execute(audit_query, {
            "user_id": current_user_id,
            "entity_id": section_id,
            "details": json.dumps({
                "assigned_count": assigned_count,
                "skipped_count": skipped_count,
                "student_ids": assignment.student_ids
            })
        })
        db.commit()
        
        return {
            "success": True,
            "message": f"Successfully assigned {assigned_count} student(s). {skipped_count} already assigned.",
            "data": {
                "assignedCount": assigned_count,
                "skippedCount": skipped_count
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error assigning students: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign students: {str(e)}")


@router.delete("/program-sections/{section_id}/students/{student_id}")
async def remove_student_from_section(
    section_id: int,
    student_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Remove a student from a program section"""
    try:
        # Check if assignment exists
        check_query = text("""
            SELECT id FROM section_students 
            WHERE section_id = :section_id AND student_id = :student_id
        """)
        
        existing = db.execute(check_query, {
            "section_id": section_id,
            "student_id": student_id
        }).fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Student assignment not found")
        
        # Remove assignment
        delete_query = text("""
            DELETE FROM section_students 
            WHERE section_id = :section_id AND student_id = :student_id
        """)
        
        db.execute(delete_query, {
            "section_id": section_id,
            "student_id": student_id
        })
        db.commit()
        
        # Log the action
        audit_query = text("""
            INSERT INTO audit_logs (user_id, action, category, entity_type, entity_id, details, timestamp)
            VALUES (:user_id, 'REMOVE_STUDENT', 'Program Section Management', 'program_section', :entity_id, :details, NOW())
        """)
        
        db.execute(audit_query, {
            "user_id": current_user_id,
            "entity_id": section_id,
            "details": json.dumps({"student_id": student_id})
        })
        db.commit()
        
        return {
            "success": True,
            "message": "Student removed from section successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing student: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to remove student: {str(e)}")


@router.post("/sections/{class_section_id}/enroll-program-section")
async def enroll_program_section_to_class(
    class_section_id: int,
    program_section_id: int = Body(..., embed=True),
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Bulk enroll all students from a program section into a class section"""
    try:
        # Check if class section exists
        check_class_section = text("SELECT id FROM class_sections WHERE id = :class_section_id")
        class_section = db.execute(check_class_section, {"class_section_id": class_section_id}).fetchone()
        
        if not class_section:
            raise HTTPException(status_code=404, detail="Class section not found")
        
        # Check if program section exists
        check_program_section = text("SELECT id, section_name FROM program_sections WHERE id = :program_section_id")
        program_section = db.execute(check_program_section, {"program_section_id": program_section_id}).fetchone()
        
        if not program_section:
            raise HTTPException(status_code=404, detail="Program section not found")
        
        section_name = program_section[1]
        
        # Get all students in the program section
        get_students_query = text("""
            SELECT DISTINCT ss.student_id
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            WHERE ss.section_id = :program_section_id
            AND u.is_active = true
            AND u.role = 'student'
        """)
        
        student_rows = db.execute(get_students_query, {"program_section_id": program_section_id}).fetchall()
        student_ids = [row[0] for row in student_rows]
        
        if not student_ids:
            return {
                "success": True,
                "message": "No active students found in the program section",
                "data": {
                    "enrolledCount": 0,
                    "skippedCount": 0,
                    "totalStudents": 0
                }
            }
        
        enrolled_count = 0
        skipped_count = 0
        
        for student_id in student_ids:
            # Check if already enrolled
            check_enrollment = text("""
                SELECT id FROM enrollments
                WHERE class_section_id = :class_section_id
                AND student_id = :student_id
            """)
            
            existing = db.execute(check_enrollment, {
                "class_section_id": class_section_id,
                "student_id": student_id
            }).fetchone()
            
            if existing:
                skipped_count += 1
                continue
            
            # Enroll student
            enroll_query = text("""
                INSERT INTO enrollments (student_id, class_section_id, status, enrolled_at)
                VALUES (:student_id, :class_section_id, 'active', NOW())
            """)
            
            db.execute(enroll_query, {
                "student_id": student_id,
                "class_section_id": class_section_id
            })
            enrolled_count += 1
        
        db.commit()
        
        # Log the action
        audit_query = text("""
            INSERT INTO audit_logs (user_id, action, category, entity_type, entity_id, details, timestamp)
            VALUES (:user_id, 'BULK_ENROLL_PROGRAM_SECTION', 'Enrollment Management', 'class_section', :entity_id, :details, NOW())
        """)
        
        db.execute(audit_query, {
            "user_id": current_user_id,
            "entity_id": class_section_id,
            "details": json.dumps({
                "program_section_id": program_section_id,
                "program_section_name": section_name,
                "enrolled_count": enrolled_count,
                "skipped_count": skipped_count,
                "total_students": len(student_ids)
            })
        })
        db.commit()
        
        return {
            "success": True,
            "message": f"Successfully enrolled {enrolled_count} student(s) from {section_name}. {skipped_count} already enrolled.",
            "data": {
                "enrolledCount": enrolled_count,
                "skippedCount": skipped_count,
                "totalStudents": len(student_ids)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error enrolling program section: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to enroll program section: {str(e)}")

