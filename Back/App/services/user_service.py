from sqlalchemy.orm import Session
from models.user import User
from services.auth_service import AuthService
from typing import Optional

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.auth_service = AuthService(db)

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, username: str, email: str, password: str, full_name: str = None) -> User:
        """Create a new user"""
        hashed_password = self.auth_service.get_password_hash(password)
        
        db_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def get_users(self, skip: int = 0, limit: int = 100):
        """Get list of users with pagination"""
        return self.db.query(User).offset(skip).limit(limit).all()

    def update_user(self, user_id: int, **kwargs) -> Optional[User]:
        """Update user information"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: int) -> bool:
        """Delete a user"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        self.db.delete(user)
        self.db.commit()
        return True
