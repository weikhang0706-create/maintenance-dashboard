import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',              label: 'Dashboard',     icon: '▦' },
  { to: '/property-view', label: 'Property View', icon: '⊞' },
  { to: '/issues',        label: 'All Issues',    icon: '☰', overdueKey: true },
  { to: '/billing',       label: 'Cost & Billing',icon: '💳' },
  { to: '/units',         label: 'Units',         icon: '🏠' },
  { to: '/staff',         label: 'Staff',         icon: '👥' },
  { to: '/report',        label: 'Report Issue',  icon: '+' },
];

export function Sidebar({ overdueCount = 0, onLogout }) {
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
            <span className="flex-1">{link.label}</span>
            {link.overdueKey && overdueCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {overdueCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-700 space-y-2">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full text-left text-xs text-gray-500 hover:text-gray-300 transition-colors px-1"
          >
            🔒 Lock / Logout
          </button>
        )}
      </div>
    </aside>
  );
}
