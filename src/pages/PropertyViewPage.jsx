import { useMemo, useState } from 'react';
import { Header } from '../components/Layout/Header';
import { Badge } from '../components/UI/Badge';
import { IssueDetailModal } from '../components/Issues/IssueDetailModal';
import { QuickDoneModal } from '../components/Issues/QuickDoneModal';
import { STATUS_COLORS, PRIORITY_COLORS, PROPERTY_TYPES, PROPERTY_TYPE_COLORS } from '../utils/constants';
import { displayDate, isOverdue, currentYearMonth, inMonth } from '../utils/dateUtils';

export function PropertyViewPage({ issues, onUpdate, onDelete, staffNames }) {
  const [selected, setSelected] = useState(null);
  const [quickDone, setQuickDone] = useState(null);
  const ym = currentYearMonth();

  return (
    <div>
      <Header
        title="Property View"
        subtitle="Side-by-side overview of Homestay and Co-living issues"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {PROPERTY_TYPES.map((type) => (
          <PropertyPanel
            key={type}
            type={type}
            issues={issues.filter((i) => i.PropertyType === type)}
            ym={ym}
            onSelectIssue={setSelected}
            onQuickDone={setQuickDone}
          />
        ))}
      </div>

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

      <QuickDoneModal
        issue={quickDone}
        onClose={() => setQuickDone(null)}
        onConfirm={(id, changes) => {
          onUpdate(id, changes);
          setQuickDone(null);
        }}
      />
    </div>
  );
}

function PropertyPanel({ type, issues, ym, onSelectIssue, onQuickDone }) {
  const [statusFilter, setStatusFilter] = useState('active');

  const stats = useMemo(() => ({
    open: issues.filter((i) => i.Status === 'Open').length,
    assigned: issues.filter((i) => i.Status === 'Assigned').length,
    inProgress: issues.filter((i) => i.Status === 'In Progress').length,
    overdue: issues.filter(isOverdue).length,
    done: issues.filter((i) => i.Status === 'Done' && inMonth(i.DateCompleted, ym)).length,
    total: issues.length,
  }), [issues, ym]);

  const displayed = useMemo(() => {
    let list = issues;
    if (statusFilter === 'active') {
      list = issues.filter((i) => i.Status !== 'Done' && i.Status !== 'Cancelled');
    } else if (statusFilter === 'overdue') {
      list = issues.filter(isOverdue);
    } else if (statusFilter === 'done') {
      list = issues.filter((i) => i.Status === 'Done');
    }
    // Sort: overdue first, then by priority weight, then by date
    const priorityWeight = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
    return [...list].sort((a, b) => {
      const aOver = isOverdue(a) ? 0 : 1;
      const bOver = isOverdue(b) ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      const pw = (priorityWeight[a.Priority] ?? 4) - (priorityWeight[b.Priority] ?? 4);
      if (pw !== 0) return pw;
      return b.DateReported > a.DateReported ? 1 : -1;
    });
  }, [issues, statusFilter]);

  const accentColor = type === 'Homestay' ? 'border-indigo-400' : 'border-teal-400';
  const headerBg = type === 'Homestay' ? 'bg-indigo-50' : 'bg-teal-50';

  return (
    <div className={`bg-white rounded-xl border-2 ${accentColor} shadow-sm flex flex-col`}>
      {/* Panel header */}
      <div className={`${headerBg} rounded-t-xl px-5 py-4 border-b border-gray-200`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={PROPERTY_TYPE_COLORS[type]}>{type}</Badge>
            <span className="text-sm text-gray-500">{stats.total} total issues</span>
          </div>
          {stats.overdue > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
              ⚠ {stats.overdue} overdue
            </span>
          )}
        </div>

        {/* Mini stat row */}
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Open" value={stats.open} color="text-blue-600" />
          <MiniStat label="Assigned" value={stats.assigned} color="text-purple-600" />
          <MiniStat label="In Progress" value={stats.inProgress} color="text-yellow-600" />
          <MiniStat label="Done (mo.)" value={stats.done} color="text-green-600" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-0">
        {[
          { key: 'active', label: 'Active' },
          { key: 'overdue', label: `Overdue${stats.overdue > 0 ? ` (${stats.overdue})` : ''}` },
          { key: 'done', label: 'Done' },
          { key: 'all', label: 'All' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === key
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Issue list */}
      <div className="flex-1 overflow-y-auto max-h-[560px] px-4 py-3 space-y-2">
        {displayed.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">✓</p>
            <p className="text-sm">No issues in this view.</p>
          </div>
        ) : (
          displayed.map((issue) => (
            <IssueCard
              key={issue.IssueID}
              issue={issue}
              onClick={() => onSelectIssue(issue)}
              onQuickDone={onQuickDone}
            />
          ))
        )}
      </div>
    </div>
  );
}

function IssueCard({ issue, onClick, onQuickDone }) {
  const overdue = isOverdue(issue);
  const isDone = issue.Status === 'Done' || issue.Status === 'Cancelled';

  return (
    <div
      className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
        isDone
          ? 'border-gray-100 bg-gray-50 opacity-60'
          : overdue
          ? 'border-red-200 bg-red-50 hover:border-red-300 hover:shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
      }`}
    >
      <div
        className="cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-gray-400">{issue.IssueID}</span>
            <Badge className={PRIORITY_COLORS[issue.Priority]}>{issue.Priority}</Badge>
            <Badge className={STATUS_COLORS[issue.Status]}>{issue.Status}</Badge>
            {overdue && (
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                Overdue
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 shrink-0">{issue.Category}</span>
        </div>

        <p className="text-sm font-medium text-gray-800 leading-snug mb-1">{issue.Location}</p>
        <p className="text-xs text-gray-500 line-clamp-1">{issue.Description}</p>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{issue.AssignedTo ? `👤 ${issue.AssignedTo}` : '— Unassigned'}</span>
          <span className={overdue ? 'text-red-500 font-medium' : ''}>
            Due {displayDate(issue.DueDate)}
          </span>
        </div>
      </div>

      {!isDone && (
        <div className="mt-3 pt-2.5 border-t border-gray-100">
          <button
            onClick={(e) => { e.stopPropagation(); onQuickDone(issue); }}
            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-400 transition-colors"
          >
            ✓ Mark Done
          </button>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="bg-white rounded-lg px-3 py-2 text-center border border-gray-100">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 leading-tight">{label}</p>
    </div>
  );
}
