import { CATEGORIES, PRIORITIES, STATUSES, PROPERTY_TYPES, STAFF_LIST } from '../../utils/constants';

export function IssueFilters({ filters, onChange }) {
  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  const hasFilter = filters.propertyType || filters.status || filters.priority ||
    filters.category || filters.location || filters.assignedTo;

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

      {hasFilter && (
        <button
          onClick={() => onChange({ propertyType: '', assignedTo: '', status: '', priority: '', category: '', location: '' })}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

const selectCls = 'text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
