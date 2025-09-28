# Authentication Routes
# Handles user login and authentication

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
import bcrypt
import logging
from database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    user: Optional[dict] = None
    message: Optional[str] = None

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db = Depends(get_db)):
    """
    Authenticate user with email and password
    Returns user data if authentication successful
    """
    try:
        # Query database for user
        cursor = db.cursor()
        
        # Check in users table for secretary, department_head, or student
        cursor.execute("""
            SELECT u.id, u.email, u.role, u.password_hash,
                   CASE 
                       WHEN u.role = 'secretary' THEN s.name
                       WHEN u.role = 'department_head' THEN dh.first_name || ' ' || dh.last_name
                       WHEN u.role = 'student' THEN st.first_name || ' ' || st.last_name
                   END as name,
                   CASE 
                       WHEN u.role = 'secretary' THEN s.department
                       WHEN u.role = 'department_head' THEN dh.department
                       WHEN u.role = 'student' THEN p.name
                   END as department_or_program
            FROM users u
            LEFT JOIN secretaries s ON u.id = s.user_id AND u.role = 'secretary'
            LEFT JOIN department_heads dh ON u.id = dh.user_id AND u.role = 'department_head'  
            LEFT JOIN students st ON u.id = st.user_id AND u.role = 'student'
            LEFT JOIN programs p ON st.program_id = p.id
            WHERE LOWER(u.email) = %s
        """, (request.email.lower(),))
        
        user_data = cursor.fetchone()
        
        if not user_data:
            return LoginResponse(success=False, message="User not found")
        
        # Verify password
        stored_hash = user_data['password_hash']
        if not bcrypt.checkpw(request.password.encode('utf-8'), stored_hash.encode('utf-8')):
            return LoginResponse(success=False, message="Invalid password")
        
        # Build user object
        user = {
            'id': user_data['id'],
            'email': user_data['email'], 
            'role': user_data['role'],
            'name': user_data['name'],
            'department': user_data['department_or_program'] if user_data['role'] != 'student' else None,
            'program': user_data['department_or_program'] if user_data['role'] == 'student' else None
        }
        
        logger.info(f"User {request.email} logged in successfully with role {user['role']}")
        return LoginResponse(success=True, user=user)
        
    except Exception as e:
        logger.error(f"Login error for {request.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )