import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Upload,
  PiggyBank,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Översikt', icon: LayoutDashboard },
  { to: '/tjanster', label: 'Tjänster', icon: Server },
  { to: '/importera', label: 'Importera', icon: Upload },
  { to: '/besparingar', label: 'Besparingar', icon: PiggyBank },
  { to: '/installningar', label: 'Inställningar', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
          <Server className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-lg">SaaS-översikt</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-border text-xs text-muted-foreground">
        PeakAutomation AB
      </div>
    </aside>
  );
}
