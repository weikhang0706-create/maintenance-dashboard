import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/property-view', label: 'Property View', icon: '⊞' },
  { to: '/issues', label: 'All Issues', icon: '☰' },
  { to: '/billing', label: 'Cost & Billing', icon: '💳' },
  { to: '/units', label: 'Units', icon: '🏠' },
  { to: '/report', label: 'Report Issue', icon: '+' },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Maintenance</p>
        <p className="text-lg font-bold mt-0.5">Dashboard</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 text-center">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">Phase 1 — Mock Data</p>
      </div>
    </aside>
  );
}
