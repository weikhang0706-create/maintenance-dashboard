import { PRIORITY_DUE_DAYS } from './constants';

// Returns today as YYYY-MM-DD (no timezone shift)
export function todayISO() {
  const d = new Date();
  return toISO(d);
}

// Converts a JS Date to YYYY-MM-DD string
export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Parses a YYYY-MM-DD string to a JS Date (local midnight, no UTC shift)
export function parseISO(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Formats YYYY-MM-DD to a display string, e.g. "28 Jul 2026"
export function displayDate(str) {
  if (!str) return '—';
  const d = parseISO(str);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Returns suggested due date ISO string based on priority
export function suggestDueDate(priority) {
  const days = PRIORITY_DUE_DAYS[priority] ?? 7;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISO(d);
}

// Returns true if the issue is overdue
export function isOverdue(issue) {
  if (!issue.DueDate) return false;
  if (issue.Status === 'Done' || issue.Status === 'Cancelled') return false;
  return parseISO(issue.DueDate) < parseISO(todayISO());
}

// Returns current month as "YYYY-MM" string
export function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Returns true if a YYYY-MM-DD date falls in the given "YYYY-MM" month
export function inMonth(dateStr, yearMonth) {
  if (!dateStr) return false;
  return dateStr.startsWith(yearMonth);
}
