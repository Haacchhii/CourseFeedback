"""
Create notifications table for in-app notifications
"""
from database.connection import get_db
from sqlalchemy import text

def create_notifications_table():
    db = next(get_db())
    
    try:
        # Create notifications table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                link VARCHAR(500),
                created_at TIMESTAMP NOT NULL,
                CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """))
        
        # Create index for faster queries
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
        """))
        
        db.commit()
        print("✅ Notifications table created successfully")
        
        # Verify table exists
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'notifications'
            ORDER BY ordinal_position
        """))
        
        print("\n📋 Table structure:")
        for row in result:
            nullable = "NULL" if row.is_nullable == "YES" else "NOT NULL"
            print(f"  - {row.column_name}: {row.data_type} ({nullable})")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating notifications table: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    create_notifications_table()
