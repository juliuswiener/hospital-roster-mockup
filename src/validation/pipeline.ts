/**
 * Validation Pipeline
 *
 * Main orchestrator for running rule evaluators against schedule data.
 * Provides methods for both full schedule validation and single assignment checks.
 */

import {
  EvaluationContext,
  EvaluationResult,
  evaluatorRegistry,
  ShiftAssignment,
  Employee,
  Shift,
  SchedulingRule,
} from './evaluators';

/**
 * Complete validation result for a schedule
 */
export interface ValidationResult {
  isValid: boolean;
  hardViolations: EvaluationResult[];
  softViolations: EvaluationResult[];
  timestamp: string;
  duration: number; // milliseconds
  statistics: {
    totalRulesChecked: number;
    hardViolationCount: number;
    softViolationCount: number;
    affectedEmployees: string[];
    affectedDates: string[];
  };
}

/**
 * Options for validation pipeline
 */
export interface ValidationOptions {
  // Only run specific evaluators by name
  evaluatorNames?: string[];

  // Skip soft rule evaluation (faster)
  hardRulesOnly?: boolean;

  // Stop on first hard violation (faster for quick checks)
  failFast?: boolean;

  // Custom rules from database (for future use)
  customRules?: SchedulingRule[];
}

/**
 * Main validation pipeline class
 *
 * Usage:
 * ```typescript
 * const pipeline = new ValidationPipeline(assignments, employees, shifts, rules, startDate, endDate);
 * const result = pipeline.validateSchedule();
 * ```
 */
export class ValidationPipeline {
  private context: EvaluationContext;
  private options: ValidationOptions;

  constructor(
    assignments: ShiftAssignment[],
    employees: Employee[],
    shifts: Shift[],
    rules: SchedulingRule[],
    startDate: string,
    endDate: string,
    options: ValidationOptions = {}
  ) {
    this.context = {
      assignments,
      employees,
      shifts,
      rules,
      startDate,
      endDate,
    };
    this.options = options;
  }

  /**
   * Validate entire schedule against all applicable rules
   *
   * @returns ValidationResult with all violations found
   */
  validateSchedule(): ValidationResult {
    const startTime = performance.now();
    const hardViolations: EvaluationResult[] = [];
    const softViolations: EvaluationResult[] = [];

    // Select evaluators to run
    let evaluators = [...evaluatorRegistry];

    // Filter by specific names if provided
    if (this.options.evaluatorNames && this.options.evaluatorNames.length > 0) {
      evaluators = evaluators.filter((e) =>
        this.options.evaluatorNames!.includes(e.name)
      );
    }

    // Skip soft rules if requested
    if (this.options.hardRulesOnly) {
      evaluators = evaluators.filter((e) => e.appliesTo !== 'soft');
    }

    // Run each evaluator
    for (const entry of evaluators) {
      try {
        const results = entry.evaluator(this.context);

        for (const result of results) {
          if (!result.passed) {
            if (result.ruleType === 'hard') {
              hardViolations.push(result);

              // Stop early if failFast is enabled
              if (this.options.failFast) {
                return this.buildResult(
                  hardViolations,
                  softViolations,
                  startTime,
                  evaluators.length
                );
              }
            } else {
              softViolations.push(result);
            }
          }
        }
      } catch (error) {
        console.error(`Evaluator ${entry.name} failed:`, error);
        // Continue with other evaluators - don't let one failure stop everything
      }
    }

    return this.buildResult(
      hardViolations,
      softViolations,
      startTime,
      evaluators.length
    );
  }

  /**
   * Validate a single assignment for instant feedback on manual changes
   *
   * This is optimized for speed - only runs evaluators relevant to single assignments
   * and filters results to only show violations affecting the target assignment.
   *
   * @param assignment The assignment being validated
   * @returns ValidationResult focused on the single assignment
   */
  validateSingleAssignment(assignment: ShiftAssignment): ValidationResult {
    const startTime = performance.now();
    const hardViolations: EvaluationResult[] = [];
    const softViolations: EvaluationResult[] = [];

    // Set target assignment in context for evaluators that support it
    const focusedContext: EvaluationContext = {
      ...this.context,
      targetAssignment: assignment,
    };

    // Only run evaluators that make sense for single assignment validation
    const relevantEvaluatorNames = [
      'QUALIFICATION_MATCH', // Does employee have required qualifications?
      'NO_DOUBLE_BOOKING', // Is employee already booked on this day?
      'REST_PERIOD_11H', // Does this violate rest periods?
      'MAX_WEEKLY_HOURS_48', // Will this push employee over weekly limit?
      'MAX_WEEKENDS_PER_MONTH', // Weekend distribution check
    ];

    const relevantEvaluators = evaluatorRegistry.filter((e) =>
      relevantEvaluatorNames.includes(e.name)
    );

    for (const entry of relevantEvaluators) {
      try {
        const results = entry.evaluator(focusedContext);

        // Filter to only results affecting the target assignment
        const relevantResults = results.filter(
          (r) =>
            r.affectedEntities.dates.includes(assignment.date) &&
            r.affectedEntities.employeeIds.includes(assignment.employeeId)
        );

        for (const result of relevantResults) {
          if (!result.passed) {
            if (result.ruleType === 'hard') {
              hardViolations.push(result);
            } else {
              softViolations.push(result);
            }
          }
        }
      } catch (error) {
        console.error(`Evaluator ${entry.name} failed:`, error);
      }
    }

    return this.buildResult(
      hardViolations,
      softViolations,
      startTime,
      relevantEvaluators.length
    );
  }

  /**
   * Get violations for a specific employee
   *
   * @param employeeId Employee to check
   * @returns All violations affecting this employee
   */
  getViolationsForEmployee(employeeId: string): {
    hard: EvaluationResult[];
    soft: EvaluationResult[];
  } {
    const result = this.validateSchedule();

    return {
      hard: result.hardViolations.filter((v) =>
        v.affectedEntities.employeeIds.includes(employeeId)
      ),
      soft: result.softViolations.filter((v) =>
        v.affectedEntities.employeeIds.includes(employeeId)
      ),
    };
  }

  /**
   * Get violations for a specific date
   *
   * @param date Date to check (YYYY-MM-DD format)
   * @returns All violations on this date
   */
  getViolationsForDate(date: string): {
    hard: EvaluationResult[];
    soft: EvaluationResult[];
  } {
    const result = this.validateSchedule();

    return {
      hard: result.hardViolations.filter((v) =>
        v.affectedEntities.dates.includes(date)
      ),
      soft: result.softViolations.filter((v) =>
        v.affectedEntities.dates.includes(date)
      ),
    };
  }

  /**
   * Update the context (e.g., after assignments change)
   */
  updateContext(updates: Partial<EvaluationContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Get current context (for debugging)
   */
  getContext(): EvaluationContext {
    return { ...this.context };
  }

  /**
   * Build the final validation result with statistics
   */
  private buildResult(
    hardViolations: EvaluationResult[],
    softViolations: EvaluationResult[],
    startTime: number,
    totalRulesChecked: number
  ): ValidationResult {
    const endTime = performance.now();

    // Collect unique affected entities
    const allViolations = [...hardViolations, ...softViolations];
    const affectedEmployees = [
      ...new Set(allViolations.flatMap((v) => v.affectedEntities.employeeIds)),
    ];
    const affectedDates = [
      ...new Set(allViolations.flatMap((v) => v.affectedEntities.dates)),
    ];

    return {
      isValid: hardViolations.length === 0,
      hardViolations,
      softViolations,
      timestamp: new Date().toISOString(),
      duration: endTime - startTime,
      statistics: {
        totalRulesChecked,
        hardViolationCount: hardViolations.length,
        softViolationCount: softViolations.length,
        affectedEmployees,
        affectedDates,
      },
    };
  }
}

/**
 * Factory function for quick validation without instantiating pipeline
 *
 * @example
 * ```typescript
 * const result = validateSchedule(assignments, employees, shifts, rules, '2025-01-01', '2025-01-31');
 * if (!result.isValid) {
 *   console.log('Violations:', result.hardViolations);
 * }
 * ```
 */
export function validateSchedule(
  assignments: ShiftAssignment[],
  employees: Employee[],
  shifts: Shift[],
  rules: SchedulingRule[],
  startDate: string,
  endDate: string,
  options?: ValidationOptions
): ValidationResult {
  const pipeline = new ValidationPipeline(
    assignments,
    employees,
    shifts,
    rules,
    startDate,
    endDate,
    options
  );
  return pipeline.validateSchedule();
}

/**
 * Validate single assignment for instant feedback
 *
 * @example
 * ```typescript
 * const newAssignment = { employeeId: '...', shiftId: '...', date: '2025-01-15', ... };
 * const result = validateAssignment(newAssignment, currentAssignments, employees, shifts, rules, { start: '2025-01-01', end: '2025-01-31' });
 * if (!result.isValid) {
 *   alert('Cannot assign: ' + result.hardViolations[0].message);
 * }
 * ```
 */
export function validateAssignment(
  assignment: ShiftAssignment,
  currentAssignments: ShiftAssignment[],
  employees: Employee[],
  shifts: Shift[],
  rules: SchedulingRule[],
  dateRange: { start: string; end: string }
): ValidationResult {
  const pipeline = new ValidationPipeline(
    currentAssignments,
    employees,
    shifts,
    rules,
    dateRange.start,
    dateRange.end
  );
  return pipeline.validateSingleAssignment(assignment);
}

/**
 * Quick check if a proposed assignment would be valid
 * Returns just boolean for simple checks
 */
export function isAssignmentValid(
  assignment: ShiftAssignment,
  currentAssignments: ShiftAssignment[],
  employees: Employee[],
  shifts: Shift[],
  rules: SchedulingRule[],
  dateRange: { start: string; end: string }
): boolean {
  const result = validateAssignment(
    assignment,
    currentAssignments,
    employees,
    shifts,
    rules,
    dateRange
  );
  return result.isValid;
}
