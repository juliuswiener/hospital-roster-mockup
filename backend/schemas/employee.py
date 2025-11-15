from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class EmployeeBase(BaseModel):
    name: str
    initials: str
    contract_type: str
    weekly_hours: int = 40
    qualifications: List[str] = []
    email: Optional[str] = None
    phone: Optional[str] = None
    employee_number: Optional[str] = None
    is_active: bool = True
    department: Optional[str] = None
    notes: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    initials: Optional[str] = None
    contract_type: Optional[str] = None
    weekly_hours: Optional[int] = None
    qualifications: Optional[List[str]] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    department: Optional[str] = None
    notes: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
