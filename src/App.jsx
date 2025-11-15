/**
 * Main Application Shell
 *
 * This is the refactored entry point that demonstrates the new file structure.
 * It uses the extracted dialog and view components to show how the
 * monolithic index.jsx can be broken down into manageable pieces.
 *
 * Migration Path:
 * 1. Views (RulesView, PlanningView, etc.) replace tab content
 * 2. Dialogs become independent components with props
 * 3. State management moves to useAppState hook
 * 4. Helper functions live in utils/helpers.js
 */

import React, { useState } from 'react';
import { Download, Share2, List, Users, Clock, Calendar, CheckCircle } from 'lucide-react';
import { useAppState } from './hooks/useAppState';
import { useInitializeStore } from './hooks/useInitializeStore';
import { ValidationIndicator } from './components/ValidationIndicator';

// Import extracted views
import { RulesView, EmployeesView, ShiftsView } from './views';

// Import extracted dialogs
import {
  EmployeeFormDialog,
  ShiftFormDialog,
  NaturalLanguageDialog,
  PlanGenerationDialog,
  RuleEditDialog,
} from './dialogs';

// Import data
import { employees, shifts, initialRules } from './data';

// Import the original component for fallback
import HybridConfigDemo from '../index.jsx';

/**
 * Refactored App Shell - Functional Implementation
 *
 * This demonstrates the fully refactored app structure using extracted components.
 * Each view is now a separate component, and dialogs are modular.
 */
const AppShell = () => {
  const state = useAppState();

  // Initialize Redux store with mock data
  useInitializeStore();

  // Local state for dialogs (these could also be managed by Redux)
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [showNlDialog, setShowNlDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showRuleEditDialog, setShowRuleEditDialog] = useState(null);
  const [nlText, setNlText] = useState('');
  const [showNlResults, setShowNlResults] = useState(false);
  const [parsedRules, setParsedRules] = useState([]);
  const [showGeneralRules, setShowGeneralRules] = useState(false);

  const handleAnalyzeNL = () => {
    // Simple demo - in production this would call the actual NL parser
    const demoRule = {
      original: nlText,
      understood: {
        type: 'MITARBEITER-EINSCHRÄNKUNG',
        Mitarbeiter: 'Pfau',
        Tag: 'Montag',
        Einschränkung: 'Nicht verfügbar',
        Härte: 'HART',
      },
    };
    setParsedRules([demoRule]);
    setShowNlResults(true);
  };

  const handleSaveNlRules = () => {
    // Save logic would go here
    setParsedRules([]);
    setNlText('');
    setShowNlResults(false);
  };

  const getRulesForEmployee = (employeeName) => {
    return state.rules.filter(
      (rule) =>
        rule.appliesTo === 'all' || rule.appliesTo === employeeName.replace('Dr. ', '')
    );
  };

  const tabs = [
    { id: 'overview', icon: List, label: `Regeln (${state.rules.length})` },
    { id: 'employees', icon: Users, label: 'Mitarbeiter' },
    { id: 'shifts', icon: Clock, label: 'Schichten' },
    { id: 'availability', icon: Calendar, label: 'Verfügbarkeit' },
    { id: 'planning', icon: Calendar, label: 'Planung' },
    { id: 'control', icon: CheckCircle, label: 'Kontrolle' },
  ];

  const renderTabContent = () => {
    switch (state.activeTab) {
      case 'overview':
        return (
          <RulesView
            rules={state.rules}
            onAddRule={() => {
              setNlText('');
              setShowNlDialog(true);
            }}
            onEditRule={(rule) => setShowRuleEditDialog(rule)}
          />
        );
      case 'employees':
        return (
          <EmployeesView
            employees={employees}
            rules={state.rules}
            showGeneralRules={showGeneralRules}
            setShowGeneralRules={setShowGeneralRules}
            onAddEmployee={() => setShowEmployeeDialog(true)}
            onAddRule={() => {
              setNlText('');
              setShowNlDialog(true);
            }}
            getRulesForEmployee={getRulesForEmployee}
          />
        );
      case 'shifts':
        return (
          <ShiftsView
            shifts={shifts}
            onAddShift={() => setShowShiftDialog(true)}
            onAddRule={() => {
              setNlText('');
              setShowNlDialog(true);
            }}
          />
        );
      case 'availability':
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Verfügbarkeits-Ansicht (noch in Hauptkomponente - zu extrahieren)
            </p>
          </div>
        );
      case 'planning':
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Planungs-Ansicht (komplex - noch in Hauptkomponente)
            </p>
            <button
              onClick={() => setShowPlanDialog(true)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Plan generieren
            </button>
          </div>
        );
      case 'control':
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Kontroll-Ansicht (noch in Hauptkomponente - zu extrahieren)
            </p>
          </div>
        );
      default:
        return null;
    }
  };

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
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                state.activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTabContent()}</div>
      </div>

      {/* Dialogs */}
      <EmployeeFormDialog
        isOpen={showEmployeeDialog}
        onClose={() => setShowEmployeeDialog(false)}
      />
      <ShiftFormDialog
        isOpen={showShiftDialog}
        onClose={() => setShowShiftDialog(false)}
      />
      <NaturalLanguageDialog
        isOpen={showNlDialog}
        onClose={() => setShowNlDialog(false)}
        nlText={nlText}
        setNlText={setNlText}
        showNlResults={showNlResults}
        setShowNlResults={setShowNlResults}
        parsedRules={parsedRules}
        onAnalyze={handleAnalyzeNL}
        onSave={handleSaveNlRules}
      />
      <PlanGenerationDialog
        isOpen={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        onGenerate={() => {
          setShowPlanDialog(false);
          // Trigger generation logic
        }}
      />
      <RuleEditDialog
        rule={showRuleEditDialog}
        onClose={() => setShowRuleEditDialog(null)}
        onSave={(rule) => {
          // Save logic here
          console.log('Saving rule:', rule);
        }}
      />
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
