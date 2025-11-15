from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class ShiftBase(BaseModel):
    name: str
    display_name: Optional[str] = None
    category: str
    description: Optional[str] = None
    station: str
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    duration_minutes: Optional[int] = None
    requirements: List[str] = []
    rules: List[str] = []
    color: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class ShiftCreate(ShiftBase):
    pass


class ShiftUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    station: Optional[str] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    duration_minutes: Optional[int] = None
    requirements: Optional[List[str]] = None
    rules: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ShiftResponse(ShiftBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
