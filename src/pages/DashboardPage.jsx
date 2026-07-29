import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadCSV } from '../utils/exportUtils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '../components/Layout/Header';
import { SummaryCard } from '../components/Dashboard/SummaryCard';
import { OverdueBanner } from '../components/Dashboard/OverdueBanner';
import { IssueTable } from '../components/Issues/IssueTable';
import { IssueDetailModal } from '../components/Issues/IssueDetailModal';
import { isOverdue, currentYearMonth, inMonth } from '../utils/dateUtils';
import { PROPERTY_TYPES } from '../utils/constants';

const TABS = ['All', ...PROPERTY_TYPES];

const STATUS_COLORS = {
  Open: '#3b82f6',
  Assigned: '#a855f7',
  'In Progress': '#f59e0b',
  Done: '#22c55e',
  Cancelled: '#9ca3af',
};

const PRIORITY_COLORS = {
  Urgent: '#ef4444',
  High: '#f97316',
  Medium: '#3b82f6',
  Low: '#9ca3af',
};

const CATEGORY_COLOR = '#6366f1';

export function DashboardPage({ issues, onUpdate, onDelete, staffNames, staff = [] }) {
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const navigate = useNavigate();
  const ym = currentYearMonth();

  const tabIssues = useMemo(() =>
    activeTab === 'All' ? issues : issues.filter((i) => i.PropertyType === activeTab),
    [issues, activeTab]
  );

  const stats = useMemo(() => {
    const open = tabIssues.filter((i) => i.Status === 'Open').length;
    const inProgress = tabIssues.filter((i) => i.Status === 'In Progress' || i.Status === 'Assigned').length;
    const overdue = tabIssues.filter(isOverdue).length;
    const completedThisMonth = tabIssues.filter((i) => i.Status === 'Done' && inMonth(i.DateCompleted, ym)).length;
    const costThisMonth = tabIssues
      .filter((i) => i.Status === 'Done' && inMonth(i.DateCompleted, ym))
      .reduce((s, i) => s + (parseFloat(i.Cost) || 0), 0);
    const pendingBilling = tabIssues
      .filter((i) => i.Status === 'Done' && (!i.InvoiceStatus || i.InvoiceStatus === 'Unbilled'))
      .length;
    return { open, inProgress, overdue, completedThisMonth, costThisMonth, pendingBilling };
  }, [tabIssues, ym]);

  const handleMonthlyReport = () => {
    const monthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const done = tabIssues.filter((i) => i.Status === 'Done' && inMonth(i.DateCompleted, ym));
    const active = tabIssues.filter((i) => i.Status !== 'Done' && i.Status !== 'Cancelled');
    const totalCost = done.reduce((s, i) => s + (parseFloat(i.Cost) || 0), 0);

    // By category
    const byCat = {};
    done.forEach((i) => { const c = i.Category || 'Other'; byCat[c] = (byCat[c] || { count: 0, cost: 0 }); byCat[c].count++; byCat[c].cost += parseFloat(i.Cost) || 0; });
    const catRows = Object.entries(byCat).sort((a, b) => b[1].count - a[1].count)
      .map(([cat, d]) => `<tr><td>${cat}</td><td style="text-align:center">${d.count}</td><td style="text-align:right">RM ${d.cost.toFixed(2)}</td></tr>`).join('');

    // By staff
    const byStaff = {};
    done.forEach((i) => { const n = i.AssignedTo || 'Unassigned'; byStaff[n] = (byStaff[n] || { count: 0, cost: 0 }); byStaff[n].count++; byStaff[n].cost += parseFloat(i.Cost) || 0; });
    const staffRows = Object.entries(byStaff).sort((a, b) => b[1].count - a[1].count)
      .map(([name, d]) => `<tr><td>${name}</td><td style="text-align:center">${d.count}</td><td style="text-align:right">RM ${d.cost.toFixed(2)}</td></tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Monthly Report — ${monthLabel}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; }
      h1 { font-size: 22px; color: #1e3a5f; margin-bottom: 4px; }
      h2 { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 28px 0 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
      .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
      .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
      .card-val { font-size: 28px; font-weight: bold; color: #1e3a5f; }
      .card-lbl { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1e3a5f; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
      td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) td { background: #f8fafc; }
      .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #e5e7eb; padding-top: 16px; }
      @page { margin: 0; } @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <div><h1>Monthly Maintenance Report</h1><p style="color:#666;margin:0">${monthLabel} — ${activeTab}</p></div>
      <div style="text-align:right;font-size:12px;color:#888">CK Group<br>Generated ${new Date().toLocaleDateString('en-GB')}</div>
    </div>
    <div class="cards">
      <div class="card"><div class="card-val">${tabIssues.filter(i=>i.Status==='Open').length}</div><div class="card-lbl">Open</div></div>
      <div class="card"><div class="card-val">${active.length}</div><div class="card-lbl">Active</div></div>
      <div class="card"><div class="card-val" style="color:#16a34a">${done.length}</div><div class="card-lbl">Completed</div></div>
      <div class="card"><div class="card-val" style="color:#1e3a5f">RM ${totalCost.toFixed(0)}</div><div class="card-lbl">Total Cost</div></div>
    </div>
    <h2>Completed Issues by Category</h2>
    <table><thead><tr><th>Category</th><th style="text-align:center">Issues</th><th style="text-align:right">Cost (RM)</th></tr></thead>
    <tbody>${catRows || '<tr><td colspan="3" style="text-align:center;color:#aaa">No completed issues this month.</td></tr>'}</tbody></table>
    <h2>Staff Performance</h2>
    <table><thead><tr><th>Staff Member</th><th style="text-align:center">Completed</th><th style="text-align:right">Cost (RM)</th></tr></thead>
    <tbody>${staffRows || '<tr><td colspan="3" style="text-align:center;color:#aaa">No data.</td></tr>'}</tbody></table>
    <div class="footer">CK Group Maintenance Dashboard — Confidential</div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const recentOpen = useMemo(() =>
    tabIssues
      .filter((i) => i.Status !== 'Done' && i.Status !== 'Cancelled')
      .sort((a, b) => (b.DateReported > a.DateReported ? 1 : -1))
      .slice(0, 5),
    [tabIssues]
  );

  // Chart data
  const statusData = useMemo(() => {
    const counts = {};
    tabIssues.forEach((i) => { counts[i.Status] = (counts[i.Status] || 0) + 1; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [tabIssues]);

  const categoryData = useMemo(() => {
    const counts = {};
    tabIssues
      .filter((i) => i.Status !== 'Done' && i.Status !== 'Cancelled')
      .forEach((i) => {
        const cat = i.Category || 'Other';
        counts[cat] = (counts[cat] || 0) + 1;
      });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [tabIssues]);

  const priorityData = useMemo(() => {
    const order = ['Urgent', 'High', 'Medium', 'Low'];
    const counts = {};
    tabIssues
      .filter((i) => i.Status !== 'Done' && i.Status !== 'Cancelled')
      .forEach((i) => { counts[i.Priority] = (counts[i.Priority] || 0) + 1; });
    return order.filter((p) => counts[p]).map((name) => ({ name, value: counts[name] }));
  }, [tabIssues]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <img src="/ck-group-logo.png" alt="CK Group" className="h-12 w-auto object-contain hidden md:block" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Overview for {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Property type tabs + report button */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <button
        onClick={handleMonthlyReport}
        className="text-sm font-medium bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-xl shadow-sm transition-colors"
      >
        📄 Monthly Report
      </button>
      </div>

      <OverdueBanner count={stats.overdue} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <SummaryCard label="Open"            value={stats.open}                colorClass="text-blue-600" />
        <SummaryCard label="In Progress"     value={stats.inProgress}          colorClass="text-yellow-600" />
        <SummaryCard
          label="Overdue"
          value={stats.overdue}
          colorClass="text-red-600"
          bgClass={stats.overdue > 0 ? 'bg-red-50' : 'bg-white'}
        />
        <SummaryCard label="Done This Month" value={stats.completedThisMonth}  colorClass="text-green-600" />
        <SummaryCard
          label="Cost This Month"
          value={`RM ${stats.costThisMonth.toFixed(0)}`}
          colorClass="text-gray-900"
          sub="completed repairs"
        />
        <SummaryCard
          label="Pending Billing"
          value={stats.pendingBilling}
          colorClass="text-orange-600"
          bgClass={stats.pendingBilling > 0 ? 'bg-orange-50' : 'bg-white'}
          sub="unbilled done issues"
          onClick={() => navigate('/billing')}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Issues by Status</p>
          {statusData.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-8">No issues yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#e5e7eb'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1 mt-2">
                {statusData.map((entry) => (
                  <li key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[entry.name] ?? '#e5e7eb' }} />
                      {entry.name}
                    </span>
                    <span className="font-semibold text-gray-700">{entry.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Active issues by category */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Active Issues by Category</p>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-8">No active issues.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill={CATEGORY_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Active issues by priority */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Active Issues by Priority</p>
          {priorityData.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-8">No active issues.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={priorityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? '#9ca3af'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <ul className="space-y-1 mt-2">
                {priorityData.map((entry) => (
                  <li key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[entry.name] }} />
                      {entry.name}
                    </span>
                    <span className="font-semibold text-gray-700">{entry.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Recent active issues table */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Active Issues — {activeTab} (newest first)
        </h2>
        <button onClick={() => navigate('/issues')} className="text-xs text-blue-600 hover:underline">
          View all →
        </button>
      </div>
      <IssueTable issues={recentOpen} onSelectIssue={setSelected} onUpdate={onUpdate} onDelete={onDelete} />

      <IssueDetailModal
        issue={selected}
        onClose={() => setSelected(null)}
        staffNames={staffNames}
        staff={staff}
        onUpdate={(id, changes) => {
          onUpdate(id, changes);
          setSelected((prev) => ({ ...prev, ...changes }));
        }}
        onDelete={(id) => {
          onDelete(id);
          setSelected(null);
        }}
      />
    </div>
  );
}
