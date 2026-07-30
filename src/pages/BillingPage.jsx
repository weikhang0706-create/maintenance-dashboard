import { useState, useMemo } from 'react';
import { downloadCSV } from '../utils/exportUtils';
import { Header } from '../components/Layout/Header';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { InvoicePreview } from '../components/Billing/InvoicePreview';
import { PROPERTY_TYPES, PROPERTY_TYPE_COLORS, INVOICE_STATUSES, INVOICE_STATUS_COLORS } from '../utils/constants';
import { displayDate, todayISO } from '../utils/dateUtils';
import { generateInvoiceNumber, saveInvoiceWatermark } from '../utils/issueUtils';

const BILLING_CSV_COLS = [
  { label: 'Issue ID',        key: 'IssueID' },
  { label: 'Condo',           key: 'Condo' },
  { label: 'Unit No.',        key: 'UnitNumber' },
  { label: 'Room',            key: 'RoomNumber' },
  { label: 'Category',        key: 'Category' },
  { label: 'Description',     key: 'Description' },
  { label: 'Date Completed',  key: 'DateCompleted' },
  { label: 'Repair Cost (RM)',key: 'Cost' },
  { label: 'Bill Amount (RM)',key: 'BillAmount' },
  { label: 'Invoice Status',  key: 'InvoiceStatus' },
  { label: 'Invoice No.',     key: 'InvoiceNumber' },
  { label: 'Invoice Date',    key: 'InvoiceDate' },
  { label: 'Billed To',       key: 'BilledTo' },
];

export function BillingPage({ issues, onUpdate, units = [] }) {
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('Unbilled');
  const [completedFrom, setCompletedFrom] = useState('');
  const [completedTo, setCompletedTo] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [billAmounts, setBillAmounts] = useState({});
  const [costAmounts, setCostAmounts] = useState({});
  const [showInvoice, setShowInvoice] = useState(false);

  // Only Done issues are billable
  const billable = useMemo(() =>
    issues.filter((i) => i.Status === 'Done'),
    [issues]
  );

  const filtered = useMemo(() => {
    return billable.filter((i) => {
      if (filterType && i.PropertyType !== filterType) return false;
      if (filterStatus && i.InvoiceStatus !== filterStatus) return false;
      if (completedFrom && i.DateCompleted < completedFrom) return false;
      if (completedTo   && i.DateCompleted > completedTo)   return false;
      return true;
    });
  }, [billable, filterType, filterStatus, completedFrom, completedTo]);

  // Summary totals across all Done issues
  const summary = useMemo(() => {
    const unbilledCost = billable
      .filter((i) => i.InvoiceStatus === 'Unbilled')
      .reduce((s, i) => s + (parseFloat(i.BillAmount || costAmounts[i.IssueID] || i.Cost || 0)), 0);
    const invoiced = billable
      .filter((i) => i.InvoiceStatus === 'Invoiced')
      .reduce((s, i) => s + (parseFloat(i.BillAmount || 0)), 0);
    const paid = billable
      .filter((i) => i.InvoiceStatus === 'Paid')
      .reduce((s, i) => s + (parseFloat(i.BillAmount || 0)), 0);
    return { unbilledCost, invoiced, paid };
  }, [billable, costAmounts]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const selectableIds = filtered
      .filter((i) => i.InvoiceStatus === 'Unbilled')
      .map((i) => i.IssueID);
    const allSelected = selectableIds.every((id) => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  };

  const handleBillAmountChange = (issueID, val) => {
    setBillAmounts((prev) => ({ ...prev, [issueID]: val }));
  };

  const handleCostChange = (issueID, val) => {
    setCostAmounts((prev) => ({ ...prev, [issueID]: val }));
  };

  const getCost = (issue) =>
    costAmounts[issue.IssueID] !== undefined ? costAmounts[issue.IssueID] : (issue.Cost || '');

  const getBillAmount = (issue) =>
    billAmounts[issue.IssueID] !== undefined ? billAmounts[issue.IssueID] : issue.BillAmount;

  const getMarkup = (issue) => {
    const cost = parseFloat(getCost(issue) || 0);
    const bill = parseFloat(getBillAmount(issue) || 0);
    if (!cost || !bill) return null;
    return (((bill - cost) / cost) * 100).toFixed(1);
  };

  const selectedIssues = useMemo(() =>
    filtered.filter((i) => selected.has(i.IssueID)).map((i) => ({
      ...i,
      BillAmount: getBillAmount(i),
    })),
    [filtered, selected, billAmounts]
  );

  const canGenerateInvoice =
    selectedIssues.length > 0 &&
    selectedIssues.every((i) => parseFloat(i.BillAmount) > 0);

  const invoiceNumber = useMemo(() => generateInvoiceNumber(issues), [issues]);

  const handleSaveBillAmounts = () => {
    Object.entries(costAmounts).forEach(([id, cost]) => onUpdate(id, { Cost: cost }));
    Object.entries(billAmounts).forEach(([id, amount]) => onUpdate(id, { BillAmount: amount }));
    setCostAmounts({});
    setBillAmounts({});
  };

  const handleConfirmInvoice = ({ billedTo, invoiceNumber: invNum, invoiceDate }) => {
    saveInvoiceWatermark(invNum);
    // Save bill amounts first, then mark as Invoiced
    Object.entries(billAmounts).forEach(([id, amount]) => {
      if (selected.has(id)) onUpdate(id, { BillAmount: amount });
    });
    selectedIssues.forEach((i) => {
      onUpdate(i.IssueID, {
        BillAmount: getBillAmount(i),
        InvoiceStatus: 'Invoiced',
        InvoiceNumber: invNum,
        InvoiceDate: invoiceDate,
        BilledTo: billedTo,
      });
    });
    setSelected(new Set());
    setBillAmounts({});
    setShowInvoice(false);
  };

  const handleMarkPaid = (issueID) => {
    onUpdate(issueID, { InvoiceStatus: 'Paid' });
  };

  const unbilledSelectableCount = filtered.filter((i) => i.InvoiceStatus === 'Unbilled').length;
  const hasPendingAmounts = Object.keys(billAmounts).length > 0 || Object.keys(costAmounts).length > 0;

  return (
    <div>
      <Header
        title="Cost &amp; Billing"
        subtitle="Manage repair costs, mark up, and generate client invoices"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Unbilled (repair cost)"
          value={`RM ${summary.unbilledCost.toFixed(2)}`}
          color="text-orange-600"
          bg="bg-orange-50"
          sub="awaiting billing"
        />
        <SummaryCard
          label="Invoiced"
          value={`RM ${summary.invoiced.toFixed(2)}`}
          color="text-blue-600"
          bg="bg-blue-50"
          sub="awaiting payment"
        />
        <SummaryCard
          label="Paid"
          value={`RM ${summary.paid.toFixed(2)}`}
          color="text-green-600"
          bg="bg-green-50"
          sub="collected"
        />
      </div>

      {/* Filters + actions bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={selectCls}
        >
          <option value="">All Property Types</option>
          {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={selectCls}
        >
          <option value="">All Statuses</option>
          {INVOICE_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          <span className="text-xs font-semibold text-green-700 whitespace-nowrap">Completed:</span>
          <input
            type="date"
            value={completedFrom}
            onChange={(e) => setCompletedFrom(e.target.value)}
            className="text-sm border border-green-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          />
          <span className="text-xs text-green-600">to</span>
          <input
            type="date"
            value={completedTo}
            onChange={(e) => setCompletedTo(e.target.value)}
            className="text-sm border border-green-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          />
          {(completedFrom || completedTo) && (
            <button
              onClick={() => { setCompletedFrom(''); setCompletedTo(''); }}
              className="text-xs text-green-600 hover:text-green-800 font-semibold"
            >✕</button>
          )}
        </div>

        <span className="text-sm text-gray-400 ml-1">{filtered.length} issues</span>

        <div className="ml-auto flex gap-2">
          {hasPendingAmounts && (
            <Button variant="secondary" onClick={handleSaveBillAmounts}>
              Save Amounts
            </Button>
          )}
          <Button variant="secondary" onClick={() => downloadCSV(`billing-${new Date().toISOString().slice(0,10)}.csv`, filtered, BILLING_CSV_COLS)}>
            ↓ Export CSV
          </Button>
          <Button
            onClick={() => setShowInvoice(true)}
            disabled={!canGenerateInvoice}
          >
            Generate Invoice ({selected.size} selected)
          </Button>
        </div>
      </div>

      {/* Billing table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={
                    unbilledSelectableCount > 0 &&
                    filtered
                      .filter((i) => i.InvoiceStatus === 'Unbilled')
                      .every((i) => selected.has(i.IssueID))
                  }
                  onChange={toggleAll}
                  className="rounded"
                  title="Select all unbilled"
                />
              </th>
              <th className={thCls}>Type</th>
              <th className={thCls}>Condo</th>
              <th className={thCls}>Unit No.</th>
              <th className={thCls}>Room</th>
              <th className={thCls}>Category</th>
              <th className={thCls}>Description</th>
              <th className={thCls}>Completed</th>
              <th className={`${thCls} text-right`}>Repair Cost</th>
              <th className={`${thCls} text-right`}>Bill Amount (RM)</th>
              <th className={thCls}>Invoice Status</th>
              <th className={thCls}>Invoice #</th>
              <th className={thCls}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2">💳</p>
                  <p>No billing records match your filters.</p>
                </td>
              </tr>
            ) : (
              filtered.map((issue) => {
                const selectable = issue.InvoiceStatus === 'Unbilled';
                const billAmt = getBillAmount(issue);

                return (
                  <tr
                    key={issue.IssueID}
                    className={`transition-colors ${selected.has(issue.IssueID) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(issue.IssueID)}
                        disabled={!selectable}
                        onChange={() => toggleSelect(issue.IssueID)}
                        className="rounded disabled:opacity-30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={PROPERTY_TYPE_COLORS[issue.PropertyType] ?? 'bg-gray-100 text-gray-600'}>
                        {issue.PropertyType}
                      </Badge>
                    </td>
                    <ExpandableCell value={getCondo(issue)} />
                    <ExpandableCell value={getUnit(issue)} />
                    <ExpandableCell value={getRoom(issue)} />
                    <td className="px-4 py-3 text-gray-600">{issue.Category}</td>
                    <ExpandableCell value={issue.Description} />
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{displayDate(issue.DateCompleted)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-gray-400 text-xs">RM</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={getCost(issue)}
                          onChange={(e) => handleCostChange(issue.IssueID, e.target.value)}
                          placeholder="0.00"
                          className="w-24 text-sm text-right border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {selectable ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-gray-400 text-xs">RM</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={billAmt}
                            onChange={(e) => handleBillAmountChange(issue.IssueID, e.target.value)}
                            placeholder="0.00"
                            className="w-24 text-sm text-right border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-800">
                          {billAmt ? `RM ${parseFloat(billAmt).toFixed(2)}` : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={INVOICE_STATUS_COLORS[issue.InvoiceStatus] ?? 'bg-gray-100 text-gray-500'}>
                        {issue.InvoiceStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {issue.InvoiceNumber || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {issue.InvoiceStatus === 'Invoiced' && (
                        <button
                          onClick={() => handleMarkPaid(issue.IssueID)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium underline whitespace-nowrap"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="mt-3 text-xs text-gray-500 text-right">
          {!canGenerateInvoice && (
            <span className="text-orange-500">⚠ Enter a bill amount for all selected issues before generating.</span>
          )}
        </div>
      )}

      <InvoicePreview
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        invoiceNumber={invoiceNumber}
        invoiceDate={todayISO()}
        issues={selectedIssues}
        onConfirm={handleConfirmInvoice}
        units={units}
      />
    </div>
  );
}

function getCondo(issue) {
  if (issue.Condo) return issue.Condo;
  return issue.Location?.split(' - ')[0] || '';
}
function getUnit(issue) {
  if (issue.UnitNumber) return issue.UnitNumber;
  const part = issue.Location?.split(' - ')[1] || '';
  return part.replace(/^Unit\s+/i, '');
}
function getRoom(issue) {
  if (issue.RoomNumber) return issue.RoomNumber;
  return issue.Location?.split(' - ')[2] || '';
}

function ExpandableCell({ value }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = value && value.length > 14;
  return (
    <td className="px-4 py-3 text-sm text-gray-700">
      {value ? (
        <div className="flex items-start gap-1">
          <span className={expanded ? 'whitespace-normal break-words max-w-[160px]' : 'truncate max-w-[100px] block'}>
            {value}
          </span>
          {isLong && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="shrink-0 text-[10px] text-blue-400 hover:text-blue-600 border border-blue-200 rounded px-1 leading-4 mt-0.5"
            >
              {expanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      ) : (
        <span className="text-gray-300">—</span>
      )}
    </td>
  );
}

function SummaryCard({ label, value, color, bg, sub }) {
  return (
    <div className={`${bg} rounded-xl border border-gray-200 p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const selectCls = 'text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
const thCls = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap';
