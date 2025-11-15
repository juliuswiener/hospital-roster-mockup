-- Hospital Roster Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    initials VARCHAR(10) NOT NULL UNIQUE,
    contract_type VARCHAR(50) NOT NULL,
    weekly_hours INTEGER NOT NULL DEFAULT 40,
    qualifications TEXT[] DEFAULT '{}',
    email VARCHAR(255),
    phone VARCHAR(50),
    employee_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    department VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shifts table
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    station VARCHAR(100) NOT NULL,
    time_start VARCHAR(10),
    time_end VARCHAR(10),
    duration_minutes INTEGER,
    requirements TEXT[] DEFAULT '{}',
    rules TEXT[] DEFAULT '{}',
    color VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduling rules
CREATE TABLE scheduling_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_type VARCHAR(10) NOT NULL CHECK (rule_type IN ('hard', 'soft')),
    rule_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    applies_to VARCHAR(255) DEFAULT 'all',
    source VARCHAR(50) DEFAULT 'form',
    weight INTEGER DEFAULT 5 CHECK (weight BETWEEN 1 AND 10),
    is_active BOOLEAN DEFAULT TRUE,
    parameters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- Shift assignments
CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    station VARCHAR(100) NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    has_violation BOOLEAN DEFAULT FALSE,
    violations TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    UNIQUE(employee_id, assignment_date)
);

-- Indexes
CREATE INDEX idx_assignments_date ON shift_assignments(assignment_date);
CREATE INDEX idx_assignments_employee ON shift_assignments(employee_id);
CREATE INDEX idx_employees_active ON employees(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_shifts_active ON shifts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_rules_active ON scheduling_rules(is_active) WHERE is_active = TRUE;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON shift_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
