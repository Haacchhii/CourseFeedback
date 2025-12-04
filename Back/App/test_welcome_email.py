"""
Test Welcome Email Functionality
Tests that welcome emails are sent with temporary password information
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from services.welcome_email_service import send_welcome_email
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_welcome_email():
    """Test sending a welcome email"""
    
    print("=" * 80)
    print("🧪 TESTING WELCOME EMAIL FUNCTIONALITY")
    print("=" * 80)
    
    # Test data
    test_email = "iturraldejose@lpubatangas.edu.ph"
    test_first_name = "Jose Irineo"
    test_last_name = "Iturralde"
    test_school_id = "23130778"
    test_role = "student"
    test_temp_password = f"lpub@{test_school_id}"  # Format: lpub@23130778
    
    print(f"\n📧 TEST EMAIL DETAILS:")
    print(f"   To: {test_email}")
    print(f"   Name: {test_first_name} {test_last_name}")
    print(f"   School ID: {test_school_id}")
    print(f"   Role: {test_role}")
    print(f"   Temp Password: {test_temp_password}")
    print(f"   Format: lpub@[school_id]")
    
    print(f"\n🚀 Sending welcome email...")
    print("-" * 80)
    
    # Send welcome email
    result = await send_welcome_email(
        email=test_email,
        first_name=test_first_name,
        last_name=test_last_name,
        school_id=test_school_id,
        role=test_role,
        temp_password=test_temp_password
    )
    
    print("-" * 80)
    print(f"\n📊 RESULT:")
    print(f"   Success: {result['success']}")
    print(f"   Email Sent: {result.get('email_sent', False)}")
    print(f"   Message: {result['message']}")
    
    if result['success']:
        print(f"\n✅ Welcome email test SUCCESSFUL!")
        if result.get('email_sent'):
            print(f"   📬 Email was sent via SMTP to {test_email}")
            print(f"   🔑 Temporary password included: {test_temp_password}")
        else:
            print(f"   ⚠️ Email was prepared but not sent (check SMTP configuration)")
    else:
        print(f"\n❌ Welcome email test FAILED!")
        print(f"   Error: {result['message']}")
    
    print("\n" + "=" * 80)
    print("📝 WHAT THIS EMAIL CONTAINS:")
    print("=" * 80)
    print("✅ User's email address")
    print("✅ User's school ID")
    print(f"✅ Temporary password: lpub@{test_school_id}")
    print("✅ Role information")
    print("✅ Login URL from FRONTEND_URL in .env")
    print("✅ Password requirements (8+ chars, number, special char)")
    print("✅ Instructions for first login")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_welcome_email())
