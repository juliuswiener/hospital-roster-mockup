# Implementation Plan: Validation Engine & Data Persistence

This document provides comprehensive implementation details for the constraint validation engine and data persistence layer. All architectural decisions are made here to minimize implementation ambiguity.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Rule Evaluators (Client-Side TypeScript)](#phase-1-rule-evaluators)
3. [Phase 2: Validation Pipeline](#phase-2-validation-pipeline)
4. [Phase 3: State Management (Redux Toolkit)](#phase-3-state-management)
5. [Phase 4: Data Persistence (PostgreSQL + Python API)](#phase-4-data-persistence)
6. [File Structure](#file-structure)
7. [Implementation Order](#implementation-order)

---

## Overview

### Constraints
- **Scale**: 35 employees, 15 shifts, 30 days
- **Performance Target**: Validation < 100ms for single assignment, < 500ms for full schedule
- **Architecture**: Client-side validation, server-side persistence
- **Stack**: TypeScript (frontend), Python (backend), PostgreSQL (database), Redux Toolkit (state)

### Why Client-Side Validation?
- Instant feedback on manual changes without server roundtrip
- OR-Tools solver runs server-side for optimization
- Validation logic mirrors solver constraints but runs faster for single-assignment checks

---

## Phase 1: Rule Evaluators

### 1.1 Directory Structure

```
src/
  validation/
    evaluators/
      index.ts                    # Barrel export
      types.ts                    # Type definitions
      restPeriod.ts               # 11h rest between shifts
      maxWeeklyHours.ts           # 48h weekly average
      maxConsecutiveDays.ts       # Max consecutive working days
      qualificationMatch.ts       # Employee qualifications vs shift requirements
      minStaffing.ts              # Minimum staffing per shift
      maxShiftFrequency.ts        # Max times per week for specific shifts
      weekendDistribution.ts      # Max weekends per month
      noDoubleBooking.ts          # Employee can't work two shifts same time
      contractCompliance.ts       # Contract type restrictions
```

### 1.2 Core Type Definitions

**File: `src/validation/evaluators/types.ts`**

```typescript
import { Employee, Shift, ShiftAssignment, SchedulingRule } from '../../data/models';

/**
 * Result of a single rule evaluation
 */
export interface EvaluationResult {
  ruleId: string;
  ruleName: string;
  ruleType: 'hard' | 'soft';
  passed: boolean;
  message: string;
  severity: 'error' | 'warning';
  affectedEntities: {
    employeeIds: string[];
    shiftIds: string[];
    dates: string[];
  };
  metadata?: Record<string, unknown>;
}

/**
 * Context provided to all evaluators
 */
export interface EvaluationContext {
  // Current schedule state
  assignments: ShiftAssignment[];

  // Master data
  employees: Employee[];
  shifts: Shift[];

  // Rules to evaluate
  rules: SchedulingRule[];

  // Date range for evaluation
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601

  // Optional: specific assignment being checked (for single-assignment validation)
  targetAssignment?: ShiftAssignment;
}

/**
 * Evaluator function signature
 */
export type RuleEvaluator = (context: EvaluationContext) => EvaluationResult[];

/**
 * Registry entry for an evaluator
 */
export interface EvaluatorRegistryEntry {
  name: string;
  description: string;
  evaluator: RuleEvaluator;
  appliesTo: 'hard' | 'soft' | 'both';
  category: string;
}
```

### 1.3 Individual Evaluator Implementations

#### 1.3.1 Rest Period Evaluator (11h minimum between shifts)

**File: `src/validation/evaluators/restPeriod.ts`**

```typescript
import { EvaluationContext, EvaluationResult } from './types';
import { parseISO, addHours, isBefore, differenceInMinutes } from 'date-fns';

interface ShiftTime {
  start: string;
  end: string;
}

function parseShiftTime(timeStr: string | ShiftTime): { start: Date; end: Date } | null {
  if (typeof timeStr === 'string') {
    // Handle "Flexibel" or "Ganztags"
    if (timeStr === 'Flexibel' || timeStr === 'Ganztags') {
      return null; // Skip validation for flexible shifts
    }
    // Parse "HH:MM-HH:MM" format
    const [start, end] = timeStr.split('-');
    if (!start || !end) return null;

    const today = new Date();
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startDate = new Date(today.setHours(startH, startM, 0, 0));
    let endDate = new Date(today.setHours(endH, endM, 0, 0));

    // Handle overnight shifts
    if (isBefore(endDate, startDate)) {
      endDate = addHours(endDate, 24);
    }

    return { start: startDate, end: endDate };
  }

  return parseShiftTime(`${timeStr.start}-${timeStr.end}`);
}

export function evaluateRestPeriod(context: EvaluationContext): EvaluationResult[] {
  const results: EvaluationResult[] = [];
  const MIN_REST_HOURS = 11;
  const MIN_REST_MINUTES = MIN_REST_HOURS * 60;

  // Group assignments by employee
  const assignmentsByEmployee = new Map<string, ShiftAssignment[]>();

  for (const assignment of context.assignments) {
    if (!assignmentsByEmployee.has(assignment.employeeId)) {
      assignmentsByEmployee.set(assignment.employeeId, []);
    }
    assignmentsByEmployee.get(assignment.employeeId)!.push(assignment);
  }

  // Check each employee's schedule
  for (const [employeeId, empAssignments] of assignmentsByEmployee) {
    // Sort by date
    const sorted = empAssignments.sort((a, b) =>
      parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );

    // Check consecutive days
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentAssignment = sorted[i];
      const nextAssignment = sorted[i + 1];

      const currentShift = context.shifts.find(s => s.id === currentAssignment.shiftId);
      const nextShift = context.shifts.find(s => s.id === nextAssignment.shiftId);

      if (!currentShift || !nextShift) continue;

      const currentTime = parseShiftTime(currentShift.time);
      const nextTime = parseShiftTime(nextShift.time);

      if (!currentTime || !nextTime) continue;

      // Calculate actual rest period
      const currentDate = parseISO(currentAssignment.date);
      const nextDate = parseISO(nextAssignment.date);

      // End time of current shift
      const currentEndDateTime = new Date(currentDate);
      currentEndDateTime.setHours(
        currentTime.end.getHours(),
        currentTime.end.getMinutes()
      );

      // Start time of next shift
      const nextStartDateTime = new Date(nextDate);
      nextStartDateTime.setHours(
        nextTime.start.getHours(),
        nextTime.start.getMinutes()
      );

      const restMinutes = differenceInMinutes(nextStartDateTime, currentEndDateTime);

      if (restMinutes < MIN_REST_MINUTES) {
        const employee = context.employees.find(e => e.id === employeeId);
        const restHours = Math.floor(restMinutes / 60);
        const restMins = restMinutes % 60;

        results.push({
          ruleId: 'REST_PERIOD_11H',
          ruleName: 'Minimum 11h Rest Period',
          ruleType: 'hard',
          passed: false,
          message: `${employee?.name || employeeId} has only ${restHours}h ${restMins}m rest between ${currentAssignment.date} and ${nextAssignment.date} (minimum 11h required)`,
          severity: 'error',
          affectedEntities: {
            employeeIds: [employeeId],
            shiftIds: [currentAssignment.shiftId, nextAssignment.shiftId],
            dates: [currentAssignment.date, nextAssignment.date],
          },
          metadata: {
            actualRestMinutes: restMinutes,
            requiredRestMinutes: MIN_REST_MINUTES,
          },
        });
      }
    }
  }

  return results;
}
```

#### 1.3.2 Maximum Weekly Hours Evaluator

**File: `src/validation/evaluators/maxWeeklyHours.ts`**

```typescript
import { EvaluationContext, EvaluationResult } from './types';
import { parseISO, startOfWeek, endOfWeek, isWithinInterval, getWeek, getYear } from 'date-fns';

export function evaluateMaxWeeklyHours(context: EvaluationContext): EvaluationResult[] {
  const results: EvaluationResult[] = [];
  const MAX_WEEKLY_HOURS = 48;

  // Group assignments by employee and week
  const hoursByEmployeeWeek = new Map<string, Map<string, number>>();

  for (const assignment of context.assignments) {
    const date = parseISO(assignment.date);
    const weekKey = `${getYear(date)}-W${getWeek(date)}`;
    const shift = context.shifts.find(s => s.id === assignment.shiftId);

    if (!shift) continue;

    // Get shift duration in hours
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
        const employee = context.employees.find(e => e.id === employeeId);

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
```

#### 1.3.3 Qualification Match Evaluator

**File: `src/validation/evaluators/qualificationMatch.ts`**

```typescript
import { EvaluationContext, EvaluationResult } from './types';
import { checkShiftRequirements } from '../../data/models';

export function evaluateQualificationMatch(context: EvaluationContext): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  for (const assignment of context.assignments) {
    const employee = context.employees.find(e => e.id === assignment.employeeId);
    const shift = context.shifts.find(s => s.id === assignment.shiftId);

    if (!employee || !shift) continue;

    const { canWork, missingRequirements } = checkShiftRequirements(employee, shift);

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
        },
      });
    }
  }

  return results;
}
```

#### 1.3.4 No Double Booking Evaluator

**File: `src/validation/evaluators/noDoubleBooking.ts`**

```typescript
import { EvaluationContext, EvaluationResult } from './types';

export function evaluateNoDoubleBooking(context: EvaluationContext): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  // Map: employeeId -> date -> assignments
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
        const employee = context.employees.find(e => e.id === employeeId);
        const shiftNames = shiftIds
          .map(id => context.shifts.find(s => s.id === id)?.name || id)
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
```

#### 1.3.5 Minimum Staffing Evaluator

**File: `src/validation/evaluators/minStaffing.ts`**

```typescript
import { EvaluationContext, EvaluationResult } from './types';
import { eachDayOfInterval, parseISO, format } from 'date-fns';

export function evaluateMinStaffing(context: EvaluationContext): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  // Generate all dates in range
  const dates = eachDayOfInterval({
    start: parseISO(context.startDate),
    end: parseISO(context.endDate),
  }).map(d => format(d, 'yyyy-MM-dd'));

  // Check each shift type for each date
  for (const shift of context.shifts) {
    // Parse minimum staffing requirement
    const minStaffReq = shift.requirements.find(r => r.includes('Min.'));
    if (!minStaffReq) continue;

    const minCount = parseInt(minStaffReq.match(/\d+/)?.[0] || '1', 10);

    for (const date of dates) {
      const assignmentsForShift = context.assignments.filter(
        a => a.shiftId === shift.id && a.date === date
      );

      if (assignmentsForShift.length < minCount) {
        results.push({
          ruleId: 'MIN_STAFFING',
          ruleName: 'Minimum Staffing Requirements',
          ruleType: 'hard',
          passed: false,
          message: `${shift.name} on ${date} has ${assignmentsForShift.length} staff (minimum ${minCount} required)`,
          severity: 'error',
          affectedEntities: {
            employeeIds: assignmentsForShift.map(a => a.employeeId),
            shiftIds: [shift.id],
            dates: [date],
          },
          metadata: {
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
```

#### 1.3.6 Weekend Distribution Evaluator (Soft Rule)

**File: `src/validation/evaluators/weekendDistribution.ts`**

```typescript
import { EvaluationContext, EvaluationResult } from './types';
import { parseISO, isWeekend, getMonth, getYear } from 'date-fns';

export function evaluateWeekendDistribution(context: EvaluationContext): EvaluationResult[] {
  const results: EvaluationResult[] = [];
  const MAX_WEEKENDS_PER_MONTH = 2;

  // Count weekend days worked per employee per month
  const weekendsByEmployeeMonth = new Map<string, Map<string, Set<string>>>();

  for (const assignment of context.assignments) {
    const date = parseISO(assignment.date);

    if (!isWeekend(date)) continue;

    const monthKey = `${getYear(date)}-${getMonth(date) + 1}`;
    const weekendKey = format(date, 'yyyy-MM-dd'); // Track unique weekend days

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
    for (const [monthKey, weekendDays] of months) {
      // Count unique weekends (Saturday-Sunday pairs count as 1)
      const uniqueWeekends = Math.ceil(weekendDays.size / 2);

      if (uniqueWeekends > MAX_WEEKENDS_PER_MONTH) {
        const employee = context.employees.find(e => e.id === employeeId);

        results.push({
          ruleId: 'MAX_WEEKENDS_PER_MONTH',
          ruleName: 'Maximum 2 Weekends per Month',
          ruleType: 'soft',
          passed: false,
          message: `${employee?.name || employeeId} has ${uniqueWeekends} weekends scheduled in ${monthKey} (recommended maximum 2)`,
          severity: 'warning',
          affectedEntities: {
            employeeIds: [employeeId],
            shiftIds: [],
            dates: Array.from(weekendDays),
          },
          metadata: {
            monthKey,
            weekendCount: uniqueWeekends,
            maxRecommended: MAX_WEEKENDS_PER_MONTH,
          },
        });
      }
    }
  }

  return results;
}

// Helper for the evaluator (add to imports)
import { format } from 'date-fns';
```

### 1.4 Evaluator Registry

**File: `src/validation/evaluators/index.ts`**

```typescript
import { EvaluatorRegistryEntry } from './types';
import { evaluateRestPeriod } from './restPeriod';
import { evaluateMaxWeeklyHours } from './maxWeeklyHours';
import { evaluateQualificationMatch } from './qualificationMatch';
import { evaluateNoDoubleBooking } from './noDoubleBooking';
import { evaluateMinStaffing } from './minStaffing';
import { evaluateWeekendDistribution } from './weekendDistribution';

export * from './types';

export const evaluatorRegistry: EvaluatorRegistryEntry[] = [
  {
    name: 'REST_PERIOD_11H',
    description: 'Ensures minimum 11 hours rest between consecutive shifts',
    evaluator: evaluateRestPeriod,
    appliesTo: 'hard',
    category: 'Arbeitszeitgesetz',
  },
  {
    name: 'MAX_WEEKLY_HOURS_48',
    description: 'Enforces maximum 48 hours per week per employee',
    evaluator: evaluateMaxWeeklyHours,
    appliesTo: 'hard',
    category: 'Arbeitszeitgesetz',
  },
  {
    name: 'QUALIFICATION_MATCH',
    description: 'Verifies employee qualifications match shift requirements',
    evaluator: evaluateQualificationMatch,
    appliesTo: 'hard',
    category: 'Qualifikation',
  },
  {
    name: 'NO_DOUBLE_BOOKING',
    description: 'Prevents employee from being assigned to multiple shifts on same day',
    evaluator: evaluateNoDoubleBooking,
    appliesTo: 'hard',
    category: 'Besetzung',
  },
  {
    name: 'MIN_STAFFING',
    description: 'Ensures minimum staffing levels are met for each shift',
    evaluator: evaluateMinStaffing,
    appliesTo: 'hard',
    category: 'Besetzung',
  },
  {
    name: 'MAX_WEEKENDS_PER_MONTH',
    description: 'Recommends maximum 2 weekends per month per employee',
    evaluator: evaluateWeekendDistribution,
    appliesTo: 'soft',
    category: 'Fairness',
  },
];

export {
  evaluateRestPeriod,
  evaluateMaxWeeklyHours,
  evaluateQualificationMatch,
  evaluateNoDoubleBooking,
  evaluateMinStaffing,
  evaluateWeekendDistribution,
};
```

### 1.5 Dependencies to Add

```bash
npm install date-fns
npm install -D @types/node
```

---

## Phase 2: Validation Pipeline

### 2.1 Pipeline Structure

**File: `src/validation/pipeline.ts`**

```typescript
import {
  EvaluationContext,
  EvaluationResult,
  evaluatorRegistry
} from './evaluators';
import { ShiftAssignment, Employee, Shift, SchedulingRule } from '../data/models';

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
  // Only run specific evaluators
  evaluatorNames?: string[];

  // Skip soft rule evaluation
  hardRulesOnly?: boolean;

  // Stop on first hard violation
  failFast?: boolean;

  // Custom rules from database
  customRules?: SchedulingRule[];
}

/**
 * Main validation pipeline
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
   * Validate entire schedule
   */
  validateSchedule(): ValidationResult {
    const startTime = performance.now();
    const hardViolations: EvaluationResult[] = [];
    const softViolations: EvaluationResult[] = [];

    // Select evaluators to run
    let evaluators = evaluatorRegistry;

    if (this.options.evaluatorNames) {
      evaluators = evaluators.filter(e =>
        this.options.evaluatorNames!.includes(e.name)
      );
    }

    if (this.options.hardRulesOnly) {
      evaluators = evaluators.filter(e => e.appliesTo !== 'soft');
    }

    // Run each evaluator
    for (const entry of evaluators) {
      try {
        const results = entry.evaluator(this.context);

        for (const result of results) {
          if (!result.passed) {
            if (result.ruleType === 'hard') {
              hardViolations.push(result);

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
        // Continue with other evaluators
      }
    }

    return this.buildResult(hardViolations, softViolations, startTime, evaluators.length);
  }

  /**
   * Validate a single assignment (for instant feedback on manual changes)
   */
  validateSingleAssignment(assignment: ShiftAssignment): ValidationResult {
    // Create a focused context for single assignment validation
    const focusedContext: EvaluationContext = {
      ...this.context,
      targetAssignment: assignment,
    };

    const startTime = performance.now();
    const hardViolations: EvaluationResult[] = [];
    const softViolations: EvaluationResult[] = [];

    // Run evaluators that make sense for single assignment
    const relevantEvaluators = evaluatorRegistry.filter(e =>
      ['QUALIFICATION_MATCH', 'NO_DOUBLE_BOOKING', 'REST_PERIOD_11H', 'MAX_WEEKLY_HOURS_48']
        .includes(e.name)
    );

    for (const entry of relevantEvaluators) {
      try {
        const results = entry.evaluator(focusedContext);

        // Filter to only results affecting the target assignment
        const relevantResults = results.filter(r =>
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

    return this.buildResult(hardViolations, softViolations, startTime, relevantEvaluators.length);
  }

  private buildResult(
    hardViolations: EvaluationResult[],
    softViolations: EvaluationResult[],
    startTime: number,
    totalRulesChecked: number
  ): ValidationResult {
    const endTime = performance.now();

    // Collect unique affected entities
    const allViolations = [...hardViolations, ...softViolations];
    const affectedEmployees = [...new Set(
      allViolations.flatMap(v => v.affectedEntities.employeeIds)
    )];
    const affectedDates = [...new Set(
      allViolations.flatMap(v => v.affectedEntities.dates)
    )];

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
 * Factory function for quick validation
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
```

### 2.2 React Hook for Validation

**File: `src/validation/useValidation.ts`**

```typescript
import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ValidationPipeline, ValidationResult, ValidationOptions } from './pipeline';
import { selectAllAssignments, selectAllEmployees, selectAllShifts, selectAllRules } from '../store/selectors';
import { setValidationResult } from '../store/validationSlice';
import { ShiftAssignment } from '../data/models';

export function useValidation() {
  const dispatch = useDispatch();
  const assignments = useSelector(selectAllAssignments);
  const employees = useSelector(selectAllEmployees);
  const shifts = useSelector(selectAllShifts);
  const rules = useSelector(selectAllRules);

  const pipeline = useMemo(() => {
    // Determine date range from assignments
    if (assignments.length === 0) return null;

    const dates = assignments.map(a => a.date).sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    return new ValidationPipeline(
      assignments,
      employees,
      shifts,
      rules,
      startDate,
      endDate
    );
  }, [assignments, employees, shifts, rules]);

  const validateAll = useCallback((options?: ValidationOptions): ValidationResult | null => {
    if (!pipeline) return null;

    const result = pipeline.validateSchedule(options);
    dispatch(setValidationResult(result));
    return result;
  }, [pipeline, dispatch]);

  const validateSingle = useCallback((assignment: ShiftAssignment): ValidationResult | null => {
    if (!pipeline) return null;

    return pipeline.validateSingleAssignment(assignment);
  }, [pipeline]);

  return {
    validateAll,
    validateSingle,
    pipeline,
  };
}
```

### 2.3 Performance Optimizations

For 35 employees × 15 shifts × 30 days = potentially 15,750 assignments:

1. **Memoization**: Cache evaluation results for unchanged portions of schedule
2. **Incremental validation**: Only re-validate affected employees when single assignment changes
3. **Web Workers**: Move heavy validation to background thread (optional, for <500ms target)

**File: `src/validation/memoization.ts`**

```typescript
import { EvaluationResult } from './evaluators';

interface CacheEntry {
  result: EvaluationResult[];
  hash: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60000; // 1 minute

export function getCachedResult(
  evaluatorName: string,
  contextHash: string
): EvaluationResult[] | null {
  const key = `${evaluatorName}:${contextHash}`;
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.result;
}

export function setCachedResult(
  evaluatorName: string,
  contextHash: string,
  result: EvaluationResult[]
): void {
  const key = `${evaluatorName}:${contextHash}`;
  cache.set(key, {
    result,
    hash: contextHash,
    timestamp: Date.now(),
  });
}

export function clearCache(): void {
  cache.clear();
}

export function hashContext(
  employeeId: string,
  dates: string[],
  assignments: { date: string; shiftId: string }[]
): string {
  const sorted = assignments.sort((a, b) => a.date.localeCompare(b.date));
  return `${employeeId}:${dates.join(',')}:${sorted.map(a => `${a.date}=${a.shiftId}`).join(';')}`;
}
```

---

## Phase 3: State Management (Redux Toolkit)

### 3.1 Store Structure

```
src/
  store/
    index.ts                  # Store configuration
    slices/
      employeesSlice.ts       # Employee CRUD
      shiftsSlice.ts          # Shift CRUD
      assignmentsSlice.ts     # Schedule assignments
      rulesSlice.ts           # Scheduling rules
      validationSlice.ts      # Validation results
      uiSlice.ts              # UI state (modals, views, etc.)
    selectors.ts              # Memoized selectors
    middleware/
      persistenceMiddleware.ts # Sync to backend
      validationMiddleware.ts  # Auto-validate on changes
```

### 3.2 Store Configuration

**File: `src/store/index.ts`**

```typescript
import { configureStore } from '@reduxjs/toolkit';
import employeesReducer from './slices/employeesSlice';
import shiftsReducer from './slices/shiftsSlice';
import assignmentsReducer from './slices/assignmentsSlice';
import rulesReducer from './slices/rulesSlice';
import validationReducer from './slices/validationSlice';
import uiReducer from './slices/uiSlice';
import { persistenceMiddleware } from './middleware/persistenceMiddleware';
import { validationMiddleware } from './middleware/validationMiddleware';

export const store = configureStore({
  reducer: {
    employees: employeesReducer,
    shifts: shiftsReducer,
    assignments: assignmentsReducer,
    rules: rulesReducer,
    validation: validationReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['validation/setValidationResult'],
      },
    })
      .concat(persistenceMiddleware)
      .concat(validationMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 3.3 Assignments Slice

**File: `src/store/slices/assignmentsSlice.ts`**

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ShiftAssignment, createShiftAssignment } from '../../data/models';
import { apiClient } from '../../api/client';

interface AssignmentsState {
  items: ShiftAssignment[];
  loading: boolean;
  error: string | null;
  lastSynced: string | null;
}

const initialState: AssignmentsState = {
  items: [],
  loading: false,
  error: null,
  lastSynced: null,
};

// Async thunks for API operations
export const fetchAssignments = createAsyncThunk(
  'assignments/fetchAll',
  async (dateRange: { start: string; end: string }) => {
    const response = await apiClient.getAssignments(dateRange.start, dateRange.end);
    return response;
  }
);

export const saveAssignment = createAsyncThunk(
  'assignments/save',
  async (assignment: ShiftAssignment) => {
    const response = await apiClient.saveAssignment(assignment);
    return response;
  }
);

export const deleteAssignment = createAsyncThunk(
  'assignments/delete',
  async (assignmentId: string) => {
    await apiClient.deleteAssignment(assignmentId);
    return assignmentId;
  }
);

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    // Local-only actions (before sync)
    addAssignmentLocal: (state, action: PayloadAction<Partial<ShiftAssignment>>) => {
      const assignment = createShiftAssignment(action.payload);
      state.items.push(assignment);
    },
    updateAssignmentLocal: (state, action: PayloadAction<{ id: string; changes: Partial<ShiftAssignment> }>) => {
      const index = state.items.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    removeAssignmentLocal: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(a => a.id !== action.payload);
    },
    setViolationStatus: (state, action: PayloadAction<{ id: string; hasViolation: boolean; violations: string[] }>) => {
      const assignment = state.items.find(a => a.id === action.payload.id);
      if (assignment) {
        assignment.hasViolation = action.payload.hasViolation;
        assignment.violations = action.payload.violations;
      }
    },
    clearAllAssignments: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch assignments
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastSynced = new Date().toISOString();
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch assignments';
      })
      // Save assignment
      .addCase(saveAssignment.fulfilled, (state, action) => {
        const index = state.items.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
        state.lastSynced = new Date().toISOString();
      })
      // Delete assignment
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.items = state.items.filter(a => a.id !== action.payload);
        state.lastSynced = new Date().toISOString();
      });
  },
});

export const {
  addAssignmentLocal,
  updateAssignmentLocal,
  removeAssignmentLocal,
  setViolationStatus,
  clearAllAssignments,
} = assignmentsSlice.actions;

export default assignmentsSlice.reducer;
```

### 3.4 Validation Slice

**File: `src/store/slices/validationSlice.ts`**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ValidationResult } from '../../validation/pipeline';

interface ValidationState {
  lastResult: ValidationResult | null;
  isValidating: boolean;
  autoValidateEnabled: boolean;
}

const initialState: ValidationState = {
  lastResult: null,
  isValidating: false,
  autoValidateEnabled: true,
};

const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    setValidationResult: (state, action: PayloadAction<ValidationResult>) => {
      state.lastResult = action.payload;
      state.isValidating = false;
    },
    setIsValidating: (state, action: PayloadAction<boolean>) => {
      state.isValidating = action.payload;
    },
    toggleAutoValidate: (state) => {
      state.autoValidateEnabled = !state.autoValidateEnabled;
    },
    clearValidationResult: (state) => {
      state.lastResult = null;
    },
  },
});

export const {
  setValidationResult,
  setIsValidating,
  toggleAutoValidate,
  clearValidationResult,
} = validationSlice.actions;

export default validationSlice.reducer;
```

### 3.5 Validation Middleware (Auto-validate on changes)

**File: `src/store/middleware/validationMiddleware.ts`**

```typescript
import { Middleware } from '@reduxjs/toolkit';
import { debounce } from 'lodash';
import { validateSchedule } from '../../validation/pipeline';
import { setValidationResult, setIsValidating } from '../slices/validationSlice';
import { RootState } from '../index';

// Debounced validation to avoid excessive computation
const debouncedValidate = debounce((dispatch: any, getState: () => RootState) => {
  const state = getState();

  if (!state.validation.autoValidateEnabled) return;

  const { assignments } = state.assignments;
  const { items: employees } = state.employees;
  const { items: shifts } = state.shifts;
  const { items: rules } = state.rules;

  if (assignments.length === 0) return;

  dispatch(setIsValidating(true));

  // Determine date range
  const dates = assignments.map(a => a.date).sort();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  // Run validation
  const result = validateSchedule(
    assignments,
    employees,
    shifts,
    rules,
    startDate,
    endDate
  );

  dispatch(setValidationResult(result));
}, 500); // 500ms debounce

export const validationMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Trigger validation on assignment changes
  const actionsThatTriggerValidation = [
    'assignments/addAssignmentLocal',
    'assignments/updateAssignmentLocal',
    'assignments/removeAssignmentLocal',
    'assignments/fetchAll/fulfilled',
    'rules/addRule',
    'rules/updateRule',
    'rules/deleteRule',
  ];

  if (actionsThatTriggerValidation.includes(action.type)) {
    debouncedValidate(store.dispatch, store.getState);
  }

  return result;
};
```

### 3.6 Selectors

**File: `src/store/selectors.ts`**

```typescript
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// Base selectors
export const selectAllAssignments = (state: RootState) => state.assignments.items;
export const selectAllEmployees = (state: RootState) => state.employees.items;
export const selectAllShifts = (state: RootState) => state.shifts.items;
export const selectAllRules = (state: RootState) => state.rules.items;
export const selectValidationResult = (state: RootState) => state.validation.lastResult;

// Memoized selectors
export const selectAssignmentsByEmployee = createSelector(
  [selectAllAssignments, (state: RootState, employeeId: string) => employeeId],
  (assignments, employeeId) => assignments.filter(a => a.employeeId === employeeId)
);

export const selectAssignmentsByDate = createSelector(
  [selectAllAssignments, (state: RootState, date: string) => date],
  (assignments, date) => assignments.filter(a => a.date === date)
);

export const selectAssignmentsWithViolations = createSelector(
  [selectAllAssignments],
  (assignments) => assignments.filter(a => a.hasViolation)
);

export const selectHardViolations = createSelector(
  [selectValidationResult],
  (result) => result?.hardViolations || []
);

export const selectSoftViolations = createSelector(
  [selectValidationResult],
  (result) => result?.softViolations || []
);

export const selectEmployeeById = createSelector(
  [selectAllEmployees, (state: RootState, id: string) => id],
  (employees, id) => employees.find(e => e.id === id)
);

export const selectShiftById = createSelector(
  [selectAllShifts, (state: RootState, id: string) => id],
  (shifts, id) => shifts.find(s => s.id === id)
);

export const selectRulesForEmployee = createSelector(
  [selectAllRules, (state: RootState, employeeId: string) => employeeId],
  (rules, employeeId) => rules.filter(r => r.appliesTo === 'all' || r.appliesTo === employeeId)
);
```

### 3.7 Redux Dependencies

```bash
npm install @reduxjs/toolkit react-redux
npm install -D @types/react-redux
```

---

## Phase 4: Data Persistence (PostgreSQL + Python API)

### 4.1 Database Schema

**File: `backend/schema.sql`**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    initials VARCHAR(10) NOT NULL UNIQUE,
    contract_type VARCHAR(50) NOT NULL,
    weekly_hours DECIMAL(4,2) NOT NULL DEFAULT 40,
    email VARCHAR(255),
    phone VARCHAR(50),
    employee_number VARCHAR(50),
    start_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    department VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee qualifications (many-to-many)
CREATE TABLE qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE employee_qualifications (
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    qualification_id UUID REFERENCES qualifications(id) ON DELETE CASCADE,
    acquired_date DATE,
    expiry_date DATE,
    PRIMARY KEY (employee_id, qualification_id)
);

-- Shifts table
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    station VARCHAR(100) NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    color VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shift requirements
CREATE TABLE shift_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    requirement_text VARCHAR(255) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE
);

-- Shift rules (specific to shift type)
CREATE TABLE shift_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    rule_text TEXT NOT NULL
);

-- Scheduling rules (global and employee-specific)
CREATE TABLE scheduling_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_type VARCHAR(10) NOT NULL CHECK (rule_type IN ('hard', 'soft')),
    rule_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    applies_to VARCHAR(255) DEFAULT 'all', -- 'all' or specific employee_id
    source VARCHAR(50) DEFAULT 'form',
    weight INTEGER DEFAULT 5 CHECK (weight BETWEEN 1 AND 10),
    is_active BOOLEAN DEFAULT TRUE,
    parameters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- Shift assignments (the actual schedule)
CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    station VARCHAR(100) NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    has_violation BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),

    -- Prevent double booking at database level
    UNIQUE(employee_id, assignment_date)
);

-- Assignment violations (for tracking)
CREATE TABLE assignment_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES shift_assignments(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES scheduling_rules(id) ON DELETE SET NULL,
    violation_message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('error', 'warning')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee availability
CREATE TABLE employee_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    availability_date DATE NOT NULL,
    status_code VARCHAR(10) NOT NULL,
    notes TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(employee_id, availability_date)
);

-- Audit log for compliance
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assignments_date ON shift_assignments(assignment_date);
CREATE INDEX idx_assignments_employee ON shift_assignments(employee_id);
CREATE INDEX idx_assignments_shift ON shift_assignments(shift_id);
CREATE INDEX idx_assignments_date_range ON shift_assignments(assignment_date)
    WHERE assignment_date >= CURRENT_DATE - INTERVAL '30 days';
CREATE INDEX idx_availability_employee_date ON employee_availability(employee_id, availability_date);
CREATE INDEX idx_rules_active ON scheduling_rules(is_active) WHERE is_active = TRUE;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON shift_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log(table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log(table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log(table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_shift_assignments
AFTER INSERT OR UPDATE OR DELETE ON shift_assignments
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### 4.2 Python Backend Structure

```
backend/
  requirements.txt
  config.py
  main.py                    # FastAPI application
  database.py                # Database connection
  models/
    __init__.py
    employee.py              # SQLAlchemy models
    shift.py
    assignment.py
    rule.py
    availability.py
  schemas/
    __init__.py
    employee.py              # Pydantic schemas
    shift.py
    assignment.py
    rule.py
  routers/
    __init__.py
    employees.py             # API endpoints
    shifts.py
    assignments.py
    rules.py
    validation.py            # Server-side validation (for OR-Tools)
  services/
    __init__.py
    validation_service.py    # Business logic
    optimization_service.py  # OR-Tools integration
```

### 4.3 Dependencies

**File: `backend/requirements.txt`**

```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.2
alembic==1.12.1
python-dotenv==1.0.0
ortools==9.8.3296
```

### 4.4 Database Connection

**File: `backend/database.py`**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 4.5 Configuration

**File: `backend/config.py`**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/hospital_roster"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"

settings = Settings()
```

### 4.6 SQLAlchemy Models

**File: `backend/models/assignment.py`**

```python
from sqlalchemy import Column, String, Date, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class ShiftAssignment(Base):
    __tablename__ = "shift_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id"), nullable=False)
    assignment_date = Column(Date, nullable=False)
    station = Column(String(100), nullable=False)
    is_locked = Column(Boolean, default=False)
    has_violation = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255))

    # Relationships
    employee = relationship("Employee", back_populates="assignments")
    shift = relationship("Shift", back_populates="assignments")
    violations = relationship("AssignmentViolation", back_populates="assignment", cascade="all, delete-orphan")
```

### 4.7 Pydantic Schemas

**File: `backend/schemas/assignment.py`**

```python
from pydantic import BaseModel, Field
from datetime import date, datetime
from uuid import UUID
from typing import Optional

class ShiftAssignmentBase(BaseModel):
    employee_id: UUID
    shift_id: UUID
    assignment_date: date
    station: str
    is_locked: bool = False
    notes: Optional[str] = None

class ShiftAssignmentCreate(ShiftAssignmentBase):
    pass

class ShiftAssignmentUpdate(BaseModel):
    employee_id: Optional[UUID] = None
    shift_id: Optional[UUID] = None
    assignment_date: Optional[date] = None
    station: Optional[str] = None
    is_locked: Optional[bool] = None
    notes: Optional[str] = None

class ShiftAssignmentResponse(ShiftAssignmentBase):
    id: UUID
    has_violation: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    violations: list[str] = []

    class Config:
        from_attributes = True

class ShiftAssignmentBulkCreate(BaseModel):
    assignments: list[ShiftAssignmentCreate]
```

### 4.8 API Router

**File: `backend/routers/assignments.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from uuid import UUID

from database import get_db
from models.assignment import ShiftAssignment
from schemas.assignment import (
    ShiftAssignmentCreate,
    ShiftAssignmentUpdate,
    ShiftAssignmentResponse,
    ShiftAssignmentBulkCreate,
)

router = APIRouter(prefix="/assignments", tags=["assignments"])

@router.get("/", response_model=List[ShiftAssignmentResponse])
def get_assignments(
    start_date: date = Query(...),
    end_date: date = Query(...),
    employee_id: UUID = Query(None),
    shift_id: UUID = Query(None),
    db: Session = Depends(get_db)
):
    """Get assignments within date range with optional filters"""
    query = db.query(ShiftAssignment).filter(
        ShiftAssignment.assignment_date >= start_date,
        ShiftAssignment.assignment_date <= end_date
    )

    if employee_id:
        query = query.filter(ShiftAssignment.employee_id == employee_id)

    if shift_id:
        query = query.filter(ShiftAssignment.shift_id == shift_id)

    return query.order_by(ShiftAssignment.assignment_date).all()

@router.post("/", response_model=ShiftAssignmentResponse)
def create_assignment(
    assignment: ShiftAssignmentCreate,
    db: Session = Depends(get_db)
):
    """Create a single assignment"""
    # Check for existing assignment (double booking)
    existing = db.query(ShiftAssignment).filter(
        ShiftAssignment.employee_id == assignment.employee_id,
        ShiftAssignment.assignment_date == assignment.assignment_date
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Employee already has assignment on {assignment.assignment_date}"
        )

    db_assignment = ShiftAssignment(**assignment.dict())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.post("/bulk", response_model=List[ShiftAssignmentResponse])
def create_assignments_bulk(
    bulk: ShiftAssignmentBulkCreate,
    db: Session = Depends(get_db)
):
    """Create multiple assignments (e.g., from OR-Tools solver output)"""
    created = []
    for assignment_data in bulk.assignments:
        db_assignment = ShiftAssignment(**assignment_data.dict())
        db.add(db_assignment)
        created.append(db_assignment)

    db.commit()
    for assignment in created:
        db.refresh(assignment)

    return created

@router.put("/{assignment_id}", response_model=ShiftAssignmentResponse)
def update_assignment(
    assignment_id: UUID,
    assignment: ShiftAssignmentUpdate,
    db: Session = Depends(get_db)
):
    """Update an assignment"""
    db_assignment = db.query(ShiftAssignment).filter(
        ShiftAssignment.id == assignment_id
    ).first()

    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if db_assignment.is_locked:
        raise HTTPException(status_code=400, detail="Assignment is locked")

    update_data = assignment.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_assignment, key, value)

    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete an assignment"""
    db_assignment = db.query(ShiftAssignment).filter(
        ShiftAssignment.id == assignment_id
    ).first()

    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if db_assignment.is_locked:
        raise HTTPException(status_code=400, detail="Assignment is locked")

    db.delete(db_assignment)
    db.commit()
    return {"message": "Assignment deleted"}
```

### 4.9 Main Application

**File: `backend/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import employees, shifts, assignments, rules, validation

app = FastAPI(
    title="Hospital Roster API",
    description="Backend API for hospital shift scheduling",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(employees.router)
app.include_router(shifts.router)
app.include_router(assignments.router)
app.include_router(rules.router)
app.include_router(validation.router)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
```

### 4.10 Frontend API Client

**File: `src/api/client.ts`**

```typescript
import { ShiftAssignment, Employee, Shift, SchedulingRule } from '../data/models';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }

    return response.json();
  }

  // Assignments
  async getAssignments(startDate: string, endDate: string): Promise<ShiftAssignment[]> {
    return this.request(`/assignments?start_date=${startDate}&end_date=${endDate}`);
  }

  async saveAssignment(assignment: ShiftAssignment): Promise<ShiftAssignment> {
    if (assignment.id) {
      return this.request(`/assignments/${assignment.id}`, {
        method: 'PUT',
        body: JSON.stringify(assignment),
      });
    }
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    await this.request(`/assignments/${assignmentId}`, { method: 'DELETE' });
  }

  async bulkCreateAssignments(assignments: ShiftAssignment[]): Promise<ShiftAssignment[]> {
    return this.request('/assignments/bulk', {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    });
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return this.request('/employees');
  }

  async saveEmployee(employee: Employee): Promise<Employee> {
    if (employee.id) {
      return this.request(`/employees/${employee.id}`, {
        method: 'PUT',
        body: JSON.stringify(employee),
      });
    }
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  }

  // Shifts
  async getShifts(): Promise<Shift[]> {
    return this.request('/shifts');
  }

  // Rules
  async getRules(): Promise<SchedulingRule[]> {
    return this.request('/rules');
  }

  async saveRule(rule: SchedulingRule): Promise<SchedulingRule> {
    if (rule.id) {
      return this.request(`/rules/${rule.id}`, {
        method: 'PUT',
        body: JSON.stringify(rule),
      });
    }
    return this.request('/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async deleteRule(ruleId: string): Promise<void> {
    await this.request(`/rules/${ruleId}`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

### 4.11 Persistence Middleware

**File: `src/store/middleware/persistenceMiddleware.ts`**

```typescript
import { Middleware } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';

// Queue for batching API calls
let saveQueue: Map<string, any> = new Map();
let saveTimeout: NodeJS.Timeout | null = null;

const BATCH_DELAY = 1000; // Wait 1 second before syncing

const processSaveQueue = async () => {
  if (saveQueue.size === 0) return;

  const itemsToSave = new Map(saveQueue);
  saveQueue.clear();

  for (const [key, data] of itemsToSave) {
    try {
      const [type, id] = key.split(':');

      switch (type) {
        case 'assignment':
          await apiClient.saveAssignment(data);
          break;
        case 'rule':
          await apiClient.saveRule(data);
          break;
        // Add more types as needed
      }
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      // Could dispatch error action here
    }
  }
};

export const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Track which actions should trigger persistence
  const actionsToPersist = {
    'assignments/addAssignmentLocal': 'assignment',
    'assignments/updateAssignmentLocal': 'assignment',
    'assignments/removeAssignmentLocal': 'assignment:delete',
    'rules/addRule': 'rule',
    'rules/updateRule': 'rule',
    'rules/deleteRule': 'rule:delete',
  };

  const persistType = actionsToPersist[action.type];

  if (persistType) {
    const [entityType, operation] = persistType.split(':');

    if (operation === 'delete') {
      // Handle deletes immediately
      const id = action.payload;
      if (entityType === 'assignment') {
        apiClient.deleteAssignment(id).catch(console.error);
      } else if (entityType === 'rule') {
        apiClient.deleteRule(id).catch(console.error);
      }
    } else {
      // Queue saves for batching
      const data = action.payload;
      const id = data.id || 'new';
      saveQueue.set(`${entityType}:${id}`, data);

      // Debounce the actual save
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      saveTimeout = setTimeout(processSaveQueue, BATCH_DELAY);
    }
  }

  return result;
};
```

---

## File Structure

### Complete Directory Tree

```
hospital-roster-mockup/
├── src/
│   ├── api/
│   │   └── client.ts
│   ├── data/
│   │   ├── models.js (existing, enhanced)
│   │   └── ... (existing files)
│   ├── store/
│   │   ├── index.ts
│   │   ├── selectors.ts
│   │   ├── slices/
│   │   │   ├── assignmentsSlice.ts
│   │   │   ├── employeesSlice.ts
│   │   │   ├── shiftsSlice.ts
│   │   │   ├── rulesSlice.ts
│   │   │   ├── validationSlice.ts
│   │   │   └── uiSlice.ts
│   │   └── middleware/
│   │       ├── persistenceMiddleware.ts
│   │       └── validationMiddleware.ts
│   ├── validation/
│   │   ├── pipeline.ts
│   │   ├── useValidation.ts
│   │   ├── memoization.ts
│   │   └── evaluators/
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── restPeriod.ts
│   │       ├── maxWeeklyHours.ts
│   │       ├── qualificationMatch.ts
│   │       ├── noDoubleBooking.ts
│   │       ├── minStaffing.ts
│   │       └── weekendDistribution.ts
│   └── ... (existing components)
├── backend/
│   ├── requirements.txt
│   ├── config.py
│   ├── main.py
│   ├── database.py
│   ├── schema.sql
│   ├── models/
│   ├── schemas/
│   ├── routers/
│   └── services/
└── docs/
    └── IMPLEMENTATION_PLAN.md
```

---

## Implementation Order

### Phase 1: Rule Evaluators (Week 1)
1. Set up TypeScript configuration
2. Install `date-fns` dependency
3. Create `src/validation/evaluators/types.ts`
4. Implement evaluators one by one (start with `noDoubleBooking` as simplest)
5. Create evaluator registry
6. Unit test each evaluator

### Phase 2: Validation Pipeline (Week 1-2)
1. Create `ValidationPipeline` class
2. Implement `validateSchedule()` method
3. Implement `validateSingleAssignment()` for instant feedback
4. Add memoization layer
5. Create React hook `useValidation()`
6. Integration test with sample data

### Phase 3: Redux State Management (Week 2)
1. Install Redux Toolkit
2. Create store configuration
3. Implement assignment slice (most complex)
4. Implement other slices
5. Create selectors
6. Add validation middleware
7. Migrate existing `useState` calls to Redux
8. Test state persistence across components

### Phase 4: Backend API (Week 3)
1. Set up Python environment
2. Configure PostgreSQL database
3. Run schema migration
4. Implement SQLAlchemy models
5. Create Pydantic schemas
6. Build API endpoints (start with `/assignments`)
7. Add CORS configuration
8. Test API with Postman/curl

### Phase 5: Frontend-Backend Integration (Week 4)
1. Create API client
2. Add persistence middleware
3. Connect Redux thunks to API
4. Implement optimistic updates
5. Add error handling
6. Test full data flow
7. Performance optimization

### Phase 6: Polish and Edge Cases (Week 5)
1. Handle network failures gracefully
2. Add loading states
3. Conflict resolution for concurrent edits (prep for multi-user)
4. Comprehensive error messages
5. Data migration script for existing mock data

---

## Testing Strategy

### Unit Tests
- Each evaluator function
- Validation pipeline
- Redux reducers and selectors

### Integration Tests
- API endpoints with database
- Full validation flow
- State persistence

### Performance Tests
- Validate 35 employees × 30 days < 500ms
- Single assignment validation < 100ms
- API response times < 200ms

---

## Notes for Implementer

1. **IDs**: Use UUIDs for all entities (aligns with PostgreSQL and prevents conflicts)
2. **Dates**: Always ISO 8601 format (`YYYY-MM-DD` for dates, full ISO for timestamps)
3. **Error handling**: Catch and log, don't crash. Return meaningful error messages.
4. **TypeScript strict mode**: Enable for better type safety
5. **Database migrations**: Use Alembic for schema changes
6. **Environment variables**: Never commit `.env` file, use `.env.example`
7. **CORS**: Configure for both development and production origins
8. **Validation on both sides**: Client for UX, server for data integrity
