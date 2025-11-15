import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Assignment {
  id: string;
  employeeId: string;
  shiftId: string;
  date: string;
  station: string;
  isLocked: boolean;
  hasViolation: boolean;
  violations: string[];
  notes: string;
}

interface AssignmentsState {
  items: Assignment[];
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

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    setAssignments: (state, action: PayloadAction<Assignment[]>) => {
      state.items = action.payload;
      state.lastSynced = new Date().toISOString();
    },
    addAssignment: (state, action: PayloadAction<Assignment>) => {
      state.items.push(action.payload);
    },
    updateAssignment: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Assignment> }>
    ) => {
      const index = state.items.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
      }
    },
    removeAssignment: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((a) => a.id !== action.payload);
    },
    setViolations: (
      state,
      action: PayloadAction<{ id: string; hasViolation: boolean; violations: string[] }>
    ) => {
      const assignment = state.items.find((a) => a.id === action.payload.id);
      if (assignment) {
        assignment.hasViolation = action.payload.hasViolation;
        assignment.violations = action.payload.violations;
      }
    },
    clearViolations: (state) => {
      state.items.forEach((a) => {
        a.hasViolation = false;
        a.violations = [];
      });
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setAssignments,
  addAssignment,
  updateAssignment,
  removeAssignment,
  setViolations,
  clearViolations,
  setLoading,
  setError,
} = assignmentsSlice.actions;

export default assignmentsSlice.reducer;
