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
  '#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f87171',
  '#fb923c', '#2dd4bf', '#818cf8', '#e879f9', '#22d3ee',
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

  const inputClass = "bg-surface-2 border-border/50 focus:border-aurora-cyan/40";
  const labelClass = "text-[11px] uppercase tracking-wider text-muted-foreground font-medium";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{service ? 'Redigera tjänst' : 'Lägg till tjänst'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Namn *</Label>
              <Input
                required
                className={inputClass}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="t.ex. Slack"
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Leverantör</Label>
              <Input
                className={inputClass}
                value={form.vendor}
                onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                placeholder="t.ex. Salesforce"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Plan</Label>
              <Input
                className={inputClass}
                value={form.plan}
                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                placeholder="t.ex. Pro"
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Antal licenser</Label>
              <Input
                type="number"
                min={0}
                className={inputClass}
                value={form.totalLicenses}
                onChange={e => setForm(f => ({ ...f, totalLicenses: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Kostnad *</Label>
              <Input
                type="number"
                min={0}
                required
                className={inputClass}
                value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Valuta</Label>
              <Select value={form.currency} onValueChange={v => { if (v) setForm(f => ({ ...f, currency: v as Currency })); }}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEK">SEK</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Period</Label>
              <Select value={form.billingCycle} onValueChange={v => { if (v) setForm(f => ({ ...f, billingCycle: v as BillingCycle })); }}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
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
              <Label className={labelClass}>Förnyelsedatum</Label>
              <Input
                type="date"
                className={inputClass}
                value={form.renewalDate}
                onChange={e => setForm(f => ({ ...f, renewalDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Ansvarig</Label>
              <Input
                className={inputClass}
                value={form.responsible}
                onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
                placeholder="t.ex. Anna Lindberg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Kategori</Label>
              <Select value={form.category} onValueChange={v => { if (v) setForm(f => ({ ...f, category: v as Category })); }}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Status</Label>
              <Select value={form.status} onValueChange={v => { if (v) setForm(f => ({ ...f, status: v as ServiceStatus })); }}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>URL</Label>
            <Input
              type="url"
              className={inputClass}
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="t.ex. https://slack.com"
            />
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Taggar (kommaseparerade)</Label>
            <Input
              className={inputClass}
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="t.ex. samarbete, chatt, intern"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="border-border/50" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" className="bg-aurora-cyan hover:bg-aurora-cyan/90 text-background font-semibold">
              {service ? 'Spara ändringar' : 'Lägg till'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
