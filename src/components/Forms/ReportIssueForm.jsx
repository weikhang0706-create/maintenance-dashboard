import { useState, useMemo } from 'react';
import { Button } from '../UI/Button';
import { CATEGORIES, PRIORITIES, STAFF_LIST } from '../../utils/constants';
import { suggestDueDate } from '../../utils/dateUtils';

const EMPTY = {
  UnitID: '',
  ReportedBy: '',
  PropertyType: '',
  Condo: '',
  UnitNumber: '',
  RoomNumber: '',
  Category: '',
  OtherCategory: '',
  Description: '',
  Priority: '',
  DueDate: '',
  AssignedTo: '',
  Notes: '',
};

const REQUIRED = ['UnitID', 'Category', 'Description', 'Priority'];

export function ReportIssueForm({ onSubmit, onCancel, units = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Active units only, sorted by block then unit number
  const activeUnits = useMemo(() =>
    units
      .filter((u) => u.Status === 'Active')
      .sort((a, b) => `${a.Condo}${a.UnitNumber}`.localeCompare(`${b.Condo}${b.UnitNumber}`)),
    [units]
  );

  // Group units by PropertyType for the dropdown
  const grouped = useMemo(() => {
    const groups = {};
    activeUnits.forEach((u) => {
      if (!groups[u.PropertyType]) groups[u.PropertyType] = [];
      groups[u.PropertyType].push(u);
    });
    return groups;
  }, [activeUnits]);

  const selectedUnit = useMemo(() =>
    units.find((u) => u.UnitID === form.UnitID),
    [units, form.UnitID]
  );

  const roomOptions = useMemo(() => {
    if (!selectedUnit || selectedUnit.HasRooms !== 'Yes' || !selectedUnit.Rooms) return [];
    return selectedUnit.Rooms.split(',').map((r) => r.trim()).filter(Boolean);
  }, [selectedUnit]);

  const field = (key) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      // When unit is selected, auto-fill property details
      if (key === 'UnitID') {
        const unit = units.find((u) => u.UnitID === val);
        if (unit) {
          next.PropertyType = unit.PropertyType;
          next.Condo        = unit.Condo;
          next.UnitNumber   = unit.UnitNumber;
          next.RoomNumber   = ''; // reset room when unit changes
        } else {
          next.PropertyType = '';
          next.Condo        = '';
          next.UnitNumber   = '';
          next.RoomNumber   = '';
        }
      }
      if (key === 'Priority' && val && !prev.DueDate) {
        next.DueDate = suggestDueDate(val);
      }
      if (key === 'Category' && val !== 'Other') {
        next.OtherCategory = '';
      }
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    REQUIRED.forEach((key) => {
      if (!form[key]?.trim()) errs[key] = 'This field is required.';
    });
    if (form.Category === 'Other' && !form.OtherCategory.trim()) {
      errs.OtherCategory = 'Please describe the issue type.';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const locationParts = [form.Condo, `Unit ${form.UnitNumber}`];
    if (form.RoomNumber?.trim()) locationParts.push(form.RoomNumber);
    onSubmit({ ...form, Location: locationParts.join(' - ') });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <p className="text-5xl mb-4">✅</p>
        <p className="text-xl font-semibold text-gray-800">Issue Reported</p>
        <p className="text-sm text-gray-500 mt-1 mb-6">The issue has been added to the system.</p>
        <Button onClick={() => { setForm(EMPTY); setErrors({}); setSubmitted(false); }}>
          Report Another Issue
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-2xl">

      {/* Unit selection */}
      <section>
        <h3 className={sHead}>Unit</h3>
        <FormField label="Select Unit *" error={errors.UnitID}
          sub="Choose from your managed units — property type, block and unit number auto-fill">
          <select value={form.UnitID} onChange={field('UnitID')} className={cls(errors.UnitID)}>
            <option value="">— Select a unit —</option>
            {Object.entries(grouped).map(([type, typeUnits]) => (
              <optgroup key={type} label={type}>
                {typeUnits.map((u) => (
                  <option key={u.UnitID} value={u.UnitID}>
                    {u.Condo} — Unit {u.UnitNumber}{u.Floor ? ` (Floor ${u.Floor})` : ''}
                    {u.HasRooms === 'Yes' ? ' · has rooms' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </FormField>

        {/* Auto-filled summary */}
        {selectedUnit && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <InfoChip label="Type"  value={selectedUnit.PropertyType} />
            <InfoChip label="Block" value={selectedUnit.Condo} />
            <InfoChip label="Unit"  value={selectedUnit.UnitNumber} />
            {selectedUnit.Floor && <InfoChip label="Floor" value={selectedUnit.Floor} />}
          </div>
        )}

        {/* Room selector — only if unit has rooms */}
        {roomOptions.length > 0 && (
          <div className="mt-4">
            <FormField label="Room" sub="Optional — select the specific room affected">
              <select value={form.RoomNumber} onChange={field('RoomNumber')} className={cls()}>
                <option value="">— Whole unit / common area —</option>
                {roomOptions.map((r) => <option key={r}>{r}</option>)}
              </select>
            </FormField>
          </div>
        )}

        <div className="mt-4">
          <FormField label="Reported By">
            <input type="text" value={form.ReportedBy} onChange={field('ReportedBy')}
              placeholder="Name or contact" className={cls()} />
          </FormField>
        </div>
      </section>

      {/* Issue details */}
      <section>
        <h3 className={sHead}>Issue Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Category *" error={errors.Category}>
            <select value={form.Category} onChange={field('Category')} className={cls(errors.Category)}>
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </FormField>

          {form.Category === 'Other' && (
            <FormField label="Specify category *" error={errors.OtherCategory}>
              <input type="text" value={form.OtherCategory} onChange={field('OtherCategory')}
                placeholder="e.g. Pest control, Lock replacement…"
                className={cls(errors.OtherCategory)} autoFocus />
            </FormField>
          )}

          <FormField label="Priority *" error={errors.Priority}>
            <select value={form.Priority} onChange={field('Priority')} className={cls(errors.Priority)}>
              <option value="">Select priority…</option>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </FormField>
        </div>

        <div className="mt-4">
          <FormField label="Description *" error={errors.Description}>
            <textarea value={form.Description} onChange={field('Description')}
              placeholder="Describe the issue in detail…" rows={4}
              className={`${cls(errors.Description)} resize-none`} />
          </FormField>
        </div>
      </section>

      {/* Assignment & scheduling */}
      <section>
        <h3 className={sHead}>Assignment &amp; Scheduling</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Assign To" sub="Optional — can be assigned later">
            <select value={form.AssignedTo} onChange={field('AssignedTo')} className={cls()}>
              <option value="">— Unassigned —</option>
              {STAFF_LIST.map((s) => <option key={s}>{s}</option>)}
            </select>
          </FormField>

          <FormField label="Due Date" sub="Auto-set by priority — you can override">
            <input type="date" value={form.DueDate} onChange={field('DueDate')} className={cls()} />
          </FormField>

          <FormField label="Notes">
            <input type="text" value={form.Notes} onChange={field('Notes')}
              placeholder="Optional notes" className={cls()} />
          </FormField>
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="submit">Submit Issue</Button>
        {onCancel && <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}

function FormField({ label, error, sub, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {sub && <p className="text-xs text-gray-400 mb-1">{sub}</p>}
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5">
      <span className="text-xs text-gray-500 font-medium">{label}:</span>
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    </div>
  );
}

const sHead = 'text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b border-gray-100 pb-2';
const cls = (err = '') =>
  `w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
    err ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
  }`;
