import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function DashboardPage({ issues, onUpdate, onDelete, staffNames }) {
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
      <Header
        title="Maintenance Dashboard"
        subtitle={`Overview for ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
      />

      {/* Property type tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
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
