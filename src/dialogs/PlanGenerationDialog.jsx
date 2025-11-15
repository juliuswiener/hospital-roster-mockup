import React from 'react';
import { X } from 'lucide-react';

export const PlanGenerationDialog = ({ isOpen, onClose, onGenerate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Dienstplan generieren</h2>
          <button
            onClick={onClose}
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
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
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
              <li>
                • ...{' '}
                <button className="text-blue-600 hover:underline">(weitere anzeigen)</button>
              </li>
            </ul>
          </div>

          {/* Optimierungsmodus */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">Optimierungsmodus:</label>
            <div className="space-y-2 ml-3">
              <label className="flex items-center gap-2">
                <input type="radio" name="optimization" className="w-4 h-4" />
                <span className="text-gray-900">Schnell (30 Sekunden, gute Lösung)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="optimization" defaultChecked className="w-4 h-4" />
                <span className="text-gray-900">Optimal (3-5 Minuten, beste Lösung)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="optimization" className="w-4 h-4" />
                <span className="text-gray-900">Benutzerdefiniert (Zeit-Limit:</span>
                <input
                  type="number"
                  defaultValue="10"
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

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onGenerate}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Generieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanGenerationDialog;
