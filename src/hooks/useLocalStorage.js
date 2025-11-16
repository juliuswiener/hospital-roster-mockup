import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting state to localStorage
 * @param {string} key - The localStorage key
 * @param {*} initialValue - Default value if nothing is stored
 * @param {Object} options - Optional configuration
 * @param {function} options.validator - Function to validate parsed data
 * @returns {[*, function]} - State value and setter
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  const { validator = () => true } = options;

  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validator(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(`Failed to load ${key} from localStorage:`, e);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage:`, e);
    }
  }, [key, value]);

  return [value, setValue];
};

export default useLocalStorage;
