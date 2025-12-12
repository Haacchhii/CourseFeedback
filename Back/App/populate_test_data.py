"""
Populate System with Test Data
Creates students and evaluations for testing
"""
import random
import string
from datetime import datetime, timedelta
from database.connection import get_db
from sqlalchemy import text
import bcrypt

# Filipino names for realistic data
FIRST_NAMES = [
    "Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Miguel", "Carmen",
    "Antonio", "Lucia", "Carlos", "Elena", "Rafael", "Sofia", "Gabriel",
    "Isabella", "Fernando", "Daniela", "Ricardo", "Valentina", "Marco",
    "Andrea", "Diego", "Camila", "Luis", "Paula", "Andres", "Nicole",
    "Jorge", "Patricia", "Emmanuel", "Jasmine", "Christian", "Angela"
]

LAST_NAMES = [
    "Santos", "Reyes", "Cruz", "Garcia", "Torres", "Flores", "Rivera",
    "Gonzales", "Ramos", "Bautista", "Villanueva", "Fernandez", "Castro",
    "Mendoza", "Lopez", "Martinez", "Hernandez", "Dela Cruz", "Aquino",
    "Pascual", "Salazar", "Domingo", "Morales", "Navarro", "Ortega"
]

# Sample comments for evaluations (positive, neutral, negative)
POSITIVE_COMMENTS = [
    "Excellent course! The instructor explains concepts very clearly.",
    "Very engaging lectures. I learned a lot from this course.",
    "The course materials are well-organized and helpful.",
    "Great teaching methods. Makes complex topics easy to understand.",
    "Highly recommend this course. Very practical and applicable.",
    "The instructor is very knowledgeable and approachable.",
    "Best course I've taken this semester. Very informative.",
    "Clear explanations and good examples throughout the course.",
    "The assignments really helped reinforce the concepts learned.",
    "Excellent presentation skills and course structure."
]

NEUTRAL_COMMENTS = [
    "The course is okay. Some topics could be explained better.",
    "Average course. Met my expectations but nothing exceptional.",
    "Decent content but the pace was a bit fast.",
    "Good course overall, though some materials were outdated.",
    "The course covers the basics well.",
    "Satisfactory learning experience.",
    "Course content is adequate for the subject matter.",
    "Some lectures were interesting, others less so."
]

NEGATIVE_COMMENTS = [
    "The pace was too fast. Needed more time for difficult topics.",
    "Course materials need updating.",
    "More practical examples would be helpful.",
    "The course could benefit from more interactive sessions."
]

SUGGESTIONS = [
    "More hands-on exercises would be beneficial.",
    "Consider adding more real-world case studies.",
    "Would appreciate more feedback on assignments.",
    "Group projects could enhance learning.",
    "More visual aids in presentations would help.",
    "Consider providing additional reading materials.",
    "Office hours could be more flexible.",
    "Online resources could supplement the lectures.",
    "",  # Some with no suggestions
    "",
    ""
]

def generate_student_number():
    """Generate a student number like 2024XXXXX"""
    year = random.choice(["2021", "2022", "2023", "2024"])
    number = ''.join(random.choices(string.digits, k=5))
    return f"{year}{number}"

def generate_email(first_name, last_name):
    """Generate an email address"""
    return f"{first_name.lower()}.{last_name.lower().replace(' ', '')}@lpubatangas.edu.ph"

def hash_password(password):
    """Hash a password"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_students(db, num_students=20):
    """Create student users and student records"""
    print(f"\n📚 Creating {num_students} students...")
    
    # Get programs
    programs = db.execute(text("SELECT id, program_code FROM programs")).fetchall()
    if not programs:
        print("❌ No programs found! Creating default program...")
        db.execute(text("""
            INSERT INTO programs (program_code, program_name, department_id)
            VALUES ('BSCS-DS', 'BS Computer Science - Data Science', 1)
            ON CONFLICT (program_code) DO NOTHING
        """))
        db.commit()
        programs = db.execute(text("SELECT id, program_code FROM programs")).fetchall()
    
    created_students = []
    default_password = hash_password("student123")
    
    for i in range(num_students):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        student_number = generate_student_number()
        email = generate_email(first_name, last_name) + str(random.randint(1, 999))
        program = random.choice(programs)
        year_level = random.randint(1, 4)
        
        try:
            # Create user
            result = db.execute(text("""
                INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, school_id)
                VALUES (:email, :password, :first_name, :last_name, 'student', true, :school_id)
                RETURNING id
            """), {
                "email": email,
                "password": default_password,
                "first_name": first_name,
                "last_name": last_name,
                "school_id": student_number
            })
            user_id = result.fetchone()[0]
            
            # Create student record
            result = db.execute(text("""
                INSERT INTO students (user_id, student_number, program_id, year_level, is_active)
                VALUES (:user_id, :student_number, :program_id, :year_level, true)
                RETURNING id
            """), {
                "user_id": user_id,
                "student_number": student_number,
                "program_id": program.id,
                "year_level": year_level
            })
            student_id = result.fetchone()[0]
            
            created_students.append({
                "student_id": student_id,
                "user_id": user_id,
                "name": f"{first_name} {last_name}",
                "program_id": program.id
            })
            print(f"  ✅ Created: {first_name} {last_name} ({student_number}) - {program.program_code} Year {year_level}")
            
        except Exception as e:
            print(f"  ⚠️ Skipped duplicate: {email}")
            continue
    
    db.commit()
    print(f"✅ Created {len(created_students)} students")
    return created_students

def create_enrollments(db, students):
    """Enroll students in class sections"""
    print(f"\n📝 Creating enrollments...")
    
    # Get class sections
    sections = db.execute(text("""
        SELECT cs.id, cs.course_id, c.subject_code, c.program_id
        FROM class_sections cs
        JOIN courses c ON cs.course_id = c.id
        WHERE cs.id IS NOT NULL
        LIMIT 50
    """)).fetchall()
    
    if not sections:
        print("❌ No class sections found! Creating some...")
        # Get courses
        courses = db.execute(text("SELECT id, program_id FROM courses LIMIT 10")).fetchall()
        if courses:
            for course in courses:
                db.execute(text("""
                    INSERT INTO class_sections (course_id, class_code, semester, academic_year, max_students)
                    VALUES (:course_id, :class_code, '1st', '2025-2026', 40)
                """), {
                    "course_id": course.id,
                    "class_code": f"SEC-{course.id}-A"
                })
            db.commit()
            sections = db.execute(text("""
                SELECT cs.id, cs.course_id, c.subject_code, c.program_id
                FROM class_sections cs
                JOIN courses c ON cs.course_id = c.id
                LIMIT 50
            """)).fetchall()
    
    enrollments_created = 0
    
    # Get active evaluation period
    period = db.execute(text("""
        SELECT id FROM evaluation_periods WHERE status = 'active' LIMIT 1
    """)).fetchone()
    
    if not period:
        print("❌ No active evaluation period found!")
        return sections
    
    eval_period_id = period.id
    print(f"  Using evaluation period ID: {eval_period_id}")
    
    for student in students:
        # Enroll each student in 3-6 courses
        num_courses = random.randint(3, 6)
        student_sections = random.sample(list(sections), min(num_courses, len(sections)))
        
        for section in student_sections:
            try:
                db.execute(text("""
                    INSERT INTO enrollments (student_id, class_section_id, enrolled_at, status, evaluation_period_id)
                    VALUES (:student_id, :section_id, :date, 'active', :eval_period_id)
                    ON CONFLICT DO NOTHING
                """), {
                    "student_id": student["student_id"],
                    "section_id": section.id,
                    "date": datetime.now(),
                    "eval_period_id": eval_period_id
                })
                enrollments_created += 1
            except Exception as e:
                print(f"  ⚠️ Enrollment error: {e}")
                pass
    
    db.commit()
    print(f"✅ Created {enrollments_created} enrollments")
    return sections

def create_evaluations(db, students, num_evaluations=30):
    """Create completed evaluations"""
    print(f"\n📊 Creating {num_evaluations} evaluations...")
    
    # Get active evaluation period
    period = db.execute(text("""
        SELECT id FROM evaluation_periods WHERE status = 'active' LIMIT 1
    """)).fetchone()
    
    if not period:
        print("⚠️ No active evaluation period. Creating one...")
        result = db.execute(text("""
            INSERT INTO evaluation_periods (name, semester, academic_year, start_date, end_date, status)
            VALUES ('Test Period', '1st', '2025-2026', :start, :end, 'active')
            RETURNING id
        """), {
            "start": datetime.now() - timedelta(days=30),
            "end": datetime.now() + timedelta(days=30)
        })
        period_id = result.fetchone()[0]
        db.commit()
    else:
        period_id = period.id
    
    # Get enrollments
    enrollments = db.execute(text("""
        SELECT e.student_id, e.class_section_id, u.id as user_id
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN users u ON s.user_id = u.id
        ORDER BY RANDOM()
        LIMIT :limit
    """), {"limit": num_evaluations * 2}).fetchall()
    
    if not enrollments:
        print("❌ No enrollments found!")
        return
    
    evaluations_created = 0
    
    for enrollment in enrollments[:num_evaluations]:
        # Generate realistic ratings (mostly positive, some neutral, few negative)
        sentiment_type = random.choices(
            ['positive', 'neutral', 'negative'],
            weights=[0.6, 0.3, 0.1]
        )[0]
        
        if sentiment_type == 'positive':
            base_rating = random.uniform(4.0, 5.0)
            comment = random.choice(POSITIVE_COMMENTS)
            sentiment = 'positive'
            sentiment_score = random.uniform(0.7, 0.95)
        elif sentiment_type == 'neutral':
            base_rating = random.uniform(3.0, 4.0)
            comment = random.choice(NEUTRAL_COMMENTS)
            sentiment = 'neutral'
            sentiment_score = random.uniform(0.4, 0.6)
        else:
            base_rating = random.uniform(2.0, 3.5)
            comment = random.choice(NEGATIVE_COMMENTS)
            sentiment = 'negative'
            sentiment_score = random.uniform(0.1, 0.4)
        
        # Generate individual ratings with slight variation
        rating_teaching = min(5.0, max(1.0, base_rating + random.uniform(-0.5, 0.5)))
        rating_content = min(5.0, max(1.0, base_rating + random.uniform(-0.5, 0.5)))
        rating_engagement = min(5.0, max(1.0, base_rating + random.uniform(-0.5, 0.5)))
        rating_overall = (rating_teaching + rating_content + rating_engagement) / 3
        
        suggestion = random.choice(SUGGESTIONS)
        
        # Random submission date within last 30 days
        days_ago = random.randint(0, 30)
        submission_date = datetime.now() - timedelta(days=days_ago)
        
        try:
            db.execute(text("""
                INSERT INTO evaluations (
                    student_id, class_section_id, evaluation_period_id,
                    rating_teaching, rating_content, rating_engagement, rating_overall,
                    text_feedback, suggestions, sentiment, sentiment_score, sentiment_confidence,
                    is_anomaly, anomaly_score, submission_date, status, processing_status
                ) VALUES (
                    :student_id, :section_id, :period_id,
                    :rating_teaching, :rating_content, :rating_engagement, :rating_overall,
                    :feedback, :suggestions, :sentiment, :sentiment_score, :confidence,
                    :is_anomaly, :anomaly_score, :submission_date, 'submitted', 'completed'
                )
            """), {
                "student_id": enrollment.student_id,
                "section_id": enrollment.class_section_id,
                "period_id": period_id,
                "rating_teaching": round(rating_teaching, 2),
                "rating_content": round(rating_content, 2),
                "rating_engagement": round(rating_engagement, 2),
                "rating_overall": round(rating_overall, 2),
                "feedback": comment,
                "suggestions": suggestion,
                "sentiment": sentiment,
                "sentiment_score": round(sentiment_score, 3),
                "confidence": round(random.uniform(0.8, 0.98), 3),
                "is_anomaly": random.random() < 0.05,  # 5% chance of anomaly
                "anomaly_score": round(random.uniform(0, 0.3), 3),
                "submission_date": submission_date
            })
            evaluations_created += 1
            
        except Exception as e:
            # Likely duplicate - skip
            continue
    
    db.commit()
    print(f"✅ Created {evaluations_created} evaluations")

def show_summary(db):
    """Show database summary"""
    print("\n" + "="*60)
    print("📊 DATABASE SUMMARY")
    print("="*60)
    
    counts = [
        ("Users", "SELECT COUNT(*) FROM users"),
        ("Students", "SELECT COUNT(*) FROM students"),
        ("Programs", "SELECT COUNT(*) FROM programs"),
        ("Courses", "SELECT COUNT(*) FROM courses"),
        ("Class Sections", "SELECT COUNT(*) FROM class_sections"),
        ("Enrollments", "SELECT COUNT(*) FROM enrollments"),
        ("Evaluations", "SELECT COUNT(*) FROM evaluations"),
        ("Evaluation Periods", "SELECT COUNT(*) FROM evaluation_periods"),
    ]
    
    for name, query in counts:
        try:
            count = db.execute(text(query)).scalar()
            print(f"  {name}: {count}")
        except:
            print(f"  {name}: Error")
    
    # Evaluation breakdown
    print("\n📈 Evaluation Sentiment Breakdown:")
    try:
        sentiments = db.execute(text("""
            SELECT sentiment, COUNT(*) as count 
            FROM evaluations 
            WHERE sentiment IS NOT NULL
            GROUP BY sentiment
        """)).fetchall()
        for s in sentiments:
            print(f"  - {s.sentiment}: {s.count}")
    except:
        pass
    
    print("\n" + "="*60)

def main():
    print("🚀 POPULATING SYSTEM WITH TEST DATA")
    print("="*60)
    
    db = next(get_db())
    
    try:
        # Create students
        students = create_students(db, num_students=25)
        
        if students:
            # Create enrollments
            create_enrollments(db, students)
            
            # Create evaluations
            create_evaluations(db, students, num_evaluations=30)
        
        # Show summary
        show_summary(db)
        
        print("\n✅ Test data population complete!")
        print("📝 Default student password: student123")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
