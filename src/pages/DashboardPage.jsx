import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { SummaryCard } from '../components/Dashboard/SummaryCard';
import { OverdueBanner } from '../components/Dashboard/OverdueBanner';
import { CostWidget } from '../components/Dashboard/CostWidget';
import { IssueTable } from '../components/Issues/IssueTable';
import { IssueDetailModal } from '../components/Issues/IssueDetailModal';
import { isOverdue, currentYearMonth, inMonth } from '../utils/dateUtils';
import { costByCategory } from '../utils/issueUtils';
import { PROPERTY_TYPES } from '../utils/constants';

const TABS = ['All', ...PROPERTY_TYPES];

export function DashboardPage({ issues, onUpdate }) {
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
    return { open, inProgress, overdue, completedThisMonth, costThisMonth };
  }, [tabIssues, ym]);

  const recentOpen = useMemo(() =>
    tabIssues
      .filter((i) => i.Status !== 'Done' && i.Status !== 'Cancelled')
      .sort((a, b) => (b.DateReported > a.DateReported ? 1 : -1))
      .slice(0, 5),
    [tabIssues]
  );

  const catCosts = useMemo(() => costByCategory(tabIssues, ym), [tabIssues, ym]);

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
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <OverdueBanner count={stats.overdue} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard label="Open" value={stats.open} colorClass="text-blue-600" />
        <SummaryCard label="In Progress" value={stats.inProgress} colorClass="text-yellow-600" />
        <SummaryCard
          label="Overdue"
          value={stats.overdue}
          colorClass="text-red-600"
          bgClass={stats.overdue > 0 ? 'bg-red-50' : 'bg-white'}
        />
        <SummaryCard label="Done This Month" value={stats.completedThisMonth} colorClass="text-green-600" />
        <SummaryCard
          label="Cost This Month"
          value={`RM ${stats.costThisMonth.toFixed(0)}`}
          colorClass="text-gray-900"
          sub="completed repairs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Active Issues — {activeTab} (newest first)
            </h2>
            <button
              onClick={() => navigate('/issues')}
              className="text-xs text-blue-600 hover:underline"
            >
              View all →
            </button>
          </div>
          <IssueTable issues={recentOpen} onSelectIssue={setSelected} onUpdate={onUpdate} />
        </div>
        <div>
          <CostWidget costByCategory={catCosts} />
        </div>
      </div>

      <IssueDetailModal
        issue={selected}
        onClose={() => setSelected(null)}
        onUpdate={(id, changes) => {
          onUpdate(id, changes);
          setSelected((prev) => ({ ...prev, ...changes }));
        }}
      />
    </div>
  );
}
