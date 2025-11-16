from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class PlanBase(BaseModel):
    name: str
    description: str | None = None
    month: str  # Format: YYYY-MM
    status: str = "draft"  # draft, active, archived
    optimization_mode: str | None = None
    time_limit_seconds: int | None = None
    selected_stations: list[str] = []
    schedule_data: dict[str, Any] = {}
    solver_result: dict[str, Any] | None = None
    solver_status: str | None = None
    is_auto_generated: bool = False


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    schedule_data: dict[str, Any] | None = None
    solver_result: dict[str, Any] | None = None
    solver_status: str | None = None


class PlanResponse(PlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None

    class Config:
        from_attributes = True
