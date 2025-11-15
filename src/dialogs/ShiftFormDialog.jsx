import React from 'react';
import { X } from 'lucide-react';

export const ShiftFormDialog = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Neue Schicht</h3>
            <button onClick={onClose}>
              <X className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Schichtname</label>
              <input
                type="text"
                placeholder="z.B. OA"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Station</label>
              <select className="w-full border rounded px-3 py-2">
                <option>Ambulanzen</option>
                <option>Konsiliardienst</option>
                <option>ABS</option>
                <option>Station v. Frer.</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Startzeit</label>
              <input
                type="time"
                defaultValue="08:00"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Endzeit</label>
              <input
                type="time"
                defaultValue="17:00"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold mb-2">Anforderungen</label>
            <div className="space-y-2">
              {['Oberarzt', 'Facharzt', 'Notfallzertifizierung', 'ABS-Zertifizierung'].map(
                (r) => (
                  <label key={r} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span>{r}</span>
                  </label>
                )
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Abbrechen
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftFormDialog;
