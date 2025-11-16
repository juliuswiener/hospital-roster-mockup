from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class AssignmentBase(BaseModel):
    employee_id: UUID
    shift_id: UUID
    assignment_date: date
    station: str
    is_locked: bool = False
    notes: str | None = None


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    employee_id: UUID | None = None
    shift_id: UUID | None = None
    assignment_date: date | None = None
    station: str | None = None
    is_locked: bool | None = None
    notes: str | None = None


class AssignmentResponse(AssignmentBase):
    id: UUID
    has_violation: bool = False
    violations: list[str] = []
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None

    class Config:
        from_attributes = True
