"""Main roster solver model using OR-Tools CP-SAT."""

from typing import Any

from ortools.sat.python import cp_model

from .constraints import ConstraintBuilder
from .objectives import ObjectiveBuilder
from .solution import SolutionAnalyzer


class RosterSolver:
    """
    Main solver for hospital roster planning using CP-SAT.

    This solver creates optimal staff schedules while respecting:
    - Hard constraints (labor laws, qualifications, coverage requirements)
    - Soft constraints (fairness, preferences, workload balance)
    """

    def __init__(self, data: dict):
        """
        Initialize the solver with planning data.

        Args:
            data: Dictionary containing:
                - employees: List of employee objects
                - shifts: List of shift type objects
                - days: List of day numbers to schedule
                - rules: List of constraint rules
                - availability: Dict of employee availability
                - fixed_assignments: List of locked assignments
        """
        self.data = data
        self.employees = data.get("employees", [])
        self.shifts = data.get("shifts", [])
        self.days = data.get("days", [])
        self.rules = data.get("rules", [])
        self.availability = data.get("availability", {})
        self.fixed_assignments = data.get("fixed_assignments", [])

        # Create the CP-SAT model
        self.model = cp_model.CpModel()
        self.shift_vars: dict[tuple[str, str, str], Any] = {}

        # Initialize model components
        self._create_variables()
        self._add_constraints()
        self._build_objective()

    def _create_variables(self):
        """Create boolean decision variables for shift assignments."""
        for emp in self.employees:
            for day in self.days:
                for shift in self.shifts:
                    var_name = f"shift_{emp['initials']}_{day}_{shift['name']}"
                    self.shift_vars[(emp["initials"], str(day), shift["name"])] = (
                        self.model.new_bool_var(var_name)
                    )

    def _add_constraints(self):
        """Add all hard constraints to the model."""
        constraint_builder = ConstraintBuilder(self.model, self.shift_vars, self.data)
        constraint_builder.add_all_hard_constraints()

    def _build_objective(self):
        """Build the optimization objective with soft constraints."""
        objective_builder = ObjectiveBuilder(self.model, self.shift_vars, self.data)
        objective_builder.build_all_objectives()

    def solve(self, time_limit_seconds: int = 30, num_workers: int = 4):
        """
        Run the solver to find an optimal schedule.

        Args:
            time_limit_seconds: Maximum time to spend solving
            num_workers: Number of parallel workers

        Returns:
            Dictionary containing:
                - status: Solver status (OPTIMAL, FEASIBLE, INFEASIBLE, etc.)
                - solution: The generated schedule (if found)
                - statistics: Solver statistics
                - analysis: Solution quality analysis
        """
        solver = cp_model.CpSolver()

        # Configure solver parameters
        solver.parameters.max_time_in_seconds = time_limit_seconds
        solver.parameters.num_workers = num_workers
        solver.parameters.linearization_level = 0

        # Solve the model
        status = solver.solve(self.model)
        status_name = self._get_status_name(status)

        result = {
            "status": status_name,
            "solution": None,
            "statistics": self._get_statistics(solver),
            "analysis": None,
        }

        # Extract solution if found
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            analyzer = SolutionAnalyzer(solver, self.shift_vars, self.data)
            result["solution"] = analyzer.extract_solution()
            result["analysis"] = analyzer.analyze_solution()

        return result

    def _get_status_name(self, status):
        """Convert status code to string."""
        status_map = {
            cp_model.OPTIMAL: "OPTIMAL",
            cp_model.FEASIBLE: "FEASIBLE",
            cp_model.INFEASIBLE: "INFEASIBLE",
            cp_model.MODEL_INVALID: "MODEL_INVALID",
            cp_model.UNKNOWN: "UNKNOWN",
        }
        return status_map.get(status, "UNKNOWN")

    def _get_statistics(self, solver):
        """Extract solver statistics."""
        return {
            "num_conflicts": solver.num_conflicts if hasattr(solver, "num_conflicts") else 0,
            "num_branches": solver.num_branches if hasattr(solver, "num_branches") else 0,
            "wall_time": solver.wall_time if hasattr(solver, "wall_time") else 0,
            "objective_value": solver.objective_value if hasattr(solver, "objective_value") else 0,
        }


class IncrementalRosterSolver(RosterSolver):
    """
    Solver that respects existing assignments and only fills gaps.

    Use this for partial re-planning scenarios.
    """

    def __init__(self, data: dict, existing_schedule: dict):
        """
        Initialize incremental solver.

        Args:
            data: Planning data (same as RosterSolver)
            existing_schedule: Current schedule to preserve
        """
        self.existing_schedule = existing_schedule
        super().__init__(data)

    def _add_constraints(self):
        """Add constraints including existing assignments."""
        super()._add_constraints()
        self._lock_existing_assignments()

    def _lock_existing_assignments(self):
        """Lock in all assignments from existing schedule."""
        for emp_initials, days_data in self.existing_schedule.items():
            for day, assignment in days_data.items():
                if assignment.get("shift") and not assignment.get("locked", False):
                    # This is an existing assignment - lock it
                    shift_name = assignment["shift"]
                    var = self.shift_vars.get((emp_initials, str(day), shift_name), None)
                    if var is not None:
                        self.model.add(var == 1)


def validate_input_data(data: dict) -> tuple[bool, list[str]]:
    """
    Validate input data before solving.

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    # Check required fields
    if not data.get("employees"):
        errors.append("No employees provided")

    if not data.get("shifts"):
        errors.append("No shifts provided")

    if not data.get("days"):
        errors.append("No days provided")

    # Check employee data
    for i, emp in enumerate(data.get("employees", [])):
        if not emp.get("initials"):
            errors.append(f"Employee {i} missing initials")
        if not emp.get("name"):
            errors.append(f"Employee {i} missing name")

    # Check shift data
    for i, shift in enumerate(data.get("shifts", [])):
        if not shift.get("name"):
            errors.append(f"Shift {i} missing name")

    # Check for conflicts in fixed assignments
    fixed = data.get("fixed_assignments", [])
    for assignment in fixed:
        emp = assignment.get("employee")
        day = assignment.get("day")
        shift = assignment.get("shift")

        if not all([emp, day, shift]):
            errors.append(f"Invalid fixed assignment: {assignment}")

    return len(errors) == 0, errors
