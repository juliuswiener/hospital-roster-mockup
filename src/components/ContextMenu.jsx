import React from 'react';
import { UserPlus, CalendarDays, Search } from 'lucide-react';

const ContextMenu = ({
  contextMenu,
  showEmployeeSubmenu,
  setShowEmployeeSubmenu,
  showShiftSubmenu,
  setShowShiftSubmenu,
  employees,
  shifts,
  handleEmployeeChange,
  handleShiftChange,
  handleEmergencyCoverage,
  closeContextMenu
}) => {
  if (!contextMenu) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={closeContextMenu}
      />
      <div
        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-48"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 relative"
          onMouseEnter={() => { setShowEmployeeSubmenu(true); setShowShiftSubmenu(false); }}
          onMouseLeave={() => setShowEmployeeSubmenu(false)}
        >
          <UserPlus size={16} />
          <span>Mitarbeiter ändern</span>
          {showEmployeeSubmenu && (
            <div className="absolute left-full top-0 -ml-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-96 overflow-y-auto z-50 min-w-64">
              {employees.map((emp) => (
                <div
                  key={emp.name}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleEmployeeChange(emp)}
                >
                  <div className="font-medium">{emp.name}</div>
                  <div className="text-xs text-gray-500">{emp.contract}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 relative"
          onMouseEnter={() => { setShowShiftSubmenu(true); setShowEmployeeSubmenu(false); }}
          onMouseLeave={() => setShowShiftSubmenu(false)}
        >
          <CalendarDays size={16} />
          <span>Schicht ändern</span>
          {showShiftSubmenu && (
            <div className="absolute left-full top-0 -ml-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-96 overflow-y-auto z-50 min-w-64">
              {shifts.map((shift) => (
                <div
                  key={shift.name}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleShiftChange(shift)}
                >
                  <div className="font-medium">{shift.name}</div>
                  <div className="text-xs text-gray-500">{shift.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 mt-1 pt-1">
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            onClick={handleEmergencyCoverage}
          >
            <Search size={16} className="text-blue-600" />
            <span>Ersatz finden</span>
          </div>
        </div>

        {contextMenu.hasViolation && (
          <div className="border-t border-gray-200 mt-1 pt-1">
            <div className="px-4 py-2 text-red-600 text-sm">
              Diese Zuweisung verletzt Regeln
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ContextMenu;
