import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import {
  AVAILABLE_CODES,
  PARTIAL_AVAILABILITY_CODES,
  getAvailabilityMessage
} from '../constants/availability';
import { WEEKDAY_NAMES_SHORT, parseYearMonth, getDaysInMonth, getCurrentYear, getCurrentMonthIndex } from '../constants/calendar';
import { GRID_HEIGHT, COLUMN_WIDTH_NAME, COLUMN_WIDTH_DAY_PLANNING, GRID_ROW_HEIGHT, GRID_HEADER_HEIGHT } from '../constants/layout';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Use the Quartz theme (new Theming API)
const gridTheme = themeQuartz;

const ShiftCellRenderer = (props) => {
  const { value, data, colDef, context } = props;
  const day = colDef.field;
  const employeeInitials = data.initials;
  const employeeName = data.name || employeeInitials;

  // Check availability for this employee on this day
  const dayNum = parseInt(day, 10);
  const availabilityCode = context.availability?.[employeeInitials]?.[dayNum] ||
                           context.availability?.[employeeInitials]?.[day];

  // No entry or null means NOT available; only specific codes mean available
  const isUnavailable = !availabilityCode || !AVAILABLE_CODES.has(availabilityCode);
  const isPartiallyAvailable = availabilityCode && PARTIAL_AVAILABILITY_CODES.has(availabilityCode);

  if (!value || !value.shift) {
    return (
      <div
        className={`h-full flex items-center justify-center text-gray-300 border border-dashed rounded cursor-pointer hover:border-gray-400 ${
          isUnavailable ? 'bg-red-50 border-red-200' : 'border-gray-200'
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const shiftData = JSON.parse(e.dataTransfer.getData('application/json'));
          context.onShiftDrop(employeeInitials, day, shiftData);
        }}
        title={isUnavailable ? getAvailabilityMessage(employeeName, day, availabilityCode, false) : ''}
      >
        —
      </div>
    );
  }

  const shiftColors = context.shiftColors || {};
  const colorClass = shiftColors[value.shift] || 'bg-gray-600 border-gray-400 text-gray-50';

  // Extract all color parts from the color class for dark background shifts
  const bgColorMatch = colorClass.match(/bg-\S+/);
  const bgColor = bgColorMatch ? bgColorMatch[0] : 'bg-gray-600';
  const borderColorMatch = colorClass.match(/border-\S+/);
  const borderColor = borderColorMatch ? borderColorMatch[0] : 'border-gray-400';
  const textColorMatch = colorClass.match(/text-\S+/);
  const textColor = textColorMatch ? textColorMatch[0] : 'text-gray-50';

  // Check for availability violation
  const hasAvailabilityViolation = isUnavailable && value.shift;
  const hasPartialWarning = isPartiallyAvailable && value.shift;
  const hasViolation = value.violation || hasAvailabilityViolation;

  // Check if this shift should be dimmed based on hover
  const hoveredShift = context.hoveredShift;
  const shouldDim = hoveredShift && value.shift !== hoveredShift;

  return (
    <div
      className={`px-2 py-1 rounded border-2 text-xs font-semibold relative ${bgColor} ${borderColor} ${textColor} ${
        hasAvailabilityViolation ? '!border-red-600 ring-2 ring-red-400 !bg-red-100 !text-red-900' :
        hasPartialWarning ? '!border-yellow-500 ring-1 ring-yellow-300 !bg-yellow-100 !text-yellow-900' :
        value.violation ? '!border-red-500 ring-1 ring-red-300' : ''
      } ${shouldDim ? 'opacity-30' : 'opacity-100'} cursor-move`}
      style={{ transition: 'opacity 150ms' }}
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
          shift: value.shift,
          station: value.station,
          sourceEmployee: employeeInitials,
          sourceDay: day
        }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const shiftData = JSON.parse(e.dataTransfer.getData('application/json'));
        context.onShiftDrop(employeeInitials, day, shiftData);
      }}
      title={hasAvailabilityViolation ? getAvailabilityMessage(employeeName, day, availabilityCode, true) :
             hasPartialWarning ? getAvailabilityMessage(employeeName, day, availabilityCode, false) : ''}
    >
      {value.shift}
      {hasAvailabilityViolation && <span className="absolute -top-1 -right-1 text-red-600 text-xs">⚠️</span>}
      {hasPartialWarning && !hasAvailabilityViolation && <span className="absolute -top-1 -right-1 text-yellow-600 text-xs">⚠️</span>}
      {hasViolation && !hasAvailabilityViolation && <span className="absolute -top-1 -right-1 text-red-600 text-xs">🔴</span>}
      {value.locked && <span className="absolute -bottom-1 -right-1 text-gray-600 text-xs">🔒</span>}
    </div>
  );
};

const ShiftDropZone = ({ shifts, shiftColors, onShiftHover, hoveredShift }) => {
  return (
    <div className="bg-gray-50 p-3 rounded border mb-4">
      <h4 className="text-sm font-semibold mb-2">Schichten (zum Ziehen):</h4>
      <div className="flex flex-wrap gap-2">
        {shifts.map(shift => {
          const colorClass = shiftColors[shift.name] || 'bg-gray-600 border-gray-400 text-gray-50';
          // Extract all color parts for dark background shifts
          const bgColorMatch = colorClass.match(/bg-\S+/);
          const bgColor = bgColorMatch ? bgColorMatch[0] : 'bg-gray-600';
          const borderColorMatch = colorClass.match(/border-\S+/);
          const borderColor = borderColorMatch ? borderColorMatch[0] : 'border-gray-400';
          const textColorMatch = colorClass.match(/text-\S+/);
          const textColor = textColorMatch ? textColorMatch[0] : 'text-gray-50';

          return (
            <div
              key={shift.name}
              className={`px-3 py-1 rounded border-2 text-xs font-semibold cursor-move transition-opacity ${bgColor} ${borderColor} ${textColor} ${
                hoveredShift && hoveredShift !== shift.name ? 'opacity-30' : 'opacity-100'
              }`}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  shift: shift.name,
                  station: shift.station,
                  sourceEmployee: null,
                  sourceDay: null
                }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onMouseEnter={() => onShiftHover?.(shift.name)}
              onMouseLeave={() => onShiftHover?.(null)}
            >
              {shift.name}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PlanningGrid = ({
  employees,
  shifts,
  scheduleData,
  onScheduleChange,
  shiftColors,
  selectedMonth,
  availability = {}
}) => {
  const gridRef = useRef();
  const [hoveredShift, setHoveredShift] = useState(null);

  // Parse selected month to get year and month
  const [year, month] = useMemo(() => {
    if (selectedMonth) {
      return parseYearMonth(selectedMonth);
    }
    return [getCurrentYear(), getCurrentMonthIndex()]; // Default to current month
  }, [selectedMonth]);

  // Get number of days in the selected month
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(year, month);
  }, [year, month]);

  // Convert schedule data to AG Grid row format
  const rowData = useMemo(() => {
    return employees.map(emp => {
      const row = {
        name: emp.name,
        initials: emp.initials,
        contract: emp.contract
      };

      // Add each day's schedule
      const empSchedule = scheduleData[emp.initials] || {};
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = day.toString().padStart(2, '0');
        row[dayStr] = empSchedule[dayStr] || null;
      }

      return row;
    });
  }, [employees, scheduleData, daysInMonth]);

  // Handle shift drop
  const onShiftDrop = useCallback((targetEmployee, targetDay, shiftData) => {
    const updatedSchedule = { ...scheduleData };

    // Initialize target employee's schedule if needed
    if (!updatedSchedule[targetEmployee]) {
      updatedSchedule[targetEmployee] = {};
    }

    // If moving from another cell, remove from source
    if (shiftData.sourceEmployee && shiftData.sourceDay) {
      if (updatedSchedule[shiftData.sourceEmployee]) {
        delete updatedSchedule[shiftData.sourceEmployee][shiftData.sourceDay];
      }
    }

    // Assign to target
    updatedSchedule[targetEmployee][targetDay] = {
      shift: shiftData.shift,
      station: shiftData.station,
      violation: false,
      locked: false
    };

    onScheduleChange(updatedSchedule);
    console.log(`Assigned ${shiftData.shift} to ${targetEmployee} on day ${targetDay}`);
  }, [scheduleData, onScheduleChange]);

  // Column definitions
  const columnDefs = useMemo(() => {
    const cols = [
      {
        headerName: 'Mitarbeiter',
        field: 'name',
        pinned: 'left',
        width: COLUMN_WIDTH_NAME,
        cellStyle: { fontWeight: 'bold' }
      }
    ];

    // Add day columns for the selected month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const weekday = WEEKDAY_NAMES_SHORT[date.getDay()];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const dayStr = day.toString().padStart(2, '0');

      cols.push({
        headerName: `${dayStr}\n${weekday}`,
        field: dayStr,
        width: COLUMN_WIDTH_DAY_PLANNING,
        cellRenderer: ShiftCellRenderer,
        headerClass: isWeekend ? 'bg-blue-100' : '',
        cellClass: isWeekend ? 'bg-blue-50' : ''
      });
    }

    return cols;
  }, [daysInMonth, year, month]);

  const defaultColDef = useMemo(() => ({
    sortable: false,
    resizable: true,
    suppressMovable: true
  }), []);

  const gridContext = useMemo(() => ({
    onShiftDrop,
    shiftColors,
    availability,
    hoveredShift
  }), [onShiftDrop, shiftColors, availability, hoveredShift]);

  // Refresh cells when availability or hover state changes
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.refreshCells({ force: true });
    }
  }, [availability, hoveredShift]);

  return (
    <div className="space-y-4">
      <ShiftDropZone
        shifts={shifts}
        shiftColors={shiftColors}
        onShiftHover={setHoveredShift}
        hoveredShift={hoveredShift}
      />

      <div style={{ height: GRID_HEIGHT, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          context={gridContext}
          rowHeight={GRID_ROW_HEIGHT}
          headerHeight={GRID_HEADER_HEIGHT}
          animateRows={true}
          suppressCellFocus={true}
          theme={gridTheme}
        />
      </div>
    </div>
  );
};

export default PlanningGrid;
