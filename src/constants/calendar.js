// Calendar constants

// Weekday names (German, starting with Sunday)
export const WEEKDAY_NAMES_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const WEEKDAY_NAMES_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

// Month names (German)
export const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// Get current date info
export const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

export const getCurrentYear = () => new Date().getFullYear();
export const getCurrentMonthIndex = () => new Date().getMonth(); // 0-indexed

// Get first and last day of current month
export const getMonthStartDate = (yearMonth = getCurrentMonth()) => {
  return `${yearMonth}-01`;
};

export const getMonthEndDate = (yearMonth = getCurrentMonth()) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${yearMonth}-${lastDay.toString().padStart(2, '0')}`;
};

// Get number of days in a month
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// Parse year-month string to components
export const parseYearMonth = (yearMonth) => {
  if (!yearMonth) {
    return [getCurrentYear(), getCurrentMonthIndex()];
  }
  const parts = yearMonth.split('-');
  return [parseInt(parts[0], 10), parseInt(parts[1], 10) - 1]; // month is 0-indexed
};

// Get month name from year-month string (YYYY-MM)
export const getMonthName = (yearMonth) => {
  if (!yearMonth) return '';
  const [, month] = parseYearMonth(yearMonth);
  return MONTH_NAMES[month];
};

// Format date for display
export const formatDateGerman = (date) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
