import React from 'react';
import { Plus, MessageSquare, Edit2, Settings } from 'lucide-react';

export const ShiftsView = ({ shifts, onAddShift, onAddRule }) => {
  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onAddShift}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold shadow-sm"
        >
          <Plus size={16} />
          Neue Schicht
        </button>
        <button
          onClick={onAddRule}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold shadow-sm"
        >
          <MessageSquare size={16} />
          Neue Regel
        </button>
      </div>
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Schicht</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Station</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Zeiten</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Qualifikationen</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Sonstige Regeln</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-4 font-semibold text-gray-900">{shift.name}</td>
                <td className="px-4 py-4 text-gray-700">{shift.station}</td>
                <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{shift.time}</td>
                <td className="px-4 py-4">
                  <ul className="list-disc list-inside space-y-1">
                    {shift.requirements.map((req, rIdx) => (
                      <li key={rIdx} className="text-sm text-gray-800">
                        {req}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-4">
                  {shift.rules.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {shift.rules.map((rule, rIdx) => (
                        <li key={rIdx} className="text-sm text-gray-800">
                          <span className="text-yellow-600 font-semibold">🟡</span> {rule}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Keine zusätzlichen Regeln</p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1">
                      <Edit2 size={14} />
                      Bearbeiten
                    </button>
                    <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1">
                      <Settings size={14} />
                      Regeln
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftsView;
