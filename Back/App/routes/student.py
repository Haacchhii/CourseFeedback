"""
Student Routes - Enhanced for Database Integration
Handles student-specific endpoints like courses and evaluations
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import logging
from database.connection import get_db
from ml_services.sentiment_analyzer import SentimentAnalyzer
from ml_services.anomaly_detector import AnomalyDetector

logger = logging.getLogger(__name__)
router = APIRouter()

# Helper function for rating-based sentiment (fallback when ML not available)
def _rating_based_sentiment(avg_rating: float) -> tuple:
    """
    Calculate sentiment based on average rating (fallback method)
    Args:
        avg_rating: Average rating value (1-4 scale)
    Returns:
        Tuple of (sentiment, confidence_score)
    """
    if avg_rating >= 3.5:
        sentiment = "positive"
        sentiment_score = 0.8 + (avg_rating - 3.5) * 0.4  # 0.8 to 1.0
    elif avg_rating >= 2.5:
        sentiment = "neutral"
        sentiment_score = 0.4 + (avg_rating - 2.5) * 0.4  # 0.4 to 0.8
    else:
        sentiment = "negative"
        sentiment_score = (avg_rating - 1.0) * 0.267  # 0.0 to 0.4
    
    return sentiment, sentiment_score

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
                "student_id": actual_student_id,  # Add the actual student table ID
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
        
        # Verify student exists - accept either student.id or user.id
        student_result = db.execute(text("""
            SELECT s.id FROM students s
            WHERE s.id = :student_id OR s.user_id = :student_id
        """), {"student_id": evaluation.student_id})
        
        student_data = student_result.fetchone()
        if not student_data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        actual_student_id = student_data[0]  # Use the actual student table ID
        
        # Check if student has already evaluated this class section
        existing_eval = db.execute(text("""
            SELECT id FROM evaluations 
            WHERE class_section_id = :class_section_id AND student_id = :student_id
        """), {
            "class_section_id": evaluation.class_section_id,
            "student_id": actual_student_id
        }).fetchone()
        
        if existing_eval:
            raise HTTPException(status_code=400, detail="Class section already evaluated")
        
        # Extract ratings from the comprehensive 21-question evaluation
        # The ratings dict contains all question IDs as keys with 1-4 scale values
        ratings = evaluation.ratings
        
        # Validate that we have ratings data
        if not ratings or len(ratings) == 0:
            raise HTTPException(status_code=400, detail="No ratings provided")
        
        # Validate all ratings are in 1-4 range
        rating_values = list(ratings.values())
        for rating_val in rating_values:
            if not isinstance(rating_val, (int, float)) or not (1 <= rating_val <= 4):
                raise HTTPException(status_code=400, detail="All ratings must be between 1 and 4")
        
        # Calculate average rating for sentiment analysis
        avg_rating = sum(rating_values) / len(rating_values)
        
        # === ML-BASED SENTIMENT ANALYSIS ===
        # Use SVM classifier if available, otherwise fall back to rating-based
        try:
            sentiment_analyzer = SentimentAnalyzer()
            # Try to load pre-trained model
            try:
                from pathlib import Path
                model_path = Path(__file__).parent.parent / "ml_services" / "models" / "svm_sentiment_model.pkl"
                if model_path.exists():
                    sentiment_analyzer.load_model(str(model_path))
                    # Use ML prediction on text feedback
                    if evaluation.comment and evaluation.comment.strip():
                        sentiment, sentiment_score = sentiment_analyzer.predict(evaluation.comment)
                        logger.info(f"ML sentiment: {sentiment} ({sentiment_score:.3f})")
                    else:
                        # No text feedback, use rating-based
                        sentiment, sentiment_score = _rating_based_sentiment(avg_rating)
                        logger.info("Using rating-based sentiment (no text feedback)")
                else:
                    # Model not trained yet, use placeholder
                    sentiment, sentiment_score = _rating_based_sentiment(avg_rating)
                    logger.warning("ML model not found, using rating-based sentiment")
            except Exception as e:
                logger.error(f"Error loading ML model: {e}")
                sentiment, sentiment_score = _rating_based_sentiment(avg_rating)
        except Exception as e:
            logger.error(f"Error initializing sentiment analyzer: {e}")
            sentiment, sentiment_score = _rating_based_sentiment(avg_rating)
        
        # === ANOMALY DETECTION ===
        # Use DBSCAN to detect suspicious evaluation patterns
        try:
            anomaly_detector = AnomalyDetector()
            is_anomaly, anomaly_score, anomaly_reason = anomaly_detector.detect(ratings)
            logger.info(f"Anomaly detection: {is_anomaly} (score: {anomaly_score:.3f})")
        except Exception as e:
            logger.error(f"Error in anomaly detection: {e}")
            is_anomaly, anomaly_score, anomaly_reason = False, 0.0, ""
        
        # Prepare metadata for tracking
        metadata = {
            "submission_timestamp": str(datetime.now()),
            "total_questions": len(ratings),
            "average_rating": round(avg_rating, 2),
            "ml_sentiment_used": sentiment_analyzer.is_trained if 'sentiment_analyzer' in locals() else False,
            "anomaly_detected": is_anomaly
        }
        
        # Insert evaluation - only required columns
        db.execute(text("""
            INSERT INTO evaluations (
                student_id, 
                class_section_id,
                sentiment
            ) VALUES (
                :student_id, 
                :class_section_id,
                :sentiment
            )
        """), {
            "student_id": actual_student_id,
            "class_section_id": evaluation.class_section_id,
            "sentiment": sentiment
        })
        
        db.commit()
        
        # === SEND EMAIL CONFIRMATION (Optional) ===
        try:
            from services.email_service import email_service
            
            # Get student user info
            user_result = db.execute(text("""
                SELECT u.email, u.first_name, u.last_name
                FROM users u
                JOIN students s ON s.user_id = u.id
                WHERE s.id = :student_id
            """), {"student_id": actual_student_id}).fetchone()
            
            if user_result and user_result.email and email_service.enabled:
                student_name = f"{user_result.first_name} {user_result.last_name}"
                email_service.send_evaluation_submitted_confirmation(
                    to_email=user_result.email,
                    student_name=student_name,
                    course_name=class_section_data.subject_name,
                    submission_date=datetime.now().strftime("%B %d, %Y at %I:%M %p")
                )
                logger.info(f"Confirmation email sent to {user_result.email}")
        except Exception as e:
            # Don't fail the evaluation if email fails
            logger.warning(f"Failed to send confirmation email: {e}")
        
        return {
            "success": True,
            "message": f"Evaluation submitted successfully for {class_section_data.subject_name}",
            "data": {
                "class_section_id": evaluation.class_section_id,
                "ratings": ratings,
                "average_rating": round(avg_rating, 2),
                "sentiment": sentiment,
                "sentiment_score": round(sentiment_score, 3),
                "total_questions": len(ratings),
                "anomaly_detected": is_anomaly,
                "ml_powered": metadata["ml_sentiment_used"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting evaluation: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit evaluation: {str(e)}")


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
                c.id, c.subject_code, c.subject_name,
                c.semester, c.year_level, c.units,
                p.program_name,
                COUNT(DISTINCT e.id) as evaluation_count,
                AVG(
                    (e.ratings::jsonb->>'1')::numeric + 
                    (e.ratings::jsonb->>'2')::numeric + 
                    (e.ratings::jsonb->>'3')::numeric +
                    (e.ratings::jsonb->>'4')::numeric +
                    (e.ratings::jsonb->>'5')::numeric +
                    (e.ratings::jsonb->>'6')::numeric +
                    (e.ratings::jsonb->>'7')::numeric +
                    (e.ratings::jsonb->>'8')::numeric +
                    (e.ratings::jsonb->>'9')::numeric +
                    (e.ratings::jsonb->>'10')::numeric +
                    (e.ratings::jsonb->>'11')::numeric +
                    (e.ratings::jsonb->>'12')::numeric +
                    (e.ratings::jsonb->>'13')::numeric +
                    (e.ratings::jsonb->>'14')::numeric +
                    (e.ratings::jsonb->>'15')::numeric +
                    (e.ratings::jsonb->>'16')::numeric +
                    (e.ratings::jsonb->>'17')::numeric +
                    (e.ratings::jsonb->>'18')::numeric +
                    (e.ratings::jsonb->>'19')::numeric +
                    (e.ratings::jsonb->>'20')::numeric +
                    (e.ratings::jsonb->>'21')::numeric
                ) / 21.0 as average_rating
            FROM courses c
            LEFT JOIN programs p ON c.program_id = p.id
            LEFT JOIN class_sections cs ON cs.course_id = c.id
            LEFT JOIN evaluations e ON e.class_section_id = cs.id
            WHERE c.id = :course_id
            GROUP BY c.id, c.subject_code, c.subject_name, c.semester, 
                     c.year_level, c.units, p.program_name
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
                "semester": course_data[3],
                "year_level": course_data[4],
                "credits": course_data[5],
                "program_name": course_data[6] or "Unknown",
                "evaluation_count": course_data[7] or 0,
                "average_rating": round(float(course_data[8]), 2) if course_data[8] else 0.0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting course details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch course details")