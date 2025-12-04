"""
Apply Missing Performance Indexes to Database
"""
from database.connection import get_db
from sqlalchemy import text

db = next(get_db())

print('=' * 60)
print('ADDING PERFORMANCE INDEXES')
print('=' * 60)

indexes = [
    {
        'name': 'idx_evaluations_period_submission',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_evaluations_period_submission ON evaluations(evaluation_period_id, submission_date);'
    },
    {
        'name': 'idx_class_sections_semester_year',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_class_sections_semester_year ON class_sections(semester, academic_year);'
    },
    {
        'name': 'idx_evaluation_periods_year_semester',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_evaluation_periods_year_semester ON evaluation_periods(academic_year, semester);'
    },
    {
        'name': 'idx_enrollments_student_section',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_enrollments_student_section ON enrollments(student_id, class_section_id);'
    },
    {
        'name': 'idx_enrollments_student_period',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_enrollments_student_period ON enrollments(student_id, evaluation_period_id);'
    },
    {
        'name': 'idx_students_program_year',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_students_program_year ON students(program_id, year_level);'
    },
    {
        'name': 'idx_evaluations_submission_date',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_evaluations_submission_date ON evaluations(submission_date DESC);'
    }
]

created = 0
already_existed = 0
errors = 0

for idx in indexes:
    try:
        print(f'\nCreating: {idx["name"]}...')
        db.execute(text(idx['sql']))
        db.commit()
        print(f'  ✅ Created successfully')
        created += 1
    except Exception as e:
        if 'already exists' in str(e).lower():
            print(f'  ℹ️  Already exists')
            already_existed += 1
            db.rollback()
        else:
            print(f'  ❌ Error: {e}')
            errors += 1
            db.rollback()

print('\n' + '=' * 60)
print('SUMMARY')
print('=' * 60)
print(f'Created: {created}')
print(f'Already existed: {already_existed}')
print(f'Errors: {errors}')
print(f'Total processed: {len(indexes)}')

if created > 0:
    print(f'\n✅ {created} new indexes added!')
if already_existed > 0:
    print(f'ℹ️  {already_existed} indexes already existed')
if errors > 0:
    print(f'⚠️  {errors} errors occurred')

print('\n✅ Index optimization complete!')

db.close()
