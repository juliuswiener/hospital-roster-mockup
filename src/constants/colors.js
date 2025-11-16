// Color options for employees and shifts

// Available color options for employees (light backgrounds)
export const EMPLOYEE_COLOR_OPTIONS = [
  { name: 'red', bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-900', label: 'Rot' },
  { name: 'orange', bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-900', label: 'Orange' },
  { name: 'amber', bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-900', label: 'Bernstein' },
  { name: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-900', label: 'Gelb' },
  { name: 'lime', bg: 'bg-lime-100', border: 'border-lime-400', text: 'text-lime-900', label: 'Limette' },
  { name: 'green', bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900', label: 'Grün' },
  { name: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-900', label: 'Smaragd' },
  { name: 'teal', bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-900', label: 'Türkis' },
  { name: 'cyan', bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-900', label: 'Cyan' },
  { name: 'sky', bg: 'bg-sky-100', border: 'border-sky-400', text: 'text-sky-900', label: 'Himmel' },
  { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900', label: 'Blau' },
  { name: 'indigo', bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-900', label: 'Indigo' },
  { name: 'violet', bg: 'bg-violet-100', border: 'border-violet-400', text: 'text-violet-900', label: 'Violett' },
  { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900', label: 'Lila' },
  { name: 'fuchsia', bg: 'bg-fuchsia-100', border: 'border-fuchsia-400', text: 'text-fuchsia-900', label: 'Fuchsia' },
  { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-900', label: 'Pink' },
  { name: 'rose', bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-900', label: 'Rosa' },
];

// Default employee color
export const DEFAULT_EMPLOYEE_COLOR = 'blue';
export const DEFAULT_EMPLOYEE_COLOR_INDEX = 10; // Index of blue in EMPLOYEE_COLOR_OPTIONS

// Get color class string for an employee color name
export const getEmployeeColorClass = (colorName) => {
  const colorOption = EMPLOYEE_COLOR_OPTIONS.find(c => c.name === colorName) || EMPLOYEE_COLOR_OPTIONS[DEFAULT_EMPLOYEE_COLOR_INDEX];
  return `${colorOption.bg} ${colorOption.border} ${colorOption.text}`;
};

// Get color option by name
export const getEmployeeColorOption = (colorName) => {
  return EMPLOYEE_COLOR_OPTIONS.find(c => c.name === colorName) || EMPLOYEE_COLOR_OPTIONS[DEFAULT_EMPLOYEE_COLOR_INDEX];
};

// Quick lookup map for employee colors (light backgrounds) - explicit classes for Tailwind JIT
export const EMPLOYEE_COLOR_MAP = {
  red: 'bg-red-100 border-red-400 text-red-900',
  orange: 'bg-orange-100 border-orange-400 text-orange-900',
  amber: 'bg-amber-100 border-amber-400 text-amber-900',
  yellow: 'bg-yellow-100 border-yellow-400 text-yellow-900',
  lime: 'bg-lime-100 border-lime-400 text-lime-900',
  green: 'bg-green-100 border-green-400 text-green-900',
  emerald: 'bg-emerald-100 border-emerald-400 text-emerald-900',
  teal: 'bg-teal-100 border-teal-400 text-teal-900',
  cyan: 'bg-cyan-100 border-cyan-400 text-cyan-900',
  sky: 'bg-sky-100 border-sky-400 text-sky-900',
  blue: 'bg-blue-100 border-blue-400 text-blue-900',
  indigo: 'bg-indigo-100 border-indigo-400 text-indigo-900',
  violet: 'bg-violet-100 border-violet-400 text-violet-900',
  purple: 'bg-purple-100 border-purple-400 text-purple-900',
  fuchsia: 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900',
  pink: 'bg-pink-100 border-pink-400 text-pink-900',
  rose: 'bg-rose-100 border-rose-400 text-rose-900',
  gray: 'bg-gray-100 border-gray-400 text-gray-900',
};

// Quick lookup map for shift colors (dark backgrounds) - explicit classes for Tailwind JIT
export const SHIFT_COLOR_MAP = {
  yellow: 'bg-yellow-700 border-yellow-400 text-yellow-50',
  orange: 'bg-orange-700 border-orange-400 text-orange-50',
  red: 'bg-red-700 border-red-400 text-red-50',
  pink: 'bg-pink-700 border-pink-400 text-pink-50',
  purple: 'bg-purple-700 border-purple-400 text-purple-50',
  indigo: 'bg-indigo-700 border-indigo-400 text-indigo-50',
  blue: 'bg-blue-700 border-blue-400 text-blue-50',
  cyan: 'bg-cyan-700 border-cyan-400 text-cyan-50',
  teal: 'bg-teal-700 border-teal-400 text-teal-50',
  green: 'bg-green-700 border-green-400 text-green-50',
  lime: 'bg-lime-700 border-lime-400 text-lime-50',
  amber: 'bg-amber-700 border-amber-400 text-amber-50',
  slate: 'bg-slate-700 border-slate-400 text-slate-50',
  gray: 'bg-gray-600 border-gray-400 text-gray-50',
};

// Default fallback colors
export const DEFAULT_EMPLOYEE_FALLBACK = 'bg-gray-100 border-gray-400 text-gray-900';
export const DEFAULT_SHIFT_FALLBACK = 'bg-gray-600 border-gray-400 text-gray-50';
