"""
Reset All Password Reset Tokens
Clears the password_reset_tokens table so you can test again
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from database.connection import get_db
from sqlalchemy import text

print("="*70)
print("CLEAR PASSWORD RESET TOKENS")
print("="*70)
print()

response = input("⚠️  This will DELETE all password reset tokens. Continue? (yes/no): ")

if response.lower() != 'yes':
    print("❌ Cancelled")
    sys.exit(0)

db = next(get_db())

try:
    # Count existing tokens
    count_query = text("SELECT COUNT(*) FROM password_reset_tokens")
    count = db.execute(count_query).scalar()
    
    print(f"\n📊 Found {count} token(s) in database")
    
    # Delete all tokens
    delete_query = text("DELETE FROM password_reset_tokens")
    db.execute(delete_query)
    db.commit()
    
    print("✅ All password reset tokens have been deleted")
    print()
    print("Now you can test password reset from scratch:")
    print("1. Go to http://localhost:5173/forgot")
    print("2. Enter your email")
    print("3. Request password reset")
    print("4. Check backend terminal for reset link")
    print("5. Use the link to reset your password")
    print()
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    db.rollback()
    import traceback
    traceback.print_exc()

print("="*70)
