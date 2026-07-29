import { useState, useEffect, useCallback, useRef } from 'react';
import { MOCK_ISSUES } from '../data/mockData';
import { generateIssueID } from '../utils/issueUtils';
import { todayISO } from '../utils/dateUtils';
import { canRead, canWrite, sheetsRead, sheetsCreate, sheetsUpdate } from './useGoogleSheets';

export function useIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | saved | error
  const syncTimer = useRef(null);

  const isSyncing = useRef(false);

  // Load on mount + auto-poll every 30 s for real-time multi-user sync
  useEffect(() => {
    if (!canRead()) {
      setIssues(MOCK_ISSUES);
      setLoading(false);
      return;
    }

    const fetchIssues = () => {
      if (isSyncing.current) return; // skip poll while a write is in flight
      sheetsRead()
        .then((data) => {
          setIssues(data);
          setLoading(false);
          setError(null);
        })
        .catch((err) => {
          setError(`Could not load from Google Sheets: ${err.message}.`);
          setLoading(false);
        });
    };

    fetchIssues();
    const pollInterval = setInterval(fetchIssues, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  const markSaved = () => {
    setSyncStatus('saved');
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const syncCreate = useCallback(async (issue) => {
    if (!canWrite()) return;
    isSyncing.current = true;
    setSyncStatus('syncing');
    try {
      await sheetsCreate(issue);
      markSaved();
    } catch (err) {
      setSyncStatus('error');
      console.error('[Sheets] create failed:', err.message);
    } finally {
      isSyncing.current = false;
    }
  }, []);

  const syncUpdate = useCallback(async (issue) => {
    if (!canWrite()) return;
    isSyncing.current = true;
    setSyncStatus('syncing');
    try {
      await sheetsUpdate(issue);
      markSaved();
    } catch (err) {
      setSyncStatus('error');
      console.error('[Sheets] update failed:', err.message);
    } finally {
      isSyncing.current = false;
    }
  }, []);

  const addIssue = useCallback((formData) => {
    setIssues((prev) => {
      const newIssue = {
        ...formData,
        IssueID: generateIssueID(prev),
        DateReported: todayISO(),
        Status: formData.AssignedTo ? 'Assigned' : 'Open',
        DateCompleted: '',
        Cost: '',
        BillAmount: '',
        InvoiceStatus: 'Unbilled',
        InvoiceNumber: '',
        InvoiceDate: '',
        BilledTo: '',
      };
      syncCreate(newIssue);
      return [newIssue, ...prev];
    });
  }, [syncCreate]);

  const updateIssue = useCallback((issueID, changes) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.IssueID !== issueID) return issue;
        const updated = { ...issue, ...changes };
        if (changes.Status === 'Done' && !updated.DateCompleted) {
          updated.DateCompleted = todayISO();
        }
        if (changes.Status && changes.Status !== 'Done') {
          updated.DateCompleted = '';
        }
        if (changes.AssignedTo && updated.Status === 'Open') {
          updated.Status = 'Assigned';
        }
        syncUpdate(updated);
        return updated;
      })
    );
  }, [syncUpdate]);

  return { issues, loading, error, syncStatus, addIssue, updateIssue };
}
