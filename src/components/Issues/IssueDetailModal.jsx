import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import {
  STATUS_COLORS, PRIORITY_COLORS, PROPERTY_TYPE_COLORS,
  STATUSES, STAFF_LIST, CATEGORIES, PRIORITIES, PROPERTY_TYPES,
} from '../../utils/constants';

import { displayDate, todayISO } from '../../utils/dateUtils';

function formatWANumber(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('60')) return digits;
  if (digits.startsWith('0')) return '60' + digits.slice(1);
  return '60' + digits;
}

export function IssueDetailModal({ issue, onClose, onUpdate, onDelete, staffNames = [], staff = [] }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (issue) {
      setConfirmDelete(false);
      setForm({
        PropertyType:  issue.PropertyType  || '',
        Condo:         issue.Condo         || '',
        UnitNumber:    issue.UnitNumber     || '',
        RoomNumber:    issue.RoomNumber     || '',
        ReportedBy:    issue.ReportedBy     || '',
        Category:      issue.Category      || '',
        OtherCategory: issue.OtherCategory  || '',
        Description:   issue.Description   || '',
        Priority:      issue.Priority      || '',
        Status:        issue.Status        || '',
        AssignedTo:    issue.AssignedTo    || '',
        DueDate:       issue.DueDate       || '',
        DateCompleted: issue.DateCompleted  || '',
        Cost:          issue.Cost          || '',
        Notes:         issue.Notes         || '',
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
      if (key === 'Status' && val === 'Done' && !prev.DateCompleted) {
        next.DateCompleted = todayISO();
      }
      if (key === 'Status' && val !== 'Done') {
        next.DateCompleted = '';
      }
      if (key === 'Category' && val !== 'Other') {
        next.OtherCategory = '';
      }
      return next;
    });
  };

  const handleSave = () => {
    const locationParts = [form.Condo, form.UnitNumber ? `Unit ${form.UnitNumber}` : ''].filter(Boolean);
    if (form.RoomNumber?.trim()) locationParts.push(form.RoomNumber);
    onUpdate(issue.IssueID, { ...form, Location: locationParts.join(' - ') || issue.Location });
    setEditing(false);
  };

  const isDone = form.Status === 'Done';

  return (
    <Modal isOpen={!!issue} onClose={onClose} title={`${issue.IssueID} — ${issue.Location}`}>
      <div className="space-y-5">

        {/* Read-only header */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Date Reported" value={displayDate(issue.DateReported)} />
          <Info label="Issue ID" value={issue.IssueID} />
        </div>

        <hr className="border-gray-100" />

        {editing ? (
          <div className="space-y-4">

            {/* Location */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Condo / Block">
                <input type="text" value={form.Condo} onChange={field('Condo')} className={inputCls} placeholder="e.g. Block A" />
              </Field>
              <Field label="Unit Number">
                <input type="text" value={form.UnitNumber} onChange={field('UnitNumber')} className={inputCls} placeholder="e.g. 3A" />
              </Field>
              <Field label="Room Number">
                <input type="text" value={form.RoomNumber} onChange={field('RoomNumber')} className={inputCls} placeholder="Optional" />
              </Field>
            </div>

            {/* Issue details */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Issue Details</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Property Type">
                <select value={form.PropertyType} onChange={field('PropertyType')} className={selectCls}>
                  <option value="">—</option>
                  {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Reported By">
                <input type="text" value={form.ReportedBy} onChange={field('ReportedBy')} className={inputCls} />
              </Field>
              <Field label="Category">
                <select value={form.Category} onChange={field('Category')} className={selectCls}>
                  <option value="">—</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              {form.Category === 'Other' && (
                <Field label="Specify Category">
                  <input type="text" value={form.OtherCategory} onChange={field('OtherCategory')} className={inputCls} placeholder="e.g. Pest control" />
                </Field>
              )}
              <Field label="Priority">
                <select value={form.Priority} onChange={field('Priority')} className={selectCls}>
                  <option value="">—</option>
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea value={form.Description} onChange={field('Description')} rows={3} className={`${inputCls} resize-none`} />
            </Field>

            {/* Status & assignment */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Status &amp; Assignment</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <select value={form.Status} onChange={field('Status')} className={selectCls}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Assigned To">
                <select value={form.AssignedTo} onChange={field('AssignedTo')} className={selectCls}>
                  <option value="">— Unassigned —</option>
                  {(staffNames.length > 0 ? staffNames : STAFF_LIST).map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Due Date">
                <input type="date" value={form.DueDate} onChange={field('DueDate')} className={inputCls} />
              </Field>
              <Field
                label="Date Completed"
                sub={isDone ? undefined : 'Only applies when status is Done'}
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
                  type="number" min="0" step="0.01"
                  value={form.Cost} onChange={field('Cost')}
                  className={inputCls} placeholder="0.00"
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea value={form.Notes} onChange={field('Notes')} rows={2} className={`${inputCls} resize-none`} />
            </Field>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>

        ) : (
          <div className="space-y-4">

            {/* Location */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Location</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Info label="Condo / Block"  value={issue.Condo      || issue.Location?.split(' - ')[0] || '—'} />
                <Info label="Unit Number"    value={issue.UnitNumber  || issue.Location?.split(' - ')[1]?.replace(/^Unit\s+/i, '') || '—'} />
                <Info label="Room Number"    value={issue.RoomNumber  || issue.Location?.split(' - ')[2] || '—'} />
              </div>
            </div>

            {/* Issue details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Property Type">
                {issue.PropertyType ? (
                  <Badge className={PROPERTY_TYPE_COLORS[issue.PropertyType] ?? 'bg-gray-100 text-gray-600'}>
                    {issue.PropertyType}
                  </Badge>
                ) : <span className="text-gray-400">—</span>}
              </Info>
              <Info label="Reported By"  value={issue.ReportedBy || '—'} />
              <Info
                label="Category"
                value={issue.Category === 'Other' && issue.OtherCategory
                  ? `Other — ${issue.OtherCategory}`
                  : issue.Category || '—'}
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

            {/* Status & assignment */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Status">
                <Badge className={STATUS_COLORS[issue.Status]}>{issue.Status}</Badge>
              </Info>
              <Info label="Assigned To"    value={issue.AssignedTo    || '—'} />
              <Info label="Due Date"       value={displayDate(issue.DueDate)} />
              <Info label="Date Completed" value={displayDate(issue.DateCompleted)} />
              <Info label="Cost"           value={issue.Cost ? `RM ${parseFloat(issue.Cost).toFixed(2)}` : '—'} />
            </div>

            {issue.Notes && (
              <div className="text-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{issue.Notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-semibold">Delete this issue permanently?</span>
                  <button
                    onClick={() => onDelete(issue.IssueID)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-semibold"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-red-400 hover:text-red-600 underline"
                >
                  Delete Issue
                </button>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {issue.AssignedTo && (() => {
                  const assignedStaff = staff.find((s) => s.Name === issue.AssignedTo);
                  const waNum = formatWANumber(assignedStaff?.Phone);
                  const msg = encodeURIComponent(
                    `Hi ${issue.AssignedTo}, you have been assigned a maintenance issue.\n\n` +
                    `📋 Issue: ${issue.IssueID}\n` +
                    `📍 Location: ${issue.Location}\n` +
                    `🔧 Category: ${issue.Category}\n` +
                    `⚠ Priority: ${issue.Priority}\n` +
                    `📝 Description: ${issue.Description}\n` +
                    (issue.DueDate ? `📅 Due Date: ${issue.DueDate}\n` : '') +
                    `\nPlease attend to this issue promptly. Thank you.`
                  );
                  if (waNum) {
                    return (
                      <a
                        href={`https://wa.me/${waNum}?text=${msg}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        💬 WhatsApp {issue.AssignedTo.split(' ')[0]}
                      </a>
                    );
                  }
                  return (
                    <span className="text-xs text-gray-400 italic">
                      💬 Add phone to staff profile to enable WhatsApp
                    </span>
                  );
                })()}
                <Button onClick={() => setEditing(true)}>Edit Issue</Button>
              </div>
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
const inputCls  = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
