import { EvaluationContext, EvaluationResult, Employee, Shift } from './types';

/**
 * Check if employee has a specific qualification
 */
function hasQualification(employee: Employee, qualification: string): boolean {
  return employee.qualifications.includes(qualification);
}

/**
 * Check if employee meets all shift requirements
 */
function checkShiftRequirements(
  employee: Employee,
  shift: Shift
): { canWork: boolean; missingRequirements: string[] } {
  const missingRequirements: string[] = [];

  for (const requirement of shift.requirements) {
    // Check contract type requirements
    if (
      requirement === 'Oberarzt' &&
      employee.contractType !== 'Oberarzt' &&
      employee.contractType !== 'Chefarzt'
    ) {
      missingRequirements.push('Requires Oberarzt or Chefarzt');
    }

    if (requirement === 'Facharzt' && !hasQualification(employee, 'Facharzt')) {
      missingRequirements.push('Requires Facharzt qualification');
    }

    if (
      requirement === 'ABS-zertifiziert' &&
      !hasQualification(employee, 'ABS-zertifiziert')
    ) {
      missingRequirements.push('Requires ABS certification');
    }

    // Check for specific qualification requirements in requirement text
    if (
      requirement.includes('Notfallzertifizierung') &&
      !hasQualification(employee, 'Notfallzertifizierung')
    ) {
      missingRequirements.push('Requires Notfallzertifizierung');
    }
  }

  // Also check shift-specific rules
  for (const rule of shift.rules) {
    if (
      rule.includes('Notfallzertifizierung erforderlich') &&
      !hasQualification(employee, 'Notfallzertifizierung')
    ) {
      if (!missingRequirements.includes('Requires Notfallzertifizierung')) {
        missingRequirements.push('Requires Notfallzertifizierung');
      }
    }

    if (
      rule.includes('ABS-Zertifizierung zwingend') &&
      !hasQualification(employee, 'ABS-zertifiziert')
    ) {
      if (!missingRequirements.includes('Requires ABS certification')) {
        missingRequirements.push('Requires ABS certification');
      }
    }

    if (
      rule.includes('Oberarzt-Level') &&
      employee.contractType !== 'Oberarzt' &&
      employee.contractType !== 'Chefarzt'
    ) {
      if (!missingRequirements.includes('Requires Oberarzt or Chefarzt')) {
        missingRequirements.push('Requires Oberarzt or Chefarzt');
      }
    }

    if (
      rule.includes('Nur Chefarzt oder Oberarzt') &&
      employee.contractType !== 'Oberarzt' &&
      employee.contractType !== 'Chefarzt'
    ) {
      if (!missingRequirements.includes('Requires Oberarzt or Chefarzt')) {
        missingRequirements.push('Requires Oberarzt or Chefarzt');
      }
    }

    if (
      rule.includes('Keine Assistenzärzte im ersten Jahr') &&
      employee.contractType === 'Assistenzarzt'
    ) {
      // Check if employee is in first year
      if (employee.startDate) {
        const startDate = new Date(employee.startDate);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        if (startDate > oneYearAgo) {
          missingRequirements.push('First-year residents not allowed');
        }
      }
    }
  }

  return {
    canWork: missingRequirements.length === 0,
    missingRequirements,
  };
}

/**
 * Evaluates that employee qualifications match shift requirements
 */
export function evaluateQualificationMatch(
  context: EvaluationContext
): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  for (const assignment of context.assignments) {
    const employee = context.employees.find(
      (e) => e.id === assignment.employeeId
    );
    const shift = context.shifts.find((s) => s.id === assignment.shiftId);

    if (!employee || !shift) continue;

    const { canWork, missingRequirements } = checkShiftRequirements(
      employee,
      shift
    );

    if (!canWork) {
      results.push({
        ruleId: 'QUALIFICATION_MATCH',
        ruleName: 'Qualification Requirements',
        ruleType: 'hard',
        passed: false,
        message: `${employee.name} cannot work ${shift.name}: ${missingRequirements.join(', ')}`,
        severity: 'error',
        affectedEntities: {
          employeeIds: [employee.id],
          shiftIds: [shift.id],
          dates: [assignment.date],
        },
        metadata: {
          missingRequirements,
          employeeQualifications: employee.qualifications,
          shiftRequirements: shift.requirements,
          shiftRules: shift.rules,
        },
      });
    }
  }

  return results;
}
