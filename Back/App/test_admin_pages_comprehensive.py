"""
Comprehensive Admin Page Testing Script
Tests all admin endpoints and functionality
"""

import os
import sys
import json
from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.connection import get_db, engine
from models.enhanced_models import (
    User, Student, EvaluationPeriod, Course, ClassSection, 
    Enrollment, Evaluation, Program, AuditLog, ExportHistory,
    Secretary, DepartmentHead
)

class AdminPageTester:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "pages": {},
            "summary": {"passed": 0, "failed": 0, "warnings": 0}
        }
        self.db = next(get_db())
    
    def log_result(self, page: str, test_name: str, status: str, details: str = ""):
        """Log a test result"""
        if page not in self.results["pages"]:
            self.results["pages"][page] = []
        
        self.results["pages"][page].append({
            "test": test_name,
            "status": status,  # PASS, FAIL, WARN
            "details": details
        })
        
        if status == "PASS":
            self.results["summary"]["passed"] += 1
        elif status == "FAIL":
            self.results["summary"]["failed"] += 1
        else:
            self.results["summary"]["warnings"] += 1
        
        icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"  {icon} [{status}] {test_name}: {details}")
    
    # ===========================
    # ADMIN DASHBOARD TESTS
    # ===========================
    def test_admin_dashboard(self):
        """Test Admin Dashboard page functionality"""
        print("\n" + "="*60)
        print("📊 TESTING: Admin Dashboard")
        print("="*60)
        
        page = "AdminDashboard"
        
        # Test 1: Dashboard Stats Query
        try:
            result = self.db.execute(text("""
                SELECT 
                    (SELECT COUNT(*) FROM users) as total_users,
                    (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
                    (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
                    (SELECT COUNT(*) FROM courses) as total_courses,
                    (SELECT COUNT(*) FROM evaluations) as total_evaluations,
                    (SELECT COUNT(*) FROM programs) as total_programs,
                    (SELECT COUNT(*) FROM class_sections) as total_sections
            """)).fetchone()
            
            self.log_result(page, "Dashboard Stats Query", "PASS", 
                f"Users: {result[0]}, Students: {result[1]}, Admins: {result[2]}, Courses: {result[3]}, Evaluations: {result[4]}")
        except Exception as e:
            self.log_result(page, "Dashboard Stats Query", "FAIL", str(e))
        
        # Test 2: Program Stats
        try:
            result = self.db.execute(text("""
                SELECT p.program_code, p.program_name, COUNT(DISTINCT s.id) as students
                FROM programs p
                LEFT JOIN students s ON p.id = s.program_id
                GROUP BY p.id, p.program_code, p.program_name
            """)).fetchall()
            
            self.log_result(page, "Program Stats Query", "PASS", 
                f"Found {len(result)} programs with student counts")
        except Exception as e:
            self.log_result(page, "Program Stats Query", "FAIL", str(e))
        
        # Test 3: Sentiment Stats
        try:
            result = self.db.execute(text("""
                SELECT sentiment, COUNT(*) as count
                FROM evaluations
                WHERE sentiment IS NOT NULL
                GROUP BY sentiment
            """)).fetchall()
            
            sentiment_summary = {row[0]: row[1] for row in result}
            self.log_result(page, "Sentiment Stats Query", "PASS", 
                f"Sentiment distribution: {sentiment_summary}")
        except Exception as e:
            self.log_result(page, "Sentiment Stats Query", "FAIL", str(e))
        
        # Test 4: Recent Evaluations
        try:
            result = self.db.execute(text("""
                SELECT e.id, e.submitted_at, c.subject_name
                FROM evaluations e
                JOIN class_sections cs ON e.class_section_id = cs.id
                JOIN courses c ON cs.course_id = c.id
                ORDER BY e.submitted_at DESC NULLS LAST
                LIMIT 10
            """)).fetchall()
            
            self.log_result(page, "Recent Evaluations Query", "PASS", 
                f"Retrieved {len(result)} recent evaluations")
        except Exception as e:
            self.log_result(page, "Recent Evaluations Query", "FAIL", str(e))
        
        # Test 5: Active Period Check
        try:
            result = self.db.execute(text("""
                SELECT id, name, status, start_date, end_date
                FROM evaluation_periods
                WHERE status IN ('active', 'Open')
                ORDER BY created_at DESC
                LIMIT 1
            """)).fetchone()
            
            if result:
                self.log_result(page, "Active Period Check", "PASS", 
                    f"Active period: {result[1]} (ID: {result[0]})")
            else:
                self.log_result(page, "Active Period Check", "WARN", 
                    "No active evaluation period found")
        except Exception as e:
            self.log_result(page, "Active Period Check", "FAIL", str(e))
    
    # ===========================
    # USER MANAGEMENT TESTS
    # ===========================
    def test_user_management(self):
        """Test User Management page functionality"""
        print("\n" + "="*60)
        print("👥 TESTING: User Management")
        print("="*60)
        
        page = "UserManagement"
        
        # Test 1: Get All Users Query
        try:
            result = self.db.execute(text("""
                SELECT id, email, first_name, last_name, role, is_active, school_id
                FROM users
                ORDER BY created_at DESC
                LIMIT 100
            """)).fetchall()
            
            self.log_result(page, "Get All Users", "PASS", 
                f"Retrieved {len(result)} users")
        except Exception as e:
            self.log_result(page, "Get All Users", "FAIL", str(e))
        
        # Test 2: Filter by Role
        for role in ['student', 'admin', 'secretary', 'department_head']:
            try:
                result = self.db.execute(text("""
                    SELECT COUNT(*) FROM users WHERE role = :role
                """), {"role": role}).scalar()
                
                self.log_result(page, f"Filter by Role ({role})", "PASS", 
                    f"Found {result} users with role '{role}'")
            except Exception as e:
                self.log_result(page, f"Filter by Role ({role})", "FAIL", str(e))
        
        # Test 3: Filter by Status (Active/Inactive)
        try:
            active = self.db.execute(text("SELECT COUNT(*) FROM users WHERE is_active = true")).scalar()
            inactive = self.db.execute(text("SELECT COUNT(*) FROM users WHERE is_active = false")).scalar()
            
            self.log_result(page, "Filter by Status", "PASS", 
                f"Active: {active}, Inactive: {inactive}")
        except Exception as e:
            self.log_result(page, "Filter by Status", "FAIL", str(e))
        
        # Test 4: Filter by Program (Students)
        try:
            result = self.db.execute(text("""
                SELECT p.program_code, COUNT(s.id) as count
                FROM programs p
                LEFT JOIN students s ON p.id = s.program_id
                GROUP BY p.id, p.program_code
            """)).fetchall()
            
            programs_with_students = [(r[0], r[1]) for r in result if r[1] > 0]
            self.log_result(page, "Filter by Program", "PASS", 
                f"Programs with students: {programs_with_students[:5]}...")
        except Exception as e:
            self.log_result(page, "Filter by Program", "FAIL", str(e))
        
        # Test 5: Filter by Year Level
        try:
            result = self.db.execute(text("""
                SELECT year_level, COUNT(*) as count
                FROM students
                WHERE year_level IS NOT NULL
                GROUP BY year_level
                ORDER BY year_level
            """)).fetchall()
            
            year_levels = {r[0]: r[1] for r in result}
            self.log_result(page, "Filter by Year Level", "PASS", 
                f"Year level distribution: {year_levels}")
        except Exception as e:
            self.log_result(page, "Filter by Year Level", "FAIL", str(e))
        
        # Test 6: Search Functionality
        try:
            result = self.db.execute(text("""
                SELECT COUNT(*) FROM users 
                WHERE email ILIKE '%@%' OR first_name ILIKE '%a%'
            """)).scalar()
            
            self.log_result(page, "Search Functionality", "PASS", 
                f"Search query works, found {result} matching users")
        except Exception as e:
            self.log_result(page, "Search Functionality", "FAIL", str(e))
        
        # Test 7: User Details with Student Info
        try:
            result = self.db.execute(text("""
                SELECT u.id, u.email, u.role, s.student_number, s.year_level, p.program_code
                FROM users u
                LEFT JOIN students s ON u.id = s.user_id
                LEFT JOIN programs p ON s.program_id = p.id
                WHERE u.role = 'student'
                LIMIT 5
            """)).fetchall()
            
            self.log_result(page, "User Details with Student Info", "PASS", 
                f"Retrieved {len(result)} students with complete info")
        except Exception as e:
            self.log_result(page, "User Details with Student Info", "FAIL", str(e))
        
        # Test 8: Bulk Import Validation Check
        try:
            # Check if enrollment_list table exists
            result = self.db.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'enrollment_list'
            """)).scalar()
            
            if result > 0:
                list_count = self.db.execute(text("SELECT COUNT(*) FROM enrollment_list")).scalar()
                self.log_result(page, "Enrollment List for Validation", "PASS", 
                    f"Enrollment list exists with {list_count} entries")
            else:
                self.log_result(page, "Enrollment List for Validation", "WARN", 
                    "Enrollment list table not found - bulk import validation disabled")
        except Exception as e:
            self.log_result(page, "Enrollment List for Validation", "FAIL", str(e))
    
    # ===========================
    # EVALUATION PERIOD TESTS
    # ===========================
    def test_evaluation_periods(self):
        """Test Evaluation Period Management functionality"""
        print("\n" + "="*60)
        print("📅 TESTING: Evaluation Period Management")
        print("="*60)
        
        page = "EvaluationPeriodManagement"
        
        # Test 1: Get All Periods
        try:
            result = self.db.execute(text("""
                SELECT id, name, semester, academic_year, status, start_date, end_date
                FROM evaluation_periods
                ORDER BY start_date DESC
            """)).fetchall()
            
            self.log_result(page, "Get All Periods", "PASS", 
                f"Found {len(result)} evaluation periods")
            
            # Show status breakdown
            statuses = {}
            for r in result:
                statuses[r[4]] = statuses.get(r[4], 0) + 1
            self.log_result(page, "Period Status Distribution", "PASS", 
                f"Status distribution: {statuses}")
        except Exception as e:
            self.log_result(page, "Get All Periods", "FAIL", str(e))
        
        # Test 2: Period Evaluations Count
        try:
            result = self.db.execute(text("""
                SELECT ep.id, ep.name, COUNT(e.id) as eval_count
                FROM evaluation_periods ep
                LEFT JOIN evaluations e ON ep.id = e.evaluation_period_id
                GROUP BY ep.id, ep.name
            """)).fetchall()
            
            periods_with_evals = [(r[1], r[2]) for r in result if r[2] > 0]
            self.log_result(page, "Period Evaluation Counts", "PASS", 
                f"Periods with evaluations: {periods_with_evals[:5]}")
        except Exception as e:
            self.log_result(page, "Period Evaluation Counts", "FAIL", str(e))
        
        # Test 3: Enrolled Sections Check
        try:
            result = self.db.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'period_enrollments'
            """)).scalar()
            
            if result > 0:
                enrollments = self.db.execute(text("""
                    SELECT ep.name, COUNT(pe.id) as sections
                    FROM evaluation_periods ep
                    LEFT JOIN period_enrollments pe ON ep.id = pe.evaluation_period_id
                    GROUP BY ep.id, ep.name
                """)).fetchall()
                
                self.log_result(page, "Period Enrollments Table", "PASS", 
                    f"Period section enrollments working")
            else:
                self.log_result(page, "Period Enrollments Table", "WARN", 
                    "period_enrollments table not found")
        except Exception as e:
            self.log_result(page, "Period Enrollments Table", "FAIL", str(e))
        
        # Test 4: Program Section Enrollments
        try:
            result = self.db.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'period_program_sections'
            """)).scalar()
            
            if result > 0:
                self.log_result(page, "Program Section Enrollments Table", "PASS", 
                    "period_program_sections table exists")
            else:
                self.log_result(page, "Program Section Enrollments Table", "WARN", 
                    "period_program_sections table not found")
        except Exception as e:
            self.log_result(page, "Program Section Enrollments Table", "FAIL", str(e))
        
        # Test 5: Period Date Validation
        try:
            result = self.db.execute(text("""
                SELECT name, start_date, end_date,
                    CASE 
                        WHEN end_date < start_date THEN 'INVALID'
                        ELSE 'VALID'
                    END as date_validity
                FROM evaluation_periods
            """)).fetchall()
            
            invalid = [r[0] for r in result if r[3] == 'INVALID']
            if invalid:
                self.log_result(page, "Period Date Validation", "FAIL", 
                    f"Periods with invalid dates: {invalid}")
            else:
                self.log_result(page, "Period Date Validation", "PASS", 
                    "All periods have valid date ranges")
        except Exception as e:
            self.log_result(page, "Period Date Validation", "FAIL", str(e))
    
    # ===========================
    # COURSE MANAGEMENT TESTS
    # ===========================
    def test_course_management(self):
        """Test Course Management functionality"""
        print("\n" + "="*60)
        print("📚 TESTING: Course Management")
        print("="*60)
        
        page = "EnhancedCourseManagement"
        
        # Test 1: Get All Courses
        try:
            result = self.db.execute(text("""
                SELECT c.id, c.subject_code, c.subject_name, p.program_code, c.year_level, c.semester
                FROM courses c
                LEFT JOIN programs p ON c.program_id = p.id
                ORDER BY c.subject_code
            """)).fetchall()
            
            self.log_result(page, "Get All Courses", "PASS", 
                f"Found {len(result)} courses")
        except Exception as e:
            self.log_result(page, "Get All Courses", "FAIL", str(e))
        
        # Test 2: Filter by Program
        try:
            result = self.db.execute(text("""
                SELECT p.program_code, COUNT(c.id) as course_count
                FROM programs p
                LEFT JOIN courses c ON p.id = c.program_id
                GROUP BY p.id, p.program_code
                ORDER BY course_count DESC
            """)).fetchall()
            
            self.log_result(page, "Courses by Program", "PASS", 
                f"Course distribution: {[(r[0], r[1]) for r in result[:5]]}")
        except Exception as e:
            self.log_result(page, "Courses by Program", "FAIL", str(e))
        
        # Test 3: Filter by Year Level
        try:
            result = self.db.execute(text("""
                SELECT year_level, COUNT(*) as count
                FROM courses
                WHERE year_level IS NOT NULL
                GROUP BY year_level
                ORDER BY year_level
            """)).fetchall()
            
            self.log_result(page, "Courses by Year Level", "PASS", 
                f"Year levels: {[(r[0], r[1]) for r in result]}")
        except Exception as e:
            self.log_result(page, "Courses by Year Level", "FAIL", str(e))
        
        # Test 4: Filter by Semester
        try:
            result = self.db.execute(text("""
                SELECT semester, COUNT(*) as count
                FROM courses
                WHERE semester IS NOT NULL
                GROUP BY semester
            """)).fetchall()
            
            self.log_result(page, "Courses by Semester", "PASS", 
                f"Semesters: {[(r[0], r[1]) for r in result]}")
        except Exception as e:
            self.log_result(page, "Courses by Semester", "FAIL", str(e))
        
        # Test 5: Get Class Sections
        try:
            result = self.db.execute(text("""
                SELECT cs.id, cs.class_code, c.subject_code, c.subject_name,
                       COUNT(e.id) as enrolled_count
                FROM class_sections cs
                JOIN courses c ON cs.course_id = c.id
                LEFT JOIN enrollments e ON cs.id = e.class_section_id AND e.status = 'active'
                GROUP BY cs.id, cs.class_code, c.subject_code, c.subject_name
                LIMIT 20
            """)).fetchall()
            
            self.log_result(page, "Get Class Sections", "PASS", 
                f"Found {len(result)} class sections")
        except Exception as e:
            self.log_result(page, "Get Class Sections", "FAIL", str(e))
        
        # Test 6: Course Status (Active/Archived)
        try:
            result = self.db.execute(text("""
                SELECT 
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active,
                    COUNT(CASE WHEN is_active = false THEN 1 END) as archived
                FROM courses
            """)).fetchone()
            
            self.log_result(page, "Course Status Filter", "PASS", 
                f"Active: {result[0]}, Archived: {result[1]}")
        except Exception as e:
            self.log_result(page, "Course Status Filter", "FAIL", str(e))
    
    # ===========================
    # STUDENT MANAGEMENT TESTS
    # ===========================
    def test_student_management(self):
        """Test Student Management functionality"""
        print("\n" + "="*60)
        print("🎓 TESTING: Student Management")
        print("="*60)
        
        page = "StudentManagement"
        
        # Test 1: Get All Students
        try:
            result = self.db.execute(text("""
                SELECT s.id, s.student_number, u.first_name, u.last_name, u.email,
                       s.year_level, p.program_code
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN programs p ON s.program_id = p.id
                ORDER BY u.last_name
                LIMIT 100
            """)).fetchall()
            
            self.log_result(page, "Get All Students", "PASS", 
                f"Found {len(result)} students")
        except Exception as e:
            self.log_result(page, "Get All Students", "FAIL", str(e))
        
        # Test 2: Student Year Level Distribution
        try:
            result = self.db.execute(text("""
                SELECT year_level, COUNT(*) as count
                FROM students
                GROUP BY year_level
                ORDER BY year_level
            """)).fetchall()
            
            self.log_result(page, "Year Level Distribution", "PASS", 
                f"Distribution: {[(r[0], r[1]) for r in result]}")
        except Exception as e:
            self.log_result(page, "Year Level Distribution", "FAIL", str(e))
        
        # Test 3: Student Program Distribution
        try:
            result = self.db.execute(text("""
                SELECT p.program_code, COUNT(s.id) as count
                FROM students s
                JOIN programs p ON s.program_id = p.id
                GROUP BY p.program_code
                ORDER BY count DESC
            """)).fetchall()
            
            self.log_result(page, "Program Distribution", "PASS", 
                f"Top programs: {[(r[0], r[1]) for r in result[:5]]}")
        except Exception as e:
            self.log_result(page, "Program Distribution", "FAIL", str(e))
        
        # Test 4: Student Enrollments Check
        try:
            result = self.db.execute(text("""
                SELECT 
                    COUNT(DISTINCT s.id) as total_students,
                    COUNT(DISTINCT CASE WHEN e.id IS NOT NULL THEN s.id END) as enrolled_students
                FROM students s
                LEFT JOIN enrollments e ON s.id = e.student_id AND e.status = 'active'
            """)).fetchone()
            
            self.log_result(page, "Student Enrollment Status", "PASS", 
                f"Total: {result[0]}, Enrolled in courses: {result[1]}")
        except Exception as e:
            self.log_result(page, "Student Enrollment Status", "FAIL", str(e))
    
    # ===========================
    # PROGRAM SECTIONS TESTS
    # ===========================
    def test_program_sections(self):
        """Test Program Sections functionality"""
        print("\n" + "="*60)
        print("📋 TESTING: Program Sections")
        print("="*60)
        
        page = "ProgramSections"
        
        # Test 1: Get All Program Sections
        try:
            result = self.db.execute(text("""
                SELECT ps.id, ps.section_name, ps.year_level, p.program_code
                FROM program_sections ps
                JOIN programs p ON ps.program_id = p.id
                ORDER BY p.program_code, ps.year_level, ps.section_name
            """)).fetchall()
            
            self.log_result(page, "Get All Program Sections", "PASS", 
                f"Found {len(result)} program sections")
        except Exception as e:
            self.log_result(page, "Get All Program Sections", "FAIL", str(e))
        
        # Test 2: Section Students Count
        try:
            result = self.db.execute(text("""
                SELECT ps.section_name, COUNT(ss.student_id) as student_count
                FROM program_sections ps
                LEFT JOIN section_students ss ON ps.id = ss.section_id
                GROUP BY ps.id, ps.section_name
                ORDER BY student_count DESC
                LIMIT 10
            """)).fetchall()
            
            self.log_result(page, "Section Student Counts", "PASS", 
                f"Top sections: {[(r[0], r[1]) for r in result[:5]]}")
        except Exception as e:
            self.log_result(page, "Section Student Counts", "FAIL", str(e))
        
        # Test 3: Section Students Table Check
        try:
            result = self.db.execute(text("""
                SELECT COUNT(*) FROM section_students
            """)).scalar()
            
            self.log_result(page, "Section Students Table", "PASS", 
                f"Total section-student assignments: {result}")
        except Exception as e:
            self.log_result(page, "Section Students Table", "FAIL", str(e))
    
    # ===========================
    # AUDIT LOG TESTS
    # ===========================
    def test_audit_logs(self):
        """Test Audit Log Viewer functionality"""
        print("\n" + "="*60)
        print("📝 TESTING: Audit Log Viewer")
        print("="*60)
        
        page = "AuditLogViewer"
        
        # Test 1: Get Audit Logs
        try:
            result = self.db.execute(text("""
                SELECT id, action, category, severity, status, created_at
                FROM audit_logs
                ORDER BY created_at DESC
                LIMIT 50
            """)).fetchall()
            
            self.log_result(page, "Get Audit Logs", "PASS", 
                f"Found {len(result)} audit log entries")
        except Exception as e:
            self.log_result(page, "Get Audit Logs", "FAIL", str(e))
        
        # Test 2: Log Categories
        try:
            result = self.db.execute(text("""
                SELECT category, COUNT(*) as count
                FROM audit_logs
                GROUP BY category
                ORDER BY count DESC
            """)).fetchall()
            
            self.log_result(page, "Log Categories", "PASS", 
                f"Categories: {[(r[0], r[1]) for r in result]}")
        except Exception as e:
            self.log_result(page, "Log Categories", "FAIL", str(e))
        
        # Test 3: Log Actions
        try:
            result = self.db.execute(text("""
                SELECT action, COUNT(*) as count
                FROM audit_logs
                GROUP BY action
                ORDER BY count DESC
                LIMIT 10
            """)).fetchall()
            
            self.log_result(page, "Top Actions", "PASS", 
                f"Actions: {[(r[0], r[1]) for r in result[:5]]}")
        except Exception as e:
            self.log_result(page, "Top Actions", "FAIL", str(e))
        
        # Test 4: Severity Distribution
        try:
            result = self.db.execute(text("""
                SELECT severity, COUNT(*) as count
                FROM audit_logs
                GROUP BY severity
            """)).fetchall()
            
            self.log_result(page, "Severity Distribution", "PASS", 
                f"Severities: {[(r[0], r[1]) for r in result]}")
        except Exception as e:
            self.log_result(page, "Severity Distribution", "FAIL", str(e))
    
    # ===========================
    # DATA EXPORT TESTS
    # ===========================
    def test_data_export(self):
        """Test Data Export Center functionality"""
        print("\n" + "="*60)
        print("📤 TESTING: Data Export Center")
        print("="*60)
        
        page = "DataExportCenter"
        
        # Test 1: Export History Table
        try:
            result = self.db.execute(text("""
                SELECT id, export_type, format, created_at, status
                FROM export_history
                ORDER BY created_at DESC
                LIMIT 10
            """)).fetchall()
            
            self.log_result(page, "Export History", "PASS", 
                f"Found {len(result)} export records")
        except Exception as e:
            self.log_result(page, "Export History", "FAIL", str(e))
        
        # Test 2: Evaluation Data for Export
        try:
            result = self.db.execute(text("""
                SELECT COUNT(*) FROM evaluations WHERE submission_date IS NOT NULL
            """)).scalar()
            
            self.log_result(page, "Exportable Evaluations", "PASS", 
                f"Submitted evaluations available: {result}")
        except Exception as e:
            self.log_result(page, "Exportable Evaluations", "FAIL", str(e))
        
        # Test 3: User Data for Export
        try:
            result = self.db.execute(text("""
                SELECT role, COUNT(*) FROM users GROUP BY role
            """)).fetchall()
            
            self.log_result(page, "Exportable Users by Role", "PASS", 
                f"Users: {[(r[0], r[1]) for r in result]}")
        except Exception as e:
            self.log_result(page, "Exportable Users by Role", "FAIL", str(e))
    
    # ===========================
    # NON-RESPONDENTS TESTS
    # ===========================
    def test_non_respondents(self):
        """Test Non-Respondents page functionality"""
        print("\n" + "="*60)
        print("📊 TESTING: Non-Respondents")
        print("="*60)
        
        page = "NonRespondents"
        
        # Test 1: Find Non-Respondents Query
        try:
            result = self.db.execute(text("""
                SELECT 
                    s.id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    COUNT(DISTINCT e.class_section_id) as enrolled_courses,
                    COUNT(DISTINCT CASE WHEN ev.submission_date IS NOT NULL THEN ev.class_section_id END) as evaluated_courses
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN enrollments e ON s.id = e.student_id AND e.status = 'active'
                LEFT JOIN evaluations ev ON s.id = ev.student_id AND e.class_section_id = ev.class_section_id
                WHERE u.is_active = true
                GROUP BY s.id, u.first_name, u.last_name, u.email
                HAVING COUNT(DISTINCT e.class_section_id) > COUNT(DISTINCT CASE WHEN ev.submission_date IS NOT NULL THEN ev.class_section_id END)
                LIMIT 20
            """)).fetchall()
            
            self.log_result(page, "Non-Respondents Query", "PASS", 
                f"Found {len(result)} students with pending evaluations")
        except Exception as e:
            self.log_result(page, "Non-Respondents Query", "FAIL", str(e))
        
        # Test 2: Completion Rate by Section
        try:
            result = self.db.execute(text("""
                SELECT 
                    cs.class_code,
                    COUNT(DISTINCT e.student_id) as enrolled,
                    COUNT(DISTINCT CASE WHEN ev.submission_date IS NOT NULL THEN ev.student_id END) as completed
                FROM class_sections cs
                LEFT JOIN enrollments e ON cs.id = e.class_section_id AND e.status = 'active'
                LEFT JOIN evaluations ev ON cs.id = ev.class_section_id AND e.student_id = ev.student_id
                GROUP BY cs.id, cs.class_code
                HAVING COUNT(DISTINCT e.student_id) > 0
                ORDER BY (COUNT(DISTINCT CASE WHEN ev.submission_date IS NOT NULL THEN ev.student_id END)::float / NULLIF(COUNT(DISTINCT e.student_id), 0)) ASC
                LIMIT 10
            """)).fetchall()
            
            self.log_result(page, "Completion Rate by Section", "PASS", 
                f"Found {len(result)} sections with completion data")
        except Exception as e:
            self.log_result(page, "Completion Rate by Section", "FAIL", str(e))
    
    # ===========================
    # ENROLLMENT LIST TESTS
    # ===========================
    def test_enrollment_list(self):
        """Test Enrollment List Management functionality"""
        print("\n" + "="*60)
        print("📋 TESTING: Enrollment List Management")
        print("="*60)
        
        page = "EnrollmentListManagement"
        
        # Test 1: Check Enrollment List Table
        try:
            result = self.db.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'enrollment_list'
            """)).scalar()
            
            if result > 0:
                count = self.db.execute(text("SELECT COUNT(*) FROM enrollment_list")).scalar()
                self.log_result(page, "Enrollment List Table", "PASS", 
                    f"Table exists with {count} entries")
            else:
                self.log_result(page, "Enrollment List Table", "WARN", 
                    "Enrollment list table not found")
        except Exception as e:
            self.log_result(page, "Enrollment List Table", "FAIL", str(e))
        
        # Test 2: Enrollment List Columns
        try:
            result = self.db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'enrollment_list'
                ORDER BY ordinal_position
            """)).fetchall()
            
            if result:
                columns = [r[0] for r in result]
                self.log_result(page, "Enrollment List Columns", "PASS", 
                    f"Columns: {columns}")
            else:
                self.log_result(page, "Enrollment List Columns", "WARN", 
                    "No columns found (table may not exist)")
        except Exception as e:
            self.log_result(page, "Enrollment List Columns", "FAIL", str(e))
    
    # ===========================
    # RUN ALL TESTS
    # ===========================
    def run_all_tests(self):
        """Run all admin page tests"""
        print("\n" + "="*70)
        print("🔍 COMPREHENSIVE ADMIN PAGE TESTING")
        print("="*70)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run each test
        self.test_admin_dashboard()
        self.test_user_management()
        self.test_evaluation_periods()
        self.test_course_management()
        self.test_student_management()
        self.test_program_sections()
        self.test_audit_logs()
        self.test_data_export()
        self.test_non_respondents()
        self.test_enrollment_list()
        
        # Print Summary
        print("\n" + "="*70)
        print("📊 TEST SUMMARY")
        print("="*70)
        print(f"✅ Passed: {self.results['summary']['passed']}")
        print(f"❌ Failed: {self.results['summary']['failed']}")
        print(f"⚠️ Warnings: {self.results['summary']['warnings']}")
        print(f"Total Tests: {self.results['summary']['passed'] + self.results['summary']['failed'] + self.results['summary']['warnings']}")
        
        # Save results to file
        output_file = "admin_page_test_results.json"
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        print(f"\n📁 Detailed results saved to: {output_file}")
        
        # Print failed tests
        if self.results["summary"]["failed"] > 0:
            print("\n" + "="*70)
            print("❌ FAILED TESTS")
            print("="*70)
            for page, tests in self.results["pages"].items():
                failed = [t for t in tests if t["status"] == "FAIL"]
                if failed:
                    print(f"\n{page}:")
                    for test in failed:
                        print(f"  - {test['test']}: {test['details']}")
        
        return self.results

if __name__ == "__main__":
    tester = AdminPageTester()
    results = tester.run_all_tests()
