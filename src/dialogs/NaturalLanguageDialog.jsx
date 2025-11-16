import React, { useState, useEffect } from 'react';
import { X, Trash2, CheckCircle, Plus } from 'lucide-react';

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
  // Local state for editable rules
  const [editableRules, setEditableRules] = useState([]);

  // Initialize editable rules when parsed rules change
  useEffect(() => {
    if (parsedRules && parsedRules.length > 0) {
      setEditableRules(parsedRules.map(rule => ({
        ...rule,
        understood: { ...rule.understood }
      })));
    }
  }, [parsedRules]);

  const handleFieldChange = (ruleIdx, fieldName, value) => {
    setEditableRules(prev => {
      const updated = [...prev];
      updated[ruleIdx] = {
        ...updated[ruleIdx],
        understood: {
          ...updated[ruleIdx].understood,
          [fieldName]: value
        }
      };
      return updated;
    });
  };

  const handleDeleteRule = (ruleIdx) => {
    setEditableRules(prev => prev.filter((_, idx) => idx !== ruleIdx));
  };

  const handleSave = () => {
    // Pass the edited rules back
    onSave(editableRules);
    onClose();
    setShowNlResults(false);
    setNlText('');
  };

  if (!isOpen) return null;

  // Field options for dropdowns
  const timeUnitOptions = [
    { value: 'Tag', label: 'Tag' },
    { value: 'Wochentag', label: 'Wochentag' },
    { value: 'Monat', label: 'Monat' },
    { value: 'Zeitraum', label: 'Zeitraum' },
  ];

  const ruleTypeOptions = [
    { value: 'HART', label: 'HARTE REGEL (muss eingehalten werden)' },
    { value: 'WEICH', label: 'WEICHE REGEL (Optimierungsziel)' },
  ];

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
                  placeholder="z.B. 'Stephanie Pfau kann diesen Montag erst ab 12' oder 'Paul ist im Februar nicht da' oder 'Max. 2 Wochenenddienste pro Monat'"
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
                    ✓ Regeln verstanden - Bitte überprüfen und bei Bedarf anpassen
                  </p>
                </div>

                <p className="text-sm font-semibold text-gray-900 mb-4">
                  Ich habe {editableRules.length} Regel{editableRules.length > 1 ? 'n' : ''} erkannt:
                </p>

                {editableRules.map((rule, idx) => (
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
                      <button
                        onClick={() => handleDeleteRule(idx)}
                        className="text-red-500 hover:text-red-700"
                        title="Regel löschen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="space-y-3 text-sm">
                      {/* Original Input */}
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-semibold text-gray-700 mb-1">📝 Ihre Eingabe:</p>
                        <p className="text-gray-900 italic">"{rule.original}"</p>
                      </div>

                      {/* Editable Understanding */}
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-semibold text-blue-900 mb-3">🤖 Mein Verständnis (bearbeitbar):</p>
                        <div className="space-y-3">
                          {/* Mitarbeiter */}
                          {rule.understood?.Mitarbeiter !== undefined && (
                            <div className="flex items-center gap-2">
                              <label className="text-blue-800 w-32 flex-shrink-0">Mitarbeiter:</label>
                              <input
                                type="text"
                                value={rule.understood.Mitarbeiter}
                                onChange={(e) => handleFieldChange(idx, 'Mitarbeiter', e.target.value)}
                                className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                              />
                            </div>
                          )}

                          {/* Schicht */}
                          {rule.understood?.Schicht !== undefined && (
                            <div className="flex items-center gap-2">
                              <label className="text-blue-800 w-32 flex-shrink-0">Schicht:</label>
                              <input
                                type="text"
                                value={rule.understood.Schicht}
                                onChange={(e) => handleFieldChange(idx, 'Schicht', e.target.value)}
                                className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                              />
                            </div>
                          )}

                          {/* Time-based fields - Tag/Wochentag/Monat */}
                          {(rule.understood?.Tag !== undefined ||
                            rule.understood?.Wochentag !== undefined ||
                            rule.understood?.Monat !== undefined) && (
                            <div className="flex items-center gap-2">
                              <select
                                value={
                                  rule.understood?.Monat !== undefined ? 'Monat' :
                                  rule.understood?.Wochentag !== undefined ? 'Wochentag' : 'Tag'
                                }
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  const currentValue = rule.understood?.Monat || rule.understood?.Wochentag || rule.understood?.Tag || '';
                                  // Remove old field, add new one
                                  setEditableRules(prev => {
                                    const updated = [...prev];
                                    const newUnderstood = { ...updated[idx].understood };
                                    delete newUnderstood.Tag;
                                    delete newUnderstood.Wochentag;
                                    delete newUnderstood.Monat;
                                    newUnderstood[newType] = currentValue;
                                    updated[idx] = { ...updated[idx], understood: newUnderstood };
                                    return updated;
                                  });
                                }}
                                className="w-32 border border-blue-300 rounded px-2 py-1 text-sm bg-white text-blue-800"
                              >
                                <option value="Tag">Tag</option>
                                <option value="Wochentag">Wochentag</option>
                                <option value="Monat">Monat</option>
                              </select>
                              <input
                                type="text"
                                value={rule.understood?.Monat || rule.understood?.Wochentag || rule.understood?.Tag || ''}
                                onChange={(e) => {
                                  const fieldName = rule.understood?.Monat !== undefined ? 'Monat' :
                                                   rule.understood?.Wochentag !== undefined ? 'Wochentag' : 'Tag';
                                  handleFieldChange(idx, fieldName, e.target.value);
                                }}
                                placeholder={
                                  rule.understood?.Monat !== undefined ? 'z.B. Februar' :
                                  rule.understood?.Wochentag !== undefined ? 'z.B. Montag' : 'z.B. 15.05.2025'
                                }
                                className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                              />
                            </div>
                          )}

                          {/* Einschränkung */}
                          {rule.understood?.Einschränkung !== undefined && (
                            <div className="flex items-center gap-2">
                              <label className="text-blue-800 w-32 flex-shrink-0">Einschränkung:</label>
                              <input
                                type="text"
                                value={rule.understood.Einschränkung}
                                onChange={(e) => handleFieldChange(idx, 'Einschränkung', e.target.value)}
                                className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                              />
                            </div>
                          )}

                          {/* Zeitraum */}
                          {rule.understood?.Zeitraum !== undefined && (
                            <div className="flex items-center gap-2">
                              <label className="text-blue-800 w-32 flex-shrink-0">Zeitraum:</label>
                              <input
                                type="text"
                                value={rule.understood.Zeitraum}
                                onChange={(e) => handleFieldChange(idx, 'Zeitraum', e.target.value)}
                                placeholder="z.B. ab 12:00 Uhr"
                                className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                              />
                            </div>
                          )}

                          {/* Härte (Rule Type) */}
                          {rule.understood?.Härte !== undefined && (
                            <div className="flex items-center gap-2">
                              <label className="text-blue-800 w-32 flex-shrink-0">Regeltyp:</label>
                              <select
                                value={rule.understood.Härte}
                                onChange={(e) => handleFieldChange(idx, 'Härte', e.target.value)}
                                className={`flex-1 border rounded px-2 py-1 text-sm bg-white font-semibold ${
                                  rule.understood.Härte === 'HART'
                                    ? 'border-red-300 text-red-700'
                                    : 'border-yellow-300 text-yellow-700'
                                }`}
                              >
                                <option value="HART">HARTE REGEL (muss eingehalten werden)</option>
                                <option value="WEICH">WEICHE REGEL (Optimierungsziel)</option>
                              </select>
                            </div>
                          )}

                          {/* Add field button */}
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                // Show a simple prompt to add a field
                                const fieldOptions = ['Mitarbeiter', 'Schicht', 'Tag', 'Wochentag', 'Monat', 'Einschränkung', 'Zeitraum', 'Härte'];
                                const existingFields = Object.keys(rule.understood || {});
                                const availableFields = fieldOptions.filter(f => !existingFields.includes(f));

                                if (availableFields.length === 0) {
                                  alert('Alle Felder sind bereits vorhanden.');
                                  return;
                                }

                                const fieldToAdd = prompt(`Welches Feld möchten Sie hinzufügen?\n\nVerfügbar: ${availableFields.join(', ')}`);
                                if (fieldToAdd && availableFields.includes(fieldToAdd)) {
                                  handleFieldChange(idx, fieldToAdd, fieldToAdd === 'Härte' ? 'HART' : '');
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Plus size={12} />
                              Feld hinzufügen
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Technical Implementation */}
                      <div className="bg-purple-50 p-3 rounded font-mono text-xs">
                        <p className="font-semibold text-purple-900 mb-2 font-sans">
                          ⚙️ Technisch wird dies umgesetzt als:
                        </p>
                        <code className="text-purple-800">
                          {rule.understood?.Mitarbeiter && (rule.understood?.Tag || rule.understood?.Wochentag || rule.understood?.Monat)
                            ? `constraint: employee["${rule.understood.Mitarbeiter}"].${
                                rule.understood?.Monat ? 'month' : rule.understood?.Wochentag ? 'weekday' : 'day'
                              } != "${rule.understood?.Monat || rule.understood?.Wochentag || rule.understood?.Tag}"`
                            : rule.understood?.Schicht
                            ? `shift["${rule.understood.Schicht}"].requires(qualifications=[...])`
                            : 'constraint: [automatisch generiert basierend auf Regeltyp]'}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}

                {editableRules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Keine Regeln vorhanden. Klicken Sie auf "Zurück", um erneut zu beginnen.
                  </div>
                )}

                {/* Summary */}
                {editableRules.length > 0 && (
                  <div className="border-t-2 border-gray-300 pt-4 mt-4">
                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <span className="font-semibold text-gray-900">
                          {editableRules.length} Regel{editableRules.length > 1 ? 'n' : ''} bereit zum
                          Speichern
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowNlResults(false);
                  }}
                  className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Zurück
                </button>
                <button
                  onClick={handleSave}
                  disabled={editableRules.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
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
