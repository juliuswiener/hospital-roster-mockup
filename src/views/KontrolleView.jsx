import React, { useState, useMemo } from 'react';
import { CheckCircle, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { MonthYearPicker } from '../components';
import { useValidation } from '../validation';

// Helper function to parse YYYY-MM to [year, month]
const parseYearMonth = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  return [year, month - 1]; // month is 0-indexed for Date
};

// Helper function to get days in month
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper to format date as DD.MM.YYYY
const formatDate = (year, month, day) => {
  return `${day.toString().padStart(2, '0')}.${(month + 1).toString().padStart(2, '0')}.${year}`;
};

// Helper to format ISO date as DD.MM.YYYY
const formatISODate = (isoDate) => {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
};

export const KontrolleView = ({
  employees,
  shifts,
  scheduleData,
  rules,
  selectedMonth,
  onMonthChange,
}) => {
  const [controlView, setControlView] = useState('dates');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Convert scheduleData to assignments format for validation
  const assignments = useMemo(() => {
    const result = [];
    const [year, month] = parseYearMonth(selectedMonth);
    const daysInMonth = getDaysInMonth(year, month);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayData = scheduleData[dateStr] || {};

      for (const [shiftName, employeeInitials] of Object.entries(dayData)) {
        if (!employeeInitials) continue;

        // Handle array of employee initials
        const empList = Array.isArray(employeeInitials) ? employeeInitials : [employeeInitials];

        for (const initials of empList) {
          if (!initials) continue;

          const employee = employees.find(e => e.initials === initials || e.name === initials);
          const shift = shifts.find(s => s.name === shiftName);

          if (employee && shift) {
            result.push({
              id: `${dateStr}-${shiftName}-${initials}`,
              employeeId: employee.id || employee.initials,
              shiftId: shift.id || shift.name,
              date: dateStr,
              station: shift.station || 'default',
            });
          }
        }
      }
    }

    return result;
  }, [scheduleData, selectedMonth, employees, shifts]);

  // Convert employees and shifts to validation format
  const validationEmployees = useMemo(() => {
    return employees.map(emp => ({
      id: emp.id || emp.initials,
      name: emp.name,
      initials: emp.initials,
      contractType: emp.contract || emp.contractType || 'full-time',
      weeklyHours: emp.hours || emp.weeklyHours || 40,
      qualifications: emp.qualifications || [],
    }));
  }, [employees]);

  const validationShifts = useMemo(() => {
    return shifts.map(shift => ({
      id: shift.id || shift.name,
      name: shift.name,
      displayName: shift.displayName || shift.name,
      category: shift.category || 'default',
      description: shift.description || '',
      station: shift.station || 'default',
      time: shift.time || { start: '08:00', end: '16:00' },
      requirements: shift.requirements || [],
      rules: shift.rules || [],
    }));
  }, [shifts]);

  const validationRules = useMemo(() => {
    return rules.map(rule => ({
      id: rule.id,
      type: rule.type,
      text: rule.text,
      category: rule.category || 'general',
      appliesTo: rule.appliesTo || 'all',
      isActive: rule.isActive !== false,
    }));
  }, [rules]);

  // Calculate date range for the month
  const dateRange = useMemo(() => {
    const [year, month] = parseYearMonth(selectedMonth);
    const daysInMonth = getDaysInMonth(year, month);
    const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;
    return { start: startDate, end: endDate };
  }, [selectedMonth]);

  // Use the validation hook
  const {
    result: validationResult,
    isValidating,
    validateAll,
    getDateViolations,
    getEmployeeViolations,
    forceRevalidate,
  } = useValidation(
    assignments,
    validationEmployees,
    validationShifts,
    validationRules,
    dateRange.start,
    dateRange.end,
    { autoValidate: true, debounceMs: 300 }
  );

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    forceRevalidate();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Get total error count for the month picker
  const errorCount = validationResult
    ? validationResult.statistics.hardViolationCount
    : 0;

  // Group violations by shift
  const violationsByShift = useMemo(() => {
    if (!validationResult) return new Map();

    const map = new Map();
    const allViolations = [...validationResult.hardViolations, ...validationResult.softViolations];

    for (const violation of allViolations) {
      for (const shiftId of violation.affectedEntities.shiftIds) {
        if (!map.has(shiftId)) {
          map.set(shiftId, []);
        }
        map.get(shiftId).push(violation);
      }
    }

    return map;
  }, [validationResult]);

  // Get shift assignment count per day
  const getShiftCount = (dateStr) => {
    const dayData = scheduleData[dateStr] || {};
    let count = 0;
    for (const value of Object.values(dayData)) {
      if (Array.isArray(value)) {
        count += value.filter(Boolean).length;
      } else if (value) {
        count += 1;
      }
    }
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header with Month Picker */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Planungskontrolle</h2>
        <div className="flex items-center gap-4">
          <MonthYearPicker
            selectedMonth={selectedMonth}
            onMonthChange={onMonthChange}
            errorCount={errorCount}
          />
          <button
            onClick={handleRefresh}
            disabled={isValidating || isRefreshing}
            className={`p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
              isValidating || isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Validierung aktualisieren"
          >
            <RefreshCw
              size={18}
              className={isValidating || isRefreshing ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Validation Summary */}
      {validationResult && (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle size={24} className="text-green-600" />
                ) : (
                  <AlertTriangle size={24} className="text-red-600" />
                )}
                <span className="font-semibold text-lg">
                  {validationResult.isValid
                    ? 'Alle Anforderungen erfüllt'
                    : 'Probleme gefunden'}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-red-600 font-medium">
                  {validationResult.statistics.hardViolationCount} Fehler
                </span>
                <span className="text-yellow-600 font-medium">
                  {validationResult.statistics.softViolationCount} Warnungen
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Validiert in {validationResult.duration.toFixed(1)}ms
            </div>
          </div>
        </div>
      )}

      {/* Sub-navigation for control views */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setControlView('dates')}
          className={`px-4 py-2 font-semibold transition-colors ${
            controlView === 'dates'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Nach Datum
        </button>
        <button
          onClick={() => setControlView('shifts')}
          className={`px-4 py-2 font-semibold transition-colors ${
            controlView === 'shifts'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Nach Schicht
        </button>
        <button
          onClick={() => setControlView('staff')}
          className={`px-4 py-2 font-semibold transition-colors ${
            controlView === 'staff'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Nach Mitarbeiter
        </button>
      </div>

      {/* Loading indicator */}
      {isValidating && !validationResult && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw size={24} className="animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Validierung läuft...</span>
        </div>
      )}

      {/* Dates view */}
      {controlView === 'dates' && validationResult && (
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
              {(() => {
                const [year, month] = parseYearMonth(selectedMonth);
                const daysInCurrentMonth = getDaysInMonth(year, month);
                return Array.from({ length: daysInCurrentMonth }, (_, i) => {
                  const day = i + 1;
                  const date = new Date(year, month, day);
                  const weekday = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()];
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

                  const dateViolations = getDateViolations(dateStr);
                  const hasHardViolations = dateViolations.hard.length > 0;
                  const hasSoftViolations = dateViolations.soft.length > 0;
                  const fulfilled = !hasHardViolations;

                  const shiftsCount = getShiftCount(dateStr);
                  const formattedDate = formatDate(year, month, day);

                  // Collect unique violation messages
                  const violationMessages = [
                    ...dateViolations.hard.map(v => v.message),
                    ...dateViolations.soft.map(v => `⚠️ ${v.message}`),
                  ];
                  const uniqueMessages = [...new Set(violationMessages)];

                  const details = fulfilled
                    ? hasSoftViolations
                      ? uniqueMessages.join('; ')
                      : 'Alle Schichten korrekt besetzt'
                    : uniqueMessages.join('; ') || 'Validierungsfehler';

                  return (
                    <tr
                      key={day}
                      className={`border-t hover:bg-gray-50 ${isWeekend ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium">{formattedDate}</td>
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
                      <td
                        className={`px-4 py-3 text-sm ${
                          fulfilled
                            ? hasSoftViolations
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                            : 'text-red-600 font-medium'
                        }`}
                      >
                        {details}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Shifts view */}
      {controlView === 'shifts' && validationResult && (
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
                const shiftId = shift.id || shift.name;
                const shiftViolations = violationsByShift.get(shiftId) || [];
                const hardViolations = shiftViolations.filter(v => v.ruleType === 'hard');
                const softViolations = shiftViolations.filter(v => v.ruleType === 'soft');
                const fulfilled = hardViolations.length === 0;

                const violationMessages = [
                  ...hardViolations.map(v => v.message),
                  ...softViolations.map(v => `⚠️ ${v.message}`),
                ];
                const uniqueMessages = [...new Set(violationMessages)];

                const details = fulfilled
                  ? softViolations.length > 0
                    ? uniqueMessages.join('; ')
                    : 'Alle Tage korrekt besetzt'
                  : uniqueMessages.join('; ') || 'Validierungsfehler';

                return (
                  <tr key={shift.name} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{shift.name}</td>
                    <td className="px-4 py-3 text-gray-600">{shift.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {shift.requirements?.join(', ') || 'Keine speziellen'}
                    </td>
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
                    <td
                      className={`px-4 py-3 text-sm ${
                        fulfilled
                          ? softViolations.length > 0
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                          : 'text-red-600 font-medium'
                      }`}
                    >
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
      {controlView === 'staff' && validationResult && (
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
                const employeeId = emp.id || emp.initials;
                const empViolations = getEmployeeViolations(employeeId);
                const hasHardViolations = empViolations.hard.length > 0;
                const hasSoftViolations = empViolations.soft.length > 0;
                const fulfilled = !hasHardViolations;

                const violationMessages = [
                  ...empViolations.hard.map(v => {
                    // Add date context to violation messages
                    const dates = v.affectedEntities.dates.map(formatISODate).join(', ');
                    return dates ? `${v.message} (${dates})` : v.message;
                  }),
                  ...empViolations.soft.map(v => {
                    const dates = v.affectedEntities.dates.map(formatISODate).join(', ');
                    return dates ? `⚠️ ${v.message} (${dates})` : `⚠️ ${v.message}`;
                  }),
                ];
                const uniqueMessages = [...new Set(violationMessages)];

                const details = fulfilled
                  ? hasSoftViolations
                    ? uniqueMessages.join('; ')
                    : 'Alle Regeln eingehalten'
                  : uniqueMessages.join('; ') || 'Validierungsfehler';

                return (
                  <tr key={emp.initials} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.contract}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {emp.qualifications.slice(0, 2).join(', ')}
                      {emp.qualifications.length > 2 ? '...' : ''}
                    </td>
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
                    <td
                      className={`px-4 py-3 text-sm ${
                        fulfilled
                          ? hasSoftViolations
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                          : 'text-red-600 font-medium'
                      }`}
                    >
                      {details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* No data message */}
      {!validationResult && !isValidating && (
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-8 text-center">
          <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            Keine Planungsdaten für {selectedMonth} vorhanden.
          </p>
        </div>
      )}
    </div>
  );
};

export default KontrolleView;
