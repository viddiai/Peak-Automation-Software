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

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around py-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 text-xs transition-colors ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-muted-foreground'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
