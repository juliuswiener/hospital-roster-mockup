#!/usr/bin/env python3
"""
Script to create all database tables for the Hospital Roster application.
Run this script to initialize or update the database schema.
"""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from database import engine, Base
from models import Employee, Shift, ShiftAssignment, SchedulingRule, Plan, MonthlyAvailability


def create_all_tables():
    """Create all database tables based on SQLAlchemy models."""
    print("Creating database tables...")

    # This will create all tables defined in the Base metadata
    # It's safe to run multiple times - existing tables won't be recreated
    Base.metadata.create_all(bind=engine)

    print("Database tables created successfully!")
    print("\nTables created:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")


if __name__ == "__main__":
    create_all_tables()
