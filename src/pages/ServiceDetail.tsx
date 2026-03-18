import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useAppData } from '@/hooks/useAppData';
import { getMonthlyCostInSEK, formatCurrency, toYearlyCost } from '@/lib/currency';
import { ServiceLogo } from '@/components/shared/ServiceLogo';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  ArrowLeft,
  Pencil,
  UserPlus,
  Link as LinkIcon,
  Plus,
  Minus,
  Trash2,
  CalendarClock,
  Users,
  CreditCard,
  KeyRound,
  UserCheck,
  UserMinus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { SaaSService, ServiceUser, ServiceNote } from '@/types';

export function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    services, users, settings,
    editService, addUser, editUser, deleteUser,
  } = useAppData();

  const service = services.find(s => s.id === id);
  const serviceUsers = useMemo(
    () => users.filter(u => u.serviceId === id),
    [users, id]
  );

  const [formOpen, setFormOpen] = useState(false);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ServiceUser | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', licenseTier: '' });
  const [newNote, setNewNote] = useState({ text: '', url: '' });

  if (!service) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Tjänsten hittades inte</p>
        <Button variant="link" className="text-aurora-cyan" onClick={() => navigate('/tjanster')}>
          Tillbaka till tjänster
        </Button>
      </div>
    );
  }

  const rates = settings.exchangeRates;
  const monthlyCost = getMonthlyCostInSEK(service, rates);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const activeUsers = serviceUsers.filter(u => u.lastLogin && new Date(u.lastLogin) >= cutoff);
  const inactiveUsers = serviceUsers.filter(u => !u.lastLogin || new Date(u.lastLogin) < cutoff);
  const utilization = service.totalLicenses > 0
    ? Math.round((serviceUsers.length / service.totalLicenses) * 100)
    : 0;

  const costHistoryData = service.costHistory.map(h => ({
    month: new Date(h.date).toLocaleDateString('sv-SE', { month: 'short' }),
    kostnad: Math.round(h.amount * rates[h.currency]),
  }));

  const daysToRenewal = service.renewalDate
    ? Math.ceil((new Date(service.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleSaveService = (updated: SaaSService) => {
    editService(updated.id, updated);
  };

  const handleAddUser = () => {
    if (!newUser.name) return;
    if (editingUser) {
      editUser(editingUser.id, {
        name: newUser.name,
        email: newUser.email,
        licenseTier: newUser.licenseTier,
      });
    } else {
      addUser({
        id: uuid(),
        name: newUser.name,
        email: newUser.email,
        lastLogin: null,
        licenseTier: newUser.licenseTier || service.plan,
        serviceId: service.id,
      });
    }
    setNewUser({ name: '', email: '', licenseTier: '' });
    setEditingUser(null);
    setUserFormOpen(false);
  };

  const handleAddNote = () => {
    if (!newNote.text) return;
    const note: ServiceNote = {
      id: uuid(),
      text: newNote.text,
      url: newNote.url || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };
    editService(service.id, { notes: [...service.notes, note] });
    setNewNote({ text: '', url: '' });
    setNoteFormOpen(false);
  };

  const handleDeleteNote = (noteId: string) => {
    editService(service.id, { notes: service.notes.filter(n => n.id !== noteId) });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={service.name}
        subtitle={`${service.vendor} · ${service.plan}`}
      />

      {/* Back + service detail header */}
      <div className="flex items-start gap-4 animate-in-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/tjanster')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Tillbaka
        </Button>
      </div>

      <div className="flex items-center justify-between animate-in-3">
        <div className="flex items-center gap-4">
          <ServiceLogo name={service.name} color={service.logoColor} size="lg" />
          <div>
            <h1 className="font-serif text-2xl md:text-3xl tracking-tight">{service.name}</h1>
            <p className="text-muted-foreground text-sm">
              {service.vendor} · {service.plan}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge
                variant={service.status === 'active' ? 'default' : 'secondary'}
                className={service.status === 'active' ? 'bg-aurora-teal/15 text-aurora-teal border-0' : 'bg-white/[0.06] text-muted-foreground border-0'}
              >
                {service.status === 'active' ? 'Aktiv' : 'Inaktiv'}
              </Badge>
              <Badge variant="secondary" className="bg-white/[0.06] text-muted-foreground border-0">{service.category}</Badge>
              {service.tags.map(t => (
                <Badge key={t} variant="outline" className="text-[10px] border-border/50 text-muted-foreground">{t}</Badge>
              ))}
            </div>
          </div>
        </div>
        <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={() => setFormOpen(true)}>
          <Pencil className="w-4 h-4 mr-2" /> Redigera
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card animate-in-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-aurora-cyan/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-aurora-cyan" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">{formatCurrency(monthlyCost)}</p>
                <p className="text-[11px] text-muted-foreground">
                  per månad ({formatCurrency(toYearlyCost(monthlyCost))}/år)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card animate-in-5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-aurora-blue/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-aurora-blue" />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight">{serviceUsers.length}/{service.totalLicenses}</p>
                  <p className="text-[11px] text-muted-foreground">Licenser använda</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 border-border/50"
                  onClick={() => editService(service.id, { totalLicenses: Math.max(0, service.totalLicenses - 1) })}
                  disabled={service.totalLicenses <= 0}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 border-border/50"
                  onClick={() => editService(service.id, { totalLicenses: service.totalLicenses + 1 })}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card animate-in-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-aurora-amber/10 flex items-center justify-center">
                <CalendarClock className="w-4 h-4 text-aurora-amber" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">
                  {daysToRenewal !== null ? `${daysToRenewal} dagar` : '—'}
                </p>
                <p className="text-[11px] text-muted-foreground">Till förnyelse</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card animate-in-7">
          <CardContent className="pt-6">
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Utnyttjandegrad</p>
              <Progress value={utilization} className="h-2" />
              <p className="text-sm font-semibold mt-1.5 tabular-nums">{utilization}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="licenses" className="space-y-4 animate-in-8">
        <TabsList className="bg-white/[0.04] border border-border/30">
          <TabsTrigger value="licenses">Licenser ({service.totalLicenses})</TabsTrigger>
          <TabsTrigger value="users">Användare ({serviceUsers.length})</TabsTrigger>
          <TabsTrigger value="cost">Kostnadshistorik</TabsTrigger>
          <TabsTrigger value="notes">Anteckningar ({service.notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Licensöversikt</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Totalt:</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-border/50"
                    onClick={() => editService(service.id, { totalLicenses: Math.max(0, service.totalLicenses - 1) })}
                    disabled={service.totalLicenses <= 0}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    className="w-20 h-8 text-center bg-white/[0.04] border-border/50"
                    value={service.totalLicenses}
                    onChange={e => editService(service.id, { totalLicenses: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-border/50"
                    onClick={() => editService(service.id, { totalLicenses: service.totalLicenses + 1 })}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-border/20">
                  <KeyRound className="w-5 h-5 text-aurora-cyan" />
                  <div>
                    <p className="text-lg font-bold tabular-nums">{service.totalLicenses}</p>
                    <p className="text-[11px] text-muted-foreground">Totalt licenser</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-border/20">
                  <UserCheck className="w-5 h-5 text-aurora-teal" />
                  <div>
                    <p className="text-lg font-bold tabular-nums">{activeUsers.length}</p>
                    <p className="text-[11px] text-muted-foreground">Aktiva tilldelade</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-border/20">
                  <UserMinus className="w-5 h-5 text-aurora-amber" />
                  <div>
                    <p className="text-lg font-bold tabular-nums">{inactiveUsers.length}</p>
                    <p className="text-[11px] text-muted-foreground">Inaktiva tilldelade</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-border/20">
                  <KeyRound className="w-5 h-5 text-muted-foreground/40" />
                  <div>
                    <p className="text-lg font-bold tabular-nums">{Math.max(0, service.totalLicenses - serviceUsers.length)}</p>
                    <p className="text-[11px] text-muted-foreground">Ej tilldelade</p>
                  </div>
                </div>
              </div>

              {/* Visual bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Utnyttjande</span>
                  <span className="tabular-nums">{utilization}%</span>
                </div>
                <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden flex">
                  {service.totalLicenses > 0 && (
                    <>
                      <div
                        className="bg-aurora-teal transition-all rounded-l-full"
                        style={{ width: `${(activeUsers.length / service.totalLicenses) * 100}%` }}
                        title={`${activeUsers.length} aktiva`}
                      />
                      <div
                        className="bg-aurora-amber transition-all"
                        style={{ width: `${(inactiveUsers.length / service.totalLicenses) * 100}%` }}
                        title={`${inactiveUsers.length} inaktiva`}
                      />
                    </>
                  )}
                </div>
                <div className="flex gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-aurora-teal" /> Aktiva ({activeUsers.length})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-aurora-amber" /> Inaktiva ({inactiveUsers.length})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white/10" /> Lediga ({Math.max(0, service.totalLicenses - serviceUsers.length)})
                  </span>
                </div>
              </div>

              {service.totalLicenses > 0 && (
                <div className="mt-6 p-4 border border-border/30 rounded-xl bg-white/[0.02]">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Kostnad per licens</p>
                      <p className="text-[11px] text-muted-foreground">Baserat på total månadskostnad</p>
                    </div>
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(Math.round(monthlyCost / service.totalLicenses))}/mån</p>
                  </div>
                  {inactiveUsers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-aurora-amber">Möjlig besparing</p>
                        <p className="text-[11px] text-muted-foreground">
                          {inactiveUsers.length} inaktiva × {formatCurrency(Math.round(monthlyCost / service.totalLicenses))}/mån
                        </p>
                      </div>
                      <p className="text-lg font-bold text-aurora-amber tabular-nums">
                        {formatCurrency(Math.round((monthlyCost / service.totalLicenses) * inactiveUsers.length))}/mån
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Licensplatser</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="w-[50px] text-[11px] uppercase tracking-wider">#</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Tilldelad</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Licensnivå</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: service.totalLicenses }, (_, i) => {
                    const user = serviceUsers[i];
                    const isInactive = user && (!user.lastLogin || new Date(user.lastLogin) < cutoff);
                    return (
                      <TableRow key={i} className="border-border/20">
                        <TableCell className="text-muted-foreground text-sm tabular-nums">{i + 1}</TableCell>
                        <TableCell>
                          {user ? (
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-[11px] text-muted-foreground">{user.email}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground/50 italic">Ledig</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user ? (
                            <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">{user.licenseTier}</Badge>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user ? (
                            <Badge
                              variant={isInactive ? 'destructive' : 'default'}
                              className={!isInactive ? 'bg-aurora-teal/15 text-aurora-teal border-0 text-[10px]' : 'text-[10px]'}
                            >
                              {isInactive ? 'Inaktiv' : 'Aktiv'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-white/[0.04] text-muted-foreground/50 border-0 text-[10px]">Ej tilldelad</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {service.totalLicenses === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Inga licenser tillagda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Användare</CardTitle>
              <Button
                size="sm"
                className="bg-aurora-cyan hover:bg-aurora-cyan/90 text-background font-semibold"
                onClick={() => {
                  setEditingUser(null);
                  setNewUser({ name: '', email: '', licenseTier: '' });
                  setUserFormOpen(true);
                }}
              >
                <UserPlus className="w-4 h-4 mr-1" /> Lägg till
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wider">Namn</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">E-post</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Licensnivå</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Senaste inloggning</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceUsers.map(u => {
                    const isInactive = !u.lastLogin || new Date(u.lastLogin) < cutoff;
                    return (
                      <TableRow key={u.id} className="border-border/20">
                        <TableCell className="font-medium text-sm">{u.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">{u.licenseTier}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleDateString('sv-SE')
                            : 'Aldrig'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isInactive ? 'destructive' : 'default'}
                            className={!isInactive ? 'bg-aurora-teal/15 text-aurora-teal border-0 text-[10px]' : 'text-[10px]'}
                          >
                            {isInactive ? 'Inaktiv' : 'Aktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditingUser(u);
                                setNewUser({ name: u.name, email: u.email, licenseTier: u.licenseTier });
                                setUserFormOpen(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-aurora-rose hover:text-aurora-rose"
                              onClick={() => deleteUser(u.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {serviceUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Inga användare tillagda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {serviceUsers.length > 0 && (
            <Card className="mt-4 glass-card">
              <CardContent className="pt-6">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Aktiva</p>
                    <p className="text-2xl font-bold text-aurora-teal tracking-tight">{activeUsers.length}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Inaktiva (60+ d)</p>
                    <p className="text-2xl font-bold text-aurora-rose tracking-tight">{inactiveUsers.length}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Adoptionsgrad</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {serviceUsers.length > 0
                        ? Math.round((activeUsers.length / serviceUsers.length) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cost">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Kostnadshistorik (SEK)</CardTitle>
            </CardHeader>
            <CardContent>
              {costHistoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Kostnad']} />
                    <Line
                      type="monotone"
                      dataKey="kostnad"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#38bdf8', stroke: '#38bdf833', strokeWidth: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">Ingen kostnadshistorik</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4 glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Kostnadslogg</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wider">Datum</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Belopp</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Beskrivning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {service.costHistory.slice().reverse().slice(0, 12).map(h => (
                    <TableRow key={h.id} className="border-border/20">
                      <TableCell className="text-sm tabular-nums text-muted-foreground">{new Date(h.date).toLocaleDateString('sv-SE')}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums">{formatCurrency(h.amount, h.currency)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{h.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Anteckningar & dokument</CardTitle>
              <Button
                size="sm"
                className="bg-aurora-cyan hover:bg-aurora-cyan/90 text-background font-semibold"
                onClick={() => {
                  setNewNote({ text: '', url: '' });
                  setNoteFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Lägg till
              </Button>
            </CardHeader>
            <CardContent>
              {service.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Inga anteckningar</p>
              ) : (
                <div className="space-y-3">
                  {service.notes.map(n => (
                    <div key={n.id} className="flex items-start justify-between p-4 border border-border/30 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div>
                        <p className="text-sm">{n.text}</p>
                        {n.url && (
                          <a
                            href={n.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-aurora-cyan flex items-center gap-1 mt-1.5 hover:underline"
                          >
                            <LinkIcon className="w-3 h-3" /> {n.url}
                          </a>
                        )}
                        <p className="text-[11px] text-muted-foreground/60 mt-1">{n.createdAt}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-aurora-rose shrink-0"
                        onClick={() => handleDeleteNote(n.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service edit dialog */}
      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        service={service}
        onSave={handleSaveService}
      />

      {/* User form dialog */}
      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingUser ? 'Redigera användare' : 'Lägg till användare'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Namn *</Label>
              <Input
                className="bg-white/[0.04] border-border/50 focus:border-aurora-cyan/40"
                value={newUser.name}
                onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
                placeholder="t.ex. Anna Lindberg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">E-post</Label>
              <Input
                type="email"
                className="bg-white/[0.04] border-border/50 focus:border-aurora-cyan/40"
                value={newUser.email}
                onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                placeholder="anna@foretaget.se"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Licensnivå</Label>
              <Input
                className="bg-white/[0.04] border-border/50 focus:border-aurora-cyan/40"
                value={newUser.licenseTier}
                onChange={e => setNewUser(u => ({ ...u, licenseTier: e.target.value }))}
                placeholder={service.plan}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border/50" onClick={() => setUserFormOpen(false)}>Avbryt</Button>
            <Button className="bg-aurora-cyan hover:bg-aurora-cyan/90 text-background font-semibold" onClick={handleAddUser}>
              {editingUser ? 'Spara' : 'Lägg till'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note form dialog */}
      <Dialog open={noteFormOpen} onOpenChange={setNoteFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Ny anteckning</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Text *</Label>
              <Textarea
                className="bg-white/[0.04] border-border/50 focus:border-aurora-cyan/40"
                value={newNote.text}
                onChange={e => setNewNote(n => ({ ...n, text: e.target.value }))}
                placeholder="Skriv en anteckning..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Länk (valfritt)</Label>
              <Input
                className="bg-white/[0.04] border-border/50 focus:border-aurora-cyan/40"
                value={newNote.url}
                onChange={e => setNewNote(n => ({ ...n, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border/50" onClick={() => setNoteFormOpen(false)}>Avbryt</Button>
            <Button className="bg-aurora-cyan hover:bg-aurora-cyan/90 text-background font-semibold" onClick={handleAddNote}>
              Lägg till
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
