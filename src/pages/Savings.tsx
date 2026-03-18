import { useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { getMonthlyCostInSEK, formatCurrency } from '@/lib/currency';
import { ServiceLogo } from '@/components/shared/ServiceLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  TrendingDown,
  Users,
  Layers,
  UserX,
} from 'lucide-react';
import type { Category } from '@/types';

export function Savings() {
  const { services, users, settings } = useAppData();
  const rates = settings.exchangeRates;
  const activeServices = useMemo(
    () => services.filter(s => s.status === 'active'),
    [services]
  );

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d;
  }, []);

  const lowUsageServices = useMemo(() => {
    return activeServices
      .map(s => {
        const serviceUsers = users.filter(u => u.serviceId === s.id);
        const activeUsers = serviceUsers.filter(u => u.lastLogin && new Date(u.lastLogin) >= cutoff);
        const utilizationRate = s.totalLicenses > 0
          ? (activeUsers.length / s.totalLicenses) * 100
          : serviceUsers.length > 0 ? 100 : 0;
        const monthlyCost = getMonthlyCostInSEK(s, rates);
        const potentialSaving = s.totalLicenses > 0
          ? Math.round((monthlyCost / s.totalLicenses) * (s.totalLicenses - activeUsers.length))
          : 0;

        return {
          service: s,
          totalUsers: serviceUsers.length,
          activeUsers: activeUsers.length,
          utilizationRate: Math.round(utilizationRate),
          monthlyCost,
          potentialSaving,
        };
      })
      .filter(item => item.utilizationRate < 50 && item.totalUsers > 0)
      .sort((a, b) => b.potentialSaving - a.potentialSaving);
  }, [activeServices, users, rates, cutoff]);

  const categoryOverlap = useMemo(() => {
    const map = new Map<Category, typeof activeServices>();
    for (const s of activeServices) {
      const list = map.get(s.category) || [];
      list.push(s);
      map.set(s.category, list);
    }
    return Array.from(map.entries())
      .filter(([_, services]) => services.length >= 2)
      .map(([category, services]) => ({
        category,
        services,
        totalMonthlyCost: services.reduce((sum, s) => sum + getMonthlyCostInSEK(s, rates), 0),
      }))
      .sort((a, b) => b.totalMonthlyCost - a.totalMonthlyCost);
  }, [activeServices, rates]);

  const inactiveLicenses = useMemo(() => {
    const result: {
      user: typeof users[0];
      service: typeof services[0];
      daysSinceLogin: number;
      estimatedSaving: number;
    }[] = [];

    for (const s of activeServices) {
      const serviceUsers = users.filter(u => u.serviceId === s.id);
      const costPerLicense = s.totalLicenses > 0
        ? getMonthlyCostInSEK(s, rates) / s.totalLicenses
        : 0;

      for (const u of serviceUsers) {
        const isInactive = !u.lastLogin || new Date(u.lastLogin) < cutoff;
        if (isInactive) {
          const daysSince = u.lastLogin
            ? Math.ceil((Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          result.push({
            user: u,
            service: s,
            daysSinceLogin: daysSince,
            estimatedSaving: Math.round(costPerLicense),
          });
        }
      }
    }

    return result.sort((a, b) => b.estimatedSaving - a.estimatedSaving);
  }, [activeServices, users, rates, cutoff]);

  const totalPotentialSavings = useMemo(
    () => inactiveLicenses.reduce((sum, l) => sum + l.estimatedSaving, 0),
    [inactiveLicenses]
  );

  const summaryKpis = [
    { label: 'Möjlig besparing/mån', value: formatCurrency(totalPotentialSavings), icon: TrendingDown, color: 'rose' as const },
    { label: 'Tjänster med låg användning', value: lowUsageServices.length, icon: Users, color: 'amber' as const },
    { label: 'Överlappande kategorier', value: categoryOverlap.length, icon: Layers, color: 'cyan' as const },
    { label: 'Inaktiva licenser', value: inactiveLicenses.length, icon: UserX, color: 'violet' as const },
  ];

  const colorMap = {
    rose: 'bg-aurora-rose/10 text-aurora-rose',
    amber: 'bg-aurora-amber/10 text-aurora-amber',
    cyan: 'bg-aurora-cyan/10 text-aurora-cyan',
    violet: 'bg-aurora-violet/10 text-aurora-violet',
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Besparingar & optimering"
        subtitle="Identifiera kostnadsbesparingar i din SaaS-portfölj"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryKpis.map((kpi, i) => (
          <Card key={kpi.label} className={`glass-card animate-in-${i + 2}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[kpi.color].split(' ')[0]}`}>
                  <kpi.icon className={`w-5 h-5 ${colorMap[kpi.color].split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
                  <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="low-usage" className="animate-in-6">
        <TabsList className="bg-white/[0.04] border border-border/30">
          <TabsTrigger value="low-usage">Låg användning</TabsTrigger>
          <TabsTrigger value="overlap">Överlapp</TabsTrigger>
          <TabsTrigger value="inactive">Inaktiva licenser</TabsTrigger>
        </TabsList>

        <TabsContent value="low-usage" className="space-y-4">
          {lowUsageServices.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-16 text-center text-muted-foreground">
                Alla tjänster har en bra utnyttjandegrad!
              </CardContent>
            </Card>
          ) : (
            lowUsageServices.map(item => (
              <Card key={item.service.id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <ServiceLogo name={item.service.name} color={item.service.logoColor} />
                      <div>
                        <p className="font-medium">{item.service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.service.vendor} · {item.service.plan}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{formatCurrency(item.monthlyCost)}/mån</p>
                      <p className="text-sm text-aurora-rose font-medium">
                        Besparing: {formatCurrency(item.potentialSaving)}/mån
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">Aktiva</p>
                      <p className="font-medium tabular-nums">{item.activeUsers} av {item.service.totalLicenses}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">Utnyttjandegrad</p>
                      <div className="flex items-center gap-2">
                        <Progress value={item.utilizationRate} className="h-2 flex-1" />
                        <span className="text-sm font-semibold text-aurora-rose tabular-nums">{item.utilizationRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">Rekommendation</p>
                      <p className="text-sm">
                        {item.utilizationRate < 20
                          ? 'Överväg att avsluta'
                          : 'Minska antal licenser'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="overlap" className="space-y-4">
          {categoryOverlap.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-16 text-center text-muted-foreground">
                Inga överlappande kategorier hittades
              </CardContent>
            </Card>
          ) : (
            categoryOverlap.map(group => (
              <Card key={group.category} className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="text-muted-foreground">{group.category} ({group.services.length} tjänster)</span>
                    <Badge variant="secondary" className="bg-white/[0.06] text-foreground border-0 tabular-nums">{formatCurrency(group.totalMonthlyCost)}/mån</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Dessa tjänster kan ha överlappande funktionalitet. Överväg att konsolidera.
                  </p>
                  <div className="space-y-1">
                    {group.services.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0 group hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors">
                        <div className="flex items-center gap-3">
                          <ServiceLogo name={s.name} color={s.logoColor} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-[11px] text-muted-foreground">{s.vendor} · {s.plan}</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(getMonthlyCostInSEK(s, rates))}/mån</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="inactive">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inaktiva licenser ({inactiveLicenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {inactiveLicenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-16">
                  Alla användare är aktiva!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-[11px] uppercase tracking-wider">Användare</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider">Tjänst</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider">Licensnivå</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider">Dagar sedan inloggning</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider">Beräknad besparing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveLicenses.map((l, i) => (
                      <TableRow key={i} className="border-border/20">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{l.user.name}</p>
                            <p className="text-[11px] text-muted-foreground">{l.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ServiceLogo name={l.service.name} color={l.service.logoColor} size="sm" />
                            <span className="text-sm">{l.service.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">{l.user.licenseTier}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-[10px]">
                            {l.daysSinceLogin >= 999 ? 'Aldrig' : `${l.daysSinceLogin} dagar`}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-aurora-rose tabular-nums">
                          {formatCurrency(l.estimatedSaving)}/mån
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
