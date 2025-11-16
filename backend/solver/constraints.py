"""Hard constraint implementations for the roster solver."""

import re

from ortools.sat.python import cp_model


class ConstraintBuilder:
    """Builds hard constraints for the CP-SAT model."""

    def __init__(self, model: cp_model.CpModel, shift_vars: dict, data: dict):
        self.model = model
        self.shift_vars = shift_vars
        self.data = data
        self.employees = data.get("employees", [])
        self.shifts = data.get("shifts", [])
        self.days = data.get("days", [])
        self.rules = data.get("rules", [])
        self.availability = data.get("availability", {})
        self.fixed_assignments = data.get("fixed_assignments", [])

    def add_all_hard_constraints(self):
        """Add all hard constraints to the model."""
        self.add_shift_coverage_constraints()
        self.add_one_shift_per_day()
        self.add_rest_time_constraints()
        self.add_max_weekly_hours()
        self.add_qualification_constraints()
        self.add_fixed_assignments()
        self.add_availability_constraints()
        self.add_custom_hard_rules()

    def add_shift_coverage_constraints(self):
        """Ensure each shift has minimum required coverage."""
        for day in self.days:
            for shift in self.shifts:
                min_staff = self._parse_min_requirement(shift.get("requirements", []))
                if min_staff > 0:
                    assigned = [
                        self.shift_vars.get((emp["initials"], str(day), shift["name"]), None)
                        for emp in self.employees
                    ]
                    assigned = [v for v in assigned if v is not None]
                    if assigned:
                        self.model.add(sum(assigned) >= min_staff)

    def add_one_shift_per_day(self):
        """Each employee works at most one shift per day."""
        for emp in self.employees:
            for day in self.days:
                shifts_on_day = [
                    self.shift_vars.get((emp["initials"], str(day), shift["name"]), None)
                    for shift in self.shifts
                ]
                shifts_on_day = [v for v in shifts_on_day if v is not None]
                if shifts_on_day:
                    self.model.add_at_most_one(shifts_on_day)

    def add_rest_time_constraints(self):
        """11 hours minimum rest between shifts (German labor law)."""
        for emp in self.employees:
            for i in range(len(self.days) - 1):
                current_day = str(self.days[i])
                next_day = str(self.days[i + 1])

                # Check late shifts followed by early shifts
                for shift in self.shifts:
                    if self._is_late_shift(shift):
                        for next_shift in self.shifts:
                            if self._is_early_shift(next_shift):
                                current_var = self.shift_vars.get(
                                    (emp["initials"], current_day, shift["name"]), None
                                )
                                next_var = self.shift_vars.get(
                                    (emp["initials"], next_day, next_shift["name"]), None
                                )
                                if current_var is not None and next_var is not None:
                                    # Can't work late shift then early shift next day
                                    self.model.add(current_var + next_var <= 1)

    def add_max_weekly_hours(self):
        """Maximum 48 hours per week (German labor law)."""
        # Group days into weeks
        weeks = self._group_days_by_week()

        for emp in self.employees:
            for week_days in weeks:
                total_hours = []
                for day in week_days:
                    for shift in self.shifts:
                        var = self.shift_vars.get((emp["initials"], str(day), shift["name"]), None)
                        if var is not None:
                            hours = self._get_shift_duration(shift)
                            total_hours.append(var * hours)
                if total_hours:
                    self.model.add(sum(total_hours) <= 48)

    def add_qualification_constraints(self):
        """Only qualified staff can work certain shifts."""
        for emp in self.employees:
            emp_quals = set(emp.get("qualifications", []))
            for day in self.days:
                for shift in self.shifts:
                    required_quals = self._parse_qualifications(shift.get("requirements", []))

                    # Check if employee has all required qualifications
                    if required_quals and not required_quals.issubset(emp_quals):
                        var = self.shift_vars.get((emp["initials"], str(day), shift["name"]), None)
                        if var is not None:
                            self.model.add(var == 0)

    def add_fixed_assignments(self):
        """Lock in pre-assigned/locked shifts."""
        for assignment in self.fixed_assignments:
            emp_initials = assignment.get("employee")
            day = str(assignment.get("day"))
            shift_name = assignment.get("shift")

            var = self.shift_vars.get((emp_initials, day, shift_name), None)
            if var is not None:
                self.model.add(var == 1)

    def add_availability_constraints(self):
        """Respect employee availability/time-off."""
        unavailable_codes = {"uw", "EZ", "BV", "krank", "U", "K", "SU", "MU"}

        for emp_initials, days_availability in self.availability.items():
            for day, status in days_availability.items():
                if status in unavailable_codes:
                    # Employee is unavailable on this day
                    for shift in self.shifts:
                        var = self.shift_vars.get((emp_initials, str(day), shift["name"]), None)
                        if var is not None:
                            self.model.add(var == 0)

    def add_custom_hard_rules(self):
        """Add hard constraints from custom rules."""
        for rule in self.rules:
            if rule.get("type") == "hard":
                self._apply_rule_constraint(rule)

    def _apply_rule_constraint(self, rule):
        """Apply a single rule as a constraint."""
        text = rule.get("text", "")

        # Pattern: "Employee X does not work on Day Y"
        if "arbeitet nicht" in text.lower():
            self._add_no_work_constraint(rule)

        # Pattern: "Maximum consecutive working days"
        elif "aufeinanderfolgende" in text.lower() and "arbeitstage" in text.lower():
            self._add_max_consecutive_days_constraint(rule)

    def _add_no_work_constraint(self, rule):
        """Add constraint that employee doesn't work on certain days."""
        text = rule.get("text", "")
        applies_to = rule.get("appliesTo", "all")

        # Parse day patterns
        if "sonntag" in text.lower():
            target_days = self._get_sundays()
        elif "samstag" in text.lower():
            target_days = self._get_saturdays()
        elif "wochenende" in text.lower():
            target_days = self._get_weekends()
        else:
            return

        # Apply to specific employee or all
        employees_to_apply = []
        if applies_to != "all":
            employees_to_apply = [e for e in self.employees if applies_to in e.get("name", "")]
        else:
            employees_to_apply = self.employees

        for emp in employees_to_apply:
            for day in target_days:
                for shift in self.shifts:
                    var = self.shift_vars.get((emp["initials"], str(day), shift["name"]), None)
                    if var is not None:
                        self.model.add(var == 0)

    def _add_max_consecutive_days_constraint(self, rule):
        """Add constraint for maximum consecutive working days."""
        # Default to 5 consecutive days max
        max_consecutive = 5
        text = rule.get("text", "")
        match = re.search(r"(\d+)", text)
        if match:
            max_consecutive = int(match.group(1))

        for emp in self.employees:
            # Sliding window check
            for i in range(len(self.days) - max_consecutive):
                working_vars = []
                for j in range(max_consecutive + 1):
                    day = str(self.days[i + j])
                    # Check if working any shift
                    for shift in self.shifts:
                        var = self.shift_vars.get((emp["initials"], day, shift["name"]), None)
                        if var is not None:
                            working_vars.append(var)

                # Can't work all max_consecutive+1 days
                if len(working_vars) > max_consecutive:
                    self.model.add(sum(working_vars) <= max_consecutive)

    # Helper methods
    def _parse_min_requirement(self, requirements):
        """Parse minimum staff requirement from shift requirements."""
        for req in requirements:
            if "Min." in req or "Mindestens" in req:
                match = re.search(r"(\d+)", req)
                if match:
                    return int(match.group(1))
        return 1  # Default to 1 person required

    def _parse_qualifications(self, requirements):
        """Extract qualification requirements."""
        qualifications = set()
        qual_keywords = [
            "Facharzt",
            "Oberarzt",
            "Chefarzt",
            "Assistenzarzt",
            "ABS-zertifiziert",
            "Notfallzertifizierung",
            "Intensivmedizin",
            "Ultraschall-Zertifikat",
            "Endoskopie",
        ]
        for req in requirements:
            for qual in qual_keywords:
                if qual.lower() in req.lower():
                    qualifications.add(qual)
        return qualifications

    def _is_late_shift(self, shift):
        """Check if shift ends late (after 21:00)."""
        time_str = shift.get("time", "")
        if "-" in time_str:
            end_time = time_str.split("-")[1].strip()
            if ":" in end_time:
                hour = int(end_time.split(":")[0])
                # Night shifts or shifts ending after 21:00
                return hour >= 21 or hour <= 8
        return False

    def _is_early_shift(self, shift):
        """Check if shift starts early (before 09:00)."""
        time_str = shift.get("time", "")
        if "-" in time_str:
            start_time = time_str.split("-")[0].strip()
            if ":" in start_time:
                hour = int(start_time.split(":")[0])
                return hour < 9
        return False

    def _get_shift_duration(self, shift):
        """Get shift duration in hours."""
        time_str = shift.get("time", "")
        if "-" in time_str:
            parts = time_str.split("-")
            if len(parts) == 2:
                try:
                    start = parts[0].strip()
                    end = parts[1].strip()
                    start_hour = int(start.split(":")[0])
                    end_hour = int(end.split(":")[0])

                    # Handle overnight shifts
                    if end_hour <= start_hour:
                        duration = (24 - start_hour) + end_hour
                    else:
                        duration = end_hour - start_hour
                    return duration
                except (ValueError, IndexError):
                    pass
        return 8  # Default 8 hours

    def _group_days_by_week(self):
        """Group days into calendar weeks."""
        if not self.days:
            return []

        weeks = []
        current_week = []

        for day in self.days:
            current_week.append(day)
            # Simple grouping: every 7 days is a week
            if len(current_week) == 7:
                weeks.append(current_week)
                current_week = []

        # Add remaining days
        if current_week:
            weeks.append(current_week)

        return weeks

    def _get_sundays(self):
        """Get all Sundays from days list."""
        # Assuming days are day numbers in a month
        # This is simplified - in production would use actual date logic
        sundays = []
        for day in self.days:
            # Simple heuristic: every 7th day starting from first Sunday
            # In real implementation, use actual calendar
            if int(day) % 7 == 0:  # Simplified
                sundays.append(day)
        return sundays

    def _get_saturdays(self):
        """Get all Saturdays from days list."""
        saturdays = []
        for day in self.days:
            if (int(day) - 1) % 7 == 5:  # Simplified
                saturdays.append(day)
        return saturdays

    def _get_weekends(self):
        """Get all weekend days."""
        return self._get_saturdays() + self._get_sundays()
