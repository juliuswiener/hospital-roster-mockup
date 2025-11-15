# Automatic Plan Creation with OR-Tools - Implementation Plan

## Executive Summary

This document outlines a comprehensive plan for implementing automatic roster/schedule generation for the Hospital Roster Planner using **Google OR-Tools CP-SAT solver**. The implementation will transform the current UI mockup into a fully functional constraint-based scheduling system.

---

## Architecture Overview

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│              Existing UI + Solver Configuration         │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────┐
│                 Backend API (Python/FastAPI)            │
│              Request handling + Job management          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              OR-Tools CP-SAT Solver (Python)            │
│         Constraint Programming + Optimization           │
└─────────────────────────────────────────────────────────┘
```

### Why OR-Tools CP-SAT?

1. **Perfect fit for employee scheduling** - Proven in production for nurse/staff scheduling
2. **Native Python bindings** - Easy integration, rich ecosystem
3. **Hard & soft constraints** - Maps directly to the existing rule system
4. **Optimization objectives** - Maximize preferences, fairness, minimize violations
5. **Production-ready** - Used by major organizations worldwide
6. **Open source** - No licensing costs

---

## Implementation Phases

### Phase 1: Backend Infrastructure (Week 1-2)

#### 1.1 Python Backend Setup

```bash
# New directory structure
hospital-roster-mockup/
├── backend/
│   ├── requirements.txt
│   ├── main.py                 # FastAPI entry point
│   ├── solver/
│   │   ├── __init__.py
│   │   ├── model.py            # OR-Tools model builder
│   │   ├── constraints.py      # Constraint definitions
│   │   ├── objectives.py       # Optimization objectives
│   │   └── solution.py         # Solution parser
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py           # API endpoints
│   │   └── schemas.py          # Pydantic models
│   └── tests/
│       └── test_solver.py
```

**Dependencies (requirements.txt):**
```
ortools>=9.7.2996
fastapi>=0.100.0
uvicorn>=0.23.0
pydantic>=2.0.0
```

#### 1.2 Core Solver Module

```python
# backend/solver/model.py
from ortools.sat.python import cp_model

class RosterSolver:
    def __init__(self, data):
        self.employees = data['employees']
        self.shifts = data['shifts']
        self.days = data['days']
        self.rules = data['rules']
        self.availability = data['availability']
        self.fixed_assignments = data['fixed_assignments']

        self.model = cp_model.CpModel()
        self.shift_vars = {}
        self._create_variables()
        self._add_hard_constraints()
        self._add_soft_constraints()
        self._define_objective()

    def _create_variables(self):
        """Create boolean variables for each (employee, day, shift) combination"""
        for emp in self.employees:
            for day in self.days:
                for shift in self.shifts:
                    var_name = f"shift_{emp['initials']}_{day}_{shift['name']}"
                    self.shift_vars[(emp['initials'], day, shift['name'])] = \
                        self.model.new_bool_var(var_name)

    def solve(self, time_limit_seconds=30):
        """Run the solver and return solution"""
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds

        status = solver.solve(self.model)

        return {
            'status': status,
            'solution': self._extract_solution(solver) if status in [cp_model.OPTIMAL, cp_model.FEASIBLE] else None,
            'statistics': self._get_statistics(solver)
        }
```

### Phase 2: Constraint Modeling (Week 2-3)

#### 2.1 Hard Constraints (Must be satisfied)

```python
# backend/solver/constraints.py

class ConstraintBuilder:
    def __init__(self, model, shift_vars, data):
        self.model = model
        self.shift_vars = shift_vars
        self.data = data

    # 1. Each shift covered by required number of staff
    def add_shift_coverage_constraints(self):
        """Ensure each shift has required coverage"""
        for day in self.data['days']:
            for shift in self.data['shifts']:
                # Get minimum requirement from shift data
                min_staff = self._parse_requirement(shift['requirements'])

                assigned = [
                    self.shift_vars[(emp['initials'], day, shift['name'])]
                    for emp in self.data['employees']
                ]
                self.model.add(sum(assigned) >= min_staff)

    # 2. Employee works at most one shift per day
    def add_one_shift_per_day(self):
        """Each employee works at most one shift per day"""
        for emp in self.data['employees']:
            for day in self.data['days']:
                shifts = [
                    self.shift_vars[(emp['initials'], day, shift['name'])]
                    for shift in self.data['shifts']
                ]
                self.model.add_at_most_one(shifts)

    # 3. Minimum rest time between shifts (11 hours - German labor law)
    def add_rest_time_constraints(self):
        """11 hours rest between shifts (Arbeitszeitgesetz)"""
        for emp in self.data['employees']:
            for i, day in enumerate(self.data['days'][:-1]):
                next_day = self.data['days'][i + 1]

                # If worked evening shift (ends late), can't work morning shift next day
                for shift in self.data['shifts']:
                    if self._is_late_shift(shift):
                        for next_shift in self.data['shifts']:
                            if self._is_early_shift(next_shift):
                                # Can't do both
                                self.model.add(
                                    self.shift_vars[(emp['initials'], day, shift['name'])] +
                                    self.shift_vars[(emp['initials'], next_day, next_shift['name'])] <= 1
                                )

    # 4. Maximum weekly hours (48h limit)
    def add_max_weekly_hours(self):
        """Max 48 hours per week (Arbeitszeitgesetz)"""
        for emp in self.data['employees']:
            # Group days by week
            for week_days in self._get_weeks():
                total_hours = []
                for day in week_days:
                    for shift in self.data['shifts']:
                        hours = self._get_shift_hours(shift)
                        total_hours.append(
                            self.shift_vars[(emp['initials'], day, shift['name'])] * hours
                        )
                self.model.add(sum(total_hours) <= 48)

    # 5. Qualification requirements
    def add_qualification_constraints(self):
        """Only qualified staff can work certain shifts"""
        for emp in self.data['employees']:
            for day in self.data['days']:
                for shift in self.data['shifts']:
                    required_quals = self._parse_qualifications(shift['requirements'])

                    if not self._has_qualifications(emp, required_quals):
                        # Employee cannot work this shift
                        self.model.add(
                            self.shift_vars[(emp['initials'], day, shift['name'])] == 0
                        )

    # 6. Respect fixed/locked assignments
    def add_fixed_assignments(self):
        """Lock in pre-assigned shifts"""
        for assignment in self.data['fixed_assignments']:
            emp_initials = assignment['employee']
            day = assignment['day']
            shift = assignment['shift']

            self.model.add(
                self.shift_vars[(emp_initials, day, shift)] == 1
            )

    # 7. Respect availability/time-off
    def add_availability_constraints(self):
        """Respect employee availability"""
        for emp_initials, availability in self.data['availability'].items():
            for day, status in availability.items():
                if status in ['uw', 'EZ', 'BV', 'krank']:  # Unavailable codes
                    for shift in self.data['shifts']:
                        self.model.add(
                            self.shift_vars[(emp_initials, day, shift['name'])] == 0
                        )
```

#### 2.2 Soft Constraints (Optimization goals)

```python
# backend/solver/objectives.py

class ObjectiveBuilder:
    def __init__(self, model, shift_vars, data):
        self.model = model
        self.shift_vars = shift_vars
        self.data = data
        self.penalty_vars = []
        self.reward_vars = []

    # 1. Fairness: Equal weekend distribution
    def add_weekend_fairness(self, weight=10):
        """Distribute weekend shifts fairly among staff"""
        weekend_counts = {}

        for emp in self.data['employees']:
            weekend_shifts = []
            for day in self.data['days']:
                if self._is_weekend(day):
                    for shift in self.data['shifts']:
                        weekend_shifts.append(
                            self.shift_vars[(emp['initials'], day, shift['name'])]
                        )
            weekend_counts[emp['initials']] = sum(weekend_shifts)

        # Minimize variance in weekend distribution
        counts = list(weekend_counts.values())
        for i in range(len(counts)):
            for j in range(i + 1, len(counts)):
                diff = self.model.new_int_var(-100, 100, f"weekend_diff_{i}_{j}")
                self.model.add(diff == counts[i] - counts[j])
                abs_diff = self.model.new_int_var(0, 100, f"weekend_abs_diff_{i}_{j}")
                self.model.add_abs_equality(abs_diff, diff)
                self.penalty_vars.append(abs_diff * weight)

    # 2. Preference satisfaction
    def add_preference_satisfaction(self, weight=5):
        """Maximize shift preference fulfillment"""
        for emp in self.data['employees']:
            for request in self._get_shift_requests(emp):
                if request['type'] == 'wants':
                    # Reward for granting request
                    self.reward_vars.append(
                        self.shift_vars[(emp['initials'], request['day'], request['shift'])] * weight
                    )
                elif request['type'] == 'avoids':
                    # Penalty for violating preference
                    self.penalty_vars.append(
                        self.shift_vars[(emp['initials'], request['day'], request['shift'])] * weight
                    )

    # 3. Consecutive working days
    def add_consecutive_days_balance(self, weight=3):
        """Avoid too many consecutive working days (max 5)"""
        for emp in self.data['employees']:
            days_list = list(self.data['days'])
            for i in range(len(days_list) - 5):
                consecutive = []
                for j in range(6):  # Check 6 consecutive days
                    day = days_list[i + j]
                    is_working = self.model.new_bool_var(f"working_{emp['initials']}_{day}")
                    shifts = [
                        self.shift_vars[(emp['initials'], day, shift['name'])]
                        for shift in self.data['shifts']
                    ]
                    self.model.add(is_working == sum(shifts))
                    consecutive.append(is_working)

                # Penalize if working 6 consecutive days
                penalty = self.model.new_bool_var(f"consec_penalty_{emp['initials']}_{i}")
                self.model.add(sum(consecutive) >= 6).only_enforce_if(penalty)
                self.model.add(sum(consecutive) < 6).only_enforce_if(penalty.Not())
                self.penalty_vars.append(penalty * weight * 10)

    # 4. Workload balancing
    def add_workload_balance(self, weight=5):
        """Balance total hours across employees with similar contracts"""
        for contract_type in ['Vollzeit', 'Teilzeit']:
            emps = [e for e in self.data['employees'] if self._get_contract_type(e) == contract_type]
            if len(emps) < 2:
                continue

            hours_worked = {}
            for emp in emps:
                total = []
                for day in self.data['days']:
                    for shift in self.data['shifts']:
                        hours = self._get_shift_hours(shift)
                        total.append(
                            self.shift_vars[(emp['initials'], day, shift['name'])] * hours
                        )
                hours_worked[emp['initials']] = sum(total)

            # Minimize max difference
            hours_list = list(hours_worked.values())
            max_diff = self.model.new_int_var(0, 200, f"max_hours_diff_{contract_type}")
            for i in range(len(hours_list)):
                for j in range(i + 1, len(hours_list)):
                    diff = self.model.new_int_var(-200, 200, f"hours_diff_{contract_type}_{i}_{j}")
                    self.model.add(diff == hours_list[i] - hours_list[j])
                    self.model.add(max_diff >= diff)
                    self.model.add(max_diff >= -diff)

            self.penalty_vars.append(max_diff * weight)

    def build_objective(self):
        """Combine all objectives: maximize rewards, minimize penalties"""
        self.model.minimize(sum(self.penalty_vars) - sum(self.reward_vars))
```

### Phase 3: API Integration (Week 3-4)

#### 3.1 REST API Endpoints

```python
# backend/api/routes.py
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import uuid

app = FastAPI()

# In-memory job storage (use Redis/DB in production)
jobs = {}

class SolverRequest(BaseModel):
    employees: list
    shifts: list
    days: list
    rules: list
    availability: dict
    fixed_assignments: list
    optimization_mode: str  # 'quick', 'optimal', 'custom'
    time_limit: int = 30    # seconds

class JobStatus(BaseModel):
    job_id: str
    status: str  # 'pending', 'running', 'completed', 'failed'
    progress: float = 0.0
    result: dict = None
    error: str = None

@app.post("/api/generate-plan")
async def generate_plan(request: SolverRequest, background_tasks: BackgroundTasks):
    """Start plan generation job"""
    job_id = str(uuid.uuid4())
    jobs[job_id] = JobStatus(job_id=job_id, status='pending')

    # Set time limit based on mode
    time_limits = {
        'quick': 30,
        'optimal': 300,
        'custom': request.time_limit
    }

    background_tasks.add_task(
        run_solver,
        job_id,
        request.dict(),
        time_limits.get(request.optimization_mode, 30)
    )

    return {"job_id": job_id}

@app.get("/api/job-status/{job_id}")
async def get_job_status(job_id: str):
    """Check job status"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

async def run_solver(job_id: str, data: dict, time_limit: int):
    """Background task to run solver"""
    jobs[job_id].status = 'running'

    try:
        solver = RosterSolver(data)
        result = solver.solve(time_limit_seconds=time_limit)

        jobs[job_id].status = 'completed'
        jobs[job_id].result = result
    except Exception as e:
        jobs[job_id].status = 'failed'
        jobs[job_id].error = str(e)

@app.post("/api/find-replacement")
async def find_replacement(shift_info: dict):
    """Find replacement for emergency coverage"""
    # Use solver to find best candidate
    candidates = []
    for emp in shift_info['available_employees']:
        score = calculate_replacement_score(emp, shift_info)
        candidates.append({
            'employee': emp,
            'score': score,
            'factors': get_score_breakdown(emp, shift_info)
        })

    return sorted(candidates, key=lambda x: x['score'], reverse=True)[:3]
```

### Phase 4: Frontend Integration (Week 4-5)

#### 4.1 Update React Application

```javascript
// src/solver/api.js - New file for API calls

const API_BASE = 'http://localhost:8000';

export const startPlanGeneration = async (config) => {
  const response = await fetch(`${API_BASE}/api/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employees: config.employees,
      shifts: config.shifts,
      days: config.days,
      rules: config.rules,
      availability: config.availability,
      fixed_assignments: config.fixedAssignments,
      optimization_mode: config.optimizationMode,
      time_limit: config.customTimeLimit || 30
    })
  });
  return response.json();
};

export const checkJobStatus = async (jobId) => {
  const response = await fetch(`${API_BASE}/api/job-status/${jobId}`);
  return response.json();
};

export const pollJobCompletion = (jobId, onProgress, onComplete, onError) => {
  const interval = setInterval(async () => {
    try {
      const status = await checkJobStatus(jobId);

      if (status.status === 'running') {
        onProgress(status.progress);
      } else if (status.status === 'completed') {
        clearInterval(interval);
        onComplete(status.result);
      } else if (status.status === 'failed') {
        clearInterval(interval);
        onError(status.error);
      }
    } catch (err) {
      clearInterval(interval);
      onError(err.message);
    }
  }, 1000); // Poll every second

  return () => clearInterval(interval); // Cleanup function
};
```

#### 4.2 Update Plan Generation Dialog

```javascript
// Update in index.jsx - startGeneration function

const startGeneration = async () => {
  try {
    // Get fixed assignments (locked cells)
    const fixedAssignments = [];
    Object.entries(scheduleData).forEach(([empInitials, days]) => {
      Object.entries(days).forEach(([day, data]) => {
        if (data.locked) {
          fixedAssignments.push({
            employee: empInitials,
            day: day,
            shift: data.shift
          });
        }
      });
    });

    // Start solver
    const { job_id } = await startPlanGeneration({
      employees: employees,
      shifts: shifts,
      days: getDaysInMonth(currentMonth, currentYear),
      rules: rules,
      availability: getAvailabilityData(),
      fixedAssignments: fixedAssignments,
      optimizationMode: selectedOptimizationMode,
      customTimeLimit: customTimeLimit
    });

    // Poll for completion
    pollJobCompletion(
      job_id,
      (progress) => {
        setGenerationProgress(progress);
      },
      (result) => {
        // Apply solution to schedule
        applyGeneratedSchedule(result.solution);
        setShowPlanGenerationDialog(false);
        setGenerationProgress(0);
      },
      (error) => {
        setGenerationError(error);
        setGenerationProgress(0);
      }
    );
  } catch (err) {
    setGenerationError(err.message);
  }
};

const applyGeneratedSchedule = (solution) => {
  const newScheduleData = { ...scheduleData };

  for (const assignment of solution.assignments) {
    const { employee, day, shift, station } = assignment;

    if (!newScheduleData[employee]) {
      newScheduleData[employee] = {};
    }

    newScheduleData[employee][day] = {
      shift: shift,
      station: station,
      locked: false,
      violation: false
    };
  }

  setScheduleData(newScheduleData);
};
```

### Phase 5: Advanced Features (Week 5-6)

#### 5.1 Solution Quality Reporting

```python
# backend/solver/solution.py

class SolutionAnalyzer:
    def __init__(self, model, solver, shift_vars, data):
        self.model = model
        self.solver = solver
        self.shift_vars = shift_vars
        self.data = data

    def analyze(self):
        return {
            'coverage_stats': self._analyze_coverage(),
            'fairness_metrics': self._analyze_fairness(),
            'preference_satisfaction': self._analyze_preferences(),
            'constraint_violations': self._analyze_violations(),
            'employee_workload': self._analyze_workload()
        }

    def _analyze_coverage(self):
        """Check if all shifts are adequately covered"""
        coverage = {}
        for day in self.data['days']:
            coverage[day] = {}
            for shift in self.data['shifts']:
                count = sum(
                    self.solver.value(self.shift_vars[(emp['initials'], day, shift['name'])])
                    for emp in self.data['employees']
                )
                required = self._get_required_count(shift)
                coverage[day][shift['name']] = {
                    'assigned': count,
                    'required': required,
                    'status': 'ok' if count >= required else 'understaffed'
                }
        return coverage

    def _analyze_fairness(self):
        """Calculate fairness metrics"""
        weekend_distribution = {}
        night_shift_distribution = {}

        for emp in self.data['employees']:
            weekend_count = 0
            night_count = 0

            for day in self.data['days']:
                for shift in self.data['shifts']:
                    if self.solver.value(self.shift_vars[(emp['initials'], day, shift['name'])]):
                        if self._is_weekend(day):
                            weekend_count += 1
                        if self._is_night_shift(shift):
                            night_count += 1

            weekend_distribution[emp['initials']] = weekend_count
            night_shift_distribution[emp['initials']] = night_count

        return {
            'weekend_variance': self._calculate_variance(list(weekend_distribution.values())),
            'night_shift_variance': self._calculate_variance(list(night_shift_distribution.values())),
            'weekend_distribution': weekend_distribution,
            'night_shift_distribution': night_shift_distribution
        }
```

#### 5.2 Incremental Solving (Partial Re-planning)

```python
# backend/solver/incremental.py

class IncrementalSolver(RosterSolver):
    """Solver that respects existing assignments and only fills gaps"""

    def __init__(self, data, existing_schedule):
        super().__init__(data)
        self.existing_schedule = existing_schedule
        self._lock_existing_assignments()

    def _lock_existing_assignments(self):
        """Lock in all non-empty cells from existing schedule"""
        for emp_initials, days in self.existing_schedule.items():
            for day, assignment in days.items():
                if assignment.get('shift'):
                    # Lock this assignment
                    shift_name = assignment['shift']
                    self.model.add(
                        self.shift_vars[(emp_initials, day, shift_name)] == 1
                    )
```

### Phase 6: Mapping Existing Rules to Constraints (Week 6-7)

#### 6.1 Rule-to-Constraint Translator

```python
# backend/solver/rule_translator.py

class RuleTranslator:
    """Translate UI rules to OR-Tools constraints"""

    def __init__(self, model, shift_vars, data):
        self.model = model
        self.shift_vars = shift_vars
        self.data = data

    def translate_rule(self, rule):
        """Convert a rule object to constraints"""

        # Parse rule text using NLP patterns
        if "Mindestens 11 Stunden Ruhezeit" in rule['text']:
            return self._add_rest_time_constraint(11)

        elif "Maximal 48 Stunden" in rule['text']:
            return self._add_max_hours_constraint(48)

        elif "Qualifikation" in rule['category']:
            return self._add_qualification_constraint(rule)

        elif "arbeitet nicht an" in rule['text']:
            # Parse employee and day from rule text
            emp, day = self._parse_employee_day_restriction(rule['text'])
            return self._add_day_off_constraint(emp, day)

        elif "bevorzugt Schicht" in rule['text']:
            emp, shift = self._parse_shift_preference(rule['text'])
            return self._add_shift_preference(emp, shift, rule['type'])

        elif "Wochenenden fair" in rule['text']:
            return self._add_weekend_fairness_objective()

        # Add more rule patterns...

    def _parse_employee_day_restriction(self, text):
        """Extract employee name and day from rule text"""
        # "Dr. Rieg arbeitet nicht an Sonntagen"
        import re
        match = re.search(r"(.+) arbeitet nicht an (.+)", text)
        if match:
            return match.group(1).strip(), match.group(2).strip()
        return None, None
```

---

## Data Flow

```
1. User clicks "Generate Plan" in UI
   └─> Frontend collects configuration
       └─> POST /api/generate-plan
           └─> Backend creates job
               └─> OR-Tools solver starts
                   └─> Builds CP model
                   └─> Adds hard constraints
                   └─> Adds soft constraints
                   └─> Defines objective
                   └─> Runs solver
               └─> Returns solution
           └─> Frontend polls job status
       └─> Applies schedule to grid
   └─> User sees generated schedule
```

---

## Constraint Categories Mapped to OR-Tools

| Existing Rule Category | OR-Tools Implementation |
|------------------------|-------------------------|
| **Arbeitszeitgesetz** | Hard constraints (AddExactlyOne, Add) |
| - 11h rest time | Binary constraint between consecutive shifts |
| - 48h max weekly | Sum constraint over week |
| - Max 5 consecutive days | Sliding window constraint |
| **Fairness** | Soft constraints in objective function |
| - Weekend distribution | Minimize variance of weekend shifts |
| - Night shift balance | Minimize max difference |
| **Qualifikation** | Hard constraints (force variable to 0) |
| - Required certifications | Check employee qualifications |
| **Präferenz** | Objective coefficients |
| - Shift preferences | Maximize request satisfaction |
| - Day-off requests | High penalty for violations |
| **Coverage** | Hard constraints (minimum sum) |
| - Min staff per shift | AddGreaterOrEqual |

---

## Testing Strategy

### Unit Tests

```python
# backend/tests/test_constraints.py

def test_one_shift_per_day():
    """Employee can't work multiple shifts same day"""
    data = create_test_data(employees=2, days=3, shifts=3)
    solver = RosterSolver(data)
    result = solver.solve()

    # Verify each employee has at most 1 shift per day
    for emp in data['employees']:
        for day in data['days']:
            shifts_assigned = sum(
                result['solution']['assignments'][emp][day].values()
            )
            assert shifts_assigned <= 1

def test_qualification_respected():
    """Unqualified staff not assigned to specialized shifts"""
    data = create_test_data()
    # Add shift requiring ABS certification
    data['shifts'].append({
        'name': 'ABS',
        'requirements': ['ABS-zertifiziert']
    })
    # Add employee without ABS cert
    data['employees'].append({
        'initials': 'NC',
        'qualifications': []
    })

    solver = RosterSolver(data)
    result = solver.solve()

    # Verify NC not assigned to ABS shift
    for day in data['days']:
        assert result['solution']['assignments']['NC'][day].get('ABS') is None

def test_rest_time_constraint():
    """11 hours between shifts enforced"""
    data = create_test_data()
    solver = RosterSolver(data)
    result = solver.solve()

    # Check no evening-to-morning violations
    for emp in data['employees']:
        for i in range(len(data['days']) - 1):
            day = data['days'][i]
            next_day = data['days'][i + 1]

            if has_late_shift(result, emp, day):
                assert not has_early_shift(result, emp, next_day)
```

### Integration Tests

```python
def test_full_month_generation():
    """Generate valid schedule for full month"""
    data = load_real_hospital_data()
    solver = RosterSolver(data)
    result = solver.solve(time_limit_seconds=60)

    assert result['status'] in ['OPTIMAL', 'FEASIBLE']
    assert result['solution'] is not None

    # Verify all hard constraints satisfied
    violations = check_hard_constraints(result['solution'])
    assert len(violations) == 0

def test_incremental_solving():
    """Partial schedule completion works"""
    data = load_real_hospital_data()
    existing = create_partial_schedule(data, fill_ratio=0.3)

    solver = IncrementalSolver(data, existing)
    result = solver.solve()

    # Verify existing assignments preserved
    for emp, days in existing.items():
        for day, shift in days.items():
            assert result['solution']['assignments'][emp][day] == shift
```

---

## Performance Considerations

### Scaling

| Scenario | Variables | Expected Solve Time |
|----------|-----------|---------------------|
| Small (10 emp, 7 days, 5 shifts) | 350 | < 1 second |
| Medium (26 emp, 30 days, 10 shifts) | 7,800 | 10-30 seconds |
| Large (50 emp, 30 days, 15 shifts) | 22,500 | 1-5 minutes |

### Optimization Tips

1. **Symmetry breaking**: Add constraints to reduce duplicate solutions
2. **Warm starting**: Use previous month's schedule as initial hint
3. **Decomposition**: Solve by week/station for very large problems
4. **Parallelization**: OR-Tools supports multi-threaded solving

---

## Deployment Options

### Option A: Embedded (WebAssembly)

```javascript
// Compile OR-Tools to WASM for in-browser solving
// Limited to smaller problems
```

### Option B: Local Backend (Recommended for MVP)

```bash
# Start backend
cd backend && uvicorn main:app --reload

# Frontend calls localhost
API_BASE = 'http://localhost:8000'
```

### Option C: Cloud Service (Production)

```yaml
# Deploy to cloud functions / containerized service
# AWS Lambda / Google Cloud Run / Azure Functions
```

---

## Milestones & Deliverables

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| 1 | Backend setup | FastAPI server + OR-Tools installed |
| 2 | Core solver | Basic constraint model working |
| 3 | Hard constraints | All labor law rules enforced |
| 4 | Soft constraints | Fairness & preferences optimized |
| 5 | API integration | Frontend ↔ Backend communication |
| 6 | Rule translation | Existing 23 rules converted |
| 7 | Testing & polish | Full test coverage, error handling |
| 8 | Documentation | User guide, API docs |

---

## Success Criteria

1. **Correctness**: Generated schedules satisfy all hard constraints (100%)
2. **Quality**: Soft constraint satisfaction ≥ 85%
3. **Performance**: Monthly schedule generated in < 60 seconds
4. **Coverage**: All shifts adequately staffed
5. **Fairness**: Weekend/night distribution variance < 20%
6. **Usability**: Seamless integration with existing UI

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Infeasible constraints | Add diagnostic mode to identify conflicts |
| Long solve times | Time limits + incremental progress reporting |
| Complex rule parsing | Structured rule input forms alongside NL |
| Data quality issues | Validation layer before solver |

---

## Conclusion

This plan provides a comprehensive roadmap for implementing automatic roster generation using Google OR-Tools CP-SAT solver. The modular architecture allows for incremental development and testing, while the constraint-based approach naturally maps to the existing rule system in the hospital roster mockup.

The Python backend provides a robust optimization engine, while the React frontend maintains the excellent user experience already built. The result will be a production-ready system capable of generating optimal, fair, and compliant hospital staff schedules automatically.
