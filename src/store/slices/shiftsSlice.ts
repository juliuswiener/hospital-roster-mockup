import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Shift {
  id: string;
  name: string;
  category: string;
  description: string;
  station: string;
  time: string;
  durationMinutes: number;
  requirements: string[];
  rules: string[];
}

interface ShiftsState {
  items: Shift[];
  loading: boolean;
  error: string | null;
}

const initialState: ShiftsState = {
  items: [],
  loading: false,
  error: null,
};

const shiftsSlice = createSlice({
  name: 'shifts',
  initialState,
  reducers: {
    setShifts: (state, action: PayloadAction<Shift[]>) => {
      state.items = action.payload;
    },
    addShift: (state, action: PayloadAction<Shift>) => {
      state.items.push(action.payload);
    },
    updateShift: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Shift> }>
    ) => {
      const index = state.items.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
      }
    },
    removeShift: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((s) => s.id !== action.payload);
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
  setShifts,
  addShift,
  updateShift,
  removeShift,
  setLoading,
  setError,
} = shiftsSlice.actions;

export default shiftsSlice.reducer;
