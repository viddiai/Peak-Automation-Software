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
// Select unused but kept for future expansion
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
        <Button variant="link" onClick={() => navigate('/tjanster')}>
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
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tjanster')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Tillbaka
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ServiceLogo name={service.name} color={service.logoColor} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">{service.name}</h1>
            <p className="text-muted-foreground">
              {service.vendor} · {service.plan}
            </p>
            <div className="flex gap-2 mt-1">
              <Badge
                variant={service.status === 'active' ? 'default' : 'secondary'}
                className={service.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
              >
                {service.status === 'active' ? 'Aktiv' : 'Inaktiv'}
              </Badge>
              <Badge variant="secondary">{service.category}</Badge>
              {service.tags.map(t => (
                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setFormOpen(true)}>
          <Pencil className="w-4 h-4 mr-2" /> Redigera
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xl font-bold">{formatCurrency(monthlyCost)}</p>
                <p className="text-xs text-muted-foreground">
                  per månad ({formatCurrency(toYearlyCost(monthlyCost))}/år)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xl font-bold">{serviceUsers.length}/{service.totalLicenses}</p>
                  <p className="text-xs text-muted-foreground">Licenser använda</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => editService(service.id, { totalLicenses: Math.max(0, service.totalLicenses - 1) })}
                  disabled={service.totalLicenses <= 0}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => editService(service.id, { totalLicenses: service.totalLicenses + 1 })}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CalendarClock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xl font-bold">
                  {daysToRenewal !== null ? `${daysToRenewal} dagar` : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Till förnyelse</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Utnyttjandegrad</p>
              <Progress value={utilization} className="h-2" />
              <p className="text-sm font-medium mt-1">{utilization}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="licenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="licenses">Licenser ({service.totalLicenses})</TabsTrigger>
          <TabsTrigger value="users">Användare ({serviceUsers.length})</TabsTrigger>
          <TabsTrigger value="cost">Kostnadshistorik</TabsTrigger>
          <TabsTrigger value="notes">Anteckningar ({service.notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses" className="space-y-4">
          {/* License overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Licensöversikt</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Totalt:</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editService(service.id, { totalLicenses: Math.max(0, service.totalLicenses - 1) })}
                    disabled={service.totalLicenses <= 0}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    className="w-20 h-8 text-center"
                    value={service.totalLicenses}
                    onChange={e => editService(service.id, { totalLicenses: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editService(service.id, { totalLicenses: service.totalLicenses + 1 })}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold">{service.totalLicenses}</p>
                    <p className="text-xs text-muted-foreground">Totalt licenser</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-lg font-bold">{activeUsers.length}</p>
                    <p className="text-xs text-muted-foreground">Aktiva tilldelade</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <UserMinus className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-lg font-bold">{inactiveUsers.length}</p>
                    <p className="text-xs text-muted-foreground">Inaktiva tilldelade</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <KeyRound className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold">{Math.max(0, service.totalLicenses - serviceUsers.length)}</p>
                    <p className="text-xs text-muted-foreground">Ej tilldelade</p>
                  </div>
                </div>
              </div>

              {/* Visual bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Utnyttjande</span>
                  <span>{utilization}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                  {service.totalLicenses > 0 && (
                    <>
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{ width: `${(activeUsers.length / service.totalLicenses) * 100}%` }}
                        title={`${activeUsers.length} aktiva`}
                      />
                      <div
                        className="bg-amber-400 transition-all"
                        style={{ width: `${(inactiveUsers.length / service.totalLicenses) * 100}%` }}
                        title={`${inactiveUsers.length} inaktiva`}
                      />
                    </>
                  )}
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aktiva ({activeUsers.length})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Inaktiva ({inactiveUsers.length})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/20" /> Lediga ({Math.max(0, service.totalLicenses - serviceUsers.length)})
                  </span>
                </div>
              </div>

              {/* Cost per license */}
              {service.totalLicenses > 0 && (
                <div className="mt-6 p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Kostnad per licens</p>
                      <p className="text-xs text-muted-foreground">Baserat på total månadskostnad</p>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(Math.round(monthlyCost / service.totalLicenses))}/mån</p>
                  </div>
                  {inactiveUsers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-amber-600">Möjlig besparing</p>
                        <p className="text-xs text-muted-foreground">
                          {inactiveUsers.length} inaktiva licenser × {formatCurrency(Math.round(monthlyCost / service.totalLicenses))}/mån
                        </p>
                      </div>
                      <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(Math.round((monthlyCost / service.totalLicenses) * inactiveUsers.length))}/mån
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* License slots */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Licensplatser</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Tilldelad</TableHead>
                    <TableHead>Licensnivå</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: service.totalLicenses }, (_, i) => {
                    const user = serviceUsers[i];
                    const isInactive = user && (!user.lastLogin || new Date(user.lastLogin) < cutoff);
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                        <TableCell>
                          {user ? (
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Ledig</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user ? (
                            <Badge variant="outline" className="text-xs">{user.licenseTier}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user ? (
                            <Badge
                              variant={isInactive ? 'destructive' : 'default'}
                              className={!isInactive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                            >
                              {isInactive ? 'Inaktiv' : 'Aktiv'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Ej tilldelad</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {service.totalLicenses === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Inga licenser tillagda — använd + knappen ovan för att lägga till
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Användare</CardTitle>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
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
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Licensnivå</TableHead>
                    <TableHead>Senaste inloggning</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceUsers.map(u => {
                    const isInactive = !u.lastLogin || new Date(u.lastLogin) < cutoff;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{u.licenseTier}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleDateString('sv-SE')
                            : 'Aldrig'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isInactive ? 'destructive' : 'default'}
                            className={!isInactive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                          >
                            {isInactive ? 'Inaktiv' : 'Aktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
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
                              className="h-7 w-7 p-0 text-red-600"
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
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Inga användare tillagda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Activity summary */}
          {serviceUsers.length > 0 && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="flex gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Aktiva användare</p>
                    <p className="text-2xl font-bold text-emerald-600">{activeUsers.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inaktiva (60+ dagar)</p>
                    <p className="text-2xl font-bold text-red-500">{inactiveUsers.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Adoptionsgrad</p>
                    <p className="text-2xl font-bold">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kostnadshistorik (SEK)</CardTitle>
            </CardHeader>
            <CardContent>
              {costHistoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Kostnad']} />
                    <Line type="monotone" dataKey="kostnad" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Ingen kostnadshistorik</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Kostnadslogg</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Belopp</TableHead>
                    <TableHead>Beskrivning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {service.costHistory.slice().reverse().slice(0, 12).map(h => (
                    <TableRow key={h.id}>
                      <TableCell>{new Date(h.date).toLocaleDateString('sv-SE')}</TableCell>
                      <TableCell>{formatCurrency(h.amount, h.currency)}</TableCell>
                      <TableCell>{h.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Anteckningar & dokument</CardTitle>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
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
                <p className="text-sm text-muted-foreground text-center py-8">Inga anteckningar</p>
              ) : (
                <div className="space-y-3">
                  {service.notes.map(n => (
                    <div key={n.id} className="flex items-start justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="text-sm">{n.text}</p>
                        {n.url && (
                          <a
                            href={n.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 flex items-center gap-1 mt-1"
                          >
                            <LinkIcon className="w-3 h-3" /> {n.url}
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{n.createdAt}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 shrink-0"
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
            <DialogTitle>{editingUser ? 'Redigera användare' : 'Lägg till användare'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Namn *</Label>
              <Input
                value={newUser.name}
                onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
                placeholder="t.ex. Anna Lindberg"
              />
            </div>
            <div className="space-y-2">
              <Label>E-post</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                placeholder="anna@foretaget.se"
              />
            </div>
            <div className="space-y-2">
              <Label>Licensnivå</Label>
              <Input
                value={newUser.licenseTier}
                onChange={e => setNewUser(u => ({ ...u, licenseTier: e.target.value }))}
                placeholder={service.plan}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserFormOpen(false)}>Avbryt</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddUser}>
              {editingUser ? 'Spara' : 'Lägg till'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note form dialog */}
      <Dialog open={noteFormOpen} onOpenChange={setNoteFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny anteckning</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Text *</Label>
              <Textarea
                value={newNote.text}
                onChange={e => setNewNote(n => ({ ...n, text: e.target.value }))}
                placeholder="Skriv en anteckning..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Länk (valfritt)</Label>
              <Input
                value={newNote.url}
                onChange={e => setNewNote(n => ({ ...n, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteFormOpen(false)}>Avbryt</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddNote}>
              Lägg till
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
