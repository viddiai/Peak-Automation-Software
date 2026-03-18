import type { SaaSService, AppSettings, ServiceUser } from '@/types';
import { getMonthlyCostInSEK } from './currency';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const BILLING_LABELS: Record<string, string> = {
  monthly: 'Månadsvis',
  quarterly: 'Kvartalsvis',
  yearly: 'Årsvis',
  consumption: 'Förbrukning',
};

export function exportServicesToCSV(
  services: SaaSService[],
  users: ServiceUser[],
  settings: AppSettings,
) {
  const rates = settings.exchangeRates;

  const headers = [
    'Namn',
    'Leverantör',
    'Plan',
    'Kategori',
    'Status',
    'Kostnad',
    'Valuta',
    'Betalningsperiod',
    'Månadskostnad (SEK)',
    'Licenser totalt',
    'Licenser använda',
    'Förnyelsedatum',
    'Ansvarig',
    'URL',
    'Taggar',
  ];

  const rows = services.map(s => {
    const usedLicenses = users.filter(u => u.serviceId === s.id).length;
    return [
      s.name,
      s.vendor,
      s.plan,
      s.category,
      s.status === 'active' ? 'Aktiv' : 'Inaktiv',
      String(s.cost),
      s.currency,
      BILLING_LABELS[s.billingCycle] || s.billingCycle,
      String(Math.round(getMonthlyCostInSEK(s, rates))),
      String(s.totalLicenses),
      String(usedLicenses),
      s.renewalDate || '',
      s.responsible,
      s.url || '',
      s.tags.join('; '),
    ].map(escapeCSV);
  });

  const csv = [headers.map(escapeCSV).join(','), ...rows.map(r => r.join(','))].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `saas-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
