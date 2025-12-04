"""
Focused SMTP Email Test
Tests Gmail SMTP specifically to diagnose why it's not working
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

print("="*70)
print("GMAIL SMTP DIAGNOSTIC TEST")
print("="*70)
print()

# Configuration from .env
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "joseirineo0418@gmail.com"
SMTP_PASSWORD = "uzgslgndwfddyqhl"  # App password
FROM_EMAIL = "joseirineo0418@gmail.com"
FROM_NAME = "LPU Course Feedback System"

print("📋 Configuration:")
print(f"   Server: {SMTP_SERVER}:{SMTP_PORT}")
print(f"   Username: {SMTP_USERNAME}")
print(f"   Password: {'*' * len(SMTP_PASSWORD)}")
print(f"   From: {FROM_NAME} <{FROM_EMAIL}>")
print()

# Get recipient email
to_email = input("Enter LPU email to test (e.g., iturraldejose@lpubatangas.edu.ph): ").strip()
if not to_email:
    to_email = "iturraldejose@lpubatangas.edu.ph"

print(f"\n📧 Sending test email to: {to_email}")
print()

# Create message
subject = "🧪 SMTP Test - LPU Course Feedback System"
html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .success {{ color: #28a745; font-weight: bold; font-size: 24px; text-align: center; }}
        .info-box {{ background: #d1ecf1; padding: 15px; border-left: 4px solid #0c5460; 
                    margin: 20px 0; border-radius: 5px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 SMTP Test Email</h1>
        </div>
        <div class="content">
            <p class="success">✅ Gmail SMTP Working!</p>
            
            <p>This email was sent via <strong>Gmail SMTP</strong> from the LPU Course Feedback System.</p>
            
            <div class="info-box">
                <strong>📋 Connection Details:</strong><br>
                <ul>
                    <li>Server: smtp.gmail.com:587</li>
                    <li>Method: STARTTLS</li>
                    <li>From: joseirineo0418@gmail.com</li>
                    <li>To: {to_email}</li>
                </ul>
            </div>
            
            <p>If you received this email at your LPU address, the SMTP configuration is working correctly!</p>
            
            <p><strong>This confirms:</strong></p>
            <ul>
                <li>✅ Gmail App Password is valid</li>
                <li>✅ SMTP connection successful</li>
                <li>✅ LPU email server accepting Gmail SMTP</li>
                <li>✅ Password reset emails should work</li>
            </ul>
        </div>
    </div>
</body>
</html>
"""

text_body = f"""
SMTP TEST EMAIL - LPU Course Feedback System

✅ Gmail SMTP Working!

This email was sent via Gmail SMTP from the LPU Course Feedback System.

Connection Details:
- Server: smtp.gmail.com:587
- Method: STARTTLS
- From: joseirineo0418@gmail.com
- To: {to_email}

If you received this email at your LPU address, the SMTP configuration is working correctly!
"""

try:
    print("🔄 Step 1: Creating email message...")
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    message["To"] = to_email
    
    # Add text and HTML parts
    part1 = MIMEText(text_body, "plain")
    part2 = MIMEText(html_body, "html")
    message.attach(part1)
    message.attach(part2)
    print("   ✅ Message created")
    
    print("\n🔄 Step 2: Creating SSL context...")
    context = ssl.create_default_context()
    print("   ✅ SSL context created")
    
    print("\n🔄 Step 3: Connecting to SMTP server...")
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30)
    print("   ✅ Connected to smtp.gmail.com:587")
    
    print("\n🔄 Step 4: Starting TLS encryption...")
    server.starttls(context=context)
    print("   ✅ TLS started")
    
    print("\n🔄 Step 5: Logging in with app password...")
    server.login(SMTP_USERNAME, SMTP_PASSWORD)
    print("   ✅ Login successful")
    
    print("\n🔄 Step 6: Sending email...")
    server.sendmail(FROM_EMAIL, [to_email], message.as_string())
    print("   ✅ Email sent")
    
    print("\n🔄 Step 7: Closing connection...")
    server.quit()
    print("   ✅ Connection closed")
    
    print("\n" + "="*70)
    print("✅ SUCCESS! EMAIL SENT VIA GMAIL SMTP")
    print("="*70)
    print()
    print(f"📬 Check your inbox at: {to_email}")
    print("   (Don't forget to check spam folder)")
    print()
    print("🎉 Gmail SMTP is working correctly!")
    print("   Password reset emails should work now.")
    print()
    
except smtplib.SMTPAuthenticationError as e:
    print("\n" + "="*70)
    print("❌ AUTHENTICATION ERROR")
    print("="*70)
    print(f"\nError: {str(e)}")
    print("\nPossible causes:")
    print("1. App password is incorrect")
    print("2. App password has been revoked")
    print("3. 2-Step Verification disabled in Google account")
    print("\nSolution:")
    print("1. Go to: https://myaccount.google.com/apppasswords")
    print("2. Generate a new app password")
    print("3. Update SMTP_PASSWORD in .env file")
    
except smtplib.SMTPConnectError as e:
    print("\n" + "="*70)
    print("❌ CONNECTION ERROR")
    print("="*70)
    print(f"\nError: {str(e)}")
    print("\nPossible causes:")
    print("1. Firewall blocking SMTP port 587")
    print("2. Network connectivity issue")
    print("3. smtp.gmail.com unreachable")
    print("\nSolution:")
    print("1. Check internet connection")
    print("2. Check firewall settings")
    print("3. Try on different network")
    
except smtplib.SMTPException as e:
    print("\n" + "="*70)
    print("❌ SMTP ERROR")
    print("="*70)
    print(f"\nError: {str(e)}")
    print(f"Type: {type(e).__name__}")
    
except Exception as e:
    print("\n" + "="*70)
    print("❌ UNEXPECTED ERROR")
    print("="*70)
    print(f"\nError: {str(e)}")
    print(f"Type: {type(e).__name__}")
    import traceback
    print("\nFull traceback:")
    traceback.print_exc()

print()
