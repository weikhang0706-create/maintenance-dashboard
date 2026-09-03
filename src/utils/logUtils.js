const LOG_KEY = 'maint_activity_log';
const MAX_ENTRIES = 500;

const SKIP_FIELDS = new Set(['IssueID', 'UnitID', 'StaffID', 'DateReported']);

const FIELD_LABELS = {
  Status: 'Status', AssignedTo: 'Assigned To', Priority: 'Priority',
  DueDate: 'Due Date', DateCompleted: 'Date Completed', Cost: 'Repair Cost (RM)',
  BillAmount: 'Bill Amount (RM)', InvoiceStatus: 'Invoice Status',
  InvoiceNumber: 'Invoice No.', InvoiceDate: 'Invoice Date', BilledTo: 'Billed To',
  Notes: 'Notes', Description: 'Description', Category: 'Category',
  Location: 'Location', PropertyType: 'Property Type', Condo: 'Block',
  UnitNumber: 'Unit', RoomNumber: 'Room', ReportedBy: 'Reported By',
  OtherCategory: 'Other Category', HasRooms: 'Has Rooms', Rooms: 'Rooms',
  OwnerName: 'Owner Name', OwnerAddress: 'Owner Address', Floor: 'Floor',
  Name: 'Name', Role: 'Role', Phone: 'Phone', Email: 'Email',
};

export const fieldLabel = (key) => FIELD_LABELS[key] ?? key;

export function writeLog({ action, entity, entityID, summary, details = [] }) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    entity,
    entityID,
    summary,
    details,
  };
  const log = readLog();
  log.unshift(entry);
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch {
    log.length = Math.floor(MAX_ENTRIES / 2);
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  }
}

export function readLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function clearLog() {
  localStorage.removeItem(LOG_KEY);
}

export function diffObjects(before, after) {
  const changes = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    if (SKIP_FIELDS.has(key)) continue;
    const oldVal = String(before[key] ?? '');
    const newVal = String(after[key] ?? '');
    if (oldVal !== newVal) {
      changes.push({ field: key, from: before[key] ?? '', to: after[key] ?? '' });
    }
  }
  return changes;
}

const PRIORITY_FIELDS = ['Status', 'AssignedTo', 'Priority', 'InvoiceStatus', 'Cost', 'BillAmount', 'DateCompleted'];

export function buildUpdateSummary(diffs) {
  if (!diffs.length) return 'No changes';
  const sorted = [...diffs].sort((a, b) => {
    const ai = PRIORITY_FIELDS.indexOf(a.field);
    const bi = PRIORITY_FIELDS.indexOf(b.field);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const top = sorted.slice(0, 3);
  const more = sorted.length - 3;
  const parts = top.map((d) =>
    `${fieldLabel(d.field)}: ${String(d.to || '(empty)').slice(0, 30)}`
  );
  return parts.join(' | ') + (more > 0 ? ` (+${more} more)` : '');
}

export function formatLogTimestamp(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const date = d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
}
