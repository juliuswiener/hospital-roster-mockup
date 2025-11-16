import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { useClickOutside } from '../hooks/useClickOutside';
import { AVAILABLE_CODES } from '../constants/availability';
import { WEEKDAY_NAMES_SHORT, parseYearMonth, getDaysInMonth, getCurrentYear, getCurrentMonthIndex } from '../constants/calendar';
import { GRID_HEIGHT, COLUMN_WIDTH_NAME, COLUMN_WIDTH_DAY, GRID_ROW_HEIGHT, GRID_HEADER_HEIGHT } from '../constants/layout';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Use the Quartz theme (new Theming API)
const gridTheme = themeQuartz;

const AvailabilityDropZone = ({ availabilityTypes }) => {
  return (
    <div className="bg-gray-50 p-3 rounded border mb-4">
      <h4 className="text-sm font-semibold mb-2">Verfügbarkeitstypen (zum Ziehen):</h4>
      <div className="flex flex-wrap gap-2">
        {availabilityTypes.map(type => (
          <div
            key={type.code}
            className={`px-3 py-1 rounded border text-xs font-semibold cursor-move ${type.color}`}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({
                code: type.code,
                sourceEmployee: null,
                sourceDay: null
              }));
              e.dataTransfer.effectAllowed = 'copy';
            }}
            title={type.label}
          >
            {type.code}
          </div>
        ))}
      </div>
    </div>
  );
};

const AvailabilityCellRenderer = (props) => {
  const { value, data, colDef, context } = props;
  const day = colDef.field;
  const employeeInitials = data.initials;

  // Get color for the availability type
  const availabilityType = context.availabilityTypes?.find(t => t.code === value);
  const isAvailable = value && AVAILABLE_CODES.has(value);

  if (!value) {
    return (
      <div
        className="h-full flex items-center justify-center text-gray-300 border border-dashed rounded cursor-pointer hover:border-gray-400 border-gray-200"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const availabilityData = JSON.parse(e.dataTransfer.getData('application/json'));
          context.onAvailabilityDrop(employeeInitials, day, availabilityData);
        }}
        onClick={(e) => {
          e.stopPropagation();
          context.onCellClick(employeeInitials, day, e);
        }}
      >
        —
      </div>
    );
  }

  const colorClass = availabilityType?.color || 'bg-gray-100 text-gray-800 border-gray-300';

  return (
    <div
      className={`px-2 py-1 rounded border text-xs font-semibold cursor-move ${colorClass}`}
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
          code: value,
          sourceEmployee: employeeInitials,
          sourceDay: day
        }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const availabilityData = JSON.parse(e.dataTransfer.getData('application/json'));
        context.onAvailabilityDrop(employeeInitials, day, availabilityData);
      }}
      onClick={(e) => {
        e.stopPropagation();
        context.onCellClick(employeeInitials, day, e);
      }}
      title={availabilityType?.label || value}
    >
      {value}
      {isAvailable && <span className="ml-1 text-green-600">✓</span>}
    </div>
  );
};

const AvailabilityGrid = ({
  employees,
  availability,
  onAvailabilityChange,
  availabilityTypes,
  selectedMonth
}) => {
  const gridRef = useRef();
  const [menuState, setMenuState] = React.useState(null);

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

  // Convert availability data to AG Grid row format
  const rowData = useMemo(() => {
    return employees.map(emp => {
      const row = {
        name: emp.name,
        initials: emp.initials,
        contract: emp.contract
      };

      // Add each day's availability
      const empAvailability = availability[emp.initials] || {};
      for (let day = 1; day <= daysInMonth; day++) {
        row[day.toString()] = empAvailability[day] || null;
      }

      return row;
    });
  }, [employees, availability, daysInMonth]);

  // Handle availability drop
  const onAvailabilityDrop = useCallback((targetEmployee, targetDay, availabilityData) => {
    const updatedAvailability = { ...availability };

    // Initialize target employee's availability if needed
    if (!updatedAvailability[targetEmployee]) {
      updatedAvailability[targetEmployee] = {};
    }

    // If moving from another cell, remove from source
    if (availabilityData.sourceEmployee && availabilityData.sourceDay) {
      if (updatedAvailability[availabilityData.sourceEmployee]) {
        delete updatedAvailability[availabilityData.sourceEmployee][availabilityData.sourceDay];
      }
    }

    // Assign to target
    updatedAvailability[targetEmployee][targetDay] = availabilityData.code;

    onAvailabilityChange(updatedAvailability);
    console.log(`Assigned availability ${availabilityData.code} to ${targetEmployee} on day ${targetDay}`);
  }, [availability, onAvailabilityChange]);

  // Handle cell click to show menu
  const onCellClick = useCallback((employee, day, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuState({
      employee,
      day,
      x: rect.left,
      y: rect.bottom
    });
  }, []);

  // Close menu when clicking outside
  useClickOutside(menuState, () => setMenuState(null));

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

      cols.push({
        headerName: `${day.toString().padStart(2, '0')}\n${weekday}`,
        field: day.toString(),
        width: COLUMN_WIDTH_DAY,
        cellRenderer: AvailabilityCellRenderer,
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
    onAvailabilityDrop,
    onCellClick,
    availabilityTypes
  }), [onAvailabilityDrop, onCellClick, availabilityTypes]);

  // Calculate summary row (count of available employees per day)
  const summaryData = useMemo(() => {
    const summary = { name: 'Besetzung', initials: '_summary_' };

    for (let day = 1; day <= daysInMonth; day++) {
      const count = employees.filter(emp => {
        const status = availability[emp.initials]?.[day];
        return status && AVAILABLE_CODES.has(status);
      }).length;
      summary[day.toString()] = count;
    }

    return summary;
  }, [employees, availability, daysInMonth]);

  // Handle menu selection
  const handleMenuSelect = useCallback((code) => {
    if (!menuState) return;

    const updatedAvailability = { ...availability };
    if (!updatedAvailability[menuState.employee]) {
      updatedAvailability[menuState.employee] = {};
    }

    if (code === null) {
      delete updatedAvailability[menuState.employee][menuState.day];
    } else {
      updatedAvailability[menuState.employee][menuState.day] = code;
    }

    onAvailabilityChange(updatedAvailability);
    setMenuState(null);
  }, [menuState, availability, onAvailabilityChange]);

  return (
    <div className="space-y-4">
      <AvailabilityDropZone availabilityTypes={availabilityTypes} />

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

      {/* Summary row */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="font-semibold text-sm whitespace-nowrap">Verfügbare Mitarbeiter:</span>
          <div className="flex gap-2">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const count = summaryData[day.toString()];
              const isLow = count < 3;
              return (
                <div
                  key={day}
                  className={`text-center min-w-[40px] px-1 py-0.5 rounded text-xs font-semibold ${
                    isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  <div className="text-[10px] text-gray-500">{day}</div>
                  <div>{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {menuState && (
        <div
          className="fixed bg-white border-2 border-gray-300 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto"
          style={{
            left: `${menuState.x}px`,
            top: `${menuState.y}px`,
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
            onClick={() => handleMenuSelect(null)}
          >
            <span className="text-red-600">✕</span>
            <span className="text-gray-600">Löschen</span>
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          {/* All availability options */}
          {availabilityTypes.map(type => (
            <button
              key={type.code}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={() => handleMenuSelect(type.code)}
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
          <strong>Hinweis:</strong> Ziehen Sie Verfügbarkeitstypen aus der Leiste oben in die Tabelle.
          Sie können auch bestehende Einträge per Drag & Drop verschieben oder auf eine Zelle klicken für weitere Optionen.
        </p>
      </div>
    </div>
  );
};

export default AvailabilityGrid;
