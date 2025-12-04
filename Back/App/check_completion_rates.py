from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
db = engine.connect()

r = db.execute(text("""
SELECT 
    cs.class_code, 
    c.subject_code, 
    COUNT(DISTINCT en.student_id) as enrolled, 
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed,
    ROUND((COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END)::numeric / 
           NULLIF(COUNT(DISTINCT en.student_id), 0) * 100), 1) as rate
FROM class_sections cs
INNER JOIN courses c ON cs.course_id = c.id
LEFT JOIN enrollments en ON cs.id = en.class_section_id AND en.status = 'active'
LEFT JOIN evaluations e ON cs.id = e.class_section_id AND en.student_id = e.student_id
GROUP BY cs.id, cs.class_code, c.subject_code
HAVING COUNT(DISTINCT en.student_id) > 0
LIMIT 5
""")).fetchall()

print('Completion Rates:')
for row in r:
    rate = row[4] if row[4] else 0
    print(f'  {row[1]} ({row[0]}): {row[3]}/{row[2]} = {rate}%')
