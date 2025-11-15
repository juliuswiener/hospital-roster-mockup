"""API routes for roster generation."""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime
import uuid
import asyncio

from .schemas import (
    SolverRequest,
    JobResponse,
    JobStatusResponse,
    JobStatus,
    ReplacementRequest,
    ReplacementResponse,
    ReplacementCandidate,
    OptimizationMode
)
from ..solver.model import RosterSolver, validate_input_data

router = APIRouter()

# In-memory job storage (use Redis/database in production)
jobs: dict[str, JobStatusResponse] = {}


def get_time_limit(mode: OptimizationMode, custom_limit: int) -> int:
    """Get time limit based on optimization mode."""
    if mode == OptimizationMode.QUICK:
        return 30
    elif mode == OptimizationMode.OPTIMAL:
        return 300
    else:  # CUSTOM
        return custom_limit


async def run_solver_task(job_id: str, data: dict, time_limit: int):
    """Background task to run the solver."""
    try:
        jobs[job_id].status = JobStatus.RUNNING
        jobs[job_id].progress = 0.1

        # Validate input data
        is_valid, errors = validate_input_data(data)
        if not is_valid:
            jobs[job_id].status = JobStatus.FAILED
            jobs[job_id].error = f"Validation errors: {', '.join(errors)}"
            return

        jobs[job_id].progress = 0.2

        # Create and run solver
        solver = RosterSolver(data)
        jobs[job_id].progress = 0.3

        # Run solver (this is CPU-bound, ideally run in thread pool)
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: solver.solve(time_limit_seconds=time_limit)
        )

        jobs[job_id].progress = 0.9

        # Check result
        if result['status'] in ['OPTIMAL', 'FEASIBLE']:
            jobs[job_id].status = JobStatus.COMPLETED
            jobs[job_id].result = result
            jobs[job_id].progress = 1.0
        else:
            jobs[job_id].status = JobStatus.FAILED
            jobs[job_id].error = f"Solver returned status: {result['status']}"

        jobs[job_id].completed_at = datetime.now().isoformat()

    except Exception as e:
        jobs[job_id].status = JobStatus.FAILED
        jobs[job_id].error = str(e)
        jobs[job_id].completed_at = datetime.now().isoformat()


@router.post("/generate-plan", response_model=JobResponse)
async def generate_plan(request: SolverRequest, background_tasks: BackgroundTasks):
    """
    Start a new plan generation job.

    This endpoint starts an asynchronous optimization job and returns immediately
    with a job ID that can be used to check progress.
    """
    job_id = str(uuid.uuid4())

    # Create job entry
    jobs[job_id] = JobStatusResponse(
        job_id=job_id,
        status=JobStatus.PENDING,
        progress=0.0,
        created_at=datetime.now().isoformat()
    )

    # Prepare data for solver
    solver_data = {
        'employees': [emp.model_dump() for emp in request.employees],
        'shifts': [shift.model_dump() for shift in request.shifts],
        'days': [str(d) for d in request.days],
        'rules': [rule.model_dump() for rule in request.rules],
        'availability': request.availability,
        'fixed_assignments': [fa.model_dump() for fa in request.fixed_assignments]
    }

    # Get time limit
    time_limit = get_time_limit(request.optimization_mode, request.time_limit or 30)

    # Start background task
    background_tasks.add_task(run_solver_task, job_id, solver_data, time_limit)

    return JobResponse(job_id=job_id, message=f"Plan generation started with {time_limit}s time limit")


@router.get("/job-status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get the status of a plan generation job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    return jobs[job_id]


@router.delete("/job/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a running job (not implemented yet)."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    # In production, would need to actually cancel the running task
    if jobs[job_id].status == JobStatus.RUNNING:
        jobs[job_id].status = JobStatus.FAILED
        jobs[job_id].error = "Job cancelled by user"

    return {"message": "Job cancelled"}


@router.post("/find-replacement", response_model=ReplacementResponse)
async def find_replacement(request: ReplacementRequest):
    """
    Find best replacement candidates for a shift.

    This uses scoring to rank available employees based on:
    - Qualification match
    - Current workload
    - Fairness (previous shift counts)
    - Preferences
    """
    candidates = []

    for emp in request.available_employees:
        score, factors = calculate_replacement_score(
            emp.model_dump(),
            request.shift.model_dump(),
            request.day,
            request.current_schedule
        )

        candidates.append(ReplacementCandidate(
            employee=emp,
            score=score,
            factors=factors
        ))

    # Sort by score descending
    candidates.sort(key=lambda x: x.score, reverse=True)

    # Return top 3
    return ReplacementResponse(
        candidates=candidates[:3],
        shift_info={
            'shift': request.shift.model_dump(),
            'day': request.day,
            'original_employee': request.current_employee
        }
    )


def calculate_replacement_score(
    employee: dict,
    shift: dict,
    day: str,
    current_schedule: dict
) -> tuple[float, dict]:
    """
    Calculate score for an employee as a replacement.

    Returns:
        Tuple of (total_score, factor_breakdown)
    """
    factors = {}
    total_score = 0.0

    # 1. Qualification match (40% weight)
    qual_score = check_qualification_match(employee, shift)
    factors['qualification_match'] = qual_score
    total_score += qual_score * 0.4

    # 2. Current workload (30% weight) - prefer employees with fewer shifts
    workload_score = calculate_workload_score(employee, current_schedule)
    factors['workload_balance'] = workload_score
    total_score += workload_score * 0.3

    # 3. Availability (20% weight)
    availability_score = 100.0  # Assume available since they're in the list
    factors['availability'] = availability_score
    total_score += availability_score * 0.2

    # 4. Recent rest (10% weight) - check if had enough rest
    rest_score = calculate_rest_score(employee, day, current_schedule)
    factors['rest_compliance'] = rest_score
    total_score += rest_score * 0.1

    return round(total_score, 1), factors


def check_qualification_match(employee: dict, shift: dict) -> float:
    """Check if employee has required qualifications."""
    required = set()
    for req in shift.get('requirements', []):
        # Extract qualification keywords
        for qual in ['Facharzt', 'Oberarzt', 'Chefarzt', 'ABS-zertifiziert',
                     'Notfallzertifizierung', 'Intensivmedizin']:
            if qual.lower() in req.lower():
                required.add(qual)

    if not required:
        return 100.0

    emp_quals = set(employee.get('qualifications', []))
    matched = required.intersection(emp_quals)

    if len(required) == 0:
        return 100.0

    return (len(matched) / len(required)) * 100


def calculate_workload_score(employee: dict, current_schedule: dict) -> float:
    """Score based on current workload (fewer shifts = higher score)."""
    emp_initials = employee.get('initials')
    emp_schedule = current_schedule.get(emp_initials, {})

    # Count current shifts
    shift_count = sum(1 for day_data in emp_schedule.values() if day_data.get('shift'))

    # Assume average is around 20 shifts per month
    if shift_count < 15:
        return 100.0
    elif shift_count < 20:
        return 80.0
    elif shift_count < 25:
        return 60.0
    else:
        return 40.0


def calculate_rest_score(employee: dict, day: str, current_schedule: dict) -> float:
    """Check if employee had sufficient rest before this shift."""
    emp_initials = employee.get('initials')
    emp_schedule = current_schedule.get(emp_initials, {})

    # Check previous day
    try:
        day_num = int(day)
        prev_day = str(day_num - 1)

        if prev_day in emp_schedule:
            prev_shift = emp_schedule[prev_day].get('shift')
            if prev_shift:
                # Had a shift yesterday - might not have enough rest
                # In production, check actual shift times
                return 70.0

        return 100.0
    except ValueError:
        return 100.0


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "jobs_in_memory": len(jobs),
        "timestamp": datetime.now().isoformat()
    }
