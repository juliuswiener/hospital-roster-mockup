import React from 'react';
import { AlertCircle } from 'lucide-react';

export const WarningConfirmDialog = ({ dialog, onClose }) => {
  if (!dialog) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="text-orange-500 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{dialog.title}</h3>
            <p className="text-gray-700">{dialog.message}</p>
          </div>
        </div>
        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 mb-4">
          <p className="text-sm font-semibold text-orange-900">
            Soll das dennoch übernommen werden?
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={dialog.onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold"
          >
            Nein, abbrechen
          </button>
          <button
            onClick={dialog.onConfirm}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-semibold"
          >
            Ja, übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningConfirmDialog;
