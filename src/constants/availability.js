// Availability codes that indicate employee IS available (fully or partially)
export const AVAILABLE_CODES = new Set(['if', '14', '15', 'pr']);
export const PARTIAL_AVAILABILITY_CODES = new Set(['14', '15', 'ka']);

// Human-readable availability messages
export const getAvailabilityMessage = (employeeInitials, day, code, isViolation) => {
  const dayNum = parseInt(day, 10);

  if (!code) {
    return isViolation
      ? `KONFLIKT: ${employeeInitials} hat am ${dayNum}. keine Verfügbarkeit eingetragen`
      : `${employeeInitials} hat am ${dayNum}. keine Verfügbarkeit eingetragen`;
  }

  const messages = {
    'uw': `${employeeInitials} hat am ${dayNum}. Urlaub beantragt`,
    'nd': `${employeeInitials} ist am ${dayNum}. abwesend`,
    'EZ': `${employeeInitials} ist am ${dayNum}. in Elternzeit`,
    'rot': `${employeeInitials} ist am ${dayNum}. in Rotation`,
    'FZA': `${employeeInitials} hat am ${dayNum}. Freizeitausgleich`,
    'St': `${employeeInitials} ist am ${dayNum}. auf Station`,
    'Co': `${employeeInitials} ist am ${dayNum}. bei COVID-Studie`,
    '14': `${employeeInitials} ist am ${dayNum}. nur bis 14 Uhr verfügbar`,
    '15': `${employeeInitials} ist am ${dayNum}. nur bis 15:15 Uhr verfügbar`,
    'ka': `${employeeInitials} ist am ${dayNum}. nicht für Ambulanz verfügbar`,
    'avd': `${employeeInitials} hat am ${dayNum}. AVD frei`,
    '?': `${employeeInitials} hat am ${dayNum}. unklare Verfügbarkeit`,
  };

  const baseMessage = messages[code] || `${employeeInitials} ist am ${dayNum}. nicht verfügbar (${code})`;
  return isViolation ? `KONFLIKT: ${baseMessage}` : baseMessage;
};
