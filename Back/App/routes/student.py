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
    course_id: int
    ratings: Dict[str, Any]
    comment: Optional[str] = None

@router.get("/student/{student_id}/courses")
async def get_student_courses(student_id: int, db: Session = Depends(get_db)):
    """Get all courses available to a specific student"""
    try:
        # First verify student exists
        student_result = db.execute(text("""
            SELECT s.id, s.program, s.year_level, s.first_name, s.last_name
            FROM students s
            WHERE s.id = :student_id
        """), {"student_id": student_id})
        
        student_data = student_result.fetchone()
        if not student_data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get courses for this student's program and year level
        courses_result = db.execute(text("""
            SELECT 
                c.id, c.code, c.name, c.description, c.credits,
                c.semester, c.academic_year,
                d.name as department_name,
                CASE 
                    WHEN e.id IS NOT NULL THEN true 
                    ELSE false 
                END as already_evaluated
            FROM courses c
            LEFT JOIN departments d ON c.department_id = d.id
            LEFT JOIN evaluations e ON c.id = e.course_id AND e.student_id = :student_id
            WHERE c.semester = '1st Semester' AND c.academic_year = '2024-2025'
            ORDER BY c.name
        """), {"student_id": student_id})
        
        courses = []
        for row in courses_result:
            courses.append({
                "id": row[0],
                "code": row[1], 
                "name": row[2],
                "description": row[3] or "",
                "credits": row[4],
                "semester": row[5],
                "academic_year": row[6],
                "department_name": row[7] or "Unknown",
                "already_evaluated": row[8],
                "instructor": "TBA",  # Will be enhanced later
                "program": student_data[1],
                "yearLevel": student_data[2]
            })
        
        return {
            "success": True,
            "data": courses,
            "student_info": {
                "name": f"{student_data[3]} {student_data[4]}",
                "program": student_data[1],
                "year_level": student_data[2]
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting student courses: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch student courses")

@router.post("/student/evaluations")
async def submit_evaluation(evaluation: EvaluationSubmission, db: Session = Depends(get_db)):
    """Submit a course evaluation"""
    try:
        # Verify course exists
        course_result = db.execute(text("""
            SELECT id, name FROM courses WHERE id = :course_id
        """), {"course_id": evaluation.course_id})
        
        course_data = course_result.fetchone()
        if not course_data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # For now, we'll use a default student ID of 1
        # In a real application, this would come from authentication
        student_id = 1
        
        # Check if student has already evaluated this course
        existing_eval = db.execute(text("""
            SELECT id FROM evaluations 
            WHERE course_id = :course_id AND student_id = :student_id
        """), {
            "course_id": evaluation.course_id,
            "student_id": student_id
        }).fetchone()
        
        if existing_eval:
            raise HTTPException(status_code=400, detail="Course already evaluated")
        
        # Calculate overall rating from individual ratings
        ratings = evaluation.ratings
        total_rating = sum([
            int(ratings.get('teaching_effectiveness', 0)),
            int(ratings.get('course_content', 0)), 
            int(ratings.get('learning_environment', 0)),
            int(ratings.get('assessment_methods', 0)),
            int(ratings.get('instructor_knowledge', 0))
        ])
        average_rating = round(total_rating / 5, 1) if total_rating > 0 else 0
        
        # Insert evaluation
        db.execute(text("""
            INSERT INTO evaluations (
                student_id, course_id, rating, comment, 
                teaching_effectiveness, course_content, learning_environment,
                assessment_methods, instructor_knowledge, created_at
            ) VALUES (
                :student_id, :course_id, :rating, :comment,
                :teaching_effectiveness, :course_content, :learning_environment,
                :assessment_methods, :instructor_knowledge, NOW()
            )
        """), {
            "student_id": student_id,
            "course_id": evaluation.course_id,
            "rating": average_rating,
            "comment": evaluation.comment or "",
            "teaching_effectiveness": int(ratings.get('teaching_effectiveness', 0)),
            "course_content": int(ratings.get('course_content', 0)),
            "learning_environment": int(ratings.get('learning_environment', 0)),
            "assessment_methods": int(ratings.get('assessment_methods', 0)),
            "instructor_knowledge": int(ratings.get('instructor_knowledge', 0))
        })
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Evaluation submitted successfully for {course_data[1]}",
            "data": {
                "course_id": evaluation.course_id,
                "overall_rating": average_rating,
                "submitted_at": "now"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting evaluation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to submit evaluation")

@router.get("/student/{student_id}/evaluations")  
async def get_student_evaluations(student_id: int, db: Session = Depends(get_db)):
    """Get all evaluations submitted by a student"""
    try:
        result = db.execute(text("""
            SELECT 
                e.id, e.rating, e.comment, e.created_at,
                c.name as course_name, c.code as course_code,
                e.teaching_effectiveness, e.course_content, 
                e.learning_environment, e.assessment_methods, e.instructor_knowledge
            FROM evaluations e
            LEFT JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = :student_id
            ORDER BY e.created_at DESC
        """), {"student_id": student_id})
        
        evaluations = []
        for row in result:
            evaluations.append({
                "id": row[0],
                "overall_rating": row[1],
                "comment": row[2],
                "created_at": row[3].isoformat() if row[3] else None,
                "course_name": row[4],
                "course_code": row[5], 
                "detailed_ratings": {
                    "teaching_effectiveness": row[6],
                    "course_content": row[7],
                    "learning_environment": row[8],
                    "assessment_methods": row[9],
                    "instructor_knowledge": row[10]
                }
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