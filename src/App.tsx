import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Services } from '@/pages/Services';
import { ServiceDetail } from '@/pages/ServiceDetail';
import { Import } from '@/pages/Import';
import { Savings } from '@/pages/Savings';
import { Settings } from '@/pages/Settings';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background aurora-bg grain-overlay flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="w-8 h-8 border-2 border-aurora-cyan/30 border-t-aurora-cyan rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tjanster" element={<Services />} />
        <Route path="/tjanster/:id" element={<ServiceDetail />} />
        <Route path="/importera" element={<Import />} />
        <Route path="/besparingar" element={<Savings />} />
        <Route path="/installningar" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
