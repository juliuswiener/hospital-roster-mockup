from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from database import get_db
from models.rule import SchedulingRule
from schemas.rule import RuleCreate, RuleUpdate, RuleResponse

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("/", response_model=List[RuleResponse])
def get_rules(db: Session = Depends(get_db)):
    return db.query(SchedulingRule).filter(SchedulingRule.is_active == True).all()


@router.get("/all", response_model=List[RuleResponse])
def get_all_rules(db: Session = Depends(get_db)):
    return db.query(SchedulingRule).all()


@router.get("/{rule_id}", response_model=RuleResponse)
def get_rule(rule_id: UUID, db: Session = Depends(get_db)):
    rule = db.query(SchedulingRule).filter(SchedulingRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.post("/", response_model=RuleResponse)
def create_rule(rule: RuleCreate, db: Session = Depends(get_db)):
    db_rule = SchedulingRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(rule_id: UUID, rule: RuleUpdate, db: Session = Depends(get_db)):
    db_rule = db.query(SchedulingRule).filter(SchedulingRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    update_data = rule.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_rule, key, value)

    db.commit()
    db.refresh(db_rule)
    return db_rule


@router.delete("/{rule_id}")
def delete_rule(rule_id: UUID, db: Session = Depends(get_db)):
    db_rule = db.query(SchedulingRule).filter(SchedulingRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(db_rule)
    db.commit()
    return {"message": "Rule deleted"}
