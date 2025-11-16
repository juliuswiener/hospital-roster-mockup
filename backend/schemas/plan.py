from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class PlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    month: str  # Format: YYYY-MM
    status: str = "draft"  # draft, active, archived
    optimization_mode: Optional[str] = None
    time_limit_seconds: Optional[int] = None
    selected_stations: List[str] = []
    schedule_data: Dict[str, Any] = {}
    solver_result: Optional[Dict[str, Any]] = None
    solver_status: Optional[str] = None
    is_auto_generated: bool = False


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    schedule_data: Optional[Dict[str, Any]] = None
    solver_result: Optional[Dict[str, Any]] = None
    solver_status: Optional[str] = None


class PlanResponse(PlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True
