import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SaaSService, Category, Currency, BillingCycle, ServiceStatus } from '@/types';

const CATEGORIES: Category[] = [
  'Kommunikation', 'Säkerhet', 'Produktivitet', 'HR', 'Finans',
  'Utveckling', 'Marknadsföring', 'Design', 'Försäljning', 'Övrigt',
];

const RANDOM_COLORS = [
  '#059669', '#0891b2', '#7c3aed', '#db2777', '#ea580c',
  '#ca8a04', '#2563eb', '#dc2626', '#4f46e5', '#0d9488',
];

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: SaaSService | null;
  onSave: (service: SaaSService) => void;
}

export function ServiceFormDialog({ open, onOpenChange, service, onSave }: ServiceFormDialogProps) {
  const [form, setForm] = useState({
    name: '',
    vendor: '',
    plan: '',
    totalLicenses: 1,
    cost: 0,
    currency: 'SEK' as Currency,
    billingCycle: 'monthly' as BillingCycle,
    renewalDate: '',
    responsible: '',
    category: 'Produktivitet' as Category,
    status: 'active' as ServiceStatus,
    url: '',
    tags: '',
  });

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        vendor: service.vendor,
        plan: service.plan,
        totalLicenses: service.totalLicenses,
        cost: service.cost,
        currency: service.currency,
        billingCycle: service.billingCycle,
        renewalDate: service.renewalDate || '',
        responsible: service.responsible,
        category: service.category,
        status: service.status,
        url: service.url || '',
        tags: service.tags.join(', '),
      });
    } else {
      setForm({
        name: '',
        vendor: '',
        plan: '',
        totalLicenses: 1,
        cost: 0,
        currency: 'SEK',
        billingCycle: 'monthly',
        renewalDate: '',
        responsible: '',
        category: 'Produktivitet',
        status: 'active',
        url: '',
        tags: '',
      });
    }
  }, [service, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newService: SaaSService = {
      id: service?.id || uuid(),
      name: form.name,
      vendor: form.vendor,
      plan: form.plan,
      totalLicenses: form.totalLicenses,
      cost: form.cost,
      currency: form.currency,
      billingCycle: form.billingCycle,
      renewalDate: form.renewalDate || null,
      responsible: form.responsible,
      category: form.category,
      status: form.status,
      url: form.url || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: service?.notes || [],
      costHistory: service?.costHistory || [],
      logoColor: service?.logoColor || RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)],
      createdAt: service?.createdAt || new Date().toISOString().split('T')[0],
    };
    onSave(newService);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? 'Redigera tjänst' : 'Lägg till tjänst'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Namn *</Label>
              <Input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="t.ex. Slack"
              />
            </div>
            <div className="space-y-2">
              <Label>Leverantör</Label>
              <Input
                value={form.vendor}
                onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                placeholder="t.ex. Salesforce"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Input
                value={form.plan}
                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                placeholder="t.ex. Pro"
              />
            </div>
            <div className="space-y-2">
              <Label>Antal licenser</Label>
              <Input
                type="number"
                min={0}
                value={form.totalLicenses}
                onChange={e => setForm(f => ({ ...f, totalLicenses: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kostnad *</Label>
              <Input
                type="number"
                min={0}
                required
                value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valuta</Label>
              <Select value={form.currency} onValueChange={v => { if (v) setForm(f => ({ ...f, currency: v as Currency })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEK">SEK</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Betalningsperiod</Label>
              <Select value={form.billingCycle} onValueChange={v => { if (v) setForm(f => ({ ...f, billingCycle: v as BillingCycle })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Månadsvis</SelectItem>
                  <SelectItem value="quarterly">Kvartalsvis</SelectItem>
                  <SelectItem value="yearly">Årsvis</SelectItem>
                  <SelectItem value="consumption">Förbrukning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Förnyelsedatum</Label>
              <Input
                type="date"
                value={form.renewalDate}
                onChange={e => setForm(f => ({ ...f, renewalDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ansvarig</Label>
              <Input
                value={form.responsible}
                onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
                placeholder="t.ex. Anna Lindberg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={v => { if (v) setForm(f => ({ ...f, category: v as Category })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => { if (v) setForm(f => ({ ...f, status: v as ServiceStatus })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              type="url"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="t.ex. https://slack.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Taggar (kommaseparerade)</Label>
            <Input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="t.ex. samarbete, chatt, intern"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {service ? 'Spara ändringar' : 'Lägg till'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
