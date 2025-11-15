import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ConstraintViolationDialog = ({ violation, onClose }) => {
  if (!violation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <AlertCircle className="text-orange-500" size={28} />
          <h2 className="text-xl font-bold text-gray-900">
            ⚠️ CONSTRAINT-VERLETZUNG ERKANNT
          </h2>
        </div>

        {/* Violation Details */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-lg text-gray-900">
              {violation.employee || 'Hornuss'} - {violation.date || 'Donnerstag 08.05.2025'} -{' '}
              {violation.shift || 'Nachtdienst'}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
              <span>🔴</span>
              PROBLEM:
            </h3>
            <p className="text-gray-900 ml-6">
              {violation.problem || 'Verletzt Arbeitszeitgesetz: 11h Ruhezeit'}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Details:</h4>
            <ul className="space-y-1 ml-6 text-sm text-gray-700">
              <li>• Vorherige Schicht: Mi 07.05, Spätdienst (15-23h)</li>
              <li>• Nächste Schicht: Do 08.05, Nachtdienst (23-07h)</li>
              <li>• Ruhezeit: Nur 0h (erforderlich: 11h)</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span>💡</span>
              VORSCHLÄGE:
            </h3>
            <div className="space-y-2 ml-6">
              <button className="text-left w-full px-3 py-2 bg-white rounded hover:bg-blue-100 transition-colors border border-blue-200">
                <span className="font-medium">1.</span> Verschiebe Nachtdienst auf Fr 09.05
              </button>
              <button className="text-left w-full px-3 py-2 bg-white rounded hover:bg-blue-100 transition-colors border border-blue-200">
                <span className="font-medium">2.</span> Tausche mit Duffner (verfügbar, qualifiziert)
              </button>
              <button className="text-left w-full px-3 py-2 bg-white rounded hover:bg-blue-100 transition-colors border border-blue-200">
                <span className="font-medium">3.</span> Entferne Spätdienst am Mi 07.05
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>⚙️</span>
              ODER MANUELL ÜBERSCHREIBEN:
            </h3>
            <div className="ml-6 space-y-3">
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm text-gray-900">
                  Ich akzeptiere diese Regelüberschreitung
                </span>
              </label>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Grund:</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Notfall, Personalmangel..."
                />
                <p className="text-xs text-gray-500 mt-1">(Wird im Audit-Log gespeichert)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Vorschlag anwenden
          </button>
          <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors">
            Überschreiben
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConstraintViolationDialog;
