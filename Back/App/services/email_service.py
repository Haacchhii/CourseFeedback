"""
Email Service Module
Handles all email notifications for the Course Feedback System
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


class EmailService:
    """Service for sending emails via SMTP"""
    
    def __init__(self):
        """Initialize email service with SMTP configuration"""
        self.smtp_server = getattr(settings, 'SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_username = getattr(settings, 'SMTP_USERNAME', None)
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', None)
        self.smtp_from_email = getattr(settings, 'SMTP_FROM_EMAIL', self.smtp_username)
        self.smtp_from_name = getattr(settings, 'SMTP_FROM_NAME', 'LPU Course Feedback System')
        self.enabled = all([self.smtp_server, self.smtp_username, self.smtp_password])
        
    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        attachments: Optional[List[Dict]] = None
    ) -> bool:
        """
        Send an email
        
        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text email body (optional)
            attachments: List of attachment dicts with 'filename' and 'content' keys
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        if not self.enabled:
            print("⚠️ Email service not configured. Skipping email send.")
            return False
            
        try:
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
                
            print(f"✅ Email sent successfully to {', '.join(to_emails)}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
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
                        <a href="http://localhost:5173/student/dashboard" class="button">
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
        
        Login at: http://localhost:5173/student/dashboard
        
        Note: Evaluations must be completed before {end_date}.
        
        ---
        LPU Batangas Course Feedback System
        """
        
        return self.send_email(to_emails, subject, html_body, text_body)
    
    def send_evaluation_reminder(
        self,
        to_emails: List[str],
        period_name: str,
        end_date: str,
        pending_courses: List[str],
        days_remaining: int
    ) -> bool:
        """Send reminder for pending evaluations"""
        
        urgency = "🔴 URGENT" if days_remaining <= 2 else "⚠️ REMINDER"
        subject = f"{urgency}: {len(pending_courses)} Course Evaluations Pending"
        
        courses_list = "".join([f"<li>{course}</li>" for course in pending_courses])
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: {'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' if days_remaining <= 2 else 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)'}; 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #f5576c; 
                          color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .warning-box {{ background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; 
                               margin: 20px 0; border-radius: 5px; }}
                .urgent-box {{ background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; 
                               margin: 20px 0; border-radius: 5px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{"⏰ Evaluation Deadline Approaching" if days_remaining > 2 else "🚨 URGENT: Deadline Tomorrow!"}</h1>
                </div>
                <div class="content">
                    <h2>Dear Student,</h2>
                    <p>You have <strong>{len(pending_courses)} pending course evaluation(s)</strong> 
                    that need to be completed.</p>
                    
                    <div class="{'urgent-box' if days_remaining <= 2 else 'warning-box'}">
                        <strong>{"🔴 URGENT:" if days_remaining <= 2 else "⚠️ Reminder:"}</strong><br>
                        Deadline: <strong>{end_date}</strong><br>
                        Time Remaining: <strong>{days_remaining} day(s)</strong>
                    </div>
                    
                    <p><strong>Pending Courses:</strong></p>
                    <ul>
                        {courses_list}
                    </ul>
                    
                    <p>{"⚠️ Please complete your evaluations as soon as possible to avoid missing the deadline!" if days_remaining <= 2 else "Don't forget to share your valuable feedback before the deadline."}</p>
                    
                    <center>
                        <a href="http://localhost:5173/student/dashboard" class="button">
                            Complete Evaluations Now →
                        </a>
                    </center>
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
        {urgency}: {len(pending_courses)} Course Evaluations Pending
        
        Dear Student,
        
        You have {len(pending_courses)} pending course evaluation(s) that need to be completed.
        
        Deadline: {end_date}
        Time Remaining: {days_remaining} day(s)
        
        Pending Courses:
        {chr(10).join(['- ' + course for course in pending_courses])}
        
        Please complete your evaluations as soon as possible.
        
        Login at: http://localhost:5173/student/dashboard
        
        ---
        LPU Batangas Course Feedback System
        """
        
        return self.send_email(to_emails, subject, html_body, text_body)
    
    def send_evaluation_period_ending(
        self,
        to_emails: List[str],
        period_name: str,
        end_date: str,
        hours_remaining: int
    ) -> bool:
        """Send final warning before period ends"""
        
        subject = f"🚨 FINAL NOTICE: Evaluation Period Ends in {hours_remaining} Hours"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #ff0844; 
                          color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .critical-box {{ background: #f8d7da; padding: 20px; border: 3px solid #dc3545; 
                                margin: 20px 0; border-radius: 5px; text-align: center; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 FINAL NOTICE</h1>
                    <h2>Evaluation Period Ending Soon</h2>
                </div>
                <div class="content">
                    <h2>Dear Student,</h2>
                    <p><strong>This is your FINAL reminder!</strong></p>
                    
                    <div class="critical-box">
                        <h2 style="margin: 0; color: #dc3545;">⏰ {hours_remaining} HOURS REMAINING</h2>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">
                            Deadline: <strong>{end_date}</strong>
                        </p>
                    </div>
                    
                    <p>The evaluation period <strong>{period_name}</strong> will close in 
                    <strong>{hours_remaining} hours</strong>. After this time, you will no longer 
                    be able to submit evaluations.</p>
                    
                    <p><strong>⚠️ ACTION REQUIRED:</strong></p>
                    <ul>
                        <li>Complete all pending course evaluations immediately</li>
                        <li>Your feedback is crucial for improving course quality</li>
                        <li>This is your last chance to participate</li>
                    </ul>
                    
                    <center>
                        <a href="http://localhost:5173/student/dashboard" class="button">
                            🚀 COMPLETE NOW - DON'T MISS OUT!
                        </a>
                    </center>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #dc3545; text-align: center;">
                        <strong>After {end_date}, the evaluation system will be closed.</strong>
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
        🚨 FINAL NOTICE: Evaluation Period Ends in {hours_remaining} Hours
        
        Dear Student,
        
        This is your FINAL reminder!
        
        ⏰ {hours_remaining} HOURS REMAINING
        Deadline: {end_date}
        
        The evaluation period {period_name} will close soon. After this time, 
        you will no longer be able to submit evaluations.
        
        ACTION REQUIRED:
        - Complete all pending course evaluations immediately
        - Your feedback is crucial for improving course quality
        - This is your last chance to participate
        
        Login at: http://localhost:5173/student/dashboard
        
        After {end_date}, the evaluation system will be closed.
        
        ---
        LPU Batangas Course Feedback System
        """
        
        return self.send_email(to_emails, subject, html_body, text_body)
    
    def send_evaluation_submitted_confirmation(
        self,
        to_email: str,
        student_name: str,
        course_name: str,
        submission_date: str
    ) -> bool:
        """Send confirmation after student submits evaluation"""
        
        subject = f"✅ Evaluation Submitted: {course_name}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .success-box {{ background: #d4edda; padding: 15px; border-left: 4px solid #28a745; 
                               margin: 20px 0; border-radius: 5px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Evaluation Submitted Successfully</h1>
                </div>
                <div class="content">
                    <h2>Dear {student_name},</h2>
                    <p>Thank you for completing your course evaluation!</p>
                    
                    <div class="success-box">
                        <strong>📋 Submission Details:</strong><br>
                        Course: {course_name}<br>
                        Submitted: {submission_date}<br>
                        Status: <strong style="color: #28a745;">✓ Confirmed</strong>
                    </div>
                    
                    <p>Your feedback has been recorded and will help improve the quality of education.</p>
                    
                    <p><strong>What happens next?</strong></p>
                    <ul>
                        <li>Your responses are kept anonymous</li>
                        <li>Feedback will be analyzed and shared with instructors</li>
                        <li>Results contribute to course improvement initiatives</li>
                    </ul>
                    
                    <p>If you have more courses to evaluate, please return to your dashboard.</p>
                </div>
                <div class="footer">
                    <p>LPU Batangas Course Feedback System</p>
                    <p>This is an automated confirmation. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        ✅ Evaluation Submitted Successfully
        
        Dear {student_name},
        
        Thank you for completing your course evaluation!
        
        Submission Details:
        - Course: {course_name}
        - Submitted: {submission_date}
        - Status: ✓ Confirmed
        
        Your feedback has been recorded and will help improve the quality of education.
        
        Your responses are kept anonymous and will be analyzed to improve course quality.
        
        ---
        LPU Batangas Course Feedback System
        """
        
        return self.send_email([to_email], subject, html_body, text_body)
    
    def send_admin_evaluation_summary(
        self,
        to_emails: List[str],
        period_name: str,
        total_evaluations: int,
        response_rate: float,
        anomalies_detected: int,
        avg_sentiment: str
    ) -> bool:
        """Send evaluation summary report to administrators"""
        
        subject = f"📊 Evaluation Period Summary: {period_name}"
        
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
                .stats-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }}
                .stat-box {{ background: white; padding: 20px; border-radius: 8px; text-align: center; 
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                .stat-value {{ font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }}
                .stat-label {{ color: #666; font-size: 14px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Evaluation Period Summary</h1>
                    <p style="margin: 0;">{period_name}</p>
                </div>
                <div class="content">
                    <h2>Administrator Report</h2>
                    <p>Here's a summary of the completed evaluation period:</p>
                    
                    <div class="stats-grid">
                        <div class="stat-box">
                            <div class="stat-value">{total_evaluations}</div>
                            <div class="stat-label">Total Evaluations</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">{response_rate}%</div>
                            <div class="stat-label">Response Rate</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">{anomalies_detected}</div>
                            <div class="stat-label">Anomalies Detected</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">{avg_sentiment}</div>
                            <div class="stat-label">Avg Sentiment</div>
                        </div>
                    </div>
                    
                    <p><strong>Key Insights:</strong></p>
                    <ul>
                        <li>ML-powered sentiment analysis completed</li>
                        <li>Anomaly detection identified potentially invalid responses</li>
                        <li>Detailed reports available in the admin dashboard</li>
                    </ul>
                    
                    <p>Log in to the admin dashboard to view detailed analytics and export reports.</p>
                </div>
                <div class="footer">
                    <p>LPU Batangas Course Feedback System</p>
                    <p>This is an automated report. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        📊 Evaluation Period Summary: {period_name}
        
        Administrator Report
        
        Summary:
        - Total Evaluations: {total_evaluations}
        - Response Rate: {response_rate}%
        - Anomalies Detected: {anomalies_detected}
        - Average Sentiment: {avg_sentiment}
        
        Key Insights:
        - ML-powered sentiment analysis completed
        - Anomaly detection identified potentially invalid responses
        - Detailed reports available in the admin dashboard
        
        Log in to view detailed analytics and export reports.
        
        ---
        LPU Batangas Course Feedback System
        """
        
        return self.send_email(to_emails, subject, html_body, text_body)


# Singleton instance
email_service = EmailService()
