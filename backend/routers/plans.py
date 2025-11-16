from uuid import UUID

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from models.plan import Plan
from schemas.plan import PlanCreate, PlanResponse, PlanUpdate
from sqlalchemy.orm import Session

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/", response_model=list[PlanResponse])
def get_plans(db: Session = Depends(get_db)):
    """Get all plans, ordered by most recently updated"""
    return db.query(Plan).order_by(Plan.updated_at.desc()).all()


@router.get("/month/{month}", response_model=list[PlanResponse])
def get_plans_by_month(month: str, db: Session = Depends(get_db)):
    """Get all plans for a specific month (format: YYYY-MM)"""
    return db.query(Plan).filter(Plan.month == month).order_by(Plan.updated_at.desc()).all()


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: UUID, db: Session = Depends(get_db)):
    """Get a specific plan by ID"""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.post("/", response_model=PlanResponse)
def create_plan(plan: PlanCreate, db: Session = Depends(get_db)):
    """Create a new plan"""
    db_plan = Plan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(plan_id: UUID, plan: PlanUpdate, db: Session = Depends(get_db)):
    """Update an existing plan (e.g., when user manually edits assignments)"""
    db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    update_data = plan.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)

    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.patch("/{plan_id}/schedule", response_model=PlanResponse)
def update_plan_schedule(plan_id: UUID, schedule_data: dict, db: Session = Depends(get_db)):
    """Update only the schedule data of a plan (for manual edits)"""
    db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    db_plan.schedule_data = schedule_data  # type: ignore[assignment]
    db_plan.is_auto_generated = False  # type: ignore[assignment]
    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.delete("/{plan_id}")
def delete_plan(plan_id: UUID, db: Session = Depends(get_db)):
    """Delete a plan"""
    db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    db.delete(db_plan)
    db.commit()
    return {"message": "Plan deleted"}


@router.post("/{plan_id}/activate", response_model=PlanResponse)
def activate_plan(plan_id: UUID, db: Session = Depends(get_db)):
    """Mark a plan as active (and deactivate other plans for the same month)"""
    db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Deactivate other plans for the same month
    db.query(Plan).filter(Plan.month == db_plan.month, Plan.status == "active").update(
        {"status": "draft"}
    )

    # Activate this plan
    db_plan.status = "active"  # type: ignore[assignment]
    db.commit()
    db.refresh(db_plan)
    return db_plan
