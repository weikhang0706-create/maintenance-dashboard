import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { ReportIssueForm } from '../components/Forms/ReportIssueForm';

export function ReportPage({ onAddIssue, units }) {
  const navigate = useNavigate();

  const handleSubmit = (formData) => {
    onAddIssue(formData);
  };

  return (
    <div>
      <Header
        title="Report New Issue"
        subtitle="Fill in the details below. Fields marked * are required."
      />
      <ReportIssueForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/issues')}
        units={units}
      />
    </div>
  );
}
