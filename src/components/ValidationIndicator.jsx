import React from 'react';
import { useAppSelector } from '../store/hooks';
import { selectViolationCount, selectIsValidating } from '../store/selectors';
import { AlertTriangle, CheckCircle, Loader } from 'lucide-react';

/**
 * Displays overall validation status with violation counts
 */
export function ValidationIndicator() {
  const violationCount = useAppSelector(selectViolationCount);
  const isValidating = useAppSelector(selectIsValidating);

  if (isValidating) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
        <Loader className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-blue-700">Validating...</span>
      </div>
    );
  }

  const hasHardViolations = violationCount.hard > 0;
  const hasSoftViolations = violationCount.soft > 0;

  if (!hasHardViolations && !hasSoftViolations) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-green-700">All rules satisfied</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {hasHardViolations && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-red-700 font-medium">
            {violationCount.hard} error{violationCount.hard !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {hasSoftViolations && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-700">
            {violationCount.soft} warning{violationCount.soft !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

export default ValidationIndicator;
