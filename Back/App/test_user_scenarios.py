"""
User Scenario Testing - Tests specific workflows and edge cases
"""

from database.connection import get_db
from sqlalchemy import text
from datetime import datetime, timedelta
import json

def print_section(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def print_scenario(scenario_name):
    print(f"\n--- SCENARIO: {scenario_name} ---")

def print_result(test, status, details=""):
    icon = "✓" if status == "PASS" else "✗" if status == "FAIL" else "⚠"
    print(f"{icon} {test}")
    if details:
        print(f"   Details: {details}")

db = next(get_db())

scenarios = {
    "passed": [],
    "failed": [],
    "warnings": [],
    "missing_features": []
}

print_section("USER SCENARIO TESTING SUITE")
print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# ============================================================================
# SCENARIO 1: New Student First Login & Evaluation
# ============================================================================
print_section("SCENARIO 1: NEW STUDENT FIRST LOGIN & EVALUATION")

print_scenario("Student logs in for first time")

# Check if students can see their enrolled courses
student_sample = db.execute(text("""
    SELECT s.id, u.email, u.first_name, u.last_name, s.program_id
    FROM students s
    JOIN users u ON s.user_id = u.id
    LIMIT 1
""")).fetchone()

if student_sample:
    student_id = student_sample[0]
    print_result("Sample student found", "PASS", f"{student_sample[2]} {student_sample[3]} (ID: {student_id})")
    scenarios["passed"].append("Found test student")
    
    # Check if student has enrollments
    enrollments = db.execute(text("""
        SELECT COUNT(*) FROM enrollments WHERE student_id = :sid
    """), {"sid": student_id}).scalar()
    
    if enrollments > 0:
        print_result("Student has course enrollments", "PASS", f"{enrollments} courses")
        scenarios["passed"].append("Student has enrollments")
        
        # Check if enrollments are tied to current period
        current_period_enrollments = db.execute(text("""
            SELECT COUNT(*) FROM enrollments e
            JOIN evaluation_periods ep ON e.evaluation_period_id = ep.id
            WHERE e.student_id = :sid AND ep.status IN ('Open', 'active')
        """), {"sid": student_id}).scalar()
        
        if current_period_enrollments > 0:
            print_result("Student can see courses for active period", "PASS", 
                       f"{current_period_enrollments} courses in active period")
            scenarios["passed"].append("Active period enrollments exist")
        else:
            print_result("Student cannot see active courses", "WARN", 
                       "No enrollments in active evaluation period")
            scenarios["warnings"].append("No active period enrollments for student")
        
        # Check if evaluations were auto-created
        auto_evaluations = db.execute(text("""
            SELECT COUNT(*) FROM evaluations WHERE student_id = :sid
        """), {"sid": student_id}).scalar()
        
        if auto_evaluations > 0:
            print_result("Evaluations auto-created", "PASS", f"{auto_evaluations} evaluation records")
            scenarios["passed"].append("Auto-evaluation creation works")
        else:
            print_result("Evaluations NOT auto-created", "FAIL", "Student cannot submit evaluations")
            scenarios["failed"].append("Evaluation auto-creation failed")
    else:
        print_result("Student has NO enrollments", "FAIL", "Cannot take evaluations")
        scenarios["failed"].append("No enrollments for test student")
else:
    print_result("No students in system", "FAIL")
    scenarios["failed"].append("No students exist")

# ============================================================================
# SCENARIO 2: Admin Creates New Evaluation Period
# ============================================================================
print_section("SCENARIO 2: ADMIN CREATES NEW EVALUATION PERIOD")

print_scenario("Admin creates a new evaluation period")

# Check total periods
total_periods = db.execute(text("SELECT COUNT(*) FROM evaluation_periods")).scalar()
print_result("Evaluation periods exist", "PASS" if total_periods > 0 else "FAIL", 
           f"{total_periods} periods")

if total_periods > 0:
    scenarios["passed"].append("Evaluation periods created")
    
    # Check if multiple active periods exist (shouldn't happen)
    active_periods = db.execute(text("""
        SELECT COUNT(*) FROM evaluation_periods WHERE status IN ('Open', 'active')
    """)).scalar()
    
    if active_periods == 0:
        print_result("No active periods", "WARN", "Students cannot submit evaluations")
        scenarios["warnings"].append("No active evaluation period")
    elif active_periods == 1:
        print_result("One active period", "PASS", "Correct state")
        scenarios["passed"].append("Exactly one active period")
        
        # Check if students are auto-enrolled
        period = db.execute(text("""
            SELECT id, name FROM evaluation_periods WHERE status IN ('Open', 'active') LIMIT 1
        """)).fetchone()
        
        enrollments_in_period = db.execute(text("""
            SELECT COUNT(*) FROM enrollments WHERE evaluation_period_id = :pid
        """), {"pid": period[0]}).scalar()
        
        print_result("Students enrolled in active period", 
                   "PASS" if enrollments_in_period > 0 else "FAIL",
                   f"{enrollments_in_period} enrollments in '{period[1]}'")
        
        if enrollments_in_period > 0:
            scenarios["passed"].append("Period has enrollments")
        else:
            scenarios["failed"].append("Active period has no enrollments")
    else:
        print_result("Multiple active periods", "FAIL", f"{active_periods} active periods found")
        scenarios["failed"].append("Multiple concurrent active periods")
else:
    scenarios["failed"].append("No evaluation periods")

# ============================================================================
# SCENARIO 3: Department Head Views Analytics
# ============================================================================
print_section("SCENARIO 3: DEPARTMENT HEAD VIEWS ANALYTICS")

print_scenario("Department head accesses analytics dashboard")

# Check if dept heads exist
dept_heads = db.execute(text("SELECT COUNT(*) FROM department_heads")).scalar()
print_result("Department heads exist", "PASS" if dept_heads > 0 else "WARN", 
           f"{dept_heads} dept heads")

if dept_heads > 0:
    scenarios["passed"].append("Department heads configured")
    
    # Check if there's data to analyze
    completed_evals = db.execute(text("""
        SELECT COUNT(*) FROM evaluations WHERE submission_date IS NOT NULL
    """)).scalar()
    
    if completed_evals > 0:
        print_result("Completed evaluations available", "PASS", f"{completed_evals} completed")
        scenarios["passed"].append("Analytics data available")
        
        # Check if ratings are properly stored
        ratings_check = db.execute(text("""
            SELECT COUNT(*) FROM evaluations 
            WHERE submission_date IS NOT NULL 
            AND (overall_rating IS NOT NULL OR knowledge_rating IS NOT NULL)
        """)).scalar()
        
        print_result("Evaluations have rating data", 
                   "PASS" if ratings_check > 0 else "FAIL",
                   f"{ratings_check}/{completed_evals} have ratings")
        
        if ratings_check > 0:
            scenarios["passed"].append("Rating data properly stored")
        else:
            scenarios["failed"].append("Ratings missing from completed evaluations")
    else:
        print_result("No completed evaluations", "WARN", "No data for analytics")
        scenarios["warnings"].append("No evaluation data to analyze")
else:
    scenarios["warnings"].append("No department heads configured")

# ============================================================================
# SCENARIO 4: Secretary Manages Courses & Sections
# ============================================================================
print_section("SCENARIO 4: SECRETARY MANAGES COURSES & SECTIONS")

print_scenario("Secretary creates course and assigns instructor")

# Check secretaries exist
secretaries = db.execute(text("SELECT COUNT(*) FROM secretaries")).scalar()
print_result("Secretaries exist", "PASS" if secretaries > 0 else "WARN", 
           f"{secretaries} secretaries")

if secretaries > 0:
    scenarios["passed"].append("Secretaries configured")
    
    # Check courses
    total_courses = db.execute(text("SELECT COUNT(*) FROM courses")).scalar()
    print_result("Courses in system", "PASS" if total_courses > 0 else "FAIL",
               f"{total_courses} courses")
    
    if total_courses > 0:
        scenarios["passed"].append("Courses exist")
        
        # Check class sections
        total_sections = db.execute(text("SELECT COUNT(*) FROM class_sections")).scalar()
        sections_with_instructor = db.execute(text("""
            SELECT COUNT(*) FROM class_sections WHERE instructor_id IS NOT NULL
        """)).scalar()
        
        print_result("Class sections created", "PASS" if total_sections > 0 else "WARN",
                   f"{total_sections} sections")
        print_result("Sections have instructors", 
                   "PASS" if sections_with_instructor == total_sections else "FAIL",
                   f"{sections_with_instructor}/{total_sections} have instructors")
        
        if total_sections > 0:
            scenarios["passed"].append("Class sections exist")
            if sections_with_instructor == total_sections:
                scenarios["passed"].append("All sections have instructors")
            else:
                scenarios["failed"].append(f"{total_sections - sections_with_instructor} sections missing instructors")
        else:
            scenarios["warnings"].append("No class sections created")
    else:
        scenarios["failed"].append("No courses in system")
else:
    scenarios["warnings"].append("No secretaries configured")

# ============================================================================
# SCENARIO 5: Instructor Views Student Feedback
# ============================================================================
print_section("SCENARIO 5: INSTRUCTOR VIEWS STUDENT FEEDBACK")

print_scenario("Instructor checks their course evaluations")

# Check instructors exist
instructors = db.execute(text("SELECT COUNT(*) FROM instructors")).scalar()
print_result("Instructors exist", "PASS" if instructors > 0 else "FAIL",
           f"{instructors} instructors")

if instructors > 0:
    scenarios["passed"].append("Instructors in system")
    
    # Get sample instructor
    instructor = db.execute(text("""
        SELECT i.id, u.first_name, u.last_name
        FROM instructors i
        JOIN users u ON i.user_id = u.id
        LIMIT 1
    """)).fetchone()
    
    if instructor:
        # Check if instructor has sections
        instructor_sections = db.execute(text("""
            SELECT COUNT(*) FROM class_sections WHERE instructor_id = :iid
        """), {"iid": instructor[0]}).scalar()
        
        print_result("Instructor has assigned sections", 
                   "PASS" if instructor_sections > 0 else "WARN",
                   f"{instructor[1]} {instructor[2]} has {instructor_sections} sections")
        
        if instructor_sections > 0:
            scenarios["passed"].append("Instructors have section assignments")
            
            # Check if sections have evaluations
            section_evals = db.execute(text("""
                SELECT COUNT(*) FROM evaluations e
                JOIN class_sections cs ON e.class_section_id = cs.id
                WHERE cs.instructor_id = :iid AND e.submission_date IS NOT NULL
            """), {"iid": instructor[0]}).scalar()
            
            print_result("Students submitted feedback", 
                       "PASS" if section_evals > 0 else "WARN",
                       f"{section_evals} completed evaluations")
            
            if section_evals > 0:
                scenarios["passed"].append("Instructors can view feedback")
            else:
                scenarios["warnings"].append("No student feedback submitted yet")
        else:
            scenarios["warnings"].append("Instructors not assigned to sections")
else:
    scenarios["failed"].append("No instructors in system")

# ============================================================================
# SCENARIO 6: Student Submits Late Evaluation
# ============================================================================
print_section("SCENARIO 6: STUDENT SUBMITS LATE EVALUATION")

print_scenario("Student tries to submit after period closes")

# Check for closed periods with pending evaluations
closed_periods_with_pending = db.execute(text("""
    SELECT ep.id, ep.name, COUNT(e.id) as pending_count
    FROM evaluation_periods ep
    JOIN evaluations e ON e.evaluation_period_id = ep.id
    WHERE ep.status IN ('closed', 'Closed') 
      AND e.submission_date IS NULL
    GROUP BY ep.id, ep.name
""")).fetchall()

if closed_periods_with_pending:
    for period in closed_periods_with_pending:
        print_result("Closed period has pending evaluations", "WARN",
                   f"Period '{period[1]}' has {period[2]} pending evaluations")
        scenarios["warnings"].append(f"Period '{period[1]}' closed with pending evaluations")
else:
    print_result("No pending evaluations in closed periods", "PASS", "All OK")
    scenarios["passed"].append("No late evaluation scenarios")

# Check if system allows extending closed periods
print_result("Period extension feature", "INFO", "Check frontend for 'Extend Period' button on closed periods")

# ============================================================================
# SCENARIO 7: Bulk Enrollment via Program Sections
# ============================================================================
print_section("SCENARIO 7: BULK ENROLLMENT VIA PROGRAM SECTIONS")

print_scenario("Admin enrolls entire program section")

# Check program sections
program_sections = db.execute(text("SELECT COUNT(*) FROM program_sections")).scalar()
print_result("Program sections exist", "PASS" if program_sections > 0 else "WARN",
           f"{program_sections} program sections")

if program_sections > 0:
    scenarios["passed"].append("Program sections configured")
    
    # Check if students are assigned to program sections
    students_in_sections = db.execute(text("SELECT COUNT(*) FROM section_students")).scalar()
    total_students = db.execute(text("SELECT COUNT(*) FROM students")).scalar()
    
    print_result("Students assigned to program sections",
               "PASS" if students_in_sections > 0 else "WARN",
               f"{students_in_sections}/{total_students} students assigned")
    
    if students_in_sections > 0:
        scenarios["passed"].append("Students assigned to program sections")
        
        # Check if bulk enrollment works (enrollments from program sections)
        # This would check if class_sections have program section enrollments
        bulk_enrollments = db.execute(text("""
            SELECT COUNT(DISTINCT cs.id) 
            FROM class_sections cs
            WHERE cs.id IN (
                SELECT class_section_id FROM enrollments 
                GROUP BY class_section_id 
                HAVING COUNT(*) > 5
            )
        """)).scalar()
        
        print_result("Bulk enrollment appears functional",
                   "PASS" if bulk_enrollments > 0 else "WARN",
                   f"{bulk_enrollments} sections with 5+ enrollments")
        
        if bulk_enrollments > 0:
            scenarios["passed"].append("Bulk enrollment working")
        else:
            scenarios["warnings"].append("No evidence of bulk enrollment usage")
    else:
        scenarios["warnings"].append("No students in program sections")
else:
    scenarios["warnings"].append("Program sections not configured")

# ============================================================================
# SCENARIO 8: Data Export & Backup
# ============================================================================
print_section("SCENARIO 8: DATA EXPORT & BACKUP")

print_scenario("Admin exports evaluation data")

# Check for export history table
try:
    export_history = db.execute(text("SELECT COUNT(*) FROM export_history")).scalar()
    print_result("Export history tracking", "PASS", f"{export_history} exports recorded")
    scenarios["passed"].append("Export tracking enabled")
except:
    print_result("Export history table", "WARN", "Table not found - manual exports only")
    scenarios["warnings"].append("No export history tracking")

# Check if CSV exports directory exists
import os
csv_dir = "../../csv_exports"
if os.path.exists(csv_dir):
    csv_files = len([f for f in os.listdir(csv_dir) if f.endswith('.csv')])
    print_result("CSV exports exist", "PASS", f"{csv_files} CSV files found")
    scenarios["passed"].append("Export functionality used")
else:
    print_result("CSV exports directory", "WARN", "No exports found")
    scenarios["warnings"].append("No CSV exports generated")

# ============================================================================
# SCENARIO 9: Evaluation History Across Periods
# ============================================================================
print_section("SCENARIO 9: EVALUATION HISTORY ACROSS PERIODS")

print_scenario("Student views evaluation history from multiple periods")

# Check if there are multiple periods
multiple_periods = db.execute(text("""
    SELECT COUNT(*) FROM evaluation_periods WHERE status IN ('closed', 'Closed')
""")).scalar()

print_result("Historical periods exist", 
           "PASS" if multiple_periods > 0 else "WARN",
           f"{multiple_periods} closed periods")

if multiple_periods > 0:
    scenarios["passed"].append("Historical period data available")
    
    # Check if students have evaluations across periods
    students_with_history = db.execute(text("""
        SELECT COUNT(DISTINCT student_id) 
        FROM evaluations e
        WHERE evaluation_period_id IN (
            SELECT id FROM evaluation_periods WHERE status IN ('closed', 'Closed')
        )
    """)).scalar()
    
    print_result("Students have evaluation history",
               "PASS" if students_with_history > 0 else "WARN",
               f"{students_with_history} students with historical data")
    
    if students_with_history > 0:
        scenarios["passed"].append("Historical evaluation data exists")
    else:
        scenarios["warnings"].append("No historical evaluation data")
else:
    scenarios["warnings"].append("No historical periods for comparison")

# ============================================================================
# SCENARIO 10: Missing/Incomplete Features
# ============================================================================
print_section("SCENARIO 10: FEATURE GAPS & MISSING FUNCTIONALITY")

missing_features = []

# ML Model
try:
    import os
    if not os.path.exists('models/svm_sentiment_model.pkl'):
        missing_features.append("ML Sentiment Analysis Model not trained")
        print_result("ML Sentiment Model", "MISSING", "Train model with train_ml_models.py")
except:
    pass

# Email notifications
email_config = db.execute(text("""
    SELECT value FROM system_settings WHERE key = 'smtp_configured'
""")).scalar()
if not email_config or email_config == 'false':
    missing_features.append("Email notification system not configured")
    print_result("Email Notifications", "MISSING", "Configure SMTP settings")

# Check if there's a reminder system
try:
    reminder_settings = db.execute(text("""
        SELECT COUNT(*) FROM system_settings WHERE key LIKE '%reminder%'
    """)).scalar()
    if reminder_settings == 0:
        missing_features.append("Automated evaluation reminders")
        print_result("Evaluation Reminders", "MISSING", "No reminder system configured")
except:
    pass

# Check for mobile optimization settings
mobile_check = db.execute(text("""
    SELECT value FROM system_settings WHERE key = 'mobile_optimized'
""")).scalar()
if not mobile_check:
    missing_features.append("Mobile responsive design may not be optimized")
    print_result("Mobile Optimization", "UNKNOWN", "Check frontend responsiveness")

# Real-time notifications
print_result("Real-time Notifications", "MISSING", "Consider WebSocket/SSE implementation")
missing_features.append("Real-time notifications for admins")

# Advanced analytics
print_result("Predictive Analytics", "MISSING", "Consider ML-based predictions for completion rates")
missing_features.append("Predictive analytics for evaluation participation")

# API documentation
print_result("API Documentation", "INFO", "Check http://localhost:8000/docs for FastAPI docs")

scenarios["missing_features"] = missing_features

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print_section("SCENARIO TESTING SUMMARY")

print(f"Scenarios Passed: {len(scenarios['passed'])}")
print(f"Scenarios Failed: {len(scenarios['failed'])}")
print(f"Warnings: {len(scenarios['warnings'])}")
print(f"Missing Features: {len(scenarios['missing_features'])}")

if scenarios['failed']:
    print("\n🔴 FAILED SCENARIOS:")
    for failure in scenarios['failed']:
        print(f"   - {failure}")

if scenarios['warnings']:
    print("\n🟡 WARNINGS:")
    for warning in scenarios['warnings']:
        print(f"   - {warning}")

if scenarios['missing_features']:
    print("\n📋 MISSING FEATURES:")
    for feature in scenarios['missing_features']:
        print(f"   - {feature}")

print("\n" + "="*80)
print("RECOMMENDED NEXT STEPS:")
print("="*80)
print("""
1. CRITICAL: Fix instructor assignments for class sections
2. CRITICAL: Link all enrollments to evaluation periods
3. HIGH: Open/create an active evaluation period for testing
4. HIGH: Train ML sentiment model (run train_ml_models.py)
5. MEDIUM: Configure email notifications for period extensions
6. MEDIUM: Set up automated evaluation reminders
7. LOW: Create more courses with sections for realistic testing
8. LOW: Add predictive analytics features
""")

# Save results
with open('test_results_scenarios.json', 'w') as f:
    json.dump(scenarios, f, indent=2)

print("\n📄 Scenario results saved to: test_results_scenarios.json")
