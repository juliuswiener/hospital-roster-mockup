"""Soft constraint and objective function implementations."""
from ortools.sat.python import cp_model


class ObjectiveBuilder:
    """Builds soft constraints and objective function for optimization."""

    def __init__(self, model: cp_model.CpModel, shift_vars: dict, data: dict):
        self.model = model
        self.shift_vars = shift_vars
        self.data = data
        self.employees = data.get('employees', [])
        self.shifts = data.get('shifts', [])
        self.days = data.get('days', [])
        self.rules = data.get('rules', [])

        self.penalty_vars = []
        self.reward_vars = []

    def build_all_objectives(self):
        """Build complete objective function with all soft constraints."""
        self.add_weekend_fairness()
        self.add_workload_balance()
        self.add_shift_distribution()
        self.add_preference_satisfaction()
        self.add_consecutive_days_penalty()
        self.apply_soft_rules()

        # Combine into single objective: minimize penalties - maximize rewards
        if self.penalty_vars or self.reward_vars:
            self.model.minimize(sum(self.penalty_vars) - sum(self.reward_vars))

    def add_weekend_fairness(self, weight=10):
        """Distribute weekend shifts fairly among staff."""
        if len(self.employees) < 2:
            return

        weekend_days = self._get_weekend_days()
        if not weekend_days:
            return

        weekend_counts = []
        for emp in self.employees:
            emp_weekend_shifts = []
            for day in weekend_days:
                for shift in self.shifts:
                    var = self.shift_vars.get((emp['initials'], str(day), shift['name']), None)
                    if var is not None:
                        emp_weekend_shifts.append(var)

            if emp_weekend_shifts:
                # Create variable for this employee's weekend count
                count_var = self.model.new_int_var(
                    0, len(emp_weekend_shifts),
                    f"weekend_count_{emp['initials']}"
                )
                self.model.add(count_var == sum(emp_weekend_shifts))
                weekend_counts.append(count_var)

        # Minimize variance: penalize differences between pairs
        if len(weekend_counts) >= 2:
            for i in range(len(weekend_counts)):
                for j in range(i + 1, len(weekend_counts)):
                    diff = self.model.new_int_var(-100, 100, f"wknd_diff_{i}_{j}")
                    self.model.add(diff == weekend_counts[i] - weekend_counts[j])

                    abs_diff = self.model.new_int_var(0, 100, f"wknd_abs_{i}_{j}")
                    self.model.add_abs_equality(abs_diff, diff)

                    self.penalty_vars.append(abs_diff * weight)

    def add_workload_balance(self, weight=5):
        """Balance total shifts across employees."""
        if len(self.employees) < 2:
            return

        shift_counts = []
        for emp in self.employees:
            emp_shifts = []
            for day in self.days:
                for shift in self.shifts:
                    var = self.shift_vars.get((emp['initials'], str(day), shift['name']), None)
                    if var is not None:
                        emp_shifts.append(var)

            if emp_shifts:
                count_var = self.model.new_int_var(
                    0, len(emp_shifts),
                    f"shift_count_{emp['initials']}"
                )
                self.model.add(count_var == sum(emp_shifts))
                shift_counts.append(count_var)

        # Minimize max difference in shift counts
        if len(shift_counts) >= 2:
            # Calculate target: total shifts / employees
            total_possible = len(self.days) * len(self.shifts)
            min_shifts = total_possible // len(self.employees)
            max_shifts = min_shifts + (1 if total_possible % len(self.employees) else 0)

            for count_var in shift_counts:
                # Penalize deviation from target range
                below_min = self.model.new_int_var(0, 100, f"below_{count_var.Name()}")
                above_max = self.model.new_int_var(0, 100, f"above_{count_var.Name()}")

                self.model.add(below_min >= min_shifts - count_var)
                self.model.add(below_min >= 0)
                self.model.add(above_max >= count_var - max_shifts)
                self.model.add(above_max >= 0)

                self.penalty_vars.append(below_min * weight)
                self.penalty_vars.append(above_max * weight)

    def add_shift_distribution(self, weight=3):
        """Distribute specific shift types (night shifts, etc.) fairly."""
        # Focus on night shifts or demanding shifts
        demanding_shifts = [s for s in self.shifts if self._is_demanding_shift(s)]

        if not demanding_shifts or len(self.employees) < 2:
            return

        for shift in demanding_shifts:
            shift_counts = []
            for emp in self.employees:
                emp_shifts = []
                for day in self.days:
                    var = self.shift_vars.get((emp['initials'], str(day), shift['name']), None)
                    if var is not None:
                        emp_shifts.append(var)

                if emp_shifts:
                    count_var = self.model.new_int_var(
                        0, len(emp_shifts),
                        f"{shift['name']}_count_{emp['initials']}"
                    )
                    self.model.add(count_var == sum(emp_shifts))
                    shift_counts.append(count_var)

            # Minimize variance
            if len(shift_counts) >= 2:
                for i in range(len(shift_counts)):
                    for j in range(i + 1, len(shift_counts)):
                        diff = self.model.new_int_var(-50, 50, f"{shift['name']}_diff_{i}_{j}")
                        self.model.add(diff == shift_counts[i] - shift_counts[j])

                        abs_diff = self.model.new_int_var(0, 50, f"{shift['name']}_abs_{i}_{j}")
                        self.model.add_abs_equality(abs_diff, diff)

                        self.penalty_vars.append(abs_diff * weight)

    def add_preference_satisfaction(self, weight=5):
        """Maximize satisfaction of employee preferences."""
        # Parse preferences from rules
        for rule in self.rules:
            if rule.get('type') == 'soft' and 'bevorzugt' in rule.get('text', '').lower():
                self._add_preference_reward(rule, weight)
            elif rule.get('type') == 'soft' and 'vermeiden' in rule.get('text', '').lower():
                self._add_avoidance_penalty(rule, weight)

    def add_consecutive_days_penalty(self, weight=8):
        """Penalize too many consecutive working days."""
        max_preferred_consecutive = 5

        for emp in self.employees:
            # Check for 6+ consecutive working days
            if len(self.days) >= 6:
                for i in range(len(self.days) - 5):
                    consecutive_work = []
                    for j in range(6):
                        day = str(self.days[i + j])
                        # Check if working any shift that day
                        day_vars = []
                        for shift in self.shifts:
                            var = self.shift_vars.get((emp['initials'], day, shift['name']), None)
                            if var is not None:
                                day_vars.append(var)

                        if day_vars:
                            is_working = self.model.new_bool_var(f"working_{emp['initials']}_{day}")
                            self.model.add(sum(day_vars) >= 1).only_enforce_if(is_working)
                            self.model.add(sum(day_vars) == 0).only_enforce_if(is_working.Not())
                            consecutive_work.append(is_working)

                    # Penalize if all 6 days are working days
                    if len(consecutive_work) == 6:
                        all_working = self.model.new_bool_var(f"all6_{emp['initials']}_{i}")
                        self.model.add(sum(consecutive_work) == 6).only_enforce_if(all_working)
                        self.model.add(sum(consecutive_work) < 6).only_enforce_if(all_working.Not())
                        self.penalty_vars.append(all_working * weight * 10)

    def apply_soft_rules(self):
        """Apply soft constraints from custom rules."""
        for rule in self.rules:
            if rule.get('type') == 'soft':
                self._apply_soft_rule(rule)

    def _apply_soft_rule(self, rule):
        """Apply a single soft rule as an optimization objective."""
        text = rule.get('text', '')
        category = rule.get('category', '')

        # Get weight based on rule importance
        weight = self._get_rule_weight(rule)

        if 'fair' in text.lower() or category == 'Fairness':
            # Already handled by fairness objectives
            pass
        elif 'präferenz' in category.lower() or 'bevorzugt' in text.lower():
            # Handled in preference satisfaction
            pass

    def _add_preference_reward(self, rule, base_weight):
        """Add reward for satisfying shift preferences."""
        # Parse the rule to extract employee and preferred shifts
        # This is simplified - would need NLP for production
        applies_to = rule.get('appliesTo', 'all')
        if applies_to == 'all':
            return

        # Find employee
        emp = next((e for e in self.employees if applies_to in e.get('name', '')), None)
        if not emp:
            return

        # Reward for assigning preferred shifts (simplified)
        for day in self.days:
            for shift in self.shifts:
                var = self.shift_vars.get((emp['initials'], str(day), shift['name']), None)
                if var is not None:
                    self.reward_vars.append(var * base_weight)

    def _add_avoidance_penalty(self, rule, base_weight):
        """Add penalty for assigning shifts employee wants to avoid."""
        applies_to = rule.get('appliesTo', 'all')
        if applies_to == 'all':
            return

        emp = next((e for e in self.employees if applies_to in e.get('name', '')), None)
        if not emp:
            return

        # Penalize assigning certain shifts (simplified)
        text = rule.get('text', '')
        for shift in self.shifts:
            if shift['name'].lower() in text.lower():
                for day in self.days:
                    var = self.shift_vars.get((emp['initials'], str(day), shift['name']), None)
                    if var is not None:
                        self.penalty_vars.append(var * base_weight)

    def _get_rule_weight(self, rule):
        """Get numerical weight for a rule."""
        # Could be stored in rule object or derived from priority
        return 5  # Default weight

    def _get_weekend_days(self):
        """Get weekend days from days list."""
        # Simple heuristic - in production use actual calendar
        weekends = []
        for day in self.days:
            day_num = int(day)
            # Assume first day of month is known, calculate day of week
            # Simplified: mark every 6th and 7th day as weekend
            if day_num % 7 in [0, 6]:
                weekends.append(day)
        return weekends

    def _is_demanding_shift(self, shift):
        """Check if shift is demanding (night, on-call, etc.)."""
        name = shift.get('name', '').lower()
        time_str = shift.get('time', '')

        # Night shifts
        if 'nacht' in name or 'rufbereitschaft' in name:
            return True

        # Check if shift time indicates night work
        if '-' in time_str:
            try:
                end_time = time_str.split('-')[1].strip()
                hour = int(end_time.split(':')[0])
                if hour <= 8:  # Ends in early morning
                    return True
            except (ValueError, IndexError):
                pass

        return False
