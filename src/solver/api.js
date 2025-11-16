/**
 * API client for the OR-Tools roster solver backend
 */

import { API_BASE } from '../config/api';

/**
 * Start a plan generation job
 * @param {Object} config - Configuration for plan generation
 * @returns {Promise<{job_id: string}>}
 */
export const startPlanGeneration = async (config) => {
  const response = await fetch(`${API_BASE}/api/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employees: config.employees,
      shifts: config.shifts,
      days: config.days,
      rules: config.rules || [],
      availability: config.availability || {},
      fixed_assignments: config.fixedAssignments || [],
      optimization_mode: config.optimizationMode || 'quick',
      time_limit: config.customTimeLimit || 30,
      stations: config.stations || []
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to start plan generation');
  }

  return response.json();
};

/**
 * Check the status of a plan generation job
 * @param {string} jobId - The job ID to check
 * @returns {Promise<Object>}
 */
export const checkJobStatus = async (jobId) => {
  const response = await fetch(`${API_BASE}/api/job-status/${jobId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Job not found');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to check job status');
  }

  return response.json();
};

/**
 * Poll for job completion
 * @param {string} jobId - The job ID to poll
 * @param {Function} onProgress - Callback for progress updates
 * @param {Function} onComplete - Callback when job completes
 * @param {Function} onError - Callback on error
 * @returns {Function} Cleanup function to stop polling
 */
export const pollJobCompletion = (jobId, onProgress, onComplete, onError) => {
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;

    try {
      const status = await checkJobStatus(jobId);

      if (status.status === 'running' || status.status === 'pending') {
        onProgress(status.progress || 0);
        // Continue polling
        setTimeout(poll, 1000);
      } else if (status.status === 'completed') {
        onComplete(status.result);
      } else if (status.status === 'failed') {
        onError(status.error || 'Job failed');
      }
    } catch (err) {
      if (!cancelled) {
        onError(err.message);
      }
    }
  };

  // Start polling
  poll();

  // Return cleanup function
  return () => {
    cancelled = true;
  };
};

/**
 * Find replacement candidates for a shift
 * @param {Object} shiftInfo - Information about the shift needing coverage
 * @returns {Promise<Object>}
 */
export const findReplacement = async (shiftInfo) => {
  const response = await fetch(`${API_BASE}/api/find-replacement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shiftInfo)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to find replacement');
  }

  return response.json();
};

/**
 * Check if backend is healthy
 * @returns {Promise<boolean>}
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch (err) {
    return false;
  }
};

/**
 * Cancel a running job
 * @param {string} jobId - The job ID to cancel
 * @returns {Promise<Object>}
 */
export const cancelJob = async (jobId) => {
  const response = await fetch(`${API_BASE}/api/job/${jobId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to cancel job');
  }

  return response.json();
};

// ==================== PLAN PERSISTENCE API ====================

/**
 * Create a new plan
 * @param {Object} planData - Plan data to save
 * @returns {Promise<Object>} - Saved plan with ID
 */
export const createPlan = async (planData) => {
  const response = await fetch(`${API_BASE}/plans/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(planData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create plan');
  }

  return response.json();
};

/**
 * Update an existing plan
 * @param {string} planId - Plan ID to update
 * @param {Object} planData - Updated plan data
 * @returns {Promise<Object>}
 */
export const updatePlan = async (planId, planData) => {
  const response = await fetch(`${API_BASE}/plans/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(planData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update plan');
  }

  return response.json();
};

/**
 * Update only the schedule data of a plan (for manual edits)
 * @param {string} planId - Plan ID to update
 * @param {Object} scheduleData - New schedule data
 * @returns {Promise<Object>}
 */
export const updatePlanSchedule = async (planId, scheduleData) => {
  const response = await fetch(`${API_BASE}/plans/${planId}/schedule`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scheduleData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update plan schedule');
  }

  return response.json();
};

/**
 * Get all plans
 * @returns {Promise<Array>}
 */
export const getPlans = async () => {
  const response = await fetch(`${API_BASE}/plans/`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch plans');
  }

  return response.json();
};

/**
 * Get plans for a specific month
 * @param {string} month - Month in format YYYY-MM
 * @returns {Promise<Array>}
 */
export const getPlansByMonth = async (month) => {
  const response = await fetch(`${API_BASE}/plans/month/${month}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch plans for month');
  }

  return response.json();
};

/**
 * Get a specific plan by ID
 * @param {string} planId - Plan ID
 * @returns {Promise<Object>}
 */
export const getPlan = async (planId) => {
  const response = await fetch(`${API_BASE}/plans/${planId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch plan');
  }

  return response.json();
};

/**
 * Delete a plan
 * @param {string} planId - Plan ID to delete
 * @returns {Promise<Object>}
 */
export const deletePlan = async (planId) => {
  const response = await fetch(`${API_BASE}/plans/${planId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete plan');
  }

  return response.json();
};

/**
 * Activate a plan (mark as the active plan for its month)
 * @param {string} planId - Plan ID to activate
 * @returns {Promise<Object>}
 */
export const activatePlan = async (planId) => {
  const response = await fetch(`${API_BASE}/plans/${planId}/activate`, {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to activate plan');
  }

  return response.json();
};

// ==================== AVAILABILITY PERSISTENCE API ====================

/**
 * Get availability data for a specific month
 * @param {string} month - Month in format YYYY-MM
 * @returns {Promise<Object|null>} - Availability data or null if not found
 */
export const getAvailabilityByMonth = async (month) => {
  const response = await fetch(`${API_BASE}/availabilities/month/${month}`);

  if (response.status === 404) {
    return null; // No availability for this month yet
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch availability');
  }

  return response.json();
};

/**
 * Save or update availability data for a month
 * @param {string} month - Month in format YYYY-MM
 * @param {Object} availabilityData - Availability data (employee_initials -> day -> code)
 * @returns {Promise<Object>}
 */
export const saveAvailabilityByMonth = async (month, availabilityData) => {
  const response = await fetch(`${API_BASE}/availabilities/month/${month}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availability_data: availabilityData })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to save availability');
  }

  return response.json();
};

// ==================== RULE PARSING API ====================

/**
 * Parse natural language rules using LLM
 * @param {Object} config - Configuration for rule parsing
 * @param {string[]} config.ruleTexts - Array of rule text strings to parse
 * @param {Object[]} config.employees - Array of employee objects
 * @param {Object[]} config.shifts - Array of shift objects
 * @param {Object} [config.availabilityCodes] - Optional availability code mappings
 * @returns {Promise<Object>} - Parsed rules with warnings and ambiguities
 */
export const parseRulesWithLLM = async (config) => {
  const response = await fetch(`${API_BASE}/api/parse-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rule_texts: config.ruleTexts,
      employees: config.employees,
      shifts: config.shifts,
      availability_codes: config.availabilityCodes || {
        U: 'Urlaub',
        K: 'Krank',
        SU: 'Sonderurlaub',
        MU: 'Mutterschutz',
        EZ: 'Elternzeit',
        BV: 'Beschäftigungsverbot',
        uw: 'Unbezahlter Urlaub'
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to parse rules');
  }

  return response.json();
};
