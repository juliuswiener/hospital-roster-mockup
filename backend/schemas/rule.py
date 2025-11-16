from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class RuleBase(BaseModel):
    rule_type: str  # 'hard' or 'soft'
    rule_text: str
    category: str
    applies_to: str = "all"
    source: str = "form"
    weight: int = 5
    is_active: bool = True
    parameters: dict[str, Any] = {}


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    rule_type: str | None = None
    rule_text: str | None = None
    category: str | None = None
    applies_to: str | None = None
    weight: int | None = None
    is_active: bool | None = None
    parameters: dict[str, Any] | None = None


class RuleResponse(RuleBase):
    id: UUID
    created_at: datetime
    created_by: str | None = None

    class Config:
        from_attributes = True
