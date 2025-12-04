"""
Scan Supabase Database Schema
Retrieves actual table structures, columns, indexes, and constraints
"""

import sys
from sqlalchemy import create_engine, text, inspect
from config import settings

def scan_database_schema():
    """Scan and display complete database schema"""
    
    print("\n" + "="*80)
    print("🔍 SCANNING SUPABASE DATABASE SCHEMA")
    print("="*80 + "\n")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    # Get all tables
    tables = inspector.get_table_names()
    print(f"📊 Found {len(tables)} tables:\n")
    
    for table_name in sorted(tables):
        print(f"\n{'='*80}")
        print(f"📋 TABLE: {table_name}")
        print(f"{'='*80}")
        
        # Get columns
        columns = inspector.get_columns(table_name)
        print(f"\n🔹 COLUMNS ({len(columns)}):")
        for col in columns:
            nullable = "NULL" if col['nullable'] else "NOT NULL"
            default = f", DEFAULT: {col['default']}" if col['default'] else ""
            print(f"  - {col['name']:<30} {str(col['type']):<20} {nullable}{default}")
        
        # Get primary keys
        pk = inspector.get_pk_constraint(table_name)
        if pk and pk['constrained_columns']:
            print(f"\n🔑 PRIMARY KEY: {', '.join(pk['constrained_columns'])}")
        
        # Get foreign keys
        fks = inspector.get_foreign_keys(table_name)
        if fks:
            print(f"\n🔗 FOREIGN KEYS ({len(fks)}):")
            for fk in fks:
                print(f"  - {fk['name']}: {', '.join(fk['constrained_columns'])} → {fk['referred_table']}.{', '.join(fk['referred_columns'])}")
        
        # Get indexes
        indexes = inspector.get_indexes(table_name)
        if indexes:
            print(f"\n📑 INDEXES ({len(indexes)}):")
            for idx in indexes:
                unique = "UNIQUE" if idx['unique'] else ""
                print(f"  - {idx['name']}: {', '.join(idx['column_names'])} {unique}")
        
        # Get unique constraints
        unique_constraints = inspector.get_unique_constraints(table_name)
        if unique_constraints:
            print(f"\n🔒 UNIQUE CONSTRAINTS ({len(unique_constraints)}):")
            for uc in unique_constraints:
                print(f"  - {uc['name']}: {', '.join(uc['column_names'])}")
        
        # Get check constraints
        try:
            check_constraints = inspector.get_check_constraints(table_name)
            if check_constraints:
                print(f"\n✅ CHECK CONSTRAINTS ({len(check_constraints)}):")
                for cc in check_constraints:
                    print(f"  - {cc['name']}: {cc['sqltext']}")
        except:
            pass  # Not all databases support check constraints inspection
        
        # Get row count
        with engine.connect() as conn:
            try:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = result.scalar()
                print(f"\n📊 ROW COUNT: {count:,}")
            except Exception as e:
                print(f"\n⚠️ Could not get row count: {e}")
    
    print("\n" + "="*80)
    print("✅ SCHEMA SCAN COMPLETE")
    print("="*80 + "\n")
    
    # Additional diagnostic queries
    print("\n" + "="*80)
    print("🔍 DIAGNOSTIC QUERIES")
    print("="*80 + "\n")
    
    with engine.connect() as conn:
        # Check for common issues
        
        # 1. Check evaluations table structure
        print("\n1️⃣ EVALUATIONS TABLE STRUCTURE CHECK:")
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'evaluations'
            ORDER BY ordinal_position
        """))
        for row in result:
            print(f"  {row[0]:<30} {row[1]:<20} {'NULL' if row[2] == 'YES' else 'NOT NULL':<10} {row[3] or ''}")
        
        # 2. Check evaluation_periods table structure
        print("\n2️⃣ EVALUATION_PERIODS TABLE STRUCTURE CHECK:")
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'evaluation_periods'
            ORDER BY ordinal_position
        """))
        for row in result:
            print(f"  {row[0]:<30} {row[1]:<20} {'NULL' if row[2] == 'YES' else 'NOT NULL':<10} {row[3] or ''}")
        
        # 3. Check class_sections table for instructor_id
        print("\n3️⃣ CLASS_SECTIONS TABLE STRUCTURE CHECK:")
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'class_sections'
            ORDER BY ordinal_position
        """))
        for row in result:
            print(f"  {row[0]:<30} {row[1]:<20} {'NULL' if row[2] == 'YES' else 'NOT NULL':<10} {row[3] or ''}")
        
        # 4. Check if instructors table exists
        print("\n4️⃣ CHECKING IF INSTRUCTORS TABLE EXISTS:")
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'instructors'
            )
        """))
        exists = result.scalar()
        print(f"  Instructors table exists: {'YES ✅' if exists else 'NO ❌'}")
        
        # 5. Check all indexes
        print("\n5️⃣ ALL INDEXES IN DATABASE:")
        result = conn.execute(text("""
            SELECT 
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        """))
        current_table = None
        for row in result:
            if row[0] != current_table:
                current_table = row[0]
                print(f"\n  📋 {current_table}:")
            print(f"    - {row[1]}")
        
        # 6. Check for missing foreign keys
        print("\n6️⃣ CHECKING FOR MISSING FOREIGN KEYS:")
        
        # Check evaluations → evaluation_periods
        result = conn.execute(text("""
            SELECT 
                EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints tc
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_name = 'evaluations'
                    AND tc.constraint_name LIKE '%evaluation_period%'
                ) as has_fk,
                EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'evaluations'
                    AND column_name = 'evaluation_period_id'
                ) as has_column
        """))
        result_row = result.fetchone()
        print(f"  evaluations.evaluation_period_id column: {'EXISTS ✅' if result_row[1] else 'MISSING ❌'}")
        print(f"  evaluations → evaluation_periods FK: {'EXISTS ✅' if result_row[0] else 'MISSING ❌'}")
        
        # 7. Sample data counts
        print("\n7️⃣ DATA DISTRIBUTION:")
        tables_to_count = ['users', 'students', 'evaluations', 'evaluation_periods', 
                          'enrollments', 'class_sections', 'courses', 'programs']
        for table in tables_to_count:
            try:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"  {table:<25} {count:>6,} rows")
            except:
                print(f"  {table:<25} TABLE NOT FOUND")
    
    print("\n" + "="*80)
    print("✅ DIAGNOSTIC QUERIES COMPLETE")
    print("="*80 + "\n")

if __name__ == "__main__":
    try:
        scan_database_schema()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
