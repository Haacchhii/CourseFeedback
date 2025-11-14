"""
Assign all programs to all staff users (secretary, dept_head, instructor)
"""
from database.connection import SessionLocal
from models.enhanced_models import Secretary, DepartmentHead, Instructor, Program

def assign_programs_to_staff():
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("ASSIGNING PROGRAMS TO STAFF USERS")
        print("="*60 + "\n")
        
        # Get all program IDs
        all_programs = db.query(Program).all()
        program_ids = [p.id for p in all_programs]
        
        print(f"📚 Found {len(all_programs)} programs:")
        for prog in all_programs:
            print(f"  - ID {prog.id}: {prog.program_code} - {prog.program_name}")
        print()
        
        # Assign to all secretaries
        secretaries = db.query(Secretary).all()
        print(f"📋 Updating {len(secretaries)} secretaries...")
        for sec in secretaries:
            sec.programs = program_ids
            print(f"  ✓ Secretary ID {sec.user_id}: Assigned {len(program_ids)} programs")
        
        # Assign to all department heads
        dept_heads = db.query(DepartmentHead).all()
        print(f"\n📋 Updating {len(dept_heads)} department heads...")
        for dh in dept_heads:
            dh.programs = program_ids
            print(f"  ✓ Dept Head ID {dh.user_id}: Assigned {len(program_ids)} programs")
        
        # Assign to all instructors
        instructors = db.query(Instructor).all()
        print(f"\n📋 Updating {len(instructors)} instructors...")
        for instructor in instructors:
            instructor.programs = program_ids
            print(f"  ✓ Instructor ID {instructor.user_id}: Assigned {len(program_ids)} programs")
        
        db.commit()
        print("\n✅ All staff users now have access to all programs!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    assign_programs_to_staff()
