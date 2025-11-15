from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime


class Employee(Base):
    __tablename__ = "employees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    initials = Column(String(10), nullable=False, unique=True)
    contract_type = Column(String(50), nullable=False)
    weekly_hours = Column(Integer, nullable=False, default=40)
    qualifications = Column(ARRAY(String), default=[])
    email = Column(String(255))
    phone = Column(String(50))
    employee_number = Column(String(50))
    is_active = Column(Boolean, default=True)
    department = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    assignments = relationship("ShiftAssignment", back_populates="employee")
