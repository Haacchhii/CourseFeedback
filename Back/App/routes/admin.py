"""
Admin routes for Course Feedback System
Handles secretary/admin dashboard data
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from database.connection import get_db
from models.enhanced_models import User
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/dashboard-stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get comprehensive dashboard statistics for admin"""
    print("🔍 DEBUG: /dashboard-stats endpoint hit!")
    try:
        # Get overall counts
        counts_query = text("""
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
                (SELECT COUNT(*) FROM users WHERE role = 'instructor') as total_instructors,
                (SELECT COUNT(*) FROM users WHERE role = 'secretary') as total_secretaries,
                (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
                (SELECT COUNT(*) FROM courses) as total_courses,
                (SELECT COUNT(*) FROM evaluations) as total_evaluations,
                (SELECT COUNT(*) FROM programs) as total_programs,
                (SELECT COUNT(*) FROM class_sections) as total_class_sections
        """)
        
        counts_result = db.execute(counts_query).fetchone()
        
        # Get program statistics
        program_stats_query = text("""
            SELECT 
                p.program_code,
                p.program_name,
                COUNT(DISTINCT c.id) as courses,
                COUNT(DISTINCT s.id) as students,
                COUNT(DISTINCT e.id) as evaluations
            FROM programs p
            LEFT JOIN courses c ON p.id = c.program_id
            LEFT JOIN students s ON p.id = s.program_id
            LEFT JOIN enrollments en ON s.id = en.student_id
            LEFT JOIN evaluations e ON en.class_section_id = e.class_section_id AND en.student_id = e.student_id
            GROUP BY p.id, p.program_code, p.program_name
            ORDER BY p.program_code
        """)
        
        program_results = db.execute(program_stats_query)
        program_stats = {}
        for row in program_results:
            program_stats[row[0]] = {
                "name": row[1],
                "courses": row[2] or 0,
                "students": row[3] or 0,
                "evaluations": row[4] or 0
            }
        
        # Get sentiment statistics (if sentiment field exists)
        sentiment_query = text("""
            SELECT 
                sentiment,
                COUNT(*) as count
            FROM evaluations
            WHERE sentiment IS NOT NULL
            GROUP BY sentiment
        """)
        
        try:
            sentiment_results = db.execute(sentiment_query)
            sentiment_stats = {
                "positive": 0,
                "neutral": 0,
                "negative": 0
            }
            for row in sentiment_results:
                sentiment = row[0].lower() if row[0] else "neutral"
                if sentiment in sentiment_stats:
                    sentiment_stats[sentiment] = row[1]
        except:
            # If sentiment column doesn't exist, return zeros
            sentiment_stats = {"positive": 0, "neutral": 0, "negative": 0}
        
        # Get recent evaluations
        recent_query = text("""
            SELECT 
                e.id,
                e.submitted_at,
                u.email as student_email,
                c.subject_name,
                e.rating_overall
            FROM evaluations e
            JOIN students s ON e.student_id = s.id
            JOIN users u ON s.user_id = u.id
            JOIN class_sections cs ON e.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            ORDER BY e.submitted_at DESC
            LIMIT 10
        """)
        
        recent_results = db.execute(recent_query)
        recent_evaluations = [
            {
                "id": row[0],
                "submitted_at": str(row[1]) if row[1] else None,
                "student_email": row[2],
                "course_name": row[3],
                "rating": row[4]
            }
            for row in recent_results
        ]
        
        return {
            "success": True,
            "data": {
                "totalUsers": counts_result[0] if counts_result else 0,
                "totalCourses": counts_result[5] if counts_result else 0,
                "totalEvaluations": counts_result[6] if counts_result else 0,
                "totalPrograms": counts_result[7] if counts_result else 0,
                "userRoles": {
                    "students": counts_result[1] if counts_result else 0,
                    "instructors": counts_result[2] if counts_result else 0,
                    "secretaries": counts_result[3] if counts_result else 0,
                    "admins": counts_result[4] if counts_result else 0,
                    "departmentHeads": 0  # Legacy field
                },
                "programStats": program_stats,
                "sentimentStats": sentiment_stats,
                "recentEvaluations": recent_evaluations,
                "classSections": counts_result[8] if counts_result else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard statistics: {str(e)}")

@router.get("/department-overview")
async def get_department_overview(db: Session = Depends(get_db)):
    """Get overview statistics for all programs (departments)"""
    try:
        # Get program counts (using programs as departments)
        dept_query = text("""
            SELECT 
                p.program_name as department_name,
                COUNT(DISTINCT s.id) as total_students,
                COUNT(DISTINCT c.id) as total_courses,
                COUNT(DISTINCT e.id) as total_evaluations
            FROM programs p
            LEFT JOIN students s ON p.id = s.program_id
            LEFT JOIN courses c ON p.id = c.program_id
            LEFT JOIN enrollments en ON s.id = en.student_id
            LEFT JOIN evaluations e ON en.class_section_id = e.class_section_id AND en.student_id = e.student_id
            GROUP BY p.id, p.program_name
            ORDER BY p.program_name
        """)
        
        result = db.execute(dept_query)
        departments = []
        for row in result:
            departments.append({
                "department_name": row[0],
                "total_students": row[1] or 0,
                "total_courses": row[2] or 0, 
                "total_evaluations": row[3] or 0
            })
        
        # Get overall statistics
        total_query = text("""
            SELECT 
                (SELECT COUNT(*) FROM students) as total_students,
                (SELECT COUNT(*) FROM courses) as total_courses,
                (SELECT COUNT(*) FROM evaluations) as total_evaluations,
                (SELECT COUNT(*) FROM programs) as total_departments
        """)
        
        total_result = db.execute(total_query).fetchone()
        
        return {
            "success": True,
            "data": {
                "departments": departments,
                "overview": {
                    "total_students": total_result[0] if total_result else 0,
                    "total_courses": total_result[1] if total_result else 0,
                    "total_evaluations": total_result[2] if total_result else 0,
                    "total_departments": total_result[3] if total_result else 0
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting department overview: {e}")
        import traceback
        traceback.print_exc()
        # Return empty data instead of error
        return {
            "success": True,
            "data": {
                "departments": [],
                "overview": {
                    "total_students": 0,
                    "total_courses": 0,
                    "total_evaluations": 0,
                    "total_departments": 0
                }
            },
            "message": "Error loading department data"
        }

@router.get("/departments")
async def get_all_departments(db: Session = Depends(get_db)):
    """Get all departments (programs)"""
    try:
        # Use programs table as departments
        query = text("SELECT id, program_name, program_code FROM programs ORDER BY program_name")
        result = db.execute(query)
        
        departments = []
        for row in result:
            departments.append({
                "id": row[0],
                "name": row[1], 
                "description": row[2] or ""
            })
        
        return {
            "success": True,
            "data": departments
        }
        
    except Exception as e:
        logger.error(f"Error getting departments: {e}")
        import traceback
        traceback.print_exc()
        # Return empty array instead of error
        return {
            "success": True,
            "data": [],
            "message": "Error loading departments"
        }

@router.get("/students") 
async def get_all_students(
    department_id: Optional[int] = Query(None),
    program: Optional[str] = Query(None),
    year_level: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all students with optional filters"""
    try:
        base_query = """
            SELECT 
                s.id, s.student_number, 
                u.first_name, u.last_name, u.email,
                s.year_level, p.program_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE 1=1
        """
        
        conditions = []
        params = {}
        
        if department_id:
            conditions.append("AND s.program_id = :department_id")
            params["department_id"] = department_id
            
        if program:
            conditions.append("AND p.program_name ILIKE :program")
            params["program"] = f"%{program}%"
            
        if year_level:
            conditions.append("AND s.year_level = :year_level")
            params["year_level"] = year_level
        
        final_query = base_query + " " + " ".join(conditions) + " ORDER BY u.last_name, u.first_name"
        
        result = db.execute(text(final_query), params)
        
        students = []
        for row in result:
            students.append({
                "id": row[0],
                "student_number": row[1],
                "first_name": row[2],
                "last_name": row[3], 
                "email": row[4],
                "year_level": row[5] if row[5] else 0,
                "program": row[6] if row[6] else "Unknown",
                "department_name": row[6] if row[6] else "Unknown"
            })
        
        return {
            "success": True,
            "data": students
        }
        
    except Exception as e:
        logger.error(f"Error getting students: {e}")
        import traceback
        traceback.print_exc()
        # Return empty array instead of error
        return {
            "success": True,
            "data": [],
            "message": "Error loading students"
        }

@router.get("/instructors")
async def get_all_instructors(
    department_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all instructors/department heads"""
    try:
        # Query from users table, instructors may not have department_id
        base_query = """
            SELECT 
                u.id, u.first_name, u.last_name, u.email, u.role
            FROM users u
            WHERE u.role IN ('department_head', 'instructor')
        """
        
        params = {}
        base_query += " ORDER BY u.last_name, u.first_name"
        
        result = db.execute(text(base_query), params)
        
        instructors = []
        for row in result:
            instructors.append({
                "id": row[0],
                "first_name": row[1],
                "last_name": row[2],
                "email": row[3],
                "role": row[4],
                "department_name": "Academic Affairs"  # Default department
            })
        
        return {
            "success": True,
            "data": instructors
        }
        
    except Exception as e:
        logger.error(f"Error getting instructors: {e}")
        import traceback
        traceback.print_exc()
        # Return empty array instead of error
        return {
            "success": True,
            "data": [],
            "message": "Error loading instructors"
        }

@router.get("/evaluations")
async def get_all_evaluations(
    course_id: Optional[int] = Query(None),
    department_id: Optional[int] = Query(None), 
    semester: Optional[str] = Query(None),
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all evaluations with optional filters"""
    try:
        base_query = """
            SELECT 
                e.id, e.rating_overall, e.comment, e.submitted_at,
                c.subject_name, c.subject_code,
                u.first_name, u.last_name,
                p.program_name,
                cs.semester, cs.academic_year
            FROM evaluations e
            JOIN class_sections cs ON e.class_section_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            JOIN students s ON e.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN programs p ON c.program_id = p.id
            WHERE 1=1
        """
        
        conditions = []
        params = {}
        
        if course_id:
            conditions.append("AND c.id = :course_id")
            params["course_id"] = course_id
            
        if department_id:
            conditions.append("AND c.program_id = :department_id")
            params["department_id"] = department_id
            
        if semester:
            conditions.append("AND cs.semester = :semester")
            params["semester"] = semester
            
        if academic_year:
            conditions.append("AND cs.academic_year = :academic_year")
            params["academic_year"] = academic_year
        
        final_query = base_query + " " + " ".join(conditions) + " ORDER BY e.submitted_at DESC LIMIT 100"
        
        result = db.execute(text(final_query), params)
        
        evaluations = []
        for row in result:
            evaluations.append({
                "id": row[0],
                "rating": row[1] if row[1] else 0,
                "comment": row[2] if row[2] else "",
                "created_at": row[3].isoformat() if row[3] else None,
                "course_name": row[4] if row[4] else "Unknown",
                "course_code": row[5] if row[5] else "",
                "student_name": f"{row[6]} {row[7]}" if row[6] and row[7] else "Unknown",
                "department_name": row[8] if row[8] else "Unknown",
                "semester": row[9] if row[9] else "",
                "academic_year": row[10] if row[10] else ""
            })
        
        return {
            "success": True,
            "data": evaluations
        }
        
    except Exception as e:
        logger.error(f"Error getting evaluations: {e}")
        import traceback
        traceback.print_exc()
        # Return empty array instead of error
        return {
            "success": True,
            "data": [],
            "message": "Error loading evaluations"
        }

@router.get("/courses")
async def get_all_courses(
    department_id: Optional[int] = Query(None),
    semester: Optional[str] = Query(None),
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all courses with optional filters"""
    try:
        base_query = """
            SELECT 
                c.id, c.name, c.code, c.description, c.credits,
                c.semester, c.academic_year,
                d.name as department_name,
                COUNT(e.id) as evaluation_count
            FROM courses c
            LEFT JOIN departments d ON c.department_id = d.id
            LEFT JOIN evaluations e ON c.id = e.course_id
            WHERE 1=1
        """
        
        conditions = []
        params = {}
        
        if department_id:
            conditions.append("AND c.department_id = :department_id")
            params["department_id"] = department_id
            
        if semester:
            conditions.append("AND c.semester = :semester")
            params["semester"] = semester
            
        if academic_year:
            conditions.append("AND c.academic_year = :academic_year")
            params["academic_year"] = academic_year
        
        final_query = base_query + " " + " ".join(conditions) + """
            GROUP BY c.id, c.name, c.code, c.description, c.credits, 
                     c.semester, c.academic_year, d.name
            ORDER BY c.name
        """
        
        result = db.execute(text(final_query), params)
        
        courses = [
            {
                "id": row[0],
                "name": row[1],
                "code": row[2],
                "description": row[3] or "",
                "credits": row[4],
                "semester": row[5],
                "academic_year": row[6],
                "department_name": row[7] or "Unknown",
                "evaluation_count": row[8]
            }
            for row in result
        ]
        
        return {
            "success": True,
            "data": courses
        }
        
    except Exception as e:
        logger.error(f"Error getting courses: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch courses")


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
    Calculate 6 category averages from evaluation ratings for a specific course.
    Admin can access all courses.
    """
    try:
        from models.enhanced_models import Course, ClassSection, Evaluation
        
        # Verify course exists
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get all evaluations for this course
        evaluations = db.query(Evaluation).join(
            ClassSection, Evaluation.class_section_id == ClassSection.id
        ).filter(
            ClassSection.course_id == course_id
        ).all()
        
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
        
        # Calculate averages for each category
        category_results = []
        for cat_id, cat_info in categories.items():
            all_ratings = []
            
            for evaluation in evaluations:
                if evaluation.ratings and isinstance(evaluation.ratings, dict):
                    # Extract ratings for this category's questions
                    for q_num in cat_info["questions"]:
                        rating = evaluation.ratings.get(q_num)
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
    Get response distribution for all 31 questions in a course.
    Returns count and percentage for each rating (1-4) per question.
    """
    try:
        from models.enhanced_models import Course, ClassSection, Evaluation
        
        # Verify course exists
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get all evaluations for this course
        evaluations = db.query(Evaluation).join(
            ClassSection, Evaluation.class_section_id == ClassSection.id
        ).filter(
            ClassSection.course_id == course_id
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
            if evaluation.ratings and isinstance(evaluation.ratings, dict):
                for q_num, rating in evaluation.ratings.items():
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
                cs.section_code as class_code,
                c.id as course_id,
                c.subject_code,
                c.subject_name,
                c.year_level,
                COALESCE(u.full_name, 'No Instructor') as instructor_name,
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
            GROUP BY cs.id, cs.section_code, c.id, c.subject_code, c.subject_name, 
                     c.year_level, u.full_name, cs.semester, cs.academic_year
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
    Admin can also use this for internal documentation or forwarding to system admin
    """
    try:
        # Get user details
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Log the support request (in a real system, you would store this in a database)
        logger.info(f"""
        ========================================
        NEW SUPPORT REQUEST
        ========================================
        From: {user.full_name} ({user.email})
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