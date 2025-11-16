from datetime import date
from uuid import UUID

from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from models.assignment import ShiftAssignment
from schemas.assignment import AssignmentCreate, AssignmentResponse, AssignmentUpdate
from sqlalchemy.orm import Session

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("/", response_model=list[AssignmentResponse])
def get_assignments(
    start_date: date = Query(...),
    end_date: date = Query(...),
    employee_id: UUID | None = Query(None),
    shift_id: UUID | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(ShiftAssignment).filter(
        ShiftAssignment.assignment_date >= start_date,
        ShiftAssignment.assignment_date <= end_date,
    )

    if employee_id:
        query = query.filter(ShiftAssignment.employee_id == employee_id)

    if shift_id:
        query = query.filter(ShiftAssignment.shift_id == shift_id)

    return query.order_by(ShiftAssignment.assignment_date).all()


@router.post("/", response_model=AssignmentResponse)
def create_assignment(assignment: AssignmentCreate, db: Session = Depends(get_db)):
    # Check for double booking
    existing = (
        db.query(ShiftAssignment)
        .filter(
            ShiftAssignment.employee_id == assignment.employee_id,
            ShiftAssignment.assignment_date == assignment.assignment_date,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Employee already has assignment on {assignment.assignment_date}",
        )

    db_assignment = ShiftAssignment(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@router.post("/bulk", response_model=list[AssignmentResponse])
def create_assignments_bulk(assignments: list[AssignmentCreate], db: Session = Depends(get_db)):
    created = []
    for assignment_data in assignments:
        db_assignment = ShiftAssignment(**assignment_data.model_dump())
        db.add(db_assignment)
        created.append(db_assignment)

    db.commit()
    for assignment in created:
        db.refresh(assignment)

    return created


@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: UUID, assignment: AssignmentUpdate, db: Session = Depends(get_db)
):
    db_assignment = db.query(ShiftAssignment).filter(ShiftAssignment.id == assignment_id).first()

    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if db_assignment.is_locked:
        raise HTTPException(status_code=400, detail="Assignment is locked")

    update_data = assignment.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_assignment, key, value)

    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@router.delete("/{assignment_id}")
def delete_assignment(assignment_id: UUID, db: Session = Depends(get_db)):
    db_assignment = db.query(ShiftAssignment).filter(ShiftAssignment.id == assignment_id).first()

    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if db_assignment.is_locked:
        raise HTTPException(status_code=400, detail="Assignment is locked")

    db.delete(db_assignment)
    db.commit()
    return {"message": "Assignment deleted"}
