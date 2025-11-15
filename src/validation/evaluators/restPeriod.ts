import {
  EvaluationContext,
  EvaluationResult,
  TimeRange,
  Shift,
} from './types';
import { parseISO, differenceInMinutes, addDays } from 'date-fns';

interface ParsedTime {
  hours: number;
  minutes: number;
}

/**
 * Parse shift time string or object into start and end times
 */
function parseShiftTime(
  time: TimeRange | string
): { start: ParsedTime; end: ParsedTime } | null {
  if (typeof time === 'string') {
    // Handle "Flexibel" or "Ganztags"
    if (time === 'Flexibel' || time === 'Ganztags') {
      return null; // Skip validation for flexible shifts
    }
    // Parse "HH:MM-HH:MM" format
    const parts = time.split('-');
    if (parts.length !== 2) return null;

    const [startStr, endStr] = parts;
    const startParts = startStr.split(':');
    const endParts = endStr.split(':');

    if (startParts.length !== 2 || endParts.length !== 2) return null;

    return {
      start: {
        hours: parseInt(startParts[0], 10),
        minutes: parseInt(startParts[1], 10),
      },
      end: {
        hours: parseInt(endParts[0], 10),
        minutes: parseInt(endParts[1], 10),
      },
    };
  }

  // TimeRange object
  const startParts = time.start.split(':');
  const endParts = time.end.split(':');

  if (startParts.length !== 2 || endParts.length !== 2) return null;

  return {
    start: {
      hours: parseInt(startParts[0], 10),
      minutes: parseInt(startParts[1], 10),
    },
    end: {
      hours: parseInt(endParts[0], 10),
      minutes: parseInt(endParts[1], 10),
    },
  };
}

/**
 * Calculate actual rest time between two shifts
 */
function calculateRestMinutes(
  currentDate: Date,
  currentShift: Shift,
  nextDate: Date,
  nextShift: Shift
): number | null {
  const currentTime = parseShiftTime(currentShift.time);
  const nextTime = parseShiftTime(nextShift.time);

  if (!currentTime || !nextTime) return null;

  // Create end datetime for current shift
  const currentEndDateTime = new Date(currentDate);
  currentEndDateTime.setHours(
    currentTime.end.hours,
    currentTime.end.minutes,
    0,
    0
  );

  // Handle overnight shifts (end time < start time means next day)
  const currentStartMinutes =
    currentTime.start.hours * 60 + currentTime.start.minutes;
  const currentEndMinutes =
    currentTime.end.hours * 60 + currentTime.end.minutes;

  if (currentEndMinutes < currentStartMinutes) {
    // Shift ends next day
    currentEndDateTime.setTime(addDays(currentEndDateTime, 1).getTime());
  }

  // Create start datetime for next shift
  const nextStartDateTime = new Date(nextDate);
  nextStartDateTime.setHours(
    nextTime.start.hours,
    nextTime.start.minutes,
    0,
    0
  );

  return differenceInMinutes(nextStartDateTime, currentEndDateTime);
}

/**
 * Evaluates that employees have minimum 11 hours rest between shifts
 */
export function evaluateRestPeriod(
  context: EvaluationContext
): EvaluationResult[] {
  const results: EvaluationResult[] = [];
  const MIN_REST_HOURS = 11;
  const MIN_REST_MINUTES = MIN_REST_HOURS * 60;

  // Group assignments by employee
  const assignmentsByEmployee = new Map<
    string,
    Array<{ assignment: typeof context.assignments[0]; date: Date }>
  >();

  for (const assignment of context.assignments) {
    if (!assignmentsByEmployee.has(assignment.employeeId)) {
      assignmentsByEmployee.set(assignment.employeeId, []);
    }
    assignmentsByEmployee.get(assignment.employeeId)!.push({
      assignment,
      date: parseISO(assignment.date),
    });
  }

  // Check each employee's schedule
  for (const [employeeId, empAssignments] of assignmentsByEmployee) {
    // Sort by date
    const sorted = empAssignments.sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Check consecutive days
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // Only check if assignments are on consecutive days or same day
      const daysDiff = differenceInMinutes(next.date, current.date) / (24 * 60);
      if (daysDiff > 2) continue; // Skip if more than 2 days apart

      const currentShift = context.shifts.find(
        (s) => s.id === current.assignment.shiftId
      );
      const nextShift = context.shifts.find(
        (s) => s.id === next.assignment.shiftId
      );

      if (!currentShift || !nextShift) continue;

      const restMinutes = calculateRestMinutes(
        current.date,
        currentShift,
        next.date,
        nextShift
      );

      if (restMinutes === null) continue; // Skip flexible shifts

      if (restMinutes < MIN_REST_MINUTES) {
        const employee = context.employees.find((e) => e.id === employeeId);
        const restHours = Math.floor(restMinutes / 60);
        const restMins = restMinutes % 60;

        results.push({
          ruleId: 'REST_PERIOD_11H',
          ruleName: 'Minimum 11h Rest Period',
          ruleType: 'hard',
          passed: false,
          message: `${employee?.name || employeeId} has only ${restHours}h ${restMins}m rest between ${current.assignment.date} and ${next.assignment.date} (minimum 11h required)`,
          severity: 'error',
          affectedEntities: {
            employeeIds: [employeeId],
            shiftIds: [current.assignment.shiftId, next.assignment.shiftId],
            dates: [current.assignment.date, next.assignment.date],
          },
          metadata: {
            actualRestMinutes: restMinutes,
            requiredRestMinutes: MIN_REST_MINUTES,
            currentShift: currentShift.name,
            nextShift: nextShift.name,
          },
        });
      }
    }
  }

  return results;
}
