"""
Secretary Routes for Course Feedback System
Handles secretary operations including:
- Manage courses (view, create, update)
- Assign instructors to courses
- View department data
- Generate reports
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from database.connection import get_db
from models.enhanced_models import (
    User, Secretary, Course, ClassSection, Program, Evaluation
)
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ===========================
# Pydantic Models
# ===========================

class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    program_id: int
    year_level: int
    semester: int
    units: int = 3

class ClassSectionCreate(BaseModel):
    course_id: int
    class_code: str
    instructor_name: str
    instructor_id: Optional[int] = None
    schedule: Optional[str] = None
    room: Optional[str] = None
    max_students: int = 40
    semester: str
    academic_year: str

# ===========================
# DASHBOARD
# ===========================

@router.get("/dashboard")
async def get_secretary_dashboard(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get secretary dashboard overview"""
    try:
        # Get secretary info
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        program_ids = secretary.programs or []
        
        # Get statistics
        total_courses = db.query(func.count(Course.id)).filter(
            Course.program_id.in_(program_ids)
        ).scalar() or 0
        
        total_sections = db.query(func.count(ClassSection.id)).join(
            Course, ClassSection.course_id == Course.id
        ).filter(
            Course.program_id.in_(program_ids)
        ).scalar() or 0
        
        total_evaluations = db.query(func.count(Evaluation.id)).join(
            ClassSection, Evaluation.class_section_id == ClassSection.id
        ).join(
            Course, ClassSection.course_id == Course.id
        ).filter(
            Course.program_id.in_(program_ids)
        ).scalar() or 0
        
        return {
            "success": True,
            "data": {
                "department": secretary.department,
                "total_courses": total_courses,
                "total_sections": total_sections,
                "total_evaluations": total_evaluations
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching secretary dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# COURSE MANAGEMENT
# ===========================

@router.get("/courses")
async def get_courses(
    user_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get courses managed by secretary"""
    try:
        # Get secretary info
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            # Return empty instead of 404 to prevent frontend crashes
            return {
                "success": True,
                "data": [],
                "pagination": {"page": page, "page_size": page_size, "total": 0, "pages": 0}
            }
        
        program_ids = secretary.programs or []
        
        # Return empty if no programs
        if not program_ids:
            return {
                "success": True,
                "data": [],
                "pagination": {"page": page, "page_size": page_size, "total": 0, "pages": 0}
            }
        
        # Build query
        query = db.query(Course).filter(Course.program_id.in_(program_ids))
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Course.subject_code.ilike(search_filter),
                    Course.subject_name.ilike(search_filter)
                )
            )
        
        if program_id:
            query = query.filter(Course.program_id == program_id)
        
        total = query.count()
        offset = (page - 1) * page_size
        courses = query.offset(offset).limit(page_size).all()
        
        # Return empty if no courses
        if not courses:
            return {
                "success": True,
                "data": [],
                "pagination": {"page": page, "page_size": page_size, "total": 0, "pages": 0}
            }
        
        courses_data = []
        for course in courses:
            # Get number of sections
            sections_count = db.query(func.count(ClassSection.id)).filter(
                ClassSection.course_id == course.id
            ).scalar() or 0
            
            courses_data.append({
                "id": course.id,
                "course_code": course.subject_code,  # Fixed: was course.course_code
                "course_name": course.subject_name,  # Fixed: was course.course_name
                "program_id": course.program_id,
                "year_level": course.year_level,
                "semester": course.semester,
                "units": 3,  # Fixed: removed from model, default to 3
                "sections_count": sections_count
            })
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/courses")
async def create_course(
    course_data: CourseCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new course"""
    try:
        # Verify secretary has access to this program
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        program_ids = secretary.programs or []
        if course_data.program_id not in program_ids:
            raise HTTPException(status_code=403, detail="Access denied to this program")
        
        # Check if course code already exists
        existing = db.query(Course).filter(Course.subject_code == course_data.course_code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Course code already exists")
        
        # Create course
        new_course = Course(
            subject_code=course_data.course_code,  # Fixed: was course_code
            subject_name=course_data.course_name,  # Fixed: was course_name
            program_id=course_data.program_id,
            year_level=course_data.year_level,
            semester=course_data.semester
            # Note: units field removed from model
        )
        db.add(new_course)
        db.commit()
        
        return {
            "success": True,
            "message": "Course created successfully",
            "course_id": new_course.id
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
    course_data: CourseCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update an existing course"""
    try:
        # Verify secretary has access
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        program_ids = secretary.programs or []
        if course.program_id not in program_ids:
            raise HTTPException(status_code=403, detail="Access denied to this course")
        
        # Update course
        course.subject_code = course_data.course_code  # Fixed: was course_code
        course.subject_name = course_data.course_name  # Fixed: was course_name
        course.program_id = course_data.program_id
        course.year_level = course_data.year_level
        course.semester = course_data.semester
        # Note: units field removed from model
        db.commit()
        
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
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Delete a course"""
    try:
        # Verify secretary has access
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        program_ids = secretary.programs or []
        if course.program_id not in program_ids:
            raise HTTPException(status_code=403, detail="Access denied to this course")
        
        # Check if course has sections
        sections_count = db.query(func.count(ClassSection.id)).filter(
            ClassSection.course_id == course_id
        ).scalar()
        
        if sections_count > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete course with existing sections"
            )
        
        db.delete(course)
        db.commit()
        
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

# ===========================
# CLASS SECTION MANAGEMENT
# ===========================

@router.get("/courses/{course_id}/sections")
async def get_course_sections(
    course_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get all sections for a course"""
    try:
        # Verify access
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        program_ids = secretary.programs or []
        if course.program_id not in program_ids:
            raise HTTPException(status_code=403, detail="Access denied to this course")
        
        # Get sections
        sections = db.query(ClassSection).filter(ClassSection.course_id == course_id).all()
        
        sections_data = []
        for section in sections:
            # Get enrollment count
            enrollments = db.query(func.count(Evaluation.id)).filter(
                Evaluation.class_section_id == section.id
            ).scalar() or 0
            
            sections_data.append({
                "id": section.id,
                "class_code": section.class_code,
                "instructor_name": section.instructor_name,
                "instructor_id": section.instructor_id,
                "schedule": section.schedule,
                "room": section.room,
                "max_students": section.max_students,
                "current_enrollments": enrollments,
                "semester": section.semester,
                "academic_year": section.academic_year
            })
        
        return {
            "success": True,
            "data": sections_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching course sections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sections")
async def create_class_section(
    section_data: ClassSectionCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new class section"""
    try:
        # Verify secretary has access to this course
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        course = db.query(Course).filter(Course.id == section_data.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        program_ids = secretary.programs or []
        if course.program_id not in program_ids:
            raise HTTPException(status_code=403, detail="Access denied to this course")
        
        # Check if class code already exists
        existing = db.query(ClassSection).filter(
            ClassSection.class_code == section_data.class_code
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Class code already exists")
        
        # Create section
        new_section = ClassSection(
            course_id=section_data.course_id,
            class_code=section_data.class_code,
            instructor_name=section_data.instructor_name,
            instructor_id=section_data.instructor_id,
            schedule=section_data.schedule,
            room=section_data.room,
            max_students=section_data.max_students,
            semester=section_data.semester,
            academic_year=section_data.academic_year
        )
        db.add(new_section)
        db.commit()
        
        return {
            "success": True,
            "message": "Class section created successfully",
            "section_id": new_section.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating class section: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/sections/{section_id}/assign-instructor")
async def assign_instructor(
    section_id: int,
    instructor_name: str = Body(...),
    instructor_id: Optional[int] = Body(None),
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Assign instructor to a class section"""
    try:
        section = db.query(ClassSection).filter(ClassSection.id == section_id).first()
        if not section:
            raise HTTPException(status_code=404, detail="Class section not found")
        
        # Update instructor
        section.instructor_name = instructor_name
        section.instructor_id = instructor_id
        db.commit()
        
        return {
            "success": True,
            "message": "Instructor assigned successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning instructor: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# PROGRAMS
# ===========================

@router.get("/programs")
async def get_programs(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get programs managed by secretary"""
    try:
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        program_ids = secretary.programs or []
        programs = db.query(Program).filter(Program.id.in_(program_ids)).all()
        
        programs_data = [{
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "duration_years": p.duration_years
        } for p in programs]
        
        return {
            "success": True,
            "data": programs_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching programs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# REPORTS
# ===========================

@router.get("/reports/evaluations-summary")
async def get_evaluations_summary(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get summary of evaluations for secretary's programs"""
    try:
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        program_ids = secretary.programs or []
        
        # Get evaluation statistics
        total_evaluations = db.query(func.count(Evaluation.id)).join(
            ClassSection, Evaluation.class_section_id == ClassSection.id
        ).join(
            Course, ClassSection.course_id == Course.id
        ).filter(
            Course.program_id.in_(program_ids)
        ).scalar() or 0
        
        avg_rating = db.query(func.avg(Evaluation.rating_overall)).join(
            ClassSection, Evaluation.class_section_id == ClassSection.id
        ).join(
            Course, ClassSection.course_id == Course.id
        ).filter(
            Course.program_id.in_(program_ids)
        ).scalar() or 0.0
        
        # Get by program
        program_stats = []
        for pid in program_ids:
            program = db.query(Program).filter(Program.id == pid).first()
            if program:
                count = db.query(func.count(Evaluation.id)).join(
                    ClassSection, Evaluation.class_section_id == ClassSection.id
                ).join(
                    Course, ClassSection.course_id == Course.id
                ).filter(
                    Course.program_id == pid
                ).scalar() or 0
                
                program_stats.append({
                    "program_code": program.program_code,  # Fixed: was program.code
                    "program_name": program.program_name,  # Fixed: was program.name
                    "evaluations_count": count
                })
        
        return {
            "success": True,
            "data": {
                "total_evaluations": total_evaluations,
                "average_rating": round(avg_rating, 2),
                "by_program": program_stats
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching evaluations summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluations")
async def get_secretary_evaluations(
    user_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    course_id: Optional[int] = None,
    sentiment: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get evaluations for secretary's programs"""
    try:
        # Get secretary info
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        program_ids = secretary.programs or []
        if not program_ids:
            # No programs assigned, return empty result
            return {
                "success": True,
                "data": [],
                "pagination": {"page": page, "page_size": page_size, "total": 0, "pages": 0}
            }
        
        # Build query for evaluations
        query = db.query(Evaluation).join(
            ClassSection, Evaluation.class_section_id == ClassSection.id
        ).join(
            Course, ClassSection.course_id == Course.id
        ).filter(
            Course.program_id.in_(program_ids)
        )
        
        # Apply filters
        if course_id:
            query = query.filter(Course.id == course_id)
        if sentiment:
            query = query.filter(Evaluation.sentiment == sentiment)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        evaluations = query.order_by(Evaluation.created_at.desc()).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        # Format response
        result = []
        for evaluation in evaluations:
            class_section = evaluation.class_section
            course = class_section.course if class_section else None
            
            result.append({
                "id": evaluation.id,
                "course_name": course.course_name if course else "Unknown",
                "course_code": course.course_code if course else "Unknown",
                "class_code": class_section.class_code if class_section else "Unknown",
                "instructor_name": class_section.instructor_name if class_section else "Unknown",
                "student_id": evaluation.student_id,
                "rating": evaluation.average_rating,
                "sentiment": evaluation.sentiment,
                "created_at": evaluation.created_at.isoformat() if evaluation.created_at else None,
                "comment": evaluation.comment
            })
        
        return {
            "success": True,
            "data": result,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "pages": (total + page_size - 1) // page_size
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching evaluations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

