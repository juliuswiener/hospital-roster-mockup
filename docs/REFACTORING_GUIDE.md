# Refactoring Guide: index.jsx → Modular Structure

This guide outlines the migration path from the monolithic `index.jsx` (2,743 lines) to a modular file structure with maximum 500 lines per file.

## New File Structure

```
src/
├── App.jsx                           (~300 lines) - Main app shell
├── hooks/
│   ├── useAppState.js               (~200 lines) - Centralized state management ✅
│   └── useInitializeStore.ts        (~120 lines) - Redux store initialization ✅
├── views/
│   ├── index.js                     - Barrel export ✅
│   ├── RulesView.jsx                (~200 lines) - Rules overview tab
│   ├── EmployeesView.jsx            (~150 lines) - Employees tab
│   ├── ShiftsView.jsx               (~100 lines) - Shifts tab
│   ├── AvailabilityView.jsx         (~200 lines) - Availability tab
│   ├── PlanningView.jsx             (~400 lines) - Planning grid (largest view)
│   └── ControlView.jsx              (~300 lines) - Control/validation tab
├── dialogs/
│   ├── index.js                     - Barrel export ✅
│   ├── EmployeeFormDialog.jsx       (~150 lines)
│   ├── ShiftFormDialog.jsx          (~50 lines)
│   ├── NaturalLanguageDialog.jsx    (~200 lines)
│   ├── ConstraintViolationDialog.jsx (~100 lines)
│   ├── PlanGenerationDialog.jsx     (~280 lines)
│   ├── EmergencyCoverageDialog.jsx  (~150 lines)
│   └── RuleEditDialog.jsx           (~200 lines)
├── utils/
│   └── helpers.js                   (~300 lines) - Helper functions ✅
└── components/
    ├── ValidationIndicator.jsx      (~60 lines) ✅
    └── ViolationsList.jsx           (~70 lines) ✅
```

## What's Already Created

### ✅ Complete
- `src/utils/helpers.js` - All helper functions extracted
- `src/hooks/useAppState.js` - Centralized state management hook
- `src/hooks/useInitializeStore.ts` - Redux store initialization
- `src/App.jsx` - Shell demonstrating new structure
- `src/views/index.js` - Barrel export (placeholders)
- `src/dialogs/index.js` - Barrel export (placeholders)
- `src/components/ValidationIndicator.jsx` - Validation status
- `src/components/ViolationsList.jsx` - Violations display

### 🔄 To Be Migrated
- View components (extract from index.jsx lines 1299-1585)
- Dialog components (extract from index.jsx lines 485-1200)
- Tab content rendering
- Event handlers specific to views

## Migration Steps

### Step 1: Extract Dialogs (Priority: High)
Extract each dialog from `index.jsx` into separate files:

```jsx
// src/dialogs/EmployeeFormDialog.jsx
import React from 'react';
import { X } from 'lucide-react';

export const EmployeeFormDialog = ({ isOpen, onClose, employee }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Dialog content from lines 485-620 of index.jsx */}
      </div>
    </div>
  );
};
```

**Dialogs to extract:**
- Lines 485-620: EmployeeFormDialog
- Lines 621-700: ShiftFormDialog
- Lines 701-900: NaturalLanguageDialog
- Lines 901-1100: PlanGenerationDialog
- Lines 1101-1200: Other dialogs

### Step 2: Extract Views (Priority: High)
Extract tab content into view components:

```jsx
// src/views/PlanningView.jsx
import React from 'react';
import { getViolationTooltip } from '../utils/helpers';
import { ContextMenu } from '../components';

export const PlanningView = ({
  planningView,
  setPlanningView,
  scheduleData,
  employees,
  shifts,
  onCellClick,
  // ... other props
}) => {
  return (
    <div>
      {/* View mode selector */}
      {/* Grid/table based on planningView */}
    </div>
  );
};
```

**Views to extract:**
- Lines 1299-1379: Employee View (single)
- Lines 1381-1468: Compact View (multi)
- Lines 1470-1585: Excel View

### Step 3: Update App.jsx
Connect views and dialogs:

```jsx
// src/App.jsx
import { useAppState } from './hooks/useAppState';
import { RulesView, PlanningView } from './views';
import { EmployeeFormDialog, PlanGenerationDialog } from './dialogs';

const App = () => {
  const state = useAppState();

  return (
    <div>
      <Header />
      <TabNavigation activeTab={state.activeTab} setActiveTab={state.setActiveTab} />

      {/* Render active tab view */}
      {state.activeTab === 'overview' && <RulesView rules={state.rules} />}
      {state.activeTab === 'planning' && <PlanningView {...state} />}

      {/* Render dialogs */}
      <EmployeeFormDialog
        isOpen={state.showEmployeeFormDialog}
        onClose={state.closeEmployeeForm}
      />
      <PlanGenerationDialog
        isOpen={state.showPlanGenerationDialog}
        onClose={state.closePlanGeneration}
        onGenerate={state.startPlanGeneration}
      />
    </div>
  );
};
```

### Step 4: Clean Up index.jsx
Once all views and dialogs are extracted:

1. Remove extracted code from index.jsx
2. Import and use new components
3. Replace inline handlers with useAppState methods
4. Remove helper functions (now in utils/helpers.js)

## Using the New Helper Functions

```jsx
import {
  getRulesForEmployee,
  getViolationTooltip,
  parseNaturalLanguage,
  getEmployeeDetailedInfo,
  getCategoryBadgeColor,
  findEmergencyCoverage,
} from '../utils/helpers';

// In component:
const employeeRules = getRulesForEmployee(rules, employee.name);
const violationMessage = getViolationTooltip('DH', '08', 'BK');
const parsedRules = parseNaturalLanguage(nlText, nextId);
```

## Using the State Hook

```jsx
import { useAppState } from '../hooks/useAppState';

const MyComponent = () => {
  const {
    rules,
    addRule,
    deleteRule,
    openPlanGeneration,
    closePlanGeneration,
    isGenerating,
    startPlanGeneration,
  } = useAppState();

  return (
    <div>
      <button onClick={openPlanGeneration}>Generate Plan</button>
      {/* Component content */}
    </div>
  );
};
```

## Benefits After Migration

1. **Single Responsibility**: Each file has one clear purpose
2. **Testability**: Individual components can be unit tested
3. **Maintainability**: Changes are isolated to specific files
4. **Reusability**: Components can be reused across views
5. **Code Navigation**: Easier to find and understand code
6. **State Management**: Centralized in custom hook
7. **Performance**: Better code splitting opportunities

## Recommended Migration Order

1. ✅ Helper functions → `utils/helpers.js`
2. ✅ State management → `hooks/useAppState.js`
3. 🔄 Dialogs → `dialogs/*.jsx`
4. 🔄 Views → `views/*.jsx`
5. 🔄 App shell → `App.jsx`
6. 🔄 Clean up old index.jsx

## Testing Strategy

After each migration step:
1. Ensure app still runs (`npm run dev`)
2. Test affected functionality
3. Verify no regressions in existing features
4. Check console for errors

## Code Quality Checks

```bash
# Type checking
npx tsc --noEmit

# Lint checking (if configured)
npm run lint

# Test run
npm test
```

## Gradual Migration

You can migrate gradually by:
1. Keeping the old index.jsx working
2. Creating new components alongside
3. Swapping them one at a time
4. Testing after each swap
5. Eventually removing all old code

The `App.jsx` currently exports the original HybridConfigDemo to maintain functionality. Switch to `AppShell` once views are extracted.
