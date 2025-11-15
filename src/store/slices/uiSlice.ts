import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ContextMenu {
  x: number;
  y: number;
  employee: string;
  day: string;
  station: string;
  hasViolation: boolean;
}

interface WarningDialog {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface UIState {
  activeTab: string;
  planningView: 'single' | 'multi' | 'excel';
  selectedMonth: string;
  contextMenu: ContextMenu | null;
  warningDialog: WarningDialog | null;
  showEmployeeForm: boolean;
  showShiftForm: boolean;
  showGeneralRules: boolean;
  selectedEmployee: string | null;
  selectedShift: string | null;
}

const initialState: UIState = {
  activeTab: 'overview',
  planningView: 'single',
  selectedMonth: '2025-10',
  contextMenu: null,
  warningDialog: null,
  showEmployeeForm: false,
  showShiftForm: false,
  showGeneralRules: false,
  selectedEmployee: null,
  selectedShift: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setPlanningView: (
      state,
      action: PayloadAction<'single' | 'multi' | 'excel'>
    ) => {
      state.planningView = action.payload;
    },
    setSelectedMonth: (state, action: PayloadAction<string>) => {
      state.selectedMonth = action.payload;
    },
    setContextMenu: (state, action: PayloadAction<ContextMenu | null>) => {
      state.contextMenu = action.payload;
    },
    setWarningDialog: (state, action: PayloadAction<WarningDialog | null>) => {
      state.warningDialog = action.payload;
    },
    toggleEmployeeForm: (state) => {
      state.showEmployeeForm = !state.showEmployeeForm;
    },
    toggleShiftForm: (state) => {
      state.showShiftForm = !state.showShiftForm;
    },
    toggleGeneralRules: (state) => {
      state.showGeneralRules = !state.showGeneralRules;
    },
    setSelectedEmployee: (state, action: PayloadAction<string | null>) => {
      state.selectedEmployee = action.payload;
    },
    setSelectedShift: (state, action: PayloadAction<string | null>) => {
      state.selectedShift = action.payload;
    },
  },
});

export const {
  setActiveTab,
  setPlanningView,
  setSelectedMonth,
  setContextMenu,
  setWarningDialog,
  toggleEmployeeForm,
  toggleShiftForm,
  toggleGeneralRules,
  setSelectedEmployee,
  setSelectedShift,
} = uiSlice.actions;

export default uiSlice.reducer;
