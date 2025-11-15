import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// Base selectors
export const selectAllAssignments = (state: RootState) => state.assignments.items;
export const selectAllEmployees = (state: RootState) => state.employees.items;
export const selectAllShifts = (state: RootState) => state.shifts.items;
export const selectAllRules = (state: RootState) => state.rules.items;
export const selectValidationResult = (state: RootState) =>
  state.validation.lastResult;
export const selectIsValidating = (state: RootState) =>
  state.validation.isValidating;
export const selectPlanningView = (state: RootState) => state.ui.planningView;
export const selectSelectedMonth = (state: RootState) => state.ui.selectedMonth;

// Memoized selectors
export const selectAssignmentsByEmployee = createSelector(
  [selectAllAssignments, (_state: RootState, employeeId: string) => employeeId],
  (assignments, employeeId) =>
    assignments.filter((a) => a.employeeId === employeeId)
);

export const selectAssignmentsByDate = createSelector(
  [selectAllAssignments, (_state: RootState, date: string) => date],
  (assignments, date) => assignments.filter((a) => a.date === date)
);

export const selectAssignmentsWithViolations = createSelector(
  [selectAllAssignments],
  (assignments) => assignments.filter((a) => a.hasViolation)
);

export const selectHardViolations = createSelector(
  [selectValidationResult],
  (result) => result?.hardViolations || []
);

export const selectSoftViolations = createSelector(
  [selectValidationResult],
  (result) => result?.softViolations || []
);

export const selectViolationCount = createSelector(
  [selectValidationResult],
  (result) => ({
    hard: result?.statistics.hardViolationCount || 0,
    soft: result?.statistics.softViolationCount || 0,
  })
);

export const selectEmployeeById = createSelector(
  [selectAllEmployees, (_state: RootState, id: string) => id],
  (employees, id) => employees.find((e) => e.id === id)
);

export const selectShiftById = createSelector(
  [selectAllShifts, (_state: RootState, id: string) => id],
  (shifts, id) => shifts.find((s) => s.id === id)
);

export const selectActiveRules = createSelector([selectAllRules], (rules) =>
  rules.filter((r) => r.isActive)
);

export const selectHardRules = createSelector([selectAllRules], (rules) =>
  rules.filter((r) => r.type === 'hard')
);

export const selectSoftRules = createSelector([selectAllRules], (rules) =>
  rules.filter((r) => r.type === 'soft')
);
