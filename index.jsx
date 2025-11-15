import React, { useState, useEffect, useMemo } from 'react';
import { FileText, MessageSquare, List, Plus, Edit2, Trash2, Check, X, AlertCircle, CheckCircle, Users, Clock, Settings, Calendar, RefreshCw, Download, Share2, User, Wifi, WifiOff } from 'lucide-react';
import { WarningDialog, ContextMenu, AvailabilityDropdown, MonthYearPicker, DetailsSidePanel } from './src/components';
import {
  employees,
  shifts,
  availabilityTypes,
  initialRules,
  shiftColors,
  employeeColors,
  stations,
  scheduleData as initialScheduleData,
  multiUnitData as initialMultiUnitData,
  excelViewData as initialExcelViewData
} from './src/data';
import {
  usePlanGeneration,
  useBackendHealth,
  transformScheduleForSolver,
  transformAvailabilityForSolver,
  applyGeneratedSchedule
} from './src/solver';

const HybridConfigDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [nlText, setNlText] = useState('');
  const [showNlResults, setShowNlResults] = useState(false);
  const [parsedRules, setParsedRules] = useState([]);
  const [showGeneralRules, setShowGeneralRules] = useState(false);
  const [planningView, setPlanningView] = useState('single');
  const [selectedMonth, setSelectedMonth] = useState('2025-05');
  const [contextMenu, setContextMenu] = useState(null);
  const [showEmployeeSubmenu, setShowEmployeeSubmenu] = useState(false);
  const [showShiftSubmenu, setShowShiftSubmenu] = useState(false);
  const [showStationSubmenu, setShowStationSubmenu] = useState(false);
  const [warningDialog, setWarningDialog] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [controlView, setControlView] = useState('dates'); // 'dates', 'shifts', or 'staff'
  const [availabilityMenu, setAvailabilityMenu] = useState(null); // {employee, day, x, y}
  const [sidePanel, setSidePanel] = useState(null); // {item, type: 'employee'|'shift'}
  const [showEmployeeFormDialog, setShowEmployeeFormDialog] = useState(false);
  const [showShiftFormDialog, setShowShiftFormDialog] = useState(false);
  const [showNlDialog, setShowNlDialog] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [showConstraintViolationDialog, setShowConstraintViolationDialog] = useState(null);
  const [showPlanGenerationDialog, setShowPlanGenerationDialog] = useState(false);
  const [showRuleEditDialog, setShowRuleEditDialog] = useState(null);
  const [showEmergencyCoverageDialog, setShowEmergencyCoverageDialog] = useState(null);

  // Sample existing rules
  const [rules, setRules] = useState(initialRules);

  // Initialize availability data for all employees
  const [availability, setAvailability] = useState(() => {
    const initial = {};
    employees.forEach(emp => {
      initial[emp.initials] = {};
      // Initialize with some empty days
      for (let day = 1; day <= 30; day++) {
        initial[emp.initials][day] = null;
      }
    });
    return initial;
  });

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
  const [selectedStations, setSelectedStations] = useState(['Ambulanzen', 'Konsiliardienst', 'ABS', 'Station v. Frer.']);

  // Handle solver result when it completes
  useEffect(() => {
    if (generationResult && generationResult.solution) {
      const newSchedule = applyGeneratedSchedule(scheduleData, generationResult);
      setScheduleData(newSchedule);
      setShowPlanGenerationDialog(false);

      // Show success message (could be a toast/notification)
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

  const getRulesForEmployee = (employeeName) => {
    return rules.filter(rule => rule.appliesTo === 'all' || rule.appliesTo === employeeName.replace('Dr. ', ''));
  };

  const handleCellClick = (e, employee, day, station, hasViolation = false) => {
    e.preventDefault();
    e.stopPropagation();
    // Reset submenu states before opening new context menu
    setShowEmployeeSubmenu(false);
    setShowShiftSubmenu(false);
    setContextMenu({ x: e.clientX, y: e.clientY, employee, day, station, hasViolation });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setShowEmployeeSubmenu(false);
    setShowShiftSubmenu(false);
  };

  const handleEmployeeChange = (employee) => {
    const warnings = [
      { type: 'ruhezeit', text: `Wenn ${employee.name} hier eingesetzt wird, verletzt das ${employee.name}s Ruhezeit von 11 Stunden zwischen Schichten.` },
      { type: 'wochenende', text: `Wenn ${employee.name} hier eingesetzt wird, verletzt das die Regel, dass nur zwei Wochenenddienste im Monat gemacht werden sollen.` },
      { type: 'maxdienste', text: `Wenn ${employee.name} hier eingesetzt wird, überschreitet das die maximale Anzahl von Nachtdiensten pro Monat.` },
    ];
    const randomWarning = warnings[Math.floor(Math.random() * warnings.length)];

    setWarningDialog({
      title: 'Achtung: Regelverletzung',
      message: randomWarning.text,
      onConfirm: () => {
        console.log('Employee change confirmed:', employee.name);
        setWarningDialog(null);
        closeContextMenu();
      },
      onCancel: () => {
        setWarningDialog(null);
      }
    });
  };

  const handleShiftChange = (shift) => {
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

  const handleEmergencyCoverage = () => {
    setShowEmergencyCoverageDialog({
      shift: 'Nachtdienst Ambulanzen',
      date: '08.05.2025',
      employee: 'Dr. Hornuss',
      reason: 'krank'
    });
    closeContextMenu();
  };

  const startGeneration = async () => {
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
      customTimeLimit: customTimeLimit * 60, // Convert minutes to seconds
      stations: selectedStations
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

  // Generate detailed employee information (dummy data)
  const getEmployeeDetailedInfo = (employee) => {
    const yearsOfService = Math.floor(Math.random() * 8) + 1; // 1-8 years
    const qualifications = [
      'Mykobakterienambulanz',
      'COVID-Ambulanz',
      'Station',
      'Reisemedizin',
      'Konsiliardienst',
      'Notfallambulanz'
    ];
    const selectedQualifications = qualifications.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 2));

    const unavailabilities = [
      'Mittwochnachmittags nicht verfügbar',
      'Montagnachmittags nicht verfügbar',
      'Freitags nicht verfügbar',
      'Dienstagnachmittags in Weiterbildung',
      'Donnerstags Forschungstag'
    ];
    const unavailability = unavailabilities[Math.floor(Math.random() * unavailabilities.length)];

    const vacationDates = [
      '14.09. bis 20.09.',
      '05.10. bis 12.10.',
      '20.11. bis 27.11.',
      '18.12. bis 02.01.',
      '15.08. bis 25.08.'
    ];
    const vacation = vacationDates[Math.floor(Math.random() * vacationDates.length)];

    return {
      yearsOfService,
      qualifications: selectedQualifications,
      unavailability,
      nextVacation: vacation
    };
  };

  const handleEmployeeClick = (employeeInitials) => {
    const employee = employees.find(emp => emp.initials === employeeInitials);
    if (employee) {
      // In Schichten view, add detailed info to employee object
      if (planningView === 'excel') {
        const detailedInfo = getEmployeeDetailedInfo(employee);
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

  const handleAnalyzeNL = () => {
    // Simple NL parser for demonstration
    const parseRule = (text) => {
      const textLower = text.toLowerCase();

      // Find employee name
      let employeeName = null;
      employees.forEach(emp => {
        const nameLower = emp.name.toLowerCase();
        const firstNameLower = emp.name.split(' ').pop().toLowerCase();
        if (textLower.includes(nameLower) || textLower.includes(firstNameLower)) {
          employeeName = emp.name;
        }
      });

      // Find shift type
      let shiftType = null;
      shifts.forEach(shift => {
        const shiftLower = shift.name.toLowerCase();
        const descLower = shift.description.toLowerCase();
        if (textLower.includes(shiftLower) || textLower.includes(descLower)) {
          shiftType = shift.name;
        }
      });

      // Check for "Reisemedizin" specifically
      if (textLower.includes('reisemedizin') || textLower.includes('reise')) {
        shiftType = 'Reise';
      }

      // Detect day/time constraints
      let timeConstraint = null;
      let dayConstraint = null;

      const days = {
        'montag': 'Montag', 'dienstag': 'Dienstag', 'mittwoch': 'Mittwoch',
        'donnerstag': 'Donnerstag', 'freitag': 'Freitag', 'samstag': 'Samstag', 'sonntag': 'Sonntag'
      };

      Object.keys(days).forEach(dayKey => {
        if (textLower.includes(dayKey)) {
          dayConstraint = days[dayKey];
        }
      });

      // Check for temporal markers
      if (textLower.includes('diesen') || textLower.includes('nächsten') || textLower.includes('kommenden')) {
        timeConstraint = textLower.includes('diesen') ? 'Diesen' : textLower.includes('nächsten') ? 'Nächsten' : 'Kommenden';
      }

      // Detect constraint type
      const isNegative = textLower.includes('nicht') || textLower.includes('kein') || textLower.includes('kann nicht');
      const isPreference = textLower.includes('bevorzugt') || textLower.includes('lieber') || textLower.includes('sollte');
      const isMaximum = textLower.includes('maximal') || textLower.includes('höchstens') || textLower.includes('max.');

      // Determine hardness
      const hardness = isNegative ? 'HART' : 'WEICH';

      // Build understood object
      const understood = {
        type: employeeName ? 'Mitarbeiter-Einschränkung' : 'Allgemeine Regel',
      };

      if (employeeName) understood.Mitarbeiter = employeeName;

      let constraintText = '';
      if (isNegative && shiftType && dayConstraint) {
        constraintText = `Nicht verfügbar für ${shiftType}`;
        understood.Schicht = shiftType;
      } else if (isNegative && dayConstraint) {
        constraintText = `Nicht verfügbar`;
      } else if (isNegative && shiftType) {
        constraintText = `Darf nicht ${shiftType} machen`;
        understood.Schicht = shiftType;
      } else if (isMaximum) {
        constraintText = 'Maximale Anzahl Schichten begrenzt';
      } else if (isPreference) {
        constraintText = 'Präferenz für bestimmte Schichten';
      } else {
        constraintText = 'Einschränkung erkannt';
      }

      understood.Einschränkung = constraintText;

      if (dayConstraint) {
        understood.Tag = timeConstraint ? `${timeConstraint} ${dayConstraint}` : dayConstraint;
      }

      if (timeConstraint || textLower.includes('woche') || textLower.includes('monat')) {
        understood.Zeitraum = timeConstraint ? 'Einmalig (dieser Zeitpunkt)' :
                              textLower.includes('monat') ? 'Pro Monat' :
                              textLower.includes('woche') ? 'Pro Woche' :
                              'Unbegrenzt (dauerhaft)';
      } else {
        understood.Zeitraum = dayConstraint && timeConstraint ? 'Einmalig (dieser Zeitpunkt)' : 'Unbegrenzt (dauerhaft)';
      }

      understood.Härte = hardness;

      const confidence = (employeeName ? 0.3 : 0) + (shiftType ? 0.3 : 0) + (dayConstraint ? 0.2 : 0) + 0.2;

      return {
        original: text,
        understood,
        confidence: Math.min(confidence, 0.98),
        needsClarification: confidence < 0.7
      };
    };

    // Parse all lines in nlText
    const lines = nlText.split('\n').filter(line => line.trim().length > 0);
    const parsed = lines.map(line => parseRule(line));

    setParsedRules(parsed);
    setShowNlResults(true);
  };

  const handleSaveNlRules = () => {
    const newRules = parsedRules.map((rule, idx) => ({
      id: rules.length + idx + 1,
      type: rule.understood.hardness === 'HART' ? 'hard' : 'soft',
      text: rule.original,
      source: 'nl',
      category: rule.understood.type
    }));
    setRules([...rules, ...newRules]);
    setNlText('');
    setShowNlResults(false);
    setParsedRules([]);
    setActiveTab('overview');
  };

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  useEffect(() => {
    const handleClick = () => setAvailabilityMenu(null);
    if (availabilityMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [availabilityMenu]);

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

  // Generate example violation tooltips
  const getViolationTooltip = (employeeInitials, day, shift) => {
    // Example violation messages based on employee and context
    const violations = [
      `Ruhezeit-Verletzung: Weniger als 11 Stunden zwischen Schichten`,
      `Maximale Wochenarbeitszeit überschritten (>48h)`,
      `Keine Qualifikation für diese Schicht vorhanden`,
      `Maximale Anzahl Nachtdienste pro Monat überschritten`,
      `Wochenend-Regel: Mehr als 2 Wochenenddienste im Monat`,
      `Konflikt mit eingetragenem Urlaub/Abwesenheit`,
      `Mindestanzahl freie Tage nicht eingehalten`,
    ];

    // Return a specific example based on employee
    if (employeeInitials === 'DH' && day === '08') {
      return 'Ruhezeit-Verletzung: Weniger als 11 Stunden zwischen Schichten';
    } else if (employeeInitials === 'MM' && day === '06') {
      return 'Maximale Wochenarbeitszeit überschritten (>48h)';
    } else if (employeeInitials === 'VG' && day === '11') {
      return 'Wochenend-Regel: Mehr als 2 Wochenenddienste im Monat';
    }

    // Default random violation
    return violations[Math.floor(Math.random() * violations.length)];
  };

  return (
    <div className="max-w-[1800px] mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Hospital Roster Planner - Konfiguration</h1>
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

      {warningDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="text-orange-500 flex-shrink-0" size={24} />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{warningDialog.title}</h3>
                <p className="text-gray-700">{warningDialog.message}</p>
              </div>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-3 mb-4">
              <p className="text-sm font-semibold text-orange-900">Soll das dennoch übernommen werden?</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={warningDialog.onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold"
              >
                Nein, abbrechen
              </button>
              <button
                onClick={warningDialog.onConfirm}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-semibold"
              >
                Ja, übernehmen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Form Dialog */}
      {showEmployeeFormDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Mitarbeiter bearbeiten</h3>
              <button onClick={() => setShowEmployeeFormDialog(false)}><X className="text-gray-400 hover:text-gray-600" size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">Name:</label>
                <input type="text" defaultValue="Hornuss" className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold mb-2">Status:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="status" defaultChecked className="text-blue-600" />
                    <span>Aktiv</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="status" className="text-blue-600" />
                    <span>Urlaub</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="status" className="text-blue-600" />
                    <span>Inaktiv</span>
                  </label>
                </div>
              </div>

              {/* Vertrag */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Vertrag:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Typ:</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2">
                      <option>Oberarzt</option>
                      <option>Facharzt</option>
                      <option>Assistenzarzt</option>
                      <option>Chefarzt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Wochenstunden:</label>
                    <input type="number" defaultValue="40" className="w-full border border-gray-300 rounded px-3 py-2" />
                    <p className="text-xs text-gray-500 mt-1">(Tarifvertrag: 40h)</p>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Vertragsbeginn:</label>
                  <input type="date" defaultValue="2020-01-01" className="border border-gray-300 rounded px-3 py-2" />
                </div>
              </div>

              {/* Qualifikationen */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Qualifikationen & Kompetenzen:</h4>
                <div className="space-y-2">
                  {['Facharzt Innere Medizin', 'Notfallmedizin-Zertifizierung', 'ABS-zertifiziert (Antibiotic Stewardship)', 'Oberarzt-Berechtigung', 'Chefarzt-Vertretung'].map(q => (
                    <label key={q} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked={q.includes('Facharzt') || q.includes('Notfall') || q.includes('ABS')} className="rounded" />
                      <span className="text-sm">{q}</span>
                    </label>
                  ))}
                </div>
                <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Plus size={14} />
                  Qualifikation hinzufügen
                </button>
              </div>

              {/* Einsatzfähig in Stationen */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Einsatzfähig in Stationen:</h4>
                <div className="space-y-2">
                  {['Ambulanzen', 'Konsiliardienst', 'ABS', 'Station v. Frer.', 'Forschung'].map(s => (
                    <label key={s} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked={s === 'Ambulanzen' || s === 'Konsiliardienst' || s === 'ABS'} className="rounded" />
                      <span className="text-sm">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Persönliche Einschränkungen */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Persönliche Einschränkungen:</h4>
                <p className="text-sm text-gray-600 mb-2">• Keine festen Einschränkungen</p>
                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Plus size={14} />
                  Einschränkung hinzufügen...
                </button>
              </div>

              {/* Präferenzen */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Präferenzen (optional):</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bevorzugte Schichten:</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2">
                      <option>Keine Präferenz</option>
                      <option>Frühdienst</option>
                      <option>Spätdienst</option>
                      <option>Nachtdienst</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Max. Wochenenden/Monat:</label>
                      <input type="number" defaultValue="2" className="w-full border border-gray-300 rounded px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Max. Nachtdienste/Monat:</label>
                      <input type="number" defaultValue="4" className="w-full border border-gray-300 rounded px-3 py-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-center pt-4 border-t">
                <button onClick={() => setShowEmployeeFormDialog(false)} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold">Abbrechen</button>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Speichern</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shift Form Dialog */}
      {showShiftFormDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Neue Schicht</h3>
                <button onClick={() => setShowShiftFormDialog(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-2">Schichtname</label><input type="text" placeholder="z.B. OA" className="w-full border rounded px-3 py-2" /></div>
                <div><label className="block text-sm font-semibold mb-2">Station</label><select className="w-full border rounded px-3 py-2"><option>Ambulanzen</option><option>Konsiliardienst</option><option>ABS</option><option>Station v. Frer.</option></select></div>
                <div><label className="block text-sm font-semibold mb-2">Startzeit</label><input type="time" defaultValue="08:00" className="w-full border rounded px-3 py-2" /></div>
                <div><label className="block text-sm font-semibold mb-2">Endzeit</label><input type="time" defaultValue="17:00" className="w-full border rounded px-3 py-2" /></div>
              </div>
              <div className="mt-4"><label className="block text-sm font-semibold mb-2">Anforderungen</label>
                <div className="space-y-2">
                  {['Oberarzt', 'Facharzt', 'Notfallzertifizierung', 'ABS-Zertifizierung'].map(r => (
                    <label key={r} className="flex items-center gap-2"><input type="checkbox" className="rounded" /><span>{r}</span></label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowShiftFormDialog(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Abbrechen</button>
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Speichern</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Natural Language Dialog */}
      {showNlDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Regel mit Natural Language hinzufügen</h3>
                <button onClick={() => { setShowNlDialog(false); setShowNlResults(false); setNlText(''); }}><X className="text-gray-400 hover:text-gray-600" /></button>
              </div>

              {!showNlResults ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Regel in natürlicher Sprache eingeben</label>
                    <textarea
                      value={nlText}
                      onChange={(e) => setNlText(e.target.value)}
                      placeholder="z.B. 'Stephanie Pfau kann diesen Montag erst ab 12' oder 'Max. 2 Wochenenddienste pro Monat'"
                      className="w-full border rounded px-3 py-2 h-32"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowNlDialog(false); setNlText(''); }} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Abbrechen</button>
                    <button
                      onClick={() => {
                        if (nlText.trim()) {
                          handleAnalyzeNL();
                        }
                      }}
                      disabled={!nlText.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Regel analysieren
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4">
                      <p className="text-sm font-semibold text-green-900">✓ Regeln verstanden - Bitte überprüfen</p>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 mb-4">Ich habe {parsedRules.length} Regel{parsedRules.length > 1 ? 'n' : ''} erkannt:</p>

                    {parsedRules.map((rule, idx) => (
                      <div key={idx} className="mb-4 border-2 border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{idx + 1}️⃣</span>
                            <span className="font-bold text-gray-900 uppercase text-sm">
                              {rule.understood?.type || 'MITARBEITER-EINSCHRÄNKUNG'}
                            </span>
                          </div>
                          <CheckCircle size={20} className="text-green-600" />
                        </div>

                        <div className="space-y-3 text-sm">
                          {/* Original Input */}
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="font-semibold text-gray-700 mb-1">📝 Ihre Eingabe:</p>
                            <p className="text-gray-900 italic">"{rule.original}"</p>
                          </div>

                          {/* Parsed Understanding */}
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="font-semibold text-blue-900 mb-2">🤖 Mein Verständnis:</p>
                            <div className="space-y-1">
                              {rule.understood?.Mitarbeiter && (
                                <div className="flex gap-2">
                                  <span className="text-blue-800">• Mitarbeiter:</span>
                                  <span className="text-blue-900 font-medium">{rule.understood.Mitarbeiter}</span>
                                </div>
                              )}
                              {rule.understood?.Schicht && (
                                <div className="flex gap-2">
                                  <span className="text-blue-800">• Schicht:</span>
                                  <span className="text-blue-900 font-medium">{rule.understood.Schicht}</span>
                                </div>
                              )}
                              {rule.understood?.Tag && (
                                <div className="flex gap-2">
                                  <span className="text-blue-800">• Tag:</span>
                                  <span className="text-blue-900 font-medium">{rule.understood.Tag}</span>
                                </div>
                              )}
                              {rule.understood?.Einschränkung && (
                                <div className="flex gap-2">
                                  <span className="text-blue-800">• Einschränkung:</span>
                                  <span className="text-blue-900 font-medium">{rule.understood.Einschränkung}</span>
                                </div>
                              )}
                              {rule.understood?.Zeitraum && (
                                <div className="flex gap-2">
                                  <span className="text-blue-800">• Zeitraum:</span>
                                  <span className="text-blue-900 font-medium">{rule.understood.Zeitraum}</span>
                                </div>
                              )}
                              {rule.understood?.Härte && (
                                <div className="flex gap-2">
                                  <span className="text-blue-800">• Typ:</span>
                                  <span className={`font-bold ${rule.understood.Härte === 'HART' ? 'text-red-700' : 'text-yellow-700'}`}>
                                    {rule.understood.Härte === 'HART' ? 'HARTE REGEL (kann nicht verletzt werden)' : 'WEICHE REGEL (Optimierungsziel)'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Technical Implementation */}
                          <div className="bg-purple-50 p-3 rounded font-mono text-xs">
                            <p className="font-semibold text-purple-900 mb-2 font-sans">⚙️ Technisch wird dies umgesetzt als:</p>
                            <code className="text-purple-800">
                              {rule.understood?.Mitarbeiter && rule.understood?.Tag
                                ? `constraint: employee["${rule.understood.Mitarbeiter}"].day != "${rule.understood.Tag}"`
                                : rule.understood?.Schicht
                                ? `shift["${rule.understood.Schicht}"].requires(qualifications=[...])`
                                : 'constraint: [automatisch generiert basierend auf Regeltyp]'}
                            </code>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <button className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-semibold flex items-center gap-1">
                              <Check size={14} />
                              Korrekt
                            </button>
                            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold flex items-center gap-1">
                              <Edit2 size={14} />
                              Bearbeiten
                            </button>
                            <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold flex items-center gap-1">
                              <Trash2 size={14} />
                              Löschen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Summary */}
                    <div className="border-t-2 border-gray-300 pt-4 mt-4">
                      <div className="flex items-center gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-green-600" />
                          <span className="font-semibold text-gray-900">{parsedRules.length} Regel{parsedRules.length > 1 ? 'n' : ''} korrekt verstanden</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => { setShowNlResults(false); }}
                      className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
                    >
                      Zurück bearbeiten
                    </button>
                    <button
                      onClick={() => {
                        handleSaveNlRules();
                        setShowNlDialog(false);
                        setShowNlResults(false);
                        setNlText('');
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      Regeln speichern
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b">
          {[
            { id: 'overview', icon: List, label: `Regeln (${rules.length})` },
            { id: 'employees', icon: Users, label: 'Mitarbeiter' },
            { id: 'shifts', icon: Clock, label: 'Schichten' },
            { id: 'availability', icon: Calendar, label: 'Verfügbarkeit' },
            { id: 'planning', icon: Calendar, label: 'Planung' },
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
                <button onClick={() => setShowEmployeeForm(!showEmployeeForm)} className="bg-white border-2 border-gray-300 hover:border-blue-500 rounded-lg p-6 text-left transition-all">
                  <Users className="text-blue-600 mb-3" size={32} />
                  <h3 className="font-bold text-lg mb-2">Mitarbeiter verwalten</h3>
                  <p className="text-gray-600 text-sm">Neuer Mitarbeiter, Excel-Import</p>
                </button>
                <button onClick={() => setShowShiftForm(!showShiftForm)} className="bg-white border-2 border-gray-300 hover:border-blue-500 rounded-lg p-6 text-left transition-all">
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

              {showEmployeeForm && (
                <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Neuer Mitarbeiter</h3>
                    <button onClick={() => setShowEmployeeForm(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold mb-2">Name</label><input type="text" placeholder="z.B. Müller" className="w-full border rounded px-3 py-2" /></div>
                    <div><label className="block text-sm font-semibold mb-2">Vorname</label><input type="text" placeholder="z.B. Thomas" className="w-full border rounded px-3 py-2" /></div>
                    <div><label className="block text-sm font-semibold mb-2">Vertrag</label><select className="w-full border rounded px-3 py-2"><option>Oberarzt</option><option>Facharzt</option><option>Assistenzarzt</option><option>Chefarzt</option></select></div>
                    <div><label className="block text-sm font-semibold mb-2">Wochenstunden</label><input type="number" defaultValue="40" className="w-full border rounded px-3 py-2" /></div>
                  </div>
                  <div className="mt-4"><label className="block text-sm font-semibold mb-2">Qualifikationen</label>
                    <div className="space-y-2">
                      {['Facharzt Innere Medizin', 'Notfallmedizin-Zertifizierung', 'ABS-zertifiziert'].map(q => (
                        <label key={q} className="flex items-center gap-2"><input type="checkbox" className="rounded" /><span>{q}</span></label>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4"><label className="block text-sm font-semibold mb-2">Einsatzfähig in Stationen</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Ambulanzen', 'Konsilliardienst', 'ABS', 'Station v. Frer.'].map(s => (
                        <label key={s} className="flex items-center gap-2"><input type="checkbox" className="rounded" /><span>{s}</span></label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Abbrechen</button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Speichern</button>
                  </div>
                </div>
              )}

              {showShiftForm && (
                <div className="bg-white border-2 border-green-500 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Neue Schicht</h3>
                    <button onClick={() => setShowShiftForm(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold mb-2">Name</label><input type="text" placeholder="z.B. Frühdienst" className="w-full border rounded px-3 py-2" /></div>
                    <div><label className="block text-sm font-semibold mb-2">Station</label><select className="w-full border rounded px-3 py-2"><option>Ambulanzen</option><option>Konsilliardienst</option><option>ABS</option><option>Station v. Frer.</option></select></div>
                    <div><label className="block text-sm font-semibold mb-2">Start (Uhrzeit)</label><input type="time" defaultValue="07:00" className="w-full border rounded px-3 py-2" /></div>
                    <div><label className="block text-sm font-semibold mb-2">Ende (Uhrzeit)</label><input type="time" defaultValue="15:00" className="w-full border rounded px-3 py-2" /></div>
                  </div>
                  <div className="mt-4 bg-blue-50 p-3 rounded"><p className="text-sm text-blue-900"><strong>Dauer:</strong> 8 Stunden (automatisch berechnet)</p></div>
                  <div className="mt-4"><label className="block text-sm font-semibold mb-2">Personal</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Minimum', 'Optimal', 'Maximum'].map((label, idx) => (
                        <div key={label}><label className="text-xs text-gray-600">{label}</label><input type="number" defaultValue={idx + 1} className="w-full border rounded px-3 py-2" /></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Abbrechen</button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Speichern</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'nl' && (
            <div className="space-y-6">
              {!showNlResults ? (
                <>
                  <div><label className="block text-sm font-semibold mb-2">Beschreiben Sie Ihre Regeln:</label>
                    <textarea value={nlText} onChange={(e) => setNlText(e.target.value)} placeholder="Beispiele:&#10;&#10;Dr. Schmidt kann montags nicht arbeiten.&#10;&#10;Jeder sollte maximal 2 Wochenenden pro Monat arbeiten.&#10;&#10;Hornuss bevorzugt Spätdienste und sollte nicht mehr als 3 Nachtdienste im Monat haben." className="w-full border rounded px-4 py-3 h-64 font-mono text-sm" />
                  </div>
                  <button onClick={handleAnalyzeNL} disabled={!nlText.trim()} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold">🤖 Regeln analysieren</button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded"><p className="text-blue-900 font-semibold">✓ {parsedRules.length} Regeln erkannt - Bitte überprüfen:</p></div>
                  {parsedRules.map((rule, idx) => (
                    <div key={idx} className="bg-white border-2 border-gray-300 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2"><span className="text-2xl">{idx + 1}️⃣</span><span className="font-bold text-lg">{rule.understood.type}</span></div>
                        <CheckCircle className="text-green-500" size={24} />
                      </div>
                      <div className="space-y-4">
                        <div><p className="text-sm font-semibold text-gray-600 mb-1">📝 Ihre Eingabe:</p><p className="text-gray-900 bg-gray-50 p-3 rounded italic">"{rule.original}"</p></div>
                        <div><p className="text-sm font-semibold text-gray-600 mb-2">🤖 Mein Verständnis:</p>
                          <div className="bg-blue-50 p-4 rounded space-y-2">
                            {Object.entries(rule.understood).map(([key, value]) => (
                              <div key={key} className="flex"><span className="font-semibold text-blue-900 w-32">{key === 'type' ? 'Typ:' : key === 'employee' ? 'Mitarbeiter:' : key === 'constraint' ? 'Einschränkung:' : key === 'target' ? 'Ziel:' : key === 'period' ? 'Zeitraum:' : key === 'hardness' ? 'Härte:' : key + ':'}</span><span className="text-blue-800">{value}</span></div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-2"><Check size={16} />Korrekt</button>
                          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-2"><Edit2 size={16} />Bearbeiten</button>
                          <button className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-2"><Trash2 size={16} />Löschen</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => { setShowNlResults(false); setParsedRules([]); }} className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold">Zurück bearbeiten</button>
                    <button onClick={handleSaveNlRules} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Regeln speichern</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6">
              {/* Action buttons */}
              <div className="flex gap-3 justify-between items-center">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEmployeeFormDialog(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold shadow-sm"
                  >
                    <Plus size={16} />
                    Neuer Mitarbeiter
                  </button>
                  <button
                    onClick={() => {
                      setNlText('Stefanie Pfau kann montags nicht arbeiten');
                      setShowNlDialog(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold shadow-sm"
                  >
                    <MessageSquare size={16} />
                    Neue Regel
                  </button>
                </div>
                <div className="bg-white border-2 border-gray-300 rounded-lg p-3 flex items-center gap-3">
                  <p className="font-semibold text-gray-900 text-sm">Allgemeine Regeln anzeigen</p>
                  <button onClick={() => setShowGeneralRules(!showGeneralRules)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showGeneralRules ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showGeneralRules ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Name</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Vertrag</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Std/Woche</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Qualifikationen</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Gültige Regeln</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee, idx) => {
                      const employeeRules = getRulesForEmployee(employee.name);
                      const specificRules = employeeRules.filter(r => r.appliesTo !== 'all');
                      const generalRules = employeeRules.filter(r => r.appliesTo === 'all');
                      return (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-4 font-semibold text-gray-900">{employee.name}</td>
                          <td className="px-4 py-4 text-gray-700">{employee.contract}</td>
                          <td className="px-4 py-4 text-gray-700">{employee.hours}h</td>
                          <td className="px-4 py-4"><div className="flex flex-wrap gap-1">{employee.qualifications.map((qual, qIdx) => (<span key={qIdx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{qual}</span>))}</div></td>
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              {specificRules.length > 0 && (<div><ul className="list-disc list-inside space-y-1">{specificRules.map(rule => (<li key={rule.id} className="text-sm text-gray-800"><span className={`font-semibold ${rule.type === 'hard' ? 'text-red-600' : 'text-yellow-600'}`}>{rule.type === 'hard' ? '🔴' : '🟡'}</span> {rule.text}</li>))}</ul></div>)}
                              {showGeneralRules && generalRules.length > 0 && (<div className="pt-2 border-t border-gray-200"><ul className="list-disc list-inside space-y-1">{generalRules.map(rule => (<li key={rule.id} className="text-sm text-gray-600"><span className={`font-semibold ${rule.type === 'hard' ? 'text-red-400' : 'text-yellow-400'}`}>{rule.type === 'hard' ? '🔴' : '🟡'}</span> {rule.text}</li>))}</ul></div>)}
                              {specificRules.length === 0 && (<p className="text-sm text-gray-500 italic">Keine individuellen Einschränkungen</p>)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"><Edit2 size={14} />Bearbeiten</button>
                              <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1"><Settings size={14} />Regeln</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'shifts' && (
            <div className="space-y-6">
              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowShiftFormDialog(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold shadow-sm"
                >
                  <Plus size={16} />
                  Neue Schicht
                </button>
                <button
                  onClick={() => {
                    setNlText('Stefanie Pfau kann montags nicht arbeiten');
                    setShowNlDialog(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold shadow-sm"
                >
                  <MessageSquare size={16} />
                  Neue Regel
                </button>
              </div>
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Schicht</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Station</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Zeiten</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Qualifikationen</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Sonstige Regeln</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-4 font-semibold text-gray-900">{shift.name}</td>
                        <td className="px-4 py-4 text-gray-700">{shift.station}</td>
                        <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{shift.time}</td>
                        <td className="px-4 py-4"><ul className="list-disc list-inside space-y-1">{shift.requirements.map((req, rIdx) => (<li key={rIdx} className="text-sm text-gray-800">{req}</li>))}</ul></td>
                        <td className="px-4 py-4">{shift.rules.length > 0 ? (<ul className="list-disc list-inside space-y-1">{shift.rules.map((rule, rIdx) => (<li key={rIdx} className="text-sm text-gray-800"><span className="text-yellow-600 font-semibold">🟡</span> {rule}</li>))}</ul>) : (<p className="text-sm text-gray-500 italic">Keine zusätzlichen Regeln</p>)}</td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"><Edit2 size={14} />Bearbeiten</button>
                            <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1"><Settings size={14} />Regeln</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-6">
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

              {/* Availability Grid */}
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col style={{width: '180px'}} />
                    {Array.from({length: 30}, () => <col key={Math.random()} style={{width: '60px'}} />)}
                  </colgroup>
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold border-r-2 border-gray-300 sticky left-0 bg-gray-100 z-10">Mitarbeiter</th>
                      {Array.from({length: 30}, (_, i) => {
                        const day = i + 1;
                        const date = new Date(2025, 4, day);
                        const weekday = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()];
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        return (
                          <th key={day} className={`px-2 py-2 text-center font-semibold border-l ${isWeekend ? 'bg-blue-100' : ''}`}>
                            <div className="text-xs">{day < 10 ? '0' : ''}{day}/</div>
                            <div className="text-xs text-gray-600">{weekday}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, idx) => (
                      <tr key={emp.initials} className={`border-t ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="px-3 py-2 font-medium border-r-2 border-gray-300 sticky left-0 bg-inherit z-10">
                          {emp.name}
                        </td>
                        {Array.from({length: 30}, (_, i) => {
                          const day = i + 1;
                          const date = new Date(2025, 4, day);
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          const statusCode = availability[emp.initials]?.[day];
                          const statusType = availabilityTypes.find(t => t.code === statusCode);

                          return (
                            <td
                              key={day}
                              className={`px-2 py-2 text-center border-l cursor-pointer hover:bg-blue-100 relative ${isWeekend ? 'bg-blue-50' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setAvailabilityMenu({
                                  employee: emp.initials,
                                  day: day,
                                  x: rect.left,
                                  y: rect.bottom
                                });
                              }}
                            >
                              {statusCode && (
                                <span className={`inline-block px-1 py-0.5 rounded text-xs font-semibold ${statusType?.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                                  {statusCode}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Summary row */}
                    <tr className="border-t-2 border-gray-400 bg-blue-50 font-semibold">
                      <td className="px-3 py-2 border-r-2 border-gray-300 sticky left-0 bg-blue-50 z-10">Besetzung</td>
                      {Array.from({length: 30}, (_, i) => {
                        const day = i + 1;
                        const count = employees.filter(emp => {
                          const status = availability[emp.initials]?.[day];
                          return status && ['if', '14', '15'].includes(status);
                        }).length;
                        return (
                          <td key={day} className="px-2 py-2 text-center border-l">
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Availability Menu Dropdown */}
              {availabilityMenu && (
                <div
                  className="fixed bg-white border-2 border-gray-300 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto"
                  style={{
                    left: `${availabilityMenu.x}px`,
                    top: `${availabilityMenu.y}px`,
                    minWidth: '250px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-gray-200 font-semibold text-sm text-gray-700">
                    Verfügbarkeit wählen
                  </div>
                  {/* Clear option */}
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      setAvailability(prev => ({
                        ...prev,
                        [availabilityMenu.employee]: {
                          ...prev[availabilityMenu.employee],
                          [availabilityMenu.day]: null
                        }
                      }));
                      setAvailabilityMenu(null);
                    }}
                  >
                    <X size={16} className="text-red-600" />
                    <span className="text-gray-600">Löschen</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  {/* All availability options */}
                  {availabilityTypes.map(type => (
                    <button
                      key={type.code}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => {
                        setAvailability(prev => ({
                          ...prev,
                          [availabilityMenu.employee]: {
                            ...prev[availabilityMenu.employee],
                            [availabilityMenu.day]: type.code
                          }
                        }));
                        setAvailabilityMenu(null);
                      }}
                    >
                      <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${type.color}`}>
                        {type.code}
                      </span>
                      <span className="text-gray-700">{type.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Hinweis:</strong> Klicken Sie auf eine Zelle, um ein Menü mit den Verfügbarkeitsoptionen zu öffnen.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'planning' && (
            <div className="space-y-6">
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <MonthYearPicker selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Ansicht:</span>
                      {[['single', 'Mitarbeiter'], ['multi', 'Kompakt'], ['excel', 'Schichten']].map(([view, label]) => (
                        <button key={view} onClick={() => setPlanningView(view)} className={`px-3 py-1 rounded text-sm font-semibold ${planningView === view ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed" onClick={handleGenerate} disabled={isGenerating}><RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />{isGenerating ? 'Generiere...' : 'Plan generieren'}</button>
                </div>
              </div>

              {isGenerating && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                      <div className="mb-4"><RefreshCw size={48} className="animate-spin text-green-600 mx-auto" /></div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Plan wird generiert...</h3>
                      <p className="text-gray-600 mb-6">{generationProgress < 30 && 'Initialisiere Optimierung...'}{generationProgress >= 30 && generationProgress < 60 && 'Prüfe Constraints...'}{generationProgress >= 60 && generationProgress < 90 && 'Optimiere Verteilung...'}{generationProgress >= 90 && 'Finalisiere Plan...'}</p>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden"><div className="bg-green-600 h-4 rounded-full transition-all duration-300 ease-out" style={{ width: `${generationProgress}%` }}></div></div>
                      <p className="text-sm text-gray-500 font-semibold">{generationProgress}% abgeschlossen</p>
                      {generationProgress === 100 && (<div className="mt-4 flex items-center justify-center gap-2 text-green-600"><CheckCircle size={20} /><span className="font-semibold">Erfolgreich!</span></div>)}
                    </div>
                  </div>
                </div>
              )}

              {planningView === 'single' && (
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-x-auto">
                  <div className="p-4 bg-gray-50 border-b-2 border-gray-300">
                    <h3 className="font-bold text-lg mb-3">Mitarbeiterübersicht - Mai 2025</h3>
                    <div className="flex gap-2 text-sm flex-wrap">
                      {[
                        ['bg-yellow-200 border-yellow-400', 'PP'],
                        ['bg-orange-200 border-orange-400', 'OA'],
                        ['bg-blue-200 border-blue-400', 'Allgem'],
                        ['bg-purple-200 border-purple-400', 'Myko/Echi'],
                        ['bg-green-200 border-green-400', 'Reise'],
                        ['bg-pink-200 border-pink-400', 'COVID'],
                        ['bg-cyan-200 border-cyan-400', 'Flü-Med'],
                        ['bg-indigo-200 border-indigo-400', 'KD1-3'],
                        ['bg-cyan-100 border-cyan-500', 'UKF Visite'],
                        ['bg-green-100 border-green-500', 'BK (ABS)'],
                        ['bg-amber-200 border-amber-400', 'OA Station'],
                        ['bg-sky-200 border-sky-400', '12-1818'],
                        ['bg-red-200 border-red-400', 'Rufbereitschaft'],
                      ].map(([color, label]) => (
                        <span key={label} className="flex items-center gap-1"><div className={`w-4 h-4 ${color} rounded`}></div>{label}</span>
                      ))}
                      <span className="flex items-center gap-1"><span className="text-red-600 font-bold">🔴</span>Konflikt</span>
                      <span className="flex items-center gap-1"><span className="text-gray-600 font-bold">🔒</span>Gesperrt</span>
                    </div>
                  </div>
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col style={{width: '180px'}} />
                      {['05', '06', '07', '08', '09', '10', '11', '12', '13', '14'].map(day => <col key={day} style={{width: '80px'}} />)}
                    </colgroup>
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold border-r-2 border-gray-300 sticky left-0 bg-gray-100 z-10">Mitarbeiter</th>
                        {['05', '06', '07', '08', '09', '10', '11', '12', '13', '14'].map(day => {
                          const isWeekend = day === '10' || day === '11';
                          const dayName = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di', 'Mi'][parseInt(day) - 5];
                          return <th key={day} className={`px-2 py-2 text-center font-semibold border-l ${isWeekend ? 'bg-blue-100' : ''}`}>
                            <div className="text-xs">{day}</div>
                            <div className="text-xs text-gray-600">{dayName}</div>
                          </th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(scheduleData).map(([employeeInitials, days], idx) => {
                        const employee = employees.find(e => e.initials === employeeInitials);
                        const employeeName = employee ? employee.name : employeeInitials;
                        return (
                        <tr key={employeeInitials} className={`border-t ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="px-3 py-2 font-medium border-r-2 border-gray-300 sticky left-0 bg-inherit z-10">{employeeName}</td>
                          {['05', '06', '07', '08', '09', '10', '11', '12', '13', '14'].map(day => {
                            const cell = days[day];
                            const isWeekend = day === '10' || day === '11';
                            return (
                              <td key={day} className={`px-2 py-2 text-center border-l ${isWeekend ? 'bg-blue-50' : ''}`}>
                                {cell ? (
                                  <div className="relative group">
                                    <div
                                      className={`px-2 py-1 rounded border text-xs font-semibold ${shiftColors[cell.shift]} ${cell.violation ? 'border-red-500 ring-1 ring-red-300' : ''} ${cell.locked ? 'opacity-75' : 'cursor-pointer hover:shadow-md'}`}
                                      onClick={(e) => handleCellClick(e, employeeName, day, cell.station, cell.violation)}
                                      title={cell.violation ? getViolationTooltip(employeeInitials, day, cell.shift) : ''}
                                    >
                                      {cell.shift}
                                      {cell.violation && <span className="absolute -top-1 -right-1 text-red-600 text-xs">🔴</span>}
                                      {cell.locked && <span className="absolute -bottom-1 -right-1 text-gray-600 text-xs">🔒</span>}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="px-2 py-1 text-gray-300 text-xs border border-dashed border-gray-200 rounded hover:border-gray-400 cursor-pointer" onClick={(e) => handleCellClick(e, employeeName, day, null, false)}>—</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {planningView === 'multi' && (
                <div className="space-y-6">
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                    <div className="mb-3"><h3 className="font-bold text-lg">Kompaktübersicht - Alle Stationen</h3></div>
                    <div className="flex gap-2 text-xs flex-wrap">
                      {[
                        ['bg-yellow-200 border-yellow-400', 'PP'],
                        ['bg-orange-200 border-orange-400', 'OA'],
                        ['bg-blue-200 border-blue-400', 'Allgem'],
                        ['bg-purple-200 border-purple-400', 'Myko/Echi'],
                        ['bg-green-200 border-green-400', 'Reise'],
                        ['bg-pink-200 border-pink-400', 'COVID'],
                        ['bg-cyan-200 border-cyan-400', 'Flü-Med'],
                        ['bg-indigo-200 border-indigo-400', 'KD1-3'],
                        ['bg-cyan-100 border-cyan-500', 'UKF Visite'],
                        ['bg-teal-100 border-teal-500', 'UKF FoBi'],
                        ['bg-green-100 border-green-500', 'BK (ABS)'],
                        ['bg-amber-200 border-amber-400', 'OA Station'],
                        ['bg-amber-100 border-amber-500', 'Assistent'],
                        ['bg-sky-200 border-sky-400', '12-1818'],
                        ['bg-red-200 border-red-400', 'Rufbereitschaft'],
                        ['bg-rose-200 border-rose-400', 'PPA'],
                        ['bg-pink-100 border-pink-500', 'Rekrut'],
                        ['bg-fuchsia-200 border-fuchsia-400', 'Kongress'],
                      ].map(([color, label]) => (
                        <span key={label} className="flex items-center gap-1"><div className={`w-3 h-3 ${color} rounded`}></div>{label}</span>
                      ))}
                    </div>
                  </div>
                  {Object.entries(multiUnitData).map(([unit, employeeData]) => (
                    <div key={unit} className="bg-white border-2 border-gray-300 rounded-lg overflow-x-auto">
                      <div className="p-3 bg-gray-50 border-b-2 border-gray-300"><h3 className="font-bold">{unit}</h3></div>
                      <table className="w-full text-sm table-fixed">
                        <colgroup>
                          <col style={{width: '180px'}} />
                          {['05', '06', '07', '08', '09', '10', '11', '12', '13', '14'].map(day => <col key={day} style={{width: '80px'}} />)}
                        </colgroup>
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold border-r-2 border-gray-300 sticky left-0 bg-gray-100 z-10">Mitarbeiter</th>
                            {['05', '06', '07', '08', '09', '10', '11', '12', '13', '14'].map(day => {
                              const isWeekend = day === '10' || day === '11';
                              const dayName = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di', 'Mi'][parseInt(day) - 5];
                              return <th key={day} className={`px-2 py-2 text-center font-semibold border-l ${isWeekend ? 'bg-blue-100' : ''}`}>
                                <div className="text-xs">{day}</div>
                                <div className="text-xs text-gray-600">{dayName}</div>
                              </th>;
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(employeeData).map(([employeeInitials, days], idx) => {
                            const employee = employees.find(e => e.initials === employeeInitials);
                            const employeeName = employee ? employee.name : employeeInitials;
                            return (
                            <tr key={employeeInitials} className={`border-t ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                              <td className="px-3 py-2 font-medium border-r-2 border-gray-300 sticky left-0 bg-inherit z-10">{employeeName}</td>
                              {['05', '06', '07', '08', '09', '10', '11', '12', '13', '14'].map(day => {
                                const shift = days[day];
                                const isWeekend = day === '10' || day === '11';
                                // Check for violations from scheduleData
                                const hasViolation = scheduleData[employeeInitials]?.[day]?.violation || false;
                                return (
                                  <td key={day} className={`px-2 py-2 text-center border-l ${isWeekend ? 'bg-blue-50' : ''}`}>
                                    {shift ? (
                                      <div className="relative inline-block">
                                        <div
                                          className={`px-2 py-1 rounded border text-xs font-semibold ${shiftColors[shift]} ${hasViolation ? 'border-2 border-red-600 ring-2 ring-red-400 animate-pulse' : ''}`}
                                          title={hasViolation ? getViolationTooltip(employeeInitials, day, shift) : ''}
                                        >
                                          {shift}
                                        </div>
                                        {hasViolation && <span className="absolute -top-1 -right-1 text-red-600 text-xs">⚠️</span>}
                                      </div>
                                    ) : (
                                      <span className="text-gray-300 text-xs">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {planningView === 'excel' && (
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-x-auto">
                  <div className="p-4 bg-gray-50 border-b-2 border-gray-300">
                    <h3 className="font-bold text-lg mb-3">Schichtenübersicht - Mai 2025</h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2 text-xs mb-3">
                      {Object.entries(employeeColors).map(([initials, colorClass]) => {
                        const employee = employees.find(e => e.initials === initials);
                        const name = employee ? employee.name.split(' ')[1] : initials;
                        return (
                          <div key={initials} className="flex items-center gap-1">
                            <div className={`w-3 h-3 rounded border ${colorClass}`}></div>
                            <span>{initials} ({name})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col style={{width: '100px'}} />
                      {shifts.slice(0, 15).map(shift => <col key={shift.name} style={{width: '100px'}} />)}
                    </colgroup>
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold border-r-2 border-gray-300 sticky left-0 bg-gray-100 z-10">Datum</th>
                        {shifts.slice(0, 15).map(shift => (
                          <th
                            key={shift.name}
                            className="px-2 py-2 text-left font-semibold border-l text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                            onClick={() => handleShiftClick(shift.name)}
                            title="Klicken für Schicht-Details"
                          >
                            {shift.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['05', '06', '07', '08', '09', '10', '11', '12', '13', '14'].map((day, idx) => {
                        const isWeekend = day === '10' || day === '11';
                        const dayName = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di', 'Mi'][parseInt(day) - 5];
                        return (
                          <tr key={day} className={`border-t ${isWeekend ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                            <td className="px-3 py-2 font-medium border-r-2 border-gray-300 sticky left-0 bg-inherit z-10">
                              <div className="text-xs">{day}.05</div>
                              <div className="text-xs text-gray-600">{dayName}</div>
                            </td>
                            {shifts.slice(0, 15).map(shift => {
                              // Find employees assigned to this shift on this day
                              const assignedEmps = Object.entries(scheduleData)
                                .filter(([initials, days]) => days[day]?.shift === shift.name)
                                .map(([initials]) => {
                                  const dayData = scheduleData[initials][day];
                                  return {
                                    initials,
                                    violation: dayData?.violation,
                                    locked: dayData?.locked
                                  };
                                });

                              // Only show warning for specific critical shifts that should have someone assigned
                              // Example: Show warning for OA on day 08, and PP on day 12
                              const shouldShowWarning = (
                                (shift.name === 'OA' && day === '08') ||
                                (shift.name === 'PP' && day === '12')
                              );

                              return (
                                <td key={shift.name} className="px-2 py-2 align-top border-l">
                                  {assignedEmps.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {assignedEmps.map((emp, empIdx) => {
                                        const employee = employees.find(e => e.initials === emp.initials);
                                        const employeeName = employee ? employee.name : emp.initials;
                                        return (
                                        <div
                                          key={empIdx}
                                          className={`relative px-1.5 py-0.5 rounded text-xs font-semibold cursor-pointer hover:shadow-md ${employeeColors[emp.initials]} border ${emp.violation ? 'border-2 border-red-600 ring-2 ring-red-400 shadow-lg animate-pulse' : ''}`}
                                          onClick={(e) => { e.stopPropagation(); handleEmployeeClick(emp.initials); }}
                                          title={emp.violation ? getViolationTooltip(emp.initials, day, shift.name) : ''}
                                        >
                                          <div className="whitespace-nowrap">{emp.initials}</div>
                                          {emp.violation && <span className="absolute -top-1.5 -right-1.5 text-red-600 text-base">⚠️</span>}
                                          {emp.locked && <span className="absolute -bottom-1 -right-1 text-gray-600 text-xs">🔒</span>}
                                        </div>
                                      )})}
                                    </div>
                                  ) : shouldShowWarning ? (
                                    <div className="flex flex-col items-center justify-center px-2 py-1 gap-1">
                                      <div
                                        className="flex items-center gap-1 bg-red-100 border-2 border-red-500 rounded px-2.5 py-1.5 cursor-pointer hover:bg-red-200 hover:border-red-600 hover:shadow-lg transition-all animate-pulse"
                                        title="Klicken für Schicht-Anforderungen"
                                        onClick={(e) => { e.stopPropagation(); handleShiftClick(shift.name); }}
                                      >
                                        <AlertCircle size={14} className="text-red-700 font-bold" />
                                        <span className="text-red-800 text-xs font-bold">LEER</span>
                                      </div>
                                      {shift.requirements && shift.requirements.length > 0 && (
                                        <div className="text-[10px] text-gray-600 text-center">
                                          Benötigt: {shift.requirements.join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300 text-xs">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'control' && (
            <div className="space-y-6">
              {/* Sub-navigation for control views */}
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setControlView('dates')}
                  className={`px-4 py-2 font-semibold transition-colors ${controlView === 'dates' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Nach Datum
                </button>
                <button
                  onClick={() => setControlView('shifts')}
                  className={`px-4 py-2 font-semibold transition-colors ${controlView === 'shifts' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Nach Schicht
                </button>
                <button
                  onClick={() => setControlView('staff')}
                  className={`px-4 py-2 font-semibold transition-colors ${controlView === 'staff' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Nach Mitarbeiter
                </button>
              </div>

              {/* Dates view */}
              {controlView === 'dates' && (
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Datum</th>
                        <th className="px-4 py-3 text-left font-semibold">Wochentag</th>
                        <th className="px-4 py-3 text-left font-semibold">Besetzte Schichten</th>
                        <th className="px-4 py-3 text-center font-semibold">Anforderungen erfüllt</th>
                        <th className="px-4 py-3 text-left font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({length: 31}, (_, i) => {
                        const day = i + 1;
                        const date = new Date(2025, 4, day); // May 2025
                        const weekday = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()];
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const fulfilled = Math.random() > 0.3; // Random for demo
                        const shiftsCount = Math.floor(Math.random() * 15) + 10;

                        // Generate random violation details for demo
                        const violations = [
                          'Schicht "OA Konsil" nicht besetzt',
                          'Schicht "Rufbereitschaft" benötigt Oberarzt',
                          'Mindestbesetzung für Ambulanzen nicht erreicht',
                          'Keine Notfallzertifizierung für Frühdienst',
                          'Schicht "BK" benötigt ABS-Zertifizierung'
                        ];
                        const details = fulfilled
                          ? 'Alle Schichten korrekt besetzt'
                          : violations[Math.floor(Math.random() * violations.length)];

                        return (
                          <tr key={day} className={`border-t hover:bg-gray-50 ${isWeekend ? 'bg-blue-50' : ''}`}>
                            <td className="px-4 py-3 font-medium">{day < 10 ? '0' : ''}{day}.05.2025</td>
                            <td className="px-4 py-3">{weekday}</td>
                            <td className="px-4 py-3 text-gray-600">{shiftsCount} Schichten</td>
                            <td className="px-4 py-3 text-center">
                              {fulfilled ? (
                                <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                                  <CheckCircle size={20} />
                                  Erfüllt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                  <X size={20} />
                                  Nicht erfüllt
                                </span>
                              )}
                            </td>
                            <td className={`px-4 py-3 text-sm ${fulfilled ? 'text-gray-600' : 'text-red-600 font-medium'}`}>
                              {details}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Shifts view */}
              {controlView === 'shifts' && (
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Schicht</th>
                        <th className="px-4 py-3 text-left font-semibold">Kategorie</th>
                        <th className="px-4 py-3 text-left font-semibold">Anforderungen</th>
                        <th className="px-4 py-3 text-center font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.map((shift) => {
                        const fulfilled = Math.random() > 0.25; // Random for demo

                        // Generate random violation details for demo
                        const violations = [
                          `Nicht an allen Tagen besetzt (12 von 31 Tagen fehlen)`,
                          `Zugewiesener Mitarbeiter hat keine erforderliche Qualifikation`,
                          `Überschneidung mit anderen Schichten für Mitarbeiter`,
                          `Mindestanzahl Mitarbeiter nicht erfüllt`,
                          `Keine Oberarzt-Qualifikation vorhanden`
                        ];
                        const details = fulfilled
                          ? 'Alle Tage korrekt besetzt'
                          : violations[Math.floor(Math.random() * violations.length)];

                        return (
                          <tr key={shift.name} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{shift.name}</td>
                            <td className="px-4 py-3 text-gray-600">{shift.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{shift.requirements.join(', ') || 'Keine speziellen'}</td>
                            <td className="px-4 py-3 text-center">
                              {fulfilled ? (
                                <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                                  <CheckCircle size={20} />
                                  Erfüllt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                  <X size={20} />
                                  Nicht erfüllt
                                </span>
                              )}
                            </td>
                            <td className={`px-4 py-3 text-sm ${fulfilled ? 'text-gray-600' : 'text-red-600 font-medium'}`}>
                              {details}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Staff view */}
              {controlView === 'staff' && (
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Mitarbeiter</th>
                        <th className="px-4 py-3 text-left font-semibold">Position</th>
                        <th className="px-4 py-3 text-left font-semibold">Qualifikationen</th>
                        <th className="px-4 py-3 text-center font-semibold">Anforderungen erfüllt</th>
                        <th className="px-4 py-3 text-left font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => {
                        const fulfilled = Math.random() > 0.2; // Random for demo

                        // Generate random violation details for demo
                        const violations = [
                          `Ruhezeit verletzt am 12.05. und 18.05.`,
                          `Max. 2 Wochenenddienste überschritten (3 geplant)`,
                          `Wochenarbeitszeit überschritten (52h statt max. 48h)`,
                          `Zu viele Nachtdienste (5 statt max. 3)`,
                          `Überschneidende Schichten am 07.05.`,
                          `Qualifikation fehlt für zugewiesene Schicht "OA Konsil"`
                        ];
                        const details = fulfilled
                          ? 'Alle Regeln eingehalten'
                          : violations[Math.floor(Math.random() * violations.length)];

                        return (
                          <tr key={emp.initials} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{emp.name}</td>
                            <td className="px-4 py-3 text-gray-600">{emp.contract}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{emp.qualifications.slice(0, 2).join(', ')}{emp.qualifications.length > 2 ? '...' : ''}</td>
                            <td className="px-4 py-3 text-center">
                              {fulfilled ? (
                                <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                                  <CheckCircle size={20} />
                                  Erfüllt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                  <X size={20} />
                                  Nicht erfüllt
                                </span>
                              )}
                            </td>
                            <td className={`px-4 py-3 text-sm ${fulfilled ? 'text-gray-600' : 'text-red-600 font-medium'}`}>
                              {details}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Planungsregeln & Constraints</h2>
                <button
                  onClick={() => {
                    setNlText('Stefanie Pfau kann montags nicht arbeiten');
                    setShowNlDialog(true);
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
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Info"
                                >
                                  <AlertCircle size={18} />
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
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Info"
                                >
                                  <AlertCircle size={18} />
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
      {showConstraintViolationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <AlertCircle className="text-orange-500" size={28} />
              <h2 className="text-xl font-bold text-gray-900">⚠️ CONSTRAINT-VERLETZUNG ERKANNT</h2>
            </div>

            {/* Violation Details */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-lg text-gray-900">
                  Hornuss - Donnerstag 08.05.2025 - Nachtdienst
                </p>
              </div>

              <div>
                <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                  <span>🔴</span>
                  PROBLEM:
                </h3>
                <p className="text-gray-900 ml-6">Verletzt Arbeitszeitgesetz: 11h Ruhezeit</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Details:</h4>
                <ul className="space-y-1 ml-6 text-sm text-gray-700">
                  <li>• Vorherige Schicht: Mi 07.05, Spätdienst (15-23h)</li>
                  <li>• Nächste Schicht: Do 08.05, Nachtdienst (23-07h)</li>
                  <li>• Ruhezeit: Nur 0h (erforderlich: 11h)</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <span>💡</span>
                  VORSCHLÄGE:
                </h3>
                <div className="space-y-2 ml-6">
                  <button className="text-left w-full px-3 py-2 bg-white rounded hover:bg-blue-100 transition-colors border border-blue-200">
                    <span className="font-medium">1.</span> Verschiebe Nachtdienst auf Fr 09.05
                  </button>
                  <button className="text-left w-full px-3 py-2 bg-white rounded hover:bg-blue-100 transition-colors border border-blue-200">
                    <span className="font-medium">2.</span> Tausche mit Duffner (verfügbar, qualifiziert)
                  </button>
                  <button className="text-left w-full px-3 py-2 bg-white rounded hover:bg-blue-100 transition-colors border border-blue-200">
                    <span className="font-medium">3.</span> Entferne Spätdienst am Mi 07.05
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⚙️</span>
                  ODER MANUELL ÜBERSCHREIBEN:
                </h3>
                <div className="ml-6 space-y-3">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-sm text-gray-900">Ich akzeptiere diese Regelüberschreitung</span>
                  </label>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Grund:</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="z.B. Notfall, Personalmangel..."
                    />
                    <p className="text-xs text-gray-500 mt-1">(Wird im Audit-Log gespeichert)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowConstraintViolationDialog(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Vorschlag anwenden
              </button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors">
                Überschreiben
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Generation Dialog */}
      {showPlanGenerationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Dienstplan generieren</h2>
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  backendIsHealthy === null
                    ? 'bg-gray-100 text-gray-600'
                    : backendIsHealthy
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {backendIsHealthy === null ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Prüfe Backend...</span>
                    </>
                  ) : backendIsHealthy ? (
                    <>
                      <Wifi size={12} />
                      <span>OR-Tools Backend verfügbar</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={12} />
                      <span>Backend nicht erreichbar</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowPlanGenerationDialog(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Zeitraum */}
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Zeitraum:</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Von:</span>
                    <input
                      type="date"
                      defaultValue="2025-05-01"
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Bis:</span>
                    <input
                      type="date"
                      defaultValue="2025-05-31"
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <span className="text-sm text-gray-600">(31 Tage, 4 Wochen)</span>
                </div>
              </div>

              {/* Stationen */}
              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Stationen (welche sollen geplant werden?):
                </label>
                <div className="space-y-2 ml-3">
                  {['Ambulanzen', 'Konsiliardienst', 'ABS', 'Station v. Frer.'].map((station) => (
                    <label key={station} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedStations.includes(station)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStations([...selectedStations, station]);
                          } else {
                            setSelectedStations(selectedStations.filter(s => s !== station));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-900">{station}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-gray-600">Forschung (aktuell keine Besetzung erforderlich)</span>
                  </label>
                </div>
              </div>

              {/* Fixierte Zuordnungen */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block font-semibold text-gray-900 mb-2">Fixierte Zuordnungen:</label>
                <p className="text-sm text-gray-700 mb-2">
                  🔒 12 Schichten sind gesperrt und werden nicht verändert:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 ml-6">
                  <li>• Müller: Sa 10.05 + So 11.05 (Wochenende gesperrt)</li>
                  <li>• Hornuss: Training 15-17.05 (3 Tage gesperrt)</li>
                  <li>• ... <button className="text-blue-600 hover:underline">(weitere anzeigen)</button></li>
                </ul>
              </div>

              {/* Optimierungsmodus */}
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Optimierungsmodus:</label>
                <div className="space-y-2 ml-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="optimization"
                      checked={selectedOptimizationMode === 'quick'}
                      onChange={() => setSelectedOptimizationMode('quick')}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900">Schnell (30 Sekunden, gute Lösung)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="optimization"
                      checked={selectedOptimizationMode === 'optimal'}
                      onChange={() => setSelectedOptimizationMode('optimal')}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900">Optimal (3-5 Minuten, beste Lösung)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="optimization"
                      checked={selectedOptimizationMode === 'custom'}
                      onChange={() => setSelectedOptimizationMode('custom')}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900">Benutzerdefiniert (Zeit-Limit:</span>
                    <input
                      type="number"
                      value={customTimeLimit}
                      onChange={(e) => setCustomTimeLimit(parseInt(e.target.value) || 10)}
                      min="1"
                      max="60"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-900">Minuten)</span>
                  </label>
                </div>
              </div>

              {/* Was tun bei unlösbaren Constraints */}
              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Was tun bei unlösbaren Constraints?
                </label>
                <div className="space-y-2 ml-3">
                  <label className="flex items-start gap-2">
                    <input type="radio" name="unsolvable" defaultChecked className="w-4 h-4 mt-1" />
                    <span className="text-gray-900">
                      Bestmögliche Lösung finden (einige weiche Regeln verletzen)
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input type="radio" name="unsolvable" className="w-4 h-4 mt-1" />
                    <span className="text-gray-900">Abbrechen und Fehler melden</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {generationError && (
              <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle size={20} />
                  <span className="font-semibold">Fehler bei der Generierung:</span>
                </div>
                <p className="mt-2 text-sm text-red-700">{generationError}</p>
                <button
                  onClick={resetGenerationState}
                  className="mt-2 text-sm text-red-600 hover:underline"
                >
                  Fehler zurücksetzen
                </button>
              </div>
            )}

            {/* Generation Progress */}
            {solverIsGenerating && (
              <div className="mx-6 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <RefreshCw size={20} className="animate-spin" />
                  <span className="font-semibold">Generiere Dienstplan...</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${solverProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-blue-700">
                  {solverProgress < 30
                    ? 'Initialisiere Solver...'
                    : solverProgress < 50
                    ? 'Erstelle Constraints...'
                    : solverProgress < 90
                    ? 'Optimiere Lösung...'
                    : 'Finalisiere Plan...'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 border-t">
              {solverIsGenerating ? (
                <button
                  onClick={cancelGeneration}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Abbrechen
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowPlanGenerationDialog(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Schließen
                  </button>
                  <button
                    onClick={startGeneration}
                    disabled={!backendIsHealthy}
                    className={`px-4 py-2 rounded transition-colors ${
                      backendIsHealthy
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Generieren
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Coverage Dialog */}
      {showEmergencyCoverageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <span className="text-2xl">🚨</span>
              <h2 className="text-xl font-bold text-gray-900">Emergency Coverage</h2>
            </div>

            {/* Shift Info */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900">
                <span className="font-semibold">Shift:</span> {showEmergencyCoverageDialog.shift}, {showEmergencyCoverageDialog.date}
              </p>
              <p className="text-gray-900">
                <span className="font-semibold">Ausgefallen:</span> {showEmergencyCoverageDialog.employee} ({showEmergencyCoverageDialog.reason})
              </p>
            </div>

            {/* Suggested Replacements */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Vorgeschlagene Ersatzpersonen:</h3>

              {/* Replacement 1 - Best match */}
              <div className="border border-green-300 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <span className="font-bold text-gray-900">1. Dr. Müller</span>
                    <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded font-semibold">Score: 95%</span>
                  </div>
                </div>
                <div className="space-y-1 ml-6 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <span>✅</span>
                    <span>Qualifiziert (Oberarzt, Notfall-Zert.)</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <span>✅</span>
                    <span>Verfügbar (nicht eingeplant)</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <span>✅</span>
                    <span>Unter Zielstunden (38h/40h diese Woche)</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <span>✅</span>
                    <span>Nur 1 Nachtdienst diesen Monat</span>
                  </div>
                </div>
                <button className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold">
                  Zuweisen
                </button>
              </div>

              {/* Replacement 2 - Good match */}
              <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span className="font-bold text-gray-900">2. Dr. Duffner</span>
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded font-semibold">Score: 78%</span>
                  </div>
                </div>
                <div className="space-y-1 ml-6 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <span>✅</span>
                    <span>Qualifiziert</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <span>✅</span>
                    <span>Verfügbar</span>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-700">
                    <span>⚠️</span>
                    <span>Bereits 4 aufeinanderfolgende Tage</span>
                  </div>
                </div>
                <button className="mt-3 w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors font-semibold">
                  Zuweisen
                </button>
              </div>

              {/* Replacement 3 - Poor match */}
              <div className="border border-red-300 bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">❌</span>
                    <span className="font-bold text-gray-900">3. Dr. Schmidt</span>
                    <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded font-semibold">Score: 65%</span>
                  </div>
                </div>
                <div className="space-y-1 ml-6 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <span>✅</span>
                    <span>Qualifiziert</span>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-700">
                    <span>⚠️</span>
                    <span>Arbeitet bereits Spätdienst an diesem Tag</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-700">
                    <span>❌</span>
                    <span>Über Zielstunden (44h/40h)</span>
                  </div>
                </div>
                <button className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold">
                  Zuweisen (Override)
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowEmergencyCoverageDialog(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Edit Dialog */}
      {showRuleEditDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Regel bearbeiten</h2>
              <button
                onClick={() => setShowRuleEditDialog(null)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Original Input */}
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Originale Eingabe:</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                  <p className="text-gray-900">{showRuleEditDialog.text}</p>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t-2 border-gray-300"></div>

              {/* Verstanden als */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Verstanden als:</h3>

                {/* Regeltyp */}
                <div className="mb-4">
                  <label className="block font-medium text-gray-900 mb-2">Regeltyp:</label>
                  <div className="space-y-2 ml-3">
                    {['Fairness-Ziel', 'Qualifikationsanforderung', 'Mitarbeiter-Einschränkung', 'Arbeitszeitgesetz', 'Sonstige'].map((type) => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="ruleType"
                          defaultChecked={showRuleEditDialog.category === type}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-900">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Betrifft */}
                <div className="mb-4">
                  <label className="block font-medium text-gray-900 mb-2">Betrifft:</label>
                  <div className="space-y-2 ml-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked={showRuleEditDialog.appliesTo === 'all'}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-900">Alle Mitarbeiter</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-gray-900">Nur bestimmte:</span>
                      <input
                        type="text"
                        placeholder="Name eingeben..."
                        defaultValue={showRuleEditDialog.appliesTo !== 'all' ? showRuleEditDialog.appliesTo : ''}
                        className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Maximum Wochenenden (example - conditional) */}
                {showRuleEditDialog.category === 'Fairness' && (
                  <div className="mb-4 ml-3">
                    <div className="flex items-center gap-2">
                      <label className="text-gray-900">Maximum Wochenenden:</label>
                      <input
                        type="number"
                        defaultValue="2"
                        className="w-20 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-900">pro</span>
                      <select className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>Monat</option>
                        <option>Woche</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Regel-Härte */}
                <div className="mb-4">
                  <label className="block font-medium text-gray-900 mb-2">Regel-Härte:</label>
                  <div className="space-y-2 ml-3">
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="hardness"
                        defaultChecked={showRuleEditDialog.type === 'hard'}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <span className="text-gray-900 font-medium">HART</span>
                        <span className="text-sm text-gray-600 block">
                          (niemals überschreiten, bricht Generierung ab)
                        </span>
                      </div>
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="hardness"
                        defaultChecked={showRuleEditDialog.type === 'soft'}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <span className="text-gray-900 font-medium">WEICH</span>
                        <span className="text-sm text-gray-600 block">
                          (Optimierungsziel, kann bei Bedarf überschritten werden)
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Falls weich - Gewichtung */}
                {showRuleEditDialog.type === 'soft' && (
                  <div className="mb-4">
                    <label className="block font-medium text-gray-900 mb-2">Falls weich - Gewichtung:</label>
                    <div className="flex gap-4 ml-3">
                      {['Niedrig', 'Mittel', 'Hoch', 'Sehr hoch'].map((weight) => (
                        <label key={weight} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="weight"
                            defaultChecked={weight === 'Mittel'}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-900">{weight}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div className="border-t-2 border-gray-300"></div>

              {/* Vorschau */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-gray-900 mb-2">Vorschau der Regel:</h3>
                <p className="text-sm text-gray-700">
                  💡 System versucht, jedem Mitarbeiter max. 2 Wochenenden/Monat zuzuweisen. Falls unmöglich
                  (z.B. Personalmangel), kann überschritten werden.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowRuleEditDialog(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  // Save logic here
                  setShowRuleEditDialog(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HybridConfigDemo;
