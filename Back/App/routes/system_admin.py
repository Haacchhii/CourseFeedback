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

from fastapi import APIRouter, HTTPException, Depends, Query, Body, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from database.connection import get_db
from middleware.auth import get_current_user, require_admin, require_staff
from models.enhanced_models import (
    User, Student, DepartmentHead, Secretary, Course, ClassSection,
    Evaluation, EvaluationPeriod, AuditLog, ExportHistory, Program,
    Enrollment
)
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, date, timezone
import logging
import bcrypt
import json
import asyncio
from config import now_local
from services.welcome_email_service import send_welcome_email, send_bulk_welcome_emails
from utils.validation import InputValidator, validate_export_filters, ValidationError

logger = logging.getLogger(__name__)
router = APIRouter()

# Helper function for background email sending
def send_email_background(email: str, first_name: str, last_name: str, school_id: str, role: str, temp_password: str):
    """Wrapper to run async send_welcome_email in background tasks"""
    try:
        asyncio.run(send_welcome_email(
            email=email,
            first_name=first_name,
            last_name=last_name,
            school_id=school_id,
            role=role,
            temp_password=temp_password
        ))
    except Exception as e:
        logger.error(f"Background email failed for {email}: {e}")

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

# class SystemSettingsUpdate(BaseModel):
#     model_config = {"extra": "ignore"}  # Ignore extra fields from frontend
#     
#     category: str
#     settings: dict

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
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get paginated list of all users with filters"""
    try:
        # Validate inputs
        page, page_size = InputValidator.validate_page_params(page, page_size)
        search = InputValidator.sanitize_search_query(search)
        role = InputValidator.validate_role(role)
        status = InputValidator.validate_status(status)
        program = InputValidator.validate_program_code(program)
        year_level = InputValidator.validate_year_level(year_level)
        
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
            # Accept both 'Active'/'Inactive' (frontend) and 'active'/'inactive' (lowercase)
            is_active = status.lower() == "active"
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
        
    except ValidationError as e:
        logger.warning(f"Validation error in get_all_users: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users")
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new user with enrollment list validation"""
    try:
        from services.enrollment_validation import EnrollmentValidationService
        
        current_user_id = current_user['id']
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # VALIDATE AGAINST ENROLLMENT LIST (for students only)
        if user_data.role == "student":
            # Require school_id (student_number) for students
            if not user_data.school_id:
                raise HTTPException(
                    status_code=400, 
                    detail="Student number (school_id) is required for student accounts"
                )
            
            # Check if enrollment list exists
            enrollment_service = EnrollmentValidationService()
            has_enrollment_list = enrollment_service.check_enrollment_list_exists(db)
            
            if has_enrollment_list:
                # Validate against enrollment list
                validation = enrollment_service.validate_student_enrollment(
                    db,
                    student_number=user_data.school_id,
                    program_id=user_data.program_id,
                    first_name=user_data.first_name,
                    last_name=user_data.last_name
                )
                
                if not validation["valid"]:
                    error_detail = {
                        "error": validation["error"],
                        "message": validation["message"],
                        "suggestion": validation.get("suggestion")
                    }
                    
                    # Include enrolled vs attempted program info if available
                    if "enrolled_program" in validation:
                        error_detail["enrolled_program"] = validation["enrolled_program"]
                        error_detail["attempted_program"] = validation["attempted_program"]
                    
                    raise HTTPException(status_code=400, detail=error_detail)
                
                # If validation passed, use enrollment data to populate fields
                enrollment_info = validation["enrollment"]
                
                # Auto-fill from enrollment list (overrides user input)
                user_data.first_name = enrollment_info["first_name"]
                user_data.last_name = enrollment_info["last_name"]
                user_data.program_id = enrollment_info["program_id"]
                user_data.year_level = enrollment_info["year_level"]
                
                # Use enrollment email if provided
                if enrollment_info["email"] and not user_data.email:
                    user_data.email = enrollment_info["email"]
                
                # Log warnings if any
                if validation.get("warnings"):
                    for warning in validation["warnings"]:
                        logger.warning(f"Name mismatch warning for {user_data.school_id}: {warning}")
                
                logger.info(f"✅ Student validated against enrollment list: {user_data.school_id} -> {enrollment_info['program_code']}")
        
        # Validate password for non-student roles (students get auto-generated passwords)
        if user_data.role not in ["student", "secretary", "department_head"]:
            # Validate password strength for instructors and admins
            if user_data.password:
                pwd = user_data.password
                if len(pwd) < 8:
                    raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
                if not any(c.isupper() for c in pwd):
                    raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
                if not any(c.islower() for c in pwd):
                    raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
                if not any(c.isdigit() for c in pwd):
                    raise HTTPException(status_code=400, detail="Password must contain at least one digit")
                if not any(c in '!@#$%^&*(),.?\":{}|<>' for c in pwd):
                    raise HTTPException(status_code=400, detail="Password must contain at least one special character")
        
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
            # CRITICAL: student_number should be school_id (the student's ID number)
            # Do NOT use user.id or names - use the actual school_id from the CSV
            student_number = school_id if school_id else f"STU{new_user.id:05d}"
            
            logger.info(f"Creating student record: user_id={new_user.id}, email={user_data.email}, school_id={school_id}, student_number={student_number}")
            
            student = Student(
                user_id=new_user.id,
                student_number=student_number,  # This is the student's school ID number
                program_id=user_data.program_id,
                year_level=user_data.year_level or 1
            )
            db.add(student)
            logger.info(f"✅ Student record created: student_number={student_number} for user {user_data.email}")
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
                temp_password=generated_password_info
                # login_url will use FRONTEND_URL from .env
            )
            logger.info(f"Welcome email result for {user_data.email}: {email_result['message']}")
        
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

@router.post("/users/bulk-import")
async def bulk_import_users(
    users: List[UserCreate],
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Bulk import multiple users in a single transaction for better performance.
    Processes all users in one database session with batch commits.
    Sends welcome emails asynchronously in the background.
    """
    try:
        from services.enrollment_validation import EnrollmentValidationService
        current_user_id = current_user['id']
        
        # Pre-fetch programs once for all users
        programs = db.query(Program).all()
        program_map = {p.program_code: p for p in programs}
        program_id_map = {p.id: p for p in programs}
        
        # Check enrollment list availability once
        enrollment_service = EnrollmentValidationService()
        has_enrollment_list = enrollment_service.check_enrollment_list_exists(db)
        
        results = {
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for idx, user_data in enumerate(users):
            try:
                # Check if email already exists
                existing_user = db.query(User).filter(User.email == user_data.email).first()
                if existing_user:
                    results["failed"] += 1
                    results["errors"].append({
                        "row": idx + 1,
                        "email": user_data.email,
                        "error": "Email already exists"
                    })
                    continue
                
                # Validate students against enrollment list
                if user_data.role == "student" and has_enrollment_list:
                    if not user_data.school_id:
                        results["failed"] += 1
                        results["errors"].append({
                            "row": idx + 1,
                            "email": user_data.email,
                            "error": "Student number (school_id) is required"
                        })
                        continue
                    
                    # Don't pass program_id if it's None - let validation accept enrolled program
                    validation = enrollment_service.validate_student_enrollment(
                        db,
                        student_number=user_data.school_id,
                        program_id=user_data.program_id if user_data.program_id else None,
                        first_name=user_data.first_name,
                        last_name=user_data.last_name
                    )
                    
                    if not validation["valid"]:
                        results["failed"] += 1
                        results["errors"].append({
                            "row": idx + 1,
                            "email": user_data.email,
                            "error": validation["message"]
                        })
                        continue
                    
                    # Use enrollment data
                    enrollment_info = validation["enrollment"]
                    user_data.first_name = enrollment_info["first_name"]
                    user_data.last_name = enrollment_info["last_name"]
                    user_data.program_id = enrollment_info["program_id"]
                    user_data.year_level = enrollment_info["year_level"]
                
                # Generate password
                must_change_password = False
                first_login = False
                actual_password = user_data.password
                school_id = user_data.school_id
                
                if user_data.role == "student":
                    if not school_id and user_data.email:
                        school_id = user_data.email.split('@')[0]
                    if school_id:
                        actual_password = f"lpub@{school_id}"
                        must_change_password = True
                        first_login = True
                elif user_data.role in ["secretary", "department_head"]:
                    first_login = True
                    must_change_password = True
                    if school_id:
                        actual_password = f"lpub@{school_id}"
                
                # Hash password
                from passlib.context import CryptContext
                pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
                hashed_password = pwd_context.hash(actual_password)
                
                # Create user
                new_user = User(
                    email=user_data.email,
                    password_hash=hashed_password,
                    first_name=user_data.first_name,
                    last_name=user_data.last_name,
                    role=user_data.role.lower(),
                    department=user_data.department,
                    is_active=True,
                    must_change_password=must_change_password,
                    first_login=first_login,
                    created_at=now_local(),
                    updated_at=now_local()
                )
                db.add(new_user)
                db.flush()  # Get user ID without committing
                
                # Create role-specific record
                if user_data.role == "student":
                    program_id = user_data.program_id
                    if not program_id and user_data.program:
                        prog = program_map.get(user_data.program)
                        if prog:
                            program_id = prog.id
                    
                    student = Student(
                        user_id=new_user.id,
                        student_number=school_id,
                        program_id=program_id,
                        year_level=user_data.year_level or 1
                    )
                    db.add(student)
                elif user_data.role == "instructor":
                    instructor = Instructor(user_id=new_user.id)
                    db.add(instructor)
                elif user_data.role == "secretary":
                    secretary = Secretary(user_id=new_user.id)
                    db.add(secretary)
                elif user_data.role == "department_head":
                    dept_head = DepartmentHead(user_id=new_user.id)
                    db.add(dept_head)
                
                # Queue welcome email to be sent in background (don't block import)
                if must_change_password and school_id:
                    background_tasks.add_task(
                        send_email_background,
                        email=user_data.email,
                        first_name=user_data.first_name,
                        last_name=user_data.last_name,
                        school_id=school_id,
                        role=user_data.role,
                        temp_password=actual_password
                    )
                
                results["success"] += 1
                
                # Commit every 50 users for better performance
                if (idx + 1) % 50 == 0:
                    db.commit()
                
            except Exception as user_error:
                results["failed"] += 1
                results["errors"].append({
                    "row": idx + 1,
                    "email": user_data.email,
                    "error": str(user_error)
                })
                logger.error(f"Error importing user {user_data.email}: {user_error}")
        
        # Final commit
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "BULK_USER_IMPORT", "User Management",
            details={"total": len(users), "success": results["success"], "failed": results["failed"]}
        )
        
        return {
            "success": True,
            "message": f"Bulk import completed: {results['success']} succeeded, {results['failed']} failed",
            "data": results
        }
        
    except Exception as e:
        logger.error(f"Error in bulk import: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update an existing user"""
    try:
        current_user_id = current_user['id']
        
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
    force: bool = False,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a user - performs hard delete if no data exists, soft delete otherwise.
    - Hard delete: User has no evaluations, enrollments, or audit logs (newly created)
    - Soft delete: User has related data (preserves data integrity)
    - Force delete: Permanently removes user and all related data (use with caution)
    """
    try:
        current_user_id = current_user['id']
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user has any related data
        has_evaluations = db.query(Evaluation).filter(Evaluation.student_id == user_id).first() is not None
        has_enrollments = db.query(Enrollment).filter(Enrollment.student_id == user_id).first() is not None
        has_audit_logs = db.query(AuditLog).filter(AuditLog.user_id == user_id).first() is not None
        
        # Check if user is a student with a student record
        student_record = None
        if user.role == 'student':
            student_record = db.query(Student).filter(Student.user_id == user_id).first()
        
        # Check if user is department head with a record
        dept_head_record = None
        if user.role == 'department_head':
            dept_head_record = db.query(DepartmentHead).filter(DepartmentHead.user_id == user_id).first()
        
        # Check if user is secretary with a record
        secretary_record = None
        if user.role == 'secretary':
            secretary_record = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        
        # Determine delete type
        has_data = has_evaluations or has_enrollments or has_audit_logs
        
        # Force delete overrides normal logic
        if force:
            # Force delete - remove ALL related data first
            if has_evaluations:
                db.query(Evaluation).filter(Evaluation.student_id == user_id).delete()
            if has_enrollments:
                db.query(Enrollment).filter(Enrollment.student_id == user_id).delete()
            # Note: Keep audit logs for compliance, just mark user as deleted
            
            # Delete role-specific records
            if student_record:
                db.delete(student_record)
            if dept_head_record:
                db.delete(dept_head_record)
            if secretary_record:
                db.delete(secretary_record)
            
            # Delete the user
            db.delete(user)
            db.commit()
            
            # Log audit event
            await create_audit_log(
                db, current_user_id, "USER_FORCE_DELETED", "User Management",
                details={
                    "user_id": user_id,
                    "email": user.email,
                    "delete_type": "force",
                    "had_evaluations": has_evaluations,
                    "had_enrollments": has_enrollments,
                    "reason": "Force deleted by administrator"
                }
            )
            
            return {
                "success": True,
                "message": "User and all related data permanently deleted (force delete)",
                "delete_type": "force"
            }
        
        delete_type = "soft" if has_data else "hard"
        
        if delete_type == "hard":
            # Hard delete - completely remove user and role records
            if student_record:
                db.delete(student_record)
            if dept_head_record:
                db.delete(dept_head_record)
            if secretary_record:
                db.delete(secretary_record)
            
            # Delete the user
            db.delete(user)
            db.commit()
            
            # Log audit event
            await create_audit_log(
                db, current_user_id, "USER_DELETED", "User Management",
                details={
                    "user_id": user_id, 
                    "email": user.email,
                    "delete_type": "hard",
                    "reason": "No related data found"
                }
            )
            
            return {
                "success": True,
                "message": "User permanently deleted (no related data found)",
                "delete_type": "hard"
            }
        else:
            # Soft delete - preserve data integrity
            user.is_active = False
            user.updated_at = now_local()
            db.commit()
            
            # Log audit event
            await create_audit_log(
                db, current_user_id, "USER_DELETED", "User Management",
                details={
                    "user_id": user_id, 
                    "email": user.email,
                    "delete_type": "soft",
                    "reason": "Has related data (evaluations/enrollments/logs)"
                }
            )
            
            return {
                "success": True,
                "message": "User deactivated (has related data - preserving for integrity)",
                "delete_type": "soft"
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
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Reset a user's password"""
    try:
        current_user_id = current_user['id']
        
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
async def get_user_stats(
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
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
    current_user: dict = Depends(require_staff),
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
            # Calculate total evaluation records for this period (pending + completed)
            total_evaluations = db.execute(text("""
                SELECT COUNT(*)
                FROM evaluations
                WHERE evaluation_period_id = :period_id
            """), {"period_id": p.id}).scalar() or 0
            
            # Calculate completed evaluations (those with submission_date)
            completed_evaluations = db.execute(text("""
                SELECT COUNT(*)
                FROM evaluations
                WHERE evaluation_period_id = :period_id
                AND submission_date IS NOT NULL
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
            
            # Normalize status for frontend (map active->Open, closed->Closed)
            display_status = "Open" if p.status in ["active", "Open"] else "Closed" if p.status in ["closed", "Closed"] else p.status
            
            periods_data.append({
                "id": p.id,
                "name": p.name,
                "semester": p.semester,
                "academicYear": p.academic_year,  # camelCase for frontend
                "startDate": p.start_date.isoformat(),
                "endDate": p.end_date.isoformat(),
                "status": display_status,
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
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new evaluation period"""
    try:
        current_user_id = current_user['id']
        
        # Check for duplicate period names (prevent confusion)
        existing_period = db.query(EvaluationPeriod).filter(
            EvaluationPeriod.name == period_data.name,
            EvaluationPeriod.semester == period_data.semester,
            EvaluationPeriod.academic_year == period_data.academic_year
        ).first()
        
        if existing_period:
            raise HTTPException(
                status_code=400,
                detail=f"Period '{period_data.name}' already exists for {period_data.semester} {period_data.academic_year}"
            )
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating evaluation period: {e}")
        import traceback
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create evaluation period: {str(e)}")

@router.patch("/evaluation-periods/{period_id}")
async def update_evaluation_period(
    period_id: int,
    end_date: Optional[str] = Body(None),
    start_date: Optional[str] = Body(None),
    name: Optional[str] = Body(None),
    semester: Optional[str] = Body(None),
    academic_year: Optional[str] = Body(None),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update evaluation period details (extend dates, rename, etc.)"""
    try:
        current_user_id = current_user['id']
        
        period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == period_id).first()
        if not period:
            raise HTTPException(status_code=404, detail="Evaluation period not found")
        
        from datetime import datetime
        
        # Update fields if provided
        if end_date:
            period.end_date = datetime.strptime(end_date, "%Y-%m-%d")
        if start_date:
            period.start_date = datetime.strptime(start_date, "%Y-%m-%d")
        if name:
            period.name = name
        if semester:
            period.semester = semester
        if academic_year:
            period.academic_year = academic_year
            
        period.updated_at = now_local()
        db.commit()
        db.refresh(period)
        
        logger.info(f"[PERIOD-UPDATE] Period {period_id} updated successfully")
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "PERIOD_UPDATED", "Evaluation Management",
            severity="Info",
            details={
                "period_id": period_id,
                "period_name": period.name,
                "end_date": period.end_date.strftime("%Y-%m-%d"),
                "start_date": period.start_date.strftime("%Y-%m-%d")
            }
        )
        
        return {
            "success": True,
            "message": "Evaluation period updated successfully",
            "data": {
                "id": period.id,
                "name": period.name,
                "start_date": period.start_date.strftime("%Y-%m-%d"),
                "end_date": period.end_date.strftime("%Y-%m-%d"),
                "status": period.status
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating period: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/evaluation-periods/{period_id}/status")
async def update_period_status(
    period_id: int,
    status: str = Body(..., embed=True),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update evaluation period status (draft -> active -> closed)"""
    try:
        current_user_id = current_user['id']
        
        period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == period_id).first()
        if not period:
            raise HTTPException(status_code=404, detail="Evaluation period not found")
        
        # Map frontend status values to database values
        status_mapping = {
            "Open": "active",
            "Active": "active",
            "active": "active",
            "Closed": "closed",
            "closed": "closed",
            "Draft": "draft",
            "draft": "draft"
        }
        
        if status not in status_mapping:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status. Must be one of: Open/Active, Closed, or Draft"
            )
        
        db_status = status_mapping[status]
        
        # Close any other active periods if activating this one
        if db_status == "active":
            # Verify the period dates are valid
            from datetime import date
            today = date.today()
            if period.start_date.date() > today:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot activate period. Start date ({period.start_date.strftime('%Y-%m-%d')}) is in the future."
                )
            
            # Close other active periods
            db.query(EvaluationPeriod).filter(
                EvaluationPeriod.status == "active",
                EvaluationPeriod.id != period_id
            ).update({"status": "closed", "updated_at": now_local()})
            
            logger.info(f"[PERIOD-STATUS] Closing other active periods, activating period {period_id}")
        
        old_status = period.status
        period.status = db_status
        period.updated_at = now_local()
        db.commit()
        
        logger.info(f"[PERIOD-STATUS] Period {period_id} status changed from '{old_status}' to '{db_status}'")
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, f"PERIOD_{db_status.upper()}", "Evaluation Management",
            severity="Warning" if db_status == "closed" else "Info",
            details={
                "period_id": period_id, 
                "period_name": period.name,
                "old_status": old_status,
                "new_status": db_status,
                "start_date": period.start_date.strftime("%Y-%m-%d"),
                "end_date": period.end_date.strftime("%Y-%m-%d")
            }
        )
        
        return {
            "success": True,
            "message": f"Evaluation period {db_status} successfully",
            "data": {
                "period_id": period_id,
                "period_name": period.name,
                "status": db_status,
                "start_date": period.start_date.strftime("%Y-%m-%d"),
                "end_date": period.end_date.strftime("%Y-%m-%d")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating period status: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/evaluation-periods/{period_id}")
async def delete_evaluation_period(
    period_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete an evaluation period (only if no evaluations exist)
    """
    try:
        current_user_id = current_user['id']
        
        # Get the period
        period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == period_id).first()
        
        if not period:
            raise HTTPException(status_code=404, detail="Evaluation period not found")
        
        # Check if there are any evaluations for this period (via enrollments)
        evaluation_count = db.execute(text("""
            SELECT COUNT(DISTINCT e.id)
            FROM evaluations e
            JOIN enrollments en ON e.student_id = en.student_id 
                AND e.class_section_id = en.class_section_id
            WHERE en.evaluation_period_id = :period_id
        """), {"period_id": period_id}).scalar() or 0
        
        if evaluation_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete period with {evaluation_count} existing evaluations. Close the period instead."
            )
        
        # Check if there are any enrollments for this period
        enrollment_count = db.query(func.count(Enrollment.id)).filter(
            Enrollment.evaluation_period_id == period_id
        ).scalar() or 0
        
        if enrollment_count > 0:
            logger.warning(f"Deleting period {period_id} with {enrollment_count} enrollments")
        
        period_name = period.name
        
        # Delete period enrollments tracking records
        db.execute(text("""
            DELETE FROM period_enrollments 
            WHERE evaluation_period_id = :period_id
        """), {"period_id": period_id})
        
        # Delete enrollments
        db.execute(text("""
            DELETE FROM enrollments 
            WHERE evaluation_period_id = :period_id
        """), {"period_id": period_id})
        
        # Delete the period
        db.delete(period)
        db.commit()
        
        logger.info(f"[PERIOD-DELETE] Period {period_id} '{period_name}' deleted by user {current_user_id}")
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "PERIOD_DELETED", "Evaluation Management",
            severity="Warning",
            details={
                "period_id": period_id, 
                "period_name": period_name,
                "enrollment_count": enrollment_count
            }
        )
        
        return {
            "success": True,
            "message": f"Evaluation period '{period_name}' deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting period: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluation-periods/active")
async def get_active_period(
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
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
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Enable a class section (block section) for evaluation in a specific period
    All students enrolled in this section will be able to evaluate during this period
    """
    try:
        current_user_id = current_user['id']
        
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
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Remove a class section enrollment from an evaluation period"""
    try:
        current_user_id = current_user['id']
        
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
            # Count evaluations created for this program section in this period
            evaluations_count = db.execute(text("""
                SELECT COUNT(*)
                FROM evaluations ev
                JOIN students s ON ev.student_id = s.id
                JOIN section_students ss ON ss.student_id = s.user_id
                WHERE ss.section_id = :program_section_id
                AND ev.evaluation_period_id = :period_id
            """), {
                "program_section_id": row[1],
                "period_id": period_id
            }).scalar() or 0
            
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
                "evaluations_created": evaluations_count,
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


@router.delete("/evaluation-periods/{period_id}/enrolled-program-sections/{enrollment_id}")
async def remove_program_section_enrollment(
    period_id: int,
    enrollment_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Remove a program section enrollment from an evaluation period"""
    try:
        current_user_id = current_user['id']
        
        # Get enrollment details before deleting
        enrollment_info = db.execute(text("""
            SELECT pps.program_section_id, ps.section_name, p.program_name
            FROM period_program_sections pps
            JOIN program_sections ps ON pps.program_section_id = ps.id
            JOIN programs p ON ps.program_id = p.id
            WHERE pps.id = :enrollment_id
            AND pps.evaluation_period_id = :period_id
        """), {
            "enrollment_id": enrollment_id,
            "period_id": period_id
        }).fetchone()
        
        if not enrollment_info:
            raise HTTPException(status_code=404, detail="Program section enrollment not found")
        
        program_section_id = enrollment_info[0]
        section_name = enrollment_info[1]
        program_name = enrollment_info[2]
        
        # Delete evaluation records for this program section in this period
        delete_evals_result = db.execute(text("""
            DELETE FROM evaluations
            WHERE evaluation_period_id = :period_id
            AND student_id IN (
                SELECT s.id 
                FROM students s
                JOIN section_students ss ON ss.student_id = s.user_id
                WHERE ss.section_id = :program_section_id
            )
        """), {
            "period_id": period_id,
            "program_section_id": program_section_id
        })
        evaluations_deleted = delete_evals_result.rowcount
        
        # Clear evaluation_period_id from enrollments
        db.execute(text("""
            UPDATE enrollments
            SET evaluation_period_id = NULL
            WHERE evaluation_period_id = :period_id
            AND student_id IN (
                SELECT s.id 
                FROM students s
                JOIN section_students ss ON ss.student_id = s.user_id
                WHERE ss.section_id = :program_section_id
            )
        """), {
            "period_id": period_id,
            "program_section_id": program_section_id
        })
        
        # Delete the program section enrollment record
        db.execute(text("""
            DELETE FROM period_program_sections
            WHERE id = :enrollment_id
            AND evaluation_period_id = :period_id
        """), {
            "enrollment_id": enrollment_id,
            "period_id": period_id
        })
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "PROGRAM_SECTION_REMOVED_FROM_PERIOD", "Evaluation Management",
            details={
                "period_id": period_id,
                "program_section_id": program_section_id,
                "section_name": section_name,
                "program_name": program_name,
                "evaluations_deleted": evaluations_deleted
            }
        )
        
        return {
            "success": True,
            "message": f"Program section '{section_name}' removed from evaluation period",
            "evaluations_deleted": evaluations_deleted
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing program section enrollment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluation-periods/{period_id}/enroll-program-section")
async def enroll_program_section_in_period(
    period_id: int,
    program_section_id: int = Body(..., embed=True),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Enroll a program section (student group) into an evaluation period.
    This will create evaluation records for all students in the program section
    for ALL courses they are enrolled in.
    """
    try:
        current_user_id = current_user['id']
        
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
            SELECT DISTINCT s.id, u.email, u.first_name, u.last_name
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            JOIN students s ON s.user_id = u.id
            WHERE ss.section_id = :program_section_id
            AND u.is_active = true
            AND u.role = 'student'
        """), {"program_section_id": program_section_id}).fetchall()
        
        student_ids = [row[0] for row in students]
        
        if not student_ids:
            # Check if there are ANY students (active or not) in the section
            total_students = db.execute(text("""
                SELECT COUNT(*) FROM section_students WHERE section_id = :program_section_id
            """), {"program_section_id": program_section_id}).scalar()
            
            if total_students == 0:
                return {
                    "success": False,
                    "message": f"⚠️ No students are assigned to program section '{section_info[1]}'. Please add students to this section first."
                }
            else:
                return {
                    "success": False,
                    "message": f"⚠️ No active students found in program section '{section_info[1]}'. Found {total_students} inactive/non-student users. Please check user statuses."
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
            # Check if students have ANY enrollments (active or not)
            total_enrollments = db.execute(text("""
                SELECT COUNT(*) FROM enrollments WHERE student_id = ANY(:student_ids)
            """), {"student_ids": student_ids}).scalar()
            
            student_names = [f"{row[2]} {row[3]} ({row[1]})" for row in students[:5]]  # Show first 5
            student_list = ", ".join(student_names)
            
            if total_enrollments == 0:
                return {
                    "success": False,
                    "message": f"⚠️ No course enrollments found for the {len(student_ids)} students in '{section_info[1]}'.\n\nStudents found: {student_list}{'...' if len(students) > 5 else ''}\n\nPlease ensure these students are enrolled in courses (class sections) first."
                }
            else:
                return {
                    "success": False,
                    "message": f"⚠️ Found {total_enrollments} enrollments but none are 'active' status for students in '{section_info[1]}'.\n\nPlease check enrollment statuses in the database."
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
                student_id, class_section_id, evaluation_period_id, status, created_at, submission_date
            )
            SELECT 
                e.student_id, 
                e.class_section_id, 
                :period_id,
                'pending',
                NOW(),
                NULL
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
        
        evaluation_ids = result.fetchall()
        evaluations_created = len(evaluation_ids)
        
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
    period_id: Optional[int] = Query(None, description="Filter by evaluation period (default: active period)"),
    show_all_periods: bool = Query(False, description="Show courses from all periods"),
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of courses with enrollment data
    
    By default, shows courses from the active evaluation period.
    Use show_all_periods=true to see all historical courses.
    Use period_id to filter by specific period.
    """
    try:
        # Determine which period to filter by
        filter_period_id = None
        if not show_all_periods:
            if period_id:
                filter_period_id = period_id
            else:
                # Default to active period
                active_period = db.execute(text("""
                    SELECT id FROM evaluation_periods 
                    WHERE status = 'Open' 
                    ORDER BY created_at DESC LIMIT 1
                """)).fetchone()
                filter_period_id = active_period[0] if active_period else None
        
        # Query courses with enrollment data from period_enrollments
        query_str = """
            SELECT DISTINCT
                c.id,
                c.subject_code,
                c.subject_name,
                c.program_id,
                c.year_level,
                c.semester,
                c.units,
                c.created_at,
                p.program_code as program_code,
                c.is_active,
                COALESCE(enr_counts.total_enrolled, 0) as total_enrolled,
                COALESCE(enr_counts.sections_count, 0) as sections_count
            FROM courses c
            LEFT JOIN programs p ON c.program_id = p.id
            LEFT JOIN LATERAL (
                SELECT 
                    COUNT(DISTINCT e.student_id) as total_enrolled,
                    COUNT(DISTINCT cs.id) as sections_count
                FROM class_sections cs
                LEFT JOIN enrollments e ON cs.id = e.class_section_id 
                    AND e.status = 'active'
        """
        
        # Add period filter to subquery if specified
        if filter_period_id:
            query_str += " AND e.evaluation_period_id = :period_id"
        
        query_str += """
                WHERE cs.course_id = c.id
            ) enr_counts ON true
            WHERE 1=1
        """
        
        params = {}
        if filter_period_id:
            params['period_id'] = filter_period_id
        
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
            is_active = row[9]  # is_active field from query
            total_enrolled = row[10]  # enrolled students count
            sections_count = row[11]  # sections count
            
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
                # Real enrollment data from the filtered period
                "sectionCount": sections_count,
                "enrolledStudents": total_enrolled,
                "enrolled_students": total_enrolled,  # Alternative field name
                "status": "Active" if is_active else "Archived"
            })
        
        # Get period info for response
        period_info = None
        if filter_period_id:
            period_data = db.execute(text("""
                SELECT id, name, semester, academic_year, status
                FROM evaluation_periods WHERE id = :period_id
            """), {"period_id": filter_period_id}).fetchone()
            if period_data:
                period_info = {
                    "id": period_data[0],
                    "name": period_data[1],
                    "semester": period_data[2],
                    "academic_year": period_data[3],
                    "status": period_data[4]
                }
        
        return {
            "success": True,
            "data": courses,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size
            },
            "filter_info": {
                "period_id": filter_period_id,
                "period": period_info,
                "show_all_periods": show_all_periods,
                "message": "Showing all historical courses" if show_all_periods 
                          else f"Showing courses from {period_info['name'] if period_info else 'active period'}"
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
    current_user: dict = Depends(require_admin),
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
        
        # Check if course already exists (prevent duplicates)
        existing_course = db.query(Course).filter(
            Course.subject_code == course_data.classCode,
            Course.program_id == program.id,
            Course.year_level == course_data.yearLevel,
            Course.semester == semester_int
        ).first()
        
        if existing_course:
            raise HTTPException(
                status_code=400,
                detail=f"Course '{course_data.classCode}' already exists for {course_data.program} Year {course_data.yearLevel} Semester {semester_int}"
            )
        
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
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
async def get_programs(
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
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
    program_section_id: Optional[int] = None,
    year_level: Optional[int] = None,
    semester: Optional[int] = None,
    current_user: dict = Depends(require_staff),
    period_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get all class sections with enrollment counts
    
    Filters:
    - search: Search in course code, name, or section code
    - program_code: Filter by program code (e.g., 'BSIT', 'BSCS-DS')
    - program_section_id: Filter by program section (e.g., 'BSIT 3-1')
    - year_level: Filter by year level (1-4)
    - semester: Filter by semester (1, 2, 3)
    - period_id: Filter by evaluation period (shows only sections enrolled in that period)
    """
    try:
        # Build query string dynamically to properly handle filters
        query_str = """
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
        """
        
        # Build WHERE clause
        where_conditions = ["c.id IS NOT NULL"]  # Only show sections with valid courses
        params = {}
        
        # Add filters
        if search:
            where_conditions.append("(c.subject_code ILIKE :search OR c.subject_name ILIKE :search OR cs.class_code ILIKE :search)")
            params['search'] = f"%{search}%"
        
        if program_id:
            where_conditions.append("c.program_id = :program_id")
            params['program_id'] = program_id
        
        if program_code:
            where_conditions.append("p.program_code = :program_code")
            params['program_code'] = program_code
        
        if year_level:
            where_conditions.append("c.year_level = :year_level")
            params['year_level'] = year_level
        
        if semester:
            where_conditions.append("cs.semester = CAST(:semester AS VARCHAR)")
            params['semester'] = semester
        
        # Program section filter - use subquery to check if section has students from that program section
        if program_section_id:
            where_conditions.append("""
                cs.id IN (
                    SELECT DISTINCT e2.class_section_id 
                    FROM enrollments e2
                    JOIN section_students ss ON e2.student_id = ss.student_id
                    WHERE ss.section_id = :program_section_id
                )
            """)
            params['program_section_id'] = program_section_id
        
        # Period filter - only show sections with enrollments in that period
        if period_id:
            where_conditions.append("""
                cs.id IN (
                    SELECT DISTINCT class_section_id 
                    FROM enrollments 
                    WHERE evaluation_period_id = :period_id
                )
            """)
            params['period_id'] = period_id
        
        # Combine WHERE conditions
        query_str += " WHERE " + " AND ".join(where_conditions)
        
        query_str += """
            GROUP BY cs.id, cs.course_id, c.subject_code, c.subject_name, 
                     cs.class_code, c.program_id, p.program_code, c.year_level, cs.semester, 
                     cs.academic_year, cs.max_students
            ORDER BY p.program_code, c.year_level, cs.semester, c.subject_code, cs.class_code
        """
        
        result = db.execute(text(query_str), params)
        sections = [dict(row._mapping) for row in result]
        
        # Get period info if filtering by period
        period_info = None
        if period_id:
            period_data = db.execute(text("""
                SELECT id, name, semester, academic_year, status
                FROM evaluation_periods WHERE id = :period_id
            """), {"period_id": period_id}).fetchone()
            if period_data:
                period_info = {
                    "id": period_data[0],
                    "name": period_data[1],
                    "semester": period_data[2],
                    "academic_year": period_data[3],
                    "status": period_data[4]
                }
        
        return {
            "success": True,
            "data": sections,
            "total": len(sections),
            "filter_info": {
                "search": search,
                "program_id": program_id,
                "program_code": program_code,
                "program_section_id": program_section_id,
                "year_level": year_level,
                "semester": semester,
                "period_id": period_id,
                "period": period_info
            }
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
    program_section_id: int = None  # Optional: for auto-enrolling specific program section students

@router.post("/sections")
async def create_section(
    section_data: SectionCreate,
    auto_enroll: bool = Query(False, description="Auto-enroll students from matching program/year"),
    db: Session = Depends(get_db)
):
    """Create a new class section with optional auto-enrollment"""
    try:
        logger.info(f"[CREATE_SECTION] Creating section: {section_data.class_code}, auto_enroll={auto_enroll}, program_section_id={section_data.program_section_id}")
        
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
            logger.info(f"[AUTO_ENROLL] Starting auto-enrollment for section {new_section.id}")
            try:
                # If program_section_id is provided, enroll students from that specific section
                if section_data.program_section_id:
                    logger.info(f"[AUTO_ENROLL] Using program_section_id: {section_data.program_section_id}")
                    # Query students linked to this program section via section_students
                    from sqlalchemy import text
                    result = db.execute(
                        text("""
                            SELECT DISTINCT u.id, s.id as student_id
                            FROM section_students ss
                            JOIN users u ON ss.student_id = u.id
                            JOIN students s ON s.user_id = u.id
                            WHERE ss.section_id = :section_id
                            AND s.is_active = true
                        """),
                        {"section_id": section_data.program_section_id}
                    )
                    student_rows = result.fetchall()
                    
                    logger.info(f"[AUTO_ENROLL] Found {len(student_rows)} students in program section {section_data.program_section_id}")
                    
                    for row in student_rows:
                        student_id = row.student_id
                        # Check if not already enrolled
                        existing_enrollment = db.query(Enrollment).filter(
                            Enrollment.class_section_id == new_section.id,
                            Enrollment.student_id == student_id
                        ).first()
                        
                        if not existing_enrollment:
                            new_enrollment = Enrollment(
                                student_id=student_id,
                                class_section_id=new_section.id,
                                enrolled_at=now_local(),
                                status='active'
                            )
                            db.add(new_enrollment)
                            enrolled_count += 1
                else:
                    # Fallback: Find all students matching the course's program and year level
                    matching_students = db.query(Student).filter(
                        Student.program_id == course.program_id,
                        Student.year_level == course.year_level,
                        Student.is_active == True
                    ).all()
                    
                    logger.info(f"[AUTO_ENROLL] Found {len(matching_students)} students matching program/year (fallback mode)")
                    
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
                logger.info(f"[AUTO_ENROLL] Successfully enrolled {enrolled_count} students into section {new_section.id}")
            except Exception as enroll_error:
                logger.error(f"[AUTO_ENROLL] Error during auto-enrollment: {enroll_error}")
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a class section and all its enrollments"""
    try:
        logger.info(f"[DELETE_SECTION] Starting deletion for section_id={section_id}")
        
        # Get class_code directly from database using raw SQL (avoid ORM issues)
        result = db.execute(text("SELECT class_code FROM class_sections WHERE id = :section_id"), {"section_id": section_id}).fetchone()
        
        if not result:
            logger.warning(f"[DELETE_SECTION] Section {section_id} not found in database")
            raise HTTPException(status_code=404, detail="Section not found")
        
        class_code = result[0]
        
        # Delete related records in order (to avoid foreign key constraint errors)
        # Use raw SQL to avoid ORM model issues with missing columns
        
        # 1. Delete evaluations for this section
        db.execute(text("DELETE FROM evaluations WHERE class_section_id = :section_id"), {"section_id": section_id})
        
        # 2. Delete analysis results (if table exists and has records)
        try:
            db.execute(text("DELETE FROM analysis_results WHERE class_section_id = :section_id"), {"section_id": section_id})
        except Exception as e:
            # Ignore if table doesn't exist or has schema issues
            logger.warning(f"Could not delete analysis_results for section {section_id}: {e}")
        
        # 3. Delete period enrollments (tracks which sections are enrolled in evaluation periods)
        db.execute(text("DELETE FROM period_enrollments WHERE class_section_id = :section_id"), {"section_id": section_id})
        
        # 4. Delete all enrollments
        db.execute(text("DELETE FROM enrollments WHERE class_section_id = :section_id"), {"section_id": section_id})
        
        # 5. Finally delete the section itself
        result = db.execute(text("DELETE FROM class_sections WHERE id = :section_id"), {"section_id": section_id})
        logger.info(f"[DELETE_SECTION] Deleted section {section_id}, rows affected: {result.rowcount}")
        
        db.commit()
        db.expunge_all()  # Clear session to avoid stale object references
        
        logger.info(f"[DELETE_SECTION] Successfully deleted section {section_id} ({class_code})")
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "SECTION_DELETED", "Section Management",
            details={"section_id": section_id, "class_code": class_code}
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
async def get_section_students(
    section_id: int,
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
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
# SYSTEM SETTINGS (REMOVED)
# ===========================

# @router.get("/settings/{category}")
# async def get_system_settings(category: str, db: Session = Depends(get_db)):
#     """Get system settings for a specific category"""
#     pass

# @router.put("/settings")
# async def update_system_settings(
#     settings_data: SystemSettingsUpdate,
#     current_user: dict = Depends(require_admin),
#     db: Session = Depends(get_db)
# ):
#     """Update system settings"""
#     pass

# ===========================
# AUDIT LOGS
# ===========================

@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    action: Optional[str] = None,
    severity: Optional[str] = None,
    current_user: dict = Depends(require_staff),
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
            conditions.append("al.action = :action")
            params["action"] = action
        
        if severity:
            conditions.append("al.severity = :severity")
            params["severity"] = severity
        
        if user_id:
            conditions.append("al.user_id = :user_id")
            params["user_id"] = user_id
        
        if start_date:
            conditions.append("al.created_at >= :start_date")
            params["start_date"] = start_date
        
        if end_date:
            conditions.append("al.created_at <= :end_date")
            params["end_date"] = end_date
        
        where_clause = " AND ".join(conditions)
        
        # Get total count
        count_query = text(f"""
            SELECT COUNT(*) FROM audit_logs al
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
async def get_audit_log_stats(
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
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
    current_user: dict = Depends(require_staff),
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
    role: Optional[str] = Query(None),
    program: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """Export users data with filters"""
    try:
        # Validate inputs
        format = InputValidator.validate_format(format)
        role = InputValidator.validate_role(role)
        program = InputValidator.validate_program_code(program)
        status = InputValidator.validate_status(status)
        user_id = InputValidator.validate_id(user_id, "user_id")
        
        query = db.query(User)
        
        # Apply filters
        if role:
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
                "user_id": u.id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "full_name": f"{u.first_name} {u.last_name}",
                "school_id": u.school_id,
                "role": u.role,
                "department": u.department,
                "is_active": u.is_active,
                "last_login": u.last_login.isoformat() if u.last_login else None,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            
            # Add student-specific data
            if u.role == "student":
                student = db.query(Student).filter(Student.user_id == u.id).first()
                if student:
                    if student.program_id:
                        program_obj = db.query(Program).filter(Program.id == student.program_id).first()
                        if program_obj:
                            user_dict["program_code"] = program_obj.program_code
                            user_dict["program_name"] = program_obj.program_name
                    user_dict["year_level"] = student.year_level
                    user_dict["student_number"] = student.student_number
                else:
                    user_dict["program_code"] = None
                    user_dict["program_name"] = None
                    user_dict["year_level"] = None
                    user_dict["student_number"] = None
            
            # Add secretary/dept head specific data
            elif u.role == "secretary":
                secretary = db.query(Secretary).filter(Secretary.user_id == u.id).first()
                if secretary and secretary.programs:
                    # programs is an ARRAY field containing program IDs
                    programs = db.query(Program).filter(Program.id.in_(secretary.programs)).all()
                    user_dict["assigned_programs"] = ", ".join([p.program_code for p in programs])
                else:
                    user_dict["assigned_programs"] = None
            
            elif u.role == "department_head":
                dept_head = db.query(DepartmentHead).filter(DepartmentHead.user_id == u.id).first()
                if dept_head and dept_head.programs:
                    # programs is an ARRAY field containing program IDs
                    programs = db.query(Program).filter(Program.id.in_(dept_head.programs)).all()
                    user_dict["assigned_programs"] = ", ".join([p.program_code for p in programs])
                else:
                    user_dict["assigned_programs"] = None
            
            users_data.append(user_dict)
        
        # Log export
        filters = {}
        if role: filters['role'] = role
        if program: filters['program'] = program
        if status: filters['status'] = status
        log_export(db, user_id, 'users', format, len(users_data), filters)
        
        return {"success": True, "data": users_data}
        
    except ValidationError as e:
        logger.warning(f"Validation error in export_users: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error exporting users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/evaluations")
async def export_evaluations(
    format: str = Query("csv", regex="^(csv|json)$"),
    program: Optional[str] = Query(None),
    semester: Optional[str] = Query(None),
    academic_year: Optional[str] = Query(None),
    period_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    class_section_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    limit: int = Query(5000, ge=1, le=20000, description="Maximum records to export"),
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """Export evaluations data with comprehensive filters - optimized with efficient joins"""
    try:
        # Validate inputs
        format = InputValidator.validate_format(format)
        program = InputValidator.validate_program_code(program)
        semester = InputValidator.validate_semester(semester)
        academic_year = InputValidator.validate_academic_year(academic_year)
        class_section_id = InputValidator.validate_id(class_section_id, "class_section_id")
        user_id = InputValidator.validate_id(user_id, "user_id")
        
        # Validate date range
        start_dt, end_dt = InputValidator.validate_date_range(start_date, end_date)
        
        # Build WHERE conditions
        conditions = ["e.status = 'completed'"]
        params = {"limit": limit}
        
        # Date range filtering
        if start_dt:
            conditions.append("e.submission_date >= :start_date")
            params["start_date"] = start_dt
        
        if end_dt:
            conditions.append("e.submission_date <= :end_date")
            params["end_date"] = end_dt
        
        # Filter by specific class section
        if class_section_id:
            conditions.append("e.class_section_id = :class_section_id")
            params["class_section_id"] = class_section_id
        
        # Filter by program
        if program:
            conditions.append("p.program_code = :program")
            params["program"] = program
        
        # Filter by semester
        if semester:
            conditions.append("cs.semester = :semester")
            params["semester"] = semester
        
        # Filter by academic year
        if academic_year:
            conditions.append("cs.academic_year = :academic_year")
            params["academic_year"] = academic_year
        
        # Filter by evaluation period
        if period_id:
            conditions.append("enr.evaluation_period_id = :period_id")
            params["period_id"] = period_id
        
        where_clause = " AND ".join(conditions)
        
        # Use efficient SQL query with all necessary JOINs to avoid N+1 problem
        query = text(f"""
            SELECT 
                e.id as evaluation_id,
                e.submission_date,
                u.school_id as student_id,
                u.first_name || ' ' || u.last_name as student_name,
                u.email as student_email,
                p.program_code as student_program,
                p.program_name as student_program_name,
                s.year_level as student_year_level,
                c.subject_code as course_code,
                c.subject_name as course_name,
                cs.class_code,
                cs.semester,
                cs.academic_year,
                e.rating_teaching,
                e.rating_content,
                e.rating_engagement,
                e.rating_overall,
                e.sentiment_label,
                e.sentiment_score,
                e.anomaly_score,
                e.is_anomaly
            FROM evaluations e
            INNER JOIN users u ON e.student_id = u.id
            LEFT JOIN students s ON s.user_id = u.id
            LEFT JOIN programs p ON s.program_id = p.id
            INNER JOIN class_sections cs ON e.class_section_id = cs.id
            LEFT JOIN courses c ON cs.course_id = c.id
            LEFT JOIN enrollments enr ON enr.student_id = e.student_id 
                AND enr.class_section_id = e.class_section_id
            WHERE {where_clause}
            ORDER BY e.submission_date DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, params)
        
        eval_data = []
        for row in result:
            eval_data.append({
                "evaluation_id": row[0],
                "submission_date": row[1].isoformat() if row[1] else None,
                # Student info
                "student_id": row[2],
                "student_name": row[3],
                "student_email": row[4],
                "student_program": row[5],
                "student_program_name": row[6],
                "student_year_level": row[7],
                # Course info
                "course_code": row[8],
                "course_name": row[9],
                "class_code": row[10],
                "semester": row[11],
                "academic_year": row[12],
                # Aggregated ratings
                "rating_teaching": row[13],
                "rating_content": row[14],
                "rating_engagement": row[15],
                "rating_overall": row[16],
                # ML analysis
                "sentiment_label": row[17],
                "sentiment_score": float(row[18]) if row[18] else None,
                "anomaly_score": float(row[19]) if row[19] else None,
                "is_anomaly": row[20]
            })
        
        # Log this export
        filters = {}
        if program: filters['program'] = program
        if semester: filters['semester'] = semester
        if academic_year: filters['academic_year'] = academic_year
        if period_id: filters['period_id'] = period_id
        if start_date: filters['start_date'] = start_date
        if end_date: filters['end_date'] = end_date
        if class_section_id: filters['class_section_id'] = class_section_id
        log_export(db, user_id, 'evaluations', format, len(eval_data), filters)
        
        logger.info(f"[EXPORT] Exported {len(eval_data)} evaluation records (limit: {limit})")
        return {"success": True, "data": eval_data, "count": len(eval_data), "limit_reached": len(eval_data) >= limit}
        
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
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """Export courses data with filters"""
    try:
        # Validate inputs
        format = InputValidator.validate_format(format)
        program = InputValidator.validate_program_code(program)
        status = InputValidator.validate_status(status)
        year_level = InputValidator.validate_year_level(year_level)
        user_id = InputValidator.validate_id(user_id, "user_id")
        
        query = db.query(Course)
        
        # Apply filters
        if program:
            program_obj = db.query(Program).filter(Program.program_code == program).first()
            if program_obj:
                query = query.filter(Course.program_id == program_obj.id)
        
        if status:
            is_active = status.lower() == 'active'
            query = query.filter(Course.is_active == is_active)
        
        if year_level:
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
        
    except ValidationError as e:
        logger.warning(f"Validation error in export_courses: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error exporting courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/analytics")
async def export_analytics(
    format: str = Query("json", regex="^(csv|json)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: Optional[int] = Query(None),
    current_user: dict = Depends(require_staff),
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
    limit: int = Query(10000, ge=1, le=50000, description="Maximum records to export"),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Export audit logs with filters - optimized with LIMIT and efficient joins"""
    try:
        # Build WHERE conditions
        conditions = ["1=1"]
        params = {"limit": limit}
        
        if action and action != 'all':
            conditions.append("al.action = :action")
            params["action"] = action
        
        if category and category != 'all':
            conditions.append("al.category = :category")
            params["category"] = category
        
        if severity and severity != 'all':
            conditions.append("al.severity = :severity")
            params["severity"] = severity
        
        if user and user != 'all':
            conditions.append("al.user_id = :user_id")
            params["user_id"] = int(user)
        
        # Date range filtering
        if start_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                conditions.append("al.created_at >= :start_date")
                params["start_date"] = start
            except:
                pass
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                conditions.append("al.created_at <= :end_date")
                params["end_date"] = end
            except:
                pass
        
        where_clause = " AND ".join(conditions)
        
        # Use efficient SQL query with JOIN to avoid N+1 problem
        query = text(f"""
            SELECT 
                al.id,
                al.user_id,
                COALESCE(u.email, 'System') as user_email,
                COALESCE(u.first_name || ' ' || u.last_name, 'System') as user_name,
                al.action,
                al.category,
                al.details,
                al.severity,
                al.ip_address,
                al.created_at
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE {where_clause}
            ORDER BY al.created_at DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, params)
        
        logs_data = []
        for row in result:
            logs_data.append({
                "id": row[0],
                "user_id": row[1],
                "user_email": row[2],
                "user_name": row[3],
                "action": row[4],
                "category": row[5],
                "details": row[6] if isinstance(row[6], dict) else {},
                "severity": row[7],
                "ip_address": row[8],
                "timestamp": row[9].isoformat() if row[9] else None
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
        
        logger.info(f"[EXPORT] Exported {len(logs_data)} audit log records (limit: {limit})")
        return {"success": True, "data": logs_data, "count": len(logs_data), "limit_reached": len(logs_data) >= limit}
        
    except Exception as e:
        logger.error(f"Error exporting audit logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export/custom")
async def export_custom(
    export_params: dict = Body(...),
    user_id: Optional[int] = Query(None),
    current_user: dict = Depends(require_staff),
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
async def get_dashboard_stats(
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
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
    current_user: dict = Depends(require_admin),
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
async def get_email_config_status(current_user: dict = Depends(require_admin)):
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_staff),
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
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
    current_user: dict = Depends(require_admin),
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


@router.get("/non-respondents")
async def get_non_respondents(
    evaluation_period_id: Optional[int] = Query(None),
    program_id: Optional[int] = Query(None),
    year_level: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Get list of students who haven't completed evaluations for active period
    Admin can see all non-respondents across all programs
    """
    try:
        # Get active period if not specified
        if not evaluation_period_id:
            active_period = db.query(EvaluationPeriod).filter(
                EvaluationPeriod.status == 'active'
            ).first()
            
            if not active_period:
                return {
                    "total_students": 0,
                    "responded": 0,
                    "non_responded": 0,
                    "response_rate": "0%",
                    "non_respondents": []
                }
            
            evaluation_period_id = active_period.id
        
        # Build query for non-respondents
        query = text("""
            WITH enrolled_students AS (
                SELECT DISTINCT
                    s.id as student_id,
                    s.student_number,
                    u.first_name,
                    u.last_name,
                    s.year_level,
                    p.program_code,
                    ps.section_name,
                    ps.id as program_section_id,
                    COUNT(DISTINCT e.class_section_id) as total_courses
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN program_sections ps ON s.section_id = ps.id
                LEFT JOIN programs p ON ps.program_id = p.id
                JOIN enrollments e ON s.id = e.student_id
                WHERE u.is_active = true
                    AND (:program_id IS NULL OR ps.program_id = :program_id)
                    AND (:year_level IS NULL OR s.year_level = :year_level)
                GROUP BY s.id, s.student_number, u.first_name, u.last_name, 
                         s.year_level, p.program_code, ps.section_name, ps.id
            ),
            completed_evaluations AS (
                SELECT 
                    e.student_id,
                    COUNT(DISTINCT e.class_section_id) as completed_courses
                FROM evaluations e
                WHERE e.evaluation_period_id = :period_id
                GROUP BY e.student_id
            )
            SELECT 
                es.student_id,
                es.student_number,
                es.first_name,
                es.last_name,
                es.year_level,
                es.program_code,
                es.section_name,
                es.total_courses,
                COALESCE(ce.completed_courses, 0) as completed_courses,
                (es.total_courses - COALESCE(ce.completed_courses, 0)) as pending_count
            FROM enrolled_students es
            LEFT JOIN completed_evaluations ce ON es.student_id = ce.student_id
            WHERE (es.total_courses - COALESCE(ce.completed_courses, 0)) > 0
            ORDER BY pending_count DESC, es.student_number ASC
        """)
        
        result = db.execute(query, {
            "period_id": evaluation_period_id,
            "program_id": program_id,
            "year_level": year_level
        }).fetchall()
        
        # Get pending courses for each non-respondent
        non_respondents = []
        for row in result:
            # Get list of courses they haven't evaluated
            courses_query = text("""
                SELECT DISTINCT
                    c.subject_code,
                    c.subject_name,
                    cs.id as section_id,
                    cs.class_code
                FROM enrollments e
                JOIN class_sections cs ON e.class_section_id = cs.id
                JOIN courses c ON cs.course_id = c.id
                WHERE e.student_id = :student_id
                    AND NOT EXISTS (
                        SELECT 1 FROM evaluations ev
                        WHERE ev.student_id = :student_id
                            AND ev.class_section_id = cs.id
                            AND ev.evaluation_period_id = :period_id
                    )
                ORDER BY c.subject_code
            """)
            
            courses = db.execute(courses_query, {
                "student_id": row.student_id,
                "period_id": evaluation_period_id
            }).fetchall()
            
            non_respondents.append({
                "student_id": row.student_id,
                "student_number": row.student_number,
                "full_name": f"{row.first_name} {row.last_name}",
                "program": row.program_code or "N/A",
                "section": row.section_name or "N/A",
                "year_level": row.year_level,
                "pending_courses": [
                    {
                        "course_code": c.subject_code,
                        "course_name": c.subject_name,
                        "section_id": c.section_id,
                        "class_code": c.class_code
                    }
                    for c in courses
                ],
                "pending_count": row.pending_count,
                "completed_count": row.completed_courses,
                "total_courses": row.total_courses
            })
        
        # Calculate statistics
        total_query = text("""
            SELECT COUNT(DISTINCT s.id) as total
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN program_sections ps ON s.section_id = ps.id
            JOIN enrollments e ON s.id = e.student_id
            WHERE u.is_active = true
                AND (:program_id IS NULL OR ps.program_id = :program_id)
                AND (:year_level IS NULL OR s.year_level = :year_level)
        """)
        
        total_students = db.execute(total_query, {
            "program_id": program_id,
            "year_level": year_level
        }).scalar() or 0
        
        non_responded = len(non_respondents)
        responded = total_students - non_responded
        response_rate = f"{(responded / total_students * 100):.1f}%" if total_students > 0 else "0%"
        
        return {
            "total_students": total_students,
            "responded": responded,
            "non_responded": non_responded,
            "response_rate": response_rate,
            "non_respondents": non_respondents
        }
        
    except Exception as e:
        logger.error(f"Error fetching non-respondents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch non-respondents: {str(e)}")

