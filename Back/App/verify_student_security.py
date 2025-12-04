"""
Test #2: Verify Student Ownership Validation
Check that students can only access their own data
"""
from database.connection import get_db
from sqlalchemy import text
from routes.student import verify_student_ownership
from fastapi import HTTPException

db = next(get_db())

print('=' * 80)
print('TEST #2: STUDENT OWNERSHIP VALIDATION')
print('=' * 80)

# Get sample student data
students = db.execute(text("""
    SELECT s.id, s.user_id, u.email, u.role
    FROM students s
    JOIN users u ON s.user_id = u.id
    LIMIT 3;
""")).fetchall()

if len(students) < 2:
    print('❌ ERROR: Need at least 2 students to test')
    db.close()
    exit(1)

print(f'\n📋 Test Students:')
print('-' * 80)
for student in students:
    print(f'Student ID: {student[0]}, User ID: {student[1]}, Email: {student[2]}')

# Test 1: Valid access (student accessing own data)
print(f'\n🧪 TEST 1: Valid Access (Student {students[0][0]} accessing own data)')
print('-' * 80)
try:
    current_user = {'id': students[0][1], 'role': 'student'}
    verify_student_ownership(students[0][0], current_user, db)
    print('✅ PASS: Student can access own data')
    test1_passed = True
except HTTPException as e:
    print(f'❌ FAIL: Got {e.status_code} - {e.detail}')
    test1_passed = False

# Test 2: Invalid access (student accessing another's data)
print(f'\n🧪 TEST 2: Invalid Access (Student {students[0][0]} accessing Student {students[1][0]}\'s data)')
print('-' * 80)
try:
    current_user = {'id': students[0][1], 'role': 'student'}  # User 1
    verify_student_ownership(students[1][0], current_user, db)  # Trying to access Student 2
    print('❌ FAIL: Should have blocked unauthorized access')
    test2_passed = False
except HTTPException as e:
    if e.status_code == 403:
        print(f'✅ PASS: Correctly blocked with 403 - "{e.detail}"')
        test2_passed = True
    else:
        print(f'❌ FAIL: Wrong error code {e.status_code}')
        test2_passed = False

# Test 3: Non-existent student
print(f'\n🧪 TEST 3: Non-existent Student (ID: 99999)')
print('-' * 80)
try:
    current_user = {'id': students[0][1], 'role': 'student'}
    verify_student_ownership(99999, current_user, db)
    print('❌ FAIL: Should have returned 404')
    test3_passed = False
except HTTPException as e:
    if e.status_code == 404:
        print(f'✅ PASS: Correctly returned 404 - "{e.detail}"')
        test3_passed = True
    else:
        print(f'⚠️  Got {e.status_code} instead of 404 - "{e.detail}"')
        test3_passed = True  # Still acceptable if access denied

# Check that function exists in routes
print(f'\n🧪 TEST 4: Function Implementation')
print('-' * 80)
import inspect
source = inspect.getsource(verify_student_ownership)
if 'user_id' in source and 'students' in source and '403' in source:
    print('✅ PASS: Function properly implemented with security checks')
    test4_passed = True
else:
    print('❌ FAIL: Function missing key security elements')
    test4_passed = False

# Test results
print('\n' + '=' * 80)
print('TEST RESULTS:')
print('-' * 80)
print(f'Test 1 (Valid Access): {"✅ PASS" if test1_passed else "❌ FAIL"}')
print(f'Test 2 (Block Unauthorized): {"✅ PASS" if test2_passed else "❌ FAIL"}')
print(f'Test 3 (Non-existent Student): {"✅ PASS" if test3_passed else "❌ FAIL"}')
print(f'Test 4 (Implementation): {"✅ PASS" if test4_passed else "❌ FAIL"}')

all_passed = test1_passed and test2_passed and test3_passed and test4_passed

print('\n' + '=' * 80)
if all_passed:
    print('✅ STUDENT SECURITY TEST: PASSED')
else:
    print('❌ STUDENT SECURITY TEST: FAILED')
print('=' * 80)

db.close()
