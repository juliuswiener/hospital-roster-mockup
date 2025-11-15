import React from 'react';
import { X, Plus } from 'lucide-react';

export const EmployeeFormDialog = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Mitarbeiter bearbeiten</h3>
          <button onClick={onClose}>
            <X className="text-gray-400 hover:text-gray-600" size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">Name:</label>
            <input
              type="text"
              defaultValue="Hornuss"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
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
                <input
                  type="number"
                  defaultValue="40"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">(Tarifvertrag: 40h)</p>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Vertragsbeginn:</label>
              <input
                type="date"
                defaultValue="2020-01-01"
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Qualifikationen */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Qualifikationen & Kompetenzen:</h4>
            <div className="space-y-2">
              {[
                'Facharzt Innere Medizin',
                'Notfallmedizin-Zertifizierung',
                'ABS-zertifiziert (Antibiotic Stewardship)',
                'Oberarzt-Berechtigung',
                'Chefarzt-Vertretung',
              ].map((q) => (
                <label key={q} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked={
                      q.includes('Facharzt') || q.includes('Notfall') || q.includes('ABS')
                    }
                    className="rounded"
                  />
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
              {['Ambulanzen', 'Konsiliardienst', 'ABS', 'Station v. Frer.', 'Forschung'].map(
                (s) => (
                  <label key={s} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={
                        s === 'Ambulanzen' || s === 'Konsiliardienst' || s === 'ABS'
                      }
                      className="rounded"
                    />
                    <span className="text-sm">{s}</span>
                  </label>
                )
              )}
            </div>
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
                  <label className="block text-sm font-medium mb-1">
                    Max. Wochenenden/Monat:
                  </label>
                  <input
                    type="number"
                    defaultValue="2"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Max. Nachtdienste/Monat:
                  </label>
                  <input
                    type="number"
                    defaultValue="4"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-center pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Abbrechen
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeFormDialog;
