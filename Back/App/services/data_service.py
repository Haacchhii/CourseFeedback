from sqlalchemy.orm import Session
from models.data import DataModel
from typing import Optional, List

class DataService:
    def __init__(self, db: Session):
        self.db = db

    def create_data(self, title: str, data_content: str, user_id: int, description: str = None) -> DataModel:
        """Create a new data entry"""
        db_data = DataModel(
            title=title,
            description=description,
            data_content=data_content,
            user_id=user_id
        )
        
        self.db.add(db_data)
        self.db.commit()
        self.db.refresh(db_data)
        return db_data

    def get_data_by_id(self, data_id: int) -> Optional[DataModel]:
        """Get data entry by ID"""
        return self.db.query(DataModel).filter(DataModel.id == data_id).first()

    def get_user_data(self, user_id: int, skip: int = 0, limit: int = 100) -> List[DataModel]:
        """Get all data entries for a specific user"""
        return self.db.query(DataModel).filter(
            DataModel.user_id == user_id
        ).offset(skip).limit(limit).all()

    def update_data(self, data_id: int, **kwargs) -> Optional[DataModel]:
        """Update data entry"""
        data = self.get_data_by_id(data_id)
        if not data:
            return None
        
        for key, value in kwargs.items():
            if hasattr(data, key):
                setattr(data, key, value)
        
        self.db.commit()
        self.db.refresh(data)
        return data

    def delete_data(self, data_id: int) -> bool:
        """Delete a data entry"""
        data = self.get_data_by_id(data_id)
        if not data:
            return False
        
        self.db.delete(data)
        self.db.commit()
        return True

    def get_all_data(self, skip: int = 0, limit: int = 100) -> List[DataModel]:
        """Get all data entries (admin function)"""
        return self.db.query(DataModel).offset(skip).limit(limit).all()
