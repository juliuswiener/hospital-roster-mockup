/**
 * Type definitions for rule evaluators
 */

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
 * Employee data structure
 */
export interface Employee {
  id: string;
  name: string;
  initials: string;
  contractType: string;
  weeklyHours: number;
  qualifications: string[];
  email?: string;
  phone?: string;
  employeeNumber?: string;
  startDate?: string;
  isActive?: boolean;
  department?: string;
  notes?: string;
}

/**
 * Time range for shift
 */
export interface TimeRange {
  start: string;
  end: string;
}

/**
 * Shift data structure
 */
export interface Shift {
  id: string;
  name: string;
  displayName?: string;
  category: string;
  description: string;
  station: string;
  time: TimeRange | string;
  durationMinutes?: number;
  requirements: string[];
  rules: string[];
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Shift assignment data structure
 */
export interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  date: string; // ISO 8601 date string YYYY-MM-DD
  station: string;
  isLocked?: boolean;
  hasViolation?: boolean;
  violations?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

/**
 * Scheduling rule data structure
 */
export interface SchedulingRule {
  id: string;
  type: 'hard' | 'soft';
  text: string;
  category: string;
  appliesTo: string;
  source?: string;
  weight?: number;
  isActive?: boolean;
  createdAt?: string;
  parameters?: Record<string, unknown>;
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
  endDate: string; // ISO 8601

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
