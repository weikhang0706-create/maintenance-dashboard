import { CATEGORIES, PRIORITIES, STATUSES, PROPERTY_TYPES, STAFF_LIST } from '../../utils/constants';

export function IssueFilters({ filters, onChange, staffNames, t }) {
  const staffOptions = staffNames?.length ? staffNames : STAFF_LIST;
  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  const hasFilter = filters.propertyType || filters.status || filters.priority ||
    filters.category || filters.location || filters.assignedTo ||
    filters.completedFrom || filters.completedTo;

  const showCompletedRange = filters.status === 'Done' || filters.completedFrom || filters.completedTo;

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select value={filters.propertyType} onChange={handle('propertyType')} className={selectCls}>
        <option value="">{t.allPropertyTypes}</option>
        {PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}
      </select>

      <select value={filters.assignedTo} onChange={handle('assignedTo')} className={selectCls}>
        <option value="">{t.allStaff}</option>
        <option value="__unassigned__">{t.unassigned}</option>
        {staffOptions.map((s) => <option key={s}>{s}</option>)}
      </select>

      <select value={filters.status} onChange={handle('status')} className={selectCls}>
        <option value="">{t.allStatuses}</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{t.statusDisplay[s] ?? s}</option>
        ))}
        <option value="overdue">{t.overdue}</option>
      </select>

      <select value={filters.priority} onChange={handle('priority')} className={selectCls}>
        <option value="">{t.allPriorities}</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{t.priorityDisplay[p] ?? p}</option>
        ))}
      </select>

      <select value={filters.category} onChange={handle('category')} className={selectCls}>
        <option value="">{t.allCategories}</option>
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      <input
        type="text"
        placeholder={t.filterByLocation}
        value={filters.location}
        onChange={handle('location')}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
      />

      {showCompletedRange && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="text-xs font-medium text-green-700 whitespace-nowrap">{t.completed}</span>
          <input
            type="date"
            value={filters.completedFrom}
            onChange={handle('completedFrom')}
            className="text-sm border border-green-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <span className="text-xs text-green-600">{t.dateTo}</span>
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
          {t.clearAll}
        </button>
      )}
    </div>
  );
}

const selectCls = 'text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
