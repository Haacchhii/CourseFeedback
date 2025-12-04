"""Check database schema issues"""
from database.connection import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("\n" + "="*80)
print("CLASS_SECTIONS TABLE STRUCTURE")
print("="*80)
result = db.execute(text("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name='class_sections' 
    ORDER BY ordinal_position
"""))
for row in result:
    print(f"  {row[0]:30} {row[1]:20} {'NULL' if row[2]=='YES' else 'NOT NULL'}")

print("\n" + "="*80)
print("INSTRUCTORS TABLE CHECK")
print("="*80)
result = db.execute(text("""
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='instructors'
    )
"""))
exists = result.scalar()
print(f"Table exists: {exists}")

if exists:
    result = db.execute(text("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name='instructors' 
        ORDER BY ordinal_position
    """))
    print("\nColumns:")
    for row in result:
        print(f"  {row[0]:30} {row[1]:20} {'NULL' if row[2]=='YES' else 'NOT NULL'}")
    
    count = db.execute(text("SELECT COUNT(*) FROM instructors")).scalar()
    print(f"\nRows: {count}")
else:
    print("❌ INSTRUCTORS TABLE DOES NOT EXIST!")

print("\n" + "="*80)
print("EVALUATION_PERIODS STATUS")
print("="*80)
result = db.execute(text("""
    SELECT id, name, status, start_date, end_date
    FROM evaluation_periods
    ORDER BY created_at DESC
"""))
print("\nAll periods:")
for row in result:
    print(f"  ID {row[0]}: {row[1]} - Status: {row[2]} ({row[3]} to {row[4]})")

db.close()
