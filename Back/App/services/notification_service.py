"""
Notification Service
Provides helper functions to send notifications throughout the system
"""
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Optional
from config import now_local

class NotificationService:
    """Service for creating and managing notifications"""
    
    @staticmethod
    def send_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = "info",
        link: Optional[str] = None
    ) -> int:
        """
        Send a notification to a specific user
        Returns: notification ID
        """
        try:
            result = db.execute(
                text("""
                    INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                    VALUES (:user_id, :title, :message, :type, :link, FALSE, :created_at)
                    RETURNING id
                """),
                {
                    "user_id": user_id,
                    "title": title,
                    "message": message,
                    "type": notification_type,
                    "link": link,
                    "created_at": now_local()
                }
            )
            notification_id = result.scalar()
            db.commit()
            return notification_id
        except Exception as e:
            db.rollback()
            print(f"Failed to send notification: {str(e)}")
            return None
    
    @staticmethod
    def broadcast_to_role(
        db: Session,
        role: str,
        title: str,
        message: str,
        notification_type: str = "info",
        link: Optional[str] = None
    ) -> int:
        """
        Broadcast notification to all users with a specific role
        Returns: count of notifications sent
        """
        try:
            # Get all active users with the role
            result = db.execute(
                text("SELECT id FROM users WHERE role = :role AND is_active = TRUE"),
                {"role": role}
            )
            user_ids = [row.id for row in result]
            
            # Send notification to each user
            count = 0
            for user_id in user_ids:
                db.execute(
                    text("""
                        INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                        VALUES (:user_id, :title, :message, :type, :link, FALSE, :created_at)
                    """),
                    {
                        "user_id": user_id,
                        "title": title,
                        "message": message,
                        "type": notification_type,
                        "link": link,
                        "created_at": now_local()
                    }
                )
                count += 1
            
            db.commit()
            return count
        except Exception as e:
            db.rollback()
            print(f"Failed to broadcast notification: {str(e)}")
            return 0
    
    @staticmethod
    def broadcast_to_all(
        db: Session,
        title: str,
        message: str,
        notification_type: str = "info",
        link: Optional[str] = None
    ) -> int:
        """
        Broadcast notification to all active users
        Returns: count of notifications sent
        """
        try:
            # Get all active users
            result = db.execute(
                text("SELECT id FROM users WHERE is_active = TRUE")
            )
            user_ids = [row.id for row in result]
            
            # Send notification to each user
            count = 0
            for user_id in user_ids:
                db.execute(
                    text("""
                        INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                        VALUES (:user_id, :title, :message, :type, :link, FALSE, :created_at)
                    """),
                    {
                        "user_id": user_id,
                        "title": title,
                        "message": message,
                        "type": notification_type,
                        "link": link,
                        "created_at": now_local()
                    }
                )
                count += 1
            
            db.commit()
            return count
        except Exception as e:
            db.rollback()
            print(f"Failed to broadcast notification: {str(e)}")
            return 0

# Notification templates for common events
class NotificationTemplates:
    """Pre-defined notification templates for common events"""
    
    @staticmethod
    def evaluation_period_started(period_name: str, deadline: str) -> tuple:
        """Notification when evaluation period opens"""
        return (
            "New Evaluation Period",
            f"The evaluation period '{period_name}' is now open. Please complete your evaluations before {deadline}.",
            "info"
        )
    
    @staticmethod
    def evaluation_period_ending_soon(period_name: str, days_left: int) -> tuple:
        """Notification when evaluation period is ending soon"""
        return (
            "Evaluation Deadline Approaching",
            f"The evaluation period '{period_name}' ends in {days_left} days. Please complete your pending evaluations.",
            "warning"
        )
    
    @staticmethod
    def evaluation_submitted(course_name: str) -> tuple:
        """Notification when student submits evaluation"""
        return (
            "Evaluation Submitted",
            f"Your evaluation for {course_name} has been submitted successfully.",
            "success"
        )
    
    @staticmethod
    def evaluation_results_ready(period_name: str) -> tuple:
        """Notification when evaluation results are available"""
        return (
            "Evaluation Results Available",
            f"The results for '{period_name}' are now available for review.",
            "info"
        )
    
    @staticmethod
    def anomaly_detected(course_name: str, instructor_name: str) -> tuple:
        """Notification for detected anomalies"""
        return (
            "Attention Required",
            f"Unusual feedback patterns detected for {course_name} ({instructor_name}). Please review.",
            "warning"
        )
    
    @staticmethod
    def negative_sentiment_alert(course_name: str) -> tuple:
        """Notification for negative sentiment detection"""
        return (
            "Negative Feedback Alert",
            f"Significant negative sentiment detected in feedback for {course_name}. Immediate attention recommended.",
            "error"
        )
    
    @staticmethod
    def welcome_message(user_name: str, role: str) -> tuple:
        """Welcome notification for new users"""
        return (
            "Welcome to the Course Feedback System",
            f"Welcome, {user_name}! Your account has been created as {role}. Please complete your profile setup.",
            "info"
        )
    
    @staticmethod
    def password_changed() -> tuple:
        """Notification after password change"""
        return (
            "Password Changed",
            "Your password has been changed successfully. If you didn't make this change, please contact support immediately.",
            "success"
        )
    
    @staticmethod
    def account_activated() -> tuple:
        """Notification when account is activated"""
        return (
            "Account Activated",
            "Your account has been activated. You can now access all features of the system.",
            "success"
        )
    
    @staticmethod
    def account_deactivated() -> tuple:
        """Notification when account is deactivated"""
        return (
            "Account Deactivated",
            "Your account has been deactivated. Please contact the administrator if you believe this is an error.",
            "warning"
        )
    
    @staticmethod
    def student_advanced(new_year_level: int) -> tuple:
        """Notification when student is advanced to next year"""
        return (
            "Year Level Updated",
            f"Congratulations! You have been advanced to Year {new_year_level}.",
            "success"
        )

# Export notification service
notification_service = NotificationService()
notification_templates = NotificationTemplates()
