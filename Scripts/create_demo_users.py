"""
Quick Demo Data Generator for Presentation
Creates realistic test users without needing real LPU accounts
"""

import csv
from datetime import datetime

# Program mappings
PROGRAMS = {
    'BSIT': 'Bachelor of Science in Information Technology',
    'BSCS-DS': 'Bachelor of Science in Computer Science - Data Science',
    'BAPSY': 'Bachelor of Arts in Psychology',
    'BSPSY': 'Bachelor of Science in Psychology',
    'ABCOMM': 'Bachelor of Arts in Communication',
    'BMA': 'Bachelor of Multimedia Arts',
    'BS-CYBER': 'Bachelor of Science in Cybersecurity'
}

def generate_demo_users():
    """Generate demo users for all roles"""
    
    users = []
    
    # System Admins (2)
    users.append({
        'role': 'system_admin',
        'email': 'admin1@demo.lpu.edu.ph',
        'password': 'lpub@admin1',
        'first_name': 'Maria',
        'last_name': 'Santos',
        'department': 'IT Administration'
    })
    users.append({
        'role': 'system_admin',
        'email': 'admin2@demo.lpu.edu.ph',
        'password': 'lpub@admin2',
        'first_name': 'Juan',
        'last_name': 'Cruz',
        'department': 'IT Administration'
    })
    
    # Department Heads (7 programs)
    dept_heads = [
        ('BSIT', 'Roberto', 'Garcia'),
        ('BSCS-DS', 'Patricia', 'Reyes'),
        ('BAPSY', 'Carlos', 'Mendoza'),
        ('BSPSY', 'Ana', 'Torres'),
        ('ABCOMM', 'Miguel', 'Flores'),
        ('BMA', 'Sofia', 'Ramos'),
        ('BS-CYBER', 'Diego', 'Castillo')
    ]
    
    for idx, (program, first, last) in enumerate(dept_heads, 1):
        users.append({
            'role': 'department_head',
            'email': f'depthead{idx}@demo.lpu.edu.ph',
            'password': f'lpub@dept{idx}',
            'first_name': first,
            'last_name': last,
            'program': program,
            'department': PROGRAMS[program]
        })
    
    # Secretaries (7 programs)
    secretaries = [
        ('BSIT', 'Elena', 'Navarro'),
        ('BSCS-DS', 'Carmen', 'Diaz'),
        ('BAPSY', 'Rosa', 'Martinez'),
        ('BSPSY', 'Isabel', 'Lopez'),
        ('ABCOMM', 'Teresa', 'Gonzalez'),
        ('BMA', 'Lucia', 'Rodriguez'),
        ('BS-CYBER', 'Angela', 'Fernandez')
    ]
    
    for idx, (program, first, last) in enumerate(secretaries, 1):
        users.append({
            'role': 'secretary',
            'email': f'secretary{idx}@demo.lpu.edu.ph',
            'password': f'lpub@sec{idx}',
            'first_name': first,
            'last_name': last,
            'program': program,
            'department': PROGRAMS[program]
        })
    
    # Students (30 per program = 210 total)
    first_names = ['John', 'Jane', 'Mark', 'Mary', 'Peter', 'Sarah', 'Michael', 'Linda', 'James', 'Emma',
                   'Robert', 'Lisa', 'David', 'Nancy', 'William', 'Karen', 'Richard', 'Betty', 'Joseph', 'Helen',
                   'Thomas', 'Sandra', 'Charles', 'Donna', 'Daniel', 'Carol', 'Paul', 'Ruth', 'George', 'Sharon']
    
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson']
    
    student_id_counter = 1
    for program_code in PROGRAMS.keys():
        for i in range(30):
            year_level = (i % 4) + 1  # Distribute across years 1-4
            student_number = f"2021{student_id_counter:04d}"  # Format: 20210001, 20210002, etc.
            
            users.append({
                'role': 'student',
                'email': f'student{student_id_counter}@demo.lpu.edu.ph',
                'password': f'lpub@{student_number}',
                'first_name': first_names[i % len(first_names)],
                'last_name': last_names[i % len(last_names)],
                'student_number': student_number,
                'program': program_code,
                'year_level': year_level
            })
            student_id_counter += 1
    
    return users

def save_to_csv(users, filename='demo_users_all.csv'):
    """Save users to CSV file"""
    
    if not users:
        print("No users to save")
        return
    
    # Get all unique keys from all users
    fieldnames = ['role', 'email', 'password', 'first_name', 'last_name', 
                  'student_number', 'program', 'year_level', 'department']
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(users)
    
    print(f"✅ Created {filename} with {len(users)} users")

def save_by_role(users):
    """Save separate CSV files for each role"""
    
    roles = {}
    for user in users:
        role = user['role']
        if role not in roles:
            roles[role] = []
        roles[role].append(user)
    
    for role, role_users in roles.items():
        filename = f"demo_users_{role}.csv"
        save_to_csv(role_users, filename)

def print_summary(users):
    """Print summary of generated users"""
    
    from collections import Counter
    role_counts = Counter(u['role'] for u in users)
    
    print("\n" + "="*60)
    print("DEMO USERS GENERATED FOR PRESENTATION")
    print("="*60)
    print(f"\nTotal Users: {len(users)}")
    print("\nBreakdown by Role:")
    for role, count in role_counts.items():
        print(f"  • {role.replace('_', ' ').title()}: {count}")
    
    print("\n" + "-"*60)
    print("SAMPLE CREDENTIALS FOR TESTING:")
    print("-"*60)
    print("\nSystem Admin:")
    print("  Email: admin1@demo.lpu.edu.ph")
    print("  Password: lpub@admin1")
    
    print("\nDepartment Head (BSIT):")
    print("  Email: depthead1@demo.lpu.edu.ph")
    print("  Password: lpub@dept1")
    
    print("\nSecretary (BSIT):")
    print("  Email: secretary1@demo.lpu.edu.ph")
    print("  Password: lpub@sec1")
    
    print("\nStudent:")
    print("  Email: student1@demo.lpu.edu.ph")
    print("  Password: lpub@20210001")
    
    print("\n" + "="*60)
    print("NOTE: All emails use @demo.lpu.edu.ph domain")
    print("      This won't send real emails - perfect for demos!")
    print("="*60)

if __name__ == "__main__":
    print("Generating demo users...")
    users = generate_demo_users()
    
    # Save all users to single CSV
    save_to_csv(users, 'demo_users_all.csv')
    
    # Save separate CSVs by role
    save_by_role(users)
    
    # Print summary
    print_summary(users)
    
    print("\n✅ DONE! Ready to import into your system.")
    print("\nNext steps:")
    print("1. Use the CSV import feature in your admin panel")
    print("2. Import demo_users_all.csv OR individual role files")
    print("3. Login with any of the sample credentials above")
    print("4. Present with confidence! 🎉")
