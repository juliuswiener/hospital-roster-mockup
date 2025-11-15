import { EvaluationContext, EvaluationResult } from './types';
import { parseISO, getWeek, getYear } from 'date-fns';

/**
 * Evaluates that no employee works more than 48 hours per week
 */
export function evaluateMaxWeeklyHours(
  context: EvaluationContext
): EvaluationResult[] {
  const results: EvaluationResult[] = [];
  const MAX_WEEKLY_HOURS = 48;

  // Group assignments by employee and week
  const hoursByEmployeeWeek = new Map<string, Map<string, number>>();

  for (const assignment of context.assignments) {
    const date = parseISO(assignment.date);
    const weekKey = `${getYear(date)}-W${String(getWeek(date)).padStart(2, '0')}`;
    const shift = context.shifts.find((s) => s.id === assignment.shiftId);

    if (!shift) continue;

    // Get shift duration in hours (default to 8 hours if not specified)
    const durationHours = (shift.durationMinutes || 480) / 60;

    if (!hoursByEmployeeWeek.has(assignment.employeeId)) {
      hoursByEmployeeWeek.set(assignment.employeeId, new Map());
    }

    const employeeWeeks = hoursByEmployeeWeek.get(assignment.employeeId)!;
    const currentHours = employeeWeeks.get(weekKey) || 0;
    employeeWeeks.set(weekKey, currentHours + durationHours);
  }

  // Check for violations
  for (const [employeeId, weeks] of hoursByEmployeeWeek) {
    for (const [weekKey, totalHours] of weeks) {
      if (totalHours > MAX_WEEKLY_HOURS) {
        const employee = context.employees.find((e) => e.id === employeeId);

        results.push({
          ruleId: 'MAX_WEEKLY_HOURS_48',
          ruleName: 'Maximum 48h per Week',
          ruleType: 'hard',
          passed: false,
          message: `${employee?.name || employeeId} has ${totalHours.toFixed(1)}h scheduled in ${weekKey} (maximum 48h allowed)`,
          severity: 'error',
          affectedEntities: {
            employeeIds: [employeeId],
            shiftIds: [],
            dates: [], // Could list all dates in the week
          },
          metadata: {
            weekKey,
            actualHours: totalHours,
            maxHours: MAX_WEEKLY_HOURS,
            excessHours: totalHours - MAX_WEEKLY_HOURS,
          },
        });
      }
    }
  }

  return results;
}
