import { EvaluationContext, EvaluationResult } from './types';

/**
 * Availability status codes that indicate an employee IS available
 * If there's no entry or a code not in this set, the employee is NOT available
 */
const AVAILABLE_CODES = new Set([
  'if',   // Anwesend (Vollzeit) - Present full-time
  '14',   // Anwesend (8-14 Uhr) - Present 8-14
  '15',   // Anwesend (8-15.15 Uhr) - Present 8-15:15
  'pr',   // Praxis - Practice
]);

/**
 * Availability status codes that indicate partial availability (restricted hours)
 */
const PARTIAL_AVAILABILITY_CODES = new Set([
  '14',   // Anwesend (8-14 Uhr)
  '15',   // Anwesend (8-15.15 Uhr)
  'ka',   // keine Ambulanz (no outpatient clinic)
]);

/**
 * Maps availability codes to human-readable labels
 */
const AVAILABILITY_LABELS: Record<string, string> = {
  'uw': 'Urlaubs-Wunsch',
  'nd': 'sonst. abwesend',
  'EZ': 'Elternzeit',
  'rot': 'Rotation',
  'FZA': 'Freizeitausgleich',
  'St': 'Station v Frer',
  'Co': 'COVID Studienpatienten',
  '14': 'Anwesend (8-14 Uhr)',
  '15': 'Anwesend (8-15.15 Uhr)',
  'ka': 'keine Ambulanz',
};

/**
 * Evaluates that employees are not assigned to shifts when they are unavailable
 * based on their availability data (Verfügbarkeiten)
 */
export function evaluateAvailabilityViolation(
  context: EvaluationContext & { availability?: Record<string, Record<string, string | null>> }
): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  // If no availability data provided, skip this check
  if (!context.availability) {
    return results;
  }

  for (const assignment of context.assignments) {
    const employee = context.employees.find((e) => e.id === assignment.employeeId);
    if (!employee) continue;

    // Extract day number from date (YYYY-MM-DD -> DD as number)
    const dateObj = new Date(assignment.date);
    const dayOfMonth = dateObj.getDate();

    // Get availability for this employee on this day
    const employeeAvailability = context.availability[employee.initials];
    if (!employeeAvailability) continue;

    const availabilityCode = employeeAvailability[dayOfMonth] || employeeAvailability[dayOfMonth.toString()];

    // Check for complete unavailability: no entry or not in AVAILABLE_CODES means unavailable
    const isUnavailable = !availabilityCode || !AVAILABLE_CODES.has(availabilityCode);

    if (isUnavailable) {
      const shift = context.shifts.find((s) => s.id === assignment.shiftId);
      const label = availabilityCode ? (AVAILABILITY_LABELS[availabilityCode] || availabilityCode) : 'Keine Verfügbarkeit eingetragen';

      results.push({
        ruleId: 'AVAILABILITY_VIOLATION',
        ruleName: 'Verfügbarkeit missachtet',
        ruleType: 'hard',
        passed: false,
        message: `${employee.name} ist am ${assignment.date} nicht verfügbar (${label}), aber für ${shift?.name || 'Schicht'} eingeteilt`,
        severity: 'error',
        affectedEntities: {
          employeeIds: [employee.id],
          shiftIds: [assignment.shiftId],
          dates: [assignment.date],
        },
        metadata: {
          availabilityCode: availabilityCode || 'none',
          availabilityLabel: label,
          employeeInitials: employee.initials,
          dayOfMonth,
        },
      });
    }

    // Optionally check for partial availability (warnings)
    if (availabilityCode && PARTIAL_AVAILABILITY_CODES.has(availabilityCode)) {
      const shift = context.shifts.find((s) => s.id === assignment.shiftId);
      const label = AVAILABILITY_LABELS[availabilityCode] || availabilityCode;

      // This is a soft warning - employee might be available but with restrictions
      results.push({
        ruleId: 'AVAILABILITY_PARTIAL',
        ruleName: 'Eingeschränkte Verfügbarkeit',
        ruleType: 'soft',
        passed: false,
        message: `${employee.name} hat am ${assignment.date} eingeschränkte Verfügbarkeit (${label}), prüfen Sie die Schichtzeiten für ${shift?.name || 'Schicht'}`,
        severity: 'warning',
        affectedEntities: {
          employeeIds: [employee.id],
          shiftIds: [assignment.shiftId],
          dates: [assignment.date],
        },
        metadata: {
          availabilityCode,
          availabilityLabel: label,
          employeeInitials: employee.initials,
          dayOfMonth,
        },
      });
    }
  }

  return results;
}
