from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class AvailabilityBase(BaseModel):
    month: str  # Format: YYYY-MM
    availability_data: dict[str, Any] = {}


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityUpdate(BaseModel):
    availability_data: dict[str, Any]


class AvailabilityResponse(AvailabilityBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
