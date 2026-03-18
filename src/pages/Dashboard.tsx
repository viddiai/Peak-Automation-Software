import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppData } from '@/hooks/useAppData';
import { getMonthlyCostInSEK, formatCurrency, toYearlyCost } from '@/lib/currency';
import { ServiceLogo } from '@/components/shared/ServiceLogo';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Server,
  Users,
  UserX,
  TrendingDown,
  CalendarClock,
} from 'lucide-react';
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

const CHART_COLORS = [
  '#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f87171',
  '#fb923c', '#2dd4bf', '#818cf8', '#e879f9', '#22d3ee',
];

export function Dashboard() {
  const { services, users, settings } = useAppData();
  const rates = settings.exchangeRates;

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

  const costByCategory = useMemo(() => {
    const map = new Map<Category, number>();
    for (const s of activeServices) {
      map.set(s.category, (map.get(s.category) || 0) + getMonthlyCostInSEK(s, rates));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [activeServices, rates]);

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

  const forecast = useMemo(() => {
    const months: { month: string; prognos: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthLabel = d.toLocaleDateString('sv-SE', { month: 'short', year: '2-digit' });
      let total = 0;
      for (const s of activeServices) {
        const monthly = getMonthlyCostInSEK(s, rates);
        if (s.renewalDate) {
          const renewal = new Date(s.renewalDate);
          if (renewal < d && s.billingCycle !== 'consumption') {
            // Assume renewal (conservative)
          }
        }
        total += monthly;
      }
      months.push({ month: monthLabel, prognos: total });
    }
    return months;
  }, [activeServices, rates]);

  const upcomingRenewals = useMemo(() => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 90);
    return activeServices
      .filter(s => s.renewalDate && new Date(s.renewalDate) >= now && new Date(s.renewalDate) <= future)
      .sort((a, b) => new Date(a.renewalDate!).getTime() - new Date(b.renewalDate!).getTime());
  }, [activeServices]);

  const kpis = [
    {
      label: 'Aktiva tjänster',
      value: activeServices.length,
      icon: Server,
      color: 'cyan' as const,
    },
    {
      label: 'Totalt licenser',
      value: totalLicenses,
      icon: Users,
      color: 'blue' as const,
    },
    {
      label: 'Inaktiva användare',
      value: inactiveUsers.length,
      icon: UserX,
      color: 'amber' as const,
    },
    {
      label: 'Möjlig besparing/mån',
      value: formatCurrency(potentialSavings),
      icon: TrendingDown,
      color: 'rose' as const,
    },
  ];

  const colorMap = {
    cyan: { bg: 'bg-aurora-cyan/10', text: 'text-aurora-cyan', glow: 'glow-cyan' },
    blue: { bg: 'bg-aurora-blue/10', text: 'text-aurora-blue', glow: '' },
    amber: { bg: 'bg-aurora-amber/10', text: 'text-aurora-amber', glow: 'glow-amber' },
    rose: { bg: 'bg-aurora-rose/10', text: 'text-aurora-rose', glow: 'glow-rose' },
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Översikt"
        subtitle={`SaaS-portföljen för ${settings.companyName}`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => {
          const c = colorMap[kpi.color];
          return (
            <Card key={kpi.label} className={`glass-card animate-in-${i + 2}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                    <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card className="col-span-2 lg:col-span-1 glass-card animate-in-6">
          <CardContent className="pt-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Månadskostnad</p>
              <p className="text-2xl font-bold text-aurora-cyan tracking-tight mt-1">{formatCurrency(totalMonthlyCost)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatCurrency(toYearlyCost(totalMonthlyCost))}/år
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card animate-in-7">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Kostnad per tjänst (SEK/mån)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costByService} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Kostnad']}
                />
                <Bar dataKey="kostnad" radius={[0, 6, 6, 0]}>
                  {costByService.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card animate-in-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Kostnad per kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {costByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Kostnadstrend (senaste 12 månader)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Total']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="kostnad"
                  name="Kostnad (SEK)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#38bdf8', stroke: '#38bdf833', strokeWidth: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Kostnadsprognos (kommande 12 månader)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="prognosGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Prognos']} />
                <Area
                  type="monotone"
                  dataKey="prognos"
                  name="Prognos (SEK)"
                  stroke="#a78bfa"
                  fill="url(#prognosGradient)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming renewals */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-aurora-amber" />
            Kommande förnyelser (90 dagar)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingRenewals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga förnyelser inom 90 dagar</p>
          ) : (
            <div className="space-y-1">
              {upcomingRenewals.map(s => {
                const daysLeft = Math.ceil(
                  (new Date(s.renewalDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={s.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 group hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <ServiceLogo name={s.name} color={s.logoColor} size="sm" />
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">{s.plan} · {s.billingCycle === 'monthly' ? 'Månadsvis' : 'Årsvis'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(s.cost, s.currency)}/{s.billingCycle === 'monthly' ? 'mån' : 'år'}</p>
                      <p className={`text-[11px] font-medium ${daysLeft <= 14 ? 'text-aurora-rose' : daysLeft <= 30 ? 'text-aurora-amber' : 'text-muted-foreground'}`}>
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
    </div>
  );
}
