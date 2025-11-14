from database.connection import get_db
from models.enhanced_models import ClassSection, Course, Program

db = next(get_db())

class_sections = db.query(ClassSection).count()
courses = db.query(Course).count()
programs = db.query(Program).count()

print(f"Total ClassSections: {class_sections}")
print(f"Total Courses: {courses}")
print(f"Total Programs: {programs}")

# Get class sections with joins
from sqlalchemy import func
results = db.query(ClassSection, Course, Program).join(
    Course, ClassSection.course_id == Course.id
).outerjoin(
    Program, Course.program_id == Program.id
).all()

print(f"\nClass sections with course data: {len(results)}")

# Show programs
all_programs = db.query(Program).all()
print(f"\nPrograms in database:")
for p in all_programs:
    print(f"  - {p.program_code}: {p.program_name}")

db.close()
