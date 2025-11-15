import React from 'react';
import { useAppSelector } from '../store/hooks';
import { selectHardViolations, selectSoftViolations } from '../store/selectors';
import { AlertTriangle, XCircle } from 'lucide-react';

/**
 * Lists all current validation violations
 */
export function ViolationsList() {
  const hardViolations = useAppSelector(selectHardViolations);
  const softViolations = useAppSelector(selectSoftViolations);

  if (hardViolations.length === 0 && softViolations.length === 0) {
    return (
      <div className="p-4 bg-green-50 rounded-lg text-green-700">
        No violations found. Schedule is valid.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hardViolations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Hard Violations ({hardViolations.length})
          </h3>
          <div className="space-y-2">
            {hardViolations.map((violation, idx) => (
              <div
                key={`hard-${idx}`}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
              >
                <div className="font-medium text-red-800">{violation.ruleName}</div>
                <div className="text-red-700 mt-1">{violation.message}</div>
                <div className="text-red-600 text-xs mt-1">
                  Category: {violation.metadata?.category || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {softViolations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Soft Violations ({softViolations.length})
          </h3>
          <div className="space-y-2">
            {softViolations.map((violation, idx) => (
              <div
                key={`soft-${idx}`}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm"
              >
                <div className="font-medium text-yellow-800">{violation.ruleName}</div>
                <div className="text-yellow-700 mt-1">{violation.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ViolationsList;
