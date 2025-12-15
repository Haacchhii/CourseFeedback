"""
Enrollment List Management Routes
Handles official student enrollment records and validation
"""

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from middleware.auth import require_admin
from sqlalchemy.orm import Session
from database.connection import get_db
from services.enrollment_validation import EnrollmentValidationService
from typing import Optional
from pydantic import BaseModel
import logging
import csv
import io

logger = logging.getLogger(__name__)
router = APIRouter()


class EnrollmentRecord(BaseModel):
    student_number: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    program_id: int
    year_level: int


@router.get("/enrollment-list/search")
async def search_enrollment_list(
    query: Optional[str] = Query(None),
    program_id: Optional[int] = Query(None),
    college_code: Optional[str] = Query(None),
    year_level: Optional[int] = Query(None),
    status: str = Query('active'),
    limit: int = Query(100, le=500),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Search official enrollment list
    Used to verify student eligibility before account creation
    
    Access: Admin only
    """
    try:
        service = EnrollmentValidationService()
        
        results = service.search_enrollment_list(
            db,
            query=query,
            program_id=program_id,
            college_code=college_code,
            year_level=year_level,
            status=status,
            limit=limit
        )
        
        return {
            "success": True,
            "data": results,
            "total": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error searching enrollment list: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/enrollment-list/validate")
async def validate_student(
    student_number: str = Query(...),
    program_id: int = Query(...),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Validate a student against enrollment list
    Checks if student number exists and program matches
    
    Access: Admin only
    """
    try:
        service = EnrollmentValidationService()
        
        validation = service.validate_student_enrollment(
            db,
            student_number=student_number,
            program_id=program_id
        )
        
        return {
            "success": True,
            "data": validation
        }
        
    except Exception as e:
        logger.error(f"Error validating student: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/enrollment-list/student/{student_number}")
async def get_student_enrollment(
    student_number: str,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get enrollment information for a specific student
    
    Access: Admin only
    """
    try:
        service = EnrollmentValidationService()
        
        enrollment = service.get_student_enrollment_info(db, student_number)
        
        if not enrollment:
            raise HTTPException(
                status_code=404,
                detail=f"Student number '{student_number}' not found in enrollment list"
            )
        
        return {
            "success": True,
            "data": enrollment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting student enrollment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/enrollment-list/stats")
async def get_enrollment_stats(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get enrollment list statistics
    Shows summary by department and program
    Uses students table data (with is_active boolean column)
    
    Access: Admin only
    """
    try:
        from sqlalchemy import text
        
        # Check if enrollment_list table exists and has data
        try:
            enrollment_list_count = db.execute(text("""
                SELECT COUNT(*) FROM enrollment_list
            """)).fetchone()[0]
        except:
            enrollment_list_count = 0
        
        if enrollment_list_count > 0:
            # Use enrollment_list table (has status column)
            total = db.execute(text("""
                SELECT COUNT(*) FROM enrollment_list WHERE status = 'active'
            """)).fetchone()[0]
            
            status_counts = db.execute(text("""
                SELECT status, COUNT(*) as count
                FROM enrollment_list
                GROUP BY status
            """)).fetchall()
            by_status = {row[0]: row[1] for row in status_counts}
            
            by_college_rows = db.execute(text("""
                SELECT college_code, COUNT(*) as count
                FROM enrollment_list
                WHERE status = 'active'
                GROUP BY college_code
                ORDER BY college_code
            """)).fetchall()
            by_college = {row[0]: row[1] for row in by_college_rows}
            
            by_program_rows = db.execute(text("""
                SELECT p.program_code, COUNT(*) as count
                FROM enrollment_list e
                JOIN programs p ON e.program_id = p.id
                WHERE e.status = 'active'
                GROUP BY p.program_code
                ORDER BY p.program_code
            """)).fetchall()
            by_program = {row[0]: row[1] for row in by_program_rows}
            
            by_year_rows = db.execute(text("""
                SELECT year_level, COUNT(*) as count
                FROM enrollment_list
                WHERE status = 'active'
                GROUP BY year_level
                ORDER BY year_level
            """)).fetchall()
            by_year = {str(row[0]): row[1] for row in by_year_rows}
        else:
            # Fallback to students table (has is_active boolean column)
            # Get total active students
            total = db.execute(text("""
                SELECT COUNT(*) FROM students WHERE is_active = true
            """)).fetchone()[0]
            
            # Get by active status (convert boolean to 'active'/'inactive')
            active_count = db.execute(text("""
                SELECT COUNT(*) FROM students WHERE is_active = true
            """)).fetchone()[0]
            inactive_count = db.execute(text("""
                SELECT COUNT(*) FROM students WHERE is_active = false
            """)).fetchone()[0]
            by_status = {'active': active_count, 'inactive': inactive_count}
            
            # Get by program
            by_program_rows = db.execute(text("""
                SELECT p.program_code, COUNT(*) as count
                FROM students s
                JOIN programs p ON s.program_id = p.id
                WHERE s.is_active = true
                GROUP BY p.program_code
                ORDER BY p.program_code
            """)).fetchall()
            by_program = {row[0]: row[1] for row in by_program_rows}
            
            # Get by year level
            by_year_rows = db.execute(text("""
                SELECT year_level, COUNT(*) as count
                FROM students
                WHERE is_active = true
                GROUP BY year_level
                ORDER BY year_level
            """)).fetchall()
            by_year = {str(row[0]): row[1] for row in by_year_rows}
            
            # Get by department (from programs table)
            by_college_rows = db.execute(text("""
                SELECT p.department, COUNT(*) as count
                FROM students s
                JOIN programs p ON s.program_id = p.id
                WHERE s.is_active = true
                GROUP BY p.department
                ORDER BY p.department
            """)).fetchall()
            by_college = {row[0]: row[1] for row in by_college_rows}
        
        # Return flat structure that frontend expects
        return {
            "total_students": total,
            "by_status": by_status,
            "by_college": by_college,
            "by_program": by_program,
            "by_year": by_year
        }
        
    except Exception as e:
        logger.error(f"Error getting enrollment stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enrollment-list/upload")


@router.post("/enrollment-list/upload")
async def upload_enrollment_list(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Bulk upload enrollment list from CSV
    
    CSV Format:
    student_number,first_name,last_name,middle_name,program_code,year_level
    
    Access: Admin only
    """
    try:
        from sqlalchemy import text
        
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV")
        
        # Read CSV content
        content = await file.read()
        csv_text = content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_text))
        
        # Get program mapping with college info
        programs_result = db.execute(text("""
            SELECT id, program_code, program_name, department
            FROM programs
        """))
        
        program_map = {row[1]: {'id': row[0], 'name': row[2], 'department': row[3]} for row in programs_result.fetchall()}
        
        imported = 0
        skipped = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                student_number = row['student_number'].strip()
                first_name = row['first_name'].strip()
                last_name = row['last_name'].strip()
                middle_name = row.get('middle_name', '').strip() or None
                program_code = row['program_code'].strip().upper()
                year_level = int(row['year_level'])
                
                # Validate program exists
                if program_code not in program_map:
                    errors.append(f"Row {row_num}: Unknown program '{program_code}'")
                    skipped += 1
                    continue
                
                program_info = program_map[program_code]
                program_id = program_info['id']
                # Derive college info from program's department
                college_code = program_info.get('department', 'N/A') or 'N/A'
                college_name = program_info.get('department', 'N/A') or 'N/A'
                
                # Check if exists
                existing = db.execute(text("""
                    SELECT id FROM enrollment_list
                    WHERE student_number = :student_number
                """), {"student_number": student_number}).fetchone()
                
                if existing:
                    # Update
                    db.execute(text("""
                        UPDATE enrollment_list
                        SET first_name = :first_name,
                            last_name = :last_name,
                            middle_name = :middle_name,
                            program_id = :program_id,
                            year_level = :year_level,
                            college_code = :college_code,
                            college_name = :college_name,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE student_number = :student_number
                    """), {
                        "student_number": student_number,
                        "first_name": first_name,
                        "last_name": last_name,
                        "middle_name": middle_name,
                        "program_id": program_id,
                        "year_level": year_level,
                        "college_code": college_code,
                        "college_name": college_name
                    })
                else:
                    # Insert
                    db.execute(text("""
                        INSERT INTO enrollment_list (
                            student_number, first_name, last_name, middle_name,
                            program_id, year_level, college_code, college_name, 
                            status, created_by
                        ) VALUES (
                            :student_number, :first_name, :last_name, :middle_name,
                            :program_id, :year_level, :college_code, :college_name,
                            'active', :created_by
                        )
                    """), {
                        "student_number": student_number,
                        "first_name": first_name,
                        "last_name": last_name,
                        "middle_name": middle_name,
                        "program_id": program_id,
                        "year_level": year_level,
                        "college_code": college_code,
                        "college_name": college_name,
                        "created_by": current_user["id"]
                    })
                
                imported += 1
                
            except KeyError as e:
                errors.append(f"Row {row_num}: Missing column {e}")
                skipped += 1
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                skipped += 1
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Import complete: {imported} imported/updated, {skipped} skipped",
            "imported": imported,
            "skipped": skipped,
            "errors": errors[:20]  # Return first 20 errors
        }
        
    except Exception as e:
        logger.error(f"Error uploading enrollment list: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
