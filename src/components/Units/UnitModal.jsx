import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { PROPERTY_TYPES, CONDO_LIST } from '../../utils/constants';

const EMPTY = {
  PropertyType: '',
  Condo: '',
  UnitNumber: '',
  Floor: '',
  HasRooms: 'No',
  Rooms: '',
  Status: 'Active',
  Notes: '',
  OwnerName: '',
  OwnerAddress: '',
};

export function UnitModal({ isOpen, onClose, onSave, existing }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [roomInput, setRoomInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(existing ? { ...existing } : EMPTY);
      setRoomInput(existing?.Rooms ?? '');
      setErrors({});
    }
  }, [isOpen, existing]);

  const field = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.PropertyType) errs.PropertyType = 'Required';
    if (!form.Condo)        errs.Condo        = 'Required';
    if (!form.UnitNumber)   errs.UnitNumber   = 'Required';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({ ...form, Rooms: roomInput });
    onClose();
  };

  const rooms = roomInput.split(',').map((r) => r.trim()).filter(Boolean);

  const addRoom = () => {
    const name = prompt('Room name (e.g. Master Bedroom):');
    if (!name?.trim()) return;
    setRoomInput((prev) => prev ? `${prev},${name.trim()}` : name.trim());
  };

  const removeRoom = (idx) => {
    const updated = rooms.filter((_, i) => i !== idx);
    setRoomInput(updated.join(','));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existing ? `Edit Unit — ${existing.UnitNumber}` : 'Add New Unit'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Property Type *" error={errors.PropertyType}>
            <select value={form.PropertyType} onChange={field('PropertyType')} className={cls(errors.PropertyType)}>
              <option value="">Select…</option>
              {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Condo / Block *" error={errors.Condo}>
            <select value={form.Condo} onChange={field('Condo')} className={cls(errors.Condo)}>
              <option value="">Select…</option>
              {CONDO_LIST.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Unit Number *" error={errors.UnitNumber}>
            <input type="text" value={form.UnitNumber} onChange={field('UnitNumber')}
              placeholder="e.g. 3A" className={cls(errors.UnitNumber)} />
          </Field>

          <Field label="Floor">
            <input type="text" value={form.Floor} onChange={field('Floor')}
              placeholder="e.g. 3" className={cls()} />
          </Field>

          <Field label="Has Rooms?">
            <select value={form.HasRooms} onChange={field('HasRooms')} className={cls()}>
              <option value="No">No — whole unit (studio / open plan)</option>
              <option value="Yes">Yes — unit has individual rooms</option>
            </select>
          </Field>

          <Field label="Status">
            <select value={form.Status} onChange={field('Status')} className={cls()}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>
        </div>

        {form.HasRooms === 'Yes' && (
          <Field label="Rooms">
            <div className="border border-gray-200 rounded-lg p-3 space-y-2 min-h-[60px]">
              {rooms.length === 0 && (
                <p className="text-xs text-gray-400 italic">No rooms added yet.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {rooms.map((room, idx) => (
                  <span key={room} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full">
                    {room}
                    <button onClick={() => removeRoom(idx)} className="text-blue-400 hover:text-blue-700 leading-none">×</button>
                  </span>
                ))}
              </div>
              <button onClick={addRoom} className="text-xs text-blue-600 hover:underline mt-1">+ Add room</button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Add each room individually. These will appear as options when reporting an issue for this unit.</p>
          </Field>
        )}

        <Field label="Notes">
          <input type="text" value={form.Notes} onChange={field('Notes')}
            placeholder="Optional notes about this unit" className={cls()} />
        </Field>

        {/* Owner details */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Owner Details <span className="font-normal normal-case text-gray-400">(used for invoice billing)</span></p>
          <Field label="Owner Name">
            <input type="text" value={form.OwnerName} onChange={field('OwnerName')}
              placeholder="e.g. Tan Ah Kow" className={cls()} />
          </Field>
          <div className="mt-3">
            <Field label="Unit Full Address">
              <textarea value={form.OwnerAddress} onChange={field('OwnerAddress')}
                placeholder="e.g. Unit 3A, Block A, Residensi ABC, No. 1 Jalan XYZ, 50000 Kuala Lumpur"
                rows={2} className={`${cls()} resize-none`} />
            </Field>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{existing ? 'Save Changes' : 'Add Unit'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

const cls = (err = '') =>
  `w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
    err ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
  }`;
