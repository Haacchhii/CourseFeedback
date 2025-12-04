"""
In-App Notification System
Provides real-time notifications for users
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database.connection import get_db
from config import now_local

router = APIRouter()

class Notification(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str  # info, success, warning, error
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: str = "info"
    link: Optional[str] = None

class NotificationResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

@router.get("/notifications", response_model=List[Notification])
async def get_user_notifications(
    user_id: int = Query(..., description="User ID"),
    unread_only: bool = Query(False, description="Show only unread notifications"),
    limit: int = Query(20, description="Maximum number of notifications to return"),
    db: Session = Depends(get_db)
):
    """Get notifications for a specific user"""
    try:
        query = """
            SELECT id, user_id, title, message, type, is_read, link, created_at
            FROM notifications
            WHERE user_id = :user_id
        """
        
        if unread_only:
            query += " AND is_read = FALSE"
        
        query += " ORDER BY created_at DESC LIMIT :limit"
        
        result = db.execute(text(query), {"user_id": user_id, "limit": limit})
        notifications = []
        
        for row in result:
            notifications.append(Notification(
                id=row.id,
                user_id=row.user_id,
                title=row.title,
                message=row.message,
                type=row.type,
                is_read=row.is_read,
                link=row.link,
                created_at=row.created_at
            ))
        
        return notifications
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")

@router.get("/notifications/unread-count")
async def get_unread_count(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications for a user"""
    try:
        result = db.execute(
            text("SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = FALSE"),
            {"user_id": user_id}
        )
        count = result.scalar()
        
        return {"user_id": user_id, "unread_count": count}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get unread count: {str(e)}")

@router.post("/notifications/{notification_id}/mark-read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    try:
        # Verify notification belongs to user
        check_result = db.execute(
            text("SELECT user_id FROM notifications WHERE id = :id"),
            {"id": notification_id}
        )
        notification = check_result.fetchone()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        if notification.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this notification")
        
        # Mark as read
        db.execute(
            text("UPDATE notifications SET is_read = TRUE WHERE id = :id"),
            {"id": notification_id}
        )
        db.commit()
        
        return NotificationResponse(
            success=True,
            message="Notification marked as read"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")

@router.post("/notifications/mark-all-read", response_model=NotificationResponse)
async def mark_all_notifications_read(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for a user"""
    try:
        db.execute(
            text("UPDATE notifications SET is_read = TRUE WHERE user_id = :user_id AND is_read = FALSE"),
            {"user_id": user_id}
        )
        db.commit()
        
        return NotificationResponse(
            success=True,
            message="All notifications marked as read"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to mark all notifications as read: {str(e)}")

@router.post("/notifications", response_model=NotificationResponse)
async def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db)
):
    """Create a new notification (admin only)"""
    try:
        result = db.execute(
            text("""
                INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                VALUES (:user_id, :title, :message, :type, :link, FALSE, :created_at)
                RETURNING id
            """),
            {
                "user_id": notification.user_id,
                "title": notification.title,
                "message": notification.message,
                "type": notification.type,
                "link": notification.link,
                "created_at": now_local()
            }
        )
        notification_id = result.scalar()
        db.commit()
        
        return NotificationResponse(
            success=True,
            message="Notification created successfully",
            data={"notification_id": notification_id}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create notification: {str(e)}")

@router.post("/notifications/broadcast", response_model=NotificationResponse)
async def broadcast_notification(
    title: str = Query(..., description="Notification title"),
    message: str = Query(..., description="Notification message"),
    type: str = Query("info", description="Notification type"),
    role: Optional[str] = Query(None, description="Target role (all if not specified)"),
    db: Session = Depends(get_db)
):
    """Broadcast notification to multiple users (admin only)"""
    try:
        # Get target users
        if role:
            user_query = "SELECT id FROM users WHERE role = :role AND is_active = TRUE"
            result = db.execute(text(user_query), {"role": role})
        else:
            user_query = "SELECT id FROM users WHERE is_active = TRUE"
            result = db.execute(text(user_query))
        
        user_ids = [row.id for row in result]
        
        # Create notifications for all users
        for user_id in user_ids:
            db.execute(
                text("""
                    INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                    VALUES (:user_id, :title, :message, :type, FALSE, :created_at)
                """),
                {
                    "user_id": user_id,
                    "title": title,
                    "message": message,
                    "type": type,
                    "created_at": now_local()
                }
            )
        
        db.commit()
        
        return NotificationResponse(
            success=True,
            message=f"Notification sent to {len(user_ids)} users",
            data={"recipient_count": len(user_ids)}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to broadcast notification: {str(e)}")

@router.delete("/notifications/{notification_id}", response_model=NotificationResponse)
async def delete_notification(
    notification_id: int,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    try:
        # Verify notification belongs to user
        check_result = db.execute(
            text("SELECT user_id FROM notifications WHERE id = :id"),
            {"id": notification_id}
        )
        notification = check_result.fetchone()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        if notification.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this notification")
        
        # Delete notification
        db.execute(
            text("DELETE FROM notifications WHERE id = :id"),
            {"id": notification_id}
        )
        db.commit()
        
        return NotificationResponse(
            success=True,
            message="Notification deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete notification: {str(e)}")
