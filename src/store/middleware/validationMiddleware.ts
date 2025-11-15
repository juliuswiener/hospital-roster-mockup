import { Middleware, Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { debounce } from 'lodash';
import { validateSchedule } from '../../validation/pipeline';
import {
  setValidationResult,
  setIsValidating,
} from '../slices/validationSlice';
import { RootState } from '../index';

// Debounced validation function
const debouncedValidate = debounce(
  (dispatch: Dispatch<UnknownAction>, getState: () => RootState) => {
    const state = getState();

    if (!state.validation.autoValidateEnabled) return;

    const { items: assignments } = state.assignments;
    const { items: employees } = state.employees;
    const { items: shifts } = state.shifts;
    const { items: rules } = state.rules;

    if (assignments.length === 0 || employees.length === 0 || shifts.length === 0) {
      return;
    }

    dispatch(setIsValidating(true));

    // Determine date range from assignments
    const dates = assignments.map((a) => a.date).sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // Run validation
    try {
      const result = validateSchedule(
        assignments,
        employees,
        shifts,
        rules,
        startDate,
        endDate
      );

      dispatch(setValidationResult(result));
    } catch (error) {
      console.error('Validation failed:', error);
      dispatch(setIsValidating(false));
    }
  },
  500
); // 500ms debounce

export const validationMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);

    // Actions that should trigger validation
    const validationTriggers = [
      'assignments/setAssignments',
      'assignments/addAssignment',
      'assignments/updateAssignment',
      'assignments/removeAssignment',
      'rules/setRules',
      'rules/addRule',
      'rules/updateRule',
      'rules/deleteRule',
      'rules/toggleRuleActive',
    ];

    if (
      typeof action === 'object' &&
      action !== null &&
      'type' in action &&
      validationTriggers.includes(action.type as string)
    ) {
      debouncedValidate(store.dispatch, store.getState as () => RootState);
    }

    return result;
  };
