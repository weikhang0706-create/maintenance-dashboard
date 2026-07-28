import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { todayISO, displayDate } from '../../utils/dateUtils';

export function QuickDoneModal({ issue, onClose, onConfirm }) {
  const [dateCompleted, setDateCompleted] = useState(todayISO());
  const [cost, setCost] = useState('');

  // Reset fields each time a new issue is opened
  useEffect(() => {
    if (issue) {
      setDateCompleted(issue.DateCompleted || todayISO());
      setCost(issue.Cost || '');
    }
  }, [issue]);

  if (!issue) return null;

  const handleConfirm = () => {
    onConfirm(issue.IssueID, {
      Status: 'Done',
      DateCompleted: dateCompleted,
      Cost: cost,
    });
    onClose();
  };

  return (
    <Modal isOpen={!!issue} onClose={onClose} title="Mark as Done">
      <div className="space-y-5">
        {/* Issue summary */}
        <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm space-y-1">
          <p className="font-mono text-xs text-gray-400">{issue.IssueID}</p>
          <p className="font-semibold text-gray-800">{issue.Location}</p>
          <p className="text-gray-500">{issue.Category}{issue.OtherCategory ? ` — ${issue.OtherCategory}` : ''} · {issue.Priority} priority</p>
          <p className="text-gray-500 text-xs line-clamp-2">{issue.Description}</p>
        </div>

        {/* Date completed */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Date Completed <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">Pre-filled with today — change if the job was done on a different date.</p>
          <input
            type="date"
            value={dateCompleted}
            max={todayISO()}
            onChange={(e) => setDateCompleted(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Cost */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Repair Cost (RM) <span className="text-gray-400 font-normal">— optional, can fill later</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">RM</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={!dateCompleted}
            className="bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white"
          >
            ✓ Confirm Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
