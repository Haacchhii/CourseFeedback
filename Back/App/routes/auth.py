# Authentication Routes
# Handles user login and authentication

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
import bcrypt
import logging
import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from database.connection import get_db
from config import now_local

logger = logging.getLogger(__name__)

router = APIRouter()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-fallback-key-not-for-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[dict] = None
    message: Optional[str] = None

def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = now_local() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db = Depends(get_db)):
    """
    Authenticate user with email and password
    Returns JWT token and user data if authentication successful
    """
    try:
        # Query database for user using SQLAlchemy text query
        from sqlalchemy import text
        
        # Get user from users table
        query = text("""
            SELECT id, email, role, password_hash, first_name, last_name, department, school_id, is_active, must_change_password, first_login
            FROM users
            WHERE LOWER(email) = :email
        """)
        
        result = db.execute(query, {"email": request.email.lower()})
        user_data = result.fetchone()
        
        if not user_data:
            logger.warning(f"Login attempt for non-existent email: {request.email}")
            return LoginResponse(success=False, message="Invalid email or password")
        
        # Check if user is active
        if not user_data.is_active:
            logger.warning(f"Login attempt for inactive user: {request.email}")
            return LoginResponse(success=False, message="Account is inactive")
        
        # Reject instructor role - instructors cannot log in
        if user_data.role == 'instructor':
            logger.warning(f"Login attempt blocked for instructor role: {request.email}")
            return LoginResponse(success=False, message="Instructor access is not available. Please contact administration.")
        
        # Verify password
        stored_hash = user_data.password_hash
        try:
            if not bcrypt.checkpw(request.password.encode('utf-8'), stored_hash.encode('utf-8')):
                logger.warning(f"Invalid password for user: {request.email}")
                return LoginResponse(success=False, message="Invalid email or password")
        except Exception as pwd_error:
            logger.error(f"Password verification error: {str(pwd_error)}")
            return LoginResponse(success=False, message="Invalid email or password")
        
        # Build user object
        full_name = f"{user_data.first_name or ''} {user_data.last_name or ''}".strip()
        user = {
            'id': user_data.id,
            'email': user_data.email, 
            'role': user_data.role,
            'name': full_name or user_data.email.split('@')[0],
            'department': user_data.department,
            'schoolId': user_data.school_id if hasattr(user_data, 'school_id') else None,
            'firstName': user_data.first_name,
            'lastName': user_data.last_name,
            'mustChangePassword': user_data.must_change_password if hasattr(user_data, 'must_change_password') else False,
            'firstLogin': user_data.first_login if hasattr(user_data, 'first_login') else False
        }
        
        # Generate JWT token
        token_data = {
            "user_id": user['id'],
            "email": user['email'],
            "role": user['role']
        }
        access_token = create_access_token(token_data)
        
        logger.info(f"✅ User {request.email} logged in successfully with role {user['role']}")
        return LoginResponse(success=True, token=access_token, user=user)
        
    except Exception as e:
        logger.error(f"❌ Login error for {request.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


class ForgotPasswordRequest(BaseModel):
    email: str

class ForgotPasswordResponse(BaseModel):
    success: bool
    message: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(request: ForgotPasswordRequest, db = Depends(get_db)):
    """
    Initiate password reset process
    Generates a reset token and sends email to user
    """
    try:
        from sqlalchemy import text
        import secrets
        
        # Check if user exists
        query = text("""
            SELECT id, email, first_name, last_name, is_active
            FROM users
            WHERE LOWER(email) = :email
        """)
        
        result = db.execute(query, {"email": request.email.lower()})
        user_data = result.fetchone()
        
        # Always return success message for security (don't reveal if email exists)
        if not user_data or not user_data.is_active:
            logger.warning(f"Password reset requested for non-existent/inactive email: {request.email}")
            return ForgotPasswordResponse(
                success=True,
                message="If the email exists in our system, a password reset link has been sent."
            )
        
        # Generate secure reset token (valid for 1 hour)
        reset_token = secrets.token_urlsafe(32)
        expires_at = now_local() + timedelta(hours=1)
        
        # Store reset token in database
        insert_query = text("""
            INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
            VALUES (:user_id, :token, :expires_at, :created_at)
            ON CONFLICT (user_id) 
            DO UPDATE SET token = :token, expires_at = :expires_at, created_at = :created_at
        """)
        
        db.execute(insert_query, {
            "user_id": user_data.id,
            "token": reset_token,
            "expires_at": expires_at,
            "created_at": now_local()
        })
        db.commit()
        
        # TODO: Send email with reset link
        # For now, log the token (in production, send via email)
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        logger.info(f"Password reset requested for {request.email}. Reset link: {reset_link}")
        
        # Try to send email if email service is configured
        try:
            from services.email_service import send_password_reset_email
            send_password_reset_email(
                to_email=user_data.email,
                reset_token=reset_token,
                user_name=f"{user_data.first_name or ''} {user_data.last_name or ''}".strip()
            )
            logger.info(f"✅ Password reset email sent to {request.email}")
        except Exception as email_error:
            logger.warning(f"Email service not available: {email_error}. Reset token logged instead.")
        
        return ForgotPasswordResponse(
            success=True,
            message="If the email exists in our system, a password reset link has been sent."
        )
        
    except Exception as e:
        logger.error(f"❌ Forgot password error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset request failed: {str(e)}"
        )


@router.post("/reset-password", response_model=ForgotPasswordResponse)
async def reset_password(request: ResetPasswordRequest, db = Depends(get_db)):
    """
    Reset user password using valid reset token
    """
    try:
        from sqlalchemy import text
        
        # Verify token and check expiration
        query = text("""
            SELECT prt.user_id, prt.expires_at, u.email
            FROM password_reset_tokens prt
            JOIN users u ON u.id = prt.user_id
            WHERE prt.token = :token AND prt.used = FALSE
        """)
        
        result = db.execute(query, {"token": request.token})
        token_data = result.fetchone()
        
        if not token_data:
            return ForgotPasswordResponse(
                success=False,
                message="Invalid or expired reset token."
            )
        
        # Check if token is expired
        if now_local() > token_data.expires_at:
            return ForgotPasswordResponse(
                success=False,
                message="Reset token has expired. Please request a new one."
            )
        
        # Hash new password
        password_hash = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update password
        update_query = text("""
            UPDATE users
            SET password_hash = :password_hash
            WHERE id = :user_id
        """)
        
        db.execute(update_query, {
            "password_hash": password_hash,
            "user_id": token_data.user_id
        })
        
        # Mark token as used
        mark_used_query = text("""
            UPDATE password_reset_tokens
            SET used = TRUE
            WHERE token = :token
        """)
        
        db.execute(mark_used_query, {"token": request.token})
        db.commit()
        
        logger.info(f"✅ Password reset successful for user_id: {token_data.user_id}")
        
        return ForgotPasswordResponse(
            success=True,
            message="Password has been reset successfully. You can now log in with your new password."
        )
        
    except Exception as e:
        logger.error(f"❌ Reset password error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(e)}"
        )


class ChangePasswordRequest(BaseModel):
    user_id: int
    current_password: str
    new_password: str

class ChangePasswordResponse(BaseModel):
    success: bool
    message: str

@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(request: ChangePasswordRequest, db = Depends(get_db)):
    """
    Change password for first-time login users with pre-generated passwords
    Verifies current password, updates to new password, and clears must_change_password flag
    """
    try:
        from sqlalchemy import text
        
        # Validate new password strength
        if len(request.new_password) < 8:
            return ChangePasswordResponse(
                success=False,
                message="New password must be at least 8 characters long"
            )
        
        # Get user data
        query = text("""
            SELECT id, email, password_hash, must_change_password, first_login, first_name, last_name
            FROM users
            WHERE id = :user_id
        """)
        
        result = db.execute(query, {"user_id": request.user_id})
        user_data = result.fetchone()
        
        if not user_data:
            logger.warning(f"Password change attempt for non-existent user_id: {request.user_id}")
            return ChangePasswordResponse(
                success=False,
                message="User not found"
            )
        
        # Verify current password
        try:
            if not bcrypt.checkpw(request.current_password.encode('utf-8'), user_data.password_hash.encode('utf-8')):
                logger.warning(f"Invalid current password for user_id: {request.user_id}")
                return ChangePasswordResponse(
                    success=False,
                    message="Current password is incorrect"
                )
        except Exception as pwd_error:
            logger.error(f"Password verification error: {str(pwd_error)}")
            return ChangePasswordResponse(
                success=False,
                message="Current password is incorrect"
            )
        
        # Hash new password
        new_password_hash = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update password and clear must_change_password flag
        update_query = text("""
            UPDATE users
            SET password_hash = :password_hash,
                must_change_password = FALSE,
                first_login = FALSE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
        """)
        
        db.execute(update_query, {
            "password_hash": new_password_hash,
            "user_id": request.user_id
        })
        db.commit()
        
        logger.info(f"✅ Password changed successfully for user_id: {request.user_id} ({user_data.email})")
        
        return ChangePasswordResponse(
            success=True,
            message="Password changed successfully! You can now use your new password to log in."
        )
        
    except Exception as e:
        logger.error(f"❌ Change password error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )