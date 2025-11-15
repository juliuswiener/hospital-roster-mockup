/**
 * API client for the OR-Tools roster solver backend
 */

const API_BASE = 'http://localhost:8000';

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
    const response = await fetch(`${API_BASE}/api/health`);
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
