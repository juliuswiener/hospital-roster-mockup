/**
 * Evaluator Registry and Exports
 *
 * Central registry for all rule evaluators. Add new evaluators here
 * to make them available to the validation pipeline.
 */

import { EvaluatorRegistryEntry } from './types';
import { evaluateRestPeriod } from './restPeriod';
import { evaluateMaxWeeklyHours } from './maxWeeklyHours';
import { evaluateQualificationMatch } from './qualificationMatch';
import { evaluateNoDoubleBooking } from './noDoubleBooking';
import { evaluateMinStaffing } from './minStaffing';
import { evaluateWeekendDistribution } from './weekendDistribution';

// Re-export all types
export * from './types';

/**
 * Registry of all available evaluators
 * Each entry provides metadata about the evaluator and the function itself
 */
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
    description:
      'Prevents employee from being assigned to multiple shifts on same day',
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

// Export individual evaluators for direct use
export {
  evaluateRestPeriod,
  evaluateMaxWeeklyHours,
  evaluateQualificationMatch,
  evaluateNoDoubleBooking,
  evaluateMinStaffing,
  evaluateWeekendDistribution,
};

/**
 * Get an evaluator by name
 */
export function getEvaluatorByName(
  name: string
): EvaluatorRegistryEntry | undefined {
  return evaluatorRegistry.find((entry) => entry.name === name);
}

/**
 * Get all evaluators for a specific category
 */
export function getEvaluatorsByCategory(
  category: string
): EvaluatorRegistryEntry[] {
  return evaluatorRegistry.filter((entry) => entry.category === category);
}

/**
 * Get all hard rule evaluators
 */
export function getHardRuleEvaluators(): EvaluatorRegistryEntry[] {
  return evaluatorRegistry.filter(
    (entry) => entry.appliesTo === 'hard' || entry.appliesTo === 'both'
  );
}

/**
 * Get all soft rule evaluators
 */
export function getSoftRuleEvaluators(): EvaluatorRegistryEntry[] {
  return evaluatorRegistry.filter(
    (entry) => entry.appliesTo === 'soft' || entry.appliesTo === 'both'
  );
}
