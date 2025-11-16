from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EmployeeBase(BaseModel):
    name: str
    initials: str
    contract_type: str
    weekly_hours: int = 40
    qualifications: list[str] = []
    email: str | None = None
    phone: str | None = None
    employee_number: str | None = None
    is_active: bool = True
    department: str | None = None
    notes: str | None = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: str | None = None
    initials: str | None = None
    contract_type: str | None = None
    weekly_hours: int | None = None
    qualifications: list[str] | None = None
    email: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    department: str | None = None
    notes: str | None = None


class EmployeeResponse(EmployeeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
