"""
Email Notification Service for Course Feedback System
Sends welcome emails to new users with temporary password information
"""

from typing import Optional, Dict, Any
import logging
from datetime import datetime
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Email templates
WELCOME_EMAIL_TEMPLATE = """
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
            <p>Lyceum of the Philippines University - Batangas</p>
        </div>
        
        <div class="content">
            <h2>Hello, {first_name}!</h2>
            
            <p>Your account has been successfully created in the <strong>Course Insight Guardian</strong> system. You can now access the platform to provide feedback and help improve academic excellence.</p>
            
            <div class="credential-box">
                <h3>📧 Your Login Credentials</h3>
                <p><strong>Email:</strong> {email}</p>
                <p><strong>School ID:</strong> {school_id}</p>
                <p><strong>Temporary Password:</strong> <span class="password">{temp_password}</span></p>
                <p><strong>Role:</strong> {role}</p>
            </div>
            
            <div class="warning">
                <h3>⚠️ Important Security Notice</h3>
                <p><strong>This is a temporary password.</strong> For your security, you will be required to create a new password when you log in for the first time.</p>
                <p>Your new password must:</p>
                <ul>
                    <li>Be at least 8 characters long</li>
                    <li>Include a mix of uppercase and lowercase letters</li>
                    <li>Contain at least one number</li>
                    <li>Include at least one special character</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="{login_url}" class="btn">🔐 Log In Now</a>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 5px;">
                <h3>📚 What's Next?</h3>
                <ol>
                    <li>Click the login button above or visit {login_url}</li>
                    <li>Enter your LPU email and temporary password</li>
                    <li>Create your new secure password</li>
                    <li>Start exploring the system!</li>
                </ol>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, please contact your system administrator.</p>
            
            <p><strong>Best regards,</strong><br>
            Course Insight Guardian Team<br>
            Lyceum of the Philippines University - Batangas</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {year} Lyceum of the Philippines University - Batangas. All rights reserved.</p>
            <p><strong>Security Reminder:</strong> Never share your password with anyone. LPU staff will never ask for your password.</p>
        </div>
    </div>
</body>
</html>
"""

async def send_welcome_email(
    email: str,
    first_name: str,
    last_name: str,
    school_id: str,
    role: str,
    temp_password: str,
    login_url: str = None
) -> Dict[str, Any]:
    """
    Send welcome email to newly created user
    
    Args:
        email: User's email address
        first_name: User's first name
        last_name: User's last name
        school_id: User's school ID number
        role: User's role (student, secretary, department_head, etc.)
        temp_password: Temporary password generated for user
        login_url: URL to login page (defaults to FRONTEND_URL from .env)
        
    Returns:
        Dict with success status and message
    """
    try:
        # Get frontend URL from environment
        if login_url is None:
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            login_url = f"{frontend_url}/login"
        
        # Format role for display
        role_display = {
            'student': 'Student',
            'secretary': 'Secretary',
            'department_head': 'Department Head',
            'instructor': 'Instructor',
            'admin': 'Administrator'
        }.get(role, role.title())
        
        # Prepare email content
        email_html = WELCOME_EMAIL_TEMPLATE.format(
            first_name=first_name,
            email=email,
            school_id=school_id,
            temp_password=temp_password,
            role=role_display,
            login_url=login_url,
            year=datetime.now().year
        )
        
        subject = f"Welcome to Course Insight Guardian - Your Account is Ready!"
        
        # Check if email is enabled
        email_enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
        
        # Get SMTP configuration from environment
        smtp_server = os.getenv("SMTP_SERVER")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        if not email_enabled:
            logger.warning(f"⚠️ EMAIL_ENABLED is false - welcome email for {email} not sent")
            logger.info(f"📧 Welcome email prepared for {email}")
            logger.info(f"   Name: {first_name} {last_name}")
            logger.info(f"   School ID: {school_id}")
            logger.info(f"   Role: {role_display}")
            logger.info(f"   Temp Password: {temp_password}")
            
            return {
                "success": True,
                "message": f"Welcome email prepared for {email} (EMAIL_ENABLED is false)",
                "email_sent": False,
                "details": {
                    "recipient": email,
                    "temp_password": temp_password,
                    "role": role_display
                }
            }
        
        if not all([smtp_server, smtp_username, smtp_password]):
            logger.warning(f"⚠️ SMTP not configured - welcome email for {email} not sent")
            logger.info(f"📧 Welcome email prepared for {email}")
            logger.info(f"   Name: {first_name} {last_name}")
            logger.info(f"   School ID: {school_id}")
            logger.info(f"   Role: {role_display}")
            logger.info(f"   Temp Password: {temp_password}")
            
            return {
                "success": True,
                "message": f"Welcome email prepared for {email} (SMTP not configured)",
                "email_sent": False,
                "details": {
                    "recipient": email,
                    "temp_password": temp_password,
                    "role": role_display
                }
            }
        
        # Send email via Gmail SMTP
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = smtp_username
            msg['To'] = email
            
            # Attach HTML content
            msg.attach(MIMEText(email_html, 'html'))
            
            # Create secure SSL context
            context = ssl.create_default_context()
            
            # Send email
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls(context=context)
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
            
            logger.info(f"✅ Welcome email sent successfully to {email}")
            logger.info(f"   Name: {first_name} {last_name}")
            logger.info(f"   School ID: {school_id}")
            logger.info(f"   Role: {role_display}")
            logger.info(f"   Temp Password: {temp_password}")
            
            return {
                "success": True,
                "message": f"Welcome email sent successfully to {email}",
                "email_sent": True,
                "details": {
                    "recipient": email,
                    "temp_password": temp_password,
                    "role": role_display
                }
            }
            
        except Exception as email_error:
            logger.error(f"❌ Failed to send welcome email to {email}: {str(email_error)}")
            logger.info(f"📧 Email content prepared but not sent:")
            logger.info(f"   Name: {first_name} {last_name}")
            logger.info(f"   School ID: {school_id}")
            logger.info(f"   Role: {role_display}")
            logger.info(f"   Temp Password: {temp_password}")
            
            return {
                "success": False,
                "message": f"Failed to send welcome email: {str(email_error)}",
                "email_sent": False,
                "details": {
                    "recipient": email,
                    "temp_password": temp_password,
                    "role": role_display
                }
            }
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {str(e)}")
        return {
            "success": False,
            "message": f"Failed to send welcome email: {str(e)}",
            "email_sent": False
        }

async def send_bulk_welcome_emails(
    users: list[Dict[str, Any]],
    login_url: str = None
) -> Dict[str, Any]:
    """
    Send welcome emails to multiple users (for bulk import)
    
    Args:
        users: List of user dicts with email, first_name, last_name, school_id, role, temp_password
        login_url: URL to login page (defaults to FRONTEND_URL from .env)
        
    Returns:
        Dict with summary of email sending results
    """
    results = {
        "total": len(users),
        "successful": 0,
        "failed": 0,
        "details": []
    }
    
    for user in users:
        result = await send_welcome_email(
            email=user['email'],
            first_name=user['first_name'],
            last_name=user['last_name'],
            school_id=user['school_id'],
            role=user['role'],
            temp_password=user['temp_password']
            # login_url will use FRONTEND_URL from .env
        )
        
        if result['success']:
            results['successful'] += 1
        else:
            results['failed'] += 1
        
        results['details'].append({
            'email': user['email'],
            'status': 'success' if result['success'] else 'failed',
            'message': result['message']
        })
    
    logger.info(f"📨 Bulk email results: {results['successful']}/{results['total']} successful")
    
    return results
