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
    Evaluation, EvaluationPeriod, AuditLog, SystemSettings, Program
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
    page_size: int = Query(10, ge=1, le=100),
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
                student_id=f"STU{new_user.id:05d}",
                first_name=user_data.first_name,
                last_name=user_data.last_name,
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
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    year_level: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get paginated list of all courses"""
    try:
        query = db.query(Course)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Course.course_code.ilike(search_filter),
                    Course.course_name.ilike(search_filter)
                )
            )
        
        if program_id:
            query = query.filter(Course.program_id == program_id)
        
        if year_level:
            query = query.filter(Course.year_level == year_level)
        
        total = query.count()
        offset = (page - 1) * page_size
        courses = query.offset(offset).limit(page_size).all()
        
        courses_data = [{
            "id": c.id,
            "course_code": c.course_code,
            "course_name": c.course_name,
            "program_id": c.program_id,
            "year_level": c.year_level,
            "semester": c.semester,
            "units": c.units,
            "created_at": c.created_at.isoformat() if c.created_at else None
        } for c in courses]
        
        return {
            "success": True,
            "data": courses_data,
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

# ===========================
# SYSTEM SETTINGS
# ===========================

@router.get("/settings/{category}")
async def get_system_settings(category: str, db: Session = Depends(get_db)):
    """Get system settings for a specific category"""
    try:
        settings = db.query(SystemSettings).filter(
            SystemSettings.category == category
        ).first()
        
        if not settings:
            # Return defaults
            return {
                "success": True,
                "data": {
                    "category": category,
                    "settings": {}
                }
            }
        
        return {
            "success": True,
            "data": {
                "category": settings.category,
                "settings": settings.settings,
                "updated_at": settings.updated_at.isoformat() if settings.updated_at else None
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching system settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/settings")
async def update_system_settings(
    settings_data: SystemSettingsUpdate,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update system settings"""
    try:
        settings = db.query(SystemSettings).filter(
            SystemSettings.category == settings_data.category
        ).first()
        
        if settings:
            settings.settings = settings_data.settings
            settings.updated_by = current_user_id
            settings.updated_at = datetime.utcnow()
        else:
            settings = SystemSettings(
                category=settings_data.category,
                settings=settings_data.settings,
                updated_by=current_user_id
            )
            db.add(settings)
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "SETTINGS_CHANGED", "System Settings",
            severity="Warning",
            details={"category": settings_data.category}
        )
        
        return {
            "success": True,
            "message": "Settings updated successfully"
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
        query = db.query(AuditLog)
        
        if action:
            query = query.filter(AuditLog.action == action)
        
        if severity:
            query = query.filter(AuditLog.severity == severity)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        
        total = query.count()
        offset = (page - 1) * page_size
        logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size).all()
        
        logs_data = [{
            "id": log.id,
            "user_id": log.user_id,
            "user_email": log.user_email,
            "action": log.action,
            "category": log.category,
            "severity": log.severity,
            "status": log.status,
            "ip_address": log.ip_address,
            "details": log.details,
            "created_at": log.created_at.isoformat()
        } for log in logs]
        
        return {
            "success": True,
            "data": logs_data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
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
        total_logs = db.query(func.count(AuditLog.id)).scalar() or 0
        
        # Last 24 hours
        yesterday = datetime.now() - timedelta(days=1)
        last_24h = db.query(func.count(AuditLog.id)).filter(
            AuditLog.created_at >= yesterday
        ).scalar() or 0
        
        # Critical events
        critical = db.query(func.count(AuditLog.id)).filter(
            AuditLog.severity == "Critical"
        ).scalar() or 0
        
        # Failed/Blocked
        failed = db.query(func.count(AuditLog.id)).filter(
            or_(AuditLog.status == "Failed", AuditLog.status == "Blocked")
        ).scalar() or 0
        
        return {
            "success": True,
            "data": {
                "total_logs": total_logs,
                "last_24h": last_24h,
                "critical_events": critical,
                "failed_blocked": failed
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching audit log stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# DATA EXPORT
# ===========================

@router.get("/export/users")
async def export_users(
    format: str = Query("csv", regex="^(csv|json)$"),
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
            return {"success": True, "data": users_data}
        
        # CSV format would be handled by frontend
        return {"success": True, "data": users}
        
    except Exception as e:
        logger.error(f"Error exporting users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/evaluations")
async def export_evaluations(
    format: str = Query("csv", regex="^(csv|json)$"),
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
        
        return {"success": True, "data": eval_data}
        
    except Exception as e:
        logger.error(f"Error exporting evaluations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard-stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get overall dashboard statistics for system admin"""
    try:
        # User stats
        total_users = db.query(func.count(User.id)).scalar() or 0
        active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
        
        # Course stats
        total_courses = db.query(func.count(Course.id)).scalar() or 0
        
        # Evaluation stats
        total_evaluations = db.query(func.count(Evaluation.id)).scalar() or 0
        
        # Active period
        active_period = db.query(EvaluationPeriod).filter(
            EvaluationPeriod.status == "active"
        ).first()
        
        # Recent audit logs
        recent_logs = db.query(func.count(AuditLog.id)).filter(
            AuditLog.created_at >= datetime.now() - timedelta(days=7)
        ).scalar() or 0
        
        return {
            "success": True,
            "data": {
                "users": {
                    "total": total_users,
                    "active": active_users
                },
                "courses": {
                    "total": total_courses
                },
                "evaluations": {
                    "total": total_evaluations
                },
                "active_period": {
                    "id": active_period.id if active_period else None,
                    "name": active_period.name if active_period else None,
                    "participation_rate": (active_period.completed_evaluations / active_period.total_students * 100) if active_period and active_period.total_students > 0 else 0
                } if active_period else None,
                "recent_audit_logs": recent_logs
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
