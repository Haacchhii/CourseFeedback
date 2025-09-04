from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base

class DataModel(Base):
    __tablename__ = "data_models"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    data_content = Column(Text)  # JSON string or raw data
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    owner = relationship("User", back_populates="data_models")
    
    def __repr__(self):
        return f"<DataModel(id={self.id}, title='{self.title}', user_id={self.user_id})>"
