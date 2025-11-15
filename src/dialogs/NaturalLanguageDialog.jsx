import React from 'react';
import { X, Check, Edit2, Trash2, CheckCircle } from 'lucide-react';

export const NaturalLanguageDialog = ({
  isOpen,
  onClose,
  nlText,
  setNlText,
  showNlResults,
  setShowNlResults,
  parsedRules,
  onAnalyze,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Regel mit Natural Language hinzufügen</h3>
            <button
              onClick={() => {
                onClose();
                setShowNlResults(false);
                setNlText('');
              }}
            >
              <X className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {!showNlResults ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Regel in natürlicher Sprache eingeben
                </label>
                <textarea
                  value={nlText}
                  onChange={(e) => setNlText(e.target.value)}
                  placeholder="z.B. 'Stephanie Pfau kann diesen Montag erst ab 12' oder 'Max. 2 Wochenenddienste pro Monat'"
                  className="w-full border rounded px-3 py-2 h-32"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    setNlText('');
                  }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    if (nlText.trim()) {
                      onAnalyze();
                    }
                  }}
                  disabled={!nlText.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Regel analysieren
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4">
                  <p className="text-sm font-semibold text-green-900">
                    ✓ Regeln verstanden - Bitte überprüfen
                  </p>
                </div>

                <p className="text-sm font-semibold text-gray-900 mb-4">
                  Ich habe {parsedRules.length} Regel{parsedRules.length > 1 ? 'n' : ''} erkannt:
                </p>

                {parsedRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="mb-4 border-2 border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{idx + 1}️⃣</span>
                        <span className="font-bold text-gray-900 uppercase text-sm">
                          {rule.understood?.type || 'MITARBEITER-EINSCHRÄNKUNG'}
                        </span>
                      </div>
                      <CheckCircle size={20} className="text-green-600" />
                    </div>

                    <div className="space-y-3 text-sm">
                      {/* Original Input */}
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-semibold text-gray-700 mb-1">📝 Ihre Eingabe:</p>
                        <p className="text-gray-900 italic">"{rule.original}"</p>
                      </div>

                      {/* Parsed Understanding */}
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-semibold text-blue-900 mb-2">🤖 Mein Verständnis:</p>
                        <div className="space-y-1">
                          {rule.understood?.Mitarbeiter && (
                            <div className="flex gap-2">
                              <span className="text-blue-800">• Mitarbeiter:</span>
                              <span className="text-blue-900 font-medium">
                                {rule.understood.Mitarbeiter}
                              </span>
                            </div>
                          )}
                          {rule.understood?.Schicht && (
                            <div className="flex gap-2">
                              <span className="text-blue-800">• Schicht:</span>
                              <span className="text-blue-900 font-medium">
                                {rule.understood.Schicht}
                              </span>
                            </div>
                          )}
                          {rule.understood?.Tag && (
                            <div className="flex gap-2">
                              <span className="text-blue-800">• Tag:</span>
                              <span className="text-blue-900 font-medium">{rule.understood.Tag}</span>
                            </div>
                          )}
                          {rule.understood?.Einschränkung && (
                            <div className="flex gap-2">
                              <span className="text-blue-800">• Einschränkung:</span>
                              <span className="text-blue-900 font-medium">
                                {rule.understood.Einschränkung}
                              </span>
                            </div>
                          )}
                          {rule.understood?.Zeitraum && (
                            <div className="flex gap-2">
                              <span className="text-blue-800">• Zeitraum:</span>
                              <span className="text-blue-900 font-medium">
                                {rule.understood.Zeitraum}
                              </span>
                            </div>
                          )}
                          {rule.understood?.Härte && (
                            <div className="flex gap-2">
                              <span className="text-blue-800">• Typ:</span>
                              <span
                                className={`font-bold ${
                                  rule.understood.Härte === 'HART'
                                    ? 'text-red-700'
                                    : 'text-yellow-700'
                                }`}
                              >
                                {rule.understood.Härte === 'HART'
                                  ? 'HARTE REGEL (kann nicht verletzt werden)'
                                  : 'WEICHE REGEL (Optimierungsziel)'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Technical Implementation */}
                      <div className="bg-purple-50 p-3 rounded font-mono text-xs">
                        <p className="font-semibold text-purple-900 mb-2 font-sans">
                          ⚙️ Technisch wird dies umgesetzt als:
                        </p>
                        <code className="text-purple-800">
                          {rule.understood?.Mitarbeiter && rule.understood?.Tag
                            ? `constraint: employee["${rule.understood.Mitarbeiter}"].day != "${rule.understood.Tag}"`
                            : rule.understood?.Schicht
                            ? `shift["${rule.understood.Schicht}"].requires(qualifications=[...])`
                            : 'constraint: [automatisch generiert basierend auf Regeltyp]'}
                        </code>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-semibold flex items-center gap-1">
                          <Check size={14} />
                          Korrekt
                        </button>
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold flex items-center gap-1">
                          <Edit2 size={14} />
                          Bearbeiten
                        </button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold flex items-center gap-1">
                          <Trash2 size={14} />
                          Löschen
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Summary */}
                <div className="border-t-2 border-gray-300 pt-4 mt-4">
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-600" />
                      <span className="font-semibold text-gray-900">
                        {parsedRules.length} Regel{parsedRules.length > 1 ? 'n' : ''} korrekt
                        verstanden
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowNlResults(false);
                  }}
                  className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Zurück bearbeiten
                </button>
                <button
                  onClick={() => {
                    onSave();
                    onClose();
                    setShowNlResults(false);
                    setNlText('');
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Regeln speichern
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NaturalLanguageDialog;
