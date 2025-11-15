import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Employee {
  id: string;
  name: string;
  initials: string;
  contractType: string;
  weeklyHours: number;
  qualifications: string[];
}

interface EmployeesState {
  items: Employee[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeesState = {
  items: [],
  loading: false,
  error: null,
};

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setEmployees: (state, action: PayloadAction<Employee[]>) => {
      state.items = action.payload;
    },
    addEmployee: (state, action: PayloadAction<Employee>) => {
      state.items.push(action.payload);
    },
    updateEmployee: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Employee> }>
    ) => {
      const index = state.items.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
      }
    },
    removeEmployee: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((e) => e.id !== action.payload);
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
  setEmployees,
  addEmployee,
  updateEmployee,
  removeEmployee,
  setLoading,
  setError,
} = employeesSlice.actions;

export default employeesSlice.reducer;
