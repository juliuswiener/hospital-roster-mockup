from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid
from datetime import datetime


class MonthlyAvailability(Base):
    __tablename__ = "monthly_availabilities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    month = Column(String(7), nullable=False, unique=True)  # Format: YYYY-MM

    # The availability data (employee_initials -> day -> availability_code)
    availability_data = Column(JSON, nullable=False, default={})

    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
