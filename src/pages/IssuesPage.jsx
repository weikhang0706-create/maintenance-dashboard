import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { IssueFilters } from '../components/Issues/IssueFilters';
import { IssueTable } from '../components/Issues/IssueTable';
import { IssueDetailModal } from '../components/Issues/IssueDetailModal';
import { Button } from '../components/UI/Button';
import { isOverdue } from '../utils/dateUtils';

export function IssuesPage({ issues, onUpdate, onDelete }) {
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
        <Button onClick={() => navigate('/report')}>+ Report Issue</Button>
      </div>

      <IssueFilters filters={filters} onChange={setFilters} />
      <IssueTable issues={filtered} onSelectIssue={setSelected} onUpdate={onUpdate} onDelete={onDelete} />

      <IssueDetailModal
        issue={selected}
        onClose={() => setSelected(null)}
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
