from database.connection import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print('Testing FIXED completion rates query:')
print('='*80)

result = db.execute(text("""
    SELECT 
        cs.id,
        cs.class_code,
        c.subject_name,
        COUNT(DISTINCT en.student_id) as enrolled,
        COUNT(DISTINCT e.id) as evals,
        CASE 
            WHEN COUNT(DISTINCT en.student_id) > 0 
            THEN ROUND((COUNT(DISTINCT e.id)::NUMERIC / COUNT(DISTINCT en.student_id) * 100), 1)
            ELSE 0
        END as rate
    FROM class_sections cs
    INNER JOIN courses c ON cs.course_id = c.id
    LEFT JOIN enrollments en ON cs.id = en.class_section_id AND en.status = 'active'
    LEFT JOIN evaluations e ON cs.id = e.class_section_id AND e.status = 'completed'
    WHERE cs.id IN (135, 136, 137, 138, 139, 140, 141)
    GROUP BY cs.id, cs.class_code, c.subject_name
    ORDER BY cs.id
""")).fetchall()

for r in result:
    print(f'{r[0]:3d} | {r[1]:20s} | {r[2]:40s} | {r[3]:2d} enrolled | {r[4]:2d} evals | {r[5]:5.1f}%')

db.close()
