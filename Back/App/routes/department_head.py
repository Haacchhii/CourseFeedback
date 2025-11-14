"""
Department Head Routes for Course Feedback System
Handles department head dashboard and analytics including:
- View department evaluations
- Analytics and sentiment analysis
- Course reports
- Instructor performance
- Trend analysis
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_, desc
from database.connection import get_db
from models.enhanced_models import (
    User, Student, Course, ClassSection, Evaluation,
    DepartmentHead, Program, AnalysisResult
)
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ===========================
# HELPER FUNCTIONS
# ===========================

def parse_program_ids(programs_field):
    """
    Parse PostgreSQL ARRAY(Integer) field that may come as:
    - List: [1, 2, 3] 
    - String: "{1,2,3}"
    Returns a proper list of integers for use in SQL queries.
    """
    if not programs_field:
        return []
    
    if isinstance(programs_field, list):
        # Already a list, ensure all elements are integers
        return [int(x) if not isinstance(x, int) else x for x in programs_field]
    elif isinstance(programs_field, str):
        # Parse PostgreSQL array string format: "{1,2,3}" -> [1, 2, 3]
        programs_str = programs_field.strip().strip('{}').strip()
        if programs_str:
            try:
                return [int(x.strip()) for x in programs_str.split(',') if x.strip() and x.strip().isdigit()]
            except ValueError as e:
                print(f"⚠️  Error parsing programs field '{programs_field}': {e}")
                return []
    
    return []

def get_dept_head_by_param(db: Session, user_id: Optional[int] = None, department: Optional[str] = None):
    """
    Helper function to get department head by either user_id or department name
    Returns None if not found
    """
    if user_id:
        return db.query(DepartmentHead).filter(DepartmentHead.user_id == user_id).first()
    elif department:
        return db.query(DepartmentHead).filter(DepartmentHead.department == department).first()
    return None

# ===========================
# DASHBOARD & OVERVIEW
# ===========================

@router.get("/dashboard")
async def get_department_head_dashboard(
    department: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get department head dashboard overview"""
    try:
        # Get department head info
        # Support both department string and user_id for flexibility
        if user_id:
            dept_head = db.query(DepartmentHead).filter(DepartmentHead.user_id == user_id).first()
        elif department:
            dept_head = db.query(DepartmentHead).filter(DepartmentHead.department == department).first()
        else:
            raise HTTPException(status_code=400, detail="Either user_id or department must be provided")
        
        if not dept_head:
            # Return empty dashboard instead of error
            return {
                "success": True,
                "data": {
                    "total_courses": 0,
                    "total_evaluations": 0,
                    "avg_rating": 0.0,
                    "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
                    "recent_evaluations": [],
                    "message": "No department data available"
                }
            }
        
        # Get programs under this department head
        # Use helper function to parse ARRAY(Integer) field
        program_ids = parse_program_ids(dept_head.programs)
        
        # Debug log to verify parsing
        logger.info(f"Department head programs: {dept_head.programs} (type: {type(dept_head.programs)})")
        logger.info(f"Parsed program_ids: {program_ids} (type: {type(program_ids)})")
        
        # Total courses - use empty list check to avoid SQL errors
        if not program_ids:
            total_courses = 0
        else:
            total_courses = db.query(func.count(Course.id)).filter(
                Course.program_id.in_(program_ids)
            ).scalar() or 0
        
        # Total evaluations
        total_evaluations = 0
        avg_rating = 0.0
        if program_ids:
            total_evaluations = db.query(func.count(Evaluation.id)).join(
                ClassSection, Evaluation.class_section_id == ClassSection.id
            ).join(
                Course, ClassSection.course_id == Course.id
            ).filter(
                Course.program_id.in_(program_ids)
            ).scalar() or 0
            
            # Average rating
            avg_rating = db.query(func.avg(Evaluation.rating_overall)).join(
                ClassSection, Evaluation.class_section_id == ClassSection.id
            ).join(
                Course, ClassSection.course_id == Course.id
            ).filter(
                Course.program_id.in_(program_ids)
            ).scalar() or 0.0
        
        # Sentiment distribution
        sentiment_dist = []
        if program_ids:
            sentiment_dist = db.query(
                Evaluation.sentiment,
                func.count(Evaluation.id).label('count')
            ).join(
                ClassSection, Evaluation.class_section_id == ClassSection.id
            ).join(
                Course, ClassSection.course_id == Course.id
            ).filter(
                Course.program_id.in_(program_ids)
            ).group_by(Evaluation.sentiment).all()
        
        sentiment_data = {
            "positive": 0,
            "neutral": 0,
            "negative": 0
        }
        for sentiment, count in sentiment_dist:
            if sentiment:
                sentiment_data[sentiment.lower()] = count
        
        # Anomaly count
        anomaly_count = db.query(func.count(Evaluation.id)).join(
            ClassSection, Evaluation.class_section_id == ClassSection.id
        ).join(
            Course, ClassSection.course_id == Course.id
        ).filter(
            Course.program_id.in_(program_ids),
            Evaluation.is_anomaly == True
        ).scalar() or 0
        
        return {
            "success": True,
            "data": {
                "department": dept_head.department,
                "total_courses": total_courses,
                "total_evaluations": total_evaluations,
                "average_rating": round(avg_rating, 2),
                "sentiment": sentiment_data,
                "anomalies": anomaly_count
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching department head dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# EVALUATIONS & ANALYTICS
# ===========================

@router.get("/evaluations")
async def get_department_evaluations(
    user_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    course_id: Optional[int] = None,
    sentiment: Optional[str] = None,
    anomaly_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all evaluations (full system access - single department system)"""
    try:
        # Single department system - full access
        # Build query without program filtering
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
        
        if anomaly_only:
            query = query.filter(Evaluation.is_anomaly == True)
        
        total = query.count()
        offset = (page - 1) * page_size
        evaluations = query.order_by(Evaluation.submission_date.desc()).offset(offset).limit(page_size).all()
        
        # Return empty if no evaluations
        if not evaluations:
            return {
                "success": True,
                "data": [],
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": 0,
                    "pages": 0
                }
            }
        
        eval_data = []
        for e in evaluations:
            class_section = db.query(ClassSection).filter(ClassSection.id == e.class_section_id).first()
            course = db.query(Course).filter(Course.id == class_section.course_id).first() if class_section else None
            
            eval_data.append({
                "id": e.id,
                "course_code": course.subject_code if (course and course.subject_code) else "N/A",
                "course_name": course.subject_name if (course and course.subject_name) else "N/A",
                "instructor": class_section.instructor_id if class_section else "N/A",
                "rating_overall": e.rating_overall if e.rating_overall else 0,
                "rating_teaching": e.rating_teaching if e.rating_teaching else 0,
                "rating_content": e.rating_content if e.rating_content else 0,
                "rating_engagement": e.rating_engagement if e.rating_engagement else 0,
                "sentiment": e.sentiment or "neutral",
                "sentiment_score": e.sentiment_score if e.sentiment_score else 0,
                "is_anomaly": e.is_anomaly if e.is_anomaly else False,
                "text_feedback": e.text_feedback or "",
                "submission_date": e.submission_date.isoformat() if e.submission_date else None
            })
        
        return {
            "success": True,
            "data": eval_data,
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
        logger.error(f"Error fetching department evaluations: {e}")
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
    """Get sentiment analysis trends (full system access - single department)"""
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
        
        # Get sentiment distribution over time (all programs - full access)
        sentiments = db.query(
            func.date_trunc('day', Evaluation.submission_date).label('date'),
            Evaluation.sentiment,
            func.count(Evaluation.id).label('count')
        ).filter(
            Evaluation.submission_date >= start_date
        ).group_by(
            func.date_trunc('day', Evaluation.submission_date),
            Evaluation.sentiment
        ).order_by('date').all()
        
        # Format data for charts
        sentiment_trends = {}
        for date, sentiment, count in sentiments:
            date_str = date.strftime('%Y-%m-%d') if date else "unknown"
            if date_str not in sentiment_trends:
                sentiment_trends[date_str] = {"positive": 0, "neutral": 0, "negative": 0}
            if sentiment:
                sentiment_trends[date_str][sentiment.lower()] = count
        
        # Convert to array format
        trend_data = [
            {
                "date": date,
                **sentiments
            }
            for date, sentiments in sentiment_trends.items()
        ]
        
        return {
            "success": True,
            "data": {
                "time_range": time_range,
                "trends": trend_data
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sentiment analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# COURSE REPORTS
# ===========================

@router.get("/courses")
async def get_department_courses(
    department: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all courses (full system access - single department system)"""
    try:
        # Single department system - both secretary and dept_head see all courses
        # Return class sections (not just courses) to match expected format
        
        # Build query for class sections with course info
        results = db.query(ClassSection, Course, Program).join(
            Course, ClassSection.course_id == Course.id
        ).outerjoin(
            Program, Course.program_id == Program.id
        ).all()
        
        logger.info(f"[DEPT-HEAD] Total class sections found: {len(results)}")
        
        # Return empty if no results
        if not results:
            return {
                "success": True,
                "data": []
            }
        
        courses_data = []
        for section, course, program in results:
            # Get evaluation count for this section
            eval_count = db.query(func.count(Evaluation.id)).filter(
                Evaluation.class_section_id == section.id
            ).scalar() or 0
            
            # Get average rating
            avg_rating = db.query(func.avg(Evaluation.rating_overall)).filter(
                Evaluation.class_section_id == section.id
            ).scalar() or 0.0
            
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
                "evaluations_count": eval_count,
                "enrolled_students": section.max_students or 0,
                "status": "Active",  # Default status
                "overallRating": float(avg_rating) if avg_rating else 0.0
            })
        
        return {
            "success": True,
            "data": courses_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching department courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/courses/{course_id}/report")
async def get_course_report(
    course_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get detailed report for a specific course"""
    try:
        # Verify access
        dept_head = db.query(DepartmentHead).filter(DepartmentHead.user_id == user_id).first()
        if not dept_head:
            raise HTTPException(status_code=404, detail="Department head not found")
        
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        program_ids = parse_program_ids(dept_head.programs)
        if course.program_id not in program_ids:
            raise HTTPException(status_code=403, detail="Access denied to this course")
        
        # Get all class sections
        sections = db.query(ClassSection).filter(ClassSection.course_id == course_id).all()
        
        sections_data = []
        for section in sections:
            # Get evaluation stats
            eval_stats = db.query(
                func.count(Evaluation.id).label('total'),
                func.avg(Evaluation.rating_overall).label('avg_overall'),
                func.avg(Evaluation.rating_teaching).label('avg_teaching'),
                func.avg(Evaluation.rating_content).label('avg_content'),
                func.avg(Evaluation.rating_engagement).label('avg_engagement')
            ).filter(Evaluation.class_section_id == section.id).first()
            
            # Get sentiment distribution
            sentiment_dist = db.query(
                Evaluation.sentiment,
                func.count(Evaluation.id)
            ).filter(
                Evaluation.class_section_id == section.id
            ).group_by(Evaluation.sentiment).all()
            
            sentiment_data = {"positive": 0, "neutral": 0, "negative": 0}
            for sentiment, count in sentiment_dist:
                if sentiment:
                    sentiment_data[sentiment.lower()] = count
            
            sections_data.append({
                "class_code": section.class_code,
                "instructor": section.instructor_name,
                "schedule": section.schedule,
                "room": section.room,
                "evaluations_count": eval_stats.total if eval_stats else 0,
                "avg_ratings": {
                    "overall": round(eval_stats.avg_overall, 2) if eval_stats and eval_stats.avg_overall else 0.0,
                    "teaching": round(eval_stats.avg_teaching, 2) if eval_stats and eval_stats.avg_teaching else 0.0,
                    "content": round(eval_stats.avg_content, 2) if eval_stats and eval_stats.avg_content else 0.0,
                    "engagement": round(eval_stats.avg_engagement, 2) if eval_stats and eval_stats.avg_engagement else 0.0
                },
                "sentiment": sentiment_data
            })
        
        return {
            "success": True,
            "data": {
                "course": {
                    "id": course.id,
                    "code": course.subject_code,  # Fixed: was course.course_code
                    "name": course.subject_name,  # Fixed: was course.course_name
                    "year_level": course.year_level,
                    "semester": course.semester,
                    "units": 3  # Fixed: removed from model, default to 3
                },
                "sections": sections_data
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching course report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# INSTRUCTOR PERFORMANCE
# ===========================

@router.get("/instructors")
async def get_instructor_performance(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get performance metrics for all instructors in department"""
    try:
        # Get department head info
        dept_head = db.query(DepartmentHead).filter(DepartmentHead.user_id == user_id).first()
        if not dept_head:
            raise HTTPException(status_code=404, detail="Department head not found")
        
        program_ids = parse_program_ids(dept_head.programs)
        
        # Get all class sections with their instructors
        sections = db.query(ClassSection).join(
            Course, ClassSection.course_id == Course.id
        ).filter(
            Course.program_id.in_(program_ids)
        ).all()
        
        # Group by instructor
        instructor_data = {}
        for section in sections:
            instructor = section.instructor_name or "Unknown"
            
            if instructor not in instructor_data:
                instructor_data[instructor] = {
                    "name": instructor,
                    "courses": set(),
                    "total_evaluations": 0,
                    "ratings": [],
                    "sentiment_counts": {"positive": 0, "neutral": 0, "negative": 0}
                }
            
            # Get course name
            course = db.query(Course).filter(Course.id == section.course_id).first()
            if course:
                instructor_data[instructor]["courses"].add(course.course_name)
            
            # Get evaluation stats
            evals = db.query(Evaluation).filter(Evaluation.class_section_id == section.id).all()
            
            for e in evals:
                instructor_data[instructor]["total_evaluations"] += 1
                instructor_data[instructor]["ratings"].append(e.rating_overall)
                if e.sentiment:
                    instructor_data[instructor]["sentiment_counts"][e.sentiment.lower()] += 1
        
        # Format output
        instructors_list = []
        for instructor, data in instructor_data.items():
            avg_rating = sum(data["ratings"]) / len(data["ratings"]) if data["ratings"] else 0.0
            
            instructors_list.append({
                "name": instructor,
                "courses_count": len(data["courses"]),
                "courses": list(data["courses"]),
                "total_evaluations": data["total_evaluations"],
                "avg_rating": round(avg_rating, 2),
                "sentiment": data["sentiment_counts"]
            })
        
        # Sort by average rating
        instructors_list.sort(key=lambda x: x["avg_rating"], reverse=True)
        
        return {
            "success": True,
            "data": instructors_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching instructor performance: {e}")
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
    """Get detected anomalies (full system access - single department)"""
    try:
        # Single department system - full access
        # Query anomalous evaluations (all programs)
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
            
            anomaly_data.append({
                "id": e.id,
                "course_code": course.course_code if course else "N/A",
                "course_name": course.course_name if course else "N/A",
                "instructor": class_section.instructor_name if class_section else "N/A",
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
# TREND ANALYSIS
# ===========================

@router.get("/trends")
async def get_trend_analysis(
    user_id: int = Query(...),
    metric: str = Query("rating", regex="^(rating|sentiment|engagement)$"),
    db: Session = Depends(get_db)
):
    """Get trend analysis over time"""
    try:
        # Get department head info
        dept_head = db.query(DepartmentHead).filter(DepartmentHead.user_id == user_id).first()
        if not dept_head:
            raise HTTPException(status_code=404, detail="Department head not found")
        
        program_ids = parse_program_ids(dept_head.programs)
        
        # Get trends by month for the last 6 months
        six_months_ago = datetime.now() - timedelta(days=180)
        
        if metric == "rating":
            trends = db.query(
                func.date_trunc('month', Evaluation.submission_date).label('month'),
                func.avg(Evaluation.rating_overall).label('avg_rating')
            ).join(
                ClassSection, Evaluation.class_section_id == ClassSection.id
            ).join(
                Course, ClassSection.course_id == Course.id
            ).filter(
                Course.program_id.in_(program_ids),
                Evaluation.submission_date >= six_months_ago
            ).group_by(func.date_trunc('month', Evaluation.submission_date)).order_by('month').all()
            
            trend_data = [{
                "month": t.month.strftime('%Y-%m') if t.month else "unknown",
                "value": round(t.avg_rating, 2) if t.avg_rating else 0.0
            } for t in trends]
        
        elif metric == "sentiment":
            trends = db.query(
                func.date_trunc('month', Evaluation.submission_date).label('month'),
                Evaluation.sentiment,
                func.count(Evaluation.id).label('count')
            ).join(
                ClassSection, Evaluation.class_section_id == ClassSection.id
            ).join(
                Course, ClassSection.course_id == Course.id
            ).filter(
                Course.program_id.in_(program_ids),
                Evaluation.submission_date >= six_months_ago
            ).group_by(
                func.date_trunc('month', Evaluation.submission_date),
                Evaluation.sentiment
            ).order_by('month').all()
            
            # Format sentiment trends
            trend_dict = {}
            for t in trends:
                month_str = t.month.strftime('%Y-%m') if t.month else "unknown"
                if month_str not in trend_dict:
                    trend_dict[month_str] = {"positive": 0, "neutral": 0, "negative": 0}
                if t.sentiment:
                    trend_dict[month_str][t.sentiment.lower()] = t.count
            
            trend_data = [{"month": k, **v} for k, v in trend_dict.items()]
        
        else:  # engagement
            trends = db.query(
                func.date_trunc('month', Evaluation.submission_date).label('month'),
                func.avg(Evaluation.rating_engagement).label('avg_engagement')
            ).join(
                ClassSection, Evaluation.class_section_id == ClassSection.id
            ).join(
                Course, ClassSection.course_id == Course.id
            ).filter(
                Course.program_id.in_(program_ids),
                Evaluation.submission_date >= six_months_ago
            ).group_by(func.date_trunc('month', Evaluation.submission_date)).order_by('month').all()
            
            trend_data = [{
                "month": t.month.strftime('%Y-%m') if t.month else "unknown",
                "value": round(t.avg_engagement, 2) if t.avg_engagement else 0.0
            } for t in trends]
        
        return {
            "success": True,
            "data": {
                "metric": metric,
                "trends": trend_data
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching trend analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# FILTER OPTIONS
# ===========================

@router.get("/programs")
async def get_programs(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get all programs (dept head has department-wide access)"""
    try:
        dept_head = db.query(DepartmentHead).filter(DepartmentHead.user_id == user_id).first()
        if not dept_head:
            raise HTTPException(status_code=404, detail="Department head not found")
        
        # Department head can access ALL programs in the department
        programs = db.query(Program).filter(Program.is_active == True).all()
        
        programs_data = [{
            "id": p.id,
            "code": p.program_code,
            "name": p.program_name
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
    """Get list of year levels for filtering"""
    try:
        dept_head = db.query(DepartmentHead).filter(DepartmentHead.user_id == user_id).first()
        if not dept_head:
            raise HTTPException(status_code=404, detail="Department head not found")
        
        # Return standard year levels (1-4 for undergraduate)
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
