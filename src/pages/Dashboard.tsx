import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/hooks/useAppData';
import { getMonthlyCostInSEK, formatCurrency, toYearlyCost } from '@/lib/currency';
import { ServiceLogo } from '@/components/shared/ServiceLogo';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import {
  Server,
  Users,
  UserX,
  TrendingDown,
  CalendarClock,
  Plus,
  Upload,
  PiggyBank,
  List,
} from 'lucide-react';
import type { SaaSService } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import type { Category } from '@/types';

const COLORS = [
  '#059669', '#0891b2', '#7c3aed', '#db2777', '#ea580c',
  '#ca8a04', '#2563eb', '#dc2626', '#4f46e5', '#0d9488',
];

export function Dashboard() {
  const navigate = useNavigate();
  const { services, users, settings, addService } = useAppData();
  const rates = settings.exchangeRates;
  const [formOpen, setFormOpen] = useState(false);

  const activeServices = useMemo(
    () => services.filter(s => s.status === 'active'),
    [services]
  );

  const totalMonthlyCost = useMemo(
    () => activeServices.reduce((sum, s) => sum + getMonthlyCostInSEK(s, rates), 0),
    [activeServices, rates]
  );

  const totalLicenses = useMemo(
    () => activeServices.reduce((sum, s) => sum + s.totalLicenses, 0),
    [activeServices]
  );

  const inactiveUsers = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    return users.filter(u => {
      if (!u.lastLogin) return true;
      return new Date(u.lastLogin) < cutoff;
    });
  }, [users]);

  const potentialSavings = useMemo(() => {
    let savings = 0;
    for (const service of activeServices) {
      const serviceUsers = users.filter(u => u.serviceId === service.id);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      const inactive = serviceUsers.filter(u => !u.lastLogin || new Date(u.lastLogin) < cutoff);
      if (inactive.length > 0 && service.totalLicenses > 0) {
        const costPerLicense = getMonthlyCostInSEK(service, rates) / service.totalLicenses;
        savings += costPerLicense * inactive.length;
      }
    }
    return Math.round(savings);
  }, [activeServices, users, rates]);

  // Cost by service (bar chart)
  const costByService = useMemo(
    () =>
      activeServices
        .map(s => ({
          name: s.name,
          kostnad: getMonthlyCostInSEK(s, rates),
          color: s.logoColor,
        }))
        .sort((a, b) => b.kostnad - a.kostnad)
        .slice(0, 8),
    [activeServices, rates]
  );

  // Cost by category (pie chart)
  const costByCategory = useMemo(() => {
    const map = new Map<Category, number>();
    for (const s of activeServices) {
      map.set(s.category, (map.get(s.category) || 0) + getMonthlyCostInSEK(s, rates));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [activeServices, rates]);

  // 12-month historical trend
  const historicalTrend = useMemo(() => {
    const months: { month: string; kostnad: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toISOString().slice(0, 7);
      const monthLabel = d.toLocaleDateString('sv-SE', { month: 'short' });
      let total = 0;
      for (const s of services) {
        for (const h of s.costHistory) {
          if (h.date.startsWith(monthKey)) {
            total += Math.round(h.amount * rates[h.currency]);
          }
        }
      }
      months.push({ month: monthLabel, kostnad: total });
    }
    return months;
  }, [services, rates]);

  // 12-month forward forecast
  const forecast = useMemo(() => {
    const months: { month: string; prognos: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthLabel = d.toLocaleDateString('sv-SE', { month: 'short', year: '2-digit' });
      let total = 0;
      for (const s of activeServices) {
        const monthly = getMonthlyCostInSEK(s, rates);
        // Check if renewal date is before this month (service might expire)
        if (s.renewalDate) {
          const renewal = new Date(s.renewalDate);
          if (renewal < d && s.billingCycle !== 'consumption') {
            // Assume renewal happens (conservative forecast)
          }
        }
        total += monthly;
      }
      months.push({ month: monthLabel, prognos: total });
    }
    return months;
  }, [activeServices, rates]);

  // Upcoming renewals
  const upcomingRenewals = useMemo(() => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 90);
    return activeServices
      .filter(s => s.renewalDate && new Date(s.renewalDate) >= now && new Date(s.renewalDate) <= future)
      .sort((a, b) => new Date(a.renewalDate!).getTime() - new Date(b.renewalDate!).getTime());
  }, [activeServices]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Översikt</h1>
          <p className="text-muted-foreground text-sm mt-1">
            SaaS-portföljen för {settings.companyName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Lägg till tjänst
          </Button>
          <Button variant="outline" onClick={() => navigate('/tjanster')}>
            <List className="w-4 h-4 mr-2" /> Alla tjänster
          </Button>
          <Button variant="outline" onClick={() => navigate('/importera')}>
            <Upload className="w-4 h-4 mr-2" /> Importera
          </Button>
          <Button variant="outline" onClick={() => navigate('/besparingar')}>
            <PiggyBank className="w-4 h-4 mr-2" /> Besparingar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Server className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeServices.length}</p>
                <p className="text-xs text-muted-foreground">Aktiva tjänster</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLicenses}</p>
                <p className="text-xs text-muted-foreground">Totalt licenser</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <UserX className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveUsers.length}</p>
                <p className="text-xs text-muted-foreground">Inaktiva användare</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(potentialSavings)}</p>
                <p className="text-xs text-muted-foreground">Möjlig besparing/mån</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Månadskostnad</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalMonthlyCost)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(toYearlyCost(totalMonthlyCost))}/år
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kostnad per tjänst (SEK/mån)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costByService} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Kostnad']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="kostnad" radius={[0, 4, 4, 0]}>
                  {costByService.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kostnad per kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {costByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Kostnad/mån']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kostnadstrend (senaste 12 månader)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Total']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="kostnad"
                  name="Kostnad (SEK)"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kostnadsprognos (kommande 12 månader)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Prognos']} />
                <Area
                  type="monotone"
                  dataKey="prognos"
                  name="Prognos (SEK)"
                  stroke="#0891b2"
                  fill="#0891b2"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming renewals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="w-5 h-5" />
            Kommande förnyelser (90 dagar)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingRenewals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga förnyelser inom 90 dagar</p>
          ) : (
            <div className="space-y-3">
              {upcomingRenewals.map(s => {
                const daysLeft = Math.ceil(
                  (new Date(s.renewalDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <ServiceLogo name={s.name} color={s.logoColor} size="sm" />
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.plan} · {s.billingCycle === 'monthly' ? 'Månadsvis' : 'Årsvis'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(s.cost, s.currency)}/{s.billingCycle === 'monthly' ? 'mån' : 'år'}</p>
                      <p className={`text-xs ${daysLeft <= 14 ? 'text-red-500 font-medium' : daysLeft <= 30 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {daysLeft <= 0 ? 'Idag' : `om ${daysLeft} dagar`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        service={null}
        onSave={(service: SaaSService) => { addService(service); setFormOpen(false); }}
      />
    </div>
  );
}
