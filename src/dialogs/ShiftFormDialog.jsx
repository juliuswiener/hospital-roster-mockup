import React from 'react';
import { X } from 'lucide-react';
import { API_BASE } from '../config/api';
import { useFormDialog } from '../hooks/useFormDialog';
import { createEntity, updateEntity } from '../utils/api';

const DEFAULT_SHIFT_FORM = {
  name: '',
  time: '08:00-16:00',
  description: '',
  requirements: [],
  rules: [],
  color: 'yellow',
};

// Available color options for shifts (dark backgrounds)
const SHIFT_COLOR_OPTIONS = [
  { name: 'yellow', bg: 'bg-yellow-700', border: 'border-yellow-400', text: 'text-yellow-50', label: 'Gelb' },
  { name: 'orange', bg: 'bg-orange-700', border: 'border-orange-400', text: 'text-orange-50', label: 'Orange' },
  { name: 'red', bg: 'bg-red-700', border: 'border-red-400', text: 'text-red-50', label: 'Rot' },
  { name: 'pink', bg: 'bg-pink-700', border: 'border-pink-400', text: 'text-pink-50', label: 'Pink' },
  { name: 'purple', bg: 'bg-purple-700', border: 'border-purple-400', text: 'text-purple-50', label: 'Lila' },
  { name: 'indigo', bg: 'bg-indigo-700', border: 'border-indigo-400', text: 'text-indigo-50', label: 'Indigo' },
  { name: 'blue', bg: 'bg-blue-700', border: 'border-blue-400', text: 'text-blue-50', label: 'Blau' },
  { name: 'cyan', bg: 'bg-cyan-700', border: 'border-cyan-400', text: 'text-cyan-50', label: 'Cyan' },
  { name: 'teal', bg: 'bg-teal-700', border: 'border-teal-400', text: 'text-teal-50', label: 'Türkis' },
  { name: 'green', bg: 'bg-green-700', border: 'border-green-400', text: 'text-green-50', label: 'Grün' },
  { name: 'lime', bg: 'bg-lime-700', border: 'border-lime-400', text: 'text-lime-50', label: 'Limette' },
  { name: 'amber', bg: 'bg-amber-700', border: 'border-amber-400', text: 'text-amber-50', label: 'Bernstein' },
  { name: 'slate', bg: 'bg-slate-700', border: 'border-slate-400', text: 'text-slate-50', label: 'Schiefer' },
  { name: 'gray', bg: 'bg-gray-600', border: 'border-gray-400', text: 'text-gray-50', label: 'Grau' },
];

const mapEditingShiftToForm = (shift) => ({
  name: shift.name || '',
  time: shift.time || '08:00-16:00',
  description: shift.description || '',
  requirements: shift.requirements || [],
  rules: shift.rules || [],
  color: shift.color || 'yellow',
});

export const ShiftFormDialog = ({
  isOpen,
  onClose,
  editingShift = null,
  onSave,
}) => {
  const { formData, setFormData } = useFormDialog(
    isOpen,
    editingShift,
    DEFAULT_SHIFT_FORM,
    mapEditingShiftToForm
  );

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Bitte geben Sie einen Schichtnamen ein');
      return;
    }

    const selectedColor = SHIFT_COLOR_OPTIONS.find(c => c.name === formData.color) || SHIFT_COLOR_OPTIONS[0];
    const shiftData = {
      name: formData.name.trim(),
      time: formData.time,
      description: formData.description || formData.name,
      requirements: formData.requirements.length ? formData.requirements : ['Min. 1 Person'],
      rules: formData.rules,
      color: formData.color,
      colorClass: `${selectedColor.bg} ${selectedColor.border} ${selectedColor.text}`,
    };

    let savedShift = null;

    if (editingShift) {
      // UPDATE existing shift
      const result = await updateEntity(`/shifts/${editingShift.id}`, shiftData);
      if (result.success) {
        // Merge backend response with local data to preserve color fields
        savedShift = { ...result.data, color: shiftData.color, colorClass: shiftData.colorClass };
        console.log('Shift updated in backend:', result.data);
      } else {
        savedShift = { ...editingShift, ...shiftData };
        console.log('Backend update failed, updated locally');
      }
    } else {
      // CREATE new shift
      const result = await createEntity('/shifts/', shiftData);
      if (result.success) {
        // Merge backend response with local data to preserve color fields
        savedShift = { ...result.data, color: shiftData.color, colorClass: shiftData.colorClass };
        console.log('Shift saved to backend:', savedShift);
      } else {
        savedShift = shiftData;
        console.log('Backend save failed, added locally:', shiftData);
      }
    }

    onSave(savedShift, editingShift);
    onClose();
  };

  if (!isOpen) return null;

  const requirementOptions = ['Oberarzt', 'Facharzt', 'Notfallzertifizierung', 'ABS-Zertifizierung'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">
              {editingShift ? 'Schicht bearbeiten' : 'Neue Schicht'}
            </h3>
            <button onClick={onClose}>
              <X className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Schichtname</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. OA"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Zeit (z.B. 08:00-17:00)</label>
              <input
                type="text"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                placeholder="08:00-17:00"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Beschreibung</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="z.B. Oberarzt Ambulanzen"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold mb-2">Farbe</label>
            <div className="grid grid-cols-7 gap-2">
              {SHIFT_COLOR_OPTIONS.map(colorOption => (
                <button
                  key={colorOption.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: colorOption.name })}
                  className={`w-10 h-10 rounded border-2 ${colorOption.bg} ${colorOption.border} ${
                    formData.color === colorOption.name ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                  title={colorOption.label}
                />
              ))}
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-600">Vorschau: </span>
              <span className={`px-3 py-1 rounded border-2 text-xs font-semibold ${
                SHIFT_COLOR_OPTIONS.find(c => c.name === formData.color)?.bg || 'bg-yellow-700'
              } ${
                SHIFT_COLOR_OPTIONS.find(c => c.name === formData.color)?.border || 'border-yellow-400'
              } ${
                SHIFT_COLOR_OPTIONS.find(c => c.name === formData.color)?.text || 'text-yellow-50'
              }`}>
                {formData.name || 'Schicht'}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold mb-2">Anforderungen</label>
            <div className="space-y-2">
              {requirementOptions.map(r => (
                <label key={r} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requirements.includes(r)}
                    onChange={e => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          requirements: [...formData.requirements, r],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          requirements: formData.requirements.filter(req => req !== r),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftFormDialog;
