"""
Instructor Routes for Course Feedback System
Handles instructor operations including:
- View dashboard with teaching stats
- View assigned courses/sections
- View received evaluations
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.connection import get_db
from models.enhanced_models import User, Instructor, ClassSection, Evaluation, Course
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ===========================
# DASHBOARD
# ===========================

@router.get("/dashboard")
async def get_instructor_dashboard(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get instructor dashboard overview"""
    try:
        # Get instructor info
        instructor = db.query(Instructor).filter(Instructor.user_id == user_id).first()
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        # Get class sections taught by this instructor
        sections = db.query(ClassSection).filter(
            ClassSection.instructor_id == user_id
        ).all()
        
        section_ids = [s.id for s in sections]
        
        # Get statistics
        total_sections = len(sections)
        total_evaluations = 0
        avg_rating = 0.0
        
        if section_ids:
            total_evaluations = db.query(func.count(Evaluation.id)).filter(
                Evaluation.class_section_id.in_(section_ids)
            ).scalar() or 0
            
            avg_rating = db.query(func.avg(Evaluation.rating_overall)).filter(
                Evaluation.class_section_id.in_(section_ids)
            ).scalar() or 0.0
            
            # Sentiment breakdown
            sentiment_counts = db.query(
                Evaluation.sentiment,
                func.count(Evaluation.id)
            ).filter(
                Evaluation.class_section_id.in_(section_ids)
            ).group_by(Evaluation.sentiment).all()
            
            sentiment = {
                "positive": 0,
                "neutral": 0,
                "negative": 0
            }
            for label, count in sentiment_counts:
                if label:
                    sentiment[label.lower()] = count
        else:
            sentiment = {"positive": 0, "neutral": 0, "negative": 0}
        
        return {
            "success": True,
            "data": {
                "total_sections": total_sections,
                "total_evaluations": total_evaluations,
                "avg_rating": float(avg_rating) if avg_rating else 0.0,
                "sentiment": sentiment,
                "instructor_name": instructor.name,
                "department": instructor.department or "N/A"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching instructor dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# COURSES
# ===========================

@router.get("/courses")
async def get_instructor_courses(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get courses taught by instructor"""
    try:
        instructor = db.query(Instructor).filter(Instructor.user_id == user_id).first()
        if not instructor:
            # Return empty instead of 404 to prevent frontend crashes
            return {
                "success": True,
                "data": []
            }
        
        # Get class sections with course info
        sections = db.query(ClassSection, Course).join(
            Course, ClassSection.course_id == Course.id
        ).filter(
            ClassSection.instructor_id == user_id
        ).all()
        
        # Return empty if no sections
        if not sections:
            return {
                "success": True,
                "data": []
            }
        
        courses_data = []
        for section, course in sections:
            # Get evaluation count for this section
            eval_count = db.query(func.count(Evaluation.id)).filter(
                Evaluation.class_section_id == section.id
            ).scalar() or 0
            
            courses_data.append({
                "section_id": section.id,
                "class_code": section.class_code if section.class_code else "Unknown",
                "course_code": course.subject_code if course and course.subject_code else "Unknown",
                "course_name": course.subject_name if course and course.subject_name else "Unknown",
                "semester": section.semester if section.semester else "Unknown",
                "academic_year": section.academic_year if section.academic_year else "Unknown",
                "evaluations_count": eval_count
            })
        
        return {
            "success": True,
            "data": courses_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching instructor courses: {e}")
        # Return empty data instead of crashing
        return {
            "success": True,
            "data": [],
            "error": str(e)
        }

# ===========================
# EVALUATIONS
# ===========================

@router.get("/evaluations")
async def get_instructor_evaluations(
    user_id: int = Query(...),
    class_section_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get evaluations for instructor's courses"""
    try:
        instructor = db.query(Instructor).filter(Instructor.user_id == user_id).first()
        if not instructor:
            # Return empty instead of 404 to prevent frontend crashes
            return {
                "success": True,
                "data": []
            }
        
        # Base query with defensive programming
        query = db.query(Evaluation, ClassSection, Course).join(
            ClassSection, Evaluation.class_section_id == ClassSection.id
        ).join(
            Course, ClassSection.course_id == Course.id
        ).filter(
            ClassSection.instructor_id == user_id
        )
        
        # Filter by specific section if provided
        if class_section_id:
            query = query.filter(ClassSection.id == class_section_id)
        
        results = query.all()
        
        # Return empty array if no results (defensive programming)
        if not results:
            return {
                "success": True,
                "data": []
            }
        
        evaluations_data = []
        for evaluation, section, course in results:
            evaluations_data.append({
                "id": evaluation.id,
                "class_code": section.class_code if section else "Unknown",
                "course_name": course.subject_name if course else "Unknown",
                "overall_rating": evaluation.rating_overall if evaluation.rating_overall else 0,
                "sentiment": evaluation.sentiment or "neutral",
                "text_feedback": evaluation.text_feedback or "",
                "submission_date": evaluation.submission_date.isoformat() if evaluation.submission_date else None
            })
        
        return {
            "success": True,
            "data": evaluations_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching instructor evaluations: {e}")
        # Return empty data instead of crashing
        return {
            "success": True,
            "data": [],
            "error": str(e)
        }

# ===========================
# SENTIMENT ANALYSIS
# ===========================

@router.get("/sentiment-analysis")
async def get_sentiment_analysis(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get sentiment analysis for instructor's evaluations"""
    try:
        instructor = db.query(Instructor).filter(Instructor.user_id == user_id).first()
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        # Get class sections taught by this instructor
        sections = db.query(ClassSection).filter(
            ClassSection.instructor_id == user_id
        ).all()
        
        section_ids = [s.id for s in sections]
        
        if not section_ids:
            return {
                "success": True,
                "data": {
                    "trends": [],
                    "overall": {"positive": 0, "neutral": 0, "negative": 0}
                }
            }
        
        # Get sentiment distribution
        sentiment_counts = db.query(
            Evaluation.sentiment,
            func.count(Evaluation.id)
        ).filter(
            Evaluation.class_section_id.in_(section_ids)
        ).group_by(Evaluation.sentiment).all()
        
        overall_sentiment = {
            "positive": 0,
            "neutral": 0,
            "negative": 0
        }
        for sentiment, count in sentiment_counts:
            if sentiment:
                overall_sentiment[sentiment.lower()] = count
        
        # Get sentiment trends over time
        from datetime import datetime, timedelta
        now = datetime.now()
        start_date = now - timedelta(days=30)  # Last 30 days
        
        trends = db.query(
            func.date_trunc('day', Evaluation.submission_date).label('date'),
            Evaluation.sentiment,
            func.count(Evaluation.id).label('count')
        ).filter(
            Evaluation.class_section_id.in_(section_ids),
            Evaluation.submission_date >= start_date
        ).group_by(
            func.date_trunc('day', Evaluation.submission_date),
            Evaluation.sentiment
        ).order_by('date').all()
        
        # Format trends data
        sentiment_trends = {}
        for date, sentiment, count in trends:
            date_str = date.strftime('%Y-%m-%d') if date else "unknown"
            if date_str not in sentiment_trends:
                sentiment_trends[date_str] = {"positive": 0, "neutral": 0, "negative": 0}
            if sentiment:
                sentiment_trends[date_str][sentiment.lower()] = count
        
        trend_data = [
            {"date": date, **sentiments}
            for date, sentiments in sentiment_trends.items()
        ]
        
        return {
            "success": True,
            "data": {
                "trends": trend_data,
                "overall": overall_sentiment
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sentiment analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# ANOMALIES
# ===========================

@router.get("/anomalies")
async def get_anomalies(
    user_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get detected anomalies in instructor's evaluations"""
    try:
        instructor = db.query(Instructor).filter(Instructor.user_id == user_id).first()
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        # Get class sections taught by this instructor
        sections = db.query(ClassSection).filter(
            ClassSection.instructor_id == user_id
        ).all()
        
        section_ids = [s.id for s in sections]
        
        if not section_ids:
            return {
                "success": True,
                "data": []
            }
        
        # Query anomalous evaluations
        query = db.query(Evaluation).filter(
            Evaluation.class_section_id.in_(section_ids),
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
                "course_code": course.subject_code if course else "N/A",
                "course_name": course.subject_name if course else "N/A",
                "class_code": class_section.class_code if class_section else "N/A",
                "rating_overall": e.rating_overall,
                "anomaly_score": e.anomaly_score,
                "text_feedback": e.text_feedback,
                "sentiment": e.sentiment,
                "submission_date": e.submission_date.isoformat() if e.submission_date else None
            })
        
        return {
            "success": True,
            "data": anomaly_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# QUESTIONS
# ===========================

@router.get("/questions")
async def get_evaluation_questions(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get evaluation questions (read-only for instructors)"""
    try:
        instructor = db.query(Instructor).filter(Instructor.user_id == user_id).first()
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        # Note: EvaluationQuestionSet and EvaluationQuestion models don't exist yet
        # Return empty data for now - this feature is not yet implemented
        return {
            "success": True,
            "data": []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching evaluation questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# FILTER OPTIONS
# ===========================

@router.get("/programs")
async def get_programs(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get list of programs for filtering"""
    try:
        from models.enhanced_models import Program
        
        instructor = db.query(Instructor).filter(Instructor.user_id == user_id).first()
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        # Get all programs
        programs = db.query(Program).all()
        
        programs_data = [{
            "id": p.id,
            "program_code": p.program_code,
            "program_name": p.program_name
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
        instructor = db.query(Instructor).filter(Instructor.user_id == user_id).first()
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
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
