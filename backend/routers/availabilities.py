from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from models.availability import MonthlyAvailability
from schemas.availability import AvailabilityCreate, AvailabilityResponse, AvailabilityUpdate
from sqlalchemy.orm import Session

router = APIRouter(prefix="/availabilities", tags=["availabilities"])


@router.get("/", response_model=list[AvailabilityResponse])
def get_all_availabilities(db: Session = Depends(get_db)):
    """Get all monthly availabilities"""
    return db.query(MonthlyAvailability).order_by(MonthlyAvailability.month.desc()).all()


@router.get("/month/{month}", response_model=AvailabilityResponse)
def get_availability_by_month(month: str, db: Session = Depends(get_db)):
    """Get availability data for a specific month (format: YYYY-MM)"""
    availability = db.query(MonthlyAvailability).filter(MonthlyAvailability.month == month).first()
    if not availability:
        raise HTTPException(status_code=404, detail=f"No availability data for month {month}")
    return availability


@router.post("/", response_model=AvailabilityResponse)
def create_availability(availability: AvailabilityCreate, db: Session = Depends(get_db)):
    """Create availability data for a month"""
    # Check if month already exists
    existing = (
        db.query(MonthlyAvailability)
        .filter(MonthlyAvailability.month == availability.month)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail=f"Availability for month {availability.month} already exists"
        )

    db_availability = MonthlyAvailability(**availability.model_dump())
    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)
    return db_availability


@router.put("/month/{month}", response_model=AvailabilityResponse)
def update_availability(
    month: str, availability: AvailabilityUpdate, db: Session = Depends(get_db)
):
    """Update availability data for a month (creates if not exists)"""
    db_availability = (
        db.query(MonthlyAvailability).filter(MonthlyAvailability.month == month).first()
    )

    if not db_availability:
        # Create new if doesn't exist
        db_availability = MonthlyAvailability(
            month=month, availability_data=availability.availability_data
        )
        db.add(db_availability)
    else:
        # Update existing
        db_availability.availability_data = availability.availability_data  # type: ignore[assignment]

    db.commit()
    db.refresh(db_availability)
    return db_availability


@router.delete("/month/{month}")
def delete_availability(month: str, db: Session = Depends(get_db)):
    """Delete availability data for a month"""
    db_availability = (
        db.query(MonthlyAvailability).filter(MonthlyAvailability.month == month).first()
    )
    if not db_availability:
        raise HTTPException(status_code=404, detail=f"No availability data for month {month}")

    db.delete(db_availability)
    db.commit()
    return {"message": f"Availability for {month} deleted"}
