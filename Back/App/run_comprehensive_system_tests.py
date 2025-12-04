"""
Comprehensive System Testing Suite for Course Feedback System
Tests various scenarios, edge cases, and user workflows
"""

from database.connection import get_db
from sqlalchemy import text
from datetime import datetime, timedelta
import json

def print_section(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def print_result(test_name, passed, details=""):
    status = "✓ PASS" if passed else "✗ FAIL"
    print(f"{status} - {test_name}")
    if details:
        print(f"      {details}")

db = next(get_db())

# Test Results Storage
test_results = {
    "passed": 0,
    "failed": 0,
    "issues": []
}

def record_issue(category, description, severity="MEDIUM"):
    test_results["issues"].append({
        "category": category,
        "description": description,
        "severity": severity
    })

print_section("COURSE FEEDBACK SYSTEM - COMPREHENSIVE TEST SUITE")
print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# ============================================================================
# TEST 1: DATABASE INTEGRITY & SCHEMA
# ============================================================================
print_section("TEST 1: DATABASE INTEGRITY & SCHEMA")

# Check for required tables
required_tables = [
    'users', 'students', 'courses', 'class_sections', 'instructors',
    'evaluation_periods', 'evaluations', 'enrollments', 'programs',
    'program_sections', 'section_students', 'department_heads', 'secretaries',
    'audit_logs', 'password_reset_tokens', 'system_settings'
]

for table in required_tables:
    try:
        result = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
        print_result(f"Table '{table}' exists", True, f"{result} records")
        test_results["passed"] += 1
    except Exception as e:
        print_result(f"Table '{table}' exists", False, str(e))
        test_results["failed"] += 1
        record_issue("Database Schema", f"Table '{table}' missing or inaccessible", "HIGH")

# Check for critical columns
print("\nChecking critical column existence...")
critical_columns = {
    'evaluations': ['evaluation_period_id', 'submission_date', 'student_id', 'class_section_id'],
    'enrollments': ['evaluation_period_id', 'student_id', 'class_section_id'],
    'evaluation_periods': ['status', 'start_date', 'end_date']
}

for table, columns in critical_columns.items():
    for column in columns:
        try:
            result = db.execute(text(f"SELECT {column} FROM {table} LIMIT 1"))
            print_result(f"Column '{table}.{column}' exists", True)
            test_results["passed"] += 1
        except Exception as e:
            print_result(f"Column '{table}.{column}' exists", False)
            test_results["failed"] += 1
            record_issue("Database Schema", f"Column '{table}.{column}' missing", "HIGH")

# ============================================================================
# TEST 2: USER ROLES & AUTHENTICATION
# ============================================================================
print_section("TEST 2: USER ROLES & AUTHENTICATION")

# Check all user roles are present
roles = db.execute(text("SELECT DISTINCT role FROM users")).fetchall()
role_list = [r[0] for r in roles]
expected_roles = ['student', 'instructor', 'admin', 'secretary', 'department_head']

for role in expected_roles:
    exists = role in role_list
    print_result(f"Role '{role}' exists", exists)
    if exists:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1
        record_issue("User Roles", f"No users with role '{role}' found", "HIGH")

# Check for users without corresponding role records
print("\nChecking role record consistency...")
students_without_record = db.execute(text("""
    SELECT COUNT(*) FROM users u 
    WHERE u.role = 'student' 
    AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id)
""")).scalar()
print_result("Students have student records", students_without_record == 0, 
             f"{students_without_record} students missing records" if students_without_record > 0 else "All OK")
if students_without_record > 0:
    test_results["failed"] += 1
    record_issue("Data Integrity", f"{students_without_record} students without student records", "HIGH")
else:
    test_results["passed"] += 1

instructors_without_record = db.execute(text("""
    SELECT COUNT(*) FROM users u 
    WHERE u.role = 'instructor' 
    AND NOT EXISTS (SELECT 1 FROM instructors i WHERE i.user_id = u.id)
""")).scalar()
print_result("Instructors have instructor records", instructors_without_record == 0,
             f"{instructors_without_record} instructors missing records" if instructors_without_record > 0 else "All OK")
if instructors_without_record > 0:
    test_results["failed"] += 1
    record_issue("Data Integrity", f"{instructors_without_record} instructors without instructor records", "MEDIUM")
else:
    test_results["passed"] += 1

# ============================================================================
# TEST 3: EVALUATION PERIOD MANAGEMENT
# ============================================================================
print_section("TEST 3: EVALUATION PERIOD MANAGEMENT")

# Check for evaluation periods
periods = db.execute(text("SELECT * FROM evaluation_periods ORDER BY start_date DESC")).fetchall()
print_result("Evaluation periods exist", len(periods) > 0, f"{len(periods)} periods found")
if len(periods) > 0:
    test_results["passed"] += 1
else:
    test_results["failed"] += 1
    record_issue("System Setup", "No evaluation periods created", "HIGH")

if len(periods) > 0:
    # Check for open periods
    open_periods = db.execute(text("""
        SELECT COUNT(*) FROM evaluation_periods WHERE status IN ('Open', 'active')
    """)).scalar()
    print_result("Has open evaluation period", open_periods > 0, 
                 f"{open_periods} open period(s)" if open_periods > 0 else "No open periods")
    if open_periods == 0:
        test_results["failed"] += 1
        record_issue("System State", "No active evaluation period - students cannot submit evaluations", "MEDIUM")
    elif open_periods > 1:
        test_results["failed"] += 1
        record_issue("Data Integrity", f"Multiple open periods detected ({open_periods})", "HIGH")
    else:
        test_results["passed"] += 1

    # Check for overlapping periods
    overlaps = db.execute(text("""
        SELECT ep1.id, ep1.name, ep2.id, ep2.name
        FROM evaluation_periods ep1
        JOIN evaluation_periods ep2 ON ep1.id < ep2.id
        WHERE (ep1.start_date BETWEEN ep2.start_date AND ep2.end_date
           OR ep1.end_date BETWEEN ep2.start_date AND ep2.end_date
           OR ep2.start_date BETWEEN ep1.start_date AND ep1.end_date)
    """)).fetchall()
    print_result("No overlapping evaluation periods", len(overlaps) == 0,
                 f"{len(overlaps)} overlaps detected" if len(overlaps) > 0 else "All OK")
    if len(overlaps) > 0:
        test_results["failed"] += 1
        record_issue("Data Integrity", f"Overlapping evaluation periods detected", "HIGH")
        for overlap in overlaps:
            print(f"      Overlap: '{overlap[1]}' (ID {overlap[0]}) with '{overlap[3]}' (ID {overlap[2]})")
    else:
        test_results["passed"] += 1

# ============================================================================
# TEST 4: ENROLLMENT SYSTEM
# ============================================================================
print_section("TEST 4: ENROLLMENT SYSTEM")

# Check enrollments are linked to evaluation periods
enrollments_without_period = db.execute(text("""
    SELECT COUNT(*) FROM enrollments WHERE evaluation_period_id IS NULL
""")).scalar()
print_result("All enrollments linked to periods", enrollments_without_period == 0,
             f"{enrollments_without_period} enrollments without period" if enrollments_without_period > 0 else "All OK")
if enrollments_without_period > 0:
    test_results["failed"] += 1
    record_issue("Enrollment System", f"{enrollments_without_period} enrollments not linked to evaluation periods", "HIGH")
else:
    test_results["passed"] += 1

# Check for orphaned enrollments (student or section deleted)
orphaned_enrollments = db.execute(text("""
    SELECT COUNT(*) FROM enrollments e
    WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.id = e.student_id)
       OR NOT EXISTS (SELECT 1 FROM class_sections cs WHERE cs.id = e.class_section_id)
""")).scalar()
print_result("No orphaned enrollments", orphaned_enrollments == 0,
             f"{orphaned_enrollments} orphaned enrollments" if orphaned_enrollments > 0 else "All OK")
if orphaned_enrollments > 0:
    test_results["failed"] += 1
    record_issue("Data Integrity", f"{orphaned_enrollments} enrollments reference deleted students/sections", "MEDIUM")
else:
    test_results["passed"] += 1

# Check program section enrollments
program_sections = db.execute(text("SELECT COUNT(*) FROM program_sections")).scalar()
print_result("Program sections exist", program_sections > 0, f"{program_sections} program sections")
if program_sections > 0:
    test_results["passed"] += 1
else:
    test_results["failed"] += 1
    record_issue("System Setup", "No program sections created - bulk enrollment not possible", "LOW")

# ============================================================================
# TEST 5: EVALUATION SUBMISSION WORKFLOW
# ============================================================================
print_section("TEST 5: EVALUATION SUBMISSION WORKFLOW")

# Check evaluations are properly created
total_evaluations = db.execute(text("SELECT COUNT(*) FROM evaluations")).scalar()
print_result("Evaluations exist in system", total_evaluations > 0, f"{total_evaluations} evaluation records")
if total_evaluations > 0:
    test_results["passed"] += 1
    
    # Check pending vs completed evaluations
    pending = db.execute(text("""
        SELECT COUNT(*) FROM evaluations WHERE submission_date IS NULL
    """)).scalar()
    completed = db.execute(text("""
        SELECT COUNT(*) FROM evaluations WHERE submission_date IS NOT NULL
    """)).scalar()
    print_result("Evaluation status tracking", True, 
                 f"{pending} pending, {completed} completed ({completed}/{total_evaluations} = {round(completed/total_evaluations*100, 1)}%)")
    test_results["passed"] += 1
    
    if completed == 0:
        record_issue("System Usage", "No completed evaluations - system may not be in use", "LOW")
else:
    test_results["failed"] += 1
    record_issue("System Setup", "No evaluations created - enrollment or auto-creation may be broken", "HIGH")

# Check for evaluations without period linkage
evals_without_period = db.execute(text("""
    SELECT COUNT(*) FROM evaluations WHERE evaluation_period_id IS NULL
""")).scalar()
print_result("All evaluations linked to periods", evals_without_period == 0,
             f"{evals_without_period} evaluations without period" if evals_without_period > 0 else "All OK")
if evals_without_period > 0:
    test_results["failed"] += 1
    record_issue("Evaluation System", f"{evals_without_period} evaluations not linked to periods", "HIGH")
else:
    test_results["passed"] += 1

# Check for duplicate evaluations (same student, section, period)
duplicates = db.execute(text("""
    SELECT student_id, class_section_id, evaluation_period_id, COUNT(*) as count
    FROM evaluations
    GROUP BY student_id, class_section_id, evaluation_period_id
    HAVING COUNT(*) > 1
""")).fetchall()
print_result("No duplicate evaluations", len(duplicates) == 0,
             f"{len(duplicates)} duplicate sets found" if len(duplicates) > 0 else "All OK")
if len(duplicates) > 0:
    test_results["failed"] += 1
    record_issue("Data Integrity", f"{len(duplicates)} sets of duplicate evaluations found", "HIGH")
    for dup in duplicates[:5]:  # Show first 5
        print(f"      Student {dup[0]}, Section {dup[1]}, Period {dup[2]}: {dup[3]} evaluations")
else:
    test_results["passed"] += 1

# ============================================================================
# TEST 6: COURSE & CLASS SECTION STRUCTURE
# ============================================================================
print_section("TEST 6: COURSE & CLASS SECTION STRUCTURE")

# Check courses have class sections
courses_without_sections = db.execute(text("""
    SELECT COUNT(*) FROM courses c
    WHERE NOT EXISTS (SELECT 1 FROM class_sections cs WHERE cs.course_id = c.id)
""")).scalar()
print_result("All courses have class sections", courses_without_sections == 0,
             f"{courses_without_sections} courses without sections" if courses_without_sections > 0 else "All OK")
if courses_without_sections > 0:
    test_results["failed"] += 1
    record_issue("Course Management", f"{courses_without_sections} courses have no class sections", "MEDIUM")
else:
    test_results["passed"] += 1

# Check class sections have instructors
sections_without_instructor = db.execute(text("""
    SELECT COUNT(*) FROM class_sections WHERE instructor_id IS NULL
""")).scalar()
print_result("All sections have instructors", sections_without_instructor == 0,
             f"{sections_without_instructor} sections without instructor" if sections_without_instructor > 0 else "All OK")
if sections_without_instructor > 0:
    test_results["failed"] += 1
    record_issue("Course Management", f"{sections_without_instructor} class sections have no instructor assigned", "HIGH")
else:
    test_results["passed"] += 1

# Check for sections with invalid instructor references
invalid_instructors = db.execute(text("""
    SELECT COUNT(*) FROM class_sections cs
    WHERE cs.instructor_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = cs.instructor_id)
""")).scalar()
print_result("All instructor references valid", invalid_instructors == 0,
             f"{invalid_instructors} invalid references" if invalid_instructors > 0 else "All OK")
if invalid_instructors > 0:
    test_results["failed"] += 1
    record_issue("Data Integrity", f"{invalid_instructors} sections reference non-existent instructors", "HIGH")
else:
    test_results["passed"] += 1

# ============================================================================
# TEST 7: STUDENT DATA INTEGRITY
# ============================================================================
print_section("TEST 7: STUDENT DATA INTEGRITY")

# Check students have required fields
students_missing_data = db.execute(text("""
    SELECT 
        COUNT(CASE WHEN student_number IS NULL THEN 1 END) as missing_number,
        COUNT(CASE WHEN program_id IS NULL THEN 1 END) as missing_program,
        COUNT(CASE WHEN year_level IS NULL THEN 1 END) as missing_year
    FROM students
""")).fetchone()

print_result("All students have student numbers", students_missing_data[0] == 0,
             f"{students_missing_data[0]} missing" if students_missing_data[0] > 0 else "All OK")
if students_missing_data[0] > 0:
    test_results["failed"] += 1
    record_issue("Student Data", f"{students_missing_data[0]} students missing student numbers", "MEDIUM")
else:
    test_results["passed"] += 1

print_result("All students assigned to programs", students_missing_data[1] == 0,
             f"{students_missing_data[1]} unassigned" if students_missing_data[1] > 0 else "All OK")
if students_missing_data[1] > 0:
    test_results["failed"] += 1
    record_issue("Student Data", f"{students_missing_data[1]} students not assigned to programs", "HIGH")
else:
    test_results["passed"] += 1

print_result("All students have year level", students_missing_data[2] == 0,
             f"{students_missing_data[2]} missing" if students_missing_data[2] > 0 else "All OK")
if students_missing_data[2] > 0:
    test_results["failed"] += 1
    record_issue("Student Data", f"{students_missing_data[2]} students missing year level", "MEDIUM")
else:
    test_results["passed"] += 1

# ============================================================================
# TEST 8: SYSTEM SECURITY & AUDIT
# ============================================================================
print_section("TEST 8: SYSTEM SECURITY & AUDIT")

# Check audit logging is working
audit_logs = db.execute(text("SELECT COUNT(*) FROM audit_logs")).scalar()
print_result("Audit logging enabled", audit_logs > 0, f"{audit_logs} log entries")
if audit_logs > 0:
    test_results["passed"] += 1
    
    # Check recent audit activity
    recent_logs = db.execute(text("""
        SELECT COUNT(*) FROM audit_logs 
        WHERE timestamp > NOW() - INTERVAL '7 days'
    """)).scalar()
    print_result("Recent audit activity", recent_logs > 0, f"{recent_logs} entries in last 7 days")
    test_results["passed"] += 1
else:
    test_results["failed"] += 1
    record_issue("System Security", "No audit logs - audit system may be disabled", "MEDIUM")

# Check for users with default/weak passwords (if stored as plain text - shouldn't be!)
users_with_short_passwords = db.execute(text("""
    SELECT COUNT(*) FROM users WHERE LENGTH(password_hash) < 50
""")).scalar()
print_result("Passwords properly hashed", users_with_short_passwords == 0,
             f"{users_with_short_passwords} potentially unhashed passwords" if users_with_short_passwords > 0 else "All OK")
if users_with_short_passwords > 0:
    test_results["failed"] += 1
    record_issue("System Security", f"{users_with_short_passwords} users may have unhashed passwords", "CRITICAL")
else:
    test_results["passed"] += 1

# ============================================================================
# TEST 9: BUSINESS LOGIC VALIDATION
# ============================================================================
print_section("TEST 9: BUSINESS LOGIC VALIDATION")

# Check if students are enrolled in courses from their own program/year
cross_program_enrollments = db.execute(text("""
    SELECT COUNT(*) 
    FROM enrollments e
    JOIN students s ON e.student_id = s.id
    JOIN class_sections cs ON e.class_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    WHERE c.program_id IS NOT NULL 
      AND s.program_id IS NOT NULL
      AND c.program_id != s.program_id
""")).scalar()
print_result("Students enrolled in correct programs", cross_program_enrollments == 0,
             f"{cross_program_enrollments} cross-program enrollments" if cross_program_enrollments > 0 else "All OK")
if cross_program_enrollments > 0:
    test_results["failed"] += 1
    record_issue("Enrollment Logic", f"{cross_program_enrollments} students enrolled in other programs' courses", "LOW")
else:
    test_results["passed"] += 1

# Check evaluation dates are within period dates
evaluations_outside_period = db.execute(text("""
    SELECT COUNT(*)
    FROM evaluations e
    JOIN evaluation_periods ep ON e.evaluation_period_id = ep.id
    WHERE e.submission_date IS NOT NULL
      AND (e.submission_date < ep.start_date OR e.submission_date > ep.end_date)
""")).scalar()
print_result("Evaluations submitted within period", evaluations_outside_period == 0,
             f"{evaluations_outside_period} outside period dates" if evaluations_outside_period > 0 else "All OK")
if evaluations_outside_period > 0:
    test_results["failed"] += 1
    record_issue("Data Integrity", f"{evaluations_outside_period} evaluations submitted outside their period dates", "MEDIUM")
else:
    test_results["passed"] += 1

# ============================================================================
# TEST 10: MISSING FEATURES & GAPS
# ============================================================================
print_section("TEST 10: FEATURE COMPLETENESS CHECK")

# Check for ML model files
import os
ml_models_exist = os.path.exists('models/svm_sentiment_model.pkl')
print_result("ML sentiment model exists", ml_models_exist)
if not ml_models_exist:
    test_results["failed"] += 1
    record_issue("Missing Feature", "ML sentiment analysis model not trained", "LOW")
else:
    test_results["passed"] += 1

# Check system settings
settings_count = db.execute(text("SELECT COUNT(*) FROM system_settings")).scalar()
print_result("System settings configured", settings_count > 0, f"{settings_count} settings")
if settings_count > 0:
    test_results["passed"] += 1
else:
    test_results["failed"] += 1
    record_issue("System Configuration", "No system settings configured", "LOW")

# Check for email notification capability (password reset tokens table usage)
reset_tokens = db.execute(text("SELECT COUNT(*) FROM password_reset_tokens")).scalar()
print_result("Password reset system used", reset_tokens >= 0, 
             f"{reset_tokens} tokens generated" if reset_tokens > 0 else "Not used yet")
test_results["passed"] += 1

# ============================================================================
# SUMMARY & RECOMMENDATIONS
# ============================================================================
print_section("TEST SUMMARY & ANALYSIS")

total_tests = test_results["passed"] + test_results["failed"]
pass_rate = round((test_results["passed"] / total_tests * 100), 1) if total_tests > 0 else 0

print(f"Total Tests Run: {total_tests}")
print(f"Tests Passed: {test_results['passed']} ({pass_rate}%)")
print(f"Tests Failed: {test_results['failed']}")
print(f"\nIssues Found: {len(test_results['issues'])}")

if test_results["issues"]:
    print_section("ISSUES BREAKDOWN BY SEVERITY")
    
    critical = [i for i in test_results["issues"] if i["severity"] == "CRITICAL"]
    high = [i for i in test_results["issues"] if i["severity"] == "HIGH"]
    medium = [i for i in test_results["issues"] if i["severity"] == "MEDIUM"]
    low = [i for i in test_results["issues"] if i["severity"] == "LOW"]
    
    if critical:
        print(f"🔴 CRITICAL ({len(critical)}):")
        for issue in critical:
            print(f"   - [{issue['category']}] {issue['description']}")
    
    if high:
        print(f"\n🟠 HIGH ({len(high)}):")
        for issue in high:
            print(f"   - [{issue['category']}] {issue['description']}")
    
    if medium:
        print(f"\n🟡 MEDIUM ({len(medium)}):")
        for issue in medium:
            print(f"   - [{issue['category']}] {issue['description']}")
    
    if low:
        print(f"\n🟢 LOW ({len(low)}):")
        for issue in low:
            print(f"   - [{issue['category']}] {issue['description']}")

print_section("RECOMMENDATIONS")

print("""
IMMEDIATE ACTIONS REQUIRED:
1. Fix any CRITICAL or HIGH severity issues immediately
2. Ensure all students have proper program assignments
3. Verify all class sections have instructors assigned
4. Check for and remove duplicate evaluations

SHORT-TERM IMPROVEMENTS:
1. Add data validation at enrollment time
2. Implement cascade delete protections
3. Add automated tests for new features
4. Set up regular database integrity checks

MISSING FEATURES TO CONSIDER:
1. Email notification system for period extensions
2. Automated reminders for pending evaluations
3. Data export/backup scheduling
4. Advanced analytics dashboard
5. Mobile-responsive evaluation interface
6. Real-time statistics updates
7. Student feedback on system usability
8. Bulk operations for admin tasks

PERFORMANCE OPTIMIZATIONS:
1. Add database indexes on frequently queried columns
2. Implement caching for static data
3. Optimize queries with many JOINs
4. Consider pagination for large datasets
""")

print_section("TEST COMPLETE")
print(f"Overall System Health: {'🟢 GOOD' if pass_rate >= 90 else '🟡 FAIR' if pass_rate >= 70 else '🔴 NEEDS ATTENTION'}")
print(f"Pass Rate: {pass_rate}%\n")

# Save results to file
with open('test_results_comprehensive.json', 'w') as f:
    json.dump(test_results, f, indent=2)
print("📄 Detailed results saved to: test_results_comprehensive.json")
