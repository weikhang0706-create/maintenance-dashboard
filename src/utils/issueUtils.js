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

// Generates next InvoiceNumber from existing issues
export function generateInvoiceNumber(issues) {
  const nums = issues
    .map((i) => parseInt(i.InvoiceNumber?.replace('INV-', '') ?? '0', 10))
    .filter((n) => !isNaN(n) && n > 0);
  const max = Math.max(0, ...nums);
  return `INV-${String(max + 1).padStart(4, '0')}`;
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
