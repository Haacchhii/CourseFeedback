"""
Add first_login column to users table
"""
from database.connection import engine
from sqlalchemy import text

conn = engine.connect()

try:
    # Add column
    conn.execute(text("""
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT TRUE
    """))
    
    # Set existing admins to FALSE
    conn.execute(text("""
        UPDATE users 
        SET first_login = FALSE 
        WHERE role = 'admin'
    """))
    
    conn.commit()
    print('✅ first_login column added successfully')
    print('✅ Existing admin users set to first_login=FALSE')
    
    # Verify
    result = conn.execute(text("""
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'first_login'
    """))
    
    row = result.fetchone()
    if row:
        print(f'✅ Column verified: {row[0]} ({row[1]}, default: {row[2]})')
    
except Exception as e:
    conn.rollback()
    print(f'❌ Error: {e}')
finally:
    conn.close()
