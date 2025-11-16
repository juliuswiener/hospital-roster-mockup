import React from 'react';

/**
 * Generic drag and drop zone component for draggable items
 */
export const DragDropZone = ({
  title,
  items,
  renderItem,
  onDragStart,
  getItemKey,
  getItemClass = () => '',
  className = '',
}) => {
  return (
    <div className={`bg-gray-50 p-3 rounded border mb-4 ${className}`}>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <div
            key={getItemKey(item)}
            className={`px-3 py-1 rounded border text-xs font-semibold cursor-move ${getItemClass(item)}`}
            draggable={true}
            onDragStart={(e) => onDragStart(e, item)}
            title={item.label || item.name || ''}
          >
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Employee drop zone - specialized version for employees with hover support
 */
export const EmployeeDropZone = ({ employees, employeeColors, onEmployeeHover, hoveredEmployee }) => {
  const handleDragStart = (e, emp) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      initials: emp.initials,
      sourceDay: null,
      sourceShift: null
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="bg-gray-50 p-3 rounded border mb-4">
      <h4 className="text-sm font-semibold mb-2">Mitarbeiter (zum Ziehen):</h4>
      <div className="flex flex-wrap gap-2">
        {employees.map(emp => {
          const colorClass = employeeColors[emp.initials] || 'bg-gray-100 border-gray-400 text-gray-900';
          const borderColorMatch = colorClass.match(/border-\S+/);
          const borderColor = borderColorMatch ? borderColorMatch[0] : 'border-gray-400';
          const textColorMatch = colorClass.match(/text-\S+/);
          const textColor = textColorMatch ? textColorMatch[0] : 'text-gray-900';

          return (
            <div
              key={emp.initials}
              className={`px-3 py-1 rounded border-2 text-xs font-semibold cursor-move transition-opacity bg-white ${borderColor} ${textColor} ${
                hoveredEmployee && hoveredEmployee !== emp.initials ? 'opacity-30' : 'opacity-100'
              }`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, emp)}
              onMouseEnter={() => onEmployeeHover?.(emp.initials)}
              onMouseLeave={() => onEmployeeHover?.(null)}
              title={emp.name || emp.initials}
            >
              {emp.initials}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Availability drop zone - specialized version for availability types
 */
export const AvailabilityDropZone = ({ availabilityTypes }) => {
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      code: type.code,
      sourceEmployee: null,
      sourceDay: null
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <DragDropZone
      title="Verfügbarkeitstypen (zum Ziehen):"
      items={availabilityTypes}
      renderItem={(type) => type.code}
      onDragStart={handleDragStart}
      getItemKey={(type) => type.code}
      getItemClass={(type) => type.color}
    />
  );
};

export default DragDropZone;
