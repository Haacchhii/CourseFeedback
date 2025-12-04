"""
Bulk import enrollment list from CSV
Populates the official enrollment registry
"""

from database.connection import get_db
from sqlalchemy import text
import csv
import sys
from datetime import datetime

def import_enrollment_list(csv_file_path: str):
    """
    Import student enrollment list from CSV
    
    CSV Format:
    student_number,first_name,last_name,middle_name,email,program_code,year_level,college_code,college_name
    
    Example:
    2022-00001,Francesca Nicole,Dayaday,,fdayaday@lpulaguna.edu.ph,BSIT,2,CCAS,College of Computer and Applied Sciences
    """
    db = next(get_db())
    
    try:
        # Get program mapping
        programs_result = db.execute(text("""
            SELECT id, program_code, program_name
            FROM programs
        """))
        
        program_map = {row[1]: row[0] for row in programs_result.fetchall()}
        
        print(f"📚 Available Programs: {', '.join(program_map.keys())}")
        print(f"\n📂 Reading CSV: {csv_file_path}")
        
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            imported = 0
            skipped = 0
            errors = []
            
            for row_num, row in enumerate(reader, start=2):
                try:
                    student_number = row['student_number'].strip()
                    first_name = row['first_name'].strip()
                    last_name = row['last_name'].strip()
                    middle_name = row.get('middle_name', '').strip() or None
                    email = row.get('email', '').strip() or None
                    program_code = row['program_code'].strip().upper()
                    year_level = int(row['year_level'])
                    college_code = row['college_code'].strip().upper()
                    college_name = row['college_name'].strip()
                    
                    # Validate program exists
                    if program_code not in program_map:
                        errors.append(f"Row {row_num}: Unknown program '{program_code}' for {first_name} {last_name}")
                        skipped += 1
                        continue
                    
                    program_id = program_map[program_code]
                    
                    # Check if already exists
                    existing = db.execute(text("""
                        SELECT id FROM enrollment_list
                        WHERE student_number = :student_number
                    """), {"student_number": student_number}).fetchone()
                    
                    if existing:
                        # Update existing record
                        db.execute(text("""
                            UPDATE enrollment_list
                            SET first_name = :first_name,
                                last_name = :last_name,
                                middle_name = :middle_name,
                                email = :email,
                                program_id = :program_id,
                                year_level = :year_level,
                                college_code = :college_code,
                                college_name = :college_name,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE student_number = :student_number
                        """), {
                            "student_number": student_number,
                            "first_name": first_name,
                            "last_name": last_name,
                            "middle_name": middle_name,
                            "email": email,
                            "program_id": program_id,
                            "year_level": year_level,
                            "college_code": college_code,
                            "college_name": college_name
                        })
                        print(f"  ↻ Updated: {student_number} - {first_name} {last_name} ({program_code})")
                    else:
                        # Insert new record
                        db.execute(text("""
                            INSERT INTO enrollment_list (
                                student_number, first_name, last_name, middle_name, email,
                                program_id, year_level, college_code, college_name, status
                            ) VALUES (
                                :student_number, :first_name, :last_name, :middle_name, :email,
                                :program_id, :year_level, :college_code, :college_name, 'active'
                            )
                        """), {
                            "student_number": student_number,
                            "first_name": first_name,
                            "last_name": last_name,
                            "middle_name": middle_name,
                            "email": email,
                            "program_id": program_id,
                            "year_level": year_level,
                            "college_code": college_code,
                            "college_name": college_name
                        })
                        print(f"  ✓ Added: {student_number} - {first_name} {last_name} ({program_code})")
                    
                    imported += 1
                    
                except KeyError as e:
                    errors.append(f"Row {row_num}: Missing column {e}")
                    skipped += 1
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    skipped += 1
            
            db.commit()
            
            print("\n" + "="*80)
            print("IMPORT SUMMARY")
            print("="*80)
            print(f"✅ Successfully imported/updated: {imported}")
            print(f"⚠️  Skipped: {skipped}")
            
            if errors:
                print(f"\n❌ Errors:")
                for error in errors[:10]:  # Show first 10 errors
                    print(f"  {error}")
                if len(errors) > 10:
                    print(f"  ... and {len(errors) - 10} more errors")
            
            # Show summary by college
            result = db.execute(text("""
                SELECT college_code, college_name, COUNT(*) as count
                FROM enrollment_list
                WHERE status = 'active'
                GROUP BY college_code, college_name
                ORDER BY college_code
            """))
            
            print("\n📊 Enrollment by College:")
            for row in result.fetchall():
                print(f"  {row[0]} ({row[1]}): {row[2]} students")
            
            # Show summary by program
            result = db.execute(text("""
                SELECT p.program_code, p.program_name, COUNT(*) as count
                FROM enrollment_list e
                JOIN programs p ON e.program_id = p.id
                WHERE e.status = 'active'
                GROUP BY p.program_code, p.program_name
                ORDER BY p.program_code
            """))
            
            print("\n📚 Enrollment by Program:")
            for row in result.fetchall():
                print(f"  {row[0]} - {row[1]}: {row[2]} students")
            
    except FileNotFoundError:
        print(f"❌ File not found: {csv_file_path}")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_enrollment_list.py <csv_file_path>")
        print("\nCSV Format:")
        print("student_number,first_name,last_name,middle_name,email,program_code,year_level,college_code,college_name")
        print("\nExample:")
        print("2022-00001,Francesca Nicole,Dayaday,,fdayaday@lpulaguna.edu.ph,BSIT,2,CCAS,College of Computer and Applied Sciences")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    import_enrollment_list(csv_file)
