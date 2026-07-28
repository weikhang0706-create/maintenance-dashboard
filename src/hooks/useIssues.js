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

  // Load on mount
  useEffect(() => {
    if (!canRead()) {
      setIssues(MOCK_ISSUES);
      setLoading(false);
      return;
    }

    sheetsRead()
      .then((data) => {
        setIssues(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(`Could not load from Google Sheets: ${err.message}.`);
        setIssues([]);
        setLoading(false);
      });
  }, []);

  const markSaved = () => {
    setSyncStatus('saved');
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const syncCreate = useCallback(async (issue) => {
    if (!canWrite()) return;
    setSyncStatus('syncing');
    try {
      await sheetsCreate(issue);
      markSaved();
    } catch (err) {
      setSyncStatus('error');
      console.error('[Sheets] create failed:', err.message);
    }
  }, []);

  const syncUpdate = useCallback(async (issue) => {
    if (!canWrite()) return;
    setSyncStatus('syncing');
    try {
      await sheetsUpdate(issue);
      markSaved();
    } catch (err) {
      setSyncStatus('error');
      console.error('[Sheets] update failed:', err.message);
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
