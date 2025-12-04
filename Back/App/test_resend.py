"""
Test Resend Email Configuration
Quick verification script for Resend API setup
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

try:
    import resend
    print("✅ Resend package installed")
except ImportError:
    print("❌ Resend package not installed. Run: pip install resend")
    sys.exit(1)

from config import settings

print("\n" + "="*60)
print("RESEND EMAIL CONFIGURATION TEST")
print("="*60 + "\n")

# Check Resend configuration
print("📋 Resend Configuration:")
print(f"   API Key: {'✅ Set' if settings.RESEND_API_KEY else '❌ Missing'}")
if settings.RESEND_API_KEY:
    key_preview = settings.RESEND_API_KEY[:10] + "..." + settings.RESEND_API_KEY[-5:]
    print(f"   Key Preview: {key_preview}")
print(f"   From Email: {settings.RESEND_FROM_EMAIL}")
print(f"   From Name: {settings.RESEND_FROM_NAME}")

# Check SMTP backup configuration
print(f"\n📋 SMTP Backup Configuration:")
print(f"   Server: {settings.SMTP_SERVER}:{settings.SMTP_PORT}")
print(f"   Username: {'✅ Set' if settings.SMTP_USERNAME else '❌ Missing'}")
print(f"   Password: {'✅ Set' if settings.SMTP_PASSWORD else '❌ Missing'}")
print(f"   From Email: {settings.SMTP_FROM_EMAIL}")

# Test email service
print("\n" + "="*60)
print("TESTING EMAIL SERVICE")
print("="*60 + "\n")

from services.email_service import email_service

if not email_service.enabled:
    print("❌ Email service not configured!")
    print("   Please configure either Resend or SMTP in .env file")
    sys.exit(1)

print(f"📧 Email service status:")
print(f"   Resend enabled: {'✅ Yes' if email_service.resend_enabled else '❌ No'}")
print(f"   SMTP enabled: {'✅ Yes' if email_service.smtp_enabled else '❌ No'}")

# Prompt for test email
print("\n" + "-"*60)
test_email = input("Enter email address to send test (or press Enter to skip): ").strip()

if not test_email:
    print("⏭️  Skipping email test")
    print("\n✅ Configuration check complete!")
    sys.exit(0)

print(f"\n📧 Sending test email to: {test_email}")
print("   Please wait...\n")

# Send test email
subject = "🧪 Test Email from LPU Course Feedback System"
html_body = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: #d1ecf1; padding: 15px; border-left: 4px solid #0c5460; 
                    margin: 20px 0; border-radius: 5px; }
        .success { color: #28a745; font-weight: bold; font-size: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Email</h1>
        </div>
        <div class="content">
            <p class="success">✅ Email Service Working!</p>
            
            <p>This is a test email from the <strong>LPU Course Feedback System</strong>.</p>
            
            <div class="info-box">
                <strong>📋 Email Service Details:</strong><br>
                <ul>
                    <li>Resend API: {resend_status}</li>
                    <li>SMTP Backup: {smtp_status}</li>
                    <li>Primary Method: {primary_method}</li>
                </ul>
            </div>
            
            <p>If you received this email, your email configuration is working correctly! 🎉</p>
            
            <p><small>Sent at: {timestamp}</small></p>
        </div>
    </div>
</body>
</html>
""".format(
    resend_status="Enabled ✅" if email_service.resend_enabled else "Disabled ❌",
    smtp_status="Enabled ✅" if email_service.smtp_enabled else "Disabled ❌",
    primary_method="Resend API" if email_service.resend_enabled else "SMTP",
    timestamp=str(Path(__file__).stat().st_mtime)
)

text_body = """
TEST EMAIL - LPU Course Feedback System

✅ Email Service Working!

This is a test email to verify your email configuration.

Email Service Details:
- Resend API: {resend_status}
- SMTP Backup: {smtp_status}
- Primary Method: {primary_method}

If you received this email, your configuration is working correctly!
""".format(
    resend_status="Enabled ✅" if email_service.resend_enabled else "Disabled ❌",
    smtp_status="Enabled ✅" if email_service.smtp_enabled else "Disabled ❌",
    primary_method="Resend API" if email_service.resend_enabled else "SMTP"
)

success = email_service.send_email(
    to_emails=[test_email],
    subject=subject,
    html_body=html_body,
    text_body=text_body
)

print()
if success:
    print("="*60)
    print("✅ TEST EMAIL SENT SUCCESSFULLY!")
    print("="*60)
    print(f"\n📬 Check your inbox at: {test_email}")
    print("   (Don't forget to check spam folder)")
    
    if email_service.resend_enabled:
        print("\n💡 Tip: Check Resend dashboard for delivery status:")
        print("   https://resend.com/emails")
else:
    print("="*60)
    print("❌ TEST EMAIL FAILED")
    print("="*60)
    print("\n🔍 Troubleshooting:")
    print("   1. Check .env file for correct API key/credentials")
    print("   2. Verify Resend API key is valid (starts with 're_')")
    print("   3. Check backend logs above for specific error messages")
    print("   4. Try restarting the backend server")
    print("\n📖 See RESEND_SETUP_GUIDE.md for detailed setup instructions")

print()
