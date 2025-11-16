import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, MessageSquare, List, Plus, Edit2, Trash2, Check, X, AlertCircle, CheckCircle, Users, Clock, Settings, Calendar, RefreshCw, Download, Share2, User } from 'lucide-react';
import { WarningDialog, ContextMenu, AvailabilityDropdown, MonthYearPicker, DetailsSidePanel, PlanningGrid, ShiftGrid, AvailabilityGrid } from './src/components';
import {
  employees as initialEmployees,
  shifts as initialShifts,
  availabilityTypes,
  initialRules,
  shiftColors,
  employeeColors,
  scheduleData as initialScheduleData,
  multiUnitData as initialMultiUnitData,
  excelViewData as initialExcelViewData
} from './src/data';
import { getCurrentMonth, parseYearMonth, getDaysInMonth, getMonthStartDate, getMonthEndDate, getMonthName } from './src/constants/calendar';
import { EMPLOYEE_COLOR_MAP, SHIFT_COLOR_MAP, DEFAULT_EMPLOYEE_FALLBACK, DEFAULT_SHIFT_FALLBACK } from './src/constants/colors';
import {
  usePlanGeneration,
  useBackendHealth,
  transformScheduleForSolver,
  transformAvailabilityForSolver,
  applyGeneratedSchedule,
  createPlan,
  updatePlanSchedule,
  getPlansByMonth,
  getPlan,
  getAvailabilityByMonth,
  saveAvailabilityByMonth,
  parseRulesWithLLM
} from './src/solver';
import {
  EmployeeFormDialog,
  ShiftFormDialog,
  NaturalLanguageDialog,
  PlanGenerationDialog,
  EmergencyCoverageDialog,
  ConstraintViolationDialog,
  RuleEditDialog,
  WarningConfirmDialog,
  GenerationProgressDialog,
} from './src/dialogs';
import { API_BASE } from './src/config/api';
import { useClickOutside } from './src/hooks/useClickOutside';
import { useDialogManager } from './src/hooks/useDialogManager';
import { useLocalStorage } from './src/hooks/useLocalStorage';
import { useNLParser } from './src/hooks/useNLParser';
import { loadEntities, deleteEntity, mapBackendToFrontendEmployee } from './src/utils/api';
import { getViolationTooltip as getViolationTooltipHelper, getEmployeeDetailedInfo as getEmployeeDetailedInfoHelper } from './src/utils/helpers';
import { EmployeesView, ShiftsView, KontrolleView } from './src/views';

const HybridConfigDemo = () => {
  // Use centralized dialog manager for dialog state
  const dialogManager = useDialogManager();

  // Use NL parser hook for rule parsing
  const nlParser = useNLParser();

  const [activeTab, setActiveTab] = useState('planning');
  const [nlText, setNlText] = useState('');
  const [showGeneralRules, setShowGeneralRules] = useState(false);
  const [planningView, setPlanningView] = useState('single');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [contextMenu, setContextMenu] = useState(null);
  const [showEmployeeSubmenu, setShowEmployeeSubmenu] = useState(false);
  const [showShiftSubmenu, setShowShiftSubmenu] = useState(false);
  const [warningDialog, setWarningDialog] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [availabilityMenu, setAvailabilityMenu] = useState(null);
  const [sidePanel, setSidePanel] = useState(null);
  const [showConstraintViolationDialog, setShowConstraintViolationDialog] = useState(null);
  const [showPlanGenerationDialog, setShowPlanGenerationDialog] = useState(false);
  const [showRuleEditDialog, setShowRuleEditDialog] = useState(null);
  const [showEmergencyCoverageDialog, setShowEmergencyCoverageDialog] = useState(null);

  // Sample existing rules
  const [rules, setRules] = useState(initialRules);

  // State for employees and shifts (editable) - persisted to localStorage
  const arrayValidator = (data) => Array.isArray(data) && data.length > 0;
  const [employees, setEmployees] = useLocalStorage('hospitalRoster_employees', initialEmployees, { validator: arrayValidator });
  const [shifts, setShifts] = useLocalStorage('hospitalRoster_shifts', initialShifts, { validator: arrayValidator });

  // Form state is now managed inside the dialog components
  // We just track if we're editing an employee (editingEmployee state at line 53)

  // Load employees and shifts from backend on startup
  // Only load from backend if localStorage is empty (backend is source of truth for structure, localStorage for colors)
  useEffect(() => {
    const loadFromBackend = async () => {
      // Load employees - merge backend data with localStorage colors
      const empResult = await loadEntities('/employees/');
      if (empResult.success && empResult.data.length > 0) {
        setEmployees(currentEmployees => {
          // Get current localStorage colors to preserve them
          const currentColors = {};
          currentEmployees.forEach(emp => {
            if (emp.color || emp.colorClass) {
              currentColors[emp.initials] = { color: emp.color, colorClass: emp.colorClass };
            }
          });

          return empResult.data.map(backendEmp => {
            const mapped = mapBackendToFrontendEmployee(backendEmp);
            // Preserve localStorage colors if backend doesn't have them
            const savedColors = currentColors[mapped.initials];
            if (savedColors && !mapped.colorClass) {
              mapped.color = savedColors.color || mapped.color;
              mapped.colorClass = savedColors.colorClass || mapped.colorClass;
            }
            return mapped;
          });
        });
      }

      // Load shifts - merge backend data with localStorage colors
      const shiftResult = await loadEntities('/shifts/');
      if (shiftResult.success && shiftResult.data.length > 0) {
        setShifts(currentShifts => {
          // Get current localStorage colors to preserve them
          const currentShiftColors = {};
          currentShifts.forEach(shift => {
            if (shift.color || shift.colorClass) {
              currentShiftColors[shift.name] = { color: shift.color, colorClass: shift.colorClass };
            }
          });

          return shiftResult.data.map(backendShift => {
            // Preserve localStorage colors if backend doesn't have them
            const savedColors = currentShiftColors[backendShift.name];
            if (savedColors && !backendShift.colorClass) {
              return {
                ...backendShift,
                color: savedColors.color || backendShift.color,
                colorClass: savedColors.colorClass || backendShift.colorClass
              };
            }
            return backendShift;
          });
        });
      }
    };
    loadFromBackend();
  }, []);

  // Initialize availability data for all employees (now month-specific)
  const [availabilityByMonth, setAvailabilityByMonth] = useState({});

  // Get availability for the currently selected month
  const availability = useMemo(() => {
    return availabilityByMonth[selectedMonth] || {};
  }, [availabilityByMonth, selectedMonth]);

  // Handler to update availability for the current month
  const setAvailability = useCallback((newAvailability) => {
    setAvailabilityByMonth(prev => ({
      ...prev,
      [selectedMonth]: typeof newAvailability === 'function'
        ? newAvailability(prev[selectedMonth] || {})
        : newAvailability
    }));
  }, [selectedMonth]);

  // Generate dynamic color mappings from employee/shift data
  // Uses colorClass property if available, generates from color name, or falls back to static colors
  const dynamicEmployeeColors = useMemo(() => {
    const colors = {};
    employees.forEach(emp => {
      if (emp.colorClass) {
        colors[emp.initials] = emp.colorClass;
      } else if (emp.color && EMPLOYEE_COLOR_MAP[emp.color]) {
        colors[emp.initials] = EMPLOYEE_COLOR_MAP[emp.color];
      } else if (employeeColors[emp.initials]) {
        colors[emp.initials] = employeeColors[emp.initials];
      } else {
        colors[emp.initials] = DEFAULT_EMPLOYEE_FALLBACK;
      }
    });
    return colors;
  }, [employees]);

  const dynamicShiftColors = useMemo(() => {
    const colors = {};
    shifts.forEach(shift => {
      if (shift.colorClass) {
        colors[shift.name] = shift.colorClass;
      } else if (shift.color && SHIFT_COLOR_MAP[shift.color]) {
        colors[shift.name] = SHIFT_COLOR_MAP[shift.color];
      } else if (shiftColors[shift.name]) {
        colors[shift.name] = shiftColors[shift.name];
      } else {
        colors[shift.name] = DEFAULT_SHIFT_FALLBACK;
      }
    });
    return colors;
  }, [shifts]);

  // Schedule data - now state-based for solver integration
  const [scheduleData, setScheduleData] = useState(initialScheduleData);
  const multiUnitData = initialMultiUnitData;
  const excelViewData = initialExcelViewData;

  // OR-Tools solver integration
  const {
    isGenerating: solverIsGenerating,
    generationProgress: solverProgress,
    generationError,
    generationResult,
    generate: startSolverGeneration,
    cancel: cancelGeneration,
    reset: resetGenerationState
  } = usePlanGeneration();

  const { isHealthy: backendIsHealthy, checkHealth } = useBackendHealth();

  // Solver configuration state
  const [selectedOptimizationMode, setSelectedOptimizationMode] = useState('optimal');
  const [customTimeLimit, setCustomTimeLimit] = useState(10);

  // Plan persistence state
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [planSaveStatus, setPlanSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved', 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Load existing plan for the selected month on startup
  useEffect(() => {
    const loadPlanForMonth = async () => {
      try {
        const plans = await getPlansByMonth(selectedMonth);
        if (plans && plans.length > 0) {
          // Load the most recent plan for this month
          const activePlan = plans.find(p => p.status === 'active') || plans[0];
          setScheduleData(activePlan.schedule_data || {});
          setCurrentPlanId(activePlan.id);
          setLastSavedAt(new Date(activePlan.updated_at));
          setPlanSaveStatus('saved');
          console.log('Loaded plan:', activePlan.name);
        } else {
          // No plan exists for this month - reset to empty schedule
          setScheduleData({});
          setCurrentPlanId(null);
          setLastSavedAt(null);
          setPlanSaveStatus('saved');
          console.log('No plan found for month:', selectedMonth);
        }
      } catch (err) {
        console.log('Could not load plans:', err.message);
        // On error, also reset to empty to avoid showing stale data
        setScheduleData({});
        setCurrentPlanId(null);
      }
    };
    loadPlanForMonth();
  }, [selectedMonth]);

  // Load availability data for the selected month
  useEffect(() => {
    const loadAvailabilityForMonth = async () => {
      try {
        const availabilityRecord = await getAvailabilityByMonth(selectedMonth);
        if (availabilityRecord && availabilityRecord.availability_data) {
          setAvailabilityByMonth(prev => ({
            ...prev,
            [selectedMonth]: availabilityRecord.availability_data
          }));
          console.log('Loaded availability for month:', selectedMonth);
        } else {
          // No availability data for this month yet - keep what's in state or empty
          console.log('No availability data found for month:', selectedMonth);
        }
      } catch (err) {
        console.log('Could not load availability:', err.message);
      }
    };
    loadAvailabilityForMonth();
  }, [selectedMonth]);

  // Auto-save availability when it changes (debounced)
  useEffect(() => {
    const currentAvailability = availabilityByMonth[selectedMonth];
    if (!currentAvailability || Object.keys(currentAvailability).length === 0) {
      return; // Nothing to save
    }

    console.log('Availability changed, scheduling save for:', selectedMonth, currentAvailability);

    // Debounce the save operation (wait 2 seconds after last change)
    const saveTimeout = setTimeout(async () => {
      try {
        console.log('Saving availability for month:', selectedMonth, currentAvailability);
        const result = await saveAvailabilityByMonth(selectedMonth, currentAvailability);
        console.log('Availability auto-saved for month:', selectedMonth, result);
      } catch (err) {
        console.error('Failed to auto-save availability:', err);
      }
    }, 2000);

    return () => {
      console.log('Clearing save timeout for:', selectedMonth);
      clearTimeout(saveTimeout);
    };
  }, [availabilityByMonth, selectedMonth]);

  // Handle solver result when it completes - save plan to backend
  useEffect(() => {
    if (generationResult && generationResult.solution) {
      const newSchedule = applyGeneratedSchedule(scheduleData, generationResult);
      setScheduleData(newSchedule);
      setShowPlanGenerationDialog(false);

      // Save the generated plan to backend
      const savePlan = async () => {
        setPlanSaveStatus('saving');
        try {
          const planData = {
            name: `Plan ${selectedMonth} - ${new Date().toLocaleString('de-DE')}`,
            description: `Auto-generated plan using ${selectedOptimizationMode} mode`,
            month: selectedMonth,
            status: 'draft',
            optimization_mode: selectedOptimizationMode,
            time_limit_seconds: customTimeLimit * 60,
            schedule_data: newSchedule,
            solver_result: generationResult,
            solver_status: generationResult.status,
            is_auto_generated: true
          };

          const savedPlan = await createPlan(planData);
          setCurrentPlanId(savedPlan.id);
          setLastSavedAt(new Date(savedPlan.updated_at));
          setPlanSaveStatus('saved');
          console.log('Plan saved to backend!', savedPlan.id);
        } catch (err) {
          console.error('Failed to save plan:', err);
          setPlanSaveStatus('error');
        }
      };
      savePlan();

      console.log('Plan generation completed!', generationResult.analysis);
    }
  }, [generationResult]);

  // Show error if generation fails
  useEffect(() => {
    if (generationError) {
      console.error('Generation failed:', generationError);
      // Could show error dialog here
    }
  }, [generationError]);

  // Auto-save plan when scheduleData is manually edited (debounced)
  useEffect(() => {
    // Skip if no data to save
    const hasData = Object.keys(scheduleData).length > 0 &&
      Object.values(scheduleData).some(empSchedule => Object.keys(empSchedule || {}).length > 0);

    if (!hasData) return; // Nothing to save
    if (planSaveStatus === 'saving') return; // Already saving

    // Mark as unsaved immediately
    setPlanSaveStatus('unsaved');
    console.log('Schedule changed, scheduling save for:', selectedMonth, scheduleData);

    // Debounce the save operation (wait 2 seconds after last change)
    const saveTimeout = setTimeout(async () => {
      setPlanSaveStatus('saving');
      try {
        if (currentPlanId) {
          // Update existing plan
          await updatePlanSchedule(currentPlanId, scheduleData);
          setLastSavedAt(new Date());
          setPlanSaveStatus('saved');
          console.log('Plan auto-saved after manual edit');
        } else {
          // Create new plan for this month
          const planData = {
            name: `Plan ${selectedMonth} - Manual`,
            description: 'Manually created plan',
            month: selectedMonth,
            status: 'draft',
            optimization_mode: 'manual',
            time_limit_seconds: 0,
            schedule_data: scheduleData,
            solver_result: null,
            solver_status: 'manual',
            is_auto_generated: false
          };

          const savedPlan = await createPlan(planData);
          setCurrentPlanId(savedPlan.id);
          setLastSavedAt(new Date(savedPlan.updated_at));
          setPlanSaveStatus('saved');
          console.log('New plan created for month:', selectedMonth, savedPlan.id);
        }
      } catch (err) {
        console.error('Failed to auto-save plan:', err);
        setPlanSaveStatus('error');
      }
    }, 2000);

    return () => clearTimeout(saveTimeout);
  }, [scheduleData, currentPlanId, selectedMonth]);

  // Calculate error count (availability violations in current schedule)
  const planErrorCount = useMemo(() => {
    const AVAILABLE_CODES = new Set(['if', '14', '15', 'pr']);
    let errorCount = 0;

    Object.entries(scheduleData).forEach(([empInitials, empSchedule]) => {
      Object.entries(empSchedule || {}).forEach(([day, assignment]) => {
        if (assignment && assignment.shift) {
          // Check if employee is available on this day
          const dayNum = parseInt(day, 10);
          const availabilityCode = availability[empInitials]?.[dayNum] ||
                                   availability[empInitials]?.[day];

          // No entry or unavailable code means violation
          const isUnavailable = !availabilityCode || !AVAILABLE_CODES.has(availabilityCode);

          if (isUnavailable) {
            errorCount++;
          }
        }
      });
    });

    return errorCount;
  }, [scheduleData, availability]);

  const getRulesForEmployee = (employeeName) => {
    return rules.filter(rule => rule.appliesTo === 'all' || rule.appliesTo === employeeName.replace('Dr. ', ''));
  };

  const handleCellClick = (e, employee, day, hasViolation = false) => {
    e.preventDefault();
    e.stopPropagation();
    // Reset submenu states before opening new context menu
    setShowEmployeeSubmenu(false);
    setShowShiftSubmenu(false);
    setContextMenu({ x: e.clientX, y: e.clientY, employee, day, hasViolation });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setShowEmployeeSubmenu(false);
    setShowShiftSubmenu(false);
  };

  const handleEmployeeChange = (newEmployee) => {
    // Get the current context (which employee row and day we're assigning to)
    if (!contextMenu) return;

    const currentEmployeeName = contextMenu.employee;
    const day = contextMenu.day;

    // Find the current employee's initials
    const currentEmp = employees.find(e => e.name === currentEmployeeName);
    if (!currentEmp) return;

    // Get the current shift data for this cell (if any)
    const currentCell = scheduleData[currentEmp.initials]?.[day];

    // Update schedule: assign the new employee to this shift
    const updatedSchedule = { ...scheduleData };

    // Initialize the new employee's schedule if needed
    if (!updatedSchedule[newEmployee.initials]) {
      updatedSchedule[newEmployee.initials] = {};
    }

    // Copy the shift to the new employee
    if (currentCell) {
      updatedSchedule[newEmployee.initials][day] = { ...currentCell };
      // Remove from old employee
      delete updatedSchedule[currentEmp.initials][day];
    }

    setScheduleData(updatedSchedule);
    console.log(`Assigned ${newEmployee.name} to day ${day}`);
    closeContextMenu();
  };

  const handleShiftChange = (shift) => {
    // Get the current context
    if (!contextMenu) return;

    const employeeName = contextMenu.employee;
    const day = contextMenu.day;

    // Find employee initials
    const emp = employees.find(e => e.name === employeeName);
    if (!emp) return;

    // Update schedule with the new shift
    const updatedSchedule = { ...scheduleData };
    if (!updatedSchedule[emp.initials]) {
      updatedSchedule[emp.initials] = {};
    }

    updatedSchedule[emp.initials][day] = {
      shift: shift.name,
      violation: false,
      locked: false
    };

    setScheduleData(updatedSchedule);
    console.log(`Assigned shift ${shift.name} to ${employeeName} on day ${day}`);
    closeContextMenu();
  };

  const handleShiftChangeOld = (shift) => {
    const warnings = [
      { type: 'qualifikation', text: `Achtung: Der Mitarbeiter hat nicht die nötige Qualifikation, um die Schicht "${shift.name}" zu belegen.` },
      { type: 'zertifizierung', text: `Achtung: Für die Schicht "${shift.name}" ist eine Notfallzertifizierung erforderlich, die der Mitarbeiter nicht besitzt.` },
      { type: 'erfahrung', text: `Achtung: Die Schicht "${shift.name}" erfordert mindestens 2 Jahre Erfahrung, die der Mitarbeiter noch nicht hat.` },
    ];
    const randomWarning = warnings[Math.floor(Math.random() * warnings.length)];

    setWarningDialog({
      title: 'Achtung: Qualifikation fehlt',
      message: randomWarning.text,
      onConfirm: () => {
        console.log('Shift change confirmed:', shift.name);
        setWarningDialog(null);
        closeContextMenu();
      },
      onCancel: () => {
        setWarningDialog(null);
      }
    });
  };

  const handleGenerate = () => {
    setShowPlanGenerationDialog(true);
  };

  const handleClearPlan = () => {
    // Check if there's any data to clear
    const hasData = Object.keys(scheduleData).length > 0 &&
      Object.values(scheduleData).some(empSchedule => Object.keys(empSchedule || {}).length > 0);

    if (!hasData) {
      return; // Nothing to clear
    }

    const monthName = getMonthName(selectedMonth);
    setWarningDialog({
      title: `${monthName} zurücksetzen`,
      message: `Möchten Sie wirklich den gesamten Plan für ${monthName} löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`,
      onConfirm: () => {
        setScheduleData({});
        setCurrentPlanId(null);
        setPlanSaveStatus('saved');
        console.log('Plan cleared for month:', selectedMonth);
        setWarningDialog(null);
      },
      onCancel: () => {
        setWarningDialog(null);
      }
    });
  };

  const handleEmergencyCoverage = () => {
    setShowEmergencyCoverageDialog({
      shift: 'Nachtdienst Ambulanzen',
      date: '08.05.2025',
      employee: 'Dr. Hornuss',
      reason: 'krank'
    });
    closeContextMenu();
  };

  // Save logic is now handled inside the dialog components (EmployeeFormDialog, ShiftFormDialog)

  // Edit employee - just set editing state and open dialog
  const handleEditEmployee = useCallback((employee) => {
    dialogManager.openDialog('employee', employee);
  }, [dialogManager]);

  // Add rule for specific employee
  const handleAddRuleForEmployee = useCallback((employee) => {
    setNlText(`${employee.name} `);
    dialogManager.openDialog('nl');
  }, [dialogManager]);

  // Edit shift - set editing state and open dialog
  const handleEditShift = useCallback((shift) => {
    dialogManager.openDialog('shift', shift);
  }, [dialogManager]);

  // Add rule for specific shift
  const handleAddRuleForShift = useCallback((shift) => {
    setNlText(`Schicht ${shift.name} `);
    dialogManager.openDialog('nl');
  }, [dialogManager]);

  // Delete employee
  const handleDeleteEmployee = useCallback(async (employeeInitials) => {
    if (confirm('Mitarbeiter wirklich löschen?')) {
      const employeeToDelete = employees.find(e => e.initials === employeeInitials);

      // Delete from backend if employee has an ID
      if (employeeToDelete && employeeToDelete.id) {
        const result = await deleteEntity(`/employees/${employeeToDelete.id}`);
        if (result.success) {
          console.log('Employee deleted from backend:', employeeInitials);
        } else {
          console.log('Backend delete failed, removing locally');
        }
      }

      // Remove from local state
      setEmployees(employees.filter(e => e.initials !== employeeInitials));
    }
  }, [employees]);

  // Delete shift
  const handleDeleteShift = (shiftName) => {
    if (confirm('Schicht wirklich löschen?')) {
      setShifts(shifts.filter(s => s.name !== shiftName));
    }
  };

  const startGeneration = async () => {
    // Validate that we have data to work with
    if (employees.length === 0) {
      alert('Keine Mitarbeiter vorhanden.\n\nBitte fügen Sie zuerst Mitarbeiter hinzu, bevor Sie einen Plan generieren.');
      return;
    }
    if (shifts.length === 0) {
      alert('Keine Schichten vorhanden.\n\nBitte definieren Sie zuerst Schichten, bevor Sie einen Plan generieren.');
      return;
    }

    // Check backend health first
    const isHealthy = await checkHealth();
    if (!isHealthy) {
      alert('Backend server is not available. Please start the Python backend server first.\n\nRun: cd backend && pip install -r requirements.txt && python -m uvicorn main:app --reload');
      return;
    }

    // Transform data for solver
    const solverData = transformScheduleForSolver(scheduleData, employees, shifts, selectedMonth);
    const availabilityData = transformAvailabilityForSolver(availability);

    // Prepare configuration
    const config = {
      ...solverData,
      rules: rules,
      availability: availabilityData,
      optimizationMode: selectedOptimizationMode,
      customTimeLimit: customTimeLimit * 60 // Convert minutes to seconds
    };

    // Start solver
    await startSolverGeneration(config);
    setIsGenerating(true);
    setGenerationProgress(0);
  };

  // Sync solver state with local state for UI
  useEffect(() => {
    setIsGenerating(solverIsGenerating);
    setGenerationProgress(solverProgress);
  }, [solverIsGenerating, solverProgress]);

  const handleEmployeeClick = (employeeInitials) => {
    const employee = employees.find(emp => emp.initials === employeeInitials);
    if (employee) {
      // In Schichten view, add detailed info to employee object
      if (planningView === 'shifts') {
        const detailedInfo = getEmployeeDetailedInfoHelper(employee);
        setSidePanel({ item: { ...employee, detailedInfo }, type: 'employee' });
      } else {
        // In other views, show side panel without detailed info
        setSidePanel({ item: employee, type: 'employee' });
      }
    }
  };

  const handleShiftClick = (shiftName) => {
    const shift = shifts.find(s => s.name === shiftName);
    if (shift) {
      setSidePanel({ item: shift, type: 'shift' });
    }
  };

  const handleAddRule = (ruleText) => {
    if (!sidePanel) return;

    const newRule = {
      id: Date.now(),
      type: 'soft',
      text: ruleText,
      source: 'nl',
      category: 'Präferenz',
      appliesTo: sidePanel.type === 'employee' ? sidePanel.item.initials : sidePanel.item.name
    };

    setRules([...rules, newRule]);
  };

  const handleDeleteRule = (ruleId) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  const handleAnalyzeNL = async () => {
    await nlParser.analyzeRules(nlText, employees, shifts);
  };

  const handleSaveNlRules = () => {
    const newRules = nlParser.parsedRules.map((rule, idx) => ({
      id: rules.length + idx + 1,
      type: rule.understood.Härte === 'HART' ? 'hard' : 'soft',
      text: rule.original,
      source: 'nl',
      category: rule.understood.type
    }));
    setRules([...rules, ...newRules]);
    setNlText('');
    nlParser.resetParser();
    setActiveTab('overview');
  };

  // Use shared hook for click outside handling
  useClickOutside(contextMenu, closeContextMenu);
  useClickOutside(availabilityMenu, () => setAvailabilityMenu(null));

  const handleExcelExport = () => {
    console.log('Exporting to Excel...');
    // Dummy implementation - would generate Excel file
    alert('Excel Export wird generiert...');
  };

  const handleSyncWithSPExpert = () => {
    console.log('Synchronizing with SP-Expert...');
    // Dummy implementation - would sync with SP-Expert
    alert('Synchronisation mit SP-Expert wird gestartet...');
  };

  return (
    <div className="max-w-[1800px] mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hospital Roster Planner - Konfiguration</h1>
            {/* Plan save status indicator */}
            <div className="flex items-center gap-2 mt-1 text-sm">
              {planSaveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle size={14} />
                  Plan gespeichert {lastSavedAt && `(${lastSavedAt.toLocaleTimeString('de-DE')})`}
                </span>
              )}
              {planSaveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-blue-600">
                  <RefreshCw size={14} className="animate-spin" />
                  Speichern...
                </span>
              )}
              {planSaveStatus === 'unsaved' && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle size={14} />
                  Nicht gespeicherte Änderungen
                </span>
              )}
              {planSaveStatus === 'error' && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle size={14} />
                  Fehler beim Speichern
                </span>
              )}
              {currentPlanId && (
                <span className="text-gray-500 ml-2">
                  Plan-ID: {currentPlanId.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExcelExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm"
            >
              <Download size={20} />
              Excel Export
            </button>
            <button
              onClick={handleSyncWithSPExpert}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
            >
              <Share2 size={20} />
              Mit SP-Expert synchronisieren
            </button>
          </div>
        </div>
      </div>

      <WarningConfirmDialog dialog={warningDialog} />

      {/* Employee Form Dialog */}
      <EmployeeFormDialog
        isOpen={dialogManager.isOpen('employee')}
        onClose={() => dialogManager.closeDialog('employee')}
        editingEmployee={dialogManager.getEditingItem('employee')}
        employees={employees}
        onSave={(savedEmployee, wasEditing, shouldUpdateAvailability) => {
          if (wasEditing) {
            setEmployees(employees.map(emp =>
              emp.id === wasEditing.id || emp.initials === wasEditing.initials
                ? savedEmployee
                : emp
            ));
          } else {
            setEmployees([...employees, savedEmployee]);
          }

          // Update availability table if needed
          if (shouldUpdateAvailability && savedEmployee.defaultAvailability) {
            setAvailability(prev => {
              const newAvailability = { ...prev };
              if (!newAvailability[savedEmployee.initials]) {
                newAvailability[savedEmployee.initials] = {};
              }
              for (let day = 1; day <= 31; day++) {
                newAvailability[savedEmployee.initials][day] = savedEmployee.defaultAvailability;
              }
              return newAvailability;
            });
            console.log(`Set default availability for ${savedEmployee.initials} to ${savedEmployee.defaultAvailability}`);
          }
        }}
      />

      {/* Shift Form Dialog */}
      <ShiftFormDialog
        isOpen={dialogManager.isOpen('shift')}
        onClose={() => dialogManager.closeDialog('shift')}
        editingShift={dialogManager.getEditingItem('shift')}
        onSave={(savedShift, wasEditing) => {
          if (wasEditing) {
            setShifts(shifts.map(s => s.name === wasEditing.name ? savedShift : s));
          } else {
            setShifts([...shifts, savedShift]);
          }
        }}
      />

      {/* Natural Language Dialog */}
      <NaturalLanguageDialog
        isOpen={dialogManager.isOpen('nl')}
        onClose={() => dialogManager.closeDialog('nl')}
        nlText={nlText}
        setNlText={setNlText}
        showNlResults={nlParser.showNlResults}
        setShowNlResults={nlParser.setShowNlResults}
        parsedRules={nlParser.parsedRules}
        onAnalyze={handleAnalyzeNL}
        onSave={handleSaveNlRules}
      />

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b">
          {[
            { id: 'planning', icon: Calendar, label: 'Planung' },
            { id: 'overview', icon: List, label: `Regeln (${rules.length})` },
            { id: 'employees', icon: Users, label: 'Mitarbeiter' },
            { id: 'shifts', icon: Clock, label: 'Schichten' },
            { id: 'availability', icon: Calendar, label: 'Verfügbarkeit' },
            { id: 'control', icon: CheckCircle, label: 'Kontrolle' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
              <tab.icon size={20} />{tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'forms' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => dialogManager.openDialog('employee', null)} className="bg-white border-2 border-gray-300 hover:border-blue-500 rounded-lg p-6 text-left transition-all">
                  <Users className="text-blue-600 mb-3" size={32} />
                  <h3 className="font-bold text-lg mb-2">Mitarbeiter verwalten</h3>
                  <p className="text-gray-600 text-sm">Neuer Mitarbeiter, Excel-Import</p>
                </button>
                <button onClick={() => dialogManager.openDialog('shift', null)} className="bg-white border-2 border-gray-300 hover:border-blue-500 rounded-lg p-6 text-left transition-all">
                  <Clock className="text-green-600 mb-3" size={32} />
                  <h3 className="font-bold text-lg mb-2">Schichten definieren</h3>
                  <p className="text-gray-600 text-sm">Zeiten & Anforderungen</p>
                </button>
                <button className="bg-white border-2 border-gray-300 hover:border-blue-500 rounded-lg p-6 text-left transition-all">
                  <Settings className="text-purple-600 mb-3" size={32} />
                  <h3 className="font-bold text-lg mb-2">Basis-Constraints</h3>
                  <p className="text-gray-600 text-sm">Arbeitszeitgesetz, Ruhezeiten</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'nl' && (
            <div className="space-y-6">
              {!nlParser.showNlResults ? (
                <>
                  <div><label className="block text-sm font-semibold mb-2">Beschreiben Sie Ihre Regeln:</label>
                    <textarea value={nlText} onChange={(e) => setNlText(e.target.value)} placeholder="Beispiele:&#10;&#10;Dr. Schmidt kann montags nicht arbeiten.&#10;&#10;Jeder sollte maximal 2 Wochenenden pro Monat arbeiten.&#10;&#10;Hornuss bevorzugt Spätdienste und sollte nicht mehr als 3 Nachtdienste im Monat haben." className="w-full border rounded px-4 py-3 h-64 font-mono text-sm" />
                  </div>
                  {nlParser.ruleParsingError && (<div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"><p className="text-yellow-800">{nlParser.ruleParsingError}</p></div>)}
                  {nlParser.isParsingRules && (<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded"><div className="flex items-center gap-3"><RefreshCw className="animate-spin text-blue-600" size={24} /><div><p className="text-blue-900 font-semibold">KI-Analyse läuft...</p><p className="text-blue-700 text-sm">{nlParser.parsingStatus || 'Verarbeite Anfrage...'}</p></div></div></div>)}
                  <button onClick={handleAnalyzeNL} disabled={!nlText.trim() || nlParser.isParsingRules} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold flex items-center gap-2">{nlParser.isParsingRules ? (<><RefreshCw className="animate-spin" size={20} />Analysiere...</>) : '🤖 Regeln analysieren'}</button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded"><p className="text-blue-900 font-semibold">✓ {nlParser.parsedRules.length} Regeln erkannt - Bitte überprüfen:</p></div>
                  {nlParser.ruleParsingError && (<div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"><p className="text-yellow-800">{nlParser.ruleParsingError}</p></div>)}
                  {nlParser.parsedRules.map((rule, idx) => (
                    <div key={idx} className={`bg-white border-2 rounded-lg p-6 ${rule.warnings?.length > 0 || rule.ambiguities?.length > 0 ? 'border-yellow-400' : 'border-gray-300'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2"><span className="text-2xl">{idx + 1}️⃣</span><span className="font-bold text-lg">{rule.understood.type}</span></div>
                        {rule.warnings?.length > 0 || rule.ambiguities?.length > 0 ? (<AlertCircle className="text-yellow-500" size={24} />) : (<CheckCircle className="text-green-500" size={24} />)}
                      </div>
                      <div className="space-y-4">
                        <div><p className="text-sm font-semibold text-gray-600 mb-1">📝 Ihre Eingabe:</p><p className="text-gray-900 bg-gray-50 p-3 rounded italic">"{rule.original}"</p></div>
                        {rule.warnings && rule.warnings.length > 0 && (<div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded"><p className="text-sm font-semibold text-yellow-800 mb-1">⚠️ Warnungen:</p><ul className="list-disc list-inside text-sm text-yellow-700">{rule.warnings.map((warning, wIdx) => (<li key={wIdx}>{warning}</li>))}</ul></div>)}
                        {rule.ambiguities && rule.ambiguities.length > 0 && (<div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded"><p className="text-sm font-semibold text-orange-800 mb-1">🔄 Mehrdeutigkeiten:</p><ul className="list-disc list-inside text-sm text-orange-700">{rule.ambiguities.map((ambiguity, aIdx) => (<li key={aIdx}>{ambiguity}</li>))}</ul></div>)}
                        {rule.suggestions && rule.suggestions.length > 0 && (<div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded"><p className="text-sm font-semibold text-blue-800 mb-1">💡 Vorschläge:</p><ul className="list-disc list-inside text-sm text-blue-700">{rule.suggestions.map((suggestion, sIdx) => (<li key={sIdx}>{suggestion}</li>))}</ul></div>)}
                        <div><p className="text-sm font-semibold text-gray-600 mb-2">🤖 Mein Verständnis:</p>
                          <div className="bg-blue-50 p-4 rounded space-y-2">
                            {Object.entries(rule.understood).map(([key, value]) => (
                              <div key={key} className="flex"><span className="font-semibold text-blue-900 w-32">{key === 'type' ? 'Typ:' : key === 'employee' ? 'Mitarbeiter:' : key === 'constraint' ? 'Einschränkung:' : key === 'target' ? 'Ziel:' : key === 'period' ? 'Zeitraum:' : key === 'hardness' ? 'Härte:' : key + ':'}</span><span className="text-blue-800">{value}</span></div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const updatedRules = [...nlParser.parsedRules];
                              updatedRules[idx] = {...updatedRules[idx], confirmed: true};
                              nlParser.setParsedRules(updatedRules);
                            }}
                            className={`px-4 py-2 rounded flex items-center gap-2 ${rule.confirmed ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                          >
                            <Check size={16} />{rule.confirmed ? 'Bestätigt' : 'Korrekt'}
                          </button>
                          <button
                            onClick={() => {
                              const editText = rule.original;
                              nlParser.setParsedRules(nlParser.parsedRules.filter((_, i) => i !== idx));
                              setNlText(editText);
                              if (nlParser.parsedRules.length === 1) {
                                nlParser.setShowNlResults(false);
                              }
                            }}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-2"
                          >
                            <Edit2 size={16} />Bearbeiten
                          </button>
                          <button
                            onClick={() => {
                              nlParser.setParsedRules(nlParser.parsedRules.filter((_, i) => i !== idx));
                              if (nlParser.parsedRules.length === 1) {
                                nlParser.setShowNlResults(false);
                              }
                            }}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-2"
                          >
                            <Trash2 size={16} />Löschen
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => { nlParser.setShowNlResults(false); nlParser.setParsedRules([]); }} className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold">Zurück bearbeiten</button>
                    <button onClick={handleSaveNlRules} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Regeln speichern</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'employees' && (
            <EmployeesView
              employees={employees}
              rules={rules}
              showGeneralRules={showGeneralRules}
              onToggleGeneralRules={() => setShowGeneralRules(!showGeneralRules)}
              onAddEmployee={() => dialogManager.openDialog('employee', null)}
              onAddRule={() => {
                setNlText('Stefanie Pfau kann montags nicht arbeiten');
                dialogManager.openDialog('nl');
              }}
              onEditEmployee={handleEditEmployee}
              onAddRuleForEmployee={handleAddRuleForEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              getRulesForEmployee={getRulesForEmployee}
            />
          )}

          {activeTab === 'shifts' && (
            <ShiftsView
              shifts={shifts}
              onAddShift={() => dialogManager.openDialog('shift', null)}
              onAddRule={() => {
                setNlText('Stefanie Pfau kann montags nicht arbeiten');
                dialogManager.openDialog('nl');
              }}
              onEditShift={handleEditShift}
              onAddRuleForShift={handleAddRuleForShift}
              onDeleteShift={handleDeleteShift}
            />
          )}

          {activeTab === 'availability' && (
            <div className="space-y-6">
              {/* Month selector */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <MonthYearPicker selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
                  <h3 className="font-bold text-lg">Verfügbarkeitsplanung</h3>
                </div>
              </div>

              {/* Legend */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">Dienst-Legende</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {availabilityTypes.map(type => (
                    <div key={type.code} className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded border text-xs font-semibold ${type.color}`}>
                        {type.code}
                      </span>
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AG Grid Availability Table */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                <AvailabilityGrid
                  employees={employees}
                  availability={availability}
                  onAvailabilityChange={setAvailability}
                  availabilityTypes={availabilityTypes}
                  selectedMonth={selectedMonth}
                />
              </div>
            </div>
          )}

          {activeTab === 'planning' && (
            <div className="space-y-6">
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <MonthYearPicker selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} errorCount={planErrorCount} />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Ansicht:</span>
                      {[['single', 'Mitarbeiter'], ['shifts', 'Schichten']].map(([view, label]) => (
                        <button key={view} onClick={() => setPlanningView(view)} className={`px-3 py-1 rounded text-sm font-semibold ${planningView === view ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed" onClick={handleGenerate} disabled={isGenerating}><RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />{isGenerating ? 'Generiere...' : 'Plan generieren'}</button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={handleClearPlan}
                      disabled={isGenerating || Object.keys(scheduleData).length === 0}
                      title="Plan für diesen Monat zurücksetzen"
                    >
                      <Trash2 size={16} />
                      {getMonthName(selectedMonth)} zurücksetzen
                    </button>
                  </div>
                </div>
              </div>

              <GenerationProgressDialog isOpen={isGenerating} progress={generationProgress} />

              {planningView === 'single' && (
                <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-3">Mitarbeiterübersicht - {selectedMonth} (AG Grid mit Drag & Drop)</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Drag & Drop:</strong> Ziehen Sie Schichten aus der oberen Leiste in die Tabelle, oder verschieben Sie bestehende Zuweisungen per Drag & Drop.
                      </p>
                    </div>
                  </div>
                  <PlanningGrid
                    employees={employees}
                    shifts={shifts}
                    scheduleData={scheduleData}
                    onScheduleChange={setScheduleData}
                    shiftColors={dynamicShiftColors}
                    selectedMonth={selectedMonth}
                    availability={availability}
                  />
                </div>
              )}


              {planningView === 'shifts' && (
                <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-3">Schichtenübersicht - {selectedMonth} (AG Grid mit Drag & Drop)</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Drag & Drop:</strong> Ziehen Sie Mitarbeiter aus der oberen Leiste in die Tabelle, oder verschieben Sie bestehende Zuweisungen per Drag & Drop.
                      </p>
                    </div>
                  </div>
                  <ShiftGrid
                    employees={employees}
                    shifts={shifts}
                    scheduleData={scheduleData}
                    onScheduleChange={setScheduleData}
                    employeeColors={dynamicEmployeeColors}
                    shiftColors={dynamicShiftColors}
                    selectedMonth={selectedMonth}
                    availability={availability}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'control' && (
            <KontrolleView
              employees={employees}
              shifts={shifts}
              scheduleData={scheduleData}
              rules={rules}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Planungsregeln & Constraints</h2>
                <button
                  onClick={() => {
                    setNlText('Stefanie Pfau kann montags nicht arbeiten');
                    dialogManager.openDialog('nl');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  Neue Regel
                </button>
              </div>

              {/* Hard Rules Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>🔴</span>
                  HARTE REGELN (Dürfen NICHT verletzt werden)
                </h3>

                <div className="space-y-3">
                  {rules.filter(r => r.type === 'hard').map(rule => {
                    const exampleText = rule.category === 'Arbeitszeitgesetz'
                      ? '└─ Beispiel: Nach einem Dienst bis 22 Uhr darf der nächste Dienst frühestens um 09 Uhr beginnen'
                      : rule.category === 'Qualifikation'
                      ? `└─ Beispiel: ${rule.appliesTo !== 'all' ? rule.appliesTo + ' erfüllt diese Anforderung nicht' : 'Nur qualifizierte Mitarbeiter werden eingeplant'}`
                      : `└─ Beispiel: ${rule.text}`;

                    return (
                      <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => {}}
                            className="mt-1 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                          />

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 mb-1">{rule.text}</p>
                                <p className="text-sm text-gray-500 mb-2">{exampleText}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                    {rule.category}
                                  </span>
                                  {rule.appliesTo !== 'all' && (
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                      {rule.appliesTo}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 ml-3">
                                <button
                                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                  onClick={() => setShowRuleEditDialog(rule)}
                                >
                                  Bearbeiten
                                </button>
                                <button
                                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                                  onClick={() => handleDeleteRule(rule.id)}
                                >
                                  Löschen
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Soft Rules Section */}
              <div className="space-y-4 mt-8">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>🟡</span>
                  WEICHE REGELN (Optimierungsziele)
                </h3>

                <div className="space-y-3">
                  {rules.filter(r => r.type === 'soft').map(rule => {
                    const exampleText = rule.category === 'Fairness'
                      ? '└─ Beispiel: Person A hatte bereits 2 Wochenenden, Person B nur 1 → Person B wird bevorzugt'
                      : rule.category === 'Präferenz'
                      ? `└─ Beispiel: ${rule.appliesTo} wird bei der Planung bevorzugt für diese Schichten berücksichtigt`
                      : `└─ Beispiel: System versucht diese Regel zu optimieren`;

                    return (
                      <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-yellow-300 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => {}}
                            className="mt-1 w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                          />

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 mb-1">{rule.text}</p>
                                <p className="text-sm text-gray-500 mb-2">{exampleText}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                    {rule.category}
                                  </span>
                                  {rule.appliesTo !== 'all' && (
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                      {rule.appliesTo}
                                    </span>
                                  )}
                                  {/* Weight dropdown for soft rules */}
                                  <div className="flex items-center gap-1 ml-2">
                                    <span className="text-xs text-gray-600">Gewichtung:</span>
                                    <select
                                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                      defaultValue="medium"
                                    >
                                      <option value="low">Niedrig (1)</option>
                                      <option value="medium">Mittel (5)</option>
                                      <option value="high">Hoch (10)</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 ml-3">
                                <button
                                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                  onClick={() => setShowRuleEditDialog(rule)}
                                >
                                  Bearbeiten
                                </button>
                                <button
                                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                                  onClick={() => handleDeleteRule(rule.id)}
                                >
                                  Löschen
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning Dialog */}
      {warningDialog && (
        <WarningDialog
          title={warningDialog.title}
          message={warningDialog.message}
          onConfirm={warningDialog.onConfirm}
          onCancel={warningDialog.onCancel}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          key={`${contextMenu.x}-${contextMenu.y}`}
          contextMenu={contextMenu}
          showEmployeeSubmenu={showEmployeeSubmenu}
          setShowEmployeeSubmenu={setShowEmployeeSubmenu}
          showShiftSubmenu={showShiftSubmenu}
          setShowShiftSubmenu={setShowShiftSubmenu}
          employees={employees}
          shifts={shifts}
          handleEmployeeChange={handleEmployeeChange}
          handleShiftChange={handleShiftChange}
          handleEmergencyCoverage={handleEmergencyCoverage}
          closeContextMenu={closeContextMenu}
        />
      )}

      {/* Availability Dropdown */}
      {availabilityMenu && (
        <AvailabilityDropdown
          menu={availabilityMenu}
          availabilityTypes={availabilityTypes}
          onSelect={(code) => {
            setAvailability(prev => ({
              ...prev,
              [availabilityMenu.employee]: {
                ...prev[availabilityMenu.employee],
                [availabilityMenu.day]: code
              }
            }));
            setAvailabilityMenu(null);
          }}
          onClose={() => setAvailabilityMenu(null)}
        />
      )}

      {/* Details Side Panel */}
      {sidePanel && (
        <DetailsSidePanel
          item={sidePanel.item}
          type={sidePanel.type}
          onClose={() => setSidePanel(null)}
          rules={rules}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
        />
      )}

      {/* Constraint Violation Dialog */}
      <ConstraintViolationDialog
        violation={showConstraintViolationDialog}
        onClose={() => setShowConstraintViolationDialog(null)}
      />

      {/* Plan Generation Dialog */}
      <PlanGenerationDialog
        isOpen={showPlanGenerationDialog}
        onClose={() => setShowPlanGenerationDialog(false)}
        onGenerate={startGeneration}
        selectedMonth={selectedMonth}
        fixedAssignments={[]}
        backendIsHealthy={backendIsHealthy}
        selectedOptimizationMode={selectedOptimizationMode}
        onOptimizationModeChange={setSelectedOptimizationMode}
        customTimeLimit={customTimeLimit}
        onCustomTimeLimitChange={setCustomTimeLimit}
        isGenerating={solverIsGenerating}
        generationProgress={solverProgress}
        generationError={generationError}
        onResetError={resetGenerationState}
        onCancel={cancelGeneration}
      />

      {/* Emergency Coverage Dialog */}
      <EmergencyCoverageDialog
        data={showEmergencyCoverageDialog}
        onClose={() => setShowEmergencyCoverageDialog(null)}
      />

      {/* Rule Edit Dialog */}
      <RuleEditDialog
        rule={showRuleEditDialog}
        onClose={() => setShowRuleEditDialog(null)}
        onSave={(rule) => {
          // Save logic here
          console.log('Rule saved:', rule);
        }}
      />
    </div>
  );
};

export default HybridConfigDemo;
