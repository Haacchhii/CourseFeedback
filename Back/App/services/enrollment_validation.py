"""
Enrollment List Validation Service
Validates student information against official enrollment records
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

class EnrollmentValidationService:
    """
    Validates student data against official enrollment list
    Ensures students can only be assigned to their registered programs
    """
    
    @staticmethod
    def validate_student_enrollment(
        db: Session,
        student_number: str,
        program_id: int,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> Dict:
        """
        Validate student against enrollment list
        
        Args:
            db: Database session
            student_number: Student ID number
            program_id: Program ID being assigned
            first_name: Student first name (optional validation)
            last_name: Student last name (optional validation)
        
        Returns:
            Dictionary with validation results
        """
        
        # Check if enrollment list exists
        enrollment = db.execute(text("""
            SELECT 
                e.id,
                e.student_number,
                e.first_name,
                e.last_name,
                e.middle_name,
                e.email,
                e.program_id,
                e.year_level,
                e.college_code,
                e.college_name,
                e.status,
                p.program_code,
                p.program_name
            FROM enrollment_list e
            JOIN programs p ON e.program_id = p.id
            WHERE e.student_number = :student_number
            AND e.status = 'active'
        """), {"student_number": student_number}).fetchone()
        
        if not enrollment:
            return {
                "valid": False,
                "error": "STUDENT_NOT_IN_ENROLLMENT_LIST",
                "message": f"Student number '{student_number}' not found in official enrollment list. Please contact registrar.",
                "suggestion": "Student must be pre-registered in the enrollment list before creating an account."
            }
        
        # Extract enrollment data
        enrolled_program_id = enrollment[6]
        enrolled_program_code = enrollment[11]
        enrolled_program_name = enrollment[12]
        enrolled_first_name = enrollment[2]
        enrolled_last_name = enrollment[3]
        enrolled_email = enrollment[5]
        enrolled_year_level = enrollment[7]
        enrolled_college = enrollment[8]
        
        # Validate program matches
        if enrolled_program_id != program_id:
            # Get the program they're trying to assign
            program_result = db.execute(text("""
                SELECT program_code, program_name
                FROM programs
                WHERE id = :program_id
            """), {"program_id": program_id}).fetchone()
            
            attempted_program = program_result[0] if program_result else "Unknown"
            
            return {
                "valid": False,
                "error": "PROGRAM_MISMATCH",
                "message": f"Program mismatch! Student '{student_number}' is enrolled in {enrolled_program_code}, not {attempted_program}.",
                "enrolled_program": {
                    "id": enrolled_program_id,
                    "code": enrolled_program_code,
                    "name": enrolled_program_name
                },
                "attempted_program": {
                    "id": program_id,
                    "code": attempted_program,
                    "name": program_result[1] if program_result else "Unknown"
                },
                "suggestion": f"Please select program: {enrolled_program_code} - {enrolled_program_name}"
            }
        
        # Validate name if provided (case-insensitive partial match)
        name_warnings = []
        if first_name and enrolled_first_name.lower() not in first_name.lower() and first_name.lower() not in enrolled_first_name.lower():
            name_warnings.append(f"First name mismatch: Provided '{first_name}', Expected '{enrolled_first_name}'")
        
        if last_name and enrolled_last_name.lower() not in last_name.lower() and last_name.lower() not in enrolled_last_name.lower():
            name_warnings.append(f"Last name mismatch: Provided '{last_name}', Expected '{enrolled_last_name}'")
        
        return {
            "valid": True,
            "enrollment": {
                "student_number": student_number,
                "first_name": enrolled_first_name,
                "last_name": enrolled_last_name,
                "middle_name": enrollment[4],
                "email": enrolled_email,
                "program_id": enrolled_program_id,
                "program_code": enrolled_program_code,
                "program_name": enrolled_program_name,
                "year_level": enrolled_year_level,
                "college_code": enrolled_college,
                "college_name": enrollment[9]
            },
            "warnings": name_warnings if name_warnings else None,
            "message": "Student validated successfully against enrollment list"
        }
    
    
    @staticmethod
    def get_student_enrollment_info(db: Session, student_number: str) -> Optional[Dict]:
        """
        Get enrollment information for a student
        
        Args:
            db: Database session
            student_number: Student ID number
        
        Returns:
            Dictionary with enrollment info or None if not found
        """
        
        enrollment = db.execute(text("""
            SELECT 
                e.id,
                e.student_number,
                e.first_name,
                e.last_name,
                e.middle_name,
                e.email,
                e.program_id,
                e.year_level,
                e.college_code,
                e.college_name,
                e.status,
                p.program_code,
                p.program_name
            FROM enrollment_list e
            JOIN programs p ON e.program_id = p.id
            WHERE e.student_number = :student_number
        """), {"student_number": student_number}).fetchone()
        
        if not enrollment:
            return None
        
        return {
            "id": enrollment[0],
            "student_number": enrollment[1],
            "first_name": enrollment[2],
            "last_name": enrollment[3],
            "middle_name": enrollment[4],
            "email": enrollment[5],
            "program_id": enrollment[6],
            "year_level": enrollment[7],
            "college_code": enrollment[8],
            "college_name": enrollment[9],
            "status": enrollment[10],
            "program_code": enrollment[11],
            "program_name": enrollment[12]
        }
    
    
    @staticmethod
    def search_enrollment_list(
        db: Session,
        query: Optional[str] = None,
        program_id: Optional[int] = None,
        college_code: Optional[str] = None,
        year_level: Optional[int] = None,
        status: str = 'active',
        limit: int = 100
    ) -> list:
        """
        Search enrollment list with filters
        
        Args:
            db: Database session
            query: Search by name or student number
            program_id: Filter by program
            college_code: Filter by college
            year_level: Filter by year level
            status: Filter by status (default: active)
            limit: Maximum results
        
        Returns:
            List of enrollment records
        """
        
        sql = """
            SELECT 
                e.id,
                e.student_number,
                e.first_name,
                e.last_name,
                e.middle_name,
                e.email,
                e.program_id,
                e.year_level,
                e.college_code,
                e.college_name,
                e.status,
                p.program_code,
                p.program_name,
                e.date_enrolled
            FROM enrollment_list e
            JOIN programs p ON e.program_id = p.id
            WHERE 1=1
        """
        
        params = {}
        
        if status:
            sql += " AND e.status = :status"
            params["status"] = status
        
        if query:
            sql += """ AND (
                LOWER(e.student_number) LIKE LOWER(:query) OR
                LOWER(e.first_name) LIKE LOWER(:query) OR
                LOWER(e.last_name) LIKE LOWER(:query) OR
                LOWER(CONCAT(e.first_name, ' ', e.last_name)) LIKE LOWER(:query)
            )"""
            params["query"] = f"%{query}%"
        
        if program_id:
            sql += " AND e.program_id = :program_id"
            params["program_id"] = program_id
        
        if college_code:
            sql += " AND e.college_code = :college_code"
            params["college_code"] = college_code
        
        if year_level:
            sql += " AND e.year_level = :year_level"
            params["year_level"] = year_level
        
        sql += " ORDER BY e.college_code, e.student_number LIMIT :limit"
        params["limit"] = limit
        
        results = db.execute(text(sql), params).fetchall()
        
        return [
            {
                "id": row[0],
                "student_number": row[1],
                "first_name": row[2],
                "last_name": row[3],
                "middle_name": row[4],
                "email": row[5],
                "program_id": row[6],
                "year_level": row[7],
                "college_code": row[8],
                "college_name": row[9],
                "status": row[10],
                "program_code": row[11],
                "program_name": row[12],
                "date_enrolled": str(row[13]) if row[13] else None
            }
            for row in results
        ]
    
    
    @staticmethod
    def check_enrollment_list_exists(db: Session) -> bool:
        """
        Check if enrollment list table exists and has data
        
        Args:
            db: Database session
        
        Returns:
            True if table exists and has records, False otherwise
        """
        try:
            result = db.execute(text("""
                SELECT COUNT(*) FROM enrollment_list WHERE status = 'active'
            """)).fetchone()
            
            return result[0] > 0 if result else False
        except Exception:
            return False
