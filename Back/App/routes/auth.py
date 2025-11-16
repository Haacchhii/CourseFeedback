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
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
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
            SELECT id, email, role, password_hash, first_name, last_name, department, is_active
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
            'firstName': user_data.first_name,
            'lastName': user_data.last_name
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