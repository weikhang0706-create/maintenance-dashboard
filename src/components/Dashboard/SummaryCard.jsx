export function SummaryCard({ label, value, sub, colorClass = 'text-gray-900', bgClass = 'bg-white', onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`${bgClass} rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-1 text-left w-full ${
        onClick ? 'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer' : ''
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </Tag>
  );
}
