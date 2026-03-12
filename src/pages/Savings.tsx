import { useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { getMonthlyCostInSEK, formatCurrency } from '@/lib/currency';
import { ServiceLogo } from '@/components/shared/ServiceLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  TrendingDown,
  Users,
  Layers,
  UserX,
  Download,
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

  // Low usage: services where active users < 50% of licenses
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

  // Overlap: group by category
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

  // Inactive licenses
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

  const exportCSV = () => {
    const headers = ['Tjänst', 'Användare', 'E-post', 'Dagar sedan inloggning', 'Beräknad besparing (SEK/mån)'];
    const rows = inactiveLicenses.map(l => [
      l.service.name,
      l.user.name,
      l.user.email,
      l.daysSinceLogin.toString(),
      l.estimatedSaving.toString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `besparingsrapport-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Besparingar & optimering</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Identifiera kostnadsbesparingar i din SaaS-portfölj
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> Exportera rapport
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(totalPotentialSavings)}</p>
                <p className="text-xs text-muted-foreground">Möjlig besparing/mån</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{lowUsageServices.length}</p>
                <p className="text-xs text-muted-foreground">Tjänster med låg användning</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{categoryOverlap.length}</p>
                <p className="text-xs text-muted-foreground">Överlappande kategorier</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <UserX className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{inactiveLicenses.length}</p>
                <p className="text-xs text-muted-foreground">Inaktiva licenser</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="low-usage">
        <TabsList>
          <TabsTrigger value="low-usage">Låg användning</TabsTrigger>
          <TabsTrigger value="overlap">Överlapp</TabsTrigger>
          <TabsTrigger value="inactive">Inaktiva licenser</TabsTrigger>
        </TabsList>

        {/* Low Usage */}
        <TabsContent value="low-usage" className="space-y-4">
          {lowUsageServices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Alla tjänster har en bra utnyttjandegrad!
              </CardContent>
            </Card>
          ) : (
            lowUsageServices.map(item => (
              <Card key={item.service.id}>
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
                      <p className="font-medium">{formatCurrency(item.monthlyCost)}/mån</p>
                      <p className="text-sm text-red-500">
                        Möjlig besparing: {formatCurrency(item.potentialSaving)}/mån
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Aktiva användare</p>
                      <p className="font-medium">{item.activeUsers} av {item.service.totalLicenses} licenser</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Utnyttjandegrad</p>
                      <div className="flex items-center gap-2">
                        <Progress value={item.utilizationRate} className="h-2 flex-1" />
                        <span className="text-sm font-medium text-red-500">{item.utilizationRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Rekommendation</p>
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

        {/* Overlap */}
        <TabsContent value="overlap" className="space-y-4">
          {categoryOverlap.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Inga överlappande kategorier hittades
              </CardContent>
            </Card>
          ) : (
            categoryOverlap.map(group => (
              <Card key={group.category}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{group.category} ({group.services.length} tjänster)</span>
                    <Badge variant="secondary">{formatCurrency(group.totalMonthlyCost)}/mån</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Dessa tjänster kan ha överlappande funktionalitet. Överväg att konsolidera.
                  </p>
                  <div className="space-y-2">
                    {group.services.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <ServiceLogo name={s.name} color={s.logoColor} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.vendor} · {s.plan}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(getMonthlyCostInSEK(s, rates))}/mån</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Inactive Licenses */}
        <TabsContent value="inactive">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Inaktiva licenser ({inactiveLicenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {inactiveLicenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">
                  Alla användare är aktiva!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Användare</TableHead>
                      <TableHead>Tjänst</TableHead>
                      <TableHead>Licensnivå</TableHead>
                      <TableHead>Dagar sedan inloggning</TableHead>
                      <TableHead>Beräknad besparing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveLicenses.map((l, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{l.user.name}</p>
                            <p className="text-xs text-muted-foreground">{l.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ServiceLogo name={l.service.name} color={l.service.logoColor} size="sm" />
                            <span className="text-sm">{l.service.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{l.user.licenseTier}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">
                            {l.daysSinceLogin >= 999 ? 'Aldrig' : `${l.daysSinceLogin} dagar`}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-red-500">
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
