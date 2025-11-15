"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional, Any
from enum import Enum


class OptimizationMode(str, Enum):
    QUICK = "quick"
    OPTIMAL = "optimal"
    CUSTOM = "custom"


class Employee(BaseModel):
    name: str
    initials: str
    contract: Optional[str] = None
    hours: Optional[int] = 40
    qualifications: list[str] = []


class Shift(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    requirements: list[str] = []
    rules: list[str] = []
    station: Optional[str] = None
    time: Optional[str] = "08:00-16:00"


class Rule(BaseModel):
    id: Optional[int] = None
    type: str = "hard"  # hard or soft
    text: str
    source: Optional[str] = "form"
    category: Optional[str] = None
    appliesTo: Optional[str] = "all"


class FixedAssignment(BaseModel):
    employee: str  # Employee initials
    day: str
    shift: str


class SolverRequest(BaseModel):
    """Request to generate a new roster plan."""
    employees: list[Employee]
    shifts: list[Shift]
    days: list[int | str]
    rules: list[Rule] = []
    availability: dict[str, dict[str, str]] = {}
    fixed_assignments: list[FixedAssignment] = []
    optimization_mode: OptimizationMode = OptimizationMode.QUICK
    time_limit: Optional[int] = Field(default=30, ge=5, le=600)
    stations: list[str] = []


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobResponse(BaseModel):
    """Response containing job ID."""
    job_id: str
    message: str = "Job started"


class JobStatusResponse(BaseModel):
    """Response for job status check."""
    job_id: str
    status: JobStatus
    progress: float = 0.0
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


class ReplacementCandidate(BaseModel):
    """A candidate for shift replacement."""
    employee: Employee
    score: float
    factors: dict[str, Any]


class ReplacementRequest(BaseModel):
    """Request to find replacement for a shift."""
    shift: Shift
    day: str
    current_employee: Optional[str] = None
    available_employees: list[Employee]
    current_schedule: dict[str, dict[str, Any]] = {}


class ReplacementResponse(BaseModel):
    """Response with replacement candidates."""
    candidates: list[ReplacementCandidate]
    shift_info: dict[str, Any]


class ValidationError(BaseModel):
    """Validation error response."""
    detail: str
    errors: list[str] = []
