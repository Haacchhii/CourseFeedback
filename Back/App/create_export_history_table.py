"""
Create export_history table in database
Run this script to add the export_history table
"""

from database.connection import engine
from sqlalchemy import text

def create_export_history_table():
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS export_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        export_type VARCHAR(50) NOT NULL,
        format VARCHAR(10) NOT NULL,
        filters JSONB,
        file_size INTEGER,
        record_count INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_export_history_type ON export_history(export_type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_export_history_created ON export_history(created_at DESC);
    """
    
    with engine.begin() as conn:
        conn.execute(text(create_table_sql))
        print("✅ export_history table created successfully!")

if __name__ == "__main__":
    create_export_history_table()
