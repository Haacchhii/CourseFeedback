from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from services.user_service import UserService
from routes.auth import oauth2_scheme
from services.auth_service import AuthService
from pydantic import BaseModel
from typing import List

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool

@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    """Get user profile"""
    auth_service = AuthService(db)
    current_user = auth_service.get_current_user(token)
    
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active
    )

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0, 
    limit: int = 100,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get list of users (admin only)"""
    auth_service = AuthService(db)
    current_user = auth_service.get_current_user(token)
    
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user_service = UserService(db)
    users = user_service.get_users(skip=skip, limit=limit)
    
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active
        ) for user in users
    ]
