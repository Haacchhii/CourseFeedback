# Section Management API Endpoints
# Add these to Back/App/routes/system_admin.py

"""
NEW SECTION MANAGEMENT ENDPOINTS
Add these routes to your system_admin.py file
"""

# ============================================
# SECTION MANAGEMENT ENDPOINTS
# ============================================

@router.get("/sections")
async def get_all_sections(
    program_id: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    academic_year: Optional[str] = Query(None),
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get all class sections with enrollment counts"""
    try:
        # Build dynamic filter
        filters = []
        params = {}
        
        if program_id:
            filters.append("c.program_id = :program_id")
            params["program_id"] = program_id
        if semester:
            filters.append("cs.semester = :semester")
            params["semester"] = semester
        if academic_year:
            filters.append("cs.academic_year = :academic_year")
            params["academic_year"] = academic_year
            
        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
        
        query = text(f"""
            SELECT 
                cs.id as section_id,
                cs.section_code,
                cs.semester,
                cs.academic_year,
                c.id as course_id,
                c.subject_code,
                c.subject_name,
                c.year_level,
                p.program_name,
                p.program_code,
                u.first_name || ' ' || u.last_name as instructor_name,
                COUNT(DISTINCT e.student_id) as enrolled_count,
                cs.created_at
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            LEFT JOIN programs p ON c.program_id = p.id
            LEFT JOIN users u ON cs.instructor_id = u.id
            LEFT JOIN enrollments e ON e.class_section_id = cs.id
            {where_clause}
            GROUP BY cs.id, cs.section_code, cs.semester, cs.academic_year,
                     c.id, c.subject_code, c.subject_name, c.year_level,
                     p.program_name, p.program_code, u.first_name, u.last_name, cs.created_at
            ORDER BY cs.academic_year DESC, cs.semester DESC, c.subject_name
        """)
        
        result = db.execute(query, params)
        sections = []
        
        for row in result:
            sections.append({
                "section_id": row[0],
                "section_code": row[1],
                "semester": row[2],
                "academic_year": row[3],
                "course_id": row[4],
                "subject_code": row[5],
                "subject_name": row[6],
                "year_level": row[7],
                "program_name": row[8] or "N/A",
                "program_code": row[9] or "N/A",
                "instructor_name": row[10] or "TBA",
                "enrolled_count": row[11] or 0,
                "created_at": str(row[12])
            })
        
        return {
            "success": True,
            "data": sections,
            "total": len(sections)
        }
        
    except Exception as e:
        logger.error(f"Error fetching sections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sections/{section_id}/students")
async def get_section_students(
    section_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get all students enrolled in a specific section"""
    try:
        query = text("""
            SELECT 
                s.id as student_id,
                s.student_number,
                s.year_level,
                u.first_name,
                u.last_name,
                u.email,
                p.program_name,
                p.program_code,
                e.enrollment_date,
                e.status,
                CASE 
                    WHEN ev.id IS NOT NULL THEN true 
                    ELSE false 
                END as has_evaluated
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN programs p ON s.program_id = p.id
            LEFT JOIN evaluations ev ON ev.student_id = s.id AND ev.class_section_id = e.class_section_id
            WHERE e.class_section_id = :section_id
            ORDER BY u.last_name, u.first_name
        """)
        
        result = db.execute(query, {"section_id": section_id})
        students = []
        
        for row in result:
            students.append({
                "student_id": row[0],
                "student_number": row[1],
                "year_level": row[2],
                "first_name": row[3],
                "last_name": row[4],
                "full_name": f"{row[3]} {row[4]}",
                "email": row[5],
                "program_name": row[6] or "N/A",
                "program_code": row[7] or "N/A",
                "enrollment_date": str(row[8]),
                "status": row[9],
                "has_evaluated": row[10]
            })
        
        return {
            "success": True,
            "data": students,
            "total": len(students)
        }
        
    except Exception as e:
        logger.error(f"Error fetching section students: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sections/{section_id}/available-students")
async def get_available_students_for_section(
    section_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get students who are NOT enrolled in this section but have accounts"""
    try:
        # First get the section's program and year level
        section_info = db.execute(text("""
            SELECT c.program_id, c.year_level
            FROM class_sections cs
            JOIN courses c ON cs.course_id = c.id
            WHERE cs.id = :section_id
        """), {"section_id": section_id}).fetchone()
        
        if not section_info:
            raise HTTPException(status_code=404, detail="Section not found")
        
        # Get students who:
        # 1. Have active accounts
        # 2. Match the section's program (optional - can be removed)
        # 3. Are NOT already enrolled in this section
        query = text("""
            SELECT DISTINCT
                s.id as student_id,
                s.student_number,
                s.year_level,
                u.first_name,
                u.last_name,
                u.email,
                p.program_name,
                p.program_code,
                u.is_active
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE u.is_active = true
            AND s.id NOT IN (
                SELECT student_id 
                FROM enrollments 
                WHERE class_section_id = :section_id
            )
            ORDER BY u.last_name, u.first_name
        """)
        
        result = db.execute(query, {"section_id": section_id})
        students = []
        
        for row in result:
            students.append({
                "student_id": row[0],
                "student_number": row[1],
                "year_level": row[2],
                "first_name": row[3],
                "last_name": row[4],
                "full_name": f"{row[3]} {row[4]}",
                "email": row[5],
                "program_name": row[6] or "N/A",
                "program_code": row[7] or "N/A",
                "is_active": row[8]
            })
        
        return {
            "success": True,
            "data": students,
            "total": len(students)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching available students: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sections/{section_id}/enroll")
async def enroll_students_in_section(
    section_id: int,
    student_ids: List[int] = Body(..., embed=True),
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Enroll multiple students into a section"""
    try:
        # Verify section exists
        section_check = db.execute(text("""
            SELECT id FROM class_sections WHERE id = :section_id
        """), {"section_id": section_id}).fetchone()
        
        if not section_check:
            raise HTTPException(status_code=404, detail="Section not found")
        
        enrolled_count = 0
        skipped_count = 0
        errors = []
        
        for student_id in student_ids:
            try:
                # Check if already enrolled
                existing = db.execute(text("""
                    SELECT id FROM enrollments 
                    WHERE student_id = :student_id AND class_section_id = :section_id
                """), {"student_id": student_id, "section_id": section_id}).fetchone()
                
                if existing:
                    skipped_count += 1
                    continue
                
                # Create enrollment
                db.execute(text("""
                    INSERT INTO enrollments (student_id, class_section_id, status)
                    VALUES (:student_id, :section_id, 'active')
                """), {"student_id": student_id, "section_id": section_id})
                
                enrolled_count += 1
                
            except Exception as e:
                errors.append(f"Student ID {student_id}: {str(e)}")
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "STUDENTS_ENROLLED", "Section Management",
            details={
                "section_id": section_id,
                "enrolled_count": enrolled_count,
                "skipped_count": skipped_count
            }
        )
        
        return {
            "success": True,
            "message": f"Enrolled {enrolled_count} student(s). Skipped {skipped_count} (already enrolled).",
            "enrolled_count": enrolled_count,
            "skipped_count": skipped_count,
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error enrolling students: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sections/{section_id}/students/{student_id}")
async def remove_student_from_section(
    section_id: int,
    student_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Remove a student from a section"""
    try:
        # Check if enrollment exists
        enrollment = db.execute(text("""
            SELECT id FROM enrollments 
            WHERE student_id = :student_id AND class_section_id = :section_id
        """), {"student_id": student_id, "section_id": section_id}).fetchone()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Delete enrollment
        db.execute(text("""
            DELETE FROM enrollments 
            WHERE student_id = :student_id AND class_section_id = :section_id
        """), {"student_id": student_id, "section_id": section_id})
        
        db.commit()
        
        # Log audit event
        await create_audit_log(
            db, current_user_id, "STUDENT_REMOVED", "Section Management",
            details={"section_id": section_id, "student_id": student_id}
        )
        
        return {
            "success": True,
            "message": "Student removed from section successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing student: {e}")
        raise HTTPException(status_code=500, detail=str(e))
