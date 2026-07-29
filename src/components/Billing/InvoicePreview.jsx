import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { displayDate } from '../../utils/dateUtils';

export function InvoicePreview({ isOpen, onClose, invoiceNumber, invoiceDate, issues, onConfirm, units = [] }) {
  const [billedTo, setBilledTo] = useState('');
  const [billedAddress, setBilledAddress] = useState('');
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('inv_company') || '');
  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem('inv_address') || '');
  const [companyPhone, setCompanyPhone] = useState(() => localStorage.getItem('inv_phone') || '');
  const [companyEmail, setCompanyEmail] = useState(() => localStorage.getItem('inv_email') || '');
  const [bankName, setBankName] = useState(() => localStorage.getItem('inv_bank_name') || '');
  const [bankAccName, setBankAccName] = useState(() => localStorage.getItem('inv_bank_acc_name') || '');
  const [bankAccNo, setBankAccNo] = useState(() => localStorage.getItem('inv_bank_acc_no') || '');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Auto-fill owner info when issues share a single unit that has owner details
  useEffect(() => {
    if (!isOpen || !units.length || !issues.length) return;
    const unitIDs = [...new Set(issues.map((i) => i.UnitID).filter(Boolean))];
    if (unitIDs.length !== 1) return;
    const unit = units.find((u) => u.UnitID === unitIDs[0]);
    if (!unit) return;
    if (unit.OwnerName)    setBilledTo(unit.OwnerName);
    if (unit.OwnerAddress) setBilledAddress(unit.OwnerAddress);
  }, [isOpen, issues, units]);

  const total = issues.reduce((s, i) => s + (parseFloat(i.BillAmount) || 0), 0);

  const saveCompanyInfo = () => {
    localStorage.setItem('inv_company', companyName);
    localStorage.setItem('inv_address', companyAddress);
    localStorage.setItem('inv_phone', companyPhone);
    localStorage.setItem('inv_email', companyEmail);
    localStorage.setItem('inv_bank_name', bankName);
    localStorage.setItem('inv_bank_acc_name', bankAccName);
    localStorage.setItem('inv_bank_acc_no', bankAccNo);
  };

  const handlePrint = () => {
    saveCompanyInfo();
    const rows = issues.map((i) => `
      <tr>
        <td>${i.Description}</td>
        <td style="text-align:right">RM ${parseFloat(i.Cost || 0).toFixed(2)}</td>
        <td style="text-align:right"><strong>RM ${parseFloat(i.BillAmount || 0).toFixed(2)}</strong></td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
          .company { font-size: 22px; font-weight: bold; color: #1a1a2e; }
          .company-sub { font-size: 12px; color: #666; margin-top: 4px; }
          .invoice-meta { text-align: right; }
          .invoice-title { font-size: 28px; font-weight: bold; color: #2563eb; letter-spacing: 2px; }
          .invoice-num { font-size: 13px; color: #555; margin-top: 4px; }
          .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .party-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 6px; }
          .party-name { font-size: 15px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #1e3a5f; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          th:last-child, th:nth-last-child(2) { text-align: right; }
          td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
          tr:nth-child(even) td { background: #f9fafb; }
          .total-row td { border-top: 2px solid #1e3a5f; font-weight: bold; font-size: 14px; background: #eff6ff !important; }
          .notes { margin-top: 16px; padding: 14px; border: 1px solid #e5e7eb; border-radius: 6px; }
          .notes-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #888; margin-bottom: 6px; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #999; }
          @page { margin: 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">${companyName || '[Your Company Name]'}</div>
            ${companyAddress ? `<div class="company-sub">${companyAddress}</div>` : ''}
            ${companyPhone ? `<div class="company-sub">Tel: ${companyPhone}</div>` : ''}
            ${companyEmail ? `<div class="company-sub">Email: ${companyEmail}</div>` : ''}
          </div>
          <div class="invoice-meta">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-num">${invoiceNumber}</div>
            <div class="invoice-num">Date: ${displayDate(invoiceDate)}</div>
          </div>
        </div>

        <div class="parties">
          <div>
            <div class="party-label">From</div>
            <div class="party-name">${companyName || '[Your Company Name]'}</div>
            ${companyAddress ? `<div style="font-size:12px;color:#555;margin-top:3px">${companyAddress}</div>` : ''}
            ${companyPhone ? `<div style="font-size:12px;color:#555">Tel: ${companyPhone}</div>` : ''}
            ${companyEmail ? `<div style="font-size:12px;color:#555">Email: ${companyEmail}</div>` : ''}
          </div>
          <div>
            <div class="party-label">Bill To</div>
            <div class="party-name">${billedTo || '[Client Name / Unit]'}</div>
            ${billedAddress ? `<div style="font-size:12px;color:#555;margin-top:3px;white-space:pre-line">${billedAddress}</div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Cost (RM)</th>
              <th>Bill Amount (RM)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td style="text-align:right">Total</td>
              <td style="text-align:right">RM ${issues.reduce((s,i)=>s+(parseFloat(i.Cost||0)),0).toFixed(2)}</td>
              <td style="text-align:right">RM ${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        ${notes ? `<div class="notes"><div class="notes-label">Notes</div>${notes}</div>` : ''}

        ${(bankName || bankAccName || bankAccNo) ? `
        <div style="margin-top:24px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
          <div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:#166534;letter-spacing:1px;margin-bottom:10px;">Payment Details</div>
          <table style="border-collapse:collapse;width:auto">
            ${bankName    ? `<tr><td style="font-size:12px;color:#555;padding:2px 16px 2px 0;font-weight:bold">Bank</td><td style="font-size:13px;color:#111">${bankName}</td></tr>` : ''}
            ${bankAccName ? `<tr><td style="font-size:12px;color:#555;padding:2px 16px 2px 0;font-weight:bold">Account Name</td><td style="font-size:13px;color:#111">${bankAccName}</td></tr>` : ''}
            ${bankAccNo   ? `<tr><td style="font-size:12px;color:#555;padding:2px 16px 2px 0;font-weight:bold">Account No.</td><td style="font-size:14px;font-weight:bold;color:#166534;letter-spacing:1px">${bankAccNo}</td></tr>` : ''}
          </table>
        </div>` : ''}

        <div class="footer">Thank you for your business. Please make payment within 30 days of invoice date.</div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleConfirmAndClose = () => {
    saveCompanyInfo();
    onConfirm({ billedTo, invoiceNumber, invoiceDate });
    setConfirmed(false);
    setBilledTo('');
    setBilledAddress('');
    setNotes('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Generate Invoice — ${invoiceNumber}`}>
      <div className="space-y-5">
        {/* Company info — saved automatically */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Your Company Info <span className="font-normal text-blue-500 normal-case">(saved automatically)</span></p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. ABC Property Management"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone Number</label>
              <input
                type="text"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="e.g. 03-1234 5678"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="e.g. info@yourcompany.com"
                className={inputCls}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Address</label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="e.g. No. 1, Jalan Example, 50000 Kuala Lumpur"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Bank account details — saved automatically */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Bank Account Details <span className="font-normal text-green-500 normal-case">(saved automatically)</span></p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Maybank"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Account Name</label>
              <input
                type="text"
                value={bankAccName}
                onChange={(e) => setBankAccName(e.target.value)}
                placeholder="e.g. ABC Property Management Sdn Bhd"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Account Number</label>
              <input
                type="text"
                value={bankAccNo}
                onChange={(e) => setBankAccNo(e.target.value)}
                placeholder="e.g. 1234 5678 9012"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Invoice meta */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Bill To (Owner Name) *</label>
              <input
                type="text"
                value={billedTo}
                onChange={(e) => setBilledTo(e.target.value)}
                placeholder="Auto-filled from unit owner, or type manually"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Invoice Number</label>
              <input type="text" value={invoiceNumber} readOnly className={`${inputCls} bg-gray-50 text-gray-500`} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Billing Address</label>
              <textarea
                value={billedAddress}
                onChange={(e) => setBilledAddress(e.target.value)}
                placeholder="Auto-filled from unit owner address, or type manually"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className={labelCls}>Invoice Date</label>
              <input type="text" value={displayDate(invoiceDate)} readOnly className={`${inputCls} bg-gray-50 text-gray-500`} />
            </div>
          </div>
        </div>

        {/* Line items preview */}
        <div>
          <p className={labelCls}>Items ({issues.length})</p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Cost</th>
                  <th className="px-3 py-2 text-right">Bill Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issues.map((i) => (
                  <tr key={i.IssueID}>
                    <td className="px-3 py-2 text-gray-700">{i.Description}</td>
                    <td className="px-3 py-2 text-right text-gray-500">RM {parseFloat(i.Cost || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">RM {parseFloat(i.BillAmount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                <tr>
                  <td className="px-3 py-2 text-right text-sm font-bold text-gray-700">Total</td>
                  <td className="px-3 py-2 text-right text-sm text-gray-500">
                    RM {issues.reduce((s, i) => s + (parseFloat(i.Cost || 0)), 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-base font-bold text-blue-700">
                    RM {total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment terms, bank details, etc."
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex items-center gap-3 pt-2 justify-between">
          <p className="text-xs text-gray-400">
            Printing will open a new window. After printing, confirm to mark items as Invoiced.
          </p>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="secondary" onClick={handlePrint}>🖨 Print / Save PDF</Button>
            <Button onClick={handleConfirmAndClose} disabled={!billedTo.trim()}>
              Confirm &amp; Mark Invoiced
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';
const inputCls = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
