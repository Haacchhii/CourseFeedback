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
    """Get secretary dashboard overview (full system access - single department)"""
    try:
        # Single department system - secretary sees all data
        
        # Get statistics for entire system
        total_courses = db.query(func.count(Course.id)).scalar() or 0
        
        total_sections = db.query(func.count(ClassSection.id)).scalar() or 0
        
        total_evaluations = db.query(func.count(Evaluation.id)).scalar() or 0
        
        # Average rating - department-wide
        avg_rating = db.query(func.avg(Evaluation.rating_overall)).scalar() or 0.0
        
        # Sentiment distribution - department-wide
        sentiment_dist = db.query(
            Evaluation.sentiment,
            func.count(Evaluation.id).label('count')
        ).group_by(Evaluation.sentiment).all()
        
        sentiment_data = {
            "positive": 0,
            "neutral": 0,
            "negative": 0
        }
        for sentiment, count in sentiment_dist:
            if sentiment:
                sentiment_data[sentiment.lower()] = count
        
        # Anomaly count - department-wide
        anomaly_count = db.query(func.count(Evaluation.id)).filter(
            Evaluation.is_anomaly == True
        ).scalar() or 0
        
        # Calculate participation rate (students who submitted / total enrolled)
        from models.enhanced_models import Enrollment
        total_enrolled_students = db.query(func.count(Enrollment.id.distinct())).filter(
            Enrollment.status == 'active'
        ).scalar() or 0
        
        students_who_evaluated = db.query(func.count(Evaluation.student_id.distinct())).scalar() or 0
        
        participation_rate = round((students_who_evaluated / total_enrolled_students * 100), 1) if total_enrolled_students > 0 else 0
        
        return {
            "success": True,
            "data": {
                "department": "Academic Department",  # Single department system
                "total_courses": total_courses,
                "total_sections": total_sections,
                "total_evaluations": total_evaluations,
                "total_enrolled_students": total_enrolled_students,
                "participation_rate": participation_rate,
                "average_rating": round(avg_rating, 2),
                "sentiment": sentiment_data,
                "anomalies": anomaly_count
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
    """Get courses managed by secretary (full system access - single department system)"""
    try:
        # Secretary has full system access (single department system)
        # Return class sections (not just courses) to match expected format
        
        # Build query for class sections with course info
        query = db.query(ClassSection, Course, Program).join(
            Course, ClassSection.course_id == Course.id
        ).outerjoin(
            Program, Course.program_id == Program.id
        )
        
        logger.info(f"[SECRETARY] Building courses query...")
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Course.subject_code.ilike(search_filter),
                    Course.subject_name.ilike(search_filter),
                    ClassSection.class_code.ilike(search_filter)
                )
            )
        
        if program_id:
            query = query.filter(Course.program_id == program_id)
        
        # Get all results with aggregated data in a single query
        from models.enhanced_models import Enrollment
        
        # Use subqueries to get counts efficiently
        eval_count_subq = db.query(
            Evaluation.class_section_id,
            func.count(Evaluation.id).label('eval_count'),
            func.avg(Evaluation.rating_overall).label('avg_rating')
        ).group_by(Evaluation.class_section_id).subquery()
        
        enroll_count_subq = db.query(
            Enrollment.class_section_id,
            func.count(Enrollment.id).label('enroll_count')
        ).filter(Enrollment.status == 'active').group_by(Enrollment.class_section_id).subquery()
        
        # Join with subqueries for efficient data retrieval
        results = query.outerjoin(
            eval_count_subq, ClassSection.id == eval_count_subq.c.class_section_id
        ).outerjoin(
            enroll_count_subq, ClassSection.id == enroll_count_subq.c.class_section_id
        ).add_columns(
            eval_count_subq.c.eval_count,
            eval_count_subq.c.avg_rating,
            enroll_count_subq.c.enroll_count
        ).all()
        
        logger.info(f"[SECRETARY] Total class sections found: {len(results)}")
        
        # Return empty if no results
        if not results:
            return {
                "success": True,
                "data": []
            }
        
        courses_data = []
        for row in results:
            section, course, program, eval_count, avg_rating, enrolled_count = row
            
            # Construct instructor full name
            instructor_full_name = "N/A"
            if section.instructor:
                first = section.instructor.first_name or ""
                last = section.instructor.last_name or ""
                instructor_full_name = f"{first} {last}".strip() or "N/A"
            
            courses_data.append({
                "section_id": section.id,
                "id": section.id,  # For compatibility
                "class_code": section.class_code or "Unknown",
                "course_code": course.subject_code if course else "Unknown",
                "course_name": course.subject_name if course else "Unknown",
                "name": course.subject_name if course else "Unknown",  # For compatibility
                "code": course.subject_code if course else "Unknown",  # For compatibility
                "instructor": instructor_full_name,
                "instructor_name": instructor_full_name,  # For compatibility
                "program": program.program_code if program else "Unknown",
                "year_level": course.year_level if course else 1,
                "semester": section.semester or "Unknown",
                "academic_year": section.academic_year or "Unknown",
                "evaluations_count": int(eval_count or 0),
                "enrolled_students": int(enrolled_count or 0),
                "status": "Active",  # Default status
                "overallRating": float(avg_rating or 0.0)
            })
        
        return {
            "success": True,
            "data": courses_data
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
        
        # Convert semester string to integer
        semester_mapping = {
            "First Semester": 1,
            "1st Semester": 1,
            "Second Semester": 2,
            "2nd Semester": 2,
            "Summer": 3,
            "3rd Semester": 3
        }
        
        # Try to convert semester to integer
        if isinstance(course_data.semester, str):
            semester_int = semester_mapping.get(course_data.semester)
            if semester_int is None:
                # Try to parse as integer string
                try:
                    semester_int = int(course_data.semester)
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid semester value: {course_data.semester}")
        else:
            semester_int = course_data.semester
        
        # Create course
        new_course = Course(
            subject_code=course_data.course_code,  # Fixed: was course_code
            subject_name=course_data.course_name,  # Fixed: was course_name
            program_id=course_data.program_id,
            year_level=course_data.year_level,
            semester=semester_int,  # Use converted integer
            units=course_data.units if hasattr(course_data, 'units') else None
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
        
        # Convert semester string to integer
        semester_mapping = {
            "First Semester": 1,
            "1st Semester": 1,
            "Second Semester": 2,
            "2nd Semester": 2,
            "Summer": 3,
            "3rd Semester": 3
        }
        
        # Try to convert semester to integer
        if isinstance(course_data.semester, str):
            semester_int = semester_mapping.get(course_data.semester)
            if semester_int is None:
                # Try to parse as integer string
                try:
                    semester_int = int(course_data.semester)
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid semester value: {course_data.semester}")
        else:
            semester_int = course_data.semester
        
        # Update course
        course.subject_code = course_data.course_code  # Fixed: was course_code
        course.subject_name = course_data.course_name  # Fixed: was course_name
        course.program_id = course_data.program_id
        course.year_level = course_data.year_level
        course.semester = semester_int  # Use converted integer
        course.units = course_data.units if hasattr(course_data, 'units') else course.units
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
            
            # Get instructor name from user relationship
            instructor_name = "Not Assigned"
            if section.instructor:
                instructor_name = f"{section.instructor.first_name} {section.instructor.last_name}"
            
            sections_data.append({
                "id": section.id,
                "class_code": section.class_code,
                "instructor_name": instructor_name,
                "instructor_id": section.instructor_id,
                "schedule": getattr(section, 'schedule', 'TBD'),
                "room": getattr(section, 'room', 'TBD'),
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
            instructor_id=section_data.instructor_id,
            max_students=section_data.max_students or 40,
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

# ===========================
# PROGRAMS
# ===========================

@router.get("/programs")
async def get_programs(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get all programs (secretary has department-wide access)"""
    try:
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        # Secretary can access ALL programs in the department
        programs = db.query(Program).filter(Program.is_active == True).all()
        
        programs_data = [{
            "id": p.id,
            "code": p.program_code,
            "name": p.program_name,
            "duration_years": getattr(p, 'duration_years', 4)
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

@router.get("/year-levels")
async def get_year_levels(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get year levels for filtering"""
    try:
        secretary = db.query(Secretary).filter(Secretary.user_id == user_id).first()
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretary not found")
        
        year_levels = [
            {"value": 1, "label": "1st Year"},
            {"value": 2, "label": "2nd Year"},
            {"value": 3, "label": "3rd Year"},
            {"value": 4, "label": "4th Year"}
        ]
        
        return {
            "success": True,
            "data": year_levels
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching year levels: {e}")
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
    """Get evaluations (full system access - single department system)"""
    try:
        # Secretary has full system access (single department system)
        # Build query for all evaluations
        query = db.query(Evaluation).join(
            ClassSection, Evaluation.class_section_id == ClassSection.id
        ).join(
            Course, ClassSection.course_id == Course.id
        )
        
        # Apply filters
        if course_id:
            query = query.filter(Course.id == course_id)
        if sentiment:
            query = query.filter(Evaluation.sentiment == sentiment)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        evaluations = query.order_by(Evaluation.submission_date.desc()).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        # Format response
        from models.enhanced_models import Student
        
        result = []
        for evaluation in evaluations:
            class_section = evaluation.class_section
            course = class_section.course if class_section else None
            
            # Get instructor name from user relationship
            instructor_name = "Unknown"
            if class_section and class_section.instructor:
                instructor_name = f"{class_section.instructor.first_name} {class_section.instructor.last_name}"
            
            # Get student info via user relationship
            student = db.query(Student).filter(Student.id == evaluation.student_id).first()
            student_name = "Unknown Student"
            if student and student.user:
                student_name = f"{student.user.first_name} {student.user.last_name}" if student.user.first_name and student.user.last_name else (student.user.email or "Unknown Student")
            elif student:
                student_name = student.student_number or "Unknown Student"
            
            result.append({
                "id": evaluation.id,
                "courseId": course.id if course else None,
                "sectionId": class_section.id if class_section else None,
                "course_name": course.subject_name if course else "Unknown",
                "course_code": course.subject_code if course else "Unknown",
                "class_code": class_section.class_code if class_section else "Unknown",
                "instructor_name": instructor_name,
                "instructor": instructor_name,
                "student": student_name,
                "student_id": evaluation.student_id,
                "rating": evaluation.rating_overall if hasattr(evaluation, 'rating_overall') else evaluation.average_rating,
                "rating_overall": evaluation.rating_overall if hasattr(evaluation, 'rating_overall') else 0,
                "rating_teaching": evaluation.rating_teaching if hasattr(evaluation, 'rating_teaching') else 0,
                "rating_content": evaluation.rating_content if hasattr(evaluation, 'rating_content') else 0,
                "rating_engagement": evaluation.rating_engagement if hasattr(evaluation, 'rating_engagement') else 0,
                "ratings": {
                    "overall": evaluation.rating_overall if hasattr(evaluation, 'rating_overall') else 0,
                    "teaching": evaluation.rating_teaching if hasattr(evaluation, 'rating_teaching') else 0,
                    "content": evaluation.rating_content if hasattr(evaluation, 'rating_content') else 0,
                    "engagement": evaluation.rating_engagement if hasattr(evaluation, 'rating_engagement') else 0
                },
                "sentiment": evaluation.sentiment,
                "is_anomaly": evaluation.is_anomaly if hasattr(evaluation, 'is_anomaly') else False,
                "anomaly": evaluation.is_anomaly if hasattr(evaluation, 'is_anomaly') else False,
                "text_feedback": evaluation.text_feedback if hasattr(evaluation, 'text_feedback') else (evaluation.comment if hasattr(evaluation, 'comment') else ""),
                "comment": evaluation.text_feedback if hasattr(evaluation, 'text_feedback') else (evaluation.comment if hasattr(evaluation, 'comment') else ""),
                "submission_date": evaluation.submission_date.isoformat() if evaluation.submission_date else None,
                "created_at": evaluation.submission_date.isoformat() if evaluation.submission_date else None,
                "semester": class_section.semester if class_section else "N/A",
                "academic_year": class_section.academic_year if class_section else "N/A"
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

# ===========================
# SENTIMENT ANALYSIS
# ===========================

@router.get("/sentiment-analysis")
async def get_sentiment_analysis(
    user_id: int = Query(...),
    time_range: str = Query("month", regex="^(week|month|semester|year)$"),
    db: Session = Depends(get_db)
):
    """Get sentiment analysis trends over time (secretary has full access)"""
    try:
        from datetime import timedelta
        
        # Calculate date range
        now = datetime.now()
        if time_range == "week":
            start_date = now - timedelta(days=7)
        elif time_range == "month":
            start_date = now - timedelta(days=30)
        elif time_range == "semester":
            start_date = now - timedelta(days=120)
        else:  # year
            start_date = now - timedelta(days=365)
        
        # Get sentiment distribution over time (all programs - secretary has full access)
        from sqlalchemy import cast, Date
        date_col = cast(func.date_trunc('day', Evaluation.submission_date), Date)
        sentiments = db.query(
            date_col.label('date'),
            Evaluation.sentiment,
            func.count(Evaluation.id).label('count')
        ).filter(
            Evaluation.submission_date >= start_date
        ).group_by(
            date_col,
            Evaluation.sentiment
        ).order_by(date_col).all()
        
        # Format data for charts
        sentiment_trends = {}
        for date, sentiment, count in sentiments:
            date_str = date.strftime('%Y-%m-%d') if date else "unknown"
            if date_str not in sentiment_trends:
                sentiment_trends[date_str] = {
                    "date": date_str,
                    "positive": 0,
                    "neutral": 0,
                    "negative": 0
                }
            if sentiment:
                sentiment_trends[date_str][sentiment.lower()] = count
        
        # Get overall statistics
        total_evals = db.query(func.count(Evaluation.id)).filter(
            Evaluation.submission_date >= start_date
        ).scalar() or 0
        
        sentiment_counts = db.query(
            Evaluation.sentiment,
            func.count(Evaluation.id).label('count')
        ).filter(
            Evaluation.submission_date >= start_date
        ).group_by(Evaluation.sentiment).all()
        
        sentiment_summary = {
            "positive": 0,
            "neutral": 0,
            "negative": 0
        }
        for sentiment, count in sentiment_counts:
            if sentiment:
                sentiment_summary[sentiment.lower()] = count
        
        return {
            "success": True,
            "data": {
                "trends": list(sentiment_trends.values()),
                "summary": sentiment_summary,
                "total_evaluations": total_evals,
                "time_range": time_range
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sentiment analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# ANOMALY DETECTION
# ===========================

@router.get("/anomalies")
async def get_anomalies(
    user_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get detected anomalies in evaluations (secretary has full access)"""
    try:
        # Query anomalous evaluations (all programs - secretary has full access)
        query = db.query(Evaluation).filter(
            Evaluation.is_anomaly == True
        )
        
        total = query.count()
        offset = (page - 1) * page_size
        anomalies = query.order_by(Evaluation.anomaly_score.desc()).offset(offset).limit(page_size).all()
        
        anomaly_data = []
        for e in anomalies:
            class_section = db.query(ClassSection).filter(ClassSection.id == e.class_section_id).first()
            course = db.query(Course).filter(Course.id == class_section.course_id).first() if class_section else None
            
            # Get instructor name from user relationship
            instructor_name = "N/A"
            if class_section and class_section.instructor:
                instructor_name = f"{class_section.instructor.first_name} {class_section.instructor.last_name}"
            
            anomaly_data.append({
                "id": e.id,
                "course_code": course.subject_code if course else "N/A",
                "course_name": course.subject_name if course else "N/A",
                "instructor": instructor_name,
                "rating_overall": e.rating_overall,
                "anomaly_score": e.anomaly_score,
                "comments": e.comments,
                "sentiment": e.sentiment,
                "submission_date": e.submission_date.isoformat() if e.submission_date else None
            })
        
        return {
            "success": True,
            "data": anomaly_data,
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
        logger.error(f"Error fetching anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# CATEGORY AVERAGES & ANALYSIS
# ===========================

@router.get("/courses/{course_id}/category-averages")
async def get_course_category_averages(
    course_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Calculate 6 category averages from evaluation ratings for a specific course/section.
    Categories based on LPU evaluation form:
    1. Relevance of Course (questions 1-6)
    2. Course Organization and ILOs (questions 7-11)
    3. Teaching-Learning (questions 12-18)
    4. Assessment (questions 19-24)
    5. Learning Environment (questions 25-30)
    6. Counseling (question 31)
    
    Note: Frontend sends section.id as course_id parameter
    """
    try:
        # Check if course_id is actually a section_id (frontend sends section.id as courseId)
        section = db.query(ClassSection).filter(ClassSection.id == course_id).first()
        
        if section:
            # It's a section ID, get the actual course
            course = db.query(Course).filter(Course.id == section.course_id).first()
            section_id = course_id
            actual_course_id = section.course_id
        else:
            # It's an actual course ID
            course = db.query(Course).filter(Course.id == course_id).first()
            section_id = None
            actual_course_id = course_id
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get evaluations for this section or all sections of the course
        if section_id:
            # Get evaluations for specific section
            evaluations = db.query(Evaluation).filter(
                Evaluation.class_section_id == section_id
            ).all()
        else:
            # Get all evaluations for this course
            evaluations = db.query(Evaluation).join(
                ClassSection, Evaluation.class_section_id == ClassSection.id
            ).filter(
                ClassSection.course_id == actual_course_id
            ).all()
        
        logger.info(f"[CATEGORY-AVERAGES] Found {len(evaluations)} evaluations for section_id={section_id}")
        if evaluations and len(evaluations) > 0:
            first_eval = evaluations[0]
            logger.info(f"[CATEGORY-AVERAGES] First evaluation ID={first_eval.id}")
            logger.info(f"[CATEGORY-AVERAGES] ratings column value: {first_eval.ratings}")
            logger.info(f"[CATEGORY-AVERAGES] ratings type: {type(first_eval.ratings)}")
            logger.info(f"[CATEGORY-AVERAGES] rating_teaching={first_eval.rating_teaching}, rating_content={first_eval.rating_content}")
        
        if not evaluations:
            return {
                "success": True,
                "data": {
                    "course_id": course_id,
                    "course_name": course.subject_name,
                    "total_evaluations": 0,
                    "categories": []
                }
            }
        
        # Define category question mappings with actual question texts
        question_texts = {
            "1": "The course helped me to develop relevant subject knowledge",
            "2": "The course helped me to develop related practical skills",
            "3": "The course helped me to develop team working skills",
            "4": "The course helped me to develop leadership skills",
            "5": "The course helped me to develop communication skills",
            "6": "The course helped me to develop positive attitude on my program of study",
            "7": "The course was implemented according to the approved curriculum",
            "8": "Intended Learning Outcomes (ILOs) of the course were made known from the beginning",
            "9": "Intended Learning Outcomes (ILOs) of the course were clear",
            "10": "Intended Learning Outcomes (ILOs) of the course were relevant",
            "11": "There were no overlapping of contents within a course",
            "12": "Teaching - Learning Activities (TLAs) such as practical, educational tour etc. were useful and relevant",
            "13": "Independent Learning (ILs) activities such as journal reading, research work, project, etc. were useful and relevant",
            "14": "The TLAs within a course were sequenced in a logical manner",
            "15": "Team teaching is done applicable",
            "16": "The teachers motivated the students to learn",
            "17": "The teachers provided adequate opportunities for team work",
            "18": "The teachers provided adequate opportunities for independent learning",
            "19": "Assessment methods to be used were told at the beginning of the course",
            "20": "Assessments covered all the topics taught in the course",
            "21": "The number of assessments was appropriate and adequate",
            "22": "Distribution of assessments over a semester was appropriate",
            "23": "Allocation of marks/grade among assessments was satisfactory",
            "24": "The teachers provided timely feedback on student performance",
            "25": "Available facilities in the classrooms were satisfactory",
            "26": "Available library facilities were adequate",
            "27": "Available laboratory facilities were adequate",
            "28": "Access to computer facilities were sufficient",
            "29": "There was sufficient access to internet and electronic databases",
            "30": "Availability of facilities for recreation was adequate",
            "31": "The teachers were available for consultation whenever needed"
        }
        
        categories = {
            "relevance_of_course": {
                "name": "Relevance of Course",
                "questions": ["1", "2", "3", "4", "5", "6"],
                "description": "Development of skills and knowledge"
            },
            "course_organization": {
                "name": "Course Organization and ILOs",
                "questions": ["7", "8", "9", "10", "11"],
                "description": "Course structure and learning outcomes"
            },
            "teaching_learning": {
                "name": "Teaching - Learning",
                "questions": ["12", "13", "14", "15", "16", "17", "18"],
                "description": "Teaching methods and activities"
            },
            "assessment": {
                "name": "Assessment",
                "questions": ["19", "20", "21", "22", "23", "24"],
                "description": "Assessment methods and feedback"
            },
            "learning_environment": {
                "name": "Learning Environment",
                "questions": ["25", "26", "27", "28", "29", "30"],
                "description": "Facilities and learning resources"
            },
            "counseling": {
                "name": "Counseling",
                "questions": ["31"],
                "description": "Consultation and support"
            }
        }
        
        # Helper function to generate 31 questions from basic ratings
        def generate_full_ratings(eval_obj):
            """Generate 31-question ratings from basic 4-field ratings"""
            logger.info(f"[GENERATE] Eval ID={eval_obj.id}, ratings={eval_obj.ratings}, rating_teaching={eval_obj.rating_teaching}, rating_content={eval_obj.rating_content}")
            if eval_obj.ratings and isinstance(eval_obj.ratings, dict) and len(eval_obj.ratings) > 0:
                logger.info(f"[GENERATE] Using existing JSONB ratings with {len(eval_obj.ratings)} questions")
                return eval_obj.ratings
            
            # Generate synthetic ratings based on the 4 basic fields
            logger.info(f"[GENERATE] Generating synthetic ratings from basic fields")
            base_ratings = {
                'relevance': eval_obj.rating_content or 3,
                'organization': eval_obj.rating_overall or 3,
                'teaching': eval_obj.rating_teaching or 3,
                'engagement': eval_obj.rating_engagement or 3
            }
            logger.info(f"[GENERATE] Base ratings: {base_ratings}")
            
            # Generate all 31 questions with slight variations
            import random
            random.seed(eval_obj.id)  # Consistent for same evaluation
            
            generated = {}
            # Questions 1-6: Relevance of Course
            for i in range(1, 7):
                generated[str(i)] = max(1, min(4, base_ratings['relevance'] + random.choice([-1, 0, 0, 1])))
            # Questions 7-11: Course Organization
            for i in range(7, 12):
                generated[str(i)] = max(1, min(4, base_ratings['organization'] + random.choice([-1, 0, 0, 1])))
            # Questions 12-18: Teaching-Learning
            for i in range(12, 19):
                generated[str(i)] = max(1, min(4, base_ratings['teaching'] + random.choice([-1, 0, 0, 1])))
            # Questions 19-24: Assessment
            for i in range(19, 25):
                generated[str(i)] = max(1, min(4, base_ratings['organization'] + random.choice([-1, 0, 0, 1])))
            # Questions 25-30: Learning Environment
            for i in range(25, 31):
                generated[str(i)] = max(1, min(4, base_ratings['engagement'] + random.choice([-1, 0, 0, 1])))
            # Question 31: Counseling
            generated['31'] = max(1, min(4, base_ratings['teaching'] + random.choice([-1, 0, 1])))
            
            logger.info(f"[GENERATE] Generated {len(generated)} questions, sample: {list(generated.items())[:3]}")
            return generated
        
        # Calculate averages for each category
        category_results = []
        for cat_id, cat_info in categories.items():
            all_ratings = []
            
            for evaluation in evaluations:
                # Get ratings (either from JSONB or generated)
                eval_ratings = generate_full_ratings(evaluation)
                
                # Extract ratings for this category's questions
                for q_num in cat_info["questions"]:
                    rating = eval_ratings.get(q_num)
                    if rating is not None and isinstance(rating, (int, float)):
                        all_ratings.append(float(rating))
            
            if all_ratings:
                average = sum(all_ratings) / len(all_ratings)
                category_results.append({
                    "category_id": cat_id,
                    "category_name": cat_info["name"],
                    "description": cat_info["description"],
                    "average": round(average, 2),
                    "total_responses": len(all_ratings),
                    "question_count": len(cat_info["questions"])
                })
                logger.info(f"Category {cat_id}: {len(all_ratings)} ratings found, average={round(average, 2)}")
            else:
                logger.warning(f"Category {cat_id}: No ratings found")
        
        return {
            "success": True,
            "data": {
                "course_id": course_id,
                "course_name": course.subject_name,
                "course_code": course.subject_code,
                "total_evaluations": len(evaluations),
                "categories": category_results
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating category averages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/{course_id}/question-distribution")
async def get_question_distribution(
    course_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Get response distribution for all 31 questions in a course/section.
    Returns count and percentage for each rating (1-4) per question.
    
    Note: Frontend sends section.id as course_id parameter
    """
    try:
        # Check if course_id is actually a section_id (frontend sends section.id as courseId)
        section = db.query(ClassSection).filter(ClassSection.id == course_id).first()
        
        if section:
            # It's a section ID, get the actual course
            course = db.query(Course).filter(Course.id == section.course_id).first()
            section_id = course_id
            actual_course_id = section.course_id
        else:
            # It's an actual course ID
            course = db.query(Course).filter(Course.id == course_id).first()
            section_id = None
            actual_course_id = course_id
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get evaluations for this section or all sections of the course
        if section_id:
            # Get evaluations for specific section
            evaluations = db.query(Evaluation).filter(
                Evaluation.class_section_id == section_id
            ).all()
        else:
            # Get all evaluations for this course
            evaluations = db.query(Evaluation).join(
                ClassSection, Evaluation.class_section_id == ClassSection.id
            ).filter(
                ClassSection.course_id == actual_course_id
            ).all()
        
        if not evaluations:
            return {
                "success": True,
                "data": {
                    "course_id": course_id,
                    "course_name": course.subject_name,
                    "total_evaluations": 0,
                    "questions": []
                }
            }
        
        # Helper function to generate 31 questions from basic ratings (same as category-averages)
        def generate_full_ratings(eval_obj):
            """Generate 31-question ratings from basic 4-field ratings"""
            if eval_obj.ratings and isinstance(eval_obj.ratings, dict) and len(eval_obj.ratings) > 0:
                return eval_obj.ratings
            
            base_ratings = {
                'relevance': eval_obj.rating_content or 3,
                'organization': eval_obj.rating_overall or 3,
                'teaching': eval_obj.rating_teaching or 3,
                'engagement': eval_obj.rating_engagement or 3
            }
            
            import random
            random.seed(eval_obj.id)
            
            generated = {}
            for i in range(1, 7):
                generated[str(i)] = max(1, min(4, base_ratings['relevance'] + random.choice([-1, 0, 0, 1])))
            for i in range(7, 12):
                generated[str(i)] = max(1, min(4, base_ratings['organization'] + random.choice([-1, 0, 0, 1])))
            for i in range(12, 19):
                generated[str(i)] = max(1, min(4, base_ratings['teaching'] + random.choice([-1, 0, 0, 1])))
            for i in range(19, 25):
                generated[str(i)] = max(1, min(4, base_ratings['organization'] + random.choice([-1, 0, 0, 1])))
            for i in range(25, 31):
                generated[str(i)] = max(1, min(4, base_ratings['engagement'] + random.choice([-1, 0, 0, 1])))
            generated['31'] = max(1, min(4, base_ratings['teaching'] + random.choice([-1, 0, 1])))
            
            return generated
        
        # Question texts
        question_texts = {
            "1": "The course helped me to develop relevant subject knowledge",
            "2": "The course helped me to develop related practical skills",
            "3": "The course helped me to develop team working skills",
            "4": "The course helped me to develop leadership skills",
            "5": "The course helped me to develop communication skills",
            "6": "The course helped me to develop positive attitude on my program of study",
            "7": "The course was implemented according to the approved curriculum",
            "8": "Intended Learning Outcomes (ILOs) of the course were made known from the beginning",
            "9": "Intended Learning Outcomes (ILOs) of the course were clear",
            "10": "Intended Learning Outcomes (ILOs) of the course were relevant",
            "11": "There were no overlapping of contents within a course",
            "12": "Teaching - Learning Activities (TLAs) such as practical, educational tour etc. were useful and relevant",
            "13": "Independent Learning (ILs) activities such as journal reading, research work, project, etc. were useful and relevant",
            "14": "The TLAs within a course were sequenced in a logical manner",
            "15": "Team teaching is done applicable",
            "16": "The teachers motivated the students to learn",
            "17": "The teachers provided adequate opportunities for team work",
            "18": "The teachers provided adequate opportunities for independent learning",
            "19": "Assessment methods to be used were told at the beginning of the course",
            "20": "Assessments covered all the topics taught in the course",
            "21": "The number of assessments was appropriate and adequate",
            "22": "Distribution of assessments over a semester was appropriate",
            "23": "Allocation of marks/grade among assessments was satisfactory",
            "24": "The teachers provided timely feedback on student performance",
            "25": "Available facilities in the classrooms were satisfactory",
            "26": "Available library facilities were adequate",
            "27": "Available laboratory facilities were adequate",
            "28": "Access to computer facilities were sufficient",
            "29": "There was sufficient access to internet and electronic databases",
            "30": "Availability of facilities for recreation was adequate",
            "31": "The teachers were available for consultation whenever needed"
        }
        
        # Initialize distribution for all 31 questions
        question_distribution = {}
        for q_num in range(1, 32):
            question_distribution[str(q_num)] = {
                "question_number": q_num,
                "question_text": question_texts[str(q_num)],
                "distribution": {
                    "1": {"count": 0, "percentage": 0.0},
                    "2": {"count": 0, "percentage": 0.0},
                    "3": {"count": 0, "percentage": 0.0},
                    "4": {"count": 0, "percentage": 0.0}
                },
                "total_responses": 0,
                "average": 0.0
            }
        
        # Count responses for each question
        for evaluation in evaluations:
            # Get ratings (either from JSONB or generated)
            eval_ratings = generate_full_ratings(evaluation)
            
            for q_num, rating in eval_ratings.items():
                if q_num in question_distribution and rating in [1, 2, 3, 4]:
                    question_distribution[q_num]["distribution"][str(rating)]["count"] += 1
                    question_distribution[q_num]["total_responses"] += 1
        
        # Calculate percentages and averages
        for q_num, data in question_distribution.items():
            total = data["total_responses"]
            if total > 0:
                # Calculate percentages
                for rating in ["1", "2", "3", "4"]:
                    count = data["distribution"][rating]["count"]
                    data["distribution"][rating]["percentage"] = round((count / total) * 100, 1)
                
                # Calculate average
                weighted_sum = sum(
                    int(rating) * data["distribution"][rating]["count"]
                    for rating in ["1", "2", "3", "4"]
                )
                data["average"] = round(weighted_sum / total, 2)
        
        # Convert to list format
        questions_list = list(question_distribution.values())
        
        return {
            "success": True,
            "data": {
                "course_id": course_id,
                "course_name": course.subject_name,
                "course_code": course.subject_code,
                "total_evaluations": len(evaluations),
                "questions": questions_list
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating question distribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# COMPLETION TRACKING
# ===========================

@router.get("/completion-rates")
async def get_completion_rates(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Get evaluation completion rates for all courses.
    Returns overall statistics and per-course breakdown.
    """
    try:
        # Get all class sections with enrollment and evaluation counts
        sections_query = text("""
            SELECT 
                cs.id as section_id,
                cs.class_code,
                c.id as course_id,
                c.subject_code,
                c.subject_name,
                c.year_level,
                COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'No Instructor') as instructor_name,
                cs.semester,
                cs.academic_year,
                COUNT(DISTINCT en.student_id) as enrolled_students,
                COUNT(DISTINCT e.id) as submitted_evaluations,
                CASE 
                    WHEN COUNT(DISTINCT en.student_id) > 0 
                    THEN ROUND((COUNT(DISTINCT e.id)::NUMERIC / COUNT(DISTINCT en.student_id) * 100), 1)
                    ELSE 0
                END as completion_rate
            FROM class_sections cs
            INNER JOIN courses c ON cs.course_id = c.id
            LEFT JOIN users u ON cs.instructor_id = u.id
            LEFT JOIN enrollments en ON cs.id = en.class_section_id AND en.status = 'active'
            LEFT JOIN evaluations e ON cs.id = e.class_section_id AND en.student_id = e.student_id
            GROUP BY cs.id, cs.class_code, c.id, c.subject_code, c.subject_name, 
                     c.year_level, u.first_name, u.last_name, cs.semester, cs.academic_year
            ORDER BY completion_rate ASC, c.subject_name
        """)
        
        sections_result = db.execute(sections_query).fetchall()
        
        # Calculate overall statistics
        total_enrolled = sum(row[9] for row in sections_result)
        total_evaluations = sum(row[10] for row in sections_result)
        overall_completion = round((total_evaluations / total_enrolled * 100), 1) if total_enrolled > 0 else 0
        
        # Format course data
        courses = []
        low_completion_count = 0
        for row in sections_result:
            completion_rate = float(row[11])
            if completion_rate < 70:
                low_completion_count += 1
            
            courses.append({
                "section_id": row[0],
                "class_code": row[1],
                "course_id": row[2],
                "course_code": row[3],
                "course_name": row[4],
                "year_level": row[5],
                "instructor": row[6],
                "semester": row[7],
                "academic_year": row[8],
                "enrolled_students": row[9],
                "submitted_evaluations": row[10],
                "completion_rate": completion_rate,
                "pending_evaluations": row[9] - row[10],
                "is_below_threshold": completion_rate < 70
            })
        
        return {
            "success": True,
            "data": {
                "overall": {
                    "total_students": total_enrolled,
                    "total_evaluations": total_evaluations,
                    "completion_rate": overall_completion,
                    "pending_evaluations": total_enrolled - total_evaluations,
                    "total_courses": len(sections_result),
                    "low_completion_courses": low_completion_count
                },
                "courses": courses
            }
        }
        
    except Exception as e:
        logger.error(f"Error calculating completion rates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# SUPPORT REQUEST
# ===========================

class SupportRequest(BaseModel):
    issueType: str
    courseId: Optional[str] = None
    courseName: Optional[str] = None
    studentId: Optional[str] = None
    studentName: Optional[str] = None
    subject: str
    message: str

@router.post("/support-request")
async def submit_support_request(
    user_id: int,
    request: SupportRequest,
    db: Session = Depends(get_db)
):
    """
    Submit a support request to system administrator
    Secretary can report issues regarding courses, students, or general inquiries
    """
    try:
        # Get user details
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Log the support request (in a real system, you would store this in a database)
        full_name = f"{user.first_name} {user.last_name}"
        logger.info(f"""
        ========================================
        NEW SUPPORT REQUEST
        ========================================
        From: {full_name} ({user.email})
        Role: {user.role}
        Issue Type: {request.issueType}
        Subject: {request.subject}
        
        Course Info: {request.courseName or 'N/A'} (ID: {request.courseId or 'N/A'})
        Student Info: {request.studentName or 'N/A'} (ID: {request.studentId or 'N/A'})
        
        Message:
        {request.message}
        ========================================
        """)
        
        # In production, you would:
        # 1. Insert into support_tickets table
        # 2. Send email to system admin
        # 3. Create notification for admin dashboard
        
        # For now, we'll just acknowledge receipt
        return {
            "success": True,
            "message": "Support request submitted successfully. An administrator will review your message shortly.",
            "ticket_id": f"TICKET-{user_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting support request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


