import React from 'react';

export const EmergencyCoverageDialog = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <span className="text-2xl">🚨</span>
          <h2 className="text-xl font-bold text-gray-900">Emergency Coverage</h2>
        </div>

        {/* Shift Info */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-900">
            <span className="font-semibold">Shift:</span> {data.shift}, {data.date}
          </p>
          <p className="text-gray-900">
            <span className="font-semibold">Ausgefallen:</span> {data.employee} ({data.reason})
          </p>
        </div>

        {/* Suggested Replacements */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Vorgeschlagene Ersatzpersonen:</h3>

          {/* Replacement 1 - Best match */}
          <div className="border border-green-300 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span className="font-bold text-gray-900">1. Dr. Müller</span>
                <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded font-semibold">
                  Score: 95%
                </span>
              </div>
            </div>
            <div className="space-y-1 ml-6 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <span>✅</span>
                <span>Qualifiziert (Oberarzt, Notfall-Zert.)</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <span>✅</span>
                <span>Verfügbar (nicht eingeplant)</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <span>✅</span>
                <span>Unter Zielstunden (38h/40h diese Woche)</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <span>✅</span>
                <span>Nur 1 Nachtdienst diesen Monat</span>
              </div>
            </div>
            <button className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold">
              Zuweisen
            </button>
          </div>

          {/* Replacement 2 - Good match */}
          <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="font-bold text-gray-900">2. Dr. Duffner</span>
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded font-semibold">
                  Score: 78%
                </span>
              </div>
            </div>
            <div className="space-y-1 ml-6 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <span>✅</span>
                <span>Qualifiziert</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <span>✅</span>
                <span>Verfügbar</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-700">
                <span>⚠️</span>
                <span>Bereits 4 aufeinanderfolgende Tage</span>
              </div>
            </div>
            <button className="mt-3 w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors font-semibold">
              Zuweisen
            </button>
          </div>

          {/* Replacement 3 - Poor match */}
          <div className="border border-red-300 bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">❌</span>
                <span className="font-bold text-gray-900">3. Dr. Schmidt</span>
                <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded font-semibold">
                  Score: 65%
                </span>
              </div>
            </div>
            <div className="space-y-1 ml-6 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <span>✅</span>
                <span>Qualifiziert</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-700">
                <span>⚠️</span>
                <span>Arbeitet bereits Spätdienst an diesem Tag</span>
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <span>❌</span>
                <span>Über Zielstunden (44h/40h)</span>
              </div>
            </div>
            <button className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold">
              Zuweisen (Override)
            </button>
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
        </div>
      </div>
    </div>
  );
};

export default EmergencyCoverageDialog;
