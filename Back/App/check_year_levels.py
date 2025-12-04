from database.connection import SessionLocal
from models.enhanced_models import Student
from sqlalchemy import func

db = SessionLocal()

# Check if year_level column exists and has data
print("=" * 50)
print("STUDENT YEAR LEVEL CHECK")
print("=" * 50)

# Sample students
students = db.query(Student.id, Student.student_number, Student.year_level).limit(20).all()
print('\nSample students with year_level:')
for s in students:
    print(f'  ID: {s.id:3d}, Student#: {s.student_number:15s}, Year: {s.year_level}')

# Year level distribution
year_counts = db.query(Student.year_level, func.count(Student.id)).group_by(Student.year_level).all()
print('\n' + "=" * 50)
print('Year level distribution:')
print("=" * 50)
for year, count in year_counts:
    print(f'  Year {year}: {count:3d} students')

# Total students
total = db.query(func.count(Student.id)).scalar()
print(f'\nTotal students: {total}')

db.close()
