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
  { to: '/importera', label: 'Import', icon: Upload },
  { to: '/besparingar', label: 'Spara', icon: PiggyBank },
  { to: '/installningar', label: 'Inställ.', icon: Settings },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border"
         style={{
           background: 'oklch(0.11 0.02 260 / 85%)',
           backdropFilter: 'blur(20px) saturate(1.5)',
           WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
         }}
    >
      <div className="flex justify-around py-2 px-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                isActive
                  ? 'text-aurora-cyan'
                  : 'text-muted-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {isActive && (
                    <div className="absolute -inset-1 bg-aurora-cyan/25 rounded-full blur-md -z-10" />
                  )}
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
