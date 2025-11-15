/**
 * Hospital Roster Data Models
 *
 * This file defines the core data models for the hospital roster planning system.
 * All types are documented with JSDoc for type safety and IDE support.
 */

// ============================================================================
// ENUMS / CONSTANTS
// ============================================================================

/**
 * Contract types for hospital staff
 * @readonly
 * @enum {string}
 */
export const ContractType = {
  CHEFARZT: 'Chefarzt',           // Chief Physician
  OBERARZT: 'Oberarzt',           // Senior Physician
  FACHARZT: 'Facharzt',           // Specialist
  ASSISTENZARZT: 'Assistenzarzt', // Resident Doctor
};

/**
 * Staff qualification types
 * @readonly
 * @enum {string}
 */
export const Qualification = {
  FACHARZT: 'Facharzt',                           // Board certified specialist
  FACHARZT_IN_AUSBILDUNG: 'Facharzt in Ausbildung', // Specialist in training
  NOTFALLZERTIFIZIERUNG: 'Notfallzertifizierung', // Emergency certification
  CHEFARZT: 'Chefarzt',                           // Chief physician qualification
  CHEFARZT_VERTRETUNG: 'Chefarzt-Vertretung',    // Chief deputy
  ABS_ZERTIFIZIERT: 'ABS-zertifiziert',          // Antibiotic Stewardship certified
  REISEMEDIZIN: 'Reisemedizin',                  // Travel medicine
  TROPENMEDIZIN: 'Tropenmedizin',                // Tropical medicine
  INFEKTIOLOGIE: 'Infektiologie',                // Infectious diseases
};

/**
 * Shift categories / departments
 * @readonly
 * @enum {string}
 */
export const ShiftCategory = {
  ALLGEMEIN: 'Allgemein',             // General
  AMBULANZEN: 'Ambulanzen',           // Outpatient Clinics
  KONSILIARDIENST: 'Konsiliardienst', // Consultation Service
  ABS: 'ABS',                         // Antibiotic Stewardship
  STATION: 'Station v. Frer.',        // Ward/Station
  LEHRE: 'Lehre',                     // Teaching
  SONSTIGES: 'Sonstiges',             // Other
  FORSCHUNG: 'Forschung',             // Research
};

/**
 * Station/unit identifiers
 * @readonly
 * @enum {string}
 */
export const Station = {
  ALLGEMEIN: 'Allgemein',
  AMBULANZEN: 'Ambulanzen',
  KONSILIARDIENST: 'Konsiliardienst',
  ABS: 'ABS',
  STATION_V_FRER: 'Station v. Frer.',
  LEHRE: 'Lehre',
  SONSTIGES: 'Sonstiges',
  FORSCHUNG: 'Forschung',
};

/**
 * Employee availability status codes
 * @readonly
 * @enum {string}
 */
export const AvailabilityCode = {
  ANWESEND_VOLLZEIT: 'if',      // Present full-time
  ANWESEND_TEILZEIT: 'it',      // Present part-time
  URLAUBS_WUNSCH: 'uw',         // Vacation request
  URLAUB_GENEHMIGT: 'ug',       // Vacation approved
  KRANK: 'kr',                   // Sick
  FORTBILDUNG: 'fb',            // Training/education
  KONGRESS: 'ko',               // Conference
  ELTERNZEIT: 'EZ',             // Parental leave
  MUTTERSCHUTZ: 'ms',           // Maternity protection
  SONDERURLAUB: 'su',           // Special leave
  DIENSTREISE: 'dr',            // Business trip
  RUFBEREITSCHAFT: 'rb',        // On-call
  NACHTDIENST: 'nd',            // Night shift
  WOCHENENDDIENST: 'we',        // Weekend duty
  FREI_NACH_DIENST: 'fnd',      // Off after duty
  AUSGLEICHSTAG: 'at',          // Compensation day
  UNBEZAHLTER_URLAUB: 'uu',     // Unpaid leave
  SONSTIGES: 'so',              // Other
};

/**
 * Rule types for scheduling constraints
 * @readonly
 * @enum {string}
 */
export const RuleType = {
  HARD: 'hard', // Mandatory constraints that cannot be violated
  SOFT: 'soft', // Optimization goals that should be minimized
};

/**
 * Rule categories for organization
 * @readonly
 * @enum {string}
 */
export const RuleCategory = {
  ARBEITSZEITGESETZ: 'Arbeitszeitgesetz',     // Working time law
  QUALIFIKATION: 'Qualifikation',             // Qualification requirements
  BESETZUNG: 'Besetzung',                     // Staffing requirements
  PRAEFERENZ: 'Präferenz',                    // Preferences
  RUHEZEIT: 'Ruhezeit',                       // Rest periods
  URLAUB: 'Urlaub',                           // Vacation
  FAIRNESS: 'Fairness',                       // Fair distribution
  SONSTIGES: 'Sonstiges',                     // Other
};

// ============================================================================
// CORE DATA MODELS
// ============================================================================

/**
 * @typedef {Object} Employee
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Full name of the employee
 * @property {string} initials - Short identifier (2-3 letters)
 * @property {ContractType} contractType - Employment contract type
 * @property {number} weeklyHours - Contracted weekly working hours
 * @property {Qualification[]} qualifications - List of certifications and qualifications
 * @property {string} [email] - Work email address
 * @property {string} [phone] - Contact phone number
 * @property {string} [employeeNumber] - Internal employee number
 * @property {string} [startDate] - Employment start date (ISO 8601)
 * @property {boolean} [isActive] - Whether employee is currently active
 * @property {string} [department] - Primary department assignment
 * @property {string} [notes] - Additional notes about the employee
 */

/**
 * @typedef {Object} TimeRange
 * @property {string} start - Start time in HH:MM format
 * @property {string} end - End time in HH:MM format
 */

/**
 * @typedef {Object} Shift
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Short shift identifier (e.g., 'PP', 'OA')
 * @property {string} displayName - Human-readable shift name
 * @property {ShiftCategory} category - Department/category the shift belongs to
 * @property {string} description - Detailed description of the shift
 * @property {Station} station - Hospital station/unit
 * @property {TimeRange|string} time - Shift time range or flexible indicator
 * @property {number} [durationMinutes] - Shift duration in minutes
 * @property {string[]} requirements - Staffing requirements (e.g., 'Min. 1 Person', 'Oberarzt')
 * @property {string[]} rules - Specific constraints for this shift
 * @property {string} [color] - Tailwind color class for display
 * @property {boolean} [isActive] - Whether shift type is currently in use
 * @property {number} [sortOrder] - Display order within category
 */

/**
 * @typedef {Object} ShiftAssignment
 * @property {string} id - Unique identifier for this assignment
 * @property {string} employeeId - Reference to Employee.id
 * @property {string} shiftId - Reference to Shift.id
 * @property {string} date - Assignment date (ISO 8601 date string YYYY-MM-DD)
 * @property {Station} station - Station where the shift is performed
 * @property {boolean} [isLocked] - Whether assignment is locked from changes
 * @property {boolean} [hasViolation] - Whether assignment violates any rules
 * @property {string[]} [violations] - List of violated rule IDs
 * @property {string} [notes] - Additional notes about this assignment
 * @property {string} [createdAt] - When assignment was created (ISO 8601)
 * @property {string} [updatedAt] - When assignment was last modified (ISO 8601)
 * @property {string} [createdBy] - User who created the assignment
 */

/**
 * @typedef {Object} EmployeeAvailability
 * @property {string} id - Unique identifier
 * @property {string} employeeId - Reference to Employee.id
 * @property {string} date - Date of availability (ISO 8601 date string)
 * @property {AvailabilityCode} status - Availability status code
 * @property {string} [notes] - Additional notes
 * @property {boolean} [isApproved] - Whether status change is approved
 * @property {string} [approvedBy] - Who approved the status
 */

/**
 * @typedef {Object} SchedulingRule
 * @property {string} id - Unique identifier
 * @property {RuleType} type - Hard (mandatory) or soft (optimization goal)
 * @property {string} text - Human-readable rule description
 * @property {RuleCategory} category - Category for organization
 * @property {string} appliesTo - 'all' or specific employee/shift ID
 * @property {string} [source] - Where rule was defined ('form', 'nl', 'system')
 * @property {number} [weight] - For soft rules, priority weight (1-10)
 * @property {boolean} [isActive] - Whether rule is currently enforced
 * @property {string} [createdAt] - When rule was created
 * @property {Object} [parameters] - Additional rule-specific parameters
 */

/**
 * @typedef {Object} RuleViolation
 * @property {string} id - Unique identifier
 * @property {string} ruleId - Reference to violated SchedulingRule.id
 * @property {string} assignmentId - Reference to violating ShiftAssignment.id
 * @property {string} severity - 'error' for hard rules, 'warning' for soft rules
 * @property {string} message - Human-readable violation description
 * @property {string} [suggestedFix] - Suggested resolution
 */

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a new Employee object with default values
 * @param {Partial<Employee>} data - Initial employee data
 * @returns {Employee} Complete employee object
 */
export function createEmployee(data) {
  return {
    id: data.id || crypto.randomUUID(),
    name: data.name || '',
    initials: data.initials || '',
    contractType: data.contractType || ContractType.ASSISTENZARZT,
    weeklyHours: data.weeklyHours || 40,
    qualifications: data.qualifications || [],
    email: data.email || '',
    phone: data.phone || '',
    employeeNumber: data.employeeNumber || '',
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    isActive: data.isActive !== undefined ? data.isActive : true,
    department: data.department || '',
    notes: data.notes || '',
  };
}

/**
 * Creates a new Shift object with default values
 * @param {Partial<Shift>} data - Initial shift data
 * @returns {Shift} Complete shift object
 */
export function createShift(data) {
  return {
    id: data.id || crypto.randomUUID(),
    name: data.name || '',
    displayName: data.displayName || data.name || '',
    category: data.category || ShiftCategory.ALLGEMEIN,
    description: data.description || '',
    station: data.station || Station.ALLGEMEIN,
    time: data.time || { start: '08:00', end: '16:00' },
    durationMinutes: data.durationMinutes || calculateDuration(data.time),
    requirements: data.requirements || [],
    rules: data.rules || [],
    color: data.color || '',
    isActive: data.isActive !== undefined ? data.isActive : true,
    sortOrder: data.sortOrder || 0,
  };
}

/**
 * Creates a new ShiftAssignment object
 * @param {Partial<ShiftAssignment>} data - Initial assignment data
 * @returns {ShiftAssignment} Complete assignment object
 */
export function createShiftAssignment(data) {
  const now = new Date().toISOString();
  return {
    id: data.id || crypto.randomUUID(),
    employeeId: data.employeeId || '',
    shiftId: data.shiftId || '',
    date: data.date || new Date().toISOString().split('T')[0],
    station: data.station || Station.ALLGEMEIN,
    isLocked: data.isLocked || false,
    hasViolation: data.hasViolation || false,
    violations: data.violations || [],
    notes: data.notes || '',
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    createdBy: data.createdBy || '',
  };
}

/**
 * Creates a new SchedulingRule object
 * @param {Partial<SchedulingRule>} data - Initial rule data
 * @returns {SchedulingRule} Complete rule object
 */
export function createSchedulingRule(data) {
  return {
    id: data.id || crypto.randomUUID(),
    type: data.type || RuleType.SOFT,
    text: data.text || '',
    category: data.category || RuleCategory.SONSTIGES,
    appliesTo: data.appliesTo || 'all',
    source: data.source || 'form',
    weight: data.weight || 5,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: data.createdAt || new Date().toISOString(),
    parameters: data.parameters || {},
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculates shift duration in minutes from time range
 * @param {TimeRange|string} time - Time range object or string
 * @returns {number} Duration in minutes
 */
function calculateDuration(time) {
  if (!time || typeof time === 'string') {
    return 480; // Default 8 hours
  }

  const [startHour, startMin] = time.start.split(':').map(Number);
  const [endHour, endMin] = time.end.split(':').map(Number);

  let duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

  // Handle overnight shifts
  if (duration < 0) {
    duration += 24 * 60;
  }

  return duration;
}

/**
 * Validates an Employee object
 * @param {Employee} employee - Employee to validate
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateEmployee(employee) {
  const errors = [];

  if (!employee.name || employee.name.trim() === '') {
    errors.push('Employee name is required');
  }

  if (!employee.initials || employee.initials.trim() === '') {
    errors.push('Employee initials are required');
  }

  if (employee.initials && (employee.initials.length < 2 || employee.initials.length > 4)) {
    errors.push('Initials must be 2-4 characters');
  }

  if (!Object.values(ContractType).includes(employee.contractType)) {
    errors.push('Invalid contract type');
  }

  if (employee.weeklyHours < 0 || employee.weeklyHours > 60) {
    errors.push('Weekly hours must be between 0 and 60');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a Shift object
 * @param {Shift} shift - Shift to validate
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateShift(shift) {
  const errors = [];

  if (!shift.name || shift.name.trim() === '') {
    errors.push('Shift name is required');
  }

  if (!Object.values(ShiftCategory).includes(shift.category)) {
    errors.push('Invalid shift category');
  }

  if (!Object.values(Station).includes(shift.station)) {
    errors.push('Invalid station');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets display color class for an employee based on contract type
 * @param {ContractType} contractType
 * @returns {string} Tailwind color class
 */
export function getContractTypeColor(contractType) {
  const colors = {
    [ContractType.CHEFARZT]: 'bg-red-100 text-red-800',
    [ContractType.OBERARZT]: 'bg-orange-100 text-orange-800',
    [ContractType.FACHARZT]: 'bg-blue-100 text-blue-800',
    [ContractType.ASSISTENZARZT]: 'bg-green-100 text-green-800',
  };
  return colors[contractType] || 'bg-gray-100 text-gray-800';
}

/**
 * Checks if an employee has a specific qualification
 * @param {Employee} employee
 * @param {Qualification} qualification
 * @returns {boolean}
 */
export function hasQualification(employee, qualification) {
  return employee.qualifications.includes(qualification);
}

/**
 * Checks if an employee meets shift requirements
 * @param {Employee} employee
 * @param {Shift} shift
 * @returns {{ canWork: boolean, missingRequirements: string[] }}
 */
export function checkShiftRequirements(employee, shift) {
  const missingRequirements = [];

  for (const requirement of shift.requirements) {
    // Check contract type requirements
    if (requirement === 'Oberarzt' &&
        employee.contractType !== ContractType.OBERARZT &&
        employee.contractType !== ContractType.CHEFARZT) {
      missingRequirements.push('Requires Oberarzt or Chefarzt');
    }

    if (requirement === 'Facharzt' &&
        !hasQualification(employee, Qualification.FACHARZT)) {
      missingRequirements.push('Requires Facharzt qualification');
    }

    if (requirement === 'ABS-zertifiziert' &&
        !hasQualification(employee, Qualification.ABS_ZERTIFIZIERT)) {
      missingRequirements.push('Requires ABS certification');
    }
  }

  return {
    canWork: missingRequirements.length === 0,
    missingRequirements,
  };
}
