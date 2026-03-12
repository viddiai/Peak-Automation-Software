import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Services } from '@/pages/Services';
import { ServiceDetail } from '@/pages/ServiceDetail';
import { Import } from '@/pages/Import';
import { Savings } from '@/pages/Savings';
import { Settings } from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
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
      </TooltipProvider>
    </BrowserRouter>
  );
}
