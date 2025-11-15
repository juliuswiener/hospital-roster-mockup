import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';

export const RulesView = ({ rules, onAddRule, onEditRule }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Planungsregeln & Constraints</h2>
        <button
          onClick={onAddRule}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Neue Regel
        </button>
      </div>

      {/* Hard Rules Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>🔴</span>
          HARTE REGELN (Dürfen NICHT verletzt werden)
        </h3>

        <div className="space-y-3">
          {rules
            .filter((r) => r.type === 'hard')
            .map((rule) => {
              const exampleText =
                rule.category === 'Arbeitszeitgesetz'
                  ? '└─ Beispiel: Nach einem Dienst bis 22 Uhr darf der nächste Dienst frühestens um 09 Uhr beginnen'
                  : rule.category === 'Qualifikation'
                  ? `└─ Beispiel: ${
                      rule.appliesTo !== 'all'
                        ? rule.appliesTo + ' erfüllt diese Anforderung nicht'
                        : 'Nur qualifizierte Mitarbeiter werden eingeplant'
                    }`
                  : `└─ Beispiel: ${rule.text}`;

              return (
                <div
                  key={rule.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">{rule.text}</p>
                          <p className="text-sm text-gray-500 mb-2">{exampleText}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {rule.category}
                            </span>
                            {rule.appliesTo !== 'all' && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {rule.appliesTo}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 ml-3">
                          <button
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            onClick={() => onEditRule && onEditRule(rule)}
                          >
                            Bearbeiten
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Info"
                          >
                            <AlertCircle size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Soft Rules Section */}
      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>🟡</span>
          WEICHE REGELN (Optimierungsziele)
        </h3>

        <div className="space-y-3">
          {rules
            .filter((r) => r.type === 'soft')
            .map((rule) => {
              const exampleText =
                rule.category === 'Fairness'
                  ? '└─ Beispiel: Person A hatte bereits 2 Wochenenden, Person B nur 1 → Person B wird bevorzugt'
                  : rule.category === 'Präferenz'
                  ? `└─ Beispiel: ${rule.appliesTo} wird bei der Planung bevorzugt für diese Schichten berücksichtigt`
                  : `└─ Beispiel: System versucht diese Regel zu optimieren`;

              return (
                <div
                  key={rule.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-yellow-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">{rule.text}</p>
                          <p className="text-sm text-gray-500 mb-2">{exampleText}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {rule.category}
                            </span>
                            {rule.appliesTo !== 'all' && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {rule.appliesTo}
                              </span>
                            )}
                            {/* Weight dropdown for soft rules */}
                            <div className="flex items-center gap-1 ml-2">
                              <span className="text-xs text-gray-600">Gewichtung:</span>
                              <select
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                defaultValue="medium"
                              >
                                <option value="low">Niedrig (1)</option>
                                <option value="medium">Mittel (5)</option>
                                <option value="high">Hoch (10)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 ml-3">
                          <button
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            onClick={() => onEditRule && onEditRule(rule)}
                          >
                            Bearbeiten
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Info"
                          >
                            <AlertCircle size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default RulesView;
