from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime


class AssignmentBase(BaseModel):
    employee_id: UUID
    shift_id: UUID
    assignment_date: date
    station: str
    is_locked: bool = False
    notes: Optional[str] = None


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    employee_id: Optional[UUID] = None
    shift_id: Optional[UUID] = None
    assignment_date: Optional[date] = None
    station: Optional[str] = None
    is_locked: Optional[bool] = None
    notes: Optional[str] = None


class AssignmentResponse(AssignmentBase):
    id: UUID
    has_violation: bool = False
    violations: List[str] = []
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True
