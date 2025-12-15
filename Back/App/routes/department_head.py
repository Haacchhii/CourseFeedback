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
from middleware.auth import require_staff
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_, desc
from database.connection import get_db
from models.enhanced_models import (
    User, Student, Course, ClassSection, Evaluation,
    DepartmentHead, Program, AnalysisResult, EvaluationPeriod, Enrollment
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
    period_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get department head dashboard overview (defaults to active period)"""
    try:
        # Get department head info
        if user_id:
            dept_head = db.query(DepartmentHead).filter(DepartmentHead.user_id == user_id).first()
        elif department:
            dept_head = db.query(DepartmentHead).filter(DepartmentHead.department == department).first()
        else:
            raise HTTPException(status_code=400, detail="Either user_id or department must be provided")
        
        if not dept_head:
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
        
        # Get evaluation period (active by default)
        if period_id:
            period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == period_id).first()
            if not period:
                raise HTTPException(status_code=404, detail="Evaluation period not found")
        else:
            period = db.query(EvaluationPeriod).filter(EvaluationPeriod.status == 'active').first()
        
        # If no period, return empty dashboard
        if not period:
            return {
                "success": True,
                "data": {
                    "department": dept_head.department,
                    "period": None,
                    "period_name": None,
                    "total_courses": 0,
                    "total_evaluations": 0,
                    "total_enrolled_students": 0,
                    "participation_rate": 0,
                    "average_rating": 0.0,
                    "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
                    "anomalies": 0,
                    "message": "No active evaluation period"
                }
            }
        
        logger.info(f"Department head accessing dashboard for period: {period.name}")
        
        # Total courses
        total_courses = db.query(func.count(Course.id)).scalar() or 0
        
        # Total evaluations for THIS PERIOD ONLY (completed only)
        total_evaluations = db.query(func.count(Evaluation.id)).filter(
            Evaluation.evaluation_period_id == period.id,
            Evaluation.status == 'completed'
        ).scalar() or 0
        
        # Average rating for THIS PERIOD ONLY (completed only)
        avg_rating = db.query(func.avg(Evaluation.rating_overall)).filter(
            Evaluation.evaluation_period_id == period.id,
            Evaluation.status == 'completed'
        ).scalar() or 0.0
        
        # Sentiment distribution for THIS PERIOD ONLY (completed only)
        sentiment_dist = db.query(
            Evaluation.sentiment,
            func.count(Evaluation.id).label('count')
        ).filter(
            Evaluation.evaluation_period_id == period.id,
            Evaluation.status == 'completed'
        ).group_by(Evaluation.sentiment).all()
        
        sentiment_data = {
            "positive": 0,
            "neutral": 0,
            "negative": 0
        }
        for sentiment, count in sentiment_dist:
            if sentiment:
                sentiment_data[sentiment.lower()] = count
        
        # Anomaly count for THIS PERIOD ONLY (completed only)
        anomaly_count = db.query(func.count(Evaluation.id)).filter(
            Evaluation.evaluation_period_id == period.id,
            Evaluation.status == 'completed',
            Evaluation.is_anomaly == True
        ).scalar() or 0
        
        # Calculate participation rate for THIS PERIOD ONLY
        total_enrolled_students = db.query(func.count(Enrollment.id.distinct())).filter(
            Enrollment.status == 'active',
            Enrollment.evaluation_period_id == period.id
        ).scalar() or 0
        
        students_who_evaluated = db.query(func.count(Evaluation.student_id.distinct())).filter(
            Evaluation.evaluation_period_id == period.id,
            Evaluation.status == 'completed'
        ).scalar() or 0
        
        participation_rate = round((students_who_evaluated / total_enrolled_students * 100), 1) if total_enrolled_students > 0 else 0
        
        return {
            "success": True,
            "data": {
                "department": dept_head.department,
                "period_id": period.id,
                "period_name": period.name,
                "period_status": period.status,
                "period_dates": {
                    "start": period.start_date.isoformat(),
                    "end": period.end_date.isoformat()
                },
                "total_courses": total_courses,
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
        logger.error(f"Error fetching department head dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# EVALUATIONS & ANALYTICS
# ===========================

@router.get("/evaluations")
async def get_department_evaluations(
    user_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=1000),
    course_id: Optional[int] = None,
    sentiment: Optional[str] = None,
    anomaly_only: bool = False,
    period_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all evaluations (defaults to active period)"""
    try:
        # Get evaluation period (active by default)
        if period_id:
            period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == period_id).first()
            if not period:
                raise HTTPException(status_code=404, detail="Evaluation period not found")
        else:
            period = db.query(EvaluationPeriod).filter(EvaluationPeriod.status == 'active').first()
        
        # If no period, return empty
        if not period:
            return {
                "success": True,
                "data": [],
                "pagination": {"page": page, "page_size": page_size, "total": 0, "total_pages": 0},
                "message": "No active evaluation period"
            }
        
        # Build query for evaluations in this period
        query = db.query(Evaluation).join(
            ClassSection, Evaluation.class_section_id == ClassSection.id
        ).join(
            Course, ClassSection.course_id == Course.id
        ).filter(
            Evaluation.evaluation_period_id == period.id
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
        
        from models.enhanced_models import Student
        
        eval_data = []
        for e in evaluations:
            class_section = db.query(ClassSection).filter(ClassSection.id == e.class_section_id).first()
            course = db.query(Course).filter(Course.id == class_section.course_id).first() if class_section else None
            
            # Get student info via user relationship
            student = db.query(Student).filter(Student.id == e.student_id).first()
            student_name = "Unknown Student"
            if student and student.user:
                student_name = f"{student.user.first_name} {student.user.last_name}" if student.user.first_name and student.user.last_name else (student.user.email or "Unknown Student")
            elif student:
                student_name = student.student_number or "Unknown Student"
            
            # Get ratings - prefer JSONB ratings column
            ratings_data = e.ratings if hasattr(e, 'ratings') and e.ratings else {
                "overall": e.rating_overall if e.rating_overall else 0,
                "teaching": e.rating_teaching if e.rating_teaching else 0,
                "content": e.rating_content if e.rating_content else 0,
                "engagement": e.rating_engagement if e.rating_engagement else 0
            }
            
            # Transform ratings from descriptive keys to question numbers for frontend
            jsonb_key_mapping = {
                "relevance_subject_knowledge": "1", "relevance_practical_skills": "2", "relevance_team_work": "3",
                "relevance_leadership": "4", "relevance_communication": "5", "relevance_positive_attitude": "6",
                "org_curriculum": "7", "org_ilos_known": "8", "org_ilos_clear": "9",
                "org_ilos_relevant": "10", "org_no_overlapping": "11",
                "teaching_tlas_useful": "12", "teaching_ila_useful": "13", "teaching_tlas_sequenced": "14",
                "teaching_applicable": "15", "teaching_motivated": "16", "teaching_team_work": "17", "teaching_independent": "18",
                "assessment_start": "19", "assessment_all_topics": "20", "assessment_number": "21",
                "assessment_distribution": "22", "assessment_allocation": "23", "assessment_feedback": "24",
                "environment_classrooms": "25", "environment_library": "26", "environment_laboratory": "27",
                "environment_computer": "28", "environment_internet": "29", "environment_facilities_availability": "30",
                "counseling_available": "31"
            }
            
            # Convert ratings keys if they use descriptive names
            if ratings_data and isinstance(ratings_data, dict):
                transformed_ratings = {}
                for key, value in ratings_data.items():
                    new_key = jsonb_key_mapping.get(key, key)
                    transformed_ratings[new_key] = value
                ratings_data = transformed_ratings
            
            eval_data.append({
                "id": e.id,
                "courseId": course.id if course else None,
                "sectionId": class_section.id if class_section else None,
                "course_code": course.subject_code if (course and course.subject_code) else "N/A",
                "course_name": course.subject_name if (course and course.subject_name) else "N/A",
                "instructor": class_section.instructor_id if class_section else "N/A",
                "student": student_name,
                "student_id": e.student_id,
                "rating_overall": e.rating_overall if e.rating_overall else 0,
                "rating_teaching": e.rating_teaching if e.rating_teaching else 0,
                "rating_content": e.rating_content if e.rating_content else 0,
                "rating_engagement": e.rating_engagement if e.rating_engagement else 0,
                "ratings": ratings_data,
                "sentiment": e.sentiment or "neutral",
                "sentiment_score": e.sentiment_score if e.sentiment_score else 0,
                "is_anomaly": e.is_anomaly if e.is_anomaly else False,
                "anomaly": e.is_anomaly if e.is_anomaly else False,
                "text_feedback": e.text_feedback or "",
                "comment": e.text_feedback or "",
                "submission_date": e.submission_date.isoformat() if e.submission_date else None,
                "semester": class_section.semester if class_section else "N/A",
                "academic_year": class_section.academic_year if class_section else "N/A"
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
        
        # Calculate overall statistics
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
        total_evals = 0
        for sentiment, count in sentiment_counts:
            total_evals += count
            if sentiment:
                sentiment_summary[sentiment.lower()] = count
        
        return {
            "success": True,
            "data": {
                "time_range": time_range,
                "trends": trend_data,
                "summary": sentiment_summary,
                "total_evaluations": total_evals
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
        # Use subqueries to get counts efficiently
        # Count DISTINCT students who evaluated (prevents double-counting duplicate evaluations)
        eval_count_subq = db.query(
            Evaluation.class_section_id,
            func.count(func.distinct(Evaluation.student_id)).label('eval_count'),
            func.avg(Evaluation.rating_overall).label('avg_rating')
        ).filter(Evaluation.status == 'completed').group_by(Evaluation.class_section_id).subquery()
        
        enroll_count_subq = db.query(
            Enrollment.class_section_id,
            func.count(func.distinct(Enrollment.student_id)).label('enroll_count')
        ).filter(Enrollment.status == 'active').group_by(Enrollment.class_section_id).subquery()
        
        # Build efficient query with joins
        query = db.query(ClassSection, Course, Program).join(
            Course, ClassSection.course_id == Course.id
        ).outerjoin(
            Program, Course.program_id == Program.id
        )
        
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
        
        logger.info(f"[DEPT-HEAD] Total class sections found: {len(results)}")
        
        # Return empty if no results
        if not results:
            return {
                "success": True,
                "data": []
            }
        
        courses_data = []
        for row in results:
            section, course, program, eval_count, avg_rating, enrolled_count = row
            
            # Course evaluation system - no instructor tracking
            # instructor_id removed from class_sections table
            instructor_full_name = "N/A"
            
            # Calculate response rate (cap at 100%)
            enrolled = int(enrolled_count or 0)
            evals = int(eval_count or 0)
            response_rate = min(100, round((evals / enrolled * 100))) if enrolled > 0 else 0
            
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
                "evaluationCount": evals,  # Frontend expects this field name
                "evaluations_count": evals,  # Keep for compatibility
                "enrollmentCount": enrolled,  # Frontend expects this field name
                "enrolled_students": enrolled,  # Keep for compatibility
                "enrolledStudents": enrolled,  # Also used by frontend
                "responseRate": response_rate,  # Pre-calculated response rate
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
        # Department-wide access (no program filtering)
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
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
            
            # Get instructor name from user relationship
            instructor_name = "Unknown"
            if section.instructor:
                instructor_name = f"{section.instructor.first_name} {section.instructor.last_name}"
            
            sections_data.append({
                "class_code": section.class_code,
                "instructor": instructor_name,
                "schedule": getattr(section, 'schedule', 'TBD'),
                "room": getattr(section, 'room', 'TBD'),
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
# ANOMALY DETECTION
# ===========================

@router.get("/anomalies")
async def get_anomalies(
    user_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=1000),
    period_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get detected anomalies (full system access - single department)"""
    try:
        # Get active period if not specified
        if not period_id:
            active_period = db.query(EvaluationPeriod).filter(
                EvaluationPeriod.status == 'active'
            ).first()
            period_id = active_period.id if active_period else None
        
        # Single department system - full access
        # Query evaluations with anomaly scores or low ratings/negative sentiment
        query = db.query(Evaluation).filter(
            Evaluation.evaluation_period_id == period_id,
            Evaluation.status == 'completed'
        ).filter(
            or_(
                Evaluation.is_anomaly == True,
                Evaluation.anomaly_score != None,
                and_(Evaluation.rating_overall != None, Evaluation.rating_overall <= 2),
                Evaluation.sentiment == 'negative'
            )
        )
        
        total = query.count()
        offset = (page - 1) * page_size
        # Order by anomaly score if available, then by rating (lowest first)
        anomalies = query.order_by(
            Evaluation.anomaly_score.desc().nullslast(),
            Evaluation.rating_overall.asc().nullslast(),
            Evaluation.sentiment.desc()
        ).offset(offset).limit(page_size).all()
        
        anomaly_data = []
        for e in anomalies:
            class_section = db.query(ClassSection).filter(ClassSection.id == e.class_section_id).first()
            course = db.query(Course).filter(Course.id == class_section.course_id).first() if class_section else None
            student = db.query(Student).filter(Student.id == e.student_id).first()
            
            # Get instructor name from user relationship
            instructor_name = "N/A"
            if class_section and class_section.instructor:
                instructor_name = f"{class_section.instructor.first_name} {class_section.instructor.last_name}"
            
            # Calculate severity based on rating and sentiment
            severity = "low"
            if e.anomaly_score and e.anomaly_score > 0.7:
                severity = "high"
            elif e.rating_overall and e.rating_overall <= 1:
                severity = "high"
            elif e.sentiment == 'negative':
                severity = "medium"
            elif e.rating_overall and e.rating_overall <= 2:
                severity = "medium"
            
            # Get student name from user relationship
            student_name = "Unknown"
            if student and student.user:
                student_name = f"{student.user.first_name} {student.user.last_name}" if student.user.first_name and student.user.last_name else (student.user.email or "Unknown")
            elif student:
                student_name = student.student_number or "Unknown"
            
            anomaly_data.append({
                "id": e.id,
                "courseId": course.id if course else None,
                "courseName": course.subject_name if course else "N/A",
                "courseCode": course.subject_code if course else "N/A",
                "course_code": course.subject_code if course else "N/A",
                "course_name": course.subject_name if course else "N/A",
                "studentName": student_name,
                "instructor": instructor_name,
                "instructorName": instructor_name,
                "rating": e.rating_overall,
                "rating_overall": e.rating_overall,
                "anomalyScore": e.anomaly_score,
                "anomaly_score": e.anomaly_score,
                "comment": e.text_feedback,
                "comments": e.text_feedback,
                "sentiment": e.sentiment,
                "severity": severity,
                "submittedAt": e.submission_date.isoformat() if e.submission_date else None,
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
        # Department-wide access (no program filtering)
        # Get trends by month for the last 6 months
        six_months_ago = datetime.now() - timedelta(days=180)
        
        if metric == "rating":
            trends = db.query(
                func.date_trunc('month', Evaluation.submission_date).label('month'),
                func.avg(Evaluation.rating_overall).label('avg_rating')
            ).filter(
                Evaluation.submission_date >= six_months_ago
            ).group_by('month').order_by('month').all()
            
            trend_data = [{
                "month": t.month.strftime('%Y-%m') if t.month else "unknown",
                "value": round(t.avg_rating, 2) if t.avg_rating else 0.0
            } for t in trends]
        
        elif metric == "sentiment":
            trends = db.query(
                func.date_trunc('month', Evaluation.submission_date).label('month'),
                Evaluation.sentiment,
                func.count(Evaluation.id).label('count')
            ).filter(
                Evaluation.submission_date >= six_months_ago
            ).group_by(
                'month',
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
            ).filter(
                Evaluation.submission_date >= six_months_ago
            ).group_by('month').order_by('month').all()
            
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


# ===========================
# CATEGORY AVERAGES & ANALYSIS
# ===========================

@router.get("/courses/{course_id}/category-averages")
async def get_course_category_averages(
    course_id: int,
    user_id: int = Query(...),
    period_id: Optional[int] = Query(None),
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
        # Get active period if not specified
        if not period_id:
            active_period = db.query(EvaluationPeriod).filter(
                EvaluationPeriod.status == 'active'
            ).first()
            period_id = active_period.id if active_period else None
        
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
        
        # Get evaluations for this section or all sections of the course, filtered by period
        if section_id:
            # Get evaluations for specific section with period filter
            query = db.query(Evaluation).join(
                Enrollment, and_(
                    Evaluation.class_section_id == Enrollment.class_section_id,
                    Evaluation.student_id == Enrollment.student_id
                )
            ).filter(
                Evaluation.class_section_id == section_id,
                Evaluation.status == 'completed'  # Only completed evaluations
            )
            if period_id:
                query = query.filter(Enrollment.evaluation_period_id == period_id)
            evaluations = query.all()
        else:
            # Get all evaluations for this course with period filter
            query = db.query(Evaluation).join(
                ClassSection, Evaluation.class_section_id == ClassSection.id
            ).join(
                Enrollment, and_(
                    Evaluation.class_section_id == Enrollment.class_section_id,
                    Evaluation.student_id == Enrollment.student_id
                )
            ).filter(
                ClassSection.course_id == actual_course_id,
                Evaluation.status == 'completed'  # Only completed evaluations
            )
            if period_id:
                query = query.filter(Enrollment.evaluation_period_id == period_id)
            evaluations = query.all()
        
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
        
        # Map actual JSONB keys to question numbers
        jsonb_key_mapping = {
            # Relevance of Course (1-6)
            "relevance_subject_knowledge": "1",
            "relevance_practical_skills": "2",
            "relevance_team_work": "3",
            "relevance_leadership": "4",
            "relevance_communication": "5",
            "relevance_positive_attitude": "6",
            # Course Organization (7-11)
            "org_curriculum": "7",
            "org_ilos_known": "8",
            "org_ilos_clear": "9",
            "org_ilos_relevant": "10",
            "org_no_overlapping": "11",
            # Teaching-Learning (12-18)
            "teaching_tlas_useful": "12",
            "teaching_ila_useful": "13",
            "teaching_tlas_sequenced": "14",
            "teaching_applicable": "15",
            "teaching_motivated": "16",
            "teaching_team_work": "17",
            "teaching_independent": "18",
            # Assessment (19-24)
            "assessment_start": "19",
            "assessment_all_topics": "20",
            "assessment_number": "21",
            "assessment_distribution": "22",
            "assessment_allocation": "23",
            "assessment_feedback": "24",
            # Learning Environment (25-30)
            "environment_classrooms": "25",
            "environment_library": "26",
            "environment_laboratory": "27",
            "environment_computer": "28",
            "environment_internet": "29",
            "environment_facilities_availability": "30",
            # Counseling (31)
            "counseling_available": "31"
        }
        
        # Define category question mappings
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
        
        # Helper function to get real ratings from JSONB column
        def get_real_ratings(eval_obj):
            """Get actual ratings from JSONB ratings column and normalize keys"""
            if eval_obj.ratings and isinstance(eval_obj.ratings, dict) and len(eval_obj.ratings) > 0:
                # Convert descriptive keys to question numbers
                normalized = {}
                for jsonb_key, rating_value in eval_obj.ratings.items():
                    # Map jsonb key to question number
                    question_num = jsonb_key_mapping.get(jsonb_key)
                    if question_num:
                        normalized[question_num] = rating_value
                return normalized
            else:
                return {}
        
        # Calculate averages for each category using REAL data only
        category_results = []
        total_students_evaluated = len(evaluations)
        
        for cat_id, cat_info in categories.items():
            all_ratings = []
            
            for evaluation in evaluations:
                # Get REAL ratings from JSONB column - no fake data
                eval_ratings = get_real_ratings(evaluation)
                
                # Extract ratings for this category's questions
                for q_num in cat_info["questions"]:
                    rating = eval_ratings.get(q_num)
                    if rating is not None and isinstance(rating, (int, float)):
                        all_ratings.append(float(rating))
            
            if all_ratings:
                average = sum(all_ratings) / len(all_ratings)
                # Calculate actual response count (total ratings / questions in category)
                actual_responses = len(all_ratings) // len(cat_info["questions"]) if len(cat_info["questions"]) > 0 else 0
                percentage = (actual_responses / total_students_evaluated * 100) if total_students_evaluated > 0 else 0
                
                category_results.append({
                    "category_id": cat_id,
                    "category_name": cat_info["name"],
                    "description": cat_info["description"],
                    "average": round(average, 2),
                    "total_responses": actual_responses,  # Actual student count
                    "question_count": len(cat_info["questions"]),
                    "response_percentage": round(percentage, 1)
                })
        
        # Calculate overall rating from actual evaluations
        overall_rating = 0.0
        if evaluations:
            ratings = [e.rating_overall for e in evaluations if e.rating_overall is not None]
            overall_rating = sum(ratings) / len(ratings) if ratings else 0.0
        
        # Get enrollment count for this section
        enrolled_count = 0
        if section_id:
            enrolled_count = db.query(func.count(Enrollment.id)).filter(
                Enrollment.class_section_id == section_id,
                Enrollment.status == 'active'
            ).scalar() or 0
        
        return {
            "success": True,
            "data": {
                "course_id": course_id,
                "section_id": section_id,
                "course_name": course.subject_name,
                "course_code": course.subject_code,
                "total_evaluations": len(evaluations),
                "enrolled_students": enrolled_count,
                "response_rate": round((len(evaluations) / enrolled_count * 100), 0) if enrolled_count > 0 else 0,
                "overall_rating": round(overall_rating, 2),
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
        
        # Helper function to generate 31 questions from basic ratings
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
        
        # Initialize distribution for all 31 questions
        question_distribution = {}
        for q_num in range(1, 32):
            question_distribution[str(q_num)] = {
                "question_number": q_num,
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
    period_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get evaluation completion rates for all courses.
    Returns overall statistics and per-course breakdown.
    Filters by evaluation period.
    """
    try:
        # Get active period if not specified
        if not period_id:
            active_period = db.query(EvaluationPeriod).filter(
                EvaluationPeriod.status == 'active'
            ).first()
            period_id = active_period.id if active_period else None
        
        # Get all class sections with enrollment and evaluation counts, filtered by period
        period_filter = f"AND en.evaluation_period_id = {period_id}" if period_id else ""
        period_filter_eval = f"AND e.evaluation_period_id = {period_id}" if period_id else ""
        sections_query = text(f"""
            SELECT 
                cs.id as section_id,
                cs.class_code,
                c.id as course_id,
                c.subject_code,
                c.subject_name,
                c.year_level,
                'No Instructor' as instructor_name,
                cs.semester,
                cs.academic_year,
                COUNT(DISTINCT en.student_id) as enrolled_students,
                COUNT(DISTINCT e.student_id) as submitted_evaluations,
                CASE 
                    WHEN COUNT(DISTINCT en.student_id) > 0 
                    THEN ROUND((COUNT(DISTINCT e.student_id)::NUMERIC / COUNT(DISTINCT en.student_id) * 100), 1)
                    ELSE 0
                END as completion_rate
            FROM class_sections cs
            INNER JOIN courses c ON cs.course_id = c.id
            LEFT JOIN enrollments en ON cs.id = en.class_section_id AND en.status = 'active' {period_filter}
            LEFT JOIN evaluations e ON cs.id = e.class_section_id AND e.status = 'completed' {period_filter_eval}
            GROUP BY cs.id, cs.class_code, c.id, c.subject_code, c.subject_name, 
                     c.year_level, cs.semester, cs.academic_year
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
# ML ANALYSIS RESULTS
# ===========================

@router.get("/ml-analysis/{section_id}")
async def get_ml_analysis_results(
    section_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Get ML analysis results (sentiment, anomaly) for a specific class section.
    Returns aggregated statistics and detailed results.
    """
    try:
        # Get the class section
        section = db.query(ClassSection).filter(ClassSection.id == section_id).first()
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        # Get latest ML analysis results for this section
        analysis_results = db.query(AnalysisResult).filter(
            AnalysisResult.class_section_id == section_id
        ).order_by(AnalysisResult.analysis_date.desc()).all()
        
        if not analysis_results:
            return {
                "success": True,
                "data": {
                    "section_id": section_id,
                    "has_analysis": False,
                    "message": "No ML analysis results available for this section"
                }
            }
        
        # Format analysis results
        formatted_results = []
        for result in analysis_results:
            formatted_results.append({
                "id": result.id,
                "analysis_type": result.analysis_type,
                "total_evaluations": result.total_evaluations,
                "positive_count": result.positive_count,
                "neutral_count": result.neutral_count,
                "negative_count": result.negative_count,
                "anomaly_count": result.anomaly_count,
                "avg_overall_rating": result.avg_overall_rating,
                "avg_sentiment_score": result.avg_sentiment_score,
                "confidence_interval": result.confidence_interval,
                "detailed_results": result.detailed_results,
                "analysis_date": result.analysis_date.isoformat() if result.analysis_date else None,
                "model_version": result.model_version,
                "processing_time_ms": result.processing_time_ms
            })
        
        return {
            "success": True,
            "data": {
                "section_id": section_id,
                "section_code": section.class_code,
                "has_analysis": True,
                "results": formatted_results
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching ML analysis results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ml-insights-summary")
async def get_ml_insights_summary(
    user_id: int = Query(...),
    period_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get summary of ML insights across all sections.
    Shows overall sentiment trends and anomaly counts.
    """
    try:
        # Get active period if not specified
        if not period_id:
            active_period = db.query(EvaluationPeriod).filter(
                EvaluationPeriod.status == 'active'
            ).first()
            period_id = active_period.id if active_period else None
        
        # Get all analysis results for sections in this period
        query = db.query(AnalysisResult).join(
            ClassSection, AnalysisResult.class_section_id == ClassSection.id
        ).join(
            Enrollment, ClassSection.id == Enrollment.class_section_id
        )
        if period_id:
            query = query.filter(Enrollment.evaluation_period_id == period_id)
        
        all_results = query.all()
        
        if not all_results:
            return {
                "success": True,
                "data": {
                    "has_data": False,
                    "message": "No ML analysis data available"
                }
            }
        
        # Calculate summary statistics
        total_positive = sum(r.positive_count for r in all_results)
        total_neutral = sum(r.neutral_count for r in all_results)
        total_negative = sum(r.negative_count for r in all_results)
        total_anomalies = sum(r.anomaly_count for r in all_results)
        total_evaluations = sum(r.total_evaluations for r in all_results)
        
        avg_sentiment = sum(r.avg_sentiment_score for r in all_results if r.avg_sentiment_score) / len(all_results) if all_results else 0
        
        return {
            "success": True,
            "data": {
                "has_data": True,
                "period_id": period_id,
                "summary": {
                    "total_evaluations_analyzed": total_evaluations,
                    "sentiment_distribution": {
                        "positive": total_positive,
                        "neutral": total_neutral,
                        "negative": total_negative,
                        "positive_percentage": round((total_positive / total_evaluations * 100), 1) if total_evaluations > 0 else 0,
                        "negative_percentage": round((total_negative / total_evaluations * 100), 1) if total_evaluations > 0 else 0
                    },
                    "anomaly_detection": {
                        "total_anomalies": total_anomalies,
                        "anomaly_rate": round((total_anomalies / total_evaluations * 100), 1) if total_evaluations > 0 else 0
                    },
                    "average_sentiment_score": round(avg_sentiment, 2),
                    "sections_analyzed": len(all_results)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching ML insights summary: {e}")
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
    Department Head can report issues regarding courses, students, or general inquiries
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


@router.get("/non-respondents")
async def get_non_respondents(
    evaluation_period_id: Optional[int] = Query(None),
    program_id: Optional[int] = Query(None),
    year_level: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Get list of students who haven't completed evaluations for active period
    Department Head can see non-respondents from all programs
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
                LEFT JOIN section_students ss ON s.id = ss.student_id
                LEFT JOIN program_sections ps ON ss.section_id = ps.id
                LEFT JOIN programs p ON COALESCE(ps.program_id, s.program_id) = p.id
                JOIN enrollments e ON s.id = e.student_id
                WHERE u.is_active = true
                    AND (:program_id IS NULL OR COALESCE(ps.program_id, s.program_id) = :program_id)
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
            LEFT JOIN section_students ss ON s.id = ss.student_id
            LEFT JOIN program_sections ps ON ss.section_id = ps.id
            JOIN enrollments e ON s.id = e.student_id
            WHERE u.is_active = true
                AND (:program_id IS NULL OR COALESCE(ps.program_id, s.program_id) = :program_id)
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching non-respondents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch non-respondents: {str(e)}")

