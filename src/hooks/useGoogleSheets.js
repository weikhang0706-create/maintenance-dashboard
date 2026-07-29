const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const TAB_ISSUES = 'MAINT_Issues';
const TAB_UNITS  = 'UNITS';
const TAB_STAFF  = 'STAFF';

export const canRead  = () => Boolean(API_KEY && SHEET_ID);
export const canWrite = () => Boolean(SCRIPT_URL);

// Generic tab reader — fetches any tab up to lastCol
async function readTab(tab, lastCol) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${tab}!A:${lastCol}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Sheets API error — HTTP ${res.status}`);
  }
  const { values = [] } = await res.json();
  if (values.length < 2) return [];
  const [headers, ...rows] = values;
  return rows
    .filter((r) => r.some((c) => c !== ''))
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])));
}

// Read issues (MAINT_Issues tab, columns A–W)
export const sheetsRead = () => readTab(TAB_ISSUES, 'W');

// Read units (UNITS tab, columns A–K, includes owner fields)
export const unitsRead  = () => readTab(TAB_UNITS, 'K');

// Generic Apps Script caller — uses GET with encoded JSON to avoid CORS preflight
async function scriptCall(action, data) {
  if (!SCRIPT_URL) throw new Error('VITE_APPS_SCRIPT_URL not configured.');
  const encoded = encodeURIComponent(JSON.stringify(data));
  const res = await fetch(`${SCRIPT_URL}?action=${action}&data=${encoded}`);
  if (!res.ok) throw new Error(`Apps Script HTTP ${res.status}`);
  const body = await res.json();
  if (!body.success) throw new Error(body.error ?? 'Apps Script returned failure');
  return body;
}

export const sheetsCreate = (issue)   => scriptCall('create',      issue);
export const sheetsUpdate = (issue)   => scriptCall('update',      issue);
export const sheetsDelete = (issueID) => scriptCall('delete',      { IssueID: issueID });
export const unitsCreate  = (unit)    => scriptCall('createUnit',  unit);
export const unitsUpdate  = (unit)    => scriptCall('updateUnit',  unit);
export const staffRead    = ()        => readTab(TAB_STAFF, 'G');
export const staffCreate  = (s)       => scriptCall('createStaff', s);
export const staffUpdate  = (s)       => scriptCall('updateStaff', s);
export const staffDelete  = (id)      => scriptCall('deleteStaff', { StaffID: id });
