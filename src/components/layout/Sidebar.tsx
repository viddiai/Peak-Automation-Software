import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Upload,
  PiggyBank,
  Settings,
  Sparkles,
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
    <aside className="hidden md:flex flex-col w-[260px] border-r border-border bg-sidebar h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aurora-cyan to-aurora-violet flex items-center justify-center shadow-lg glow-cyan">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <span className="font-serif text-lg tracking-tight text-foreground">SaaS</span>
          <span className="font-serif text-lg tracking-tight text-aurora-cyan">översikt</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-aurora-cyan/10 text-aurora-cyan shadow-sm'
                  : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative ${isActive ? '' : ''}`}>
                  <item.icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-aurora-cyan' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  {isActive && (
                    <div className="absolute -inset-1.5 bg-aurora-cyan/20 rounded-lg blur-md -z-10" />
                  )}
                </div>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground/60">
          PeakAutomation AB
        </p>
      </div>
    </aside>
  );
}
