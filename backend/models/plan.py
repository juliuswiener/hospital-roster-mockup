import uuid
from datetime import datetime

from database import Base
from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


class Plan(Base):
    __tablename__ = "plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    month = Column(String(7), nullable=False)  # Format: YYYY-MM
    status = Column(String(50), default="draft")  # draft, active, archived

    # Optimization settings used
    optimization_mode = Column(String(50))  # quick, optimal, custom
    time_limit_seconds = Column(Integer)
    selected_stations = Column(JSON, default=[])

    # The actual schedule data (employee -> day -> assignment)
    schedule_data = Column(JSON, nullable=False, default={})

    # Solver results (if auto-generated)
    solver_result = Column(JSON)
    solver_status = Column(String(50))  # OPTIMAL, FEASIBLE, INFEASIBLE, etc.

    # Metadata
    is_auto_generated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255))

    # Relationships
    assignments = relationship(
        "ShiftAssignment", back_populates="plan", cascade="all, delete-orphan"
    )
