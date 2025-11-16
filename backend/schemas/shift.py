from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ShiftBase(BaseModel):
    name: str
    display_name: str | None = None
    category: str
    description: str | None = None
    station: str
    time_start: str | None = None
    time_end: str | None = None
    duration_minutes: int | None = None
    requirements: list[str] = []
    rules: list[str] = []
    color: str | None = None
    is_active: bool = True
    sort_order: int = 0


class ShiftCreate(ShiftBase):
    pass


class ShiftUpdate(BaseModel):
    name: str | None = None
    display_name: str | None = None
    category: str | None = None
    description: str | None = None
    station: str | None = None
    time_start: str | None = None
    time_end: str | None = None
    duration_minutes: int | None = None
    requirements: list[str] | None = None
    rules: list[str] | None = None
    is_active: bool | None = None


class ShiftResponse(ShiftBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
