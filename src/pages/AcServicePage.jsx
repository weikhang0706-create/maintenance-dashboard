import { useMemo, useState } from 'react';
import { Header } from '../components/Layout/Header';
import { displayDate } from '../utils/dateUtils';

const WARN_DAYS = 90;

function daysBetween(isoA, isoB) {
  return Math.round(Math.abs(new Date(isoB) - new Date(isoA)) / 86400000);
}

function daysSince(iso) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today - new Date(iso)) / 86400000);
}

function unitKey(issue) {
  return `${issue.UnitID || (issue.Condo + '|' + issue.UnitNumber)}::${issue.RoomNumber || ''}`;
}

export function AcServicePage({ issues }) {
  const [unitFilter, setUnitFilter] = useState('');

  // Air Con issues marked Done with a completion date, newest first
  const acServices = useMemo(() =>
    issues
      .filter((i) => i.Category === 'Air Con' && i.Status === 'Done' && i.DateCompleted)
      .sort((a, b) => (b.DateCompleted > a.DateCompleted ? 1 : -1)),
    [issues]
  );

  // Per unit+room, compute gap from previous service
  const enriched = useMemo(() => {
    // Group issues by unit+room, sort each group oldest→newest
    const groups = {};
    acServices.forEach((issue) => {
      const k = unitKey(issue);
      if (!groups[k]) groups[k] = [];
      groups[k].push(issue);
    });

    // Compute gap days per IssueID
    const gapMap = {};
    Object.values(groups).forEach((group) => {
      const sorted = [...group].sort((a, b) => (a.DateCompleted > b.DateCompleted ? 1 : -1));
      sorted.forEach((issue, idx) => {
        gapMap[issue.IssueID] = idx === 0 ? null : daysBetween(sorted[idx - 1].DateCompleted, issue.DateCompleted);
      });
    });

    return acServices.map((issue) => ({ ...issue, gapDays: gapMap[issue.IssueID] ?? null }));
  }, [acServices]);

  // Summary: last service date per unit+room
  const unitSummary = useMemo(() => {
    const map = {};
    acServices.forEach((issue) => {
      const k = unitKey(issue);
      if (!map[k] || issue.DateCompleted > map[k].lastDate) {
        map[k] = {
          label: `${issue.Condo} — Unit ${issue.UnitNumber}${issue.RoomNumber ? ` (${issue.RoomNumber})` : ''}`,
          lastDate: issue.DateCompleted,
        };
      }
    });
    return Object.values(map);
  }, [acServices]);

  const shortIntervalCount = enriched.filter((i) => i.gapDays !== null && i.gapDays < WARN_DAYS).length;
  const recentlyServicedCount = unitSummary.filter((u) => daysSince(u.lastDate) < WARN_DAYS).length;

  const filtered = useMemo(() => {
    if (!unitFilter.trim()) return enriched;
    const q = unitFilter.toLowerCase();
    return enriched.filter((i) =>
      `${i.Condo} ${i.UnitNumber} ${i.RoomNumber || ''}`.toLowerCase().includes(q)
    );
  }, [enriched, unitFilter]);

  return (
    <div>
      <Header
        title="Air Con Service Log"
        subtitle="Auto-generated from completed Air Con issues — warns if same unit serviced within 3 months"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Services" value={acServices.length} color="text-blue-600" />
        <StatCard label="Units / Rooms Tracked" value={unitSummary.length} color="text-indigo-600" />
        <StatCard label="Short-interval Warnings" value={shortIntervalCount} color="text-orange-600" />
        <StatCard label="Serviced Within 90 Days" value={recentlyServicedCount} color="text-green-600" />
      </div>

      {/* Filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by block or unit…"
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">❄</p>
          <p className="font-medium text-gray-500">No Air Con service records yet.</p>
          <p className="text-sm mt-1">Records appear automatically when Air Con issues are marked Done.</p>
        </div>
      ) : (
        <>
          {shortIntervalCount > 0 && (
            <div className="mb-4 flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
              <span className="text-lg leading-none">⚠</span>
              <p>
                <span className="font-semibold">{shortIntervalCount} service{shortIntervalCount > 1 ? 's' : ''} flagged</span>
                {' '}— these units were serviced again within 90 days of a previous service.
                Highlighted in orange below.
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gap From Prev.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Technician</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Issue ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((issue) => {
                  const warn = issue.gapDays !== null && issue.gapDays < WARN_DAYS;
                  return (
                    <tr
                      key={issue.IssueID}
                      className={`border-b border-gray-100 last:border-0 ${warn ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {issue.Condo} — Unit {issue.UnitNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {issue.RoomNumber || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {displayDate(issue.DateCompleted)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {issue.gapDays === null ? (
                          <span className="text-xs text-gray-400 italic">First service</span>
                        ) : warn ? (
                          <span className="inline-flex items-center gap-1 text-orange-700 font-semibold text-xs bg-orange-100 px-2 py-1 rounded-full">
                            ⚠ {issue.gapDays} days
                          </span>
                        ) : (
                          <span className="text-green-700 font-medium">{issue.gapDays} days ✓</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate">
                        {issue.Description}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {issue.AssignedTo || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">
                        {issue.IssueID}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
