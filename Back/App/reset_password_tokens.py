"""
Script to reset password tokens for testing purposes
"""
from database import get_db
from sqlalchemy import text

def reset_all_tokens():
    """Mark all password reset tokens as unused"""
    db = next(get_db())
    try:
        result = db.execute(text('UPDATE password_reset_tokens SET used = FALSE'))
        db.commit()
        print(f"✅ Reset {result.rowcount} password reset tokens to unused status")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

def delete_old_tokens():
    """Delete all expired password reset tokens"""
    db = next(get_db())
    try:
        result = db.execute(text("DELETE FROM password_reset_tokens WHERE expires_at < NOW()"))
        db.commit()
        print(f"✅ Deleted {result.rowcount} expired password reset tokens")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

def list_tokens():
    """List all password reset tokens"""
    db = next(get_db())
    try:
        result = db.execute(text("""
            SELECT prt.token, u.email, prt.expires_at, prt.used, prt.created_at
            FROM password_reset_tokens prt
            JOIN users u ON u.id = prt.user_id
            ORDER BY prt.created_at DESC
            LIMIT 10
        """))
        
        print("\n" + "="*80)
        print("Recent Password Reset Tokens:")
        print("="*80)
        for row in result:
            status = "✓ USED" if row.used else "○ AVAILABLE"
            print(f"\n{status}")
            print(f"Email: {row.email}")
            print(f"Token: {row.token[:30]}...")
            print(f"Created: {row.created_at}")
            print(f"Expires: {row.expires_at}")
        print("="*80 + "\n")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python reset_password_tokens.py list     - List recent tokens")
        print("  python reset_password_tokens.py reset    - Mark all tokens as unused")
        print("  python reset_password_tokens.py delete   - Delete expired tokens")
    else:
        command = sys.argv[1].lower()
        if command == "list":
            list_tokens()
        elif command == "reset":
            reset_all_tokens()
        elif command == "delete":
            delete_old_tokens()
        else:
            print(f"Unknown command: {command}")
