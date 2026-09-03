import { useState, useEffect, useCallback } from 'react';
import { canRead, canWrite, staffRead, staffCreate, staffUpdate, staffDelete } from './useGoogleSheets';
import { writeLog, diffObjects, buildUpdateSummary } from '../utils/logUtils';

const MOCK_STAFF = [
  { StaffID: 'S-001', Name: 'Ahmad Razif',       Role: 'Electrician', Phone: '012-3456789', Email: '', Status: 'Active', Notes: '' },
  { StaffID: 'S-002', Name: 'Siti Norehan',       Role: 'Cleaner',     Phone: '013-2345678', Email: '', Status: 'Active', Notes: '' },
  { StaffID: 'S-003', Name: 'Rajan Kumar',         Role: 'Plumber',     Phone: '011-3456789', Email: '', Status: 'Active', Notes: '' },
  { StaffID: 'S-004', Name: 'Lim Wei Liang',       Role: 'Technician',  Phone: '016-4567890', Email: '', Status: 'Active', Notes: '' },
  { StaffID: 'S-005', Name: 'Norzahra Binti Aziz', Role: 'Supervisor',  Phone: '017-5678901', Email: '', Status: 'Active', Notes: '' },
];

function generateStaffID(existing) {
  const nums = existing
    .map((s) => parseInt(s.StaffID?.replace('S-', '') ?? '0', 10))
    .filter((n) => !isNaN(n));
  const max = Math.max(0, ...nums);
  return `S-${String(max + 1).padStart(3, '0')}`;
}

export function useStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canRead()) {
      // No Sheets connection — use mock data for local dev only
      setStaff(MOCK_STAFF);
      setLoading(false);
      return;
    }
    staffRead()
      .then((data) => { setStaff(data); setLoading(false); })
      .catch(() => { setStaff([]); setLoading(false); });
  }, []);

  const addStaff = useCallback((formData) => {
    setStaff((prev) => {
      const newStaff = { ...formData, StaffID: generateStaffID(prev) };
      if (canWrite()) staffCreate(newStaff).catch((err) => console.error('[Sheets] staff create failed:', err.message));
      writeLog({
        action: 'Created',
        entity: 'Staff',
        entityID: newStaff.StaffID,
        summary: `${newStaff.Name} — ${newStaff.Role}`,
      });
      return [...prev, newStaff];
    });
  }, []);

  const updateStaff = useCallback((staffID, changes) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.StaffID !== staffID) return s;
        const before = s;
        const updated = { ...s, ...changes };
        if (canWrite()) staffUpdate(updated).catch((err) => console.error('[Sheets] staff update failed:', err.message));
        const diffs = diffObjects(before, updated);
        if (diffs.length > 0) {
          writeLog({
            action: 'Updated',
            entity: 'Staff',
            entityID: staffID,
            summary: buildUpdateSummary(diffs),
            details: diffs,
          });
        }
        return updated;
      })
    );
  }, []);

  const deleteStaff = useCallback((staffID) => {
    setStaff((prev) => {
      const s = prev.find((s) => s.StaffID === staffID);
      if (s) {
        writeLog({
          action: 'Deleted',
          entity: 'Staff',
          entityID: staffID,
          summary: `${s.Name} — ${s.Role}`,
        });
      }
      return prev.filter((s) => s.StaffID !== staffID);
    });
    if (canWrite()) staffDelete(staffID).catch((err) => console.error('[Sheets] staff delete failed:', err.message));
  }, []);

  // Active staff names for use in dropdowns
  const activeStaffNames = staff
    .filter((s) => s.Status?.toLowerCase() === 'active')
    .map((s) => s.Name)
    .filter(Boolean);

  return { staff, loading, addStaff, updateStaff, deleteStaff, activeStaffNames };
}
