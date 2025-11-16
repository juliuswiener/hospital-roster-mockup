from uuid import UUID

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from models.shift import Shift
from schemas.shift import ShiftCreate, ShiftResponse, ShiftUpdate
from sqlalchemy.orm import Session

router = APIRouter(prefix="/shifts", tags=["shifts"])


@router.get("/", response_model=list[ShiftResponse])
def get_shifts(db: Session = Depends(get_db)):
    return db.query(Shift).filter(Shift.is_active.is_(True)).order_by(Shift.sort_order).all()


@router.get("/{shift_id}", response_model=ShiftResponse)
def get_shift(shift_id: UUID, db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift


@router.post("/", response_model=ShiftResponse)
def create_shift(shift: ShiftCreate, db: Session = Depends(get_db)):
    db_shift = Shift(**shift.model_dump())
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift


@router.put("/{shift_id}", response_model=ShiftResponse)
def update_shift(shift_id: UUID, shift: ShiftUpdate, db: Session = Depends(get_db)):
    db_shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not db_shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    update_data = shift.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_shift, key, value)

    db.commit()
    db.refresh(db_shift)
    return db_shift


@router.delete("/{shift_id}")
def delete_shift(shift_id: UUID, db: Session = Depends(get_db)):
    db_shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not db_shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    db_shift.is_active = False  # type: ignore[assignment]
    db.commit()
    return {"message": "Shift deactivated"}
