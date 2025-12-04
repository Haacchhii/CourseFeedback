"""
Check Password Reset Tokens
Shows all active password reset tokens in the database
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from database.connection import get_db
from sqlalchemy import text
from datetime import datetime

print("="*70)
print("PASSWORD RESET TOKENS - DATABASE CHECK")
print("="*70)
print()

db = next(get_db())

try:
    # Get all password reset tokens
    query = text("""
        SELECT 
            prt.id,
            prt.user_id,
            u.email,
            u.first_name,
            u.last_name,
            prt.token,
            prt.expires_at,
            prt.used,
            prt.created_at,
            CASE 
                WHEN prt.expires_at < CURRENT_TIMESTAMP THEN 'EXPIRED'
                WHEN prt.used = TRUE THEN 'USED'
                ELSE 'ACTIVE'
            END as status
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        ORDER BY prt.created_at DESC
        LIMIT 20
    """)
    
    result = db.execute(query)
    tokens = result.fetchall()
    
    if not tokens:
        print("❌ No password reset tokens found in database")
        print()
        print("This means no one has requested a password reset yet.")
        print()
        print("To create a reset token:")
        print("1. Go to http://localhost:5173/forgot")
        print("2. Enter an LPU email address")
        print("3. Click 'Request Password Reset'")
        print("4. Check backend terminal for the reset link")
        print()
    else:
        print(f"✅ Found {len(tokens)} password reset token(s)")
        print()
        
        for i, token in enumerate(tokens, 1):
            print(f"{'='*70}")
            print(f"Token #{i}")
            print(f"{'='*70}")
            print(f"   Status: {token.status}")
            print(f"   Email: {token.email}")
            print(f"   Name: {token.first_name} {token.last_name}")
            print(f"   User ID: {token.user_id}")
            print(f"   Token (first 20 chars): {token.token[:20]}...")
            print(f"   Created: {token.created_at}")
            print(f"   Expires: {token.expires_at}")
            print(f"   Used: {'Yes' if token.used else 'No'}")
            print()
            
            if token.status == 'ACTIVE':
                reset_link = f"http://localhost:5173/reset-password?token={token.token}"
                print(f"   ✅ ACTIVE RESET LINK:")
                print(f"   {reset_link}")
                print()
        
        # Summary
        active_count = sum(1 for t in tokens if t.status == 'ACTIVE')
        expired_count = sum(1 for t in tokens if t.status == 'EXPIRED')
        used_count = sum(1 for t in tokens if t.status == 'USED')
        
        print(f"{'='*70}")
        print("SUMMARY")
        print(f"{'='*70}")
        print(f"   Active: {active_count}")
        print(f"   Expired: {expired_count}")
        print(f"   Used: {used_count}")
        print(f"   Total: {len(tokens)}")
        print()
        
except Exception as e:
    print(f"❌ Error checking tokens: {str(e)}")
    import traceback
    traceback.print_exc()

print("="*70)
print()
print("TROUBLESHOOTING:")
print()
print("If you see 'Invalid or expired reset token' error:")
print()
print("1. Check if token status above is 'ACTIVE'")
print("2. Make sure you're using the full URL from the email")
print("3. Tokens expire after 1 hour - request a new one if expired")
print("4. Don't use the same token twice (they get marked as 'USED')")
print("5. Copy the full token from backend terminal if email didn't arrive")
print()
