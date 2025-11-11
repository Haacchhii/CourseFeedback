"""
COMPREHENSIVE FIELD MISMATCH DIAGNOSTIC
Finds all database field mismatches across all route files
"""
import re
import os

# Actual database schema from check_columns.py output
DATABASE_SCHEMA = {
    'evaluations': [
        'id', 'student_id', 'class_section_id', 'rating_teaching', 'rating_content',
        'rating_engagement', 'rating_overall', 'text_feedback', 'suggestions',
        'sentiment', 'sentiment_score', 'sentiment_confidence', 'is_anomaly',
        'anomaly_score', 'anomaly_reason', 'submission_date', 'submission_ip',
        'processing_status', 'processed_at'
    ],
    'class_sections': [
        'id', 'course_id', 'instructor_id', 'class_code', 'semester',
        'academic_year', 'max_students', 'created_at'
    ],
    'instructors': [
        'id', 'user_id', 'name', 'department', 'specialization',
        'created_at', 'updated_at'
    ],
    'secretaries': [
        'id', 'user_id', 'name', 'department', 'programs',
        'created_at', 'updated_at'
    ],
    'department_heads': [
        'id', 'user_id', 'first_name', 'last_name', 'department',
        'programs', 'created_at'
    ],
    'students': [
        'id', 'user_id', 'student_number', 'program_id', 'year_level',
        'is_active', 'created_at'
    ],
    'users': [
        'id', 'email', 'password_hash', 'role', 'first_name', 'last_name',
        'department', 'is_active', 'last_login', 'created_at'
    ],
    'courses': [
        'id', 'subject_code', 'subject_name', 'program_id', 'year_level',
        'semester', 'is_active', 'created_at'
    ],
    'analysis_results': [
        'id', 'class_section_id', 'analysis_type', 'total_evaluations',
        'positive_count', 'neutral_count', 'negative_count', 'anomaly_count',
        'avg_overall_rating', 'avg_sentiment_score', 'detailed_results',
        'analysis_date', 'created_at'
    ]
}

# Common incorrect field names found in code
KNOWN_ISSUES = {
    'Evaluation': {
        'overall_rating': 'rating_overall',
        'sentiment_label': 'sentiment',
        'comments': 'text_feedback',
    },
    'ClassSection': {
        'firebase_sync_id': 'DOES_NOT_EXIST',
    }
}

print("=" * 80)
print("COMPREHENSIVE FIELD MISMATCH DIAGNOSTIC")
print("=" * 80)

routes_dir = "."
route_files = [
    'admin.py',
    'secretary.py', 
    'instructor.py',
    'department_head.py',
    'student.py',
    'auth.py'
]

all_issues = []

for route_file in route_files:
    filepath = os.path.join(routes_dir, route_file)
    if not os.path.exists(filepath):
        continue
        
    print(f"\n📁 Checking: {route_file}")
    print("-" * 80)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')
    
    file_issues = []
    
    # Check for known bad field names
    for model, bad_fields in KNOWN_ISSUES.items():
        for bad_field, correct_field in bad_fields.items():
            pattern = rf'{model}\.{bad_field}'
            matches = re.finditer(pattern, content)
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                file_issues.append({
                    'line': line_num,
                    'pattern': f'{model}.{bad_field}',
                    'should_be': f'{model}.{correct_field}' if correct_field != 'DOES_NOT_EXIST' else 'REMOVE THIS FIELD',
                    'code': lines[line_num - 1].strip()
                })
    
    if file_issues:
        print(f"  ❌ Found {len(file_issues)} issue(s):")
        for issue in file_issues:
            print(f"    Line {issue['line']}: {issue['pattern']} → {issue['should_be']}")
            print(f"      Code: {issue['code'][:70]}")
        all_issues.extend([(route_file, issue) for issue in file_issues])
    else:
        print("  ✅ No known field mismatches found")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"\nTotal Issues Found: {len(all_issues)}")

if all_issues:
    print("\n🔧 FIXES REQUIRED:\n")
    by_file = {}
    for filename, issue in all_issues:
        if filename not in by_file:
            by_file[filename] = []
        by_file[filename].append(issue)
    
    for filename, issues in by_file.items():
        print(f"\n{filename}: {len(issues)} issue(s)")
        for issue in issues:
            print(f"  • Line {issue['line']}: {issue['pattern']} → {issue['should_be']}")
else:
    print("\n✅ All route files appear to use correct field names!")

print("\n" + "=" * 80)
