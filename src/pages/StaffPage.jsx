import { useState, useMemo } from 'react';
import { Header } from '../components/Layout/Header';
import { Button } from '../components/UI/Button';
import { StaffModal } from '../components/Staff/StaffModal';
import { STAFF_ROLES } from '../utils/constants';
import { isOverdue } from '../utils/dateUtils';
import { formatWANumber, buildJobListWAMessage } from '../utils/issueUtils';

export function StaffPage({ staff, onAddStaff, onUpdateStaff, onDeleteStaff, issues = [] }) {
  const [filterRole, setFilterRole]     = useState('');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [deleteConfirmID, setDeleteConfirmID] = useState(null);

  const filtered = useMemo(() =>
    staff.filter((s) => {
      if (filterRole   && s.Role   !== filterRole)   return false;
      if (filterStatus && s.Status !== filterStatus) return false;
      return true;
    }),
    [staff, filterRole, filterStatus]
  );

  const stats = useMemo(() => ({
    total:    staff.length,
    active:   staff.filter((s) => s.Status === 'Active').length,
    inactive: staff.filter((s) => s.Status === 'Inactive').length,
  }), [staff]);

  const workload = useMemo(() => {
    const activeIssues = issues.filter((i) => i.Status !== 'Done' && i.Status !== 'Cancelled');
    return staff
      .filter((s) => s.Status === 'Active')
      .map((s) => {
        const mine = activeIssues.filter((i) => i.AssignedTo === s.Name);
        return {
          ...s,
          open:       mine.filter((i) => i.Status === 'Open').length,
          inProgress: mine.filter((i) => i.Status === 'In Progress' || i.Status === 'Assigned').length,
          overdue:    mine.filter(isOverdue).length,
          total:      mine.length,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [staff, issues]);

  const openAdd  = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s);   setModalOpen(true); };

  const handleSave = (formData) => {
    if (editing) {
      onUpdateStaff(editing.StaffID, formData);
    } else {
      onAddStaff(formData);
    }
  };

  const roleColors = {
    Technician:       'bg-blue-50 text-blue-700',
    Electrician:      'bg-yellow-50 text-yellow-700',
    Plumber:          'bg-cyan-50 text-cyan-700',
    'HVAC Specialist':'bg-purple-50 text-purple-700',
    Cleaner:          'bg-green-50 text-green-700',
    Supervisor:       'bg-orange-50 text-orange-700',
    Other:            'bg-gray-100 text-gray-600',
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <Header title="Staff" subtitle="Master list of all maintenance staff" />
        <Button onClick={openAdd}>+ Add Staff</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Staff',  value: stats.total,    color: 'text-gray-900' },
          { label: 'Active',       value: stats.active,   color: 'text-green-600' },
          { label: 'Inactive',     value: stats.inactive, color: 'text-gray-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Workload view */}
      {workload.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Staff Workload — Active Issues</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {workload.map((s) => {
              const load = s.total === 0 ? 'none' : s.total <= 2 ? 'light' : s.total <= 5 ? 'medium' : 'heavy';
              const loadStyle = {
                none:   'border-gray-200 bg-white',
                light:  'border-green-200 bg-green-50',
                medium: 'border-yellow-200 bg-yellow-50',
                heavy:  'border-red-200 bg-red-50',
              }[load];
              const totalColor = {
                none: 'text-gray-400', light: 'text-green-700', medium: 'text-yellow-700', heavy: 'text-red-700',
              }[load];
              const waNum = formatWANumber(s.Phone);
              const openIssues = issues.filter((i) =>
                i.AssignedTo === s.Name && i.Status !== 'Done' && i.Status !== 'Cancelled'
              );
              const handleWA = () => {
                const msg = buildJobListWAMessage(s.Name, openIssues);
                window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
              };
              return (
                <div key={s.StaffID} className={`rounded-xl border-2 ${loadStyle} p-4 flex flex-col`}>
                  <p className="font-semibold text-gray-900 text-sm truncate">{s.Name}</p>
                  <p className="text-xs text-gray-400 mb-3">{s.Role}</p>
                  <p className={`text-3xl font-bold ${totalColor}`}>{s.total}</p>
                  <p className="text-xs text-gray-500 mb-2">active issues</p>
                  <div className="space-y-0.5 text-xs text-gray-500 flex-1">
                    {s.open > 0       && <p>• {s.open} open</p>}
                    {s.inProgress > 0 && <p>• {s.inProgress} in progress</p>}
                    {s.overdue > 0    && <p className="text-red-600 font-semibold">⚠ {s.overdue} overdue</p>}
                    {s.total === 0    && <p className="text-green-600">✓ All clear</p>}
                  </div>
                  {waNum && openIssues.length > 0 ? (
                    <button
                      onClick={handleWA}
                      className="mt-3 w-full text-xs font-semibold px-2 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      📱 Send Job List
                    </button>
                  ) : !waNum ? (
                    <p className="mt-3 text-[10px] text-gray-400 text-center">No phone saved</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={sel}>
          <option value="">All Roles</option>
          {STAFF_ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={sel}>
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        {(filterRole || filterStatus) && (
          <button onClick={() => { setFilterRole(''); setFilterStatus(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline">Clear</button>
        )}
        <span className="text-sm text-gray-400 self-center ml-1">{filtered.length} staff</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Staff ID', 'Name', 'Role', 'Phone', 'Email', 'Status', 'Notes', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">👥</p>
                <p>No staff found. Add your first staff member above.</p>
              </td></tr>
            ) : filtered.map((s) => (
              <tr key={s.StaffID} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.StaffID}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{s.Name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[s.Role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {s.Role || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.Phone || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{s.Email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {s.Status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate">{s.Notes || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(s)}
                      className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
                    {deleteConfirmID === s.StaffID ? (
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => { onDeleteStaff(s.StaffID); setDeleteConfirmID(null); }}
                          className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-semibold hover:bg-red-600"
                        >Confirm</button>
                        <button
                          onClick={() => setDeleteConfirmID(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setDeleteConfirmID(s.StaffID)}
                        className="text-xs text-red-400 hover:text-red-600 hover:underline">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <StaffModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        existing={editing}
      />
    </div>
  );
}

const sel = 'text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
