/**
 * Helper functions for the Hospital Roster application
 */

/**
 * Get rules that apply to a specific employee
 * @param {Array} rules - All rules
 * @param {string} employeeName - Employee name
 * @returns {Array} Applicable rules
 */
export const getRulesForEmployee = (rules, employeeName) => {
  return rules.filter(
    (rule) =>
      rule.appliesTo === 'all' ||
      rule.appliesTo === employeeName.replace('Dr. ', '')
  );
};

/**
 * Generate violation tooltip based on employee and context
 * @param {string} employeeInitials - Employee initials
 * @param {string} day - Day string
 * @param {string} shift - Shift name
 * @returns {string} Violation message
 */
export const getViolationTooltip = (employeeInitials, day, shift) => {
  const violations = [
    'Ruhezeit-Verletzung: Weniger als 11 Stunden zwischen Schichten',
    'Maximale Wochenarbeitszeit überschritten (>48h)',
    'Keine Qualifikation für diese Schicht vorhanden',
    'Maximale Anzahl Nachtdienste pro Monat überschritten',
    'Wochenend-Regel: Mehr als 2 Wochenenddienste im Monat',
    'Konflikt mit eingetragenem Urlaub/Abwesenheit',
    'Mindestanzahl freie Tage nicht eingehalten',
  ];

  // Return specific violations for demo
  if (employeeInitials === 'DH' && day === '08') {
    return 'Ruhezeit-Verletzung: Weniger als 11 Stunden zwischen Schichten';
  } else if (employeeInitials === 'MM' && day === '06') {
    return 'Maximale Wochenarbeitszeit überschritten (>48h)';
  } else if (employeeInitials === 'VG' && day === '11') {
    return 'Wochenend-Regel: Mehr als 2 Wochenenddienste im Monat';
  }

  return violations[Math.floor(Math.random() * violations.length)];
};

/**
 * Get detailed information about an employee
 * @param {Object} employee - Employee object
 * @returns {Object} Detailed employee info
 */
export const getEmployeeDetailedInfo = (employee) => {
  const contractYears = {
    Chefarzt: 15,
    Oberarzt: 8,
    Facharzt: 4,
    Assistenzarzt: 2,
  };

  const daysWorkedThisMonth = Math.floor(Math.random() * 15) + 10;
  const overtimeHours = Math.floor(Math.random() * 20) - 5;

  return {
    yearsOfService: contractYears[employee.contract] || 3,
    qualificationsList: employee.qualifications,
    unavailable: employee.initials === 'DH' ? 'Urlaub' : null,
    nextVacation: employee.initials === 'MM' ? '2025-11-15' : null,
    daysWorkedThisMonth,
    overtimeHours,
    currentShiftLoad: Math.floor(Math.random() * 5) + 3,
    preferredShifts: ['PP', 'OA', 'Allgem'].slice(
      0,
      Math.floor(Math.random() * 3) + 1
    ),
  };
};

/**
 * Get detailed information about a shift
 * @param {Object} shift - Shift object
 * @returns {Object} Detailed shift info
 */
export const getShiftDetailedInfo = (shift) => {
  const staffingLevels = {
    PP: { required: 2, current: 1, optimal: 3 },
    OA: { required: 1, current: 1, optimal: 2 },
    Allgem: { required: 1, current: 0, optimal: 2 },
    BK: { required: 1, current: 1, optimal: 1 },
  };

  const defaultStaffing = {
    required: 1,
    current: Math.floor(Math.random() * 2),
    optimal: 2,
  };

  return {
    staffing: staffingLevels[shift.name] || defaultStaffing,
    historicalData: {
      averageStaff: 1.5,
      peakTimes: '08:00-12:00',
      commonIssues: ['Unterbesetzung', 'Qualifikationsmangel'],
    },
    qualifiedEmployees: Math.floor(Math.random() * 10) + 5,
    lastIncident: null,
    upcomingChanges: shift.name === 'BK' ? 'Neue ABS-Richtlinien ab 01.12.' : null,
  };
};

/**
 * Parse natural language text into rules
 * @param {string} text - Natural language input
 * @param {number} nextId - Next rule ID
 * @returns {Array} Parsed rules
 */
export const parseNaturalLanguage = (text, nextId) => {
  const parsed = [];
  let currentId = nextId;

  // Vacation/unavailability pattern
  if (
    text.toLowerCase().includes('urlaub') ||
    text.toLowerCase().includes('nicht verfügbar') ||
    text.toLowerCase().includes('abwesend')
  ) {
    const nameMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    const dateMatch = text.match(
      /(\d{1,2}\.\s*\w+|\d{1,2}\.\d{1,2}\.?|\d{4}-\d{2}-\d{2})/
    );

    if (nameMatch) {
      parsed.push({
        id: currentId++,
        type: 'hard',
        text: `${nameMatch[1]} ist ${dateMatch ? `am ${dateMatch[1]}` : 'im angegebenen Zeitraum'} nicht verfügbar`,
        source: 'nl',
        category: 'Urlaub',
        appliesTo: nameMatch[1],
      });
    }
  }

  // Day preference pattern
  if (
    text.toLowerCase().includes('montag') ||
    text.toLowerCase().includes('dienstag') ||
    text.toLowerCase().includes('mittwoch') ||
    text.toLowerCase().includes('donnerstag') ||
    text.toLowerCase().includes('freitag')
  ) {
    const dayMatch = text.match(
      /(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)/i
    );
    const nameMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);

    if (dayMatch) {
      parsed.push({
        id: currentId++,
        type: 'soft',
        text: `${nameMatch ? nameMatch[1] : 'Mitarbeiter'} bevorzugt ${text.includes('nicht') ? 'keinen Dienst' : 'Dienst'} am ${dayMatch[1]}`,
        source: 'nl',
        category: 'Präferenz',
        appliesTo: nameMatch ? nameMatch[1] : 'all',
      });
    }
  }

  // Maximum shifts pattern
  if (
    text.toLowerCase().includes('max') ||
    text.toLowerCase().includes('höchstens')
  ) {
    const numberMatch = text.match(/(\d+)/);
    const shiftMatch = text.match(
      /(nachtdienst|wochenenddienst|schicht|dienst)/i
    );

    if (numberMatch && shiftMatch) {
      parsed.push({
        id: currentId++,
        type: 'soft',
        text: `Maximal ${numberMatch[1]} ${shiftMatch[1]}e pro Monat`,
        source: 'nl',
        category: 'Fairness',
        appliesTo: 'all',
      });
    }
  }

  // Rest time pattern
  if (
    text.toLowerCase().includes('ruhezeit') ||
    text.toLowerCase().includes('pause') ||
    text.toLowerCase().includes('stunden zwischen')
  ) {
    const hoursMatch = text.match(/(\d+)\s*stunden/i);

    parsed.push({
      id: currentId++,
      type: 'hard',
      text: `Mindestens ${hoursMatch ? hoursMatch[1] : '11'} Stunden Ruhezeit zwischen Schichten`,
      source: 'nl',
      category: 'Arbeitszeitgesetz',
      appliesTo: 'all',
    });
  }

  // Qualification pattern
  if (
    text.toLowerCase().includes('qualifikation') ||
    text.toLowerCase().includes('zertifizierung') ||
    text.toLowerCase().includes('berechtigung')
  ) {
    const qualMatch = text.match(
      /(facharzt|oberarzt|abs|notfall|chefarzt)/i
    );
    const shiftMatch = text.match(/(PP|OA|BK|Konsil)/i);

    if (qualMatch || shiftMatch) {
      parsed.push({
        id: currentId++,
        type: 'hard',
        text: `${shiftMatch ? shiftMatch[1] + '-Schicht' : 'Schicht'} erfordert ${qualMatch ? qualMatch[1] + '-Qualifikation' : 'spezielle Qualifikation'}`,
        source: 'nl',
        category: 'Qualifikation',
        appliesTo: 'all',
      });
    }
  }

  // Consecutive days pattern
  if (
    text.toLowerCase().includes('hintereinander') ||
    text.toLowerCase().includes('aufeinander') ||
    text.toLowerCase().includes('in folge')
  ) {
    const numberMatch = text.match(/(\d+)/);

    parsed.push({
      id: currentId++,
      type: 'hard',
      text: `Maximal ${numberMatch ? numberMatch[1] : '5'} Arbeitstage hintereinander`,
      source: 'nl',
      category: 'Arbeitszeitgesetz',
      appliesTo: 'all',
    });
  }

  // Default fallback
  if (parsed.length === 0) {
    parsed.push({
      id: currentId++,
      type: 'soft',
      text: text,
      source: 'nl',
      category: 'Sonstiges',
      appliesTo: 'all',
    });
  }

  return parsed;
};

/**
 * Find emergency coverage options
 * @param {Object} context - Coverage request context
 * @param {Array} employees - All employees
 * @param {Array} rules - All rules
 * @returns {Array} Suitable replacement options
 */
export const findEmergencyCoverage = (context, employees, rules) => {
  const { employee: targetEmployee, day, station } = context;

  return employees
    .filter((emp) => emp.initials !== targetEmployee)
    .map((emp) => {
      const isQualified = emp.qualifications.includes('Facharzt');
      const hasConflict = Math.random() > 0.7;
      const isPreferred = emp.contract === 'Oberarzt' || emp.contract === 'Facharzt';

      return {
        employee: emp,
        score: isQualified ? 10 : 5 + (isPreferred ? 3 : 0) - (hasConflict ? 8 : 0),
        isQualified,
        hasConflict,
        conflictReason: hasConflict
          ? 'Bereits eingeplant oder Ruhezeit-Verletzung'
          : null,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

/**
 * Get category badge color based on category name
 * @param {string} category - Category name
 * @returns {string} Tailwind color classes
 */
export const getCategoryBadgeColor = (category) => {
  const colors = {
    Arbeitszeitgesetz: 'bg-red-100 text-red-800',
    Qualifikation: 'bg-purple-100 text-purple-800',
    Besetzung: 'bg-blue-100 text-blue-800',
    Präferenz: 'bg-green-100 text-green-800',
    Urlaub: 'bg-yellow-100 text-yellow-800',
    Fairness: 'bg-orange-100 text-orange-800',
    Sonstiges: 'bg-gray-100 text-gray-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Generate random ID
 * @returns {string} Random ID
 */
export const generateId = () => {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
