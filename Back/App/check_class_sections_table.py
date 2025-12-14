"""
Check if class_sections table exists and its structure
"""
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from database.connection import engine

def check_table():
    with Session(engine) as db:
        # Check if table exists
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print("\n" + "="*80)
        print("Database Tables Check")
        print("="*80)
        
        if 'class_sections' in tables:
            print(" class_sections table: EXISTS")
            
            # Get columns
            columns = inspector.get_columns('class_sections')
            print("\nColumns:")
            for col in columns:
                print(f"  - {col['name']}: {col['type']} (nullable: {col['nullable']})")
            
            # Try to count rows
            try:
                count = db.execute(text("SELECT COUNT(*) FROM class_sections")).scalar()
                print(f"\nTotal rows in class_sections: {count}")
            except Exception as e:
                print(f"\nError counting rows: {e}")
        else:
            print(" class_sections table: DOES NOT EXIST")
            print("\n Available tables:")
            for table in sorted(tables):
                print(f"  - {table}")
        
        print("="*80)

if __name__ == "__main__":
    check_table()
