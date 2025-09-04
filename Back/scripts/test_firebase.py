"""
Firebase Test Script
Tests Firebase setup and authentication
Run this to verify Firebase is working correctly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.firebase_config import FirebaseAuth

def test_firebase():
    """Test Firebase authentication setup"""
    print("🔥 Testing Firebase setup...")
    
    # Test creating a user
    test_email = "test@lpubatangas.edu.ph"
    test_password = "testpassword123"
    test_name = "Test User"
    
    print(f"📝 Creating test user: {test_email}")
    user = FirebaseAuth.create_user(
        email=test_email,
        password=test_password,
        display_name=test_name
    )
    
    if user:
        print(f"✅ Firebase is working! Created user with UID: {user.uid}")
        print(f"   - Email: {user.email}")
        print(f"   - Display Name: {user.display_name}")
        print(f"   - Email Verified: {user.email_verified}")
        
        # Test getting user by email
        print(f"\n🔍 Testing user retrieval...")
        retrieved_user = FirebaseAuth.get_user_by_email(test_email)
        if retrieved_user and retrieved_user.uid == user.uid:
            print(f"✅ User retrieval successful!")
        else:
            print(f"❌ User retrieval failed")
        
        # Clean up test user
        print(f"\n🧹 Cleaning up test user...")
        FirebaseAuth.delete_user(user.uid)
        print("✅ Test user deleted successfully")
        
        print(f"\n🎉 Firebase setup is complete and working!")
        return True
    else:
        print("❌ Firebase setup failed - user creation returned None")
        return False

def test_environment_variables():
    """Test if environment variables are set"""
    print("\n🔧 Testing environment variables...")
    
    required_vars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_CLIENT_ID'
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if not value or value.startswith('your-'):
            missing_vars.append(var)
        else:
            print(f"✅ {var}: Set")
    
    if missing_vars:
        print(f"\n❌ Missing or incomplete environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print(f"\n💡 Please update your .env file with actual Firebase values")
        return False
    else:
        print(f"\n✅ All environment variables are set!")
        return True

if __name__ == "__main__":
    print("=" * 50)
    print("🔥 FIREBASE SETUP TEST")
    print("=" * 50)
    
    # Test environment variables first
    env_ok = test_environment_variables()
    
    if env_ok:
        # Test Firebase functionality
        firebase_ok = test_firebase()
        
        if firebase_ok:
            print("\n" + "=" * 50)
            print("🎉 ALL TESTS PASSED!")
            print("🚀 Firebase is ready for your application!")
            print("=" * 50)
        else:
            print("\n" + "=" * 50)
            print("❌ FIREBASE TESTS FAILED!")
            print("📝 Check your Firebase project configuration")
            print("=" * 50)
    else:
        print("\n" + "=" * 50)
        print("❌ ENVIRONMENT SETUP INCOMPLETE!")
        print("📝 Please complete the .env file setup first")
        print("=" * 50)
