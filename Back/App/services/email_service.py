"""
Email Service Module
Handles all email notifications for the Course Feedback System
Uses Resend API as primary method with SMTP fallback
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict
from datetime import datetime
import os
from pathlib import Path

# Import config
import sys
sys.path.append(str(Path(__file__).parent.parent))
from config import settings

# Import Resend
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    print("⚠️ Resend package not installed. Falling back to SMTP only.")


class EmailService:
    """Service for sending emails via Resend API (primary) or SMTP (fallback)"""
    
    def __init__(self):
        """Initialize email service with Resend and SMTP configuration"""
        # Resend configuration
        self.resend_api_key = getattr(settings, 'RESEND_API_KEY', None)
        self.resend_from_email = getattr(settings, 'RESEND_FROM_EMAIL', 'onboarding@resend.dev')
        self.resend_from_name = getattr(settings, 'RESEND_FROM_NAME', 'LPU Course Feedback System')
        self.resend_enabled = bool(self.resend_api_key and RESEND_AVAILABLE)
        
        # SMTP configuration (backup)
        self.smtp_server = getattr(settings, 'SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_username = getattr(settings, 'SMTP_USERNAME', None)
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', None)
        self.smtp_from_email = getattr(settings, 'SMTP_FROM_EMAIL', self.smtp_username)
        self.smtp_from_name = getattr(settings, 'SMTP_FROM_NAME', 'LPU Course Feedback System')
        self.smtp_enabled = all([self.smtp_server, self.smtp_username, self.smtp_password])
        
        # Configure Resend API key if available
        if self.resend_enabled:
            resend.api_key = self.resend_api_key
            print("✅ Resend API configured (primary email method)")
        
        self.enabled = self.resend_enabled or self.smtp_enabled
        
        if not self.enabled:
            print("⚠️ No email service configured (neither Resend nor SMTP)")
        
    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
        max_retries: int = 1
    ) -> bool:
        """
        Send an email using Resend API (primary) or SMTP (fallback) with retry logic
        
        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text email body (optional)
            attachments: List of attachment dicts with 'filename' and 'content' keys
            max_retries: Maximum number of retry attempts (default: 1, reduced to prevent blocking)
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        if not self.enabled:
            print("⚠️ Email service not configured. Skipping email send.")
            return False
        
        # Simplified retry logic - only 1 quick retry to prevent API blocking
        for attempt in range(1, max_retries + 1):
            try:
                result = self._send_email_attempt(to_emails, subject, html_body, text_body, attachments)
                if result:
                    return True
                    
                # If attempt failed and we have retries left
                if attempt < max_retries:
                    print(f"⏳ Retry attempt {attempt}/{max_retries}...")
                    # No sleep - retry immediately to avoid blocking
                else:
                    print(f"❌ Email send failed after {max_retries} attempt(s)")
                    return False
                    
            except Exception as e:
                print(f"❌ Email send attempt {attempt} error: {str(e)}")
                if attempt >= max_retries:
                    print(f"❌ Email send failed - check email configuration")
                    return False
        
        return False
    
    def _send_email_attempt(
        self,
        to_emails: List[str],
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        attachments: Optional[List[Dict]] = None
    ) -> bool:
        """
        Single attempt to send email using Resend API (primary) or SMTP (fallback)
        Internal method called by send_email with retry logic
        """
        if not self.enabled:
            return False
        
        # Try Resend first if available
        if self.resend_enabled:
            try:
                print(f"📧 Attempting to send via Resend to {', '.join(to_emails)}...")
                
                params = {
                    "from": f"{self.resend_from_name} <{self.resend_from_email}>",
                    "to": to_emails,
                    "subject": subject,
                    "html": html_body,
                }
                
                # Add text body if provided
                if text_body:
                    params["text"] = text_body
                
                # Note: Resend attachments use different format than SMTP
                # Will need to be implemented separately if needed
                
                response = resend.Emails.send(params)
                print(f"✅ Email sent successfully via Resend to {', '.join(to_emails)}")
                print(f"   Resend ID: {response.get('id', 'N/A')}")
                return True
                
            except Exception as e:
                print(f"⚠️ Resend failed: {str(e)}")
                if self.smtp_enabled:
                    print("   Falling back to SMTP...")
                else:
                    print("   No SMTP backup configured")
                    return False
        
        # Fallback to SMTP if Resend failed or not available
        if self.smtp_enabled:
            try:
                print(f"📧 Sending via SMTP to {', '.join(to_emails)}...")
                
                # Create message
                message = MIMEMultipart("alternative")
                message["Subject"] = subject
                message["From"] = f"{self.smtp_from_name} <{self.smtp_from_email}>"
                message["To"] = ", ".join(to_emails)
                
                # Add text and HTML parts
                if text_body:
                    part1 = MIMEText(text_body, "plain")
                    message.attach(part1)
                    
                part2 = MIMEText(html_body, "html")
                message.attach(part2)
                
                # Add attachments if any
                if attachments:
                    for attachment in attachments:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(attachment['content'])
                        encoders.encode_base64(part)
                        part.add_header(
                            "Content-Disposition",
                            f"attachment; filename= {attachment['filename']}",
                        )
                        message.attach(part)
                
                # Create SSL context
                context = ssl.create_default_context()
                
                # Send email
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls(context=context)
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(self.smtp_from_email, to_emails, message.as_string())
                    
                print(f"✅ Email sent successfully via SMTP to {', '.join(to_emails)}")
                return True
                
            except Exception as e:
                print(f"❌ SMTP send failed: {str(e)}")
                return False
        
        return False
    
    def send_evaluation_period_start(
        self,
        to_emails: List[str],
        period_name: str,
        start_date: str,
        end_date: str,
        courses_count: int
    ) -> bool:
        """Send notification when evaluation period starts"""
        
        # Get frontend URL from environment
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        dashboard_url = f"{frontend_url}/student/dashboard"
        
        subject = f"📝 Evaluation Period Started: {period_name}"
        
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
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; 
                          color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .info-box {{ background: white; padding: 15px; border-left: 4px solid #667eea; 
                            margin: 20px 0; border-radius: 5px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 Course Evaluation Period Started</h1>
                </div>
                <div class="content">
                    <h2>Dear Student,</h2>
                    <p>The evaluation period <strong>{period_name}</strong> has officially started!</p>
                    
                    <div class="info-box">
                        <strong>📅 Period Details:</strong><br>
                        Start Date: {start_date}<br>
                        End Date: {end_date}<br>
                        Courses to Evaluate: {courses_count}
                    </div>
                    
                    <p>Your feedback is valuable in helping us improve the quality of education. 
                    Please take a few minutes to evaluate your courses.</p>
                    
                    <p><strong>What to expect:</strong></p>
                    <ul>
                        <li>31 questions across 6 categories</li>
                        <li>Anonymous responses to ensure honesty</li>
                        <li>Optional text feedback for additional comments</li>
                        <li>5-10 minutes per course evaluation</li>
                    </ul>
                    
                    <center>
                        <a href="{dashboard_url}" class="button">
                            Start Evaluating Now →
                        </a>
                    </center>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">
                        <em>Note: Evaluations must be completed before {end_date}. 
                        Reminders will be sent as the deadline approaches.</em>
                    </p>
                </div>
                <div class="footer">
                    <p>LPU Batangas Course Feedback System</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Course Evaluation Period Started: {period_name}
        
        Dear Student,
        
        The evaluation period has officially started!
        
        Period Details:
        - Start Date: {start_date}
        - End Date: {end_date}
        - Courses to Evaluate: {courses_count}
        
        Your feedback is valuable in helping us improve the quality of education.
        Please log in to complete your course evaluations.
        
        Login at: {dashboard_url}
        
        Note: Evaluations must be completed before {end_date}.
        
        ---
        LPU Batangas Course Feedback System
        """
        
        return self.send_email(to_emails, subject, html_body, text_body)


# Singleton instance
email_service = EmailService()


# Standalone function for password reset (for backward compatibility)
def send_password_reset_email(to_email: str, reset_token: str, user_name: str) -> bool:
    """
    Send password reset email with reset link
    
    Args:
        to_email: Recipient email address
        reset_token: Password reset token
        user_name: User's full name
        
    Returns:
        bool: True if sent successfully, False otherwise
    """
    frontend_url = os.getenv("FRONTEND_URL", "https://course-feedback-ochre.vercel.app")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    subject = "🔐 Password Reset Request - LPU Course Feedback"
    
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
            .button {{ display: inline-block; padding: 15px 30px; background: #667eea; 
                      color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; 
                      font-weight: bold; }}
            .warning-box {{ background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; 
                           margin: 20px 0; border-radius: 5px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .token-box {{ background: #f0f0f0; padding: 10px; border-radius: 5px; 
                         font-family: monospace; word-break: break-all; margin: 10px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Hello {user_name},</h2>
                <p>We received a request to reset your password for the LPU Course Feedback System.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <center>
                    <a href="{reset_link}" class="button">
                        Reset Password →
                    </a>
                </center>
                
                <p style="font-size: 14px; color: #666;">
                    Or copy and paste this link into your browser:<br>
                    <span class="token-box">{reset_link}</span>
                </p>
                
                <div class="warning-box">
                    <strong>⚠️ Security Notice:</strong><br>
                    • This link will expire in 1 hour<br>
                    • If you didn't request this reset, please ignore this email<br>
                    • Never share this link with anyone
                </div>
                
                <p>If the button doesn't work, you can also use this reset token manually:</p>
                <div class="token-box">{reset_token}</div>
            </div>
            <div class="footer">
                <p>LPU Batangas Course Feedback System</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    Password Reset Request - LPU Course Feedback System
    
    Hello {user_name},
    
    We received a request to reset your password.
    
    Click this link to reset your password:
    {reset_link}
    
    Or use this reset token manually:
    {reset_token}
    
    Security Notice:
    - This link will expire in 1 hour
    - If you didn't request this reset, please ignore this email
    - Never share this link with anyone
    
    ---
    LPU Batangas Course Feedback System
    """
    
    return email_service.send_email([to_email], subject, html_body, text_body)
