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
