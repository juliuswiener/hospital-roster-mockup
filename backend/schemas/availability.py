from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class AvailabilityBase(BaseModel):
    month: str  # Format: YYYY-MM
    availability_data: Dict[str, Any] = {}


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityUpdate(BaseModel):
    availability_data: Dict[str, Any]


class AvailabilityResponse(AvailabilityBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
