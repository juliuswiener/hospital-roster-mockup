import React from 'react';
import { X, RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { getMonthStartDate, getMonthEndDate, getCurrentMonth, parseYearMonth, getDaysInMonth } from '../constants/calendar';

export const PlanGenerationDialog = ({
  isOpen,
  onClose,
  onGenerate,
  selectedMonth,
  fixedAssignments = [],
  // Backend health
  backendIsHealthy = null,
  // Optimization settings
  selectedOptimizationMode = 'optimal',
  onOptimizationModeChange,
  customTimeLimit = 10,
  onCustomTimeLimitChange,
  // Generation state
  isGenerating = false,
  generationProgress = 0,
  generationError = null,
  onResetError,
  onCancel,
}) => {
  if (!isOpen) return null;

  const monthToUse = selectedMonth || getCurrentMonth();
  const startDate = getMonthStartDate(monthToUse);
  const endDate = getMonthEndDate(monthToUse);

  // Calculate days and weeks info
  const [year, month] = parseYearMonth(monthToUse);
  const daysInMonth = getDaysInMonth(year, month);
  const weeksInMonth = Math.ceil(daysInMonth / 7);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Dienstplan generieren</h2>
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              backendIsHealthy === null
                ? 'bg-gray-100 text-gray-600'
                : backendIsHealthy
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {backendIsHealthy === null ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Prüfe Backend...</span>
                </>
              ) : backendIsHealthy ? (
                <>
                  <Wifi size={12} />
                  <span>OR-Tools Backend verfügbar</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} />
                  <span>Backend nicht erreichbar</span>
                </>
              )}
            </div>
          </div>
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
                  defaultValue={startDate}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Bis:</span>
                <input
                  type="date"
                  defaultValue={endDate}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <span className="text-sm text-gray-600">({daysInMonth} Tage, {weeksInMonth} Wochen)</span>
            </div>
          </div>

          {/* Fixierte Zuordnungen */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="block font-semibold text-gray-900 mb-2">Fixierte Zuordnungen:</label>
            {fixedAssignments.length > 0 ? (
              <>
                <p className="text-sm text-gray-700 mb-2">
                  🔒 {fixedAssignments.length} Schichten sind gesperrt und werden nicht verändert
                </p>
                <ul className="text-sm text-gray-700 space-y-1 ml-6">
                  {fixedAssignments.slice(0, 3).map((assignment, idx) => (
                    <li key={idx}>• {assignment}</li>
                  ))}
                  {fixedAssignments.length > 3 && (
                    <li>
                      • ...{' '}
                      <button className="text-blue-600 hover:underline">
                        ({fixedAssignments.length - 3} weitere anzeigen)
                      </button>
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <p className="text-sm text-gray-500">Keine gesperrten Schichten vorhanden</p>
            )}
          </div>

          {/* Optimierungsmodus */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">Optimierungsmodus:</label>
            <div className="space-y-2 ml-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="optimization"
                  checked={selectedOptimizationMode === 'quick'}
                  onChange={() => onOptimizationModeChange?.('quick')}
                  className="w-4 h-4"
                />
                <span className="text-gray-900">Schnell (30 Sekunden, gute Lösung)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="optimization"
                  checked={selectedOptimizationMode === 'optimal'}
                  onChange={() => onOptimizationModeChange?.('optimal')}
                  className="w-4 h-4"
                />
                <span className="text-gray-900">Optimal (3-5 Minuten, beste Lösung)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="optimization"
                  checked={selectedOptimizationMode === 'custom'}
                  onChange={() => onOptimizationModeChange?.('custom')}
                  className="w-4 h-4"
                />
                <span className="text-gray-900">Benutzerdefiniert (Zeit-Limit:</span>
                <input
                  type="number"
                  value={customTimeLimit}
                  onChange={(e) => onCustomTimeLimitChange?.(parseInt(e.target.value) || 10)}
                  min="1"
                  max="60"
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

        {/* Error Display */}
        {generationError && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle size={20} />
              <span className="font-semibold">Fehler bei der Generierung:</span>
            </div>
            <p className="mt-2 text-sm text-red-700">{generationError}</p>
            <button
              onClick={onResetError}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Fehler zurücksetzen
            </button>
          </div>
        )}

        {/* Generation Progress */}
        {isGenerating && (
          <div className="mx-6 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <RefreshCw size={20} className="animate-spin" />
              <span className="font-semibold">Generiere Dienstplan...</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-blue-700">
              {generationProgress < 30
                ? 'Initialisiere Solver...'
                : generationProgress < 50
                ? 'Erstelle Constraints...'
                : generationProgress < 90
                ? 'Optimiere Lösung...'
                : 'Finalisiere Plan...'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t">
          {isGenerating ? (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Abbrechen
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Schließen
              </button>
              <button
                onClick={onGenerate}
                disabled={!backendIsHealthy}
                className={`px-4 py-2 rounded transition-colors ${
                  backendIsHealthy
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Generieren
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanGenerationDialog;
