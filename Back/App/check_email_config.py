"""
Email Configuration Diagnostic Tool
Run this to check if your email settings are properly configured
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

def check_email_config():
    """Check email configuration and display status"""
    
    print("\n" + "="*60)
    print("📧 EMAIL CONFIGURATION DIAGNOSTIC")
    print("="*60 + "\n")
    
    # Check EMAIL_ENABLED flag
    email_enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
    print(f"1. EMAIL_ENABLED: {email_enabled}")
    if not email_enabled:
        print("   ❌ CRITICAL: Email is disabled!")
        print("   ✅ FIX: Set EMAIL_ENABLED=true in your .env or Railway environment")
    else:
        print("   ✅ Email is enabled")
    
    print()
    
    # Check SMTP Configuration
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL")
    smtp_from_name = os.getenv("SMTP_FROM_NAME", "LPU Course Feedback System")
    
    print("2. SMTP Configuration:")
    print(f"   SMTP_SERVER: {smtp_server or '❌ NOT SET'}")
    print(f"   SMTP_PORT: {smtp_port}")
    print(f"   SMTP_USERNAME: {smtp_username or '❌ NOT SET'}")
    print(f"   SMTP_PASSWORD: {'✅ SET' if smtp_password else '❌ NOT SET'}")
    print(f"   SMTP_FROM_EMAIL: {smtp_from_email or smtp_username or '❌ NOT SET'}")
    print(f"   SMTP_FROM_NAME: {smtp_from_name}")
    
    print()
    
    # Overall status
    all_required = all([email_enabled, smtp_server, smtp_username, smtp_password])
    
    print("="*60)
    if all_required:
        print("✅ EMAIL CONFIGURATION COMPLETE")
        print("   All required settings are present.")
    else:
        print("❌ EMAIL CONFIGURATION INCOMPLETE")
        print()
        print("Missing settings:")
        if not email_enabled:
            print("   - EMAIL_ENABLED=true")
        if not smtp_server:
            print("   - SMTP_SERVER")
        if not smtp_username:
            print("   - SMTP_USERNAME")
        if not smtp_password:
            print("   - SMTP_PASSWORD")
    print("="*60 + "\n")
    
    # Instructions
    if not all_required:
        print("\n📝 INSTRUCTIONS:")
        print()
        print("For LOCAL development:")
        print("  1. Copy Back/.env.example to Back/.env")
        print("  2. Edit Back/.env and set:")
        print("     EMAIL_ENABLED=true")
        print("     SMTP_SERVER=smtp.gmail.com")
        print("     SMTP_PORT=587")
        print("     SMTP_USERNAME=your-email@gmail.com")
        print("     SMTP_PASSWORD=your-app-password")
        print("     SMTP_FROM_EMAIL=your-email@gmail.com")
        print()
        print("For RAILWAY deployment:")
        print("  1. Go to your Railway project")
        print("  2. Click 'Variables' tab")
        print("  3. Add these variables:")
        print("     EMAIL_ENABLED = true")
        print("     SMTP_SERVER = smtp.gmail.com")
        print("     SMTP_PORT = 587")
        print("     SMTP_USERNAME = joseirinco0418@gmail.com")
        print("     SMTP_PASSWORD = xDhN_7<Jka6{YwAj{8Y2.z*Uc")
        print("     SMTP_FROM_EMAIL = joseirinco0418@gmail.com")
        print("  4. Railway will auto-redeploy")
        print()
        print("For Gmail App Password:")
        print("  1. Enable 2-Factor Authentication on your Google account")
        print("  2. Go to: https://myaccount.google.com/apppasswords")
        print("  3. Generate new App Password")
        print("  4. Use that password (not your regular Gmail password)")
        print()

if __name__ == "__main__":
    try:
        # Try to load .env file if it exists
        try:
            from dotenv import load_dotenv
            env_path = Path(__file__).parent.parent / '.env'
            if env_path.exists():
                load_dotenv(env_path)
                print(f"✅ Loaded .env from: {env_path}\n")
            else:
                print(f"⚠️ No .env file found at: {env_path}")
                print("   Using Railway/system environment variables\n")
        except ImportError:
            print("⚠️ python-dotenv not installed, reading from system environment only\n")
        
        check_email_config()
        
    except Exception as e:
        print(f"❌ Error checking email config: {e}")
        import traceback
        traceback.print_exc()
