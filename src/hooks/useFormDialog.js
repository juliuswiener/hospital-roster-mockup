import { useState, useEffect } from 'react';

/**
 * Generic hook for form dialog state management
 * @param {boolean} isOpen - Whether the dialog is open
 * @param {object|null} editingItem - The item being edited (null for new)
 * @param {object} defaultValues - Default form values for new items
 * @param {function} mapEditingToForm - Function to map editing item to form data
 * @returns {object} Form state and handlers
 */
export const useFormDialog = (isOpen, editingItem, defaultValues, mapEditingToForm = null) => {
  const [formData, setFormData] = useState(defaultValues);

  useEffect(() => {
    if (isOpen && editingItem) {
      if (mapEditingToForm) {
        setFormData(mapEditingToForm(editingItem));
      } else {
        setFormData({ ...defaultValues, ...editingItem });
      }
    } else if (isOpen) {
      setFormData(defaultValues);
    }
  }, [isOpen, editingItem]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateFields = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData(defaultValues);
  };

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    resetForm
  };
};
