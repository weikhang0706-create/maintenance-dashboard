import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { IssueFilters } from '../components/Issues/IssueFilters';
import { IssueTable } from '../components/Issues/IssueTable';
import { IssueDetailModal } from '../components/Issues/IssueDetailModal';
import { Button } from '../components/UI/Button';
import { isOverdue } from '../utils/dateUtils';
import { downloadCSV } from '../utils/exportUtils';

const ISSUE_CSV_COLS = [
  { label: 'Issue ID',       key: 'IssueID' },
  { label: 'Date Reported',  key: 'DateReported' },
  { label: 'Condo',          key: 'Condo' },
  { label: 'Unit No.',       key: 'UnitNumber' },
  { label: 'Room',           key: 'RoomNumber' },
  { label: 'Category',       key: 'Category' },
  { label: 'Description',    key: 'Description' },
  { label: 'Priority',       key: 'Priority' },
  { label: 'Status',         key: 'Status' },
  { label: 'Assigned To',    key: 'AssignedTo' },
  { label: 'Due Date',       key: 'DueDate' },
  { label: 'Date Completed', key: 'DateCompleted' },
  { label: 'Cost (RM)',      key: 'Cost' },
  { label: 'Notes',          key: 'Notes' },
];

export function IssuesPage({ issues, onUpdate, onDelete, staffNames }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({
    propertyType: '',
    assignedTo: '',
    status: searchParams.get('filter') === 'overdue' ? 'overdue' : '',
    priority: '',
    category: '',
    location: '',
    completedFrom: '',
    completedTo: '',
  });

  useEffect(() => {
    if (searchParams.get('filter') === 'overdue') {
      setFilters((f) => ({ ...f, status: 'overdue' }));
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (filters.propertyType && issue.PropertyType !== filters.propertyType) return false;
      if (filters.assignedTo === '__unassigned__' && issue.AssignedTo) return false;
      if (filters.assignedTo && filters.assignedTo !== '__unassigned__' && issue.AssignedTo !== filters.assignedTo) return false;
      if (filters.status === 'overdue') return isOverdue(issue);
      if (filters.status && issue.Status !== filters.status) return false;
      if (filters.priority && issue.Priority !== filters.priority) return false;
      if (filters.category && issue.Category !== filters.category) return false;
      if (filters.location) {
        const loc = `${issue.Location || ''} ${issue.Condo || ''} ${issue.UnitNumber || ''} ${issue.RoomNumber || ''}`.toLowerCase();
        if (!loc.includes(filters.location.toLowerCase())) return false;
      }
      if (filters.completedFrom && issue.DateCompleted < filters.completedFrom) return false;
      if (filters.completedTo   && issue.DateCompleted > filters.completedTo)   return false;
      return true;
    });
  }, [issues, filters]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <Header
          title="All Issues"
          subtitle={`${filtered.length} of ${issues.length} issues`}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => downloadCSV(`issues-${new Date().toISOString().slice(0,10)}.csv`, filtered, ISSUE_CSV_COLS)}>
            ↓ Export CSV
          </Button>
          <Button onClick={() => navigate('/report')}>+ Report Issue</Button>
        </div>
      </div>

      <IssueFilters filters={filters} onChange={setFilters} />
      <IssueTable issues={filtered} onSelectIssue={setSelected} onUpdate={onUpdate} onDelete={onDelete} />

      <IssueDetailModal
        issue={selected}
        onClose={() => setSelected(null)}
        staffNames={staffNames}
        onUpdate={(id, changes) => {
          onUpdate(id, changes);
          setSelected((prev) => ({ ...prev, ...changes }));
        }}
        onDelete={(id) => {
          onDelete(id);
          setSelected(null);
        }}
      />
    </div>
  );
}
