import { useState } from 'react';
import { Badge } from '../UI/Badge';
import { QuickDoneModal } from './QuickDoneModal';
import { STATUS_COLORS, PRIORITY_COLORS, PROPERTY_TYPE_COLORS } from '../../utils/constants';
import { displayDate, isOverdue } from '../../utils/dateUtils';

const COLUMNS = [
  { key: 'DateReported', label: 'Reported' },
  { key: 'PropertyType', label: 'Type' },
  { key: 'Condo',        label: 'Condo' },
  { key: 'UnitNumber',   label: 'Unit No.' },
  { key: 'RoomNumber',   label: 'Room' },
  { key: 'Category',     label: 'Category' },
  { key: 'Description',  label: 'Description' },
  { key: 'Priority',     label: 'Priority' },
  { key: 'Status',       label: 'Status' },
  { key: 'AssignedTo',   label: 'Assigned To' },
  { key: 'DueDate',      label: 'Due Date' },
];

// Parse Condo/UnitNumber/RoomNumber from either separate fields or the Location string
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

// Cell that truncates long text and lets user click a toggle to expand
function ExpandableCell({ value, onRowClick }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = value && value.length > 14;

  return (
    <td
      className="px-4 py-3 text-sm text-gray-800 cursor-pointer"
      onClick={onRowClick}
    >
      {value ? (
        <div className="flex items-start gap-1">
          <span className={expanded ? 'whitespace-normal break-words max-w-[200px]' : 'truncate max-w-[110px] block'}>
            {value}
          </span>
          {isLong && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="shrink-0 text-[10px] text-blue-400 hover:text-blue-600 border border-blue-200 rounded px-1 leading-4 mt-0.5"
              title={expanded ? 'Collapse' : 'Show full'}
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

export function IssueTable({ issues, onSelectIssue, onUpdate }) {
  const [sortKey, setSortKey] = useState('DateReported');
  const [sortDir, setSortDir] = useState('desc');
  const [quickDoneIssue, setQuickDoneIssue] = useState(null);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...issues].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p className="font-medium text-gray-500">No issues match your filters.</p>
        <p className="text-sm mt-1">Try clearing the filters or report a new issue.</p>
      </div>
    );
  }

  const isActive = (issue) => issue.Status !== 'Done' && issue.Status !== 'Cancelled';

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Quick Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sorted.map((issue) => {
              const overdue = isOverdue(issue);
              const active = isActive(issue);
              const rowClick = () => onSelectIssue(issue);
              return (
                <tr
                  key={issue.IssueID}
                  className={`transition-colors ${issue.Status === 'Done' ? 'opacity-60' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap cursor-pointer" onClick={rowClick}>
                    {displayDate(issue.DateReported)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap cursor-pointer" onClick={rowClick}>
                    {issue.PropertyType && (
                      <Badge className={PROPERTY_TYPE_COLORS[issue.PropertyType] ?? 'bg-gray-100 text-gray-600'}>
                        {issue.PropertyType}
                      </Badge>
                    )}
                  </td>

                  {/* 3 expandable location columns */}
                  <ExpandableCell value={getCondo(issue)}  onRowClick={rowClick} />
                  <ExpandableCell value={getUnit(issue)}   onRowClick={rowClick} />
                  <ExpandableCell value={getRoom(issue)}   onRowClick={rowClick} />

                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap cursor-pointer" onClick={rowClick}>
                    {issue.Category}{issue.OtherCategory ? ` — ${issue.OtherCategory}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[220px] cursor-pointer" onClick={rowClick}>
                    <span className="line-clamp-2 leading-snug">{issue.Description}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap cursor-pointer" onClick={rowClick}>
                    <Badge className={PRIORITY_COLORS[issue.Priority]}>{issue.Priority}</Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap cursor-pointer" onClick={rowClick}>
                    <Badge className={STATUS_COLORS[issue.Status]}>{issue.Status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap cursor-pointer" onClick={rowClick}>
                    {issue.AssignedTo || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap cursor-pointer" onClick={rowClick}>
                    <span className={overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                      {displayDate(issue.DueDate)}
                      {overdue && (
                        <span className="ml-1 text-xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5">Overdue</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {active ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setQuickDoneIssue(issue); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-400 transition-colors"
                      >
                        ✓ Mark Done
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300 italic">
                        {issue.Status === 'Done' ? `Done ${displayDate(issue.DateCompleted)}` : 'Cancelled'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <QuickDoneModal
        issue={quickDoneIssue}
        onClose={() => setQuickDoneIssue(null)}
        onConfirm={(id, changes) => {
          onUpdate(id, changes);
          setQuickDoneIssue(null);
        }}
      />
    </>
  );
}
