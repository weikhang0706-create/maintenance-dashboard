import { isOverdue, inMonth } from './dateUtils';

// Generates next IssueID from existing issues array
export function generateIssueID(issues) {
  if (!issues || issues.length === 0) return 'MNT-0001';
  const nums = issues
    .map((i) => parseInt(i.IssueID?.replace('MNT-', '') ?? '0', 10))
    .filter((n) => !isNaN(n));
  const max = Math.max(0, ...nums);
  return `MNT-${String(max + 1).padStart(4, '0')}`;
}

// Generates next InvoiceNumber — takes the higher of localStorage watermark vs Sheets data
// so the sequence never resets even if invoiced issues are deleted from Sheets
export function generateInvoiceNumber(issues) {
  const numsFromSheets = issues
    .map((i) => parseInt(i.InvoiceNumber?.replace('INV-', '') ?? '0', 10))
    .filter((n) => !isNaN(n) && n > 0);
  const maxFromSheets = Math.max(0, ...numsFromSheets);
  const watermark = parseInt(localStorage.getItem('inv_seq_watermark') ?? '0', 10);
  const next = Math.max(maxFromSheets, watermark) + 1;
  return `INV-${String(next).padStart(4, '0')}`;
}

// Call this after an invoice is confirmed to persist the watermark
export function saveInvoiceWatermark(invoiceNumber) {
  const n = parseInt(invoiceNumber.replace('INV-', '') ?? '0', 10);
  const current = parseInt(localStorage.getItem('inv_seq_watermark') ?? '0', 10);
  if (n > current) localStorage.setItem('inv_seq_watermark', String(n));
}

// Normalises a phone number to WhatsApp-compatible format (e.g. 60111234567)
export function formatWANumber(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('60')) return digits;
  if (digits.startsWith('0')) return '6' + digits;
  return null;
}

const PRIORITY_EMOJI = { Urgent: '🔴', High: '🟠', Medium: '🟡', Low: '⚪' };

// Builds a WhatsApp job-list message for a staff member
export function buildJobListWAMessage(staffName, openIssues) {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const lines = [
    `Hi ${staffName} 👋`,
    ``,
    `Here are your open jobs as of ${today}:`,
    ``,
  ];

  const sorted = [...openIssues].sort((a, b) => (a.Condo ?? '').localeCompare(b.Condo ?? ''));
  sorted.forEach((issue, i) => {
    const emoji = PRIORITY_EMOJI[issue.Priority] || '⚪';
    const parts = [issue.Condo, issue.UnitNumber ? `Unit ${issue.UnitNumber}` : '', issue.RoomNumber].filter(Boolean);
    const location = parts.join(' — ');
    lines.push(`${i + 1}. ${emoji} ${issue.Priority ? `${issue.Priority.toUpperCase()} | ` : ''}${issue.Category}`);
    if (location) lines.push(`   📍 ${location}`);
    if (issue.Description) lines.push(`   "${issue.Description}"`);
    lines.push('');
  });

  lines.push(`${openIssues.length} job(s) pending. Please update status once done. Thank you! 🙏`);
  lines.push(`— CK Group`);
  return lines.join('\n');
}

// Sums cost by category for issues completed in the given "YYYY-MM" month
export function costByCategory(issues, yearMonth) {
  const result = {};
  issues
    .filter((i) => i.Status === 'Done' && inMonth(i.DateCompleted, yearMonth))
    .forEach((i) => {
      result[i.Category] = (result[i.Category] || 0) + (parseFloat(i.Cost) || 0);
    });
  return result;
}
