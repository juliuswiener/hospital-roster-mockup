import uuid
from datetime import datetime

from database import Base
from sqlalchemy import ARRAY, Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False, unique=True)
    display_name = Column(String(255))
    category = Column(String(100), nullable=False)
    description = Column(Text)
    station = Column(String(100), nullable=False)
    time_start = Column(String(10))
    time_end = Column(String(10))
    duration_minutes = Column(Integer)
    requirements: Column[list[str]] = Column(ARRAY(String), default=[])
    rules: Column[list[str]] = Column(ARRAY(String), default=[])
    color = Column(String(50))
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assignments = relationship("ShiftAssignment", back_populates="shift")
