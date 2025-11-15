from sqlalchemy import Column, String, Date, Boolean, Text, ForeignKey, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime


class ShiftAssignment(Base):
    __tablename__ = "shift_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(
        UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False
    )
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id"), nullable=False)
    assignment_date = Column(Date, nullable=False)
    station = Column(String(100), nullable=False)
    is_locked = Column(Boolean, default=False)
    has_violation = Column(Boolean, default=False)
    violations = Column(ARRAY(String), default=[])
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    created_by = Column(String(255))

    # Relationships
    employee = relationship("Employee", back_populates="assignments")
    shift = relationship("Shift", back_populates="assignments")
