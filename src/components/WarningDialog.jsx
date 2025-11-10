import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const WarningDialog = ({ title, message, onConfirm, onCancel }) => {
  if (!title || !message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-700 mb-6 ml-9">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
          >
            Trotzdem fortfahren
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningDialog;
