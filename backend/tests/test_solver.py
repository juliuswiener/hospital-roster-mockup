"""Tests for the roster solver."""
import pytest
from solver.model import RosterSolver, validate_input_data


def create_test_data():
    """Create minimal test data for solver."""
    return {
        'employees': [
            {
                'name': 'Dr. Anna Müller',
                'initials': 'AM',
                'contract': 'Oberarzt',
                'hours': 40,
                'qualifications': ['Facharzt', 'Notfallzertifizierung']
            },
            {
                'name': 'Dr. Peter Schmidt',
                'initials': 'PS',
                'contract': 'Facharzt',
                'hours': 40,
                'qualifications': ['Facharzt', 'ABS-zertifiziert']
            },
            {
                'name': 'Dr. Lisa Weber',
                'initials': 'LW',
                'contract': 'Assistenzarzt',
                'hours': 40,
                'qualifications': ['Assistenzarzt']
            },
            {
                'name': 'Dr. Max Bauer',
                'initials': 'MB',
                'contract': 'Facharzt',
                'hours': 40,
                'qualifications': ['Facharzt', 'Notfallzertifizierung']
            }
        ],
        'shifts': [
            {
                'name': 'Früh',
                'category': 'Ambulanzen',
                'description': 'Morning shift',
                'requirements': ['Min. 1 Person'],
                'rules': [],
                'station': 'Ambulanzen',
                'time': '08:00-16:00'
            },
            {
                'name': 'Spät',
                'category': 'Ambulanzen',
                'description': 'Afternoon shift',
                'requirements': ['Min. 1 Person'],
                'rules': [],
                'station': 'Ambulanzen',
                'time': '14:00-22:00'
            },
            {
                'name': 'Nacht',
                'category': 'Ambulanzen',
                'description': 'Night shift',
                'requirements': ['Min. 1 Person', 'Facharzt'],
                'rules': [],
                'station': 'Ambulanzen',
                'time': '22:00-08:00'
            }
        ],
        'days': [1, 2, 3, 4, 5, 6, 7],  # One week
        'rules': [
            {
                'id': 1,
                'type': 'hard',
                'text': 'Mindestens 11 Stunden Ruhezeit zwischen Schichten',
                'source': 'form',
                'category': 'Arbeitszeitgesetz',
                'appliesTo': 'all'
            },
            {
                'id': 2,
                'type': 'hard',
                'text': 'Maximal 48 Stunden pro Woche',
                'source': 'form',
                'category': 'Arbeitszeitgesetz',
                'appliesTo': 'all'
            },
            {
                'id': 3,
                'type': 'soft',
                'text': 'Wochenenden fair verteilen',
                'source': 'form',
                'category': 'Fairness',
                'appliesTo': 'all'
            }
        ],
        'availability': {
            'LW': {
                '6': 'uw',  # Lisa Weber wants day 6 off
                '7': 'uw'   # and day 7 off
            }
        },
        'fixed_assignments': []
    }


def test_validate_input_data():
    """Test input validation."""
    data = create_test_data()
    is_valid, errors = validate_input_data(data)
    assert is_valid is True
    assert len(errors) == 0


def test_validate_missing_employees():
    """Test validation catches missing employees."""
    data = {'employees': [], 'shifts': [], 'days': []}
    is_valid, errors = validate_input_data(data)
    assert is_valid is False
    assert "No employees provided" in errors


def test_solver_creates_variables():
    """Test that solver creates correct number of variables."""
    data = create_test_data()
    solver = RosterSolver(data)

    expected_vars = len(data['employees']) * len(data['days']) * len(data['shifts'])
    assert len(solver.shift_vars) == expected_vars


def test_solver_basic_solution():
    """Test that solver can find a basic solution."""
    data = create_test_data()
    solver = RosterSolver(data)
    result = solver.solve(time_limit_seconds=10)

    assert result['status'] in ['OPTIMAL', 'FEASIBLE']
    assert result['solution'] is not None
    assert 'assignments' in result['solution']


def test_solver_respects_availability():
    """Test that solver respects employee availability."""
    data = create_test_data()
    solver = RosterSolver(data)
    result = solver.solve(time_limit_seconds=10)

    if result['status'] in ['OPTIMAL', 'FEASIBLE']:
        assignments = result['solution']['assignments']

        # Check that LW is not assigned on days 6 and 7 (marked as unavailable)
        lw_assignments = [a for a in assignments if a['employee'] == 'LW']
        lw_days = [a['day'] for a in lw_assignments]

        assert '6' not in lw_days
        assert '7' not in lw_days


def test_solver_respects_qualifications():
    """Test that solver respects qualification requirements."""
    data = create_test_data()
    solver = RosterSolver(data)
    result = solver.solve(time_limit_seconds=10)

    if result['status'] in ['OPTIMAL', 'FEASIBLE']:
        assignments = result['solution']['assignments']

        # Check that night shifts (requiring Facharzt) are not assigned to LW (Assistenzarzt)
        night_assignments = [a for a in assignments if a['shift'] == 'Nacht']
        for assignment in night_assignments:
            assert assignment['employee'] != 'LW'


def test_solver_one_shift_per_day():
    """Test that each employee works at most one shift per day."""
    data = create_test_data()
    solver = RosterSolver(data)
    result = solver.solve(time_limit_seconds=10)

    if result['status'] in ['OPTIMAL', 'FEASIBLE']:
        assignments = result['solution']['assignments']

        # Group by employee and day
        from collections import defaultdict
        emp_day_shifts = defaultdict(list)

        for a in assignments:
            key = (a['employee'], a['day'])
            emp_day_shifts[key].append(a['shift'])

        # Check no employee has multiple shifts on same day
        for key, shifts in emp_day_shifts.items():
            assert len(shifts) <= 1, f"{key} has multiple shifts: {shifts}"


def test_solver_statistics():
    """Test that solver returns statistics."""
    data = create_test_data()
    solver = RosterSolver(data)
    result = solver.solve(time_limit_seconds=10)

    assert 'statistics' in result
    assert 'wall_time' in result['statistics']
    assert 'num_conflicts' in result['statistics']


def test_solver_with_fixed_assignments():
    """Test that solver respects fixed/locked assignments."""
    data = create_test_data()
    data['fixed_assignments'] = [
        {
            'employee': 'AM',
            'day': '1',
            'shift': 'Früh'
        }
    ]

    solver = RosterSolver(data)
    result = solver.solve(time_limit_seconds=10)

    if result['status'] in ['OPTIMAL', 'FEASIBLE']:
        assignments = result['solution']['assignments']

        # Check that AM is assigned to Früh on day 1
        am_day1 = [a for a in assignments if a['employee'] == 'AM' and a['day'] == '1']
        assert len(am_day1) == 1
        assert am_day1[0]['shift'] == 'Früh'


if __name__ == "__main__":
    # Run a quick test
    data = create_test_data()
    print("Testing solver with sample data...")
    print(f"Employees: {len(data['employees'])}")
    print(f"Shifts: {len(data['shifts'])}")
    print(f"Days: {len(data['days'])}")

    solver = RosterSolver(data)
    result = solver.solve(time_limit_seconds=10)

    print(f"\nResult status: {result['status']}")
    if result['solution']:
        print(f"Assignments: {len(result['solution']['assignments'])}")
        print(f"Statistics: {result['statistics']}")

        # Show a few assignments
        print("\nSample assignments:")
        for a in result['solution']['assignments'][:5]:
            print(f"  {a['employee']} - Day {a['day']} - {a['shift']}")
