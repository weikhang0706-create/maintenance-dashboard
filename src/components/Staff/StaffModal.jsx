import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { STAFF_ROLES } from '../../utils/constants';

const EMPTY = { Name: '', Role: '', Phone: '', Email: '', Status: 'Active', Notes: '' };

export function StaffModal({ isOpen, onClose, onSave, existing }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(existing ? { ...existing } : EMPTY);
      setErrors({});
    }
  }, [isOpen, existing]);

  const field = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.Name.trim()) errs.Name = 'Required';
    if (!form.Role)        errs.Role = 'Required';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existing ? `Edit Staff — ${existing.Name}` : 'Add New Staff'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name *" error={errors.Name} className="col-span-2">
            <input type="text" value={form.Name} onChange={field('Name')}
              placeholder="e.g. Ahmad Razif" className={cls(errors.Name)} />
          </Field>

          <Field label="Role *" error={errors.Role}>
            <select value={form.Role} onChange={field('Role')} className={cls(errors.Role)}>
              <option value="">Select role…</option>
              {STAFF_ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>

          <Field label="Status">
            <select value={form.Status} onChange={field('Status')} className={cls()}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>

          <Field label="Phone">
            <input type="text" value={form.Phone} onChange={field('Phone')}
              placeholder="e.g. 012-3456789" className={cls()} />
          </Field>

          <Field label="Email">
            <input type="email" value={form.Email} onChange={field('Email')}
              placeholder="e.g. ahmad@email.com" className={cls()} />
          </Field>
        </div>

        <Field label="Notes">
          <input type="text" value={form.Notes} onChange={field('Notes')}
            placeholder="Optional notes" className={cls()} />
        </Field>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{existing ? 'Save Changes' : 'Add Staff'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, error, className = '', children }) {
  return (
    <div className={className}>
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
