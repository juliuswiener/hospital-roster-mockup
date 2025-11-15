import { EvaluationContext, EvaluationResult } from './types';
import {
  parseISO,
  isWeekend,
  getMonth,
  getYear,
  format,
  startOfWeek,
} from 'date-fns';

/**
 * Get a unique key for the weekend (Saturday-Sunday pair)
 */
function getWeekendKey(date: Date): string {
  // Get the Monday of the week, then the weekend belongs to that week
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  return format(weekStart, 'yyyy-MM-dd');
}

/**
 * Evaluates that employees don't work too many weekends per month (soft rule)
 */
export function evaluateWeekendDistribution(
  context: EvaluationContext
): EvaluationResult[] {
  const results: EvaluationResult[] = [];
  const MAX_WEEKENDS_PER_MONTH = 2;

  // Count unique weekends worked per employee per month
  // Map: employeeId -> monthKey -> Set of weekend keys
  const weekendsByEmployeeMonth = new Map<
    string,
    Map<string, Set<string>>
  >();

  for (const assignment of context.assignments) {
    const date = parseISO(assignment.date);

    if (!isWeekend(date)) continue;

    const monthKey = `${getYear(date)}-${String(getMonth(date) + 1).padStart(2, '0')}`;
    const weekendKey = getWeekendKey(date);

    if (!weekendsByEmployeeMonth.has(assignment.employeeId)) {
      weekendsByEmployeeMonth.set(assignment.employeeId, new Map());
    }

    const employeeMonths = weekendsByEmployeeMonth.get(assignment.employeeId)!;
    if (!employeeMonths.has(monthKey)) {
      employeeMonths.set(monthKey, new Set());
    }

    employeeMonths.get(monthKey)!.add(weekendKey);
  }

  // Check for violations
  for (const [employeeId, months] of weekendsByEmployeeMonth) {
    for (const [monthKey, weekendKeys] of months) {
      const uniqueWeekends = weekendKeys.size;

      if (uniqueWeekends > MAX_WEEKENDS_PER_MONTH) {
        const employee = context.employees.find((e) => e.id === employeeId);

        // Get the actual weekend dates for the metadata
        const weekendDates: string[] = [];
        for (const assignment of context.assignments) {
          if (assignment.employeeId !== employeeId) continue;
          const date = parseISO(assignment.date);
          if (!isWeekend(date)) continue;

          const assignmentMonthKey = `${getYear(date)}-${String(getMonth(date) + 1).padStart(2, '0')}`;
          if (assignmentMonthKey === monthKey) {
            weekendDates.push(assignment.date);
          }
        }

        results.push({
          ruleId: 'MAX_WEEKENDS_PER_MONTH',
          ruleName: 'Maximum 2 Weekends per Month',
          ruleType: 'soft',
          passed: false,
          message: `${employee?.name || employeeId} has ${uniqueWeekends} weekends scheduled in ${monthKey} (recommended maximum ${MAX_WEEKENDS_PER_MONTH})`,
          severity: 'warning',
          affectedEntities: {
            employeeIds: [employeeId],
            shiftIds: [],
            dates: weekendDates,
          },
          metadata: {
            monthKey,
            weekendCount: uniqueWeekends,
            maxRecommended: MAX_WEEKENDS_PER_MONTH,
            excessWeekends: uniqueWeekends - MAX_WEEKENDS_PER_MONTH,
          },
        });
      }
    }
  }

  return results;
}
