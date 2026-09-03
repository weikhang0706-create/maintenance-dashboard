import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',              label: 'Dashboard',     icon: '▦' },
  { to: '/property-view', label: 'Property View', icon: '⊞' },
  { to: '/issues',        label: 'All Issues',    icon: '☰', overdueKey: true },
  { to: '/billing',       label: 'Cost & Billing',icon: '💳' },
  { to: '/units',         label: 'Units',         icon: '🏠' },
  { to: '/staff',         label: 'Staff',         icon: '👥' },
  { to: '/ac-log',        label: 'AC Log',        icon: '❄' },
  { to: '/report',        label: 'Report Issue',  icon: '+' },
  { to: '/log',           label: 'Activity Log',  icon: '📋' },
];

export function Sidebar({ overdueCount = 0, onLogout, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300
        md:static md:w-56 md:translate-x-0 md:shrink-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-4 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <img src="/ck-group-logo.png" alt="CK Group" className="h-10 w-auto object-contain" />
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Maintenance Dashboard</p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onMobileClose}
            className="md:hidden text-gray-400 hover:text-white text-2xl leading-none p-1"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-base w-5 text-center shrink-0">{link.icon}</span>
              <span className="flex-1">{link.label}</span>
              {link.overdueKey && overdueCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {overdueCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-700">
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
    </>
  );
}
