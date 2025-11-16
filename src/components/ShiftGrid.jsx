import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import {
  AVAILABLE_CODES,
  PARTIAL_AVAILABILITY_CODES,
  getAvailabilityMessage,
} from '../constants/availability';
import { WEEKDAY_NAMES_SHORT, parseYearMonth, getDaysInMonth, getCurrentYear, getCurrentMonthIndex } from '../constants/calendar';
import { EmployeeDropZone } from './DragDropZone';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Use the Quartz theme (new Theming API)
const gridTheme = themeQuartz;

const EmployeeCellRenderer = (props) => {
  const { value, data, colDef, context } = props;
  const shiftName = colDef.field;
  const day = data.day;

  if (!value || value.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center text-gray-300 border border-dashed border-gray-200 rounded cursor-pointer hover:border-gray-400"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const empData = JSON.parse(e.dataTransfer.getData('application/json'));
          context.onEmployeeDrop(day, shiftName, empData);
        }}
      >
        —
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-1 p-1"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const empData = JSON.parse(e.dataTransfer.getData('application/json'));
        context.onEmployeeDrop(day, shiftName, empData);
      }}
    >
      {value.map((emp) => {
        const colorClass = context.employeeColors[emp.initials] || 'bg-gray-100 border-gray-400 text-gray-900';

        // Check availability for this employee on this day
        const dayNum = parseInt(day, 10);
        const availabilityCode = context.availability?.[emp.initials]?.[dayNum] ||
                                 context.availability?.[emp.initials]?.[day];
        // No entry or null means NOT available; only specific codes mean available
        const hasAvailabilityViolation = !availabilityCode || !AVAILABLE_CODES.has(availabilityCode);
        const hasPartialWarning = availabilityCode && PARTIAL_AVAILABILITY_CODES.has(availabilityCode);

        // Check if this employee should be dimmed based on hover
        const hoveredEmployee = context.hoveredEmployee;
        const shouldDim = hoveredEmployee && emp.initials !== hoveredEmployee;

        // Extract border color from the color class (e.g., "bg-red-100 border-red-400 text-red-900" -> "border-red-400")
        const borderColorMatch = colorClass.match(/border-\S+/);
        const borderColor = borderColorMatch ? borderColorMatch[0] : 'border-gray-400';
        const textColorMatch = colorClass.match(/text-\S+/);
        const textColor = textColorMatch ? textColorMatch[0] : 'text-gray-900';

        return (
          <div
            key={emp.initials}
            className={`px-1.5 py-0.5 rounded border-2 text-xs font-semibold cursor-move relative transition-opacity bg-white ${borderColor} ${textColor} ${
              hasAvailabilityViolation ? '!border-red-600 ring-2 ring-red-400 !bg-red-100 !text-red-900' :
              hasPartialWarning ? '!border-yellow-500 ring-1 ring-yellow-300 !bg-yellow-100 !text-yellow-900' :
              emp.violation ? '!border-red-500 ring-1 ring-red-300' : ''
            } ${shouldDim ? 'opacity-30' : 'opacity-100'}`}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({
                initials: emp.initials,
                sourceDay: day,
                sourceShift: shiftName
              }));
              e.dataTransfer.effectAllowed = 'move';
            }}
            title={hasAvailabilityViolation ? getAvailabilityMessage(emp.initials, day, availabilityCode, true) :
                   hasPartialWarning ? getAvailabilityMessage(emp.initials, day, availabilityCode, false) :
                   emp.violation ? `Regelverletzung` : ''}
          >
            {emp.initials}
            {hasAvailabilityViolation && <span className="ml-1 text-red-600">⚠️</span>}
            {hasPartialWarning && !hasAvailabilityViolation && <span className="ml-1 text-yellow-600">⚠️</span>}
            {emp.violation && !hasAvailabilityViolation && <span className="ml-1 text-red-600">⚠️</span>}
          </div>
        );
      })}
    </div>
  );
};

const ShiftGrid = ({
  employees,
  shifts,
  scheduleData,
  onScheduleChange,
  employeeColors,
  shiftColors,
  selectedMonth,
  availability = {}
}) => {
  const gridRef = useRef();
  const [hoveredEmployee, setHoveredEmployee] = useState(null);

  // Parse selected month to get year and month
  const [year, month] = useMemo(() => {
    if (selectedMonth) {
      return parseYearMonth(selectedMonth);
    }
    return [getCurrentYear(), getCurrentMonthIndex()];
  }, [selectedMonth]);

  // Get number of days in the selected month
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(year, month);
  }, [year, month]);

  // Convert schedule data to AG Grid row format (days as rows, shifts as columns)
  const rowData = useMemo(() => {
    const rows = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      const date = new Date(year, month, day);
      const weekday = WEEKDAY_NAMES_SHORT[date.getDay()];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const monthStr = (month + 1).toString().padStart(2, '0');

      const row = {
        day: dayStr,
        dayDisplay: `${dayStr}.${monthStr} ${weekday}`,
        isWeekend: isWeekend
      };

      // For each shift, find which employees are assigned
      shifts.forEach(shift => {
        const assignedEmps = [];
        Object.entries(scheduleData).forEach(([initials, empSchedule]) => {
          if (empSchedule[dayStr]?.shift === shift.name) {
            assignedEmps.push({
              initials,
              violation: empSchedule[dayStr]?.violation || false,
              locked: empSchedule[dayStr]?.locked || false
            });
          }
        });
        row[shift.name] = assignedEmps;
      });

      rows.push(row);
    }

    return rows;
  }, [shifts, scheduleData, daysInMonth, year, month]);

  // Handle employee drop on a shift/day cell
  const onEmployeeDrop = useCallback((targetDay, targetShift, empData) => {
    const updatedSchedule = { ...scheduleData };

    // Initialize target employee's schedule if needed
    if (!updatedSchedule[empData.initials]) {
      updatedSchedule[empData.initials] = {};
    }

    // If moving from another cell, remove from source
    if (empData.sourceDay && empData.sourceShift) {
      if (updatedSchedule[empData.initials]?.[empData.sourceDay]) {
        delete updatedSchedule[empData.initials][empData.sourceDay];
      }
    }

    // Get the shift details
    const shift = shifts.find(s => s.name === targetShift);

    // Assign to target
    updatedSchedule[empData.initials][targetDay] = {
      shift: targetShift,
      station: shift?.station || '',
      violation: false,
      locked: false
    };

    onScheduleChange(updatedSchedule);
    console.log(`Assigned ${empData.initials} to ${targetShift} on day ${targetDay}`);
  }, [scheduleData, onScheduleChange, shifts]);

  // Column definitions
  const columnDefs = useMemo(() => {
    const cols = [
      {
        headerName: 'Datum',
        field: 'dayDisplay',
        pinned: 'left',
        width: 100,
        cellStyle: (params) => ({
          fontWeight: 'bold',
          backgroundColor: params.data.isWeekend ? '#dbeafe' : 'inherit'
        })
      }
    ];

    // Add shift columns
    shifts.slice(0, 15).forEach(shift => {
      cols.push({
        headerName: shift.name,
        field: shift.name,
        width: 120,
        cellRenderer: EmployeeCellRenderer,
        valueFormatter: () => '',  // Suppress AG Grid warning #48 about object data type
        headerClass: 'text-xs',
        autoHeight: true
      });
    });

    return cols;
  }, [shifts]);

  const defaultColDef = useMemo(() => ({
    sortable: false,
    resizable: true,
    suppressMovable: true,
    wrapText: true
  }), []);

  const gridContext = useMemo(() => ({
    onEmployeeDrop,
    employeeColors,
    shiftColors,
    availability,
    hoveredEmployee
  }), [onEmployeeDrop, employeeColors, shiftColors, availability, hoveredEmployee]);

  // Refresh cells when availability or hover state changes
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.refreshCells({ force: true });
    }
  }, [availability, hoveredEmployee]);

  return (
    <div className="space-y-4">
      <EmployeeDropZone
        employees={employees}
        employeeColors={employeeColors}
        onEmployeeHover={setHoveredEmployee}
        hoveredEmployee={hoveredEmployee}
      />

      <div style={{ height: '500px', width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          context={gridContext}
          rowHeight={50}
          headerHeight={40}
          animateRows={true}
          suppressCellFocus={true}
          theme={gridTheme}
          getRowStyle={(params) => {
            if (params.data.isWeekend) {
              return { backgroundColor: '#eff6ff' };
            }
            return null;
          }}
        />
      </div>
    </div>
  );
};

export default ShiftGrid;
