import { useState, useEffect, useCallback } from 'react';
import { MOCK_UNITS } from '../data/mockUnits';
import { canRead, canWrite, unitsRead, unitsCreate, unitsUpdate } from './useGoogleSheets';

export function useUnits() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canRead()) {
      setUnits([]);
      setLoading(false);
      return;
    }

    unitsRead()
      .then((data) => {
        setUnits(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(`Could not load units: ${err.message}`);
        setUnits([]);
        setLoading(false);
      });
  }, []);

  // Generate next UnitID from existing units
  const generateUnitID = (existing) => {
    const nums = existing
      .map((u) => parseInt(u.UnitID?.replace('U-', '') ?? '0', 10))
      .filter((n) => !isNaN(n));
    const max = Math.max(0, ...nums);
    return `U-${String(max + 1).padStart(3, '0')}`;
  };

  const addUnit = useCallback((formData) => {
    setUnits((prev) => {
      const newUnit = { ...formData, UnitID: generateUnitID(prev) };
      if (canWrite()) {
        unitsCreate(newUnit).catch((err) => console.error('[Sheets] unit create failed:', err.message));
      }
      return [...prev, newUnit];
    });
  }, []);

  const updateUnit = useCallback((unitID, changes) => {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.UnitID !== unitID) return u;
        const updated = { ...u, ...changes };
        if (canWrite()) {
          unitsUpdate(updated).catch((err) => console.error('[Sheets] unit update failed:', err.message));
        }
        return updated;
      })
    );
  }, []);

  // Returns room list for a given unit as an array
  const getRooms = (unit) => {
    if (!unit || unit.HasRooms !== 'Yes' || !unit.Rooms) return [];
    return unit.Rooms.split(',').map((r) => r.trim()).filter(Boolean);
  };

  return { units, loading, error, addUnit, updateUnit, getRooms };
}
