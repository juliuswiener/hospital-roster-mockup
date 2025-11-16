import { useEffect } from 'react';

/**
 * Hook to handle click outside events for closing menus/dialogs
 * @param {boolean|object} condition - Truthy value indicating if the handler should be active
 * @param {function} onClickOutside - Callback to execute when clicking outside
 */
export const useClickOutside = (condition, onClickOutside) => {
  useEffect(() => {
    if (!condition) return;

    const handleClick = () => onClickOutside();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [condition, onClickOutside]);
};
