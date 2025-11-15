import { EvaluationContext, EvaluationResult } from './types';

/**
 * Evaluates that no employee is assigned to multiple shifts on the same day
 */
export function evaluateNoDoubleBooking(
  context: EvaluationContext
): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  // Map: employeeId -> date -> assignment IDs
  const bookings = new Map<string, Map<string, string[]>>();

  for (const assignment of context.assignments) {
    if (!bookings.has(assignment.employeeId)) {
      bookings.set(assignment.employeeId, new Map());
    }

    const employeeBookings = bookings.get(assignment.employeeId)!;
    if (!employeeBookings.has(assignment.date)) {
      employeeBookings.set(assignment.date, []);
    }

    employeeBookings.get(assignment.date)!.push(assignment.shiftId);
  }

  // Check for double bookings
  for (const [employeeId, dates] of bookings) {
    for (const [date, shiftIds] of dates) {
      if (shiftIds.length > 1) {
        const employee = context.employees.find((e) => e.id === employeeId);
        const shiftNames = shiftIds
          .map((id) => context.shifts.find((s) => s.id === id)?.name || id)
          .join(', ');

        results.push({
          ruleId: 'NO_DOUBLE_BOOKING',
          ruleName: 'No Double Booking',
          ruleType: 'hard',
          passed: false,
          message: `${employee?.name || employeeId} is assigned to multiple shifts on ${date}: ${shiftNames}`,
          severity: 'error',
          affectedEntities: {
            employeeIds: [employeeId],
            shiftIds: shiftIds,
            dates: [date],
          },
          metadata: {
            shiftCount: shiftIds.length,
          },
        });
      }
    }
  }

  return results;
}
