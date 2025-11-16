import uuid
from datetime import datetime

from database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID


class SchedulingRule(Base):
    __tablename__ = "scheduling_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_type = Column(String(10), nullable=False)  # 'hard' or 'soft'
    rule_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    applies_to = Column(String(255), default="all")
    source = Column(String(50), default="form")
    weight = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    parameters = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_by = Column(String(255))
