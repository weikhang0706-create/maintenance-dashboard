import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { STATUS_COLORS, PRIORITY_COLORS, PROPERTY_TYPE_COLORS, STATUSES, STAFF_LIST } from '../../utils/constants';
import { displayDate, suggestDueDate, todayISO } from '../../utils/dateUtils';

export function IssueDetailModal({ issue, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (issue) {
      setForm({
        Status: issue.Status,
        AssignedTo: issue.AssignedTo,
        DueDate: issue.DueDate,
        DateCompleted: issue.DateCompleted,
        Cost: issue.Cost,
        Notes: issue.Notes,
      });
      setEditing(false);
    }
  }, [issue]);

  if (!issue) return null;

  const field = (key) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'AssignedTo' && val && next.Status === 'Open') {
        next.Status = 'Assigned';
      }
      // Auto-fill today as completion date when marking Done (user can still change it)
      if (key === 'Status' && val === 'Done' && !prev.DateCompleted) {
        next.DateCompleted = todayISO();
      }
      // Clear completion date if moving away from Done
      if (key === 'Status' && val !== 'Done') {
        next.DateCompleted = '';
      }
      return next;
    });
  };

  const handleSave = () => {
    onUpdate(issue.IssueID, form);
    setEditing(false);
  };

  const isDone = form.Status === 'Done';

  return (
    <Modal isOpen={!!issue} onClose={onClose} title={`${issue.IssueID} — ${issue.Location}`}>
      <div className="space-y-5">
        {/* Read-only header info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Property Type">
            {issue.PropertyType ? (
              <Badge className={PROPERTY_TYPE_COLORS[issue.PropertyType] ?? 'bg-gray-100 text-gray-600'}>
                {issue.PropertyType}
              </Badge>
            ) : <span className="text-gray-400">—</span>}
          </Info>
          <Info label="Reported By" value={issue.ReportedBy || '—'} />
          <Info label="Date Reported" value={displayDate(issue.DateReported)} />
          <Info
            label="Category"
            value={issue.Category === 'Other' && issue.OtherCategory
              ? `Other — ${issue.OtherCategory}`
              : issue.Category}
          />
          <Info label="Priority">
            <Badge className={PRIORITY_COLORS[issue.Priority]}>{issue.Priority}</Badge>
          </Info>
        </div>

        <div className="text-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
          <p className="text-gray-800 bg-gray-50 rounded-lg p-3">{issue.Description}</p>
        </div>

        <hr className="border-gray-100" />

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <select value={form.Status} onChange={field('Status')} className={selectCls}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Assigned To">
                <select value={form.AssignedTo} onChange={field('AssignedTo')} className={selectCls}>
                  <option value="">— Unassigned —</option>
                  {STAFF_LIST.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Due Date">
                <input type="date" value={form.DueDate} onChange={field('DueDate')} className={inputCls} />
              </Field>

              <Field
                label="Date Completed"
                sub={isDone ? 'Select the actual completion date' : 'Only applies when status is Done'}
              >
                <input
                  type="date"
                  value={form.DateCompleted}
                  onChange={field('DateCompleted')}
                  disabled={!isDone}
                  max={todayISO()}
                  className={`${inputCls} ${!isDone ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
              </Field>

              <Field label="Cost (RM)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.Cost}
                  onChange={field('Cost')}
                  className={inputCls}
                  placeholder="0.00"
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea value={form.Notes} onChange={field('Notes')} className={`${inputCls} h-20 resize-none`} />
            </Field>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Status">
                <Badge className={STATUS_COLORS[issue.Status]}>{issue.Status}</Badge>
              </Info>
              <Info label="Assigned To" value={issue.AssignedTo || '—'} />
              <Info label="Due Date" value={displayDate(issue.DueDate)} />
              <Info label="Date Completed" value={displayDate(issue.DateCompleted)} />
              <Info label="Cost" value={issue.Cost ? `RM ${parseFloat(issue.Cost).toFixed(2)}` : '—'} />
            </div>
            {issue.Notes && (
              <div className="text-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{issue.Notes}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setEditing(true)}>Edit Issue</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Info({ label, value, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      {children ?? <p className="text-gray-800">{value}</p>}
    </div>
  );
}

function Field({ label, sub, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {sub && <p className="text-xs text-gray-400 mb-1">{sub}</p>}
      {children}
    </div>
  );
}

const selectCls = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
const inputCls = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
