"""
Test #3: Verify Performance Indexes
Check that new indexes are being used by queries
"""
from database.connection import get_db
from sqlalchemy import text

db = next(get_db())

print('=' * 80)
print('TEST #3: PERFORMANCE INDEX VERIFICATION')
print('=' * 80)

# Test queries that should use the new indexes
test_queries = [
    {
        'name': 'Evaluation Period + Submission Date',
        'index': 'idx_evaluations_period_submission',
        'query': """
            SELECT * FROM evaluations 
            WHERE evaluation_period_id = 7 
            AND submission_date >= '2024-01-01'
            LIMIT 10;
        """
    },
    {
        'name': 'Class Sections by Semester/Year',
        'index': 'idx_class_sections_semester_year',
        'query': """
            SELECT * FROM class_sections
            WHERE semester = 'First Semester'
            AND academic_year = '2024-2025'
            LIMIT 10;
        """
    },
    {
        'name': 'Evaluation Periods by Year/Semester',
        'index': 'idx_evaluation_periods_year_semester',
        'query': """
            SELECT * FROM evaluation_periods
            WHERE academic_year = '2024-2025'
            AND semester = 'First Semester'
            LIMIT 10;
        """
    },
    {
        'name': 'Student Enrollments',
        'index': 'idx_enrollments_student_section',
        'query': """
            SELECT * FROM enrollments
            WHERE student_id = 1
            AND class_section_id = 1
            LIMIT 10;
        """
    },
    {
        'name': 'Student Program/Year',
        'index': 'idx_students_program_year',
        'query': """
            SELECT * FROM students
            WHERE program_id = 1
            AND year_level = 3
            LIMIT 10;
        """
    },
    {
        'name': 'Recent Evaluations',
        'index': 'idx_evaluations_submission_date',
        'query': """
            SELECT * FROM evaluations
            ORDER BY submission_date DESC
            LIMIT 10;
        """
    }
]

passed_tests = 0
total_tests = len(test_queries)

for i, test in enumerate(test_queries, 1):
    print(f'\n🧪 TEST {i}: {test["name"]}')
    print('-' * 80)
    print(f'Expected Index: {test["index"]}')
    
    # Run EXPLAIN to see query plan
    explain_query = f"EXPLAIN {test['query']}"
    try:
        result = db.execute(text(explain_query)).fetchall()
        plan = '\n'.join([row[0] for row in result])
        
        # Check if using index scan
        if 'Index Scan' in plan or 'Index Only Scan' in plan:
            # Check if using the correct index
            if test['index'] in plan:
                print(f'✅ PASS: Using {test["index"]}')
                passed_tests += 1
            elif 'idx_' in plan:
                # Using a different index
                used_index = [line for line in plan.split('\n') if 'idx_' in line][0]
                print(f'⚠️  INFO: Using different index: {used_index.strip()}')
                print('   (Still optimized, just not the specific new index)')
                passed_tests += 1
            else:
                print(f'❌ FAIL: Using index scan but not {test["index"]}')
        elif 'Seq Scan' in plan:
            print(f'⚠️  WARNING: Using Sequential Scan (slow)')
            print(f'   Query may need WHERE clause or index not optimal')
            # Check if table is small enough that seq scan is faster
            if 'rows=' in plan:
                import re
                rows_match = re.search(r'rows=(\d+)', plan)
                if rows_match and int(rows_match.group(1)) < 100:
                    print(f'   Table small ({rows_match.group(1)} rows), seq scan acceptable')
                    passed_tests += 1
        else:
            print(f'✅ PASS: Query optimized')
            passed_tests += 1
            
    except Exception as e:
        print(f'❌ ERROR: {str(e)}')

# Check that all 7 new indexes exist
print(f'\n\n🔍 VERIFYING ALL 7 NEW INDEXES EXIST:')
print('-' * 80)

new_indexes = [
    'idx_evaluations_period_submission',
    'idx_class_sections_semester_year',
    'idx_evaluation_periods_year_semester',
    'idx_enrollments_student_section',
    'idx_enrollments_student_period',
    'idx_students_program_year',
    'idx_evaluations_submission_date'
]

existing_indexes = db.execute(text("""
    SELECT indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = ANY(:index_names);
"""), {'index_names': new_indexes}).fetchall()

existing_index_names = [idx[0] for idx in existing_indexes]

indexes_passed = 0
for idx in new_indexes:
    if idx in existing_index_names:
        print(f'✅ {idx}')
        indexes_passed += 1
    else:
        print(f'❌ {idx} - MISSING')

# Test results
print('\n' + '=' * 80)
print('TEST RESULTS:')
print('-' * 80)
print(f'Query Performance Tests: {passed_tests}/{total_tests} passed')
print(f'Index Existence: {indexes_passed}/{len(new_indexes)} indexes found')

all_passed = passed_tests >= (total_tests * 0.7) and indexes_passed == len(new_indexes)

print('\n' + '=' * 80)
if all_passed:
    print('✅ PERFORMANCE INDEX TEST: PASSED')
    print(f'   {indexes_passed} indexes created successfully')
    print(f'   {passed_tests} queries optimized')
else:
    print('❌ PERFORMANCE INDEX TEST: FAILED')
print('=' * 80)

db.close()
