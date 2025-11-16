import React from 'react';
import { Plus, MessageSquare, Edit2, Settings, Trash2 } from 'lucide-react';

export const EmployeesView = ({
  employees,
  rules,
  showGeneralRules,
  onToggleGeneralRules,
  onAddEmployee,
  onAddRule,
  onEditEmployee,
  onAddRuleForEmployee,
  onDeleteEmployee,
  getRulesForEmployee,
}) => {
  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex gap-3 justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={onAddEmployee}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold shadow-sm"
          >
            <Plus size={16} />
            Neuer Mitarbeiter
          </button>
          <button
            onClick={onAddRule}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold shadow-sm"
          >
            <MessageSquare size={16} />
            Neue Regel
          </button>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded-lg p-3 flex items-center gap-3">
          <p className="font-semibold text-gray-900 text-sm">Allgemeine Regeln anzeigen</p>
          <button
            onClick={onToggleGeneralRules}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showGeneralRules ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showGeneralRules ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Name</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Vertrag</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Std/Woche</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Qualifikationen</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Gültige Regeln</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, idx) => {
              const employeeRules = getRulesForEmployee(employee.name);
              const specificRules = employeeRules.filter((r) => r.appliesTo !== 'all');
              const generalRules = employeeRules.filter((r) => r.appliesTo === 'all');
              return (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-4 font-semibold text-gray-900">{employee.name}</td>
                  <td className="px-4 py-4 text-gray-700">{employee.contract}</td>
                  <td className="px-4 py-4 text-gray-700">{employee.hours}h</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {employee.qualifications.map((qual, qIdx) => (
                        <span
                          key={qIdx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {qual}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      {specificRules.length > 0 && (
                        <div>
                          <ul className="list-disc list-inside space-y-1">
                            {specificRules.map((rule) => (
                              <li key={rule.id} className="text-sm text-gray-800">
                                <span
                                  className={`font-semibold ${
                                    rule.type === 'hard' ? 'text-red-600' : 'text-yellow-600'
                                  }`}
                                >
                                  {rule.type === 'hard' ? '🔴' : '🟡'}
                                </span>{' '}
                                {rule.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {showGeneralRules && generalRules.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <ul className="list-disc list-inside space-y-1">
                            {generalRules.map((rule) => (
                              <li key={rule.id} className="text-sm text-gray-600">
                                <span
                                  className={`font-semibold ${
                                    rule.type === 'hard' ? 'text-red-400' : 'text-yellow-400'
                                  }`}
                                >
                                  {rule.type === 'hard' ? '🔴' : '🟡'}
                                </span>{' '}
                                {rule.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {specificRules.length === 0 && (
                        <p className="text-sm text-gray-500 italic">
                          Keine individuellen Einschränkungen
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditEmployee(employee)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                      >
                        <Edit2 size={14} />
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => onAddRuleForEmployee(employee)}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1"
                      >
                        <Settings size={14} />
                        Regeln
                      </button>
                      <button
                        onClick={() => onDeleteEmployee(employee.initials)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeesView;
