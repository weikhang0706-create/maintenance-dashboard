import { useState, useMemo } from 'react';
import { Header } from '../components/Layout/Header';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { UnitModal } from '../components/Units/UnitModal';
import { PROPERTY_TYPES, PROPERTY_TYPE_COLORS, CONDO_LIST } from '../utils/constants';

export function UnitsPage({ units, onAddUnit, onUpdateUnit }) {
  const [filterType, setFilterType]   = useState('');
  const [filterCondo, setFilterCondo] = useState('');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);

  const filtered = useMemo(() =>
    units.filter((u) => {
      if (filterType   && u.PropertyType !== filterType)  return false;
      if (filterCondo  && u.Condo !== filterCondo)        return false;
      if (filterStatus && u.Status !== filterStatus)      return false;
      return true;
    }),
    [units, filterType, filterCondo, filterStatus]
  );

  const openAdd  = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (u) => { setEditing(u);   setModalOpen(true); };

  const handleSave = (formData) => {
    if (editing) {
      onUpdateUnit(editing.UnitID, formData);
    } else {
      onAddUnit(formData);
    }
  };

  const stats = useMemo(() => ({
    total:    units.length,
    active:   units.filter((u) => u.Status === 'Active').length,
    homestay: units.filter((u) => u.PropertyType === 'Homestay' && u.Status === 'Active').length,
    coliving: units.filter((u) => u.PropertyType === 'Co-living' && u.Status === 'Active').length,
    withRooms: units.filter((u) => u.HasRooms === 'Yes' && u.Status === 'Active').length,
  }), [units]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <Header title="Units" subtitle="Master list of all managed units" />
        <Button onClick={openAdd}>+ Add Unit</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Active',  value: stats.active,    color: 'text-gray-900' },
          { label: 'Homestay',      value: stats.homestay,  color: 'text-indigo-600' },
          { label: 'Co-living',     value: stats.coliving,  color: 'text-teal-600' },
          { label: 'With Rooms',    value: stats.withRooms, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={sel}>
          <option value="">All Property Types</option>
          {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={filterCondo} onChange={(e) => setFilterCondo(e.target.value)} className={sel}>
          <option value="">All Blocks</option>
          {CONDO_LIST.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={sel}>
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        {(filterType || filterCondo || filterStatus) && (
          <button onClick={() => { setFilterType(''); setFilterCondo(''); setFilterStatus(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline">Clear</button>
        )}
        <span className="text-sm text-gray-400 self-center ml-1">{filtered.length} units</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Unit ID','Type','Block','Unit No.','Floor','Has Rooms','Rooms','Owner','Status','Notes',''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">🏠</p>
                <p>No units found. Add your first unit above.</p>
              </td></tr>
            ) : filtered.map((unit) => {
              const rooms = unit.Rooms ? unit.Rooms.split(',').map((r) => r.trim()).filter(Boolean) : [];
              return (
                <tr key={unit.UnitID} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{unit.UnitID}</td>
                  <td className="px-4 py-3">
                    <Badge className={PROPERTY_TYPE_COLORS[unit.PropertyType] ?? 'bg-gray-100 text-gray-600'}>
                      {unit.PropertyType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{unit.Condo}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{unit.UnitNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{unit.Floor || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${unit.HasRooms === 'Yes' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {unit.HasRooms === 'Yes' ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {rooms.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {rooms.map((r) => (
                          <span key={r} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{r}</span>
                        ))}
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {unit.OwnerName ? (
                      <div>
                        <p className="text-sm text-gray-800 font-medium">{unit.OwnerName}</p>
                        {unit.OwnerPhone && <p className="text-xs text-gray-400">{unit.OwnerPhone}</p>}
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${unit.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {unit.Status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">{unit.Notes || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(unit)}
                      className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <UnitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        existing={editing}
      />
    </div>
  );
}

const sel = 'text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
