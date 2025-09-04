from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from services.data_service import DataService
from routes.auth import oauth2_scheme
from services.auth_service import AuthService
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class DataCreate(BaseModel):
    title: str
    description: Optional[str] = None
    data_content: str

class DataResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    data_content: str
    user_id: int

@router.post("/", response_model=DataResponse)
async def create_data(
    data: DataCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Create new data entry"""
    auth_service = AuthService(db)
    current_user = auth_service.get_current_user(token)
    
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    data_service = DataService(db)
    new_data = data_service.create_data(
        title=data.title,
        description=data.description,
        data_content=data.data_content,
        user_id=current_user.id
    )
    
    return DataResponse(
        id=new_data.id,
        title=new_data.title,
        description=new_data.description,
        data_content=new_data.data_content,
        user_id=new_data.user_id
    )

@router.get("/", response_model=List[DataResponse])
async def get_user_data(
    skip: int = 0,
    limit: int = 100,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get user's data entries"""
    auth_service = AuthService(db)
    current_user = auth_service.get_current_user(token)
    
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    data_service = DataService(db)
    data_entries = data_service.get_user_data(current_user.id, skip=skip, limit=limit)
    
    return [
        DataResponse(
            id=entry.id,
            title=entry.title,
            description=entry.description,
            data_content=entry.data_content,
            user_id=entry.user_id
        ) for entry in data_entries
    ]

@router.get("/{data_id}", response_model=DataResponse)
async def get_data_by_id(
    data_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get specific data entry by ID"""
    auth_service = AuthService(db)
    current_user = auth_service.get_current_user(token)
    
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    data_service = DataService(db)
    data_entry = data_service.get_data_by_id(data_id)
    
    if not data_entry or data_entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data not found"
        )
    
    return DataResponse(
        id=data_entry.id,
        title=data_entry.title,
        description=data_entry.description,
        data_content=data_entry.data_content,
        user_id=data_entry.user_id
    )
