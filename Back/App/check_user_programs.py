"""
Check if users have programs assigned
"""
from database.connection import SessionLocal
from models.enhanced_models import Secretary, DepartmentHead, Program, User

def check_user_programs():
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("CHECKING USER PROGRAM ASSIGNMENTS")
        print("="*60 + "\n")
        
        # Check all secretaries
        secretaries = db.query(Secretary).all()
        print(f"📋 Total Secretaries: {len(secretaries)}\n")
        
        for sec in secretaries:
            user = db.query(User).filter(User.id == sec.user_id).first()
            if user:
                print(f"Secretary: {user.first_name} {user.last_name} (ID: {sec.user_id})")
                print(f"  - Programs: {sec.programs}")
                if sec.programs:
                    programs = db.query(Program).filter(Program.id.in_(sec.programs)).all()
                    for prog in programs:
                        print(f"    • {prog.code}: {prog.name}")
                else:
                    print("    ⚠️  NO PROGRAMS ASSIGNED!")
                print()
        
        # Check all department heads
        dept_heads = db.query(DepartmentHead).all()
        print(f"\n📋 Total Department Heads: {len(dept_heads)}\n")
        
        for dh in dept_heads:
            user = db.query(User).filter(User.id == dh.user_id).first()
            if user:
                print(f"Dept Head: {user.first_name} {user.last_name} (ID: {dh.user_id})")
                print(f"  - Programs: {dh.programs}")
                if dh.programs:
                    programs = db.query(Program).filter(Program.id.in_(dh.programs)).all()
                    for prog in programs:
                        print(f"    • {prog.code}: {prog.name}")
                else:
                    print("    ⚠️  NO PROGRAMS ASSIGNED!")
                print()
        
        # Show all available programs
        all_programs = db.query(Program).all()
        print(f"\n📚 Total Programs in Database: {len(all_programs)}\n")
        for prog in all_programs:
            # Check what fields the Program model actually has
            print(f"  {prog.id}. {getattr(prog, 'program_code', prog.name)}: {prog.name}")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_user_programs()
