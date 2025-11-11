"""Quick script to check database data counts"""
from database.connection import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                (SELECT COUNT(*) FROM users) as users,
                (SELECT COUNT(*) FROM students) as students,
                (SELECT COUNT(*) FROM instructors) as instructors,
                (SELECT COUNT(*) FROM courses) as courses,
                (SELECT COUNT(*) FROM enrollments) as enrollments,
                (SELECT COUNT(*) FROM evaluations) as evaluations
        """))
        
        row = result.fetchone()
        print("\n📊 DATABASE DATA COUNTS:")
        print("=" * 40)
        print(f"Users:       {row[0]}")
        print(f"Students:    {row[1]}")
        print(f"Instructors: {row[2]}")
        print(f"Courses:     {row[3]}")
        print(f"Enrollments: {row[4]}")
        print(f"Evaluations: {row[5]}")
        print("=" * 40)
        
        if row[0] == 0:
            print("\n⚠️  NO USERS FOUND! Run create_test_users.py")
        elif row[3] == 0:
            print("\n⚠️  NO COURSES FOUND! Run setup_sample_data.py")
        elif row[4] == 0:
            print("\n⚠️  NO ENROLLMENTS FOUND! Students not enrolled in courses")
        else:
            print("\n✅ Data looks good!")
            
except Exception as e:
    print(f"❌ Error checking database: {e}")
