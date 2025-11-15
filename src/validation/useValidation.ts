/**
 * React Hook for Validation
 *
 * Provides easy integration of validation pipeline with React components.
 * Handles debouncing, auto-validation, and state management.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ValidationPipeline,
  ValidationResult,
  ValidationOptions,
} from './pipeline';
import {
  ShiftAssignment,
  Employee,
  Shift,
  SchedulingRule,
} from './evaluators';
import { invalidateCache } from './memoization';

/**
 * Options for useValidation hook
 */
export interface UseValidationOptions {
  // Automatically validate when data changes
  autoValidate?: boolean;

  // Debounce time in ms (default 500ms)
  debounceMs?: number;

  // Only check hard rules
  hardRulesOnly?: boolean;

  // Initial validation options
  validationOptions?: ValidationOptions;
}

/**
 * Return type for useValidation hook
 */
export interface UseValidationReturn {
  // Latest validation result
  result: ValidationResult | null;

  // Whether validation is currently running
  isValidating: boolean;

  // Manually trigger full schedule validation
  validateAll: (options?: ValidationOptions) => ValidationResult | null;

  // Validate a single assignment
  validateSingle: (assignment: ShiftAssignment) => ValidationResult | null;

  // Check if a proposed assignment is valid
  isAssignmentValid: (assignment: ShiftAssignment) => boolean;

  // Get violations for specific employee
  getEmployeeViolations: (employeeId: string) => {
    hard: ValidationResult['hardViolations'];
    soft: ValidationResult['softViolations'];
  };

  // Get violations for specific date
  getDateViolations: (date: string) => {
    hard: ValidationResult['hardViolations'];
    soft: ValidationResult['softViolations'];
  };

  // Clear validation results
  clearResult: () => void;

  // Toggle auto-validation
  setAutoValidate: (enabled: boolean) => void;

  // Force re-validation (clears cache first)
  forceRevalidate: () => void;
}

/**
 * React hook for schedule validation
 *
 * @example
 * ```tsx
 * function ScheduleView({ assignments, employees, shifts, rules }) {
 *   const {
 *     result,
 *     isValidating,
 *     validateAll,
 *     validateSingle
 *   } = useValidation(assignments, employees, shifts, rules, '2025-01-01', '2025-01-31');
 *
 *   useEffect(() => {
 *     if (result && !result.isValid) {
 *       console.log('Schedule has violations:', result.hardViolations);
 *     }
 *   }, [result]);
 *
 *   return (
 *     <div>
 *       {isValidating && <Spinner />}
 *       {result?.hardViolationCount > 0 && (
 *         <Alert>Schedule has {result.hardViolationCount} violations</Alert>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useValidation(
  assignments: ShiftAssignment[],
  employees: Employee[],
  shifts: Shift[],
  rules: SchedulingRule[],
  startDate: string,
  endDate: string,
  options: UseValidationOptions = {}
): UseValidationReturn {
  const {
    autoValidate = true,
    debounceMs = 500,
    hardRulesOnly = false,
    validationOptions = {},
  } = options;

  // State
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [autoValidateEnabled, setAutoValidateEnabled] = useState(autoValidate);

  // Refs for debouncing
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef({
    assignments,
    employees,
    shifts,
    rules,
    startDate,
    endDate,
  });

  // Update ref when data changes
  useEffect(() => {
    latestDataRef.current = {
      assignments,
      employees,
      shifts,
      rules,
      startDate,
      endDate,
    };
  }, [assignments, employees, shifts, rules, startDate, endDate]);

  // Create pipeline (memoized)
  const pipeline = useMemo(() => {
    if (assignments.length === 0) return null;

    return new ValidationPipeline(
      assignments,
      employees,
      shifts,
      rules,
      startDate,
      endDate,
      { ...validationOptions, hardRulesOnly }
    );
  }, [
    assignments,
    employees,
    shifts,
    rules,
    startDate,
    endDate,
    validationOptions,
    hardRulesOnly,
  ]);

  // Validate all assignments
  const validateAll = useCallback(
    (_opts?: ValidationOptions): ValidationResult | null => {
      if (!pipeline) return null;

      setIsValidating(true);

      try {
        const validationResult = pipeline.validateSchedule();
        setResult(validationResult);
        return validationResult;
      } finally {
        setIsValidating(false);
      }
    },
    [pipeline]
  );

  // Validate single assignment
  const validateSingle = useCallback(
    (assignment: ShiftAssignment): ValidationResult | null => {
      if (!pipeline) return null;

      return pipeline.validateSingleAssignment(assignment);
    },
    [pipeline]
  );

  // Check if assignment is valid (boolean helper)
  const isAssignmentValidFn = useCallback(
    (assignment: ShiftAssignment): boolean => {
      const singleResult = validateSingle(assignment);
      return singleResult ? singleResult.isValid : true;
    },
    [validateSingle]
  );

  // Get violations for employee
  const getEmployeeViolations = useCallback(
    (employeeId: string) => {
      if (!result) {
        return { hard: [], soft: [] };
      }

      return {
        hard: result.hardViolations.filter((v) =>
          v.affectedEntities.employeeIds.includes(employeeId)
        ),
        soft: result.softViolations.filter((v) =>
          v.affectedEntities.employeeIds.includes(employeeId)
        ),
      };
    },
    [result]
  );

  // Get violations for date
  const getDateViolations = useCallback(
    (date: string) => {
      if (!result) {
        return { hard: [], soft: [] };
      }

      return {
        hard: result.hardViolations.filter((v) =>
          v.affectedEntities.dates.includes(date)
        ),
        soft: result.softViolations.filter((v) =>
          v.affectedEntities.dates.includes(date)
        ),
      };
    },
    [result]
  );

  // Clear result
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  // Toggle auto-validate
  const setAutoValidate = useCallback((enabled: boolean) => {
    setAutoValidateEnabled(enabled);
  }, []);

  // Force re-validation (clears cache)
  const forceRevalidate = useCallback(() => {
    invalidateCache.onAnyAssignmentChange();
    validateAll();
  }, [validateAll]);

  // Auto-validate with debounce when data changes
  useEffect(() => {
    if (!autoValidateEnabled || !pipeline) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      validateAll();
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    assignments,
    autoValidateEnabled,
    debounceMs,
    pipeline,
    validateAll,
  ]);

  return {
    result,
    isValidating,
    validateAll,
    validateSingle,
    isAssignmentValid: isAssignmentValidFn,
    getEmployeeViolations,
    getDateViolations,
    clearResult,
    setAutoValidate,
    forceRevalidate,
  };
}

/**
 * Simplified hook for validating a single assignment on change
 *
 * @example
 * ```tsx
 * function AssignmentEditor({ assignment, onChange }) {
 *   const { isValid, violations } = useSingleAssignmentValidation(
 *     assignment,
 *     allAssignments,
 *     employees,
 *     shifts,
 *     rules,
 *     dateRange
 *   );
 *
 *   return (
 *     <div className={isValid ? '' : 'border-red-500'}>
 *       {!isValid && <div>{violations[0]?.message}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSingleAssignmentValidation(
  assignment: ShiftAssignment | null,
  currentAssignments: ShiftAssignment[],
  employees: Employee[],
  shifts: Shift[],
  rules: SchedulingRule[],
  dateRange: { start: string; end: string }
): {
  isValid: boolean;
  violations: ValidationResult['hardViolations'];
  warnings: ValidationResult['softViolations'];
  isValidating: boolean;
} {
  const [isValid, setIsValid] = useState(true);
  const [violations, setViolations] = useState<
    ValidationResult['hardViolations']
  >([]);
  const [warnings, setWarnings] = useState<ValidationResult['softViolations']>(
    []
  );
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!assignment) {
      setIsValid(true);
      setViolations([]);
      setWarnings([]);
      return;
    }

    setIsValidating(true);

    // Use requestIdleCallback for non-blocking validation
    const validate = () => {
      const pipeline = new ValidationPipeline(
        currentAssignments,
        employees,
        shifts,
        rules,
        dateRange.start,
        dateRange.end
      );

      const result = pipeline.validateSingleAssignment(assignment);

      setIsValid(result.isValid);
      setViolations(result.hardViolations);
      setWarnings(result.softViolations);
      setIsValidating(false);
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(validate, { timeout: 100 });
      return () => cancelIdleCallback(id);
    } else {
      const timeoutId = setTimeout(validate, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [
    assignment,
    currentAssignments,
    employees,
    shifts,
    rules,
    dateRange.start,
    dateRange.end,
  ]);

  return { isValid, violations, warnings, isValidating };
}
