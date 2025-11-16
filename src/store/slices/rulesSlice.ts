import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SchedulingRule {
  id: string;
  type: 'hard' | 'soft';
  text: string;
  category: string;
  appliesTo: string;
  source: string;
  weight: number;
  isActive: boolean;
  parameters?: Record<string, unknown>;
}

interface RulesState {
  items: SchedulingRule[];
  loading: boolean;
  error: string | null;
}

const initialState: RulesState = {
  items: [],
  loading: false,
  error: null,
};

const rulesSlice = createSlice({
  name: 'rules',
  initialState,
  reducers: {
    setRules: (state, action: PayloadAction<SchedulingRule[]>) => {
      state.items = action.payload;
    },
    addRule: (state, action: PayloadAction<SchedulingRule>) => {
      state.items.push(action.payload);
    },
    updateRule: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<SchedulingRule> }>
    ) => {
      const index = state.items.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
      }
    },
    deleteRule: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((r) => r.id !== action.payload);
    },
    toggleRuleActive: (state, action: PayloadAction<string>) => {
      const rule = state.items.find((r) => r.id === action.payload);
      if (rule) {
        rule.isActive = !rule.isActive;
      }
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
  setRules,
  addRule,
  updateRule,
  deleteRule,
  toggleRuleActive,
  setLoading,
  setError,
} = rulesSlice.actions;

export default rulesSlice.reducer;
