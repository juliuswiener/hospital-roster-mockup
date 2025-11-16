import { API_BASE } from '../config/api';

/**
 * Generic fetch wrapper with error handling and fallback support
 * @param {string} endpoint - API endpoint (relative to API_BASE)
 * @param {object} options - Fetch options
 * @returns {Promise<{success: boolean, data: any, error?: string}>}
 */
export const apiFetch = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      return { success: false, data: null, error: `HTTP ${response.status}` };
    }
  } catch (err) {
    return { success: false, data: null, error: err.message };
  }
};

/**
 * Create a new entity on the backend
 * @param {string} endpoint - API endpoint
 * @param {object} data - Data to create
 * @returns {Promise<{success: boolean, data: any}>}
 */
export const createEntity = async (endpoint, data) => {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing entity on the backend
 * @param {string} endpoint - API endpoint (including ID)
 * @param {object} data - Data to update
 * @returns {Promise<{success: boolean, data: any}>}
 */
export const updateEntity = async (endpoint, data) => {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete an entity from the backend
 * @param {string} endpoint - API endpoint (including ID)
 * @returns {Promise<{success: boolean}>}
 */
export const deleteEntity = async (endpoint) => {
  return apiFetch(endpoint, {
    method: 'DELETE',
  });
};

/**
 * Load entities from the backend
 * @param {string} endpoint - API endpoint
 * @returns {Promise<{success: boolean, data: any[]}>}
 */
export const loadEntities = async (endpoint) => {
  return apiFetch(endpoint);
};

/**
 * Generate unique initials for an employee
 * @param {string} name - Employee name
 * @param {string[]} existingInitials - List of existing initials to avoid
 * @returns {string} Unique initials
 */
export const generateUniqueInitials = (name, existingInitials) => {
  const nameParts = name.trim().split(' ');
  let baseInitials;

  if (nameParts.length === 1) {
    baseInitials = nameParts[0].substring(0, Math.min(3, nameParts[0].length)).toUpperCase();
  } else {
    baseInitials = nameParts.map(p => p[0]).join('').toUpperCase();
  }

  let initials = baseInitials;
  let counter = 1;
  while (existingInitials.includes(initials)) {
    initials = `${baseInitials}${counter}`;
    counter++;
  }

  return initials;
};

/**
 * Map backend employee schema to frontend schema
 * @param {object} backendEmployee - Employee from backend
 * @returns {object} Frontend employee object
 */
export const mapBackendToFrontendEmployee = (emp) => ({
  ...emp,
  contract: emp.contract_type || emp.contract,
  hours: emp.weekly_hours || emp.hours,
  color: emp.color || 'blue',
  colorClass: emp.color_class || emp.colorClass || null,
});

/**
 * Map frontend employee schema to backend schema
 * @param {object} frontendEmployee - Employee from frontend
 * @returns {object} Backend employee object
 */
export const mapFrontendToBackendEmployee = (emp) => ({
  name: emp.name,
  initials: emp.initials,
  contract_type: emp.contract,
  weekly_hours: emp.hours,
  qualifications: emp.qualifications || [],
  color: emp.color || 'blue',
  color_class: emp.colorClass || null,
});
