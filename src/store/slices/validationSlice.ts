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
