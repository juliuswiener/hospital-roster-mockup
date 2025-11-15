import { configureStore } from '@reduxjs/toolkit';
import employeesReducer from './slices/employeesSlice';
import shiftsReducer from './slices/shiftsSlice';
import assignmentsReducer from './slices/assignmentsSlice';
import rulesReducer from './slices/rulesSlice';
import validationReducer from './slices/validationSlice';
import uiReducer from './slices/uiSlice';
import { validationMiddleware } from './middleware/validationMiddleware';
import { persistenceMiddleware } from './middleware/persistenceMiddleware';

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
        // Ignore validation results which may have complex objects
        ignoredActions: ['validation/setValidationResult'],
        ignoredPaths: ['validation.lastResult'],
      },
    })
      .concat(validationMiddleware)
      .concat(persistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export { useAppDispatch, useAppSelector } from './hooks';
