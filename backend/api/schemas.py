"""Pydantic schemas for API request/response validation."""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class OptimizationMode(str, Enum):
    QUICK = "quick"
    OPTIMAL = "optimal"
    CUSTOM = "custom"


class Employee(BaseModel):
    name: str
    initials: str
    contract: str | None = None
    hours: int | None = 40
    qualifications: list[str] = []


class Shift(BaseModel):
    name: str
    category: str | None = None
    description: str | None = None
    requirements: list[str] = []
    rules: list[str] = []
    station: str | None = None
    time: str | None = "08:00-16:00"


class Rule(BaseModel):
    id: int | str | None = None
    type: str = "hard"  # hard or soft
    text: str
    source: str | None = "form"
    category: str | None = None
    appliesTo: str | None = "all"
    weight: int = 5
    isActive: bool = True
    parameters: dict[str, Any] = {}


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
    time_limit: int | None = Field(default=30, ge=5, le=600)
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
    result: dict | None = None
    error: str | None = None
    created_at: str | None = None
    completed_at: str | None = None


class ReplacementCandidate(BaseModel):
    """A candidate for shift replacement."""

    employee: Employee
    score: float
    factors: dict[str, Any]


class ReplacementRequest(BaseModel):
    """Request to find replacement for a shift."""

    shift: Shift
    day: str
    current_employee: str | None = None
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


# Rule parsing schemas
class RuleParsingRequest(BaseModel):
    """Request to parse natural language rules."""

    rule_texts: list[str]
    employees: list[Employee]
    shifts: list[Shift]
    availability_codes: dict[str, str] = {
        "U": "Urlaub",
        "K": "Krank",
        "SU": "Sonderurlaub",
        "MU": "Mutterschutz",
        "EZ": "Elternzeit",
        "BV": "Beschäftigungsverbot",
        "uw": "Unbezahlter Urlaub",
    }


class ParsedRuleResponse(BaseModel):
    """Response for a single parsed rule."""

    original_text: str
    rule_type: str
    category: str
    applies_to: str
    employee_name: str | None = None
    shift_name: str | None = None
    day_constraint: str | None = None
    time_period: str | None = None
    constraint_description: str
    confidence: float
    warnings: list[str] = []
    ambiguities: list[str] = []
    suggestions: list[str] = []
    llm_feedback: str | None = None  # LLM's feedback about issues


class RuleParsingResponse(BaseModel):
    """Response containing all parsed rules."""

    parsed_rules: list[ParsedRuleResponse]
    total_warnings: int
    total_ambiguities: int
    has_critical_issues: bool
