export function SyncStatus({ status }) {
  if (status === 'idle') return null;

  const config = {
    syncing: { text: '⟳ Saving to Sheets…', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    saved:   { text: '✓ Saved to Sheets',    cls: 'bg-green-50 text-green-700 border-green-200' },
    error:   { text: '⚠ Sync failed — changes kept locally. Check console.', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl border text-sm font-medium shadow-lg transition-all ${c.cls}`}>
      {c.text}
    </div>
  );
}
