"""
Deep System Analysis - Finding Real Bugs and Issues
Scanning: Models, Routes, Database, Frontend Integration
"""

from database.connection import get_db
from sqlalchemy import text
import os
import json

db = next(get_db())

print("="*80)
print("DEEP SYSTEM ANALYSIS - BUG HUNTING")
print("="*80)

issues = {
    "critical": [],
    "high": [],
    "medium": [],
    "low": [],
    "warnings": []
}

# =============================================================================
# 1. DATABASE SCHEMA INCONSISTENCIES
# =============================================================================
print("\n[1] CHECKING DATABASE SCHEMA INCONSISTENCIES...")

# Check for NULL foreign keys that should not be NULL
print("\n   Checking foreign key integrity...")

# Evaluations without students
orphan_evals = db.execute(text("""
    SELECT COUNT(*) FROM evaluations e
    WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.id = e.student_id)
""")).scalar()
if orphan_evals > 0:
    issues["critical"].append(f"❌ {orphan_evals} evaluations reference non-existent students")
    print(f"   ❌ CRITICAL: {orphan_evals} evaluations with invalid student_id")
else:
    print(f"   ✅ All evaluations have valid student references")

# Evaluations without sections
orphan_eval_sections = db.execute(text("""
    SELECT COUNT(*) FROM evaluations e
    WHERE NOT EXISTS (SELECT 1 FROM class_sections cs WHERE cs.id = e.class_section_id)
""")).scalar()
if orphan_eval_sections > 0:
    issues["critical"].append(f"❌ {orphan_eval_sections} evaluations reference non-existent class sections")
    print(f"   ❌ CRITICAL: {orphan_eval_sections} evaluations with invalid class_section_id")
else:
    print(f"   ✅ All evaluations have valid section references")

# Class sections without courses
sections_no_course = db.execute(text("""
    SELECT COUNT(*) FROM class_sections cs
    WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.id = cs.course_id)
""")).scalar()
if sections_no_course > 0:
    issues["critical"].append(f"❌ {sections_no_course} class sections reference non-existent courses")
    print(f"   ❌ CRITICAL: {sections_no_course} sections with invalid course_id")
else:
    print(f"   ✅ All class sections have valid course references")

# Students without users
students_no_user = db.execute(text("""
    SELECT COUNT(*) FROM students s
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)
""")).scalar()
if students_no_user > 0:
    issues["critical"].append(f"❌ {students_no_user} students reference non-existent users")
    print(f"   ❌ CRITICAL: {students_no_user} students with invalid user_id")
else:
    print(f"   ✅ All students have valid user references")

# =============================================================================
# 2. DATA CONSISTENCY ISSUES
# =============================================================================
print("\n[2] CHECKING DATA CONSISTENCY...")

# Check for duplicate student numbers
dup_student_nums = db.execute(text("""
    SELECT student_number, COUNT(*) as count
    FROM students
    GROUP BY student_number
    HAVING COUNT(*) > 1
""")).fetchall()
if dup_student_nums:
    issues["high"].append(f"❌ {len(dup_student_nums)} duplicate student numbers found")
    print(f"   ❌ HIGH: {len(dup_student_nums)} duplicate student numbers")
    for dup in dup_student_nums[:3]:
        print(f"      Student number '{dup[0]}' appears {dup[1]} times")
else:
    print(f"   ✅ No duplicate student numbers")

# Check for users without proper names
users_no_name = db.execute(text("""
    SELECT COUNT(*) FROM users
    WHERE (first_name IS NULL OR first_name = '') 
       OR (last_name IS NULL OR last_name = '')
""")).scalar()
if users_no_name > 0:
    issues["medium"].append(f"⚠️ {users_no_name} users missing first or last name")
    print(f"   ⚠️ MEDIUM: {users_no_name} users without complete names")
else:
    print(f"   ✅ All users have names")

# Check for students without programs
students_no_program = db.execute(text("""
    SELECT COUNT(*) FROM students WHERE program_id IS NULL
""")).scalar()
if students_no_program > 0:
    issues["high"].append(f"❌ {students_no_program} students not assigned to any program")
    print(f"   ❌ HIGH: {students_no_program} students without programs")
else:
    print(f"   ✅ All students assigned to programs")

# Check for students without year level
students_no_year = db.execute(text("""
    SELECT COUNT(*) FROM students WHERE year_level IS NULL
""")).scalar()
if students_no_year > 0:
    issues["medium"].append(f"⚠️ {students_no_year} students missing year level")
    print(f"   ⚠️ MEDIUM: {students_no_year} students without year level")
else:
    print(f"   ✅ All students have year level")

# =============================================================================
# 3. EVALUATION SYSTEM ISSUES
# =============================================================================
print("\n[3] CHECKING EVALUATION SYSTEM...")

# Check for evaluations with NULL ratings (submitted but no data)
submitted_no_rating = db.execute(text("""
    SELECT COUNT(*) FROM evaluations
    WHERE submission_date IS NOT NULL
      AND (rating_overall IS NULL OR rating_overall = 0)
""")).scalar()
if submitted_no_rating > 0:
    issues["high"].append(f"❌ {submitted_no_rating} submitted evaluations missing ratings")
    print(f"   ❌ HIGH: {submitted_no_rating} submitted evaluations have no ratings")
else:
    print(f"   ✅ All submitted evaluations have ratings")

# Check for duplicate evaluations (same student, section, period)
dup_evaluations = db.execute(text("""
    SELECT student_id, class_section_id, evaluation_period_id, COUNT(*) as count
    FROM evaluations
    WHERE evaluation_period_id IS NOT NULL
    GROUP BY student_id, class_section_id, evaluation_period_id
    HAVING COUNT(*) > 1
""")).fetchall()
if dup_evaluations:
    issues["critical"].append(f"❌ {len(dup_evaluations)} sets of duplicate evaluations")
    print(f"   ❌ CRITICAL: {len(dup_evaluations)} duplicate evaluation sets")
    for dup in dup_evaluations[:3]:
        print(f"      Student {dup[0]}, Section {dup[1]}, Period {dup[2]}: {dup[3]} duplicates")
else:
    print(f"   ✅ No duplicate evaluations")

# Check evaluation period status consistency
period_status = db.execute(text("""
    SELECT status, COUNT(*) FROM evaluation_periods GROUP BY status
""")).fetchall()
print(f"\n   Period statuses:")
for status in period_status:
    print(f"      {status[0]}: {status[1]} periods")

active_periods = db.execute(text("""
    SELECT COUNT(*) FROM evaluation_periods WHERE status IN ('Open', 'active')
""")).scalar()
if active_periods == 0:
    issues["warnings"].append("ℹ️ No active evaluation period (normal if between periods)")
    print(f"   ℹ️ INFO: No active evaluation period")
elif active_periods > 1:
    issues["high"].append(f"❌ {active_periods} active periods simultaneously")
    print(f"   ❌ HIGH: {active_periods} active periods at once")
else:
    print(f"   ✅ Exactly one active period")

# =============================================================================
# 4. CLASS SECTION ISSUES
# =============================================================================
print("\n[4] CHECKING CLASS SECTIONS...")

# Check for sections with no enrollments
sections_no_enrollments = db.execute(text("""
    SELECT COUNT(*) FROM class_sections cs
    WHERE NOT EXISTS (
        SELECT 1 FROM enrollments e WHERE e.class_section_id = cs.id
    )
""")).scalar()
if sections_no_enrollments > 0:
    issues["low"].append(f"ℹ️ {sections_no_enrollments} class sections have no enrollments")
    print(f"   ℹ️ INFO: {sections_no_enrollments} sections without students (might be new/unused)")
else:
    print(f"   ✅ All sections have enrollments")

# Check for sections with duplicate class codes
dup_class_codes = db.execute(text("""
    SELECT class_code, COUNT(*) as count
    FROM class_sections
    GROUP BY class_code
    HAVING COUNT(*) > 1
""")).fetchall()
if dup_class_codes:
    issues["high"].append(f"❌ {len(dup_class_codes)} duplicate class codes")
    print(f"   ❌ HIGH: {len(dup_class_codes)} duplicate class codes")
    for dup in dup_class_codes[:3]:
        print(f"      Class code '{dup[0]}' appears {dup[1]} times")
else:
    print(f"   ✅ All class codes are unique")

# Check for sections with overlapping semester/year
print(f"\n   Checking section validity...")
sections = db.execute(text("""
    SELECT COUNT(*), semester, academic_year 
    FROM class_sections 
    GROUP BY semester, academic_year
""")).fetchall()
for s in sections:
    print(f"      {s[1]} {s[2]}: {s[0]} sections")

# =============================================================================
# 5. PROGRAM STRUCTURE ISSUES
# =============================================================================
print("\n[5] CHECKING PROGRAM STRUCTURE...")

# Check programs without courses
programs_no_courses = db.execute(text("""
    SELECT p.id, p.program_code, p.program_name, COUNT(c.id) as course_count
    FROM programs p
    LEFT JOIN courses c ON p.id = c.program_id
    GROUP BY p.id, p.program_code, p.program_name
    HAVING COUNT(c.id) = 0
""")).fetchall()
if programs_no_courses:
    issues["warnings"].append(f"ℹ️ {len(programs_no_courses)} programs have no courses")
    print(f"   ℹ️ INFO: {len(programs_no_courses)} programs without courses")
    for prog in programs_no_courses:
        print(f"      {prog[1]} - {prog[2]}")
else:
    print(f"   ✅ All programs have courses")

# Check programs without students
programs_no_students = db.execute(text("""
    SELECT p.id, p.program_code, p.program_name, COUNT(s.id) as student_count
    FROM programs p
    LEFT JOIN students s ON p.id = s.program_id
    GROUP BY p.id, p.program_code, p.program_name
    HAVING COUNT(s.id) = 0
""")).fetchall()
if programs_no_students:
    issues["warnings"].append(f"ℹ️ {len(programs_no_students)} programs have no students")
    print(f"   ℹ️ INFO: {len(programs_no_students)} programs without students")
    for prog in programs_no_students:
        print(f"      {prog[1]} - {prog[2]}")
else:
    print(f"   ✅ All programs have students")

# Check for courses without sections
courses_no_sections = db.execute(text("""
    SELECT COUNT(*) FROM courses c
    WHERE NOT EXISTS (
        SELECT 1 FROM class_sections cs WHERE cs.course_id = c.id
    )
""")).scalar()
if courses_no_sections > 0:
    issues["low"].append(f"ℹ️ {courses_no_sections} courses have no class sections (might be inactive)")
    print(f"   ℹ️ INFO: {courses_no_sections} courses without sections")
else:
    print(f"   ✅ All courses have sections")

# =============================================================================
# 6. USER ACCOUNT ISSUES
# =============================================================================
print("\n[6] CHECKING USER ACCOUNTS...")

# Check for duplicate emails
dup_emails = db.execute(text("""
    SELECT email, COUNT(*) as count
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
""")).fetchall()
if dup_emails:
    issues["critical"].append(f"❌ {len(dup_emails)} duplicate email addresses")
    print(f"   ❌ CRITICAL: {len(dup_emails)} duplicate emails")
    for dup in dup_emails[:3]:
        print(f"      Email '{dup[0]}' appears {dup[1]} times")
else:
    print(f"   ✅ All emails are unique")

# Check for users with invalid roles
valid_roles = ['student', 'admin', 'secretary', 'department_head', 'staff']
invalid_role_users = db.execute(text(f"""
    SELECT id, email, role FROM users
    WHERE role NOT IN {tuple(valid_roles)}
""")).fetchall()
if invalid_role_users:
    issues["high"].append(f"❌ {len(invalid_role_users)} users with invalid roles")
    print(f"   ❌ HIGH: {len(invalid_role_users)} users with invalid roles")
    for user in invalid_role_users[:3]:
        print(f"      User {user[0]} ({user[1]}): role = '{user[2]}'")
else:
    print(f"   ✅ All users have valid roles")

# Check role distribution
role_dist = db.execute(text("""
    SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY COUNT(*) DESC
""")).fetchall()
print(f"\n   User role distribution:")
for role in role_dist:
    print(f"      {role[0]}: {role[1]} users")

# Check for inactive users
inactive_users = db.execute(text("""
    SELECT COUNT(*) FROM users WHERE is_active = false
""")).scalar()
print(f"\n   Inactive users: {inactive_users}")

# =============================================================================
# 7. PROGRAM SECTION STRUCTURE
# =============================================================================
print("\n[7] CHECKING PROGRAM SECTIONS...")

# Check program sections
prog_sections = db.execute(text("""
    SELECT COUNT(*) FROM program_sections
""")).scalar()
print(f"   Total program sections: {prog_sections}")

# Check students in program sections
students_in_sections = db.execute(text("""
    SELECT COUNT(DISTINCT student_id) FROM section_students
""")).scalar()
total_students = db.execute(text("""
    SELECT COUNT(*) FROM students
""")).scalar()
print(f"   Students in program sections: {students_in_sections}/{total_students}")

if students_in_sections < total_students * 0.5:
    issues["medium"].append(f"⚠️ Only {students_in_sections}/{total_students} students assigned to program sections")
    print(f"   ⚠️ MEDIUM: Low program section assignment rate")

# =============================================================================
# 8. SECURITY CHECKS
# =============================================================================
print("\n[8] CHECKING SECURITY...")

# Check password hash lengths (should be bcrypt ~60 chars)
short_passwords = db.execute(text("""
    SELECT COUNT(*) FROM users WHERE LENGTH(password_hash) < 50
""")).scalar()
if short_passwords > 0:
    issues["critical"].append(f"❌ {short_passwords} users may have unhashed passwords")
    print(f"   ❌ CRITICAL: {short_passwords} users with potentially unhashed passwords")
else:
    print(f"   ✅ All passwords properly hashed")

# Check audit log functionality
recent_audits = db.execute(text("""
    SELECT COUNT(*) FROM audit_logs WHERE timestamp > NOW() - INTERVAL '7 days'
""")).scalar()
print(f"   Recent audit logs (7 days): {recent_audits}")
if recent_audits == 0:
    issues["medium"].append("⚠️ No recent audit logs - logging may be broken")
    print(f"   ⚠️ MEDIUM: No recent audit activity")
else:
    print(f"   ✅ Audit logging active")

# =============================================================================
# 9. ML/ANALYTICS READINESS
# =============================================================================
print("\n[9] CHECKING ML/ANALYTICS READINESS...")

# Check for evaluations with text feedback
evals_with_feedback = db.execute(text("""
    SELECT COUNT(*) FROM evaluations 
    WHERE text_feedback IS NOT NULL AND text_feedback != ''
""")).scalar()
total_evals = db.execute(text("SELECT COUNT(*) FROM evaluations")).scalar()
print(f"   Evaluations with text feedback: {evals_with_feedback}/{total_evals}")

if evals_with_feedback < 10:
    issues["warnings"].append("ℹ️ Very few evaluations with text feedback for ML training")
    print(f"   ℹ️ INFO: Need more text feedback for ML training")

# Check sentiment analysis
evals_with_sentiment = db.execute(text("""
    SELECT COUNT(*) FROM evaluations WHERE sentiment IS NOT NULL
""")).scalar()
print(f"   Evaluations with sentiment analysis: {evals_with_sentiment}/{total_evals}")

# Check anomaly detection
evals_flagged_anomaly = db.execute(text("""
    SELECT COUNT(*) FROM evaluations WHERE is_anomaly = true
""")).scalar()
print(f"   Evaluations flagged as anomalies: {evals_flagged_anomaly}/{total_evals}")

# =============================================================================
# 10. SYSTEM SETTINGS
# =============================================================================
print("\n[10] CHECKING SYSTEM SETTINGS...")

settings_count = db.execute(text("""
    SELECT COUNT(*) FROM system_settings
""")).scalar()
print(f"   System settings configured: {settings_count}")

# Check email configuration
email_configured = db.execute(text("""
    SELECT COUNT(*) FROM system_settings 
    WHERE key LIKE 'smtp%' AND value IS NOT NULL AND value != ''
""")).scalar()
if email_configured > 0:
    print(f"   ✅ Email (SMTP) configured ({email_configured} settings)")
else:
    issues["warnings"].append("ℹ️ Email notifications not configured")
    print(f"   ℹ️ INFO: Email notifications not configured")

# =============================================================================
# SUMMARY
# =============================================================================
print("\n" + "="*80)
print("ANALYSIS SUMMARY")
print("="*80)

print(f"\n🔴 CRITICAL ISSUES ({len(issues['critical'])}):")
if issues['critical']:
    for issue in issues['critical']:
        print(f"   {issue}")
else:
    print("   None found! ✅")

print(f"\n🟠 HIGH PRIORITY ({len(issues['high'])}):")
if issues['high']:
    for issue in issues['high']:
        print(f"   {issue}")
else:
    print("   None found! ✅")

print(f"\n🟡 MEDIUM PRIORITY ({len(issues['medium'])}):")
if issues['medium']:
    for issue in issues['medium']:
        print(f"   {issue}")
else:
    print("   None found! ✅")

print(f"\n🟢 LOW PRIORITY ({len(issues['low'])}):")
if issues['low']:
    for issue in issues['low']:
        print(f"   {issue}")
else:
    print("   None found! ✅")

print(f"\nℹ️  INFORMATIONAL ({len(issues['warnings'])}):")
if issues['warnings']:
    for issue in issues['warnings']:
        print(f"   {issue}")
else:
    print("   None! ✅")

# Save to JSON
with open('system_analysis_detailed.json', 'w') as f:
    json.dump(issues, f, indent=2)

print("\n" + "="*80)
print("OVERALL SYSTEM HEALTH: ", end="")
if issues['critical']:
    print("🔴 NEEDS ATTENTION")
elif len(issues['high']) > 2:
    print("🟠 FAIR")
elif len(issues['medium']) > 3:
    print("🟡 GOOD")
else:
    print("🟢 EXCELLENT")
print("="*80)

print(f"\nDetailed results saved to: system_analysis_detailed.json")
