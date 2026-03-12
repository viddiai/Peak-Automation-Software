import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { getMonthlyCostInSEK, formatCurrency } from '@/lib/currency';
import { ServiceLogo } from '@/components/shared/ServiceLogo';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, MoreVertical, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import type { SaaSService, Category } from '@/types';

type SortKey = 'name' | 'cost' | 'renewalDate';
type SortDir = 'asc' | 'desc';

export function Services() {
  const navigate = useNavigate();
  const { services, users, settings, addService, editService, deleteService } = useAppData();
  const rates = settings.exchangeRates;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('cost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<SaaSService | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const responsibles = useMemo(
    () => [...new Set(services.map(s => s.responsible).filter(Boolean))].sort(),
    [services]
  );

  const filtered = useMemo(() => {
    let list = services;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        s => s.name.toLowerCase().includes(q) || s.vendor.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      list = list.filter(s => s.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter(s => s.status === statusFilter);
    }
    if (responsibleFilter !== 'all') {
      list = list.filter(s => s.responsible === responsibleFilter);
    }

    list = [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortKey === 'cost')
        return (getMonthlyCostInSEK(a, rates) - getMonthlyCostInSEK(b, rates)) * dir;
      if (sortKey === 'renewalDate') {
        const da = a.renewalDate ? new Date(a.renewalDate).getTime() : Infinity;
        const db = b.renewalDate ? new Date(b.renewalDate).getTime() : Infinity;
        return (da - db) * dir;
      }
      return 0;
    });

    return list;
  }, [services, search, categoryFilter, statusFilter, responsibleFilter, sortKey, sortDir, rates]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const handleSave = (service: SaaSService) => {
    if (editingService) {
      editService(service.id, service);
    } else {
      addService(service);
    }
    setEditingService(null);
  };

  const handleEdit = (service: SaaSService) => {
    setEditingService(service);
    setFormOpen(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tjänster</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {services.length} tjänster totalt
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            setEditingService(null);
            setFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till tjänst
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Sök på namn eller leverantör..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v ?? 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla kategorier</SelectItem>
                {(['Kommunikation', 'Säkerhet', 'Produktivitet', 'HR', 'Finans', 'Utveckling', 'Marknadsföring', 'Design', 'Försäljning', 'Övrigt'] as Category[]).map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
            <Select value={responsibleFilter} onValueChange={v => setResponsibleFilter(v ?? 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Ansvarig" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla ansvariga</SelectItem>
                {responsibles.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">
                    <button className="flex items-center gap-1" onClick={() => toggleSort('name')}>
                      Tjänst <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>
                    <button className="flex items-center gap-1" onClick={() => toggleSort('cost')}>
                      Kostnad/mån (SEK) <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>Licenser</TableHead>
                  <TableHead>
                    <button className="flex items-center gap-1" onClick={() => toggleSort('renewalDate')}>
                      Förnyelse <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>Ansvarig</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => {
                  const serviceUsers = users.filter(u => u.serviceId === s.id);
                  const monthlyCost = getMonthlyCostInSEK(s, rates);
                  return (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/tjanster/${s.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ServiceLogo name={s.name} color={s.logoColor} size="sm" />
                          <div>
                            <p className="font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.vendor} · {s.plan}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{s.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(monthlyCost)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {serviceUsers.length}/{s.totalLicenses}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.renewalDate
                          ? new Date(s.renewalDate).toLocaleDateString('sv-SE')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm">{s.responsible}</TableCell>
                      <TableCell>
                        <Badge
                          variant={s.status === 'active' ? 'default' : 'secondary'}
                          className={s.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                        >
                          {s.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted"
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleEdit(s); }}>
                              <Pencil className="w-4 h-4 mr-2" /> Redigera
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={e => { e.stopPropagation(); setDeleteId(s.id); }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Ta bort
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Inga tjänster hittades
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editingService}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort tjänst?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort denna tjänst? Alla tillhörande användare tas också bort. Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteId) deleteService(deleteId);
                setDeleteId(null);
              }}
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
