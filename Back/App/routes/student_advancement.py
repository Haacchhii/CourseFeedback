"""
Student Advancement API Routes
Handles year level advancement and enrollment transitions between periods
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from middleware.auth import require_staff
from sqlalchemy.orm import Session
from database.connection import get_db
from services.student_advancement import StudentAdvancementService
from typing import Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class AdvanceStudentsRequest(BaseModel):
    program_id: Optional[int] = None
    current_year_level: Optional[int] = None
    dry_run: bool = True


class TransitionEnrollmentsRequest(BaseModel):
    from_period_id: int
    to_period_id: int
    auto_advance_year: bool = False
    dry_run: bool = True


@router.get("/advancement/eligibility")
async def get_advancement_eligibility(
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Get report of students eligible for year level advancement
    Shows breakdown by program and year level
    
    Access: Admin, Secretary, Department Head
    """
    try:
        service = StudentAdvancementService()
        report = service.get_advancement_eligibility_report(db)
        
        return {
            "success": True,
            "data": report
        }
        
    except Exception as e:
        logger.error(f"Error getting advancement eligibility: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advancement/advance-students")
async def advance_students(
    request: AdvanceStudentsRequest,
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Advance students to next year level
    
    This should be run at the end of the academic year (after 3 semesters).
    By default runs in dry_run mode to preview changes.
    
    Access: Admin only (requires elevated permissions)
    """
    try:
        # Restrict to admin only
        if current_user.get('role') not in ['admin', 'system_admin']:
            raise HTTPException(
                status_code=403,
                detail="Only administrators can advance student year levels"
            )
        
        service = StudentAdvancementService()
        result = service.advance_students_year_level(
            db=db,
            program_id=request.program_id,
            current_year_level=request.current_year_level,
            dry_run=request.dry_run
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Advancement failed"))
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error advancing students: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advancement/transition-enrollments")
async def transition_enrollments(
    request: TransitionEnrollmentsRequest,
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Copy enrollments from one evaluation period to the next
    Optionally advances students if transitioning to new academic year
    
    This creates enrollments for the new semester based on:
    - Student's program
    - Student's year level (potentially advanced)
    - Available class sections for the new period
    
    Access: Admin, Secretary
    """
    try:
        # Restrict to admin and secretary
        if current_user.get('role') not in ['admin', 'system_admin', 'secretary']:
            raise HTTPException(
                status_code=403,
                detail="Only administrators and secretaries can manage enrollments"
            )
        
        service = StudentAdvancementService()
        result = service.create_next_period_enrollments(
            db=db,
            from_period_id=request.from_period_id,
            to_period_id=request.to_period_id,
            auto_advance_year=request.auto_advance_year,
            dry_run=request.dry_run
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Enrollment transition failed"))
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transitioning enrollments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/advancement/students-by-year")
async def get_students_by_year_level(
    year_level: Optional[int] = Query(None, ge=1, le=4),
    program_id: Optional[int] = Query(None),
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Get students grouped by year level
    Useful for verifying advancement results
    
    Access: Admin, Secretary, Department Head
    """
    try:
        from sqlalchemy import text
        
        query = """
            SELECT 
                s.id,
                s.student_number,
                s.year_level,
                p.program_code,
                p.program_name,
                u.first_name,
                u.last_name,
                u.email
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN programs p ON s.program_id = p.id
            WHERE s.is_active = true
        """
        
        params = {}
        
        if year_level:
            query += " AND s.year_level = :year_level"
            params['year_level'] = year_level
        
        if program_id:
            query += " AND s.program_id = :program_id"
            params['program_id'] = program_id
        
        query += " ORDER BY s.year_level, p.program_code, s.student_number"
        
        result = db.execute(text(query), params).fetchall()
        
        students = [
            {
                "id": row[0],
                "student_number": row[1],
                "year_level": row[2],
                "program_code": row[3],
                "program_name": row[4],
                "first_name": row[5],
                "last_name": row[6],
                "email": row[7]
            }
            for row in result
        ]
        
        # Group by year level
        by_year = {}
        for student in students:
            year = student["year_level"]
            if year not in by_year:
                by_year[year] = []
            by_year[year].append(student)
        
        return {
            "success": True,
            "data": {
                "total_students": len(students),
                "students": students,
                "by_year_level": by_year
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting students by year level: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class RollbackAdvancementRequest(BaseModel):
    snapshot_id: Optional[int] = None
    dry_run: bool = True


@router.get("/advancement/snapshots")
async def list_advancement_snapshots(
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50)
):
    """
    List available advancement snapshots for rollback
    Shows recent snapshots with timestamp and student count
    
    Access: Admin, Secretary, Department Head
    """
    try:
        service = StudentAdvancementService()
        result = service.list_advancement_snapshots(db, limit=limit)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error listing snapshots: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advancement/rollback")
async def rollback_student_advancement(
    request: RollbackAdvancementRequest,
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Rollback student year levels to a previous snapshot
    Use this to undo accidental advancements
    
    Access: Admin only
    
    Args:
        snapshot_id: Specific snapshot to restore (None = latest)
        dry_run: Preview only without making changes (default: True)
    """
    # Only admins can rollback advancements
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only administrators can rollback student advancements"
        )
    
    try:
        service = StudentAdvancementService()
        result = service.rollback_advancement(
            db,
            snapshot_id=request.snapshot_id,
            dry_run=request.dry_run
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rolling back advancement: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advancement/create-snapshot")
async def create_advancement_snapshot(
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db),
    description: str = Query("Manual snapshot", max_length=200)
):
    """
    Manually create a snapshot of current student year levels
    Useful before making manual changes or testing
    
    Access: Admin, Secretary
    """
    # Only admins and secretaries can create snapshots
    if current_user.get("role") not in ["admin", "secretary"]:
        raise HTTPException(
            status_code=403,
            detail="Only administrators and secretaries can create snapshots"
        )
    
    try:
        service = StudentAdvancementService()
        result = service.create_advancement_snapshot(db, description=description)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error creating snapshot: {e}")
        raise HTTPException(status_code=500, detail=str(e))
