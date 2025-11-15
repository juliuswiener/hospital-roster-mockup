/**
 * Memoization Layer for Validation
 *
 * Caches validation results to avoid redundant computation.
 * Particularly useful when validating incrementally after small changes.
 */

import { EvaluationResult, ShiftAssignment } from './evaluators';

interface CacheEntry {
  result: EvaluationResult[];
  hash: string;
  timestamp: number;
}

// Global cache for evaluation results
const cache = new Map<string, CacheEntry>();

// Default cache TTL (1 minute)
const DEFAULT_CACHE_TTL = 60000;

/**
 * Get cached evaluation result
 *
 * @param evaluatorName Name of the evaluator
 * @param contextHash Hash of the context being evaluated
 * @param ttl Time-to-live in milliseconds (default 60s)
 * @returns Cached results or null if not found/expired
 */
export function getCachedResult(
  evaluatorName: string,
  contextHash: string,
  ttl: number = DEFAULT_CACHE_TTL
): EvaluationResult[] | null {
  const key = `${evaluatorName}:${contextHash}`;
  const entry = cache.get(key);

  if (!entry) return null;

  // Check if cache is expired
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }

  return entry.result;
}

/**
 * Store evaluation result in cache
 *
 * @param evaluatorName Name of the evaluator
 * @param contextHash Hash of the context
 * @param result Evaluation results to cache
 */
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

/**
 * Clear all cached results
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Clear cache for specific evaluator
 *
 * @param evaluatorName Name of evaluator to clear
 */
export function clearCacheForEvaluator(evaluatorName: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${evaluatorName}:`)) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
  oldestEntry: number;
  newestEntry: number;
} {
  const keys = Array.from(cache.keys());
  const timestamps = Array.from(cache.values()).map((e) => e.timestamp);

  return {
    size: cache.size,
    keys,
    oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
    newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
  };
}

/**
 * Generate hash for employee's assignments
 * Used to detect if an employee's schedule has changed
 *
 * @param employeeId Employee ID
 * @param assignments Assignments for this employee
 * @returns Hash string
 */
export function hashEmployeeAssignments(
  employeeId: string,
  assignments: ShiftAssignment[]
): string {
  const employeeAssignments = assignments
    .filter((a) => a.employeeId === employeeId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const parts = employeeAssignments.map((a) => `${a.date}:${a.shiftId}`);
  return `${employeeId}|${parts.join(',')}`;
}

/**
 * Generate hash for all assignments in a date range
 *
 * @param assignments All assignments
 * @param startDate Start of range
 * @param endDate End of range
 * @returns Hash string
 */
export function hashSchedule(
  assignments: ShiftAssignment[],
  startDate: string,
  endDate: string
): string {
  const filtered = assignments
    .filter((a) => a.date >= startDate && a.date <= endDate)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.employeeId.localeCompare(b.employeeId);
    });

  const parts = filtered.map(
    (a) => `${a.employeeId}:${a.date}:${a.shiftId}`
  );
  return `${startDate}|${endDate}|${parts.join(';')}`;
}

/**
 * Generate hash for a single day's assignments
 *
 * @param date Date to hash
 * @param assignments Assignments for the day
 * @returns Hash string
 */
export function hashDayAssignments(
  date: string,
  assignments: ShiftAssignment[]
): string {
  const dayAssignments = assignments
    .filter((a) => a.date === date)
    .sort((a, b) => a.employeeId.localeCompare(b.employeeId));

  const parts = dayAssignments.map((a) => `${a.employeeId}:${a.shiftId}`);
  return `${date}|${parts.join(',')}`;
}

/**
 * Simple string hash function
 * Converts a string to a numeric hash (for smaller cache keys)
 *
 * @param str String to hash
 * @returns Numeric hash
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Cache decorator for evaluator functions
 * Wraps an evaluator to automatically cache its results
 *
 * @param evaluatorName Name for cache key
 * @param evaluator Original evaluator function
 * @param hashFn Function to generate hash from context
 * @returns Cached version of evaluator
 */
export function withCaching<T extends (...args: unknown[]) => EvaluationResult[]>(
  evaluatorName: string,
  evaluator: T,
  hashFn: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const hash = hashFn(...args);
    const cached = getCachedResult(evaluatorName, hash);

    if (cached) {
      return cached;
    }

    const result = evaluator(...args);
    setCachedResult(evaluatorName, hash, result);
    return result;
  }) as T;
}

/**
 * Invalidation strategy for cache
 * Call this when specific data changes to clear relevant cache entries
 */
export const invalidateCache = {
  /**
   * Called when an employee's assignments change
   */
  onEmployeeAssignmentChange(_employeeId: string): void {
    // Clear all caches that might be affected by this employee
    clearCacheForEvaluator('REST_PERIOD_11H');
    clearCacheForEvaluator('MAX_WEEKLY_HOURS_48');
    clearCacheForEvaluator('NO_DOUBLE_BOOKING');
    clearCacheForEvaluator('MAX_WEEKENDS_PER_MONTH');
  },

  /**
   * Called when a shift's requirements change
   */
  onShiftChange(_shiftId: string): void {
    clearCacheForEvaluator('QUALIFICATION_MATCH');
    clearCacheForEvaluator('MIN_STAFFING');
  },

  /**
   * Called when any assignment changes
   */
  onAnyAssignmentChange(): void {
    clearCache();
  },

  /**
   * Called when rules change
   */
  onRulesChange(): void {
    clearCache();
  },
};
