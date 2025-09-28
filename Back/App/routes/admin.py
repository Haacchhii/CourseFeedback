"""
Admin routes for Course Feedback System
Handles secretary/admin dashboard data
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from database.connection import get_db
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/department-overview")
async def get_department_overview(db: Session = Depends(get_db)):
    """Get overview statistics for all departments"""
    try:
        # Get department counts
        dept_query = text("""
            SELECT 
                d.name as department_name,
                COUNT(DISTINCT s.id) as total_students,
                COUNT(DISTINCT c.id) as total_courses,
                COUNT(DISTINCT e.id) as total_evaluations
            FROM departments d
            LEFT JOIN students s ON d.id = s.department_id
            LEFT JOIN courses c ON d.id = c.department_id
            LEFT JOIN evaluations e ON c.id = e.course_id
            GROUP BY d.id, d.name
            ORDER BY d.name
        """)
        
        result = db.execute(dept_query)
        departments = [
            {
                "department_name": row[0],
                "total_students": row[1] or 0,
                "total_courses": row[2] or 0, 
                "total_evaluations": row[3] or 0
            }
            for row in result
        ]
        
        # Get overall statistics
        total_query = text("""
            SELECT 
                (SELECT COUNT(*) FROM students) as total_students,
                (SELECT COUNT(*) FROM courses) as total_courses,
                (SELECT COUNT(*) FROM evaluations) as total_evaluations,
                (SELECT COUNT(*) FROM departments) as total_departments
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
        raise HTTPException(status_code=500, detail="Failed to fetch department overview")

@router.get("/departments")
async def get_all_departments(db: Session = Depends(get_db)):
    """Get all departments"""
    try:
        query = text("SELECT id, name, description FROM departments ORDER BY name")
        result = db.execute(query)
        
        departments = [
            {
                "id": row[0],
                "name": row[1], 
                "description": row[2] or ""
            }
            for row in result
        ]
        
        return {
            "success": True,
            "data": departments
        }
        
    except Exception as e:
        logger.error(f"Error getting departments: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch departments")

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
                s.id, s.student_number, s.first_name, s.last_name, s.email,
                s.year_level, s.program, d.name as department_name
            FROM students s
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE 1=1
        """
        
        conditions = []
        params = {}
        
        if department_id:
            conditions.append("AND s.department_id = :department_id")
            params["department_id"] = department_id
            
        if program:
            conditions.append("AND s.program ILIKE :program")
            params["program"] = f"%{program}%"
            
        if year_level:
            conditions.append("AND s.year_level = :year_level")
            params["year_level"] = year_level
        
        final_query = base_query + " " + " ".join(conditions) + " ORDER BY s.last_name, s.first_name"
        
        result = db.execute(text(final_query), params)
        
        students = [
            {
                "id": row[0],
                "student_number": row[1],
                "first_name": row[2],
                "last_name": row[3], 
                "email": row[4],
                "year_level": row[5],
                "program": row[6],
                "department_name": row[7] or "Unknown"
            }
            for row in result
        ]
        
        return {
            "success": True,
            "data": students
        }
        
    except Exception as e:
        logger.error(f"Error getting students: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch students")

@router.get("/instructors")
async def get_all_instructors(
    department_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all instructors/department heads"""
    try:
        base_query = """
            SELECT 
                u.id, u.first_name, u.last_name, u.email, u.role,
                d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.role IN ('department_head', 'instructor')
        """
        
        params = {}
        if department_id:
            base_query += " AND u.department_id = :department_id"
            params["department_id"] = department_id
            
        base_query += " ORDER BY u.last_name, u.first_name"
        
        result = db.execute(text(base_query), params)
        
        instructors = [
            {
                "id": row[0],
                "first_name": row[1],
                "last_name": row[2],
                "email": row[3],
                "role": row[4],
                "department_name": row[5] or "Unknown"
            }
            for row in result
        ]
        
        return {
            "success": True,
            "data": instructors
        }
        
    except Exception as e:
        logger.error(f"Error getting instructors: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch instructors")

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
                e.id, e.rating, e.comment, e.created_at,
                c.name as course_name, c.code as course_code,
                s.first_name as student_first_name, s.last_name as student_last_name,
                d.name as department_name
            FROM evaluations e
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN students s ON e.student_id = s.id
            LEFT JOIN departments d ON c.department_id = d.id
            WHERE 1=1
        """
        
        conditions = []
        params = {}
        
        if course_id:
            conditions.append("AND e.course_id = :course_id")
            params["course_id"] = course_id
            
        if department_id:
            conditions.append("AND c.department_id = :department_id")
            params["department_id"] = department_id
            
        if semester:
            conditions.append("AND c.semester = :semester")
            params["semester"] = semester
            
        if academic_year:
            conditions.append("AND c.academic_year = :academic_year")
            params["academic_year"] = academic_year
        
        final_query = base_query + " " + " ".join(conditions) + " ORDER BY e.created_at DESC"
        
        result = db.execute(text(final_query), params)
        
        evaluations = [
            {
                "id": row[0],
                "rating": row[1],
                "comment": row[2],
                "created_at": row[3].isoformat() if row[3] else None,
                "course_name": row[4],
                "course_code": row[5],
                "student_name": f"{row[6]} {row[7]}" if row[6] and row[7] else "Unknown",
                "department_name": row[8] or "Unknown"
            }
            for row in result
        ]
        
        return {
            "success": True,
            "data": evaluations
        }
        
    except Exception as e:
        logger.error(f"Error getting evaluations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch evaluations")

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