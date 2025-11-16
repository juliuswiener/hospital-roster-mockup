import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { availabilityTypes } from '../data';
import { API_BASE } from '../config/api';
import { useFormDialog } from '../hooks/useFormDialog';
import {
  createEntity,
  updateEntity,
  generateUniqueInitials,
  mapFrontendToBackendEmployee,
  mapBackendToFrontendEmployee,
} from '../utils/api';

const DEFAULT_EMPLOYEE_FORM = {
  name: '',
  initials: '',
  contract: 'Facharzt',
  hours: 40,
  qualifications: [],
  defaultAvailability: 'if',
  color: 'blue',
};

// Available color options for employees (light backgrounds)
const EMPLOYEE_COLOR_OPTIONS = [
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

const mapEditingEmployeeToForm = (emp) => ({
  name: emp.name,
  initials: emp.initials,
  contract: emp.contract,
  hours: emp.hours,
  qualifications: emp.qualifications || [],
  defaultAvailability: emp.defaultAvailability || 'if',
  color: emp.color || 'blue',
});

// Generate initials suggestion from a name
const generateInitialsSuggestion = (name, existingInitials = []) => {
  if (!name || !name.trim()) return '';

  const parts = name.trim().split(/\s+/);

  // Try first letters of each name part (e.g., "Max Mustermann" -> "MM")
  let suggestion = parts.map(p => p[0]?.toUpperCase() || '').join('');

  // If only one letter, take first two letters of name
  if (suggestion.length < 2 && parts[0].length >= 2) {
    suggestion = parts[0].substring(0, 2).toUpperCase();
  }

  // Check if suggestion is already taken
  if (existingInitials.includes(suggestion)) {
    // Try adding more letters from last name
    if (parts.length > 1 && parts[parts.length - 1].length >= 2) {
      const altSuggestion = parts[0][0].toUpperCase() + parts[parts.length - 1].substring(0, 2).toUpperCase();
      if (!existingInitials.includes(altSuggestion)) {
        return altSuggestion;
      }
    }
    // Try first three letters of first name
    if (parts[0].length >= 3) {
      const altSuggestion = parts[0].substring(0, 3).toUpperCase();
      if (!existingInitials.includes(altSuggestion)) {
        return altSuggestion;
      }
    }
  }

  return suggestion;
};

export const EmployeeFormDialog = ({
  isOpen,
  onClose,
  editingEmployee = null,
  employees = [],
  onSave,
}) => {
  const { formData, setFormData } = useFormDialog(
    isOpen,
    editingEmployee,
    DEFAULT_EMPLOYEE_FORM,
    mapEditingEmployeeToForm
  );
  const [availabilityChanged, setAvailabilityChanged] = useState(false);
  const [initialsManuallyEdited, setInitialsManuallyEdited] = useState(false);

  // Reset availability changed flag when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAvailabilityChanged(false);
      // Only reset manual edit flag for new employees, not when editing
      if (!editingEmployee) {
        setInitialsManuallyEdited(false);
      } else {
        setInitialsManuallyEdited(true); // Don't auto-update for existing employees
      }
    }
  }, [isOpen, editingEmployee]);

  // Auto-suggest initials when name changes (only if not manually edited)
  const handleNameChange = (newName) => {
    setFormData(prev => {
      const updates = { ...prev, name: newName };

      // Only auto-suggest if initials haven't been manually edited
      if (!initialsManuallyEdited && !editingEmployee) {
        const existingInitials = employees.map(e => e.initials);
        const suggestedInitials = generateInitialsSuggestion(newName, existingInitials);
        updates.initials = suggestedInitials;
      }

      return updates;
    });
  };

  const handleInitialsChange = (newInitials) => {
    setInitialsManuallyEdited(true);
    setFormData({ ...formData, initials: newInitials.toUpperCase() });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return;
    }

    // Use form initials if provided, otherwise auto-generate
    let initials;
    if (formData.initials && formData.initials.trim()) {
      initials = formData.initials.trim().toUpperCase();
    } else {
      const existingInitials = employees.map(e => e.initials);
      initials = generateUniqueInitials(formData.name, existingInitials);
    }

    // Check for duplicate initials
    const isDuplicateInitials = editingEmployee
      ? employees.some(emp => emp.initials === initials && emp.initials !== editingEmployee.initials)
      : employees.some(emp => emp.initials === initials);

    if (isDuplicateInitials) {
      alert(`Kürzel "${initials}" ist bereits vergeben. Bitte wählen Sie ein anderes Kürzel.`);
      return;
    }

    const selectedColor = EMPLOYEE_COLOR_OPTIONS.find(c => c.name === formData.color) || EMPLOYEE_COLOR_OPTIONS[10]; // default blue
    const employeeData = {
      name: formData.name.trim(),
      initials: initials,
      contract: formData.contract,
      hours: formData.hours,
      qualifications: formData.qualifications,
      defaultAvailability: formData.defaultAvailability,
      color: formData.color,
      colorClass: `${selectedColor.bg} ${selectedColor.border} ${selectedColor.text}`,
    };

    const backendEmployee = mapFrontendToBackendEmployee(employeeData);
    let savedEmployee = null;

    if (editingEmployee) {
      // UPDATE existing employee
      const result = await updateEntity(`/employees/${editingEmployee.id}`, backendEmployee);
      if (result.success) {
        // Merge backend response with local data to preserve color fields
        const backendData = mapBackendToFrontendEmployee(result.data);
        savedEmployee = { ...backendData, color: employeeData.color, colorClass: employeeData.colorClass };
        console.log('Employee updated in backend:', result.data);
      } else {
        savedEmployee = { ...editingEmployee, ...employeeData };
        console.log('Backend update failed, updated locally');
      }
    } else {
      // CREATE new employee
      const result = await createEntity('/employees/', backendEmployee);
      if (result.success) {
        // Merge backend response with local data to preserve color fields
        const backendData = mapBackendToFrontendEmployee(result.data);
        savedEmployee = { ...backendData, color: employeeData.color, colorClass: employeeData.colorClass };
        console.log('Employee saved to backend:', result.data);
      } else {
        savedEmployee = employeeData;
        console.log('Backend save failed, added locally:', employeeData);
      }
    }

    const shouldUpdateAvailability = !editingEmployee || availabilityChanged;
    onSave(savedEmployee, editingEmployee, shouldUpdateAvailability);
    onClose();
  };

  if (!isOpen) return null;

  const qualificationOptions = [
    'Facharzt Innere Medizin',
    'Notfallmedizin-Zertifizierung',
    'ABS-zertifiziert (Antibiotic Stewardship)',
    'Oberarzt-Berechtigung',
    'Chefarzt-Vertretung',
  ];

  const stationOptions = ['Ambulanzen', 'Konsiliardienst', 'ABS', 'Station v. Frer.', 'Forschung'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
          </h3>
          <button onClick={onClose}>
            <X className="text-gray-400 hover:text-gray-600" size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="z.B. Max Mustermann"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Initials */}
          <div>
            <label className="block text-sm font-semibold mb-2">Kürzel (Initialen):</label>
            <input
              type="text"
              value={formData.initials}
              onChange={e => handleInitialsChange(e.target.value)}
              placeholder="z.B. MM oder MAX"
              className={`w-full border rounded px-3 py-2 ${
                formData.initials && employees.some(emp => emp.initials === formData.initials && emp.initials !== editingEmployee?.initials)
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300'
              }`}
              maxLength={5}
            />
            {formData.initials && employees.some(emp => emp.initials === formData.initials && emp.initials !== editingEmployee?.initials) && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                Kürzel bereits vergeben! Bitte wählen Sie ein anderes.
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {!initialsManuallyEdited && !editingEmployee
                ? 'Wird automatisch aus dem Namen generiert - kann angepasst werden'
                : 'Eindeutiges Kürzel für den Mitarbeiter'}
            </p>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold mb-2">Farbe:</label>
            <div className="grid grid-cols-9 gap-2">
              {EMPLOYEE_COLOR_OPTIONS.map(colorOption => (
                <button
                  key={colorOption.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: colorOption.name })}
                  className={`w-8 h-8 rounded border-2 ${colorOption.bg} ${colorOption.border} ${
                    formData.color === colorOption.name ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                  title={colorOption.label}
                />
              ))}
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-600">Vorschau: </span>
              <span className={`px-3 py-1 rounded border-2 text-xs font-semibold ${
                EMPLOYEE_COLOR_OPTIONS.find(c => c.name === formData.color)?.bg || 'bg-blue-100'
              } ${
                EMPLOYEE_COLOR_OPTIONS.find(c => c.name === formData.color)?.border || 'border-blue-400'
              } ${
                EMPLOYEE_COLOR_OPTIONS.find(c => c.name === formData.color)?.text || 'text-blue-900'
              }`}>
                {formData.initials || 'XX'}
              </span>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold mb-2">Status:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="status" defaultChecked className="text-blue-600" />
                <span>Aktiv</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="status" className="text-blue-600" />
                <span>Urlaub</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="status" className="text-blue-600" />
                <span>Inaktiv</span>
              </label>
            </div>
          </div>

          {/* Vertrag */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Vertrag:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Typ:</label>
                <select
                  value={formData.contract}
                  onChange={e => setFormData({ ...formData, contract: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option>Chefarzt</option>
                  <option>Oberarzt</option>
                  <option>Facharzt</option>
                  <option>Assistenzarzt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Wochenstunden:</label>
                <input
                  type="number"
                  value={formData.hours}
                  onChange={e => setFormData({ ...formData, hours: parseInt(e.target.value) || 40 })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">(Tarifvertrag: 40h)</p>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Vertragsbeginn:</label>
              <input
                type="date"
                defaultValue="2020-01-01"
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Default Availability */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Standard-Verfügbarkeit:</h4>
            <div>
              <label className="block text-sm font-medium mb-1">
                Standard-Status für alle Tage:
              </label>
              <select
                value={formData.defaultAvailability}
                onChange={e => {
                  setFormData({ ...formData, defaultAvailability: e.target.value });
                  setAvailabilityChanged(true);
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {availabilityTypes.map(type => (
                  <option key={type.code} value={type.code}>
                    {type.code} - {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {editingEmployee
                  ? 'Nur ändern, wenn Sie die Verfügbarkeit für alle Tage neu setzen möchten'
                  : 'Dieser Status wird für alle Tage im Monat gesetzt'}
              </p>
            </div>
          </div>

          {/* Qualifikationen */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Qualifikationen & Kompetenzen:</h4>
            <div className="space-y-2">
              {qualificationOptions.map(q => (
                <label key={q} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.qualifications.includes(q)}
                    onChange={e => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          qualifications: [...formData.qualifications, q],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          qualifications: formData.qualifications.filter(qual => qual !== q),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{q}</span>
                </label>
              ))}
            </div>
            <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Plus size={14} />
              Qualifikation hinzufügen
            </button>
          </div>

          {/* Einsatzfähig in Stationen */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Einsatzfähig in Stationen:</h4>
            <div className="space-y-2">
              {stationOptions.map(s => (
                <label key={s} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked={s === 'Ambulanzen' || s === 'Konsiliardienst' || s === 'ABS'}
                    className="rounded"
                  />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Persönliche Einschränkungen */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Persönliche Einschränkungen:</h4>
            <p className="text-sm text-gray-600 mb-2">• Keine festen Einschränkungen</p>
            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Plus size={14} />
              Einschränkung hinzufügen...
            </button>
          </div>

          {/* Präferenzen */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Präferenzen (optional):</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Bevorzugte Schichten:</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2">
                  <option>Keine Präferenz</option>
                  <option>Frühdienst</option>
                  <option>Spätdienst</option>
                  <option>Nachtdienst</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max. Wochenenden/Monat:</label>
                  <input
                    type="number"
                    defaultValue="2"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max. Nachtdienste/Monat:</label>
                  <input
                    type="number"
                    defaultValue="4"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-center pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeFormDialog;
