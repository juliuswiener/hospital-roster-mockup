"""Solution parsing and analysis for roster optimization."""
from ortools.sat.python import cp_model


class SolutionAnalyzer:
    """Analyzes and extracts solution from solver."""

    def __init__(self, solver: cp_model.CpSolver, shift_vars: dict, data: dict):
        self.solver = solver
        self.shift_vars = shift_vars
        self.data = data
        self.employees = data.get('employees', [])
        self.shifts = data.get('shifts', [])
        self.days = data.get('days', [])

    def extract_solution(self):
        """Extract the solution as a schedule."""
        assignments = []

        for emp in self.employees:
            for day in self.days:
                for shift in self.shifts:
                    var = self.shift_vars.get((emp['initials'], str(day), shift['name']), None)
                    if var is not None and self.solver.value(var) == 1:
                        assignments.append({
                            'employee': emp['initials'],
                            'day': str(day),
                            'shift': shift['name'],
                            'station': shift.get('station', shift.get('category', 'Unknown'))
                        })

        return {
            'assignments': assignments,
            'schedule': self._build_schedule_structure(assignments)
        }

    def analyze_solution(self):
        """Provide detailed analysis of the solution."""
        assignments = self.extract_solution()['assignments']

        return {
            'coverage_stats': self._analyze_coverage(assignments),
            'fairness_metrics': self._analyze_fairness(assignments),
            'employee_workload': self._analyze_workload(assignments),
            'constraint_summary': self._summarize_constraints(assignments)
        }

    def _build_schedule_structure(self, assignments):
        """Build schedule in the format expected by frontend."""
        schedule = {}

        # Initialize structure for all employees
        for emp in self.employees:
            schedule[emp['initials']] = {}
            for day in self.days:
                schedule[emp['initials']][str(day)] = {
                    'shift': None,
                    'station': None,
                    'locked': False,
                    'violation': False
                }

        # Fill in assignments
        for assignment in assignments:
            emp_initials = assignment['employee']
            day = assignment['day']
            if emp_initials in schedule and day in schedule[emp_initials]:
                schedule[emp_initials][day]['shift'] = assignment['shift']
                schedule[emp_initials][day]['station'] = assignment['station']

        return schedule

    def _analyze_coverage(self, assignments):
        """Analyze shift coverage."""
        coverage = {}

        for day in self.days:
            coverage[str(day)] = {}
            for shift in self.shifts:
                # Count assignments for this shift on this day
                count = sum(
                    1 for a in assignments
                    if a['day'] == str(day) and a['shift'] == shift['name']
                )

                # Get required count
                required = self._get_required_count(shift)

                coverage[str(day)][shift['name']] = {
                    'assigned': count,
                    'required': required,
                    'status': 'ok' if count >= required else 'understaffed'
                }

        return coverage

    def _analyze_fairness(self, assignments):
        """Analyze fairness metrics."""
        # Weekend distribution
        weekend_counts = {}
        night_counts = {}
        total_counts = {}

        for emp in self.employees:
            emp_assignments = [a for a in assignments if a['employee'] == emp['initials']]
            weekend_counts[emp['initials']] = sum(
                1 for a in emp_assignments if self._is_weekend_day(a['day'])
            )
            night_counts[emp['initials']] = sum(
                1 for a in emp_assignments if self._is_night_shift_by_name(a['shift'])
            )
            total_counts[emp['initials']] = len(emp_assignments)

        return {
            'weekend_distribution': weekend_counts,
            'weekend_variance': self._calculate_variance(list(weekend_counts.values())),
            'night_shift_distribution': night_counts,
            'night_shift_variance': self._calculate_variance(list(night_counts.values())),
            'total_shift_distribution': total_counts,
            'total_shift_variance': self._calculate_variance(list(total_counts.values()))
        }

    def _analyze_workload(self, assignments):
        """Analyze workload per employee."""
        workload = {}

        for emp in self.employees:
            emp_assignments = [a for a in assignments if a['employee'] == emp['initials']]

            # Calculate total hours
            total_hours = 0
            for a in emp_assignments:
                shift = next((s for s in self.shifts if s['name'] == a['shift']), None)
                if shift:
                    total_hours += self._get_shift_hours(shift)

            # Count shift types
            shift_type_counts = {}
            for a in emp_assignments:
                shift_name = a['shift']
                shift_type_counts[shift_name] = shift_type_counts.get(shift_name, 0) + 1

            workload[emp['initials']] = {
                'total_shifts': len(emp_assignments),
                'total_hours': total_hours,
                'shift_types': shift_type_counts,
                'average_hours_per_week': total_hours / max(1, len(self.days) / 7)
            }

        return workload

    def _summarize_constraints(self, assignments):
        """Summarize constraint satisfaction."""
        return {
            'hard_constraints_satisfied': True,  # If we have a solution, hard constraints are met
            'objective_value': self.solver.objective_value if hasattr(self.solver, 'objective_value') else 0,
            'num_conflicts': self.solver.num_conflicts if hasattr(self.solver, 'num_conflicts') else 0,
            'num_branches': self.solver.num_branches if hasattr(self.solver, 'num_branches') else 0,
            'wall_time': self.solver.wall_time if hasattr(self.solver, 'wall_time') else 0
        }

    def _get_required_count(self, shift):
        """Get required number of staff for a shift."""
        requirements = shift.get('requirements', [])
        for req in requirements:
            if 'Min.' in req or 'Mindestens' in req:
                import re
                match = re.search(r'(\d+)', req)
                if match:
                    return int(match.group(1))
        return 1

    def _is_weekend_day(self, day):
        """Check if day is a weekend."""
        try:
            day_num = int(day)
            return day_num % 7 in [0, 6]  # Simplified
        except ValueError:
            return False

    def _is_night_shift_by_name(self, shift_name):
        """Check if shift is a night shift by name."""
        return 'nacht' in shift_name.lower() or 'rufbereitschaft' in shift_name.lower()

    def _get_shift_hours(self, shift):
        """Get shift duration in hours."""
        time_str = shift.get('time', '')
        if '-' in time_str:
            try:
                parts = time_str.split('-')
                start_hour = int(parts[0].strip().split(':')[0])
                end_hour = int(parts[1].strip().split(':')[0])

                if end_hour <= start_hour:
                    return (24 - start_hour) + end_hour
                return end_hour - start_hour
            except (ValueError, IndexError):
                pass
        return 8  # Default

    def _calculate_variance(self, values):
        """Calculate variance of a list of values."""
        if not values or len(values) < 2:
            return 0.0

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return round(variance, 2)
