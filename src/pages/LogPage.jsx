import { useState, useEffect } from 'react';
import { readLog, clearLog, formatLogTimestamp, fieldLabel } from '../utils/logUtils';

const ACTION_STYLES = {
  Created: 'bg-green-100 text-green-800',
  Updated: 'bg-blue-100 text-blue-800',
  Deleted: 'bg-red-100 text-red-800',
};

const ENTITY_STYLES = {
  Issue: 'bg-yellow-100 text-yellow-800',
  Unit:  'bg-purple-100 text-purple-800',
  Staff: 'bg-gray-100 text-gray-700',
};

export function LogPage() {
  const [log, setLog] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [filterEntity, setFilterEntity] = useState('All');
  const [filterAction, setFilterAction] = useState('All');
  const [search, setSearch] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const loadLog = () => setLog(readLog());

  useEffect(() => {
    loadLog();
    window.addEventListener('focus', loadLog);
    return () => window.removeEventListener('focus', loadLog);
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    clearLog();
    setLog([]);
    setConfirmClear(false);
  };

  const filtered = log.filter((entry) => {
    if (filterEntity !== 'All' && entry.entity !== filterEntity) return false;
    if (filterAction !== 'All' && entry.action !== filterAction) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !entry.entityID?.toLowerCase().includes(q) &&
        !entry.summary?.toLowerCase().includes(q) &&
        !entry.details?.some((d) => String(d.from).toLowerCase().includes(q) || String(d.to).toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            {log.length} total entries
            {filtered.length !== log.length && ` — showing ${filtered.length}`}
          </p>
        </div>
        {log.length > 0 && (
          confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Are you sure?</span>
              <button
                onClick={handleClear}
                className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg"
              >
                Yes, clear all
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleClear}
              className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Clear Log
            </button>
          )
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by ID, change, or value…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setConfirmClear(false); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Types</option>
          <option value="Issue">Issues</option>
          <option value="Unit">Units</option>
          <option value="Staff">Staff</option>
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Actions</option>
          <option value="Created">Created</option>
          <option value="Updated">Updated</option>
          <option value="Deleted">Deleted</option>
        </select>
      </div>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-lg font-medium text-gray-500">
            {log.length === 0 ? 'No activity yet' : 'No matching entries'}
          </p>
          <p className="text-sm mt-1">
            {log.length === 0
              ? 'Changes you make (issues, units, staff) will appear here'
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {filtered.map((entry) => {
            const hasDetails = entry.details?.length > 0;
            const isExpanded = expanded.has(entry.id);
            return (
              <div key={entry.id} className="hover:bg-gray-50 transition-colors">
                <div
                  className={`flex items-start gap-3 px-5 py-3.5 ${hasDetails ? 'cursor-pointer' : ''}`}
                  onClick={() => hasDetails && toggleExpand(entry.id)}
                >
                  {/* Action badge */}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${ACTION_STYLES[entry.action] ?? 'bg-gray-100 text-gray-700'}`}>
                    {entry.action}
                  </span>

                  {/* Entity badge */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${ENTITY_STYLES[entry.entity] ?? 'bg-gray-100 text-gray-700'}`}>
                    {entry.entity}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-gray-400 mr-2">{entry.entityID}</span>
                    <span className="text-sm text-gray-800">{entry.summary}</span>
                    {hasDetails && (
                      <span className="ml-2 text-xs text-gray-400">
                        {entry.details.length} field{entry.details.length !== 1 ? 's' : ''} changed
                      </span>
                    )}
                  </div>

                  {/* Timestamp + expand indicator */}
                  <div className="text-xs text-gray-400 shrink-0 text-right whitespace-nowrap">
                    {formatLogTimestamp(entry.timestamp)}
                    {hasDetails && (
                      <span className="ml-1.5 text-gray-300">{isExpanded ? '▲' : '▼'}</span>
                    )}
                  </div>
                </div>

                {/* Expanded field details */}
                {isExpanded && hasDetails && (
                  <div className="px-5 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                    <div className="grid gap-1.5 max-w-2xl">
                      {entry.details.map((d, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="font-medium text-gray-600 w-36 shrink-0 pt-0.5">
                            {fieldLabel(d.field)}
                          </span>
                          <span className="text-red-400 line-through break-all">
                            {String(d.from || '') || <span className="text-gray-300 no-underline not-italic">(empty)</span>}
                          </span>
                          <span className="text-gray-400 shrink-0">→</span>
                          <span className="text-green-600 break-all">
                            {String(d.to || '') || <span className="text-gray-300">(empty)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
