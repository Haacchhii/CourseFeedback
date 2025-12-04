"""
Student Year Level Advancement System
Automatically advances students to next year level after completing 3 semesters (1 academic year)
Also handles enrollment carryover and period transitions
"""

from database.connection import get_db
from sqlalchemy import text
from datetime import datetime
from typing import Optional, List, Dict
import logging
import json

logger = logging.getLogger(__name__)

class StudentAdvancementService:
    """
    Handles student year level advancement and enrollment transitions
    """
    
    @staticmethod
    def advance_students_year_level(
        db,
        program_id: Optional[int] = None,
        current_year_level: Optional[int] = None,
        dry_run: bool = True
    ) -> Dict:
        """
        Advance students to next year level after completing academic year
        
        Args:
            db: Database session
            program_id: Filter by specific program (None = all programs)
            current_year_level: Filter by specific year level (None = all levels)
            dry_run: If True, only shows what would happen without making changes
        
        Returns:
            Dictionary with advancement results
        """
        
        # Build query to find students eligible for advancement
        query = """
            SELECT 
                s.id,
                s.student_number,
                s.year_level,
                s.program_id,
                u.first_name,
                u.last_name,
                p.program_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN programs p ON s.program_id = p.id
            WHERE s.is_active = true
            AND s.year_level < 4  -- Don't advance year 4 students
        """
        
        params = {}
        
        if program_id:
            query += " AND s.program_id = :program_id"
            params['program_id'] = program_id
        
        if current_year_level:
            query += " AND s.year_level = :current_year_level"
            params['current_year_level'] = current_year_level
        
        query += " ORDER BY s.program_id, s.year_level, s.student_number"
        
        # Get eligible students
        students = db.execute(text(query), params).fetchall()
        
        if not students:
            return {
                "success": True,
                "dry_run": dry_run,
                "students_advanced": 0,
                "message": "No eligible students found for advancement"
            }
        
        # Group by current year level for reporting
        advancement_plan = {}
        for student in students:
            current_level = student[2]
            new_level = current_level + 1
            
            if current_level not in advancement_plan:
                advancement_plan[current_level] = {
                    "from_year": current_level,
                    "to_year": new_level,
                    "students": []
                }
            
            advancement_plan[current_level]["students"].append({
                "id": student[0],
                "student_number": student[1],
                "name": f"{student[4]} {student[5]}",
                "program": student[6]
            })
        
        # Execute advancement if not dry run
        if not dry_run:
            # Create snapshot BEFORE making changes
            snapshot_result = StudentAdvancementService.create_advancement_snapshot(
                db, 
                description=f"Before advancing {len(students)} students"
            )
            snapshot_id = snapshot_result.get("snapshot_id")
            
            for student in students:
                student_id = student[0]
                new_year_level = student[2] + 1
                
                db.execute(text("""
                    UPDATE students
                    SET year_level = :new_year_level
                    WHERE id = :student_id
                """), {
                    "new_year_level": new_year_level,
                    "student_id": student_id
                })
            
            db.commit()
            
            # Log the advancement
            logger.info(f"Advanced {len(students)} students to next year level (snapshot: {snapshot_id})")
        
        result = {
            "success": True,
            "dry_run": dry_run,
            "students_advanced": len(students),
            "advancement_plan": advancement_plan,
            "message": f"{'Would advance' if dry_run else 'Advanced'} {len(students)} students"
        }
        
        # Include snapshot ID if real execution
        if not dry_run and 'snapshot_id' in locals():
            result["snapshot_id"] = snapshot_id
            result["rollback_info"] = f"To rollback, use snapshot_id: {snapshot_id}"
        
        return result
    
    
    @staticmethod
    def create_next_period_enrollments(
        db,
        from_period_id: int,
        to_period_id: int,
        auto_advance_year: bool = False,
        dry_run: bool = True
    ) -> Dict:
        """
        Copy enrollments from one evaluation period to the next
        Optionally advances year level for students (if 3 semesters completed)
        
        Args:
            db: Database session
            from_period_id: Source evaluation period
            to_period_id: Target evaluation period
            auto_advance_year: If True, advances students who completed 3 semesters
            dry_run: If True, only shows what would happen
        
        Returns:
            Dictionary with enrollment creation results
        """
        
        # Get period details
        from_period = db.execute(text("""
            SELECT id, name, semester, academic_year
            FROM evaluation_periods
            WHERE id = :period_id
        """), {"period_id": from_period_id}).fetchone()
        
        to_period = db.execute(text("""
            SELECT id, name, semester, academic_year
            FROM evaluation_periods
            WHERE id = :period_id
        """), {"period_id": to_period_id}).fetchone()
        
        if not from_period:
            return {
                "success": False,
                "error": f"Source period {from_period_id} not found"
            }
        
        if not to_period:
            return {
                "success": False,
                "error": f"Target period {to_period_id} not found"
            }
        
        # Detect if this is a new academic year (3rd semester -> 1st semester transition)
        is_new_academic_year = False
        if from_period[2] == "Summer" and to_period[2] == "First Semester":
            is_new_academic_year = True
        elif "3rd" in from_period[2] and "1st" in to_period[2]:
            is_new_academic_year = True
        
        # Get students from previous period
        students_to_enroll = db.execute(text("""
            SELECT DISTINCT
                s.id,
                s.student_number,
                s.year_level,
                s.program_id,
                u.first_name,
                u.last_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN enrollments e ON s.id = e.student_id
            WHERE e.evaluation_period_id = :from_period_id
            AND s.is_active = true
            ORDER BY s.program_id, s.year_level, s.student_number
        """), {"from_period_id": from_period_id}).fetchall()
        
        if not students_to_enroll:
            return {
                "success": False,
                "error": f"No students found in period {from_period_id}"
            }
        
        # Determine which students should advance year level
        students_to_advance = []
        if auto_advance_year and is_new_academic_year:
            students_to_advance = [s for s in students_to_enroll if s[2] < 4]
        
        # Get courses for each student based on their year level
        enrollments_to_create = []
        
        for student in students_to_enroll:
            student_id = student[0]
            current_year = student[2]
            target_year = current_year + 1 if student in students_to_advance else current_year
            program_id = student[3]
            
            # Get class sections for target year level and new period
            # Match courses to student's program and year level
            sections = db.execute(text("""
                SELECT cs.id, c.subject_code, c.subject_name
                FROM class_sections cs
                JOIN courses c ON cs.course_id = c.id
                WHERE c.program_id = :program_id
                AND c.year_level = :year_level
                AND cs.semester = :semester
                AND cs.academic_year = :academic_year
            """), {
                "program_id": program_id,
                "year_level": target_year,
                "semester": to_period[2],
                "academic_year": to_period[3]
            }).fetchall()
            
            for section in sections:
                enrollments_to_create.append({
                    "student_id": student_id,
                    "student_number": student[1],
                    "student_name": f"{student[4]} {student[5]}",
                    "class_section_id": section[0],
                    "course_code": section[1],
                    "course_name": section[2],
                    "evaluation_period_id": to_period_id,
                    "year_level": target_year
                })
        
        # Execute enrollment creation if not dry run
        if not dry_run:
            # Advance students first if needed
            if students_to_advance:
                for student in students_to_advance:
                    db.execute(text("""
                        UPDATE students
                        SET year_level = year_level + 1
                        WHERE id = :student_id
                    """), {"student_id": student[0]})
            
            # Create enrollments
            for enrollment in enrollments_to_create:
                db.execute(text("""
                    INSERT INTO enrollments (
                        student_id,
                        class_section_id,
                        evaluation_period_id,
                        status,
                        enrolled_at
                    ) VALUES (
                        :student_id,
                        :class_section_id,
                        :evaluation_period_id,
                        'active',
                        NOW()
                    )
                    ON CONFLICT DO NOTHING
                """), enrollment)
            
            db.commit()
            
            logger.info(f"Created {len(enrollments_to_create)} enrollments for period {to_period_id}")
            if students_to_advance:
                logger.info(f"Advanced {len(students_to_advance)} students to next year level")
        
        return {
            "success": True,
            "dry_run": dry_run,
            "from_period": from_period[1],
            "to_period": to_period[1],
            "is_new_academic_year": is_new_academic_year,
            "students_advanced": len(students_to_advance),
            "enrollments_created": len(enrollments_to_create),
            "students_affected": len(students_to_enroll),
            "message": (
                f"{'Would create' if dry_run else 'Created'} {len(enrollments_to_create)} enrollments "
                f"for {len(students_to_enroll)} students. "
                f"{'Would advance' if dry_run else 'Advanced'} {len(students_to_advance)} students to next year."
            )
        }
    
    
    @staticmethod
    def get_advancement_eligibility_report(db) -> Dict:
        """
        Generate report of students eligible for year level advancement
        Shows students by year level and program
        """
        
        query = text("""
            SELECT 
                s.year_level,
                p.program_name,
                p.program_code,
                COUNT(*) as student_count
            FROM students s
            JOIN programs p ON s.program_id = p.id
            WHERE s.is_active = true
            AND s.year_level < 4
            GROUP BY s.year_level, p.program_name, p.program_code
            ORDER BY p.program_code, s.year_level
        """)
        
        results = db.execute(query).fetchall()
        
        report = {
            "total_eligible": 0,
            "by_program": {},
            "by_year_level": {1: 0, 2: 0, 3: 0}
        }
        
        for row in results:
            year_level = row[0]
            program_name = row[1]
            program_code = row[2]
            count = row[3]
            
            report["total_eligible"] += count
            report["by_year_level"][year_level] += count
            
            if program_code not in report["by_program"]:
                report["by_program"][program_code] = {
                    "program_name": program_name,
                    "year_1": 0,
                    "year_2": 0,
                    "year_3": 0,
                    "total": 0
                }
            
            report["by_program"][program_code][f"year_{year_level}"] = count
            report["by_program"][program_code]["total"] += count
        
        return report
    
    
    @staticmethod
    def create_advancement_snapshot(db, description: str = "Manual snapshot") -> Dict:
        """
        Create a snapshot of current student year levels before advancement
        This allows rollback if advancement was done by mistake
        
        Args:
            db: Database session
            description: Description of this snapshot
        
        Returns:
            Dictionary with snapshot ID and student count
        """
        
        # Get all active students with their current year levels
        students = db.execute(text("""
            SELECT 
                s.id,
                s.student_number,
                s.year_level,
                s.program_id,
                u.first_name,
                u.last_name,
                p.program_code
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN programs p ON s.program_id = p.id
            WHERE s.is_active = true
            ORDER BY s.id
        """)).fetchall()
        
        # Create snapshot data
        snapshot_data = []
        for student in students:
            snapshot_data.append({
                "student_id": student[0],
                "student_number": student[1],
                "year_level": student[2],
                "program_id": student[3],
                "student_name": f"{student[4]} {student[5]}",
                "program": student[6]
            })
        
        # Store snapshot in audit_logs table with special action type
        snapshot_json = json.dumps(snapshot_data, indent=2)
        
        result = db.execute(text("""
            INSERT INTO audit_logs (
                user_id,
                action,
                entity_type,
                entity_id,
                changes,
                ip_address,
                user_agent,
                severity,
                timestamp
            ) VALUES (
                1,
                'ADVANCEMENT_SNAPSHOT',
                'students',
                NULL,
                :snapshot_data,
                'system',
                'StudentAdvancementService',
                'info',
                NOW()
            )
            RETURNING id
        """), {"snapshot_data": snapshot_json})
        
        snapshot_id = result.fetchone()[0]
        db.commit()
        
        logger.info(f"Created advancement snapshot {snapshot_id} with {len(snapshot_data)} students")
        
        return {
            "success": True,
            "snapshot_id": snapshot_id,
            "student_count": len(snapshot_data),
            "timestamp": datetime.now().isoformat(),
            "description": description,
            "message": f"Created snapshot with {len(snapshot_data)} students"
        }
    
    
    @staticmethod
    def rollback_advancement(db, snapshot_id: Optional[int] = None, dry_run: bool = True) -> Dict:
        """
        Rollback student year levels to a previous snapshot
        Use this to undo accidental advancements
        
        Args:
            db: Database session
            snapshot_id: Specific snapshot to restore (None = latest snapshot)
            dry_run: If True, only shows what would happen
        
        Returns:
            Dictionary with rollback results
        """
        
        # Get the snapshot to restore
        if snapshot_id:
            snapshot_query = text("""
                SELECT id, changes, timestamp
                FROM audit_logs
                WHERE id = :snapshot_id
                AND action = 'ADVANCEMENT_SNAPSHOT'
            """)
            snapshot = db.execute(snapshot_query, {"snapshot_id": snapshot_id}).fetchone()
        else:
            # Get the most recent snapshot
            snapshot_query = text("""
                SELECT id, changes, timestamp
                FROM audit_logs
                WHERE action = 'ADVANCEMENT_SNAPSHOT'
                ORDER BY timestamp DESC
                LIMIT 1
            """)
            snapshot = db.execute(snapshot_query).fetchone()
        
        if not snapshot:
            return {
                "success": False,
                "error": "No snapshot found to restore"
            }
        
        snapshot_id = snapshot[0]
        snapshot_data = json.loads(snapshot[1])
        snapshot_timestamp = snapshot[2]
        
        # Get current student year levels
        current_students = db.execute(text("""
            SELECT id, year_level
            FROM students
            WHERE is_active = true
        """)).fetchall()
        
        current_year_levels = {s[0]: s[1] for s in current_students}
        
        # Calculate what needs to be rolled back
        students_to_rollback = []
        rollback_plan = {}
        
        for student_data in snapshot_data:
            student_id = student_data["student_id"]
            old_year_level = student_data["year_level"]
            current_year_level = current_year_levels.get(student_id)
            
            if current_year_level and current_year_level != old_year_level:
                students_to_rollback.append({
                    "student_id": student_id,
                    "student_number": student_data["student_number"],
                    "name": student_data["student_name"],
                    "program": student_data["program"],
                    "current_year": current_year_level,
                    "rollback_to_year": old_year_level
                })
                
                transition = f"{current_year_level}->{old_year_level}"
                if transition not in rollback_plan:
                    rollback_plan[transition] = []
                rollback_plan[transition].append(student_data["student_name"])
        
        # Execute rollback if not dry run
        if not dry_run and students_to_rollback:
            for student in students_to_rollback:
                db.execute(text("""
                    UPDATE students
                    SET year_level = :old_year_level
                    WHERE id = :student_id
                """), {
                    "old_year_level": student["rollback_to_year"],
                    "student_id": student["student_id"]
                })
            
            # Log the rollback
            db.execute(text("""
                INSERT INTO audit_logs (
                    user_id,
                    action,
                    entity_type,
                    entity_id,
                    changes,
                    ip_address,
                    user_agent,
                    severity,
                    timestamp
                ) VALUES (
                    1,
                    'ADVANCEMENT_ROLLBACK',
                    'students',
                    :snapshot_id,
                    :rollback_data,
                    'system',
                    'StudentAdvancementService',
                    'warning',
                    NOW()
                )
            """), {
                "snapshot_id": snapshot_id,
                "rollback_data": json.dumps({
                    "students_affected": len(students_to_rollback),
                    "rollback_plan": rollback_plan
                })
            })
            
            db.commit()
            logger.warning(f"Rolled back {len(students_to_rollback)} students to snapshot {snapshot_id}")
        
        return {
            "success": True,
            "dry_run": dry_run,
            "snapshot_id": snapshot_id,
            "snapshot_timestamp": str(snapshot_timestamp),
            "students_rolled_back": len(students_to_rollback),
            "rollback_plan": rollback_plan,
            "students": students_to_rollback,
            "message": (
                f"{'Would rollback' if dry_run else 'Rolled back'} {len(students_to_rollback)} students "
                f"to snapshot {snapshot_id} from {snapshot_timestamp}"
            )
        }
    
    
    @staticmethod
    def list_advancement_snapshots(db, limit: int = 10) -> Dict:
        """
        List available advancement snapshots for rollback
        
        Args:
            db: Database session
            limit: Maximum number of snapshots to return
        
        Returns:
            Dictionary with list of snapshots
        """
        
        snapshots = db.execute(text("""
            SELECT 
                id,
                timestamp,
                changes
            FROM audit_logs
            WHERE action = 'ADVANCEMENT_SNAPSHOT'
            ORDER BY timestamp DESC
            LIMIT :limit
        """), {"limit": limit}).fetchall()
        
        snapshot_list = []
        for snapshot in snapshots:
            snapshot_data = json.loads(snapshot[2])
            snapshot_list.append({
                "snapshot_id": snapshot[0],
                "timestamp": str(snapshot[1]),
                "student_count": len(snapshot_data),
                "description": f"Snapshot of {len(snapshot_data)} students"
            })
        
        return {
            "success": True,
            "snapshots": snapshot_list,
            "total": len(snapshot_list)
        }


def run_year_end_advancement(db, dry_run: bool = True) -> Dict:
    """
    Convenience function to run end-of-year advancement
    Advances all eligible students (Year 1->2, Year 2->3, Year 3->4)
    """
    
    service = StudentAdvancementService()
    
    print("=" * 80)
    print("YEAR-END STUDENT ADVANCEMENT")
    print("=" * 80)
    print(f"Mode: {'DRY RUN (Preview Only)' if dry_run else 'LIVE (Will Make Changes)'}")
    print()
    
    # Get eligibility report first
    print("Current Student Distribution:")
    print("-" * 80)
    report = service.get_advancement_eligibility_report(db)
    
    for program_code, data in report["by_program"].items():
        print(f"\n{program_code} - {data['program_name']}:")
        print(f"  Year 1: {data['year_1']} students -> Would advance to Year 2")
        print(f"  Year 2: {data['year_2']} students -> Would advance to Year 3")
        print(f"  Year 3: {data['year_3']} students -> Would advance to Year 4")
        print(f"  Total: {data['total']} students eligible")
    
    print(f"\nTotal Students Eligible: {report['total_eligible']}")
    
    # Execute advancement
    print("\n" + "=" * 80)
    print("EXECUTING ADVANCEMENT")
    print("=" * 80)
    
    result = service.advance_students_year_level(db, dry_run=dry_run)
    
    if result["success"]:
        print(f"\n✅ {result['message']}")
        
        if result.get("advancement_plan"):
            print("\nAdvancement Details:")
            for year, details in result["advancement_plan"].items():
                print(f"\n  Year {details['from_year']} -> Year {details['to_year']}:")
                print(f"  {len(details['students'])} students")
                for student in details["students"][:5]:  # Show first 5
                    print(f"    • {student['student_number']} - {student['name']} ({student['program']})")
                if len(details["students"]) > 5:
                    print(f"    ... and {len(details['students']) - 5} more")
    else:
        print(f"\n❌ Error: {result.get('error', 'Unknown error')}")
    
    print("\n" + "=" * 80)
    
    return result


if __name__ == "__main__":
    # Run as standalone script
    db = next(get_db())
    
    # Always start with dry run
    result = run_year_end_advancement(db, dry_run=True)
    
    if result["success"] and result["students_advanced"] > 0:
        print("\n" + "=" * 80)
        print("⚠️  DRY RUN COMPLETE - No changes were made")
        print("=" * 80)
        print("\nTo execute advancement for real, run:")
        print("  python advance_students.py --execute")
        print("\nOr in Python code:")
        print("  run_year_end_advancement(db, dry_run=False)")
    
    db.close()
