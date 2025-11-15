import { useState, useCallback } from 'react';
import { initialRules, employees } from '../data';

/**
 * Custom hook for managing all application state
 * Centralizes state management for the Hospital Roster app
 */
export const useAppState = () => {
  // Core UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [planningView, setPlanningView] = useState('single');
  const [selectedMonth, setSelectedMonth] = useState('2025-05');
  const [controlView, setControlView] = useState('dates');

  // Dialog visibility states
  const [showEmployeeFormDialog, setShowEmployeeFormDialog] = useState(false);
  const [showShiftFormDialog, setShowShiftFormDialog] = useState(false);
  const [showNlDialog, setShowNlDialog] = useState(false);
  const [showPlanGenerationDialog, setShowPlanGenerationDialog] = useState(false);
  const [showRuleEditDialog, setShowRuleEditDialog] = useState(null);
  const [showEmergencyCoverageDialog, setShowEmergencyCoverageDialog] = useState(null);
  const [showConstraintViolationDialog, setShowConstraintViolationDialog] = useState(null);
  const [showGeneralRules, setShowGeneralRules] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const [showEmployeeSubmenu, setShowEmployeeSubmenu] = useState(false);
  const [showShiftSubmenu, setShowShiftSubmenu] = useState(false);
  const [showStationSubmenu, setShowStationSubmenu] = useState(false);

  // Warning/confirmation dialogs
  const [warningDialog, setWarningDialog] = useState(null);

  // Side panel
  const [sidePanel, setSidePanel] = useState(null);
  const [availabilityMenu, setAvailabilityMenu] = useState(null);

  // Form states
  const [nlText, setNlText] = useState('');
  const [showNlResults, setShowNlResults] = useState(false);
  const [parsedRules, setParsedRules] = useState([]);
  const [editingShift, setEditingShift] = useState(null);

  // Plan generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Rules state
  const [rules, setRules] = useState(initialRules);

  // Availability state
  const [availability, setAvailability] = useState(() => {
    const initial = {};
    employees.forEach((emp) => {
      initial[emp.initials] = {};
      for (let day = 1; day <= 30; day++) {
        initial[emp.initials][day] = null;
      }
    });
    return initial;
  });

  // Context menu handlers
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setShowEmployeeSubmenu(false);
    setShowShiftSubmenu(false);
    setShowStationSubmenu(false);
  }, []);

  const handleCellClick = useCallback(
    (e, employee, day, station, hasViolation = false) => {
      e.preventDefault();
      e.stopPropagation();
      setShowEmployeeSubmenu(false);
      setShowShiftSubmenu(false);
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        employee,
        day,
        station,
        hasViolation,
      });
    },
    []
  );

  // Rule management
  const addRule = useCallback((newRule) => {
    setRules((prev) => [...prev, newRule]);
  }, []);

  const deleteRule = useCallback((ruleId) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  }, []);

  const updateRule = useCallback((ruleId, updates) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, ...updates } : r))
    );
  }, []);

  // Availability management
  const updateAvailability = useCallback((employeeInitials, day, status) => {
    setAvailability((prev) => ({
      ...prev,
      [employeeInitials]: {
        ...prev[employeeInitials],
        [day]: status,
      },
    }));
  }, []);

  // Dialog handlers
  const openEmployeeForm = useCallback(() => setShowEmployeeFormDialog(true), []);
  const closeEmployeeForm = useCallback(() => setShowEmployeeFormDialog(false), []);
  const openShiftForm = useCallback(() => setShowShiftFormDialog(true), []);
  const closeShiftForm = useCallback(() => setShowShiftFormDialog(false), []);
  const openNlDialog = useCallback(() => setShowNlDialog(true), []);
  const closeNlDialog = useCallback(() => setShowNlDialog(false), []);
  const openPlanGeneration = useCallback(() => setShowPlanGenerationDialog(true), []);
  const closePlanGeneration = useCallback(() => setShowPlanGenerationDialog(false), []);

  // Plan generation simulation
  const startPlanGeneration = useCallback(() => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  }, []);

  return {
    // Core state
    activeTab,
    setActiveTab,
    planningView,
    setPlanningView,
    selectedMonth,
    setSelectedMonth,
    controlView,
    setControlView,

    // Rules
    rules,
    setRules,
    addRule,
    deleteRule,
    updateRule,

    // Availability
    availability,
    setAvailability,
    updateAvailability,
    availabilityMenu,
    setAvailabilityMenu,

    // Dialog states
    showEmployeeFormDialog,
    setShowEmployeeFormDialog,
    openEmployeeForm,
    closeEmployeeForm,
    showShiftFormDialog,
    setShowShiftFormDialog,
    openShiftForm,
    closeShiftForm,
    showNlDialog,
    setShowNlDialog,
    openNlDialog,
    closeNlDialog,
    showPlanGenerationDialog,
    setShowPlanGenerationDialog,
    openPlanGeneration,
    closePlanGeneration,
    showRuleEditDialog,
    setShowRuleEditDialog,
    showEmergencyCoverageDialog,
    setShowEmergencyCoverageDialog,
    showConstraintViolationDialog,
    setShowConstraintViolationDialog,
    showGeneralRules,
    setShowGeneralRules,

    // Context menu
    contextMenu,
    setContextMenu,
    showEmployeeSubmenu,
    setShowEmployeeSubmenu,
    showShiftSubmenu,
    setShowShiftSubmenu,
    showStationSubmenu,
    setShowStationSubmenu,
    closeContextMenu,
    handleCellClick,

    // Warning dialog
    warningDialog,
    setWarningDialog,

    // Side panel
    sidePanel,
    setSidePanel,

    // NL parsing
    nlText,
    setNlText,
    showNlResults,
    setShowNlResults,
    parsedRules,
    setParsedRules,

    // Shift editing
    editingShift,
    setEditingShift,

    // Plan generation
    isGenerating,
    setIsGenerating,
    generationProgress,
    setGenerationProgress,
    startPlanGeneration,
  };
};

export default useAppState;
