import { Link } from 'react-router-dom';

export function OverdueBanner({ count }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-5 py-3 mb-6">
      <div className="flex items-center gap-3">
        <span className="text-red-500 text-xl">⚠</span>
        <p className="text-sm font-semibold text-red-700">
          {count} overdue {count === 1 ? 'issue' : 'issues'} need attention
        </p>
      </div>
      <Link
        to="/issues?filter=overdue"
        className="text-xs font-medium text-red-600 hover:text-red-800 underline"
      >
        View all →
      </Link>
    </div>
  );
}
