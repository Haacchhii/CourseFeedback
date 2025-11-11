"""
Create Test Users for All Roles
Generates bcrypt password hashes and inserts users into database
"""

import bcrypt
import sys
from database.connection import engine
from sqlalchemy import text

def hash_password(password: str) -> str:
    """Generate bcrypt hash for password"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_test_users():
    """Create comprehensive test users for all roles"""
    
    print("=" * 70)
    print("CREATING TEST USERS")
    print("=" * 70)
    
    users_to_create = [
        # Admin Users
        {
            'email': 'admin@lpubatangas.edu.ph',
            'password': 'admin123',
            'first_name': 'System',
            'last_name': 'Administrator',
            'role': 'admin',
            'department': 'IT Administration'
        },
        
        # Secretary Users
        {
            'email': 'secretary1@lpubatangas.edu.ph',
            'password': 'secretary123',
            'first_name': 'Maria',
            'last_name': 'Santos',
            'role': 'secretary',
            'department': 'Academic Affairs'
        },
        {
            'email': 'secretary2@lpubatangas.edu.ph',
            'password': 'secretary123',
            'first_name': 'Ana',
            'last_name': 'Cruz',
            'role': 'secretary',
            'department': 'Student Affairs'
        },
        
        # Department Head Users
        {
            'email': 'depthead1@lpubatangas.edu.ph',
            'password': 'depthead123',
            'first_name': 'Dr. Robert',
            'last_name': 'Johnson',
            'role': 'department_head',
            'department': 'Computer Science'
        },
        {
            'email': 'depthead2@lpubatangas.edu.ph',
            'password': 'depthead123',
            'first_name': 'Dr. Lisa',
            'last_name': 'Chen',
            'role': 'department_head',
            'department': 'Psychology'
        },
        
        # Instructor Users
        {
            'email': 'instructor1@lpubatangas.edu.ph',
            'password': 'instructor123',
            'first_name': 'Prof. John',
            'last_name': 'Reyes',
            'role': 'instructor',
            'department': 'Computer Science'
        },
        {
            'email': 'instructor2@lpubatangas.edu.ph',
            'password': 'instructor123',
            'first_name': 'Prof. Sarah',
            'last_name': 'Garcia',
            'role': 'instructor',
            'department': 'Computer Science'
        },
        {
            'email': 'instructor3@lpubatangas.edu.ph',
            'password': 'instructor123',
            'first_name': 'Prof. Michael',
            'last_name': 'Tan',
            'role': 'instructor',
            'department': 'Information Technology'
        },
        {
            'email': 'instructor4@lpubatangas.edu.ph',
            'password': 'instructor123',
            'first_name': 'Prof. Emma',
            'last_name': 'Villanueva',
            'role': 'instructor',
            'department': 'Psychology'
        },
        {
            'email': 'instructor5@lpubatangas.edu.ph',
            'password': 'instructor123',
            'first_name': 'Prof. David',
            'last_name': 'Ramos',
            'role': 'instructor',
            'department': 'Multimedia Arts'
        },
        
        # Student Users
        {
            'email': 'student1@lpubatangas.edu.ph',
            'password': 'student123',
            'first_name': 'Juan',
            'last_name': 'Dela Cruz',
            'role': 'student',
            'department': None,
            'student_number': '2021-00001',
            'program_code': 'BSIT',
            'year_level': 2
        },
        {
            'email': 'student2@lpubatangas.edu.ph',
            'password': 'student123',
            'first_name': 'Maria',
            'last_name': 'Reyes',
            'role': 'student',
            'department': None,
            'student_number': '2021-00002',
            'program_code': 'BSIT',
            'year_level': 2
        },
        {
            'email': 'student3@lpubatangas.edu.ph',
            'password': 'student123',
            'first_name': 'Pedro',
            'last_name': 'Santos',
            'role': 'student',
            'department': None,
            'student_number': '2022-00003',
            'program_code': 'BSCS-DS',
            'year_level': 1
        },
        {
            'email': 'student4@lpubatangas.edu.ph',
            'password': 'student123',
            'first_name': 'Ana',
            'last_name': 'Garcia',
            'role': 'student',
            'department': None,
            'student_number': '2022-00004',
            'program_code': 'BSCS-DS',
            'year_level': 1
        },
        {
            'email': 'student5@lpubatangas.edu.ph',
            'password': 'student123',
            'first_name': 'Carlos',
            'last_name': 'Mendoza',
            'role': 'student',
            'department': None,
            'student_number': '2020-00005',
            'program_code': 'BS-CYBER',
            'year_level': 3
        },
        {
            'email': 'student6@lpubatangas.edu.ph',
            'password': 'student123',
            'first_name': 'Sofia',
            'last_name': 'Torres',
            'role': 'student',
            'department': None,
            'student_number': '2020-00006',
            'program_code': 'BSPSY',
            'year_level': 3
        },
        {
            'email': 'student7@lpubatangas.edu.ph',
            'password': 'student123',
            'first_name': 'Miguel',
            'last_name': 'Cruz',
            'role': 'student',
            'department': None,
            'student_number': '2021-00007',
            'program_code': 'BMA',
            'year_level': 2
        },
        {
            'email': 'student8@lpubatangas.edu.ph',
            'password': 'student123',
            'first_name': 'Isabella',
            'last_name': 'Ramos',
            'role': 'student',
            'department': None,
            'student_number': '2022-00008',
            'program_code': 'ABCOMM',
            'year_level': 1
        },
        {
            'email': 'student9@lpubatangas.edu.ph',
            'password': 'student123',
            'first_name': 'Diego',
            'last_name': 'Fernandez',
            'role': 'student',
            'department': None,
            'student_number': '2021-00009',
            'program_code': 'BAPSY',
            'year_level': 2
        },
        {
            'email': 'student10@lpubatangas.edu.ph',
            'password': 'student123',
            'first_name': 'Valentina',
            'last_name': 'Lopez',
            'role': 'student',
            'department': None,
            'student_number': '2020-00010',
            'program_code': 'BSIT',
            'year_level': 4
        },
    ]
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            print("\n📝 Creating users...")
            
            # Create users and track IDs
            user_ids = {}
            
            for user_data in users_to_create:
                # Hash password
                password_hash = hash_password(user_data['password'])
                
                # Insert user
                result = conn.execute(text("""
                    INSERT INTO users (email, password_hash, first_name, last_name, role, department, is_active)
                    VALUES (:email, :password_hash, :first_name, :last_name, :role, :department, TRUE)
                    RETURNING id
                """), {
                    'email': user_data['email'],
                    'password_hash': password_hash,
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'role': user_data['role'],
                    'department': user_data.get('department')
                })
                
                user_id = result.scalar()
                user_ids[user_data['email']] = user_id
                
                print(f"  ✓ Created {user_data['role']}: {user_data['email']} (ID: {user_id})")
                
                # Create role-specific records
                if user_data['role'] == 'student':
                    # Get program ID
                    program_result = conn.execute(text("""
                        SELECT id FROM programs WHERE program_code = :code
                    """), {'code': user_data['program_code']})
                    program_id = program_result.scalar()
                    
                    # Insert student record
                    conn.execute(text("""
                        INSERT INTO students (user_id, student_number, program_id, year_level, is_active)
                        VALUES (:user_id, :student_number, :program_id, :year_level, TRUE)
                    """), {
                        'user_id': user_id,
                        'student_number': user_data['student_number'],
                        'program_id': program_id,
                        'year_level': user_data['year_level']
                    })
                    print(f"    → Student record: {user_data['student_number']} - {user_data['program_code']} Year {user_data['year_level']}")
                
                elif user_data['role'] == 'instructor':
                    # Insert instructor record
                    full_name = f"{user_data['first_name']} {user_data['last_name']}"
                    conn.execute(text("""
                        INSERT INTO instructors (user_id, name, department)
                        VALUES (:user_id, :name, :department)
                    """), {
                        'user_id': user_id,
                        'name': full_name,
                        'department': user_data['department']
                    })
                    print(f"    → Instructor record: {user_data['department']}")
                
                elif user_data['role'] == 'department_head':
                    # Insert department head record
                    conn.execute(text("""
                        INSERT INTO department_heads (user_id, first_name, last_name, department, programs)
                        VALUES (:user_id, :first_name, :last_name, :department, :programs)
                    """), {
                        'user_id': user_id,
                        'first_name': user_data['first_name'],
                        'last_name': user_data['last_name'],
                        'department': user_data['department'],
                        'programs': None  # Will be set later through admin UI
                    })
                    print(f"    → Department Head record: {user_data['department']}")
                
                elif user_data['role'] == 'secretary':
                    # Insert secretary record
                    full_name = f"{user_data['first_name']} {user_data['last_name']}"
                    conn.execute(text("""
                        INSERT INTO secretaries (user_id, name, department, programs)
                        VALUES (:user_id, :name, :department, :programs)
                    """), {
                        'user_id': user_id,
                        'name': full_name,
                        'department': user_data['department'],
                        'programs': None  # Will be set later through admin UI
                    })
                    print(f"    → Secretary record: {user_data['department']}")
            
            # Commit transaction
            trans.commit()
            
            print("\n" + "=" * 70)
            print("✅ ALL USERS CREATED SUCCESSFULLY")
            print("=" * 70)
            
            # Show summary
            print("\n📊 SUMMARY:")
            summary = conn.execute(text("""
                SELECT role, COUNT(*) as count
                FROM users
                GROUP BY role
                ORDER BY role
            """)).fetchall()
            
            for row in summary:
                print(f"  {row.role}: {row.count}")
            
            print("\n🔐 TEST CREDENTIALS:")
            print("-" * 70)
            print("Admin:          admin@lpubatangas.edu.ph / admin123")
            print("Secretary:      secretary1@lpubatangas.edu.ph / secretary123")
            print("Dept Head:      depthead1@lpubatangas.edu.ph / depthead123")
            print("Instructor:     instructor1@lpubatangas.edu.ph / instructor123")
            print("Student:        student1@lpubatangas.edu.ph / student123")
            print("-" * 70)
            
            return True
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    try:
        success = create_test_users()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
