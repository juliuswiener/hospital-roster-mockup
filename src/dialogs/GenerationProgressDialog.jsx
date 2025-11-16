import React from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';

export const GenerationProgressDialog = ({ isOpen, progress }) => {
  if (!isOpen) return null;

  const getStatusMessage = () => {
    if (progress < 30) return 'Initialisiere Optimierung...';
    if (progress < 60) return 'Prüfe Constraints...';
    if (progress < 90) return 'Optimiere Verteilung...';
    return 'Finalisiere Plan...';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            <RefreshCw size={48} className="animate-spin text-green-600 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Plan wird generiert...</h3>
          <p className="text-gray-600 mb-6">{getStatusMessage()}</p>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
            <div
              className="bg-green-600 h-4 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 font-semibold">{progress}% abgeschlossen</p>
          {progress === 100 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-semibold">Erfolgreich!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerationProgressDialog;
