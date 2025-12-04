"""
Authentication Middleware and Dependencies
Provides JWT token validation and role-based access control
"""

from fastapi import HTTPException, status, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional, List
from sqlalchemy import text
from database.connection import get_db
import os
import logging

logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set!")
ALGORITHM = "HS256"

# Security scheme for Swagger UI
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_db)
) -> dict:
    """
    Validate JWT token and return current user data
    
    Usage:
        @router.get("/protected")
        async def protected_route(current_user: dict = Depends(get_current_user)):
            # current_user contains: id, email, role, etc.
            pass
    
    Raises:
        HTTPException 401: If token is invalid, expired, or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extract token from credentials
        token = credentials.credentials
        
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None or email is None or role is None:
            logger.warning(f"Invalid token payload: missing user_id, email, or role")
            raise credentials_exception
            
    except JWTError as e:
        logger.warning(f"JWT validation error: {str(e)}")
        raise credentials_exception
    
    # Verify user still exists and is active
    try:
        query = text("""
            SELECT id, email, role, first_name, last_name, department, 
                   school_id, is_active, must_change_password
            FROM users
            WHERE id = :user_id AND email = :email
        """)
        
        result = db.execute(query, {"user_id": user_id, "email": email})
        user_data = result.fetchone()
        
        if not user_data:
            logger.warning(f"User {user_id} ({email}) not found in database")
            raise credentials_exception
        
        if not user_data.is_active:
            logger.warning(f"Inactive user {user_id} ({email}) attempted access")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        # Return user data as dict
        return {
            'id': user_data.id,
            'email': user_data.email,
            'role': user_data.role,
            'firstName': user_data.first_name,
            'lastName': user_data.last_name,
            'department': user_data.department,
            'schoolId': user_data.school_id,
            'isActive': user_data.is_active,
            'mustChangePassword': user_data.must_change_password
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        raise credentials_exception


def require_role(allowed_roles: List[str]):
    """
    Dependency factory that checks if user has one of the allowed roles
    
    Usage:
        @router.get("/admin-only")
        async def admin_route(current_user: dict = Depends(require_role(["admin"]))):
            # Only admins can access this
            pass
        
        @router.get("/staff-only")
        async def staff_route(
            current_user: dict = Depends(require_role(["admin", "secretary", "department_head"]))
        ):
            # Admins, secretaries, and department heads can access
            pass
    
    Args:
        allowed_roles: List of role names that can access the endpoint
        
    Returns:
        Dependency function that validates user role
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user['role'] not in allowed_roles:
            logger.warning(
                f"User {current_user['id']} ({current_user['email']}) "
                f"with role '{current_user['role']}' attempted to access "
                f"endpoint requiring roles: {allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency that requires admin role
    
    Usage:
        @router.post("/users")
        async def create_user(current_user: dict = Depends(require_admin)):
            # Only admins can access
            pass
    """
    if current_user['role'] != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_staff(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency that requires admin, secretary, or department_head role
    
    Usage:
        @router.get("/reports")
        async def get_reports(current_user: dict = Depends(require_staff)):
            # Staff members can access
            pass
    """
    if current_user['role'] not in ['admin', 'secretary', 'department_head']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )
    return current_user


def require_student(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency that requires student role
    
    Usage:
        @router.post("/evaluations")
        async def submit_evaluation(current_user: dict = Depends(require_student)):
            # Only students can access
            pass
    """
    if current_user['role'] != 'student':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )
    return current_user


def require_own_resource(resource_user_id: int):
    """
    Dependency factory that checks if user is accessing their own resource
    (or is an admin/staff who can access any resource)
    
    Usage:
        @router.get("/students/{student_id}/courses")
        async def get_student_courses(
            student_id: int,
            current_user: dict = Depends(get_current_user)
        ):
            # Check if user can access this student's data
            require_own_resource(student_id)(current_user)
            # ... rest of code
    
    Args:
        resource_user_id: The user ID of the resource being accessed
        
    Returns:
        Function that validates access
    """
    def checker(current_user: dict = Depends(get_current_user)) -> dict:
        # Admins and staff can access any resource
        if current_user['role'] in ['admin', 'secretary', 'department_head']:
            return current_user
        
        # Students can only access their own resources
        if current_user['id'] != resource_user_id:
            logger.warning(
                f"User {current_user['id']} ({current_user['email']}) "
                f"attempted to access resource belonging to user {resource_user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own resources"
            )
        
        return current_user
    
    return checker


# Optional authentication (for public endpoints that have different behavior when authenticated)
async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
) -> Optional[dict]:
    """
    Optional authentication - returns user if token is valid, None otherwise
    
    Usage:
        @router.get("/public-or-private")
        async def flexible_route(current_user: Optional[dict] = Depends(get_current_user_optional)):
            if current_user:
                # User is logged in
                pass
            else:
                # Anonymous access
                pass
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        
        if not user_id:
            return None
        
        query = text("SELECT * FROM users WHERE id = :user_id AND is_active = true")
        result = db.execute(query, {"user_id": user_id})
        user_data = result.fetchone()
        
        if user_data:
            return {
                'id': user_data.id,
                'email': user_data.email,
                'role': user_data.role
            }
    except:
        pass
    
    return None
