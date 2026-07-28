export function SummaryCard({ label, value, sub, colorClass = 'text-gray-900', bgClass = 'bg-white' }) {
  return (
    <div className={`${bgClass} rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-1`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
