import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { SyncStatus } from './components/UI/SyncStatus';
import { DashboardPage } from './pages/DashboardPage';
import { IssuesPage } from './pages/IssuesPage';
import { ReportPage } from './pages/ReportPage';
import { PropertyViewPage } from './pages/PropertyViewPage';
import { BillingPage } from './pages/BillingPage';
import { UnitsPage } from './pages/UnitsPage';
import { StaffPage } from './pages/StaffPage';
import { useIssues } from './hooks/useIssues';
import { useUnits } from './hooks/useUnits';
import { useStaff } from './hooks/useStaff';

export default function App() {
  const { issues, loading, error, syncStatus, addIssue, updateIssue, deleteIssue } = useIssues();
  const { units, addUnit, updateUnit } = useUnits();

  // When a unit is edited, cascade the location changes to all issues logged for that unit
  const handleUpdateUnit = (unitID, changes) => {
    updateUnit(unitID, changes);
    const updatedUnit = { ...units.find((u) => u.UnitID === unitID), ...changes };
    issues
      .filter((i) => i.UnitID === unitID)
      .forEach((issue) => {
        const condo      = updatedUnit.Condo      ?? issue.Condo;
        const unitNumber = updatedUnit.UnitNumber  ?? issue.UnitNumber;
        const type       = updatedUnit.PropertyType ?? issue.PropertyType;
        const parts      = [condo, unitNumber ? `Unit ${unitNumber}` : ''].filter(Boolean);
        if (issue.RoomNumber?.trim()) parts.push(issue.RoomNumber);
        updateIssue(issue.IssueID, {
          Condo:        condo,
          UnitNumber:   unitNumber,
          PropertyType: type,
          Location:     parts.join(' - '),
        });
      });
  };
  const { staff, addStaff, updateStaff, deleteStaff, activeStaffNames } = useStaff();

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 text-sm text-orange-800">
              <span className="text-orange-500 text-lg leading-none">⚠</span>
              <div>
                <p className="font-semibold">Google Sheets connection issue</p>
                <p className="text-orange-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-3 animate-pulse">⟳</div>
                <p>Loading from Google Sheets…</p>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/"              element={<DashboardPage    issues={issues} onUpdate={updateIssue} />} />
              <Route path="/property-view" element={<PropertyViewPage issues={issues} onUpdate={updateIssue} />} />
              <Route path="/issues"        element={<IssuesPage       issues={issues} onUpdate={updateIssue} onDelete={deleteIssue} staffNames={activeStaffNames} />} />
              <Route path="/billing"       element={<BillingPage      issues={issues} onUpdate={updateIssue} />} />
              <Route path="/units"         element={<UnitsPage        units={units}   onAddUnit={addUnit} onUpdateUnit={handleUpdateUnit} />} />
              <Route path="/staff"         element={<StaffPage        staff={staff}   onAddStaff={addStaff} onUpdateStaff={updateStaff} onDeleteStaff={deleteStaff} />} />
              <Route path="/report"        element={<ReportPage       onAddIssue={addIssue} units={units} staffNames={activeStaffNames} />} />
            </Routes>
          )}
        </main>
      </div>

      <SyncStatus status={syncStatus} />
    </BrowserRouter>
  );
}
