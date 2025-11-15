from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class RuleBase(BaseModel):
    rule_type: str  # 'hard' or 'soft'
    rule_text: str
    category: str
    applies_to: str = "all"
    source: str = "form"
    weight: int = 5
    is_active: bool = True
    parameters: Dict[str, Any] = {}


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    rule_type: Optional[str] = None
    rule_text: Optional[str] = None
    category: Optional[str] = None
    applies_to: Optional[str] = None
    weight: Optional[int] = None
    is_active: Optional[bool] = None
    parameters: Optional[Dict[str, Any]] = None


class RuleResponse(RuleBase):
    id: UUID
    created_at: datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True
