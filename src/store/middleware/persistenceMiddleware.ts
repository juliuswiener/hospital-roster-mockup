import { Middleware } from '@reduxjs/toolkit';

const API_BASE_URL = 'http://localhost:8000';

// Queue for batching saves
const saveQueue = new Map<string, unknown>();
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const BATCH_DELAY = 1000;

const processSaveQueue = async () => {
  if (saveQueue.size === 0) return;

  const itemsToSave = new Map(saveQueue);
  saveQueue.clear();

  for (const [key, data] of itemsToSave) {
    try {
      const [entityType] = key.split(':');

      switch (entityType) {
        case 'assignment':
          await fetch(`${API_BASE_URL}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          break;
        case 'rule':
          await fetch(`${API_BASE_URL}/rules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          break;
      }
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      // Silently fail - backend may not be available yet
    }
  }
};

export const persistenceMiddleware: Middleware = (_store) => (next) => (action) => {
  const result = next(action);

  // Actions that should persist to backend
  const persistActions: Record<string, string> = {
    'assignments/addAssignment': 'assignment',
    'assignments/updateAssignment': 'assignment',
    'rules/addRule': 'rule',
    'rules/updateRule': 'rule',
  };

  if (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    'payload' in action
  ) {
    const actionType = action.type as string;
    const entityType = persistActions[actionType];

    if (entityType) {
      const payload = action.payload as { id?: string };
      const id = payload.id || 'new';
      saveQueue.set(`${entityType}:${id}`, payload);

      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      saveTimeout = setTimeout(processSaveQueue, BATCH_DELAY);
    }
  }

  return result;
};
