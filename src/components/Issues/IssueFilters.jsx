import { CATEGORIES, PRIORITIES, STATUSES, PROPERTY_TYPES, STAFF_LIST } from '../../utils/constants';

export function IssueFilters({ filters, onChange }) {
  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  const hasFilter = filters.propertyType || filters.status || filters.priority ||
    filters.category || filters.location || filters.assignedTo ||
    filters.completedFrom || filters.completedTo;

  const showCompletedRange = filters.status === 'Done' || filters.completedFrom || filters.completedTo;

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select value={filters.propertyType} onChange={handle('propertyType')} className={selectCls}>
        <option value="">All Property Types</option>
        {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>

      <select value={filters.assignedTo} onChange={handle('assignedTo')} className={selectCls}>
        <option value="">All Staff</option>
        <option value="__unassigned__">— Unassigned —</option>
        {STAFF_LIST.map((s) => <option key={s}>{s}</option>)}
      </select>

      <select value={filters.status} onChange={handle('status')} className={selectCls}>
        <option value="">All Statuses</option>
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
        <option value="overdue">Overdue</option>
      </select>

      <select value={filters.priority} onChange={handle('priority')} className={selectCls}>
        <option value="">All Priorities</option>
        {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
      </select>

      <select value={filters.category} onChange={handle('category')} className={selectCls}>
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      <input
        type="text"
        placeholder="Filter by location…"
        value={filters.location}
        onChange={handle('location')}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
      />

      {/* Completed date range — always visible when Done is selected, or when dates are set */}
      {showCompletedRange && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="text-xs font-medium text-green-700 whitespace-nowrap">Completed</span>
          <input
            type="date"
            value={filters.completedFrom}
            onChange={handle('completedFrom')}
            className="text-sm border border-green-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <span className="text-xs text-green-600">to</span>
          <input
            type="date"
            value={filters.completedTo}
            onChange={handle('completedTo')}
            className="text-sm border border-green-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      )}

      {hasFilter && (
        <button
          onClick={() => onChange({ propertyType: '', assignedTo: '', status: '', priority: '', category: '', location: '', completedFrom: '', completedTo: '' })}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

const selectCls = 'text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
