import { useState, useCallback } from 'react';

/**
 * Centralized dialog state management hook
 * Reduces boilerplate for managing multiple dialog states
 *
 * @returns {object} Dialog management utilities
 */
export const useDialogManager = () => {
  const [dialogs, setDialogs] = useState({});
  const [editingItems, setEditingItems] = useState({});

  /**
   * Open a dialog
   * @param {string} name - Dialog name
   * @param {object|null} editingItem - Item to edit (null for new)
   */
  const openDialog = useCallback((name, editingItem = null) => {
    setDialogs(prev => ({ ...prev, [name]: true }));
    if (editingItem !== undefined) {
      setEditingItems(prev => ({ ...prev, [name]: editingItem }));
    }
  }, []);

  /**
   * Close a dialog
   * @param {string} name - Dialog name
   */
  const closeDialog = useCallback((name) => {
    setDialogs(prev => ({ ...prev, [name]: false }));
    setEditingItems(prev => ({ ...prev, [name]: null }));
  }, []);

  /**
   * Check if a dialog is open
   * @param {string} name - Dialog name
   * @returns {boolean}
   */
  const isOpen = useCallback((name) => {
    return !!dialogs[name];
  }, [dialogs]);

  /**
   * Get the editing item for a dialog
   * @param {string} name - Dialog name
   * @returns {object|null}
   */
  const getEditingItem = useCallback((name) => {
    return editingItems[name] || null;
  }, [editingItems]);

  /**
   * Toggle a dialog
   * @param {string} name - Dialog name
   */
  const toggleDialog = useCallback((name) => {
    setDialogs(prev => {
      const isCurrentlyOpen = prev[name];
      if (isCurrentlyOpen) {
        setEditingItems(items => ({ ...items, [name]: null }));
      }
      return { ...prev, [name]: !isCurrentlyOpen };
    });
  }, []);

  return {
    openDialog,
    closeDialog,
    isOpen,
    getEditingItem,
    toggleDialog,
    dialogs,
    editingItems,
  };
};
