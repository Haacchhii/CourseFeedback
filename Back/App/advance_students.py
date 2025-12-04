"""
Standalone Script: Advance Students Year Level
Run this at the end of academic year (after 3rd semester) to advance all students
"""

import sys
import argparse
from database.connection import get_db
from services.student_advancement import run_year_end_advancement

def main():
    parser = argparse.ArgumentParser(
        description="Advance students to next year level at end of academic year"
    )
    parser.add_argument(
        '--execute',
        action='store_true',
        help='Execute advancement (default is dry-run preview only)'
    )
    parser.add_argument(
        '--program-id',
        type=int,
        help='Only advance students in specific program'
    )
    parser.add_argument(
        '--year-level',
        type=int,
        choices=[1, 2, 3],
        help='Only advance students in specific year level'
    )
    
    args = parser.parse_args()
    
    # Get database connection
    db = next(get_db())
    
    try:
        if args.execute:
            print("⚠️  WARNING: This will make REAL changes to student year levels!")
            print("   Press Ctrl+C now to cancel, or Enter to continue...")
            input()
        
        # Run advancement
        result = run_year_end_advancement(
            db=db,
            dry_run=not args.execute
        )
        
        if result["success"]:
            print("\n✅ Operation completed successfully")
            if not args.execute:
                print("\n💡 This was a DRY RUN - no changes were made")
                print("   To execute for real, run: python advance_students.py --execute")
        else:
            print(f"\n❌ Operation failed: {result.get('error', 'Unknown error')}")
            sys.exit(1)
        
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
