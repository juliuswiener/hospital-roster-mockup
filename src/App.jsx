/**
 * Main Application Shell
 *
 * This is the refactored entry point that demonstrates the new file structure.
 * For now, it imports the existing HybridConfigDemo but shows how the
 * refactored structure should work.
 *
 * Migration Path:
 * 1. Views (RulesView, PlanningView, etc.) replace tab content
 * 2. Dialogs become independent components with props
 * 3. State management moves to useAppState hook
 * 4. Helper functions live in utils/helpers.js
 */

import React from 'react';
import { Download, Share2 } from 'lucide-react';
import { useAppState } from './hooks/useAppState';
import { useInitializeStore } from './hooks/useInitializeStore';
import { ValidationIndicator } from './components/ValidationIndicator';

// Import the original component for now (to be refactored)
import HybridConfigDemo from '../index.jsx';

/**
 * Refactored App Shell - Example Structure
 *
 * This demonstrates how the app should be structured after full refactoring.
 * The actual migration would involve:
 * - Extracting each tab's content into separate view components
 * - Extracting each dialog into its own component
 * - Using the useAppState hook for state management
 * - Using helper functions from utils/helpers.js
 */
const AppShell = () => {
  const state = useAppState();

  // Initialize Redux store with mock data
  useInitializeStore();

  const tabs = [
    { id: 'overview', label: 'Regeln & Übersicht' },
    { id: 'employees', label: 'Mitarbeiter' },
    { id: 'shifts', label: 'Schichten' },
    { id: 'availability', label: 'Verfügbarkeit' },
    { id: 'planning', label: 'Planung' },
    { id: 'control', label: 'Kontrolle' },
  ];

  return (
    <div className="max-w-[1800px] mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Hospital Roster Planner - Konfiguration
          </h1>
          <div className="flex items-center gap-3">
            <ValidationIndicator />
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm">
              <Download size={20} />
              Excel Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm">
              <Share2 size={20} />
              Mit SP-Expert synchronisieren
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => state.setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition-colors ${
                state.activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content - Would be replaced with view components */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600">
          Tab: {state.activeTab}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This is the refactored App shell. Views would be rendered here based on activeTab.
        </p>
      </div>
    </div>
  );
};

/**
 * For now, export the original component to maintain functionality.
 * Once views are extracted, switch to AppShell.
 */
export default HybridConfigDemo;

// Export the new shell for testing
export { AppShell };
