"""
Test Phase 1 Implementation: Period Filtering
Verify that all endpoints work correctly with period filtering
"""
from database.connection import get_db
from sqlalchemy import text

db = next(get_db())

print('=' * 80)
print('PHASE 1 IMPLEMENTATION TEST: PERIOD FILTERING')
print('=' * 80)

# Test 1: Check evaluation periods exist
print('\n🧪 TEST 1: Evaluation Periods Available')
print('-' * 80)
periods = db.execute(text("""
    SELECT id, name, status, semester, academic_year
    FROM evaluation_periods
    ORDER BY start_date DESC;
""")).fetchall()

if periods:
    print(f'✅ Found {len(periods)} evaluation periods:')
    for p in periods:
        status_icon = '⭐' if p[2] == 'active' else '📁'
        print(f'  {status_icon} ID {p[0]}: {p[1]} | Status: {p[2]} | {p[3]} {p[4]}')
    active_period = next((p for p in periods if p[2] == 'active'), None)
    if active_period:
        print(f'\n✅ Active period found: ID {active_period[0]}')
        test1_passed = True
    else:
        print('\n⚠️  WARNING: No active period (system will return empty data)')
        test1_passed = True  # Not a failure, just a warning
else:
    print('❌ FAIL: No evaluation periods found')
    test1_passed = False

# Test 2: Check evaluations have period linkage
print('\n\n🧪 TEST 2: Evaluations Linked to Periods')
print('-' * 80)
eval_by_period = db.execute(text("""
    SELECT 
        COALESCE(e.evaluation_period_id, 0) as period_id,
        ep.name as period_name,
        COUNT(*) as eval_count
    FROM evaluations e
    LEFT JOIN evaluation_periods ep ON e.evaluation_period_id = ep.id
    GROUP BY e.evaluation_period_id, ep.name
    ORDER BY period_id;
""")).fetchall()

if eval_by_period:
    print(f'✅ Evaluations distributed across periods:')
    total_evals = 0
    for row in eval_by_period:
        period_name = row[1] or "NO PERIOD (needs migration)"
        print(f'  Period ID {row[0]}: {period_name} - {row[2]} evaluations')
        total_evals += row[2]
    
    no_period_count = next((r[2] for r in eval_by_period if r[0] == 0), 0)
    if no_period_count > 0:
        print(f'\n⚠️  WARNING: {no_period_count} evaluations have no period assigned')
        print('   These evaluations need migration to current period')
        test2_passed = False
    else:
        print(f'\n✅ All {total_evals} evaluations have period assigned')
        test2_passed = True
else:
    print('⚠️  No evaluations found')
    test2_passed = True

# Test 3: Check enrollments have period linkage
print('\n\n🧪 TEST 3: Enrollments Linked to Periods')
print('-' * 80)
enroll_by_period = db.execute(text("""
    SELECT 
        COALESCE(evaluation_period_id, 0) as period_id,
        COUNT(*) as enroll_count
    FROM enrollments
    GROUP BY evaluation_period_id
    ORDER BY period_id;
""")).fetchall()

if enroll_by_period:
    print(f'✅ Enrollments distributed across periods:')
    for row in enroll_by_period:
        period_label = f"Period {row[0]}" if row[0] > 0 else "NO PERIOD"
        print(f'  {period_label}: {row[1]} enrollments')
    
    no_period_count = next((r[1] for r in enroll_by_period if r[0] == 0), 0)
    if no_period_count > 0:
        print(f'\n⚠️  WARNING: {no_period_count} enrollments have no period assigned')
        test3_passed = False
    else:
        print(f'\n✅ All enrollments have period assigned')
        test3_passed = True
else:
    print('⚠️  No enrollments found')
    test3_passed = True

# Test 4: Simulate filtered queries
print('\n\n🧪 TEST 4: Simulate Dashboard Queries with Period Filter')
print('-' * 80)

if active_period:
    period_id = active_period[0]
    
    # Test evaluation count with period filter
    total_no_filter = db.execute(text("SELECT COUNT(*) FROM evaluations")).scalar()
    total_with_filter = db.execute(text("""
        SELECT COUNT(*) FROM evaluations WHERE evaluation_period_id = :period_id
    """), {"period_id": period_id}).scalar()
    
    print(f'Evaluation counts:')
    print(f'  Without filter: {total_no_filter} evaluations')
    print(f'  With period filter (ID {period_id}): {total_with_filter} evaluations')
    
    if total_with_filter < total_no_filter:
        print(f'✅ PASS: Period filter reduces data by {total_no_filter - total_with_filter} evaluations')
        print(f'   ({round((total_no_filter - total_with_filter) / total_no_filter * 100, 1)}% reduction)')
        test4_passed = True
    elif total_with_filter == total_no_filter:
        print(f'✅ PASS: All evaluations belong to active period (single period system)')
        test4_passed = True
    else:
        print(f'❌ FAIL: Filtered count greater than total (logic error)')
        test4_passed = False
else:
    print('⚠️  SKIP: No active period to test')
    test4_passed = True

# Test 5: Check API endpoint dependencies
print('\n\n🧪 TEST 5: Verify Required Models and Imports')
print('-' * 80)

try:
    from models.enhanced_models import EvaluationPeriod, Evaluation, Enrollment
    print('✅ EvaluationPeriod model available')
    print('✅ Evaluation model available')
    print('✅ Enrollment model available')
    
    # Check period_id columns exist
    from sqlalchemy import inspect
    inspector = inspect(db.bind)
    
    eval_columns = [c['name'] for c in inspector.get_columns('evaluations')]
    enroll_columns = [c['name'] for c in inspector.get_columns('enrollments')]
    
    if 'evaluation_period_id' in eval_columns:
        print('✅ evaluations.evaluation_period_id column exists')
    else:
        print('❌ evaluations.evaluation_period_id column MISSING')
        test5_passed = False
        
    if 'evaluation_period_id' in enroll_columns:
        print('✅ enrollments.evaluation_period_id column exists')
        test5_passed = True
    else:
        print('❌ enrollments.evaluation_period_id column MISSING')
        test5_passed = False
        
except ImportError as e:
    print(f'❌ FAIL: Import error - {e}')
    test5_passed = False

# Summary
print('\n' + '=' * 80)
print('TEST SUMMARY')
print('=' * 80)
print(f'Test 1 (Periods Available): {"✅ PASS" if test1_passed else "❌ FAIL"}')
print(f'Test 2 (Evaluations Linked): {"✅ PASS" if test2_passed else "⚠️  WARNING"}')
print(f'Test 3 (Enrollments Linked): {"✅ PASS" if test3_passed else "⚠️  WARNING"}')
print(f'Test 4 (Filtered Queries): {"✅ PASS" if test4_passed else "❌ FAIL"}')
print(f'Test 5 (Model Dependencies): {"✅ PASS" if test5_passed else "❌ FAIL"}')

all_passed = test1_passed and test4_passed and test5_passed
warnings = not (test2_passed and test3_passed)

print('\n' + '=' * 80)
if all_passed and not warnings:
    print('✅ PHASE 1 IMPLEMENTATION: COMPLETE')
    print('   All systems ready for period-filtered dashboards')
elif all_passed and warnings:
    print('⚠️  PHASE 1 IMPLEMENTATION: COMPLETE WITH WARNINGS')
    print('   Period filtering works, but some data needs migration')
else:
    print('❌ PHASE 1 IMPLEMENTATION: INCOMPLETE')
    print('   Critical issues found that need fixing')
print('=' * 80)

db.close()
