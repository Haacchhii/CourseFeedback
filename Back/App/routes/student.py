"""
Student Routes - Enhanced for Database Integration
Handles student-specific endpoints like courses and evaluations
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List, Dict, Any
import logging
from database.connection import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

class EvaluationSubmission(BaseModel):
    class_section_id: int
    student_id: int
    ratings: Dict[str, Any]
    comment: Optional[str] = None

@router.get("/{student_id}/courses")
async def get_student_courses(student_id: int, db: Session = Depends(get_db)):
    """Get all courses available to a specific student"""
    try:
        # First get student record to find user_id
        student_query = text("""
            SELECT s.id, s.student_number, s.program_id, s.year_level, s.user_id
            FROM students s
            WHERE s.id = :student_id OR s.user_id = :student_id
        """)
        
        student_result = db.execute(student_query, {"student_id": student_id})
        student_data = student_result.fetchone()
        
        if not student_data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        actual_student_id = student_data[0]  # Get the actual student table ID
        
        # Get enrolled courses for this student
        courses_result = db.execute(text("""
            SELECT DISTINCT
                c.id, c.subject_code, c.subject_name,
                cs.id as class_section_id, cs.class_code,
                cs.semester, cs.academic_year,
                p.program_name,
                u.first_name || ' ' || u.last_name as instructor_name,
                CASE 
                    WHEN e.id IS NOT NULL THEN true 
                    ELSE false 
                END as already_evaluated
            FROM enrollments enr
            JOIN class_sections cs ON enr.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            LEFT JOIN programs p ON c.program_id = p.id
            LEFT JOIN users u ON cs.instructor_id = u.id
            LEFT JOIN evaluations e ON cs.id = e.class_section_id AND e.student_id = :student_id
            WHERE enr.student_id = :student_id
            AND enr.status = 'active'
            ORDER BY c.subject_name
        """), {"student_id": actual_student_id})
        
        courses = []
        for row in courses_result:
            courses.append({
                "id": row[0],
                "code": row[1], 
                "name": row[2],
                "class_section_id": row[3],
                "class_code": row[4],
                "semester": row[5],
                "academic_year": row[6],
                "program_name": row[7] or "Unknown",
                "instructor_name": row[8] or "TBA",
                "already_evaluated": row[9]
            })
        
        return {
            "success": True,
            "data": courses,
            "student_info": {
                "student_number": student_data[1],
                "program_id": student_data[2],
                "year_level": student_data[3]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting student courses: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch student courses: {str(e)}")

@router.post("/evaluations")
async def submit_evaluation(evaluation: EvaluationSubmission, db: Session = Depends(get_db)):
    """
    Submit a course evaluation
    Rating Scale: 1 = Strongly Disagree, 2 = Disagree, 3 = Agree, 4 = Strongly Agree
    """
    try:
        # Verify class section exists
        class_section_result = db.execute(text("""
            SELECT cs.id, cs.class_code, c.subject_name
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            WHERE cs.id = :class_section_id
        """), {"class_section_id": evaluation.class_section_id})
        
        class_section_data = class_section_result.fetchone()
        if not class_section_data:
            raise HTTPException(status_code=404, detail="Class section not found")
        
        # Verify student exists
        student_result = db.execute(text("""
            SELECT id FROM students WHERE id = :student_id
        """), {"student_id": evaluation.student_id})
        
        if not student_result.fetchone():
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Check if student has already evaluated this class section
        existing_eval = db.execute(text("""
            SELECT id FROM evaluations 
            WHERE class_section_id = :class_section_id AND student_id = :student_id
        """), {
            "class_section_id": evaluation.class_section_id,
            "student_id": evaluation.student_id
        }).fetchone()
        
        if existing_eval:
            raise HTTPException(status_code=400, detail="Class section already evaluated")
        
        # Extract ratings (1-4 scale)
        ratings = evaluation.ratings
        rating_teaching = int(ratings.get('teaching', 0))
        rating_content = int(ratings.get('content', 0))
        rating_engagement = int(ratings.get('engagement', 0))
        rating_overall = int(ratings.get('overall', 0))
        
        # Validate ratings are in 1-4 range
        for rating in [rating_teaching, rating_content, rating_engagement, rating_overall]:
            if not (1 <= rating <= 4):
                raise HTTPException(status_code=400, detail="Ratings must be between 1 and 4")
        
        # Insert evaluation (ML processing will be done separately)
        db.execute(text("""
            INSERT INTO evaluations (
                student_id, class_section_id,
                rating_teaching, rating_content, rating_engagement, rating_overall,
                text_feedback, suggestions,
                processing_status, submission_date
            ) VALUES (
                :student_id, :class_section_id,
                :rating_teaching, :rating_content, :rating_engagement, :rating_overall,
                :text_feedback, :suggestions,
                'pending', NOW()
            )
        """), {
            "student_id": evaluation.student_id,
            "class_section_id": evaluation.class_section_id,
            "rating_teaching": rating_teaching,
            "rating_content": rating_content,
            "rating_engagement": rating_engagement,
            "rating_overall": rating_overall,
            "text_feedback": evaluation.comment or "",
            "suggestions": ""
        })
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Evaluation submitted successfully for {class_section_data.subject_name}",
            "data": {
                "class_section_id": evaluation.class_section_id,
                "ratings": {
                    "teaching": rating_teaching,
                    "content": rating_content,
                    "engagement": rating_engagement,
                    "overall": rating_overall
                },
                "submitted_at": "now"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting evaluation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to submit evaluation")

@router.get("/{student_id}/evaluations")  
async def get_student_evaluations(student_id: int, db: Session = Depends(get_db)):
    """Get all evaluations submitted by a student"""
    try:
        result = db.execute(text("""
            SELECT 
                e.id, e.rating_teaching, e.rating_content, e.rating_engagement, e.rating_overall,
                e.text_feedback, e.submission_date,
                e.sentiment, e.sentiment_score, e.is_anomaly,
                c.subject_name, c.subject_code, cs.class_code,
                u.first_name || ' ' || u.last_name as instructor_name
            FROM evaluations e
            JOIN class_sections cs ON e.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            LEFT JOIN users u ON cs.instructor_id = u.id
            WHERE e.student_id = :student_id
            ORDER BY e.submission_date DESC
        """), {"student_id": student_id})
        
        evaluations = []
        for row in result:
            evaluations.append({
                "id": row[0],
                "ratings": {
                    "teaching": row[1],
                    "content": row[2],
                    "engagement": row[3],
                    "overall": row[4]
                },
                "text_feedback": row[5],
                "submission_date": row[6].isoformat() if row[6] else None,
                "sentiment": row[7],
                "sentiment_score": row[8],
                "is_anomaly": row[9],
                "course_name": row[10],
                "course_code": row[11],
                "class_code": row[12],
                "instructor_name": row[13] or "TBA"
            })
        
        return {
            "success": True,
            "data": evaluations
        }
        
    except Exception as e:
        logger.error(f"Error getting student evaluations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch evaluations")

@router.get("/courses/{course_id}")
async def get_course_details(course_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific course"""
    try:
        result = db.execute(text("""
            SELECT 
                c.id, c.code, c.name, c.description, c.credits,
                c.semester, c.academic_year,
                d.name as department_name,
                COUNT(e.id) as evaluation_count,
                AVG(e.rating) as average_rating
            FROM courses c
            LEFT JOIN departments d ON c.department_id = d.id
            LEFT JOIN evaluations e ON c.id = e.course_id
            WHERE c.id = :course_id
            GROUP BY c.id, c.code, c.name, c.description, c.credits, 
                     c.semester, c.academic_year, d.name
        """), {"course_id": course_id})
        
        course_data = result.fetchone()
        if not course_data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return {
            "success": True,
            "data": {
                "id": course_data[0],
                "code": course_data[1],
                "name": course_data[2],
                "description": course_data[3] or "",
                "credits": course_data[4],
                "semester": course_data[5],
                "academic_year": course_data[6],
                "department_name": course_data[7] or "Unknown",
                "evaluation_count": course_data[8] or 0,
                "average_rating": round(float(course_data[9]), 1) if course_data[9] else 0.0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting course details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch course details")