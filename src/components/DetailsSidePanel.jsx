import React, { useState } from 'react';
import { X, Plus, Trash2, User, Calendar, CheckCircle } from 'lucide-react';

const DetailsSidePanel = ({ item, type, onClose, rules, onAddRule, onDeleteRule }) => {
  const [newRuleText, setNewRuleText] = useState('');

  if (!item) return null;

  const handleAddRule = () => {
    if (newRuleText.trim()) {
      onAddRule(newRuleText.trim());
      setNewRuleText('');
    }
  };

  const itemRules = rules.filter(rule =>
    rule.appliesTo === item.name || rule.appliesTo === item.initials ||
    (type === 'shift' && rule.category === item.name)
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {type === 'employee' ? (
              <User className="text-blue-600" size={20} />
            ) : (
              <Calendar className="text-green-600" size={20} />
            )}
            <h2 className="text-lg font-bold text-gray-900">
              {type === 'employee' ? 'Mitarbeiter Details' : 'Schicht Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Item Information */}
          <div className="mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-3">
              {type === 'employee' ? item.name : item.name}
            </h3>

            {type === 'employee' ? (
              <div className="space-y-3">
                {/* Show detailed info if available (from Schichten view) */}
                {item.detailedInfo ? (
                  <div className="space-y-3">
                    {/* Years of service */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                      <p className="text-sm font-semibold text-blue-900">
                        Mitarbeiter/-in seit {item.detailedInfo.yearsOfService} {item.detailedInfo.yearsOfService === 1 ? 'Jahr' : 'Jahren'} eingearbeitet
                      </p>
                    </div>

                    {/* Qualifications */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        Qualifiziert für:
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {item.detailedInfo.qualifications.map((qual, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium"
                          >
                            {qual}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Unavailability */}
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                      <p className="text-sm font-semibold text-orange-900">
                        ⚠️ {item.detailedInfo.unavailability}
                      </p>
                    </div>

                    {/* Next vacation */}
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                      <p className="text-sm font-semibold text-purple-900">
                        🏖️ Nächster Urlaub: {item.detailedInfo.nextVacation}
                      </p>
                    </div>

                    {/* Contract details */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t text-sm">
                      <div>
                        <p className="text-xs text-gray-600">Kürzel</p>
                        <p className="font-semibold text-gray-900">{item.initials}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Vertrag</p>
                        <p className="font-semibold text-gray-900">{item.contract}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Wochenstunden</p>
                        <p className="font-semibold text-gray-900">{item.hours}h</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Standard employee info (for other views)
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kürzel:</span>
                      <span className="font-medium">{item.initials}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vertrag:</span>
                      <span className="font-medium">{item.contract}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stunden/Woche:</span>
                      <span className="font-medium">{item.hours}h</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-gray-600 block mb-1">Qualifikationen:</span>
                      <div className="flex flex-wrap gap-1">
                        {item.qualifications?.map((qual, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {qual}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kategorie:</span>
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-600 block mb-1">Beschreibung:</span>
                  <p className="text-gray-900">{item.description}</p>
                </div>
                <div className="mt-3">
                  <span className="text-gray-600 block mb-1">Anforderungen:</span>
                  <div className="flex flex-wrap gap-1">
                    {item.requirements?.map((req, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rules Section */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-bold text-gray-900 mb-3">Regeln</h4>

            {/* Existing Rules */}
            <div className="space-y-2 mb-4">
              {itemRules.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Keine spezifischen Regeln</p>
              ) : (
                itemRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${
                            rule.type === 'hard'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {rule.type === 'hard' ? 'Hart' : 'Weich'}
                        </span>
                        <span className="text-xs text-gray-500">{rule.category}</span>
                      </div>
                      <p className="text-sm text-gray-900">{rule.text}</p>
                    </div>
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Regel löschen"
                    >
                      <X size={14} className="text-red-600" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Rule */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Neue Regel hinzufügen
              </label>
              <textarea
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                placeholder="z.B. 'Keine Nachtdienste am Wochenende' oder 'Max. 2 Schichten pro Woche'"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={3}
              />
              <button
                onClick={handleAddRule}
                disabled={!newRuleText.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
                <span>Regel hinzufügen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailsSidePanel;
