import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard,
  Server,
  Upload,
  PiggyBank,
  Settings,
  Sparkles,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Översikt', icon: LayoutDashboard },
  { to: '/tjanster', label: 'Tjänster', icon: Server },
  { to: '/importera', label: 'Importera', icon: Upload },
  { to: '/besparingar', label: 'Besparingar', icon: PiggyBank },
  { to: '/installningar', label: 'Inställningar', icon: Settings },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-border bg-sidebar h-screen sticky top-0 relative z-20">
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
                  : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
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

      {/* Theme toggle */}
      <div className="px-3 pb-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-all duration-200"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {theme === 'dark' ? 'Ljust läge' : 'Mörkt läge'}
        </button>
      </div>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-border">
        {user && (
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full shrink-0 border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-aurora-cyan/15 flex items-center justify-center shrink-0 text-aurora-cyan text-xs font-bold">
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName || 'Användare'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-aurora-rose hover:bg-aurora-rose/10 transition-colors"
              title="Logga ut"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
