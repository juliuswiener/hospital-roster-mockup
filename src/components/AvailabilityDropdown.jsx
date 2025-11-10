import React, { useRef, useEffect } from 'react';

const AvailabilityDropdown = ({ menu, availabilityTypes, onSelect, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!menu) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto"
        style={{ left: menu.x, top: menu.y }}
      >
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
          onClick={() => onSelect(null)}
        >
          <span className="font-medium">Leer</span>
        </div>
        {availabilityTypes.map((type) => (
          <div
            key={type.code}
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => onSelect(type.code)}
          >
            <div className={`inline-block px-2 py-1 rounded text-xs font-medium border ${type.color}`}>
              {type.code}
            </div>
            <span className="ml-2 text-sm text-gray-700">{type.label}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export default AvailabilityDropdown;
