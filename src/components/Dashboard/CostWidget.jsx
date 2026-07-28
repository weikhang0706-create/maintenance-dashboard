export function CostWidget({ costByCategory }) {
  const entries = Object.entries(costByCategory).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Cost This Month by Category</p>
        <p className="text-sm text-gray-400 italic">No completed repairs this month.</p>
      </div>
    );
  }

  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Cost This Month by Category</p>
      <ul className="space-y-2">
        {entries.map(([cat, cost]) => (
          <li key={cat} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{cat}</span>
            <span className="font-semibold text-gray-900">RM {cost.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between text-sm font-bold">
        <span className="text-gray-600">Total</span>
        <span className="text-gray-900">RM {total.toFixed(2)}</span>
      </div>
    </div>
  );
}
