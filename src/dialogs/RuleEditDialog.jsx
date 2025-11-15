import React from 'react';
import { X } from 'lucide-react';

export const RuleEditDialog = ({ rule, onClose, onSave }) => {
  if (!rule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Regel bearbeiten</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Original Input */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">Originale Eingabe:</label>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
              <p className="text-gray-900">{rule.text}</p>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t-2 border-gray-300"></div>

          {/* Verstanden als */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Verstanden als:</h3>

            {/* Regeltyp */}
            <div className="mb-4">
              <label className="block font-medium text-gray-900 mb-2">Regeltyp:</label>
              <div className="space-y-2 ml-3">
                {[
                  'Fairness-Ziel',
                  'Qualifikationsanforderung',
                  'Mitarbeiter-Einschränkung',
                  'Arbeitszeitgesetz',
                  'Sonstige',
                ].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ruleType"
                      defaultChecked={rule.category === type}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Betrifft */}
            <div className="mb-4">
              <label className="block font-medium text-gray-900 mb-2">Betrifft:</label>
              <div className="space-y-2 ml-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked={rule.appliesTo === 'all'}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-900">Alle Mitarbeiter</span>
                </label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-gray-900">Nur bestimmte:</span>
                  <input
                    type="text"
                    placeholder="Name eingeben..."
                    defaultValue={rule.appliesTo !== 'all' ? rule.appliesTo : ''}
                    className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Maximum Wochenenden (example - conditional) */}
            {rule.category === 'Fairness' && (
              <div className="mb-4 ml-3">
                <div className="flex items-center gap-2">
                  <label className="text-gray-900">Maximum Wochenenden:</label>
                  <input
                    type="number"
                    defaultValue="2"
                    className="w-20 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-900">pro</span>
                  <select className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Monat</option>
                    <option>Woche</option>
                  </select>
                </div>
              </div>
            )}

            {/* Regel-Härte */}
            <div className="mb-4">
              <label className="block font-medium text-gray-900 mb-2">Regel-Härte:</label>
              <div className="space-y-2 ml-3">
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="hardness"
                    defaultChecked={rule.type === 'hard'}
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <span className="text-gray-900 font-medium">HART</span>
                    <span className="text-sm text-gray-600 block">
                      (niemals überschreiten, bricht Generierung ab)
                    </span>
                  </div>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="hardness"
                    defaultChecked={rule.type === 'soft'}
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <span className="text-gray-900 font-medium">WEICH</span>
                    <span className="text-sm text-gray-600 block">
                      (Optimierungsziel, kann bei Bedarf überschritten werden)
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Falls weich - Gewichtung */}
            {rule.type === 'soft' && (
              <div className="mb-4">
                <label className="block font-medium text-gray-900 mb-2">
                  Falls weich - Gewichtung:
                </label>
                <div className="flex gap-4 ml-3">
                  {['Niedrig', 'Mittel', 'Hoch', 'Sehr hoch'].map((weight) => (
                    <label key={weight} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="weight"
                        defaultChecked={weight === 'Mittel'}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-900">{weight}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t-2 border-gray-300"></div>

          {/* Vorschau */}
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-gray-900 mb-2">Vorschau der Regel:</h3>
            <p className="text-sm text-gray-700">
              💡 System versucht, jedem Mitarbeiter max. 2 Wochenenden/Monat zuzuweisen. Falls
              unmöglich (z.B. Personalmangel), kann überschritten werden.
            </p>
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
            onClick={() => {
              onSave && onSave(rule);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleEditDialog;
