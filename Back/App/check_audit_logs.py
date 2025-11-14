from database.connection import get_db
from sqlalchemy import text

db = next(get_db())
result = db.execute(text('SELECT id, user_id, action, category, status, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10'))

print("\n=== Recent Audit Logs ===")
for row in result:
    print(f"ID: {row[0]}, User ID: {row[1]}, Action: {row[2]}, Category: {row[3]}, Status: {row[4]}, Date: {row[5]}")

# Count total
total = db.execute(text('SELECT COUNT(*) FROM audit_logs')).scalar()
print(f"\nTotal audit logs: {total}")
