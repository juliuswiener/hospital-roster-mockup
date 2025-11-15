import { EvaluationContext, EvaluationResult } from './types';
import { parseISO, eachDayOfInterval, format } from 'date-fns';

/**
 * Evaluates that minimum staffing requirements are met for each shift type on each day
 */
export function evaluateMinStaffing(
  context: EvaluationContext
): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  // Generate all dates in range
  const dates = eachDayOfInterval({
    start: parseISO(context.startDate),
    end: parseISO(context.endDate),
  }).map((d) => format(d, 'yyyy-MM-dd'));

  // Check each shift type for each date
  for (const shift of context.shifts) {
    // Skip shifts that don't have minimum staffing requirements
    if (!shift.requirements || shift.requirements.length === 0) continue;

    // Parse minimum staffing requirement
    const minStaffReq = shift.requirements.find((r) => r.includes('Min.'));
    if (!minStaffReq) continue;

    const match = minStaffReq.match(/\d+/);
    if (!match) continue;

    const minCount = parseInt(match[0], 10);

    for (const date of dates) {
      const assignmentsForShift = context.assignments.filter(
        (a) => a.shiftId === shift.id && a.date === date
      );

      if (assignmentsForShift.length < minCount) {
        results.push({
          ruleId: 'MIN_STAFFING',
          ruleName: 'Minimum Staffing Requirements',
          ruleType: 'hard',
          passed: false,
          message: `${shift.name} on ${date} has ${assignmentsForShift.length} staff assigned (minimum ${minCount} required)`,
          severity: 'error',
          affectedEntities: {
            employeeIds: assignmentsForShift.map((a) => a.employeeId),
            shiftIds: [shift.id],
            dates: [date],
          },
          metadata: {
            shiftName: shift.name,
            actualCount: assignmentsForShift.length,
            requiredCount: minCount,
            shortfall: minCount - assignmentsForShift.length,
          },
        });
      }
    }
  }

  return results;
}
