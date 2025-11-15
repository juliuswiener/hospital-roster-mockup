/**
 * React hooks for OR-Tools solver integration
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  startPlanGeneration,
  pollJobCompletion,
  checkBackendHealth,
  findReplacement
} from './api';

/**
 * Hook for managing plan generation
 */
export const usePlanGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const [generationResult, setGenerationResult] = useState(null);
  const cleanupRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const generate = useCallback(async (config) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);
    setGenerationResult(null);

    try {
      // Start the job
      const { job_id } = await startPlanGeneration(config);
      setCurrentJobId(job_id);

      // Poll for completion
      const cleanup = pollJobCompletion(
        job_id,
        (progress) => {
          setGenerationProgress(progress * 100);
        },
        (result) => {
          setIsGenerating(false);
          setGenerationProgress(100);
          setGenerationResult(result);
          setCurrentJobId(null);
        },
        (error) => {
          setIsGenerating(false);
          setGenerationError(error);
          setGenerationProgress(0);
          setCurrentJobId(null);
        }
      );

      cleanupRef.current = cleanup;
    } catch (error) {
      setIsGenerating(false);
      setGenerationError(error.message);
      setGenerationProgress(0);
    }
  }, []);

  const cancel = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setIsGenerating(false);
    setGenerationProgress(0);
    setCurrentJobId(null);
  }, []);

  const reset = useCallback(() => {
    setGenerationError(null);
    setGenerationResult(null);
  }, []);

  return {
    isGenerating,
    generationProgress,
    currentJobId,
    generationError,
    generationResult,
    generate,
    cancel,
    reset
  };
};

/**
 * Hook for checking backend health
 */
export const useBackendHealth = () => {
  const [isHealthy, setIsHealthy] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    const healthy = await checkBackendHealth();
    setIsHealthy(healthy);
    setLastChecked(new Date());
    return healthy;
  }, []);

  // Check on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { isHealthy, lastChecked, checkHealth };
};

/**
 * Hook for finding shift replacements
 */
export const useReplacementFinder = () => {
  const [candidates, setCandidates] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const findCandidates = useCallback(async (shiftInfo) => {
    setIsSearching(true);
    setError(null);

    try {
      const result = await findReplacement(shiftInfo);
      setCandidates(result.candidates || []);
    } catch (err) {
      setError(err.message);
      setCandidates([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const reset = useCallback(() => {
    setCandidates([]);
    setError(null);
  }, []);

  return { candidates, isSearching, error, findCandidates, reset };
};

/**
 * Utility to transform schedule data to solver format
 */
export const transformScheduleForSolver = (scheduleData, employees, shifts, selectedMonth) => {
  // Parse month and year
  const [year, month] = selectedMonth.split('-').map(Number);

  // Get days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Extract fixed assignments (locked cells)
  const fixedAssignments = [];
  Object.entries(scheduleData).forEach(([empInitials, daysData]) => {
    Object.entries(daysData).forEach(([day, data]) => {
      if (data && data.locked && data.shift) {
        fixedAssignments.push({
          employee: empInitials,
          day: String(day),
          shift: data.shift
        });
      }
    });
  });

  return {
    employees: employees.map(emp => ({
      name: emp.name,
      initials: emp.initials,
      contract: emp.contract || 'Facharzt',
      hours: emp.hours || 40,
      qualifications: emp.qualifications || []
    })),
    shifts: shifts.map(shift => ({
      name: shift.name,
      category: shift.category || 'General',
      description: shift.description || '',
      requirements: shift.requirements || ['Min. 1 Person'],
      rules: shift.rules || [],
      station: shift.station || shift.category || 'General',
      time: shift.time || '08:00-16:00'
    })),
    days,
    fixedAssignments
  };
};

/**
 * Utility to transform availability data for solver
 */
export const transformAvailabilityForSolver = (availability) => {
  const result = {};

  Object.entries(availability).forEach(([empInitials, daysData]) => {
    result[empInitials] = {};
    Object.entries(daysData).forEach(([day, status]) => {
      if (status) {
        result[empInitials][String(day)] = status;
      }
    });
  });

  return result;
};

/**
 * Apply solver result to schedule data structure
 */
export const applyGeneratedSchedule = (currentSchedule, solverResult) => {
  if (!solverResult || !solverResult.solution || !solverResult.solution.schedule) {
    return currentSchedule;
  }

  const newSchedule = { ...currentSchedule };

  // Apply the generated schedule
  const generatedSchedule = solverResult.solution.schedule;

  Object.entries(generatedSchedule).forEach(([empInitials, daysData]) => {
    if (!newSchedule[empInitials]) {
      newSchedule[empInitials] = {};
    }

    Object.entries(daysData).forEach(([day, assignment]) => {
      // Don't overwrite locked assignments
      if (newSchedule[empInitials][day] && newSchedule[empInitials][day].locked) {
        return;
      }

      if (assignment.shift) {
        newSchedule[empInitials][day] = {
          shift: assignment.shift,
          station: assignment.station || 'Ambulanzen',
          locked: false,
          violation: false
        };
      }
    });
  });

  return newSchedule;
};
