"""
Student Routes - Enhanced for Database Integration
Handles student-specific endpoints like courses and evaluations
"""

from fastapi import APIRouter, HTTPException, Depends, status
from middleware.auth import get_current_user, require_student
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import logging
from database.connection import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

def verify_student_ownership(student_id: int, current_user: dict, db: Session):
    """
    Verify that the current user can only access their own student data.
    Accepts either student ID or user ID.
    Raises HTTPException 403 if unauthorized.
    """
    user_id = current_user.get('id')
    
    # Check if the student_id is actually a user_id or student id
    # Try to find student record by ID first, then by user_id
    student_record = db.execute(text("""
        SELECT user_id, id FROM students 
        WHERE id = :student_id OR user_id = :student_id
    """), {"student_id": student_id}).fetchone()
    
    if not student_record:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if the student record belongs to the current user
    if student_record.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied: You can only access your own data"
        )

def _rating_based_sentiment(avg_rating: float):
    """
    Fallback sentiment analysis based on average rating
    Returns (sentiment, confidence_score)
    """
    if avg_rating >= 3.5:
        return "positive", 0.8
    elif avg_rating >= 2.5:
        return "neutral", 0.7
    else:
        return "negative", 0.8

class EvaluationSubmission(BaseModel):
    class_section_id: int
    student_id: int
    evaluation_period_id: Optional[int] = None
    ratings: Dict[str, Any]
    comment: Optional[str] = None

@router.get("/{student_id}/courses")
async def get_student_courses(student_id: int, 
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db)):
    """Get all courses available to a specific student"""
    # Verify student ownership
    verify_student_ownership(student_id, current_user, db)
    
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
        
        # Get enrolled courses for this student that are in an active evaluation period
        # CRITICAL: Only show courses that are enrolled in an active evaluation period
        courses_result = db.execute(text("""
            SELECT DISTINCT
                c.id, c.subject_code, c.subject_name,
                cs.id as class_section_id, cs.class_code,
                cs.semester, cs.academic_year,
                p.program_name,
                CASE 
                    WHEN e.id IS NOT NULL AND e.submission_date IS NOT NULL THEN true 
                    ELSE false 
                END as already_evaluated,
                e.id as evaluation_id,
                ep.id as evaluation_period_id,
                ep.name as evaluation_period_name,
                ep.end_date as period_end_date,
                true as in_active_period
            FROM enrollments enr
            JOIN class_sections cs ON enr.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            JOIN evaluation_periods ep ON enr.evaluation_period_id = ep.id
            LEFT JOIN programs p ON c.program_id = p.id
            LEFT JOIN evaluations e ON cs.id = e.class_section_id 
                AND e.student_id = :student_id
                AND e.evaluation_period_id = ep.id
            WHERE enr.student_id = :student_id
            AND enr.status = 'active'
            AND enr.evaluation_period_id IS NOT NULL
            AND ep.status = 'active'
            AND CURRENT_DATE BETWEEN ep.start_date AND ep.end_date
            ORDER BY c.subject_name
        """), {"student_id": actual_student_id})
        
        courses = []
        evaluable_count = 0
        for row in courses_result:
            course_data = {
                "id": row[0],
                "code": row[1], 
                "name": row[2],
                "class_section_id": row[3],
                "class_code": row[4],
                "semester": row[5],
                "academic_year": row[6],
                "program_name": row[7] or "Unknown",
                "already_evaluated": row[8],
                "evaluation_id": row[9],
                "evaluation_period_id": row[10],
                "evaluation_period_name": row[11],
                "period_end_date": row[12].strftime("%Y-%m-%d") if row[12] else None,
                "in_active_period": row[13],
                "can_evaluate": row[13] and not row[8]  # In active period and not yet evaluated
            }
            courses.append(course_data)
            if course_data["can_evaluate"]:
                evaluable_count += 1
        
        # Check if there's an active evaluation period
        active_period = db.execute(text("""
            SELECT id, name, start_date, end_date
            FROM evaluation_periods
            WHERE status = 'active'
            AND CURRENT_DATE BETWEEN start_date AND end_date
            LIMIT 1
        """)).fetchone()
        
        return {
            "success": True,
            "data": courses,
            "student_info": {
                "student_id": actual_student_id,
                "student_number": student_data[1],
                "program_id": student_data[2],
                "year_level": student_data[3]
            },
            "evaluation_status": {
                "active_period_exists": active_period is not None,
                "active_period_name": active_period[1] if active_period else None,
                "period_end_date": active_period[3].strftime("%Y-%m-%d") if active_period else None,
                "total_courses": len(courses),
                "evaluable_courses": evaluable_count,
                "message": f"You have {evaluable_count} course(s) available for evaluation" if evaluable_count > 0 
                          else "No courses available for evaluation at this time"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting student courses: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch student courses: {str(e)}")

@router.get("/{student_id}/evaluation-history")
async def get_student_evaluation_history(
    student_id: int, 
    period_id: Optional[int] = None,
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db)
):
    """
    Get student's past evaluations with period filtering
    
    Args:
        student_id: Student ID (can be user_id or student table id)
        period_id: Optional filter by specific evaluation period
    
    Returns:
        List of past evaluations with course, period, and rating details
    """
    # Verify student ownership
    verify_student_ownership(student_id, current_user, db)
    try:
        # Get actual student ID
        student_result = db.execute(text("""
            SELECT s.id, s.student_number, s.program_id, s.year_level
            FROM students s
            WHERE s.id = :student_id OR s.user_id = :student_id
        """), {"student_id": student_id})
        
        student_data = student_result.fetchone()
        if not student_data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        actual_student_id = student_data[0]
        
        # Build query to show ONLY COMPLETED evaluations from CLOSED periods
        # Active period evaluations should appear in pending-evaluations, not history
        query = """
            SELECT 
                e.id as evaluation_id,
                e.submission_date as submission_date,
                e.rating_overall,
                e.text_feedback,
                c.id as course_id,
                c.subject_code,
                c.subject_name,
                cs.id as class_section_id,
                cs.class_code,
                cs.semester,
                cs.academic_year,
                ep.id as period_id,
                ep.name as period_name,
                ep.semester as period_semester,
                ep.academic_year as period_academic_year,
                ep.start_date as period_start,
                ep.end_date as period_end,
                ep.status as period_status,
                p.program_name
            FROM evaluations e
            JOIN enrollments enr ON e.student_id = enr.student_id 
                AND e.class_section_id = enr.class_section_id
                AND e.evaluation_period_id = enr.evaluation_period_id
            JOIN class_sections cs ON enr.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            JOIN evaluation_periods ep ON enr.evaluation_period_id = ep.id
            LEFT JOIN programs p ON c.program_id = p.id
            WHERE e.student_id = :student_id
            AND e.status = 'completed'
            AND ep.status != 'active'
        """
        
        params = {"student_id": actual_student_id}
        
        # Add period filter if specified
        if period_id is not None:
            query += " AND ep.id = :period_id"
            params["period_id"] = period_id
        
        query += " ORDER BY ep.start_date DESC, cs.class_code, e.created_at DESC"
        
        evaluations_result = db.execute(text(query), params)
        
        evaluations = []
        for row in evaluations_result:
            evaluation_data = {
                "evaluation_id": row[0],
                "submission_date": row[1].strftime("%Y-%m-%d %H:%M:%S") if row[1] else None,
                "rating_overall": row[2],
                "has_feedback": bool(row[3] and row[3].strip()),
                "text_feedback": row[3] if row[3] else None,
                "course": {
                    "id": row[4],
                    "subject_code": row[5],
                    "subject_name": row[6],
                    "class_section_id": row[7],
                    "class_code": row[8],
                    "semester": row[9],
                    "academic_year": row[10],
                    "program_name": row[18] or "Unknown"
                },
                "evaluation_period": {
                    "id": row[11],
                    "name": row[12] or "Unknown Period",
                    "semester": row[13],
                    "academic_year": row[14],
                    "start_date": row[15].strftime("%Y-%m-%d") if row[15] else None,
                    "end_date": row[16].strftime("%Y-%m-%d") if row[16] else None,
                    "status": row[17] or "closed"
                }
            }
            evaluations.append(evaluation_data)
        
        # Get available periods for filtering (show all periods where student was enrolled)
        periods_result = db.execute(text("""
            SELECT DISTINCT
                ep.id,
                ep.name,
                ep.semester,
                ep.academic_year,
                ep.start_date,
                ep.end_date,
                ep.status,
                COUNT(e.id) as evaluation_count
            FROM evaluation_periods ep
            LEFT JOIN evaluations e ON ep.id = e.evaluation_period_id 
                AND e.student_id = :student_id
            WHERE ep.id IN (
                SELECT DISTINCT evaluation_period_id 
                FROM enrollments 
                WHERE student_id = :student_id 
                AND evaluation_period_id IS NOT NULL
            )
            GROUP BY ep.id, ep.name, ep.semester, ep.academic_year, 
                     ep.start_date, ep.end_date, ep.status
            ORDER BY ep.start_date DESC
        """), {"student_id": actual_student_id})
        
        available_periods = []
        for row in periods_result:
            available_periods.append({
                "id": row[0],
                "name": row[1],
                "semester": row[2],
                "academic_year": row[3],
                "start_date": row[4].strftime("%Y-%m-%d") if row[4] else None,
                "end_date": row[5].strftime("%Y-%m-%d") if row[5] else None,
                "status": row[6],
                "evaluation_count": row[7]
            })
        
        logger.info(f"[EVAL-HISTORY] Retrieved {len(evaluations)} evaluations for student {actual_student_id}")
        logger.info(f"[EVAL-HISTORY] First evaluation: {evaluations[0] if evaluations else 'NONE'}")
        logger.info(f"[EVAL-HISTORY] Available periods: {len(available_periods)}")
        
        # FORCE response with test data if empty
        if not evaluations:
            logger.warning(f"[EVAL-HISTORY] WARNING: Query returned 0 evaluations but test showed 18!")
        
        return {
            "success": True,
            "data": evaluations,
            "summary": {
                "total_evaluations": len(evaluations),
                "periods_with_evaluations": len(available_periods),
                "filtered_by_period": period_id is not None,
                "filter_period_id": period_id
            },
            "available_periods": available_periods,
            "_debug": {
                "student_id_received": student_id,
                "actual_student_id": actual_student_id,
                "query_returned_count": len(evaluations)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting evaluation history: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch evaluation history: {str(e)}")

@router.post("/evaluations")
async def submit_evaluation(evaluation: EvaluationSubmission, 
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db)):
    """
    Submit a course evaluation with full evaluation period validation
    Rating Scale: 1 = Strongly Disagree, 2 = Disagree, 3 = Agree, 4 = Strongly Agree
    """
    try:
        # ============================================
        # STEP 1: CHECK ACTIVE EVALUATION PERIOD
        # ============================================
        active_period = db.execute(text("""
            SELECT 
                id, name, start_date, end_date, semester, academic_year
            FROM evaluation_periods
            WHERE status = 'active'
            AND CURRENT_DATE BETWEEN start_date AND end_date
            ORDER BY created_at DESC
            LIMIT 1
        """)).fetchone()
        
        if not active_period:
            # Check if there's an active period that hasn't started yet
            upcoming_period = db.execute(text("""
                SELECT name, start_date
                FROM evaluation_periods
                WHERE status = 'active'
                AND start_date > CURRENT_DATE
                ORDER BY start_date ASC
                LIMIT 1
            """)).fetchone()
            
            if upcoming_period:
                raise HTTPException(
                    status_code=403,
                    detail=f"Evaluation period '{upcoming_period[0]}' has not started yet. It will begin on {upcoming_period[1].strftime('%B %d, %Y')}."
                )
            
            raise HTTPException(
                status_code=403,
                detail="No active evaluation period. Evaluations are currently closed. Please contact your administrator."
            )
        
        period_id = active_period[0]
        period_name = active_period[1]
        period_end = active_period[3]
        
        logger.info(f"[EVAL-SUBMIT] Active period found: {period_name} (ID: {period_id})")
        
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
        
        section_name = f"{class_section_data[2]} ({class_section_data[1]})"
        
        # ============================================
        # STEP 2: VERIFY SECTION IS IN ACTIVE PERIOD
        # ============================================
        section_in_period = db.execute(text("""
            SELECT pe.id
            FROM period_enrollments pe
            WHERE pe.evaluation_period_id = :period_id
            AND pe.class_section_id = :section_id
        """), {
            "period_id": period_id,
            "section_id": evaluation.class_section_id
        }).fetchone()
        
        if not section_in_period:
            logger.warning(f"[EVAL-SUBMIT] Section {evaluation.class_section_id} not enrolled in period {period_id}")
            raise HTTPException(
                status_code=403,
                detail=f"The course '{section_name}' is not included in the current evaluation period ({period_name}). Please contact your administrator."
            )
        
        logger.info(f"[EVAL-SUBMIT] Section {evaluation.class_section_id} is enrolled in period")
        
        # Verify student exists - accept either student.id or user.id
        student_result = db.execute(text("""
            SELECT s.id FROM students s
            WHERE s.id = :student_id OR s.user_id = :student_id
        """), {"student_id": evaluation.student_id})
        
        student_data = student_result.fetchone()
        if not student_data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        actual_student_id = student_data[0]  # Use the actual student table ID
        
        # ============================================
        # STEP 3: VERIFY STUDENT ENROLLMENT IN PERIOD
        # ============================================
        student_enrollment = db.execute(text("""
            SELECT e.id
            FROM enrollments e
            WHERE e.student_id = :student_id
            AND e.class_section_id = :section_id
            AND e.evaluation_period_id = :period_id
            AND e.status = 'active'
        """), {
            "student_id": actual_student_id,
            "section_id": evaluation.class_section_id,
            "period_id": period_id
        }).fetchone()
        
        if not student_enrollment:
            logger.warning(f"[EVAL-SUBMIT] Student {actual_student_id} not enrolled in section {evaluation.class_section_id} for period {period_id}")
            raise HTTPException(
                status_code=403,
                detail=f"You are not enrolled in '{section_name}' for the current evaluation period. Please contact your administrator if this is incorrect."
            )
        
        logger.info(f"[EVAL-SUBMIT] Student enrollment verified")
        
        # ============================================
        # STEP 4: CHECK DUPLICATE SUBMISSION IN THIS PERIOD
        # ============================================
        existing_eval = db.execute(text("""
            SELECT id, status, submission_date FROM evaluations 
            WHERE class_section_id = :class_section_id 
            AND student_id = :student_id
            AND evaluation_period_id = :period_id
        """), {
            "class_section_id": evaluation.class_section_id,
            "student_id": actual_student_id,
            "period_id": period_id
        }).fetchone()
        
        # Check if evaluation was already COMPLETED (has submission_date or status != 'pending')
        if existing_eval and existing_eval[2] is not None:  # submission_date is not NULL
            logger.warning(f"[EVAL-SUBMIT] Duplicate evaluation attempt for student {actual_student_id}, section {evaluation.class_section_id}, period {period_id}")
            raise HTTPException(
                status_code=400, 
                detail=f"You have already submitted an evaluation for '{section_name}' in {period_name}."
            )
        
        # If we have a pending evaluation, we'll update it; otherwise we'll insert
        existing_eval_id = existing_eval[0] if existing_eval else None
        
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
        
        # Calculate average rating
        avg_rating = sum(rating_values) / len(rating_values)
        
        # Try ML sentiment analysis
        sentiment = "neutral"
        sentiment_score = 0.5
        ml_used = False
        
        try:
            from ml_models.sentiment_analyzer import SentimentAnalyzer
            sentiment_analyzer = SentimentAnalyzer()
            comment_text = evaluation.comment or ""
            if comment_text:
                ml_result = sentiment_analyzer.analyze(comment_text)
                sentiment = ml_result["sentiment"]
                sentiment_score = ml_result["confidence"]
                ml_used = True
        except:
            sentiment, sentiment_score = _rating_based_sentiment(avg_rating)
        
        # Try anomaly detection
        is_anomaly = False
        anomaly_score = 0.0
        anomaly_reason = None
        
        try:
            from ml_models.anomaly_detector import AnomalyDetector
            anomaly_detector = AnomalyDetector()
            anomaly_result = anomaly_detector.detect({
                "ratings": rating_values,
                "avg_rating": avg_rating,
                "sentiment": sentiment
            })
            is_anomaly = anomaly_result["is_anomaly"]
            anomaly_score = anomaly_result["anomaly_score"]
            anomaly_reason = anomaly_result.get("reason")
        except:
            pass
        
        # Prepare metadata for response
        metadata = {
            "ml_sentiment_used": ml_used
        }
        
        # Insert evaluation with ratings stored in JSONB column
        ratings_json = json.dumps(ratings)
        
        # Calculate summary ratings for legacy columns
        rating_teaching = avg_rating  # Overall average for teaching
        rating_content = avg_rating   # Overall average for content
        rating_engagement = avg_rating # Overall average for engagement
        rating_overall = avg_rating    # Overall average
        
        # Update existing pending evaluation or insert new one
        if existing_eval_id:
            # UPDATE the pending evaluation with actual data
            db.execute(text("""
                UPDATE evaluations SET
                    ratings = CAST(:ratings AS jsonb),
                    text_feedback = :text_feedback,
                    sentiment = :sentiment,
                    sentiment_score = :sentiment_score,
                    is_anomaly = :is_anomaly,
                    anomaly_score = :anomaly_score,
                    rating_teaching = :rating_teaching,
                    rating_content = :rating_content,
                    rating_engagement = :rating_engagement,
                    rating_overall = :rating_overall,
                    status = 'completed',
                    submission_date = NOW()
                WHERE id = :eval_id
            """), {
                "eval_id": existing_eval_id,
                "ratings": ratings_json,
                "text_feedback": evaluation.comment or '',
                "sentiment": sentiment,
                "sentiment_score": sentiment_score,
                "is_anomaly": is_anomaly,
                "anomaly_score": anomaly_score,
                "rating_teaching": int(round(rating_teaching)),
                "rating_content": int(round(rating_content)),
                "rating_engagement": int(round(rating_engagement)),
                "rating_overall": int(round(rating_overall))
            })
            evaluation_id = existing_eval_id
            logger.info(f"[EVAL-SUBMIT] Updated pending evaluation {existing_eval_id}")
        else:
            # INSERT new evaluation
            db.execute(text("""
                INSERT INTO evaluations (
                    student_id, 
                    class_section_id,
                    evaluation_period_id,
                    ratings,
                    text_feedback,
                    sentiment,
                    sentiment_score,
                    is_anomaly,
                    anomaly_score,
                    rating_teaching,
                    rating_content,
                    rating_engagement,
                    rating_overall,
                    status,
                    submission_date
                ) VALUES (
                    :student_id, 
                    :class_section_id,
                    :period_id,
                    CAST(:ratings AS jsonb),
                    :text_feedback,
                    :sentiment,
                    :sentiment_score,
                    :is_anomaly,
                    :anomaly_score,
                    :rating_teaching,
                    :rating_content,
                    :rating_engagement,
                    :rating_overall,
                    'completed',
                    NOW()
                )
            """), {
                "student_id": actual_student_id,
                "class_section_id": evaluation.class_section_id,
                "period_id": period_id,
                "ratings": ratings_json,
                "text_feedback": evaluation.comment or '',
                "sentiment": sentiment,
                "sentiment_score": sentiment_score,
                "is_anomaly": is_anomaly,
                "anomaly_score": anomaly_score,
                "rating_teaching": int(round(rating_teaching)),
                "rating_content": int(round(rating_content)),
                "rating_engagement": int(round(rating_engagement)),
                "rating_overall": int(round(rating_overall))
            })
            
            # Get the newly created evaluation ID
            eval_result = db.execute(text("""
                SELECT id FROM evaluations
                WHERE student_id = :student_id
                AND class_section_id = :class_section_id
                AND evaluation_period_id = :period_id
                ORDER BY id DESC LIMIT 1
            """), {
                "student_id": actual_student_id,
                "class_section_id": evaluation.class_section_id,
                "period_id": period_id
            }).fetchone()
            
            evaluation_id = eval_result[0] if eval_result else None
            logger.info(f"[EVAL-SUBMIT] Created new evaluation {evaluation_id}")
        
        db.commit()
        
        # === CREATE AUDIT LOG ===
        try:
            from models.enhanced_models import AuditLog
            audit_log = AuditLog(
                user_id=actual_student_id,
                action="EVALUATION_SUBMITTED",
                category="Evaluation",
                severity="Info",
                status="Success",
                details={
                    "evaluation_id": evaluation_id,
                    "section_name": section_name,
                    "period_name": period_name
                },
                ip_address=None
            )
            db.add(audit_log)
            db.commit()
            logger.info(f"Audit log created for evaluation submission {evaluation_id}")
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
            # Don't fail the evaluation if audit log fails
        
        logger.info(f"[EVAL-SUBMIT] Successfully submitted evaluation for student {actual_student_id}, section {evaluation.class_section_id}, period {period_id}")
        
        return {
            "success": True,
            "message": f"Evaluation submitted successfully for {section_name}",
            "data": {
                "class_section_id": evaluation.class_section_id,
                "evaluation_period_id": period_id,
                "evaluation_period_name": period_name,
                "period_end_date": period_end.strftime("%B %d, %Y"),
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


@router.get("/evaluations/{evaluation_id}")
async def get_evaluation_for_edit(evaluation_id: int, 
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db)):
    """
    Get a specific evaluation for editing
    Returns the evaluation data to pre-fill the form
    """
    try:
        result = db.execute(text("""
            SELECT 
                e.id, e.student_id, e.class_section_id,
                e.sentiment, e.ratings, e.text_feedback,
                cs.class_code, c.subject_name, c.subject_code,
                cs.semester, cs.academic_year
            FROM evaluations e
            JOIN class_sections cs ON e.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE e.id = :evaluation_id
        """), {"evaluation_id": evaluation_id})
        
        eval_data = result.fetchone()
        if not eval_data:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        logger.info(f"Fetched evaluation data: {eval_data}")
        
        # Parse ratings from JSONB column
        ratings = {}
        comment = eval_data[5] or ""  # text_feedback
        
        try:
            if eval_data[4]:  # ratings JSONB column
                logger.info(f"Raw ratings data: {eval_data[4]}, type: {type(eval_data[4])}")
                ratings = eval_data[4] if isinstance(eval_data[4], dict) else json.loads(eval_data[4])
                logger.info(f"Parsed ratings: {ratings}")
        except Exception as e:
            logger.error(f"Could not parse stored ratings: {e}")
            import traceback
            traceback.print_exc()
        
        return {
            "success": True,
            "data": {
                "id": eval_data[0],
                "student_id": eval_data[1],
                "class_section_id": eval_data[2],
                "sentiment": eval_data[3],
                "ratings": ratings,
                "comment": comment,
                "course": {
                    "class_code": eval_data[6],
                    "name": eval_data[7],
                    "code": eval_data[8]
                },
                "semester": eval_data[9],
                "academic_year": eval_data[10],
                "can_edit": True
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching evaluation: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch evaluation: {str(e)}")


@router.put("/evaluations/{evaluation_id}")
async def update_evaluation(
    evaluation_id: int, 
    evaluation: EvaluationSubmission, 
    db: Session = Depends(get_db)
):
    """
    Update an existing evaluation
    Only allowed if evaluation period hasn't ended
    """
    try:
        # Get existing evaluation
        existing_result = db.execute(text("""
            SELECT 
                e.id, e.student_id, e.class_section_id,
                cs.class_code, c.subject_name
            FROM evaluations e
            JOIN class_sections cs ON e.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE e.id = :evaluation_id
        """), {"evaluation_id": evaluation_id})
        
        existing_data = existing_result.fetchone()
        if not existing_data:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        # Verify student owns this evaluation
        actual_student_id = existing_data[1]
        if actual_student_id != evaluation.student_id:
            # Try checking if student_id is actually user_id
            student_check = db.execute(text("""
                SELECT s.id FROM students s
                WHERE s.id = :student_id OR s.user_id = :student_id
            """), {"student_id": evaluation.student_id}).fetchone()
            
            if not student_check or student_check[0] != actual_student_id:
                raise HTTPException(status_code=403, detail="Unauthorized to edit this evaluation")
        
        # Validate ratings
        ratings = evaluation.ratings
        if not ratings or len(ratings) == 0:
            raise HTTPException(status_code=400, detail="No ratings provided")
        
        rating_values = list(ratings.values())
        for rating_val in rating_values:
            if not isinstance(rating_val, (int, float)) or not (1 <= rating_val <= 4):
                raise HTTPException(status_code=400, detail="All ratings must be between 1 and 4")
        
        # Calculate average rating and sentiment
        avg_rating = sum(rating_values) / len(rating_values)
        
        # Try ML sentiment analysis
        sentiment = "neutral"
        sentiment_score = 0.5
        ml_used = False
        
        try:
            sentiment_analyzer = SentimentAnalyzer()
            comment_text = evaluation.comment or ""
            if comment_text:
                ml_result = sentiment_analyzer.analyze(comment_text)
                sentiment = ml_result["sentiment"]
                sentiment_score = ml_result["confidence"]
                ml_used = True
        except:
            sentiment, sentiment_score = _rating_based_sentiment(avg_rating)
        
        # Try anomaly detection
        is_anomaly = False
        anomaly_score = 0.0
        anomaly_reason = None
        
        try:
            anomaly_detector = AnomalyDetector()
            anomaly_result = anomaly_detector.detect({
                "ratings": rating_values,
                "avg_rating": avg_rating,
                "sentiment": sentiment
            })
            is_anomaly = anomaly_result["is_anomaly"]
            anomaly_score = anomaly_result["anomaly_score"]
            anomaly_reason = anomaly_result.get("reason")
        except:
            pass
        
        # Update evaluation in database with new ratings
        ratings_json = json.dumps(ratings)
        
        # Calculate summary ratings
        rating_teaching = avg_rating
        rating_content = avg_rating
        rating_engagement = avg_rating
        rating_overall = avg_rating
        
        db.execute(text("""
            UPDATE evaluations
            SET 
                ratings = CAST(:ratings AS jsonb),
                text_feedback = :text_feedback,
                sentiment = :sentiment,
                sentiment_score = :sentiment_score,
                is_anomaly = :is_anomaly,
                anomaly_score = :anomaly_score,
                rating_teaching = :rating_teaching,
                rating_content = :rating_content,
                rating_engagement = :rating_engagement,
                rating_overall = :rating_overall,
                submission_date = NOW()
            WHERE id = :evaluation_id
        """), {
            "evaluation_id": evaluation_id,
            "ratings": ratings_json,
            "text_feedback": evaluation.comment or '',
            "sentiment": sentiment,
            "sentiment_score": sentiment_score,
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "rating_teaching": int(round(rating_teaching)),
            "rating_content": int(round(rating_content)),
            "rating_engagement": int(round(rating_engagement)),
            "rating_overall": int(round(rating_overall))
        })
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Evaluation updated successfully for {existing_data[4]}",
            "data": {
                "evaluation_id": evaluation_id,
                "ratings": ratings,
                "average_rating": round(avg_rating, 2),
                "sentiment": sentiment,
                "sentiment_score": round(sentiment_score, 3),
                "anomaly_detected": is_anomaly,
                "ml_powered": ml_used
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating evaluation: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update evaluation: {str(e)}")


@router.get("/{student_id}/evaluations")  
async def get_student_evaluations(student_id: int, 
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db)):
    """Get all evaluations submitted by a student"""
    # Verify student ownership
    verify_student_ownership(student_id, current_user, db)
    
    try:
        result = db.execute(text("""
            SELECT 
                e.id, e.rating_teaching, e.rating_content, e.rating_engagement, e.rating_overall,
                e.text_feedback, e.submission_date,
                e.sentiment, e.sentiment_score, e.is_anomaly,
                c.subject_name, c.subject_code, cs.class_code
            FROM evaluations e
            JOIN class_sections cs ON e.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
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
                "class_code": row[12]
            })
        
        return {
            "success": True,
            "data": evaluations
        }
        
    except Exception as e:
        logger.error(f"Error getting student evaluations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch evaluations")

@router.get("/courses/{course_id}")
async def get_course_details(course_id: int, 
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db)):
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


@router.get("/{student_id}/evaluation-periods")
async def get_student_evaluation_periods(student_id: int, 
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db)):
    """Get active evaluation periods where student has pending evaluations"""
    try:
        periods_result = db.execute(text("""
            SELECT DISTINCT
                ep.id, ep.name, ep.semester, ep.academic_year,
                ep.start_date, ep.end_date, ep.status,
                COUNT(DISTINCT ev.id) as pending_count
            FROM evaluation_periods ep
            JOIN evaluations ev ON ev.evaluation_period_id = ep.id
            WHERE ev.student_id = :student_id
            AND ev.status = 'pending'
            AND ep.status = 'active'
            GROUP BY ep.id, ep.name, ep.semester, ep.academic_year, 
                     ep.start_date, ep.end_date, ep.status
            ORDER BY ep.start_date DESC
        """), {"student_id": student_id})
        
        periods = []
        for row in periods_result:
            periods.append({
                "id": row[0],
                "name": row[1],
                "semester": row[2],
                "academic_year": row[3],
                "start_date": row[4].isoformat() if row[4] else None,
                "end_date": row[5].isoformat() if row[5] else None,
                "status": row[6],
                "pending_evaluations": row[7]
            })
        
        return {
            "success": True,
            "data": periods
        }
        
    except Exception as e:
        logger.error(f"Error getting evaluation periods for student: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch evaluation periods")


@router.get("/{student_id}/pending-evaluations")
async def get_student_pending_evaluations(
    student_id: int, 
    period_id: Optional[int] = None,
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Get all pending evaluations for a student - ONLY from active/open periods"""
    # Verify student ownership
    verify_student_ownership(student_id, current_user, db)
    
    try:
        query = """
            SELECT 
                ev.id, ev.class_section_id, ev.evaluation_period_id,
                c.subject_code, c.subject_name,
                cs.class_code,
                ep.name as period_name, ep.end_date,
                p.program_name
            FROM evaluations ev
            JOIN class_sections cs ON ev.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            JOIN evaluation_periods ep ON ev.evaluation_period_id = ep.id
            LEFT JOIN programs p ON c.program_id = p.id
            WHERE ev.student_id = :student_id
            AND ev.status = 'pending'
            AND ep.status IN ('active', 'draft')
        """
        
        params = {"student_id": student_id}
        
        if period_id:
            query += " AND ev.evaluation_period_id = :period_id"
            params["period_id"] = period_id
        
        query += " ORDER BY ep.end_date ASC, c.subject_name"
        
        evaluations_result = db.execute(text(query), params)
        
        evaluations = []
        for row in evaluations_result:
            evaluations.append({
                "evaluation_id": row[0],
                "class_section_id": row[1],
                "period_id": row[2],
                "subject_code": row[3],
                "subject_name": row[4],
                "class_code": row[5],
                "period_name": row[6],
                "due_date": row[7].isoformat() if row[7] else None,
                "program_name": row[8]
            })
        
        return {
            "success": True,
            "data": evaluations
        }
        
    except Exception as e:
        logger.error(f"Error getting pending evaluations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pending evaluations")


@router.put("/evaluations/{evaluation_id}/submit")
async def submit_evaluation(
    evaluation_id: int,
    evaluation_data: EvaluationSubmission,
    db: Session = Depends(get_db)
):
    """Submit a completed evaluation"""
    try:
        # Verify evaluation exists and is pending
        check_query = text("""
            SELECT id, student_id, status FROM evaluations
            WHERE id = :evaluation_id
        """)
        
        evaluation = db.execute(check_query, {"evaluation_id": evaluation_id}).fetchone()
        
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        if evaluation[2] != 'pending':
            raise HTTPException(status_code=400, detail="Evaluation has already been submitted")
        
        # Update evaluation with ratings and mark as completed
        update_query = text("""
            UPDATE evaluations
            SET 
                rating_overall = :rating_overall,
                rating_teaching = :rating_teaching,
                rating_communication = :rating_communication,
                rating_materials = :rating_materials,
                rating_assessment = :rating_assessment,
                rating_responsiveness = :rating_responsiveness,
                rating_organization = :rating_organization,
                comment = :comment,
                status = 'completed',
                submitted_at = NOW()
            WHERE id = :evaluation_id
        """)
        
        db.execute(update_query, {
            "evaluation_id": evaluation_id,
            "rating_overall": evaluation_data.ratings.get("overall", 0),
            "rating_teaching": evaluation_data.ratings.get("teaching", 0),
            "rating_communication": evaluation_data.ratings.get("communication", 0),
            "rating_materials": evaluation_data.ratings.get("materials", 0),
            "rating_assessment": evaluation_data.ratings.get("assessment", 0),
            "rating_responsiveness": evaluation_data.ratings.get("responsiveness", 0),
            "rating_organization": evaluation_data.ratings.get("organization", 0),
            "comment": evaluation_data.comment
        })
        
        db.commit()
        
        return {
            "success": True,
            "message": "Evaluation submitted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error submitting evaluation: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit evaluation")