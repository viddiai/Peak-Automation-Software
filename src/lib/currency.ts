import type { Currency, AppSettings, SaaSService, BillingCycle } from '@/types';

export function convertToSEK(amount: number, currency: Currency, rates: AppSettings['exchangeRates']): number {
  return Math.round(amount * rates[currency]);
}

export function formatCurrency(amount: number, currency: Currency = 'SEK'): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getMonthlyCostInSEK(service: SaaSService, rates: AppSettings['exchangeRates']): number {
  const costInSEK = convertToSEK(service.cost, service.currency, rates);
  return toMonthlyCost(costInSEK, service.billingCycle);
}

export function toMonthlyCost(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'monthly':
      return amount;
    case 'quarterly':
      return Math.round(amount / 3);
    case 'yearly':
      return Math.round(amount / 12);
    case 'consumption':
      return amount; // treat as monthly estimate
  }
}

export function toYearlyCost(monthlyCost: number): number {
  return monthlyCost * 12;
}
