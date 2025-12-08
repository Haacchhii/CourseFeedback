"""
Resend Email Service for Course Feedback System
Uses Resend API for reliable email delivery
"""

from typing import Optional, Dict, Any
import logging
from datetime import datetime
import os
import httpx
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
except Exception:
    pass

logger = logging.getLogger(__name__)

# Email template
WELCOME_EMAIL_HTML = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #7a0000 0%, #a31111 100%); color: white; padding: 30px; text-center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .credential-box {{ background: white; border-left: 4px solid #7a0000; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        .password {{ font-family: 'Courier New', monospace; background: #ffd700; padding: 5px 10px; border-radius: 3px; font-weight: bold; color: #7a0000; }}
        .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
        .btn {{ display: inline-block; background: #7a0000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Welcome to Course Insight Guardian</h1>
            <p>Your LPU Course Feedback Portal</p>
        </div>
        <div class="content">
            <h2>Hello, {first_name}!</h2>
            <p>Welcome to the Course Insight Guardian system at Lyceum of the Philippines University - Batangas. Your account has been created successfully.</p>
            
            <div class="credential-box">
                <h3>📧 Your Login Credentials</h3>
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Student/Employee Number:</strong> {school_id}</p>
                <p><strong>Temporary Password:</strong> <span class="password">{temp_password}</span></p>
                <p><strong>Role:</strong> {role}</p>
            </div>

            <div class="warning">
                <h4>⚠️ Important Security Notice</h4>
                <p>This is a <strong>temporary password</strong>. You will be required to change it upon your first login for security purposes.</p>
                <ul>
                    <li>✅ Must be at least 8 characters</li>
                    <li>✅ Include uppercase and lowercase letters</li>
                    <li>✅ Include at least one number</li>
                    <li>✅ Include at least one special character</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="{login_url}" class="btn">🔐 Login Now</a>
            </div>

            <p><strong>Need Help?</strong> Contact the IT department if you experience any issues.</p>
        </div>
        <div class="footer">
            <p>© {year} Lyceum of the Philippines University - Batangas</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""


async def send_welcome_email_resend(
    email: str,
    first_name: str,
    last_name: str,
    school_id: str,
    role: str,
    temp_password: str,
    login_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Send welcome email using Resend API
    
    Args:
        email: Recipient email
        first_name: User's first name
        last_name: User's last name
        school_id: Student/employee number
        role: User role
        temp_password: Temporary password
        login_url: Login URL (optional)
    
    Returns:
        Dict with success status and message
    """
    try:
        # Get configuration
        resend_api_key = os.getenv("RESEND_API_KEY")
        email_enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
        from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
        from_name = os.getenv("RESEND_FROM_NAME", "LPU Course Feedback System")
        
        if not login_url:
            frontend_url = os.getenv("FRONTEND_URL", "https://course-feedback-ochre.vercel.app")
            login_url = f"{frontend_url}/login"
        
        # Log configuration
        logger.info(f"📧 Resend Email Configuration Check:")
        logger.info(f"   EMAIL_ENABLED: {email_enabled}")
        logger.info(f"   RESEND_API_KEY: {'SET' if resend_api_key else 'NOT SET'}")
        logger.info(f"   FROM_EMAIL: {from_email}")
        
        if not email_enabled:
            logger.warning(f"⚠️ EMAIL_ENABLED is false - email for {email} not sent")
            return {
                "success": True,
                "message": f"Email prepared for {email} (EMAIL_ENABLED is false)",
                "email_sent": False
            }
        
        if not resend_api_key:
            logger.warning(f"⚠️ RESEND_API_KEY not set - email for {email} not sent")
            return {
                "success": False,
                "message": "Resend API key not configured",
                "email_sent": False
            }
        
        # Prepare email content
        role_display = {
            'student': 'Student',
            'instructor': 'Instructor',
            'admin': 'Administrator'
        }.get(role, role.title())
        
        email_html = WELCOME_EMAIL_HTML.format(
            first_name=first_name,
            email=email,
            school_id=school_id,
            temp_password=temp_password,
            role=role_display,
            login_url=login_url,
            year=datetime.now().year
        )
        
        # Send via Resend API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": f"{from_name} <{from_email}>",
                    "to": [email],
                    "subject": "Welcome to Course Insight Guardian - Your Account is Ready!",
                    "html": email_html
                },
                timeout=10.0  # 10 second timeout
            )
        
        if response.status_code == 200:
            logger.info(f"✅ Welcome email sent successfully to {email}")
            return {
                "success": True,
                "message": f"Welcome email sent successfully to {email}",
                "email_sent": True
            }
        else:
            error_msg = response.text
            logger.error(f"❌ Resend API error for {email}: {error_msg}")
            return {
                "success": False,
                "message": f"Failed to send email: {error_msg}",
                "email_sent": False
            }
    
    except httpx.TimeoutException:
        logger.error(f"❌ Timeout sending email to {email}")
        return {
            "success": False,
            "message": "Email sending timed out",
            "email_sent": False
        }
    except Exception as e:
        logger.error(f"❌ Failed to send email to {email}: {str(e)}")
        return {
            "success": False,
            "message": f"Failed to send email: {str(e)}",
            "email_sent": False
        }
