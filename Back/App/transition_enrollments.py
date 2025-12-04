"""
Standalone Script: Transition Enrollments to New Semester
Run this when starting a new evaluation period to copy enrollments from previous period
"""

import sys
import argparse
from database.connection import get_db
from sqlalchemy import text
from services.student_advancement import StudentAdvancementService

def main():
    parser = argparse.ArgumentParser(
        description="Transition enrollments from one evaluation period to another"
    )
    parser.add_argument(
        '--from-period',
        type=int,
        required=True,
        help='Source evaluation period ID'
    )
    parser.add_argument(
        '--to-period',
        type=int,
        required=True,
        help='Target evaluation period ID'
    )
    parser.add_argument(
        '--advance-year',
        action='store_true',
        help='Advance students to next year level (for new academic year transitions)'
    )
    parser.add_argument(
        '--execute',
        action='store_true',
        help='Execute transition (default is dry-run preview only)'
    )
    
    args = parser.parse_args()
    
    # Get database connection
    db = next(get_db())
    
    try:
        # Show period details
        print("=" * 80)
        print("ENROLLMENT TRANSITION")
        print("=" * 80)
        
        from_period = db.execute(text("""
            SELECT id, name, semester, academic_year, status
            FROM evaluation_periods
            WHERE id = :period_id
        """), {"period_id": args.from_period}).fetchone()
        
        to_period = db.execute(text("""
            SELECT id, name, semester, academic_year, status
            FROM evaluation_periods
            WHERE id = :period_id
        """), {"period_id": args.to_period}).fetchone()
        
        if not from_period:
            print(f"❌ Error: Source period {args.from_period} not found")
            sys.exit(1)
        
        if not to_period:
            print(f"❌ Error: Target period {args.to_period} not found")
            sys.exit(1)
        
        print(f"\nFrom Period: {from_period[1]}")
        print(f"  Semester: {from_period[2]}")
        print(f"  Academic Year: {from_period[3]}")
        print(f"  Status: {from_period[4]}")
        
        print(f"\nTo Period: {to_period[1]}")
        print(f"  Semester: {to_period[2]}")
        print(f"  Academic Year: {to_period[3]}")
        print(f"  Status: {to_period[4]}")
        
        print(f"\nAdvance Year Level: {'YES' if args.advance_year else 'NO'}")
        print(f"Mode: {'EXECUTE' if args.execute else 'DRY RUN (Preview)'}")
        
        if args.execute:
            print("\n⚠️  WARNING: This will create enrollments and potentially advance students!")
            print("   Press Ctrl+C now to cancel, or Enter to continue...")
            input()
        
        # Run transition
        print("\n" + "=" * 80)
        print("EXECUTING TRANSITION")
        print("=" * 80)
        
        service = StudentAdvancementService()
        result = service.create_next_period_enrollments(
            db=db,
            from_period_id=args.from_period,
            to_period_id=args.to_period,
            auto_advance_year=args.advance_year,
            dry_run=not args.execute
        )
        
        if result["success"]:
            print(f"\n✅ {result['message']}")
            print(f"\nSummary:")
            print(f"  Students affected: {result.get('students_affected', 0)}")
            print(f"  Enrollments created: {result.get('enrollments_created', 0)}")
            print(f"  Students advanced: {result.get('students_advanced', 0)}")
            print(f"  New academic year: {result.get('is_new_academic_year', False)}")
            
            if not args.execute:
                print("\n💡 This was a DRY RUN - no changes were made")
                print("   To execute for real, add --execute flag")
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
