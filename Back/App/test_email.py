"""
Quick test script to verify email configuration
Run this to test if SMTP is working correctly
"""

from services.email_service import email_service, send_password_reset_email

print("=" * 60)
print("EMAIL CONFIGURATION TEST")
print("=" * 60)

# Check if email service is enabled
print(f"\n📧 Email Service Enabled: {email_service.enabled}")
print(f"📬 SMTP Server: {email_service.smtp_server}")
print(f"📫 SMTP Port: {email_service.smtp_port}")
print(f"👤 SMTP Username: {email_service.smtp_username}")
print(f"📨 From Email: {email_service.smtp_from_email}")
print(f"📝 From Name: {email_service.smtp_from_name}")
print(f"🔑 Password Set: {'Yes' if email_service.smtp_password else 'No'}")
print(f"🔑 Password Length: {len(email_service.smtp_password) if email_service.smtp_password else 0}")

if email_service.enabled:
    print("\n" + "=" * 60)
    print("✅ Email service is properly configured!")
    print("=" * 60)
    
    # Test sending a simple email
    test_email = input("\n📧 Enter test email address (or press Enter to skip): ").strip()
    
    if test_email:
        print(f"\n📤 Sending test email to {test_email}...")
        
        success = email_service.send_email(
            to_emails=[test_email],
            subject="✅ Test Email - LPU Course Feedback System",
            html_body="""
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #667eea;">✅ Email Configuration Successful!</h2>
                <p>If you're reading this, your SMTP configuration is working correctly.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    LPU Batangas Course Feedback System<br>
                    This is an automated test message.
                </p>
            </body>
            </html>
            """,
            text_body="Email Configuration Test - If you're reading this, your SMTP is working!"
        )
        
        if success:
            print("✅ Test email sent successfully!")
        else:
            print("❌ Failed to send test email. Check the error above.")
    else:
        print("\n⏭️ Skipping email test.")
        
else:
    print("\n" + "=" * 60)
    print("❌ Email service is NOT configured!")
    print("=" * 60)
    print("\n⚠️ Issues detected:")
    if not email_service.smtp_username:
        print("  - SMTP_USERNAME is missing")
    if not email_service.smtp_password:
        print("  - SMTP_PASSWORD is missing")
    if not email_service.smtp_server:
        print("  - SMTP_SERVER is missing")
    
    print("\n💡 Check your .env file and make sure all SMTP settings are configured.")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
