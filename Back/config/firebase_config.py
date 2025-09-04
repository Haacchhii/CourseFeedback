import firebase_admin
from firebase_admin import credentials, auth
import json
import os

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        # Load service account key
        service_account_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-service-account.json')
        
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
        else:
            # Fallback to environment variables (for production)
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": os.getenv('FIREBASE_PROJECT_ID'),
                "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
                "private_key": os.getenv('FIREBASE_PRIVATE_KEY').replace('\\n', '\n'),
                "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                "client_id": os.getenv('FIREBASE_CLIENT_ID'),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            })
        
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized successfully!")

class FirebaseAuth:
    @staticmethod
    def create_user(email, password, display_name=None):
        """Create a new Firebase user"""
        try:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=display_name,
                email_verified=True  # Auto-verify for testing
            )
            print(f"✅ Created Firebase user: {email}")
            return user
        except Exception as e:
            print(f"❌ Firebase user creation failed for {email}: {e}")
            return None
    
    @staticmethod
    def verify_token(id_token):
        """Verify Firebase ID token"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            print(f"❌ Token verification failed: {e}")
            return None
    
    @staticmethod
    def delete_user(uid):
        """Delete a Firebase user"""
        try:
            auth.delete_user(uid)
            print(f"✅ Deleted Firebase user: {uid}")
        except Exception as e:
            print(f"❌ User deletion failed: {e}")

    @staticmethod
    def get_user_by_email(email):
        """Get Firebase user by email"""
        try:
            user = auth.get_user_by_email(email)
            return user
        except Exception as e:
            print(f"❌ User not found: {email}")
            return None

# Initialize Firebase when module is imported
try:
    initialize_firebase()
except Exception as e:
    print(f"❌ Firebase initialization failed: {e}")
