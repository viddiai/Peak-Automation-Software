export type Currency = 'SEK' | 'EUR' | 'USD';
export type BillingCycle = 'monthly' | 'yearly' | 'quarterly' | 'consumption';
export type ServiceStatus = 'active' | 'inactive';
export type Category =
  | 'Kommunikation'
  | 'Säkerhet'
  | 'Produktivitet'
  | 'HR'
  | 'Finans'
  | 'Utveckling'
  | 'Marknadsföring'
  | 'Design'
  | 'Försäljning'
  | 'Övrigt';

export interface ServiceUser {
  id: string;
  name: string;
  email: string;
  lastLogin: string | null; // ISO date
  licenseTier: string;
  serviceId: string;
}

export interface ServiceNote {
  id: string;
  text: string;
  url?: string;
  createdAt: string;
}

export interface CostHistoryEntry {
  id: string;
  date: string;
  amount: number;
  currency: Currency;
  description: string;
}

export interface SaaSService {
  id: string;
  name: string;
  vendor: string;
  plan: string;
  totalLicenses: number;
  cost: number;
  currency: Currency;
  billingCycle: BillingCycle;
  renewalDate: string | null; // ISO date
  responsible: string;
  category: Category;
  status: ServiceStatus;
  tags: string[];
  notes: ServiceNote[];
  costHistory: CostHistoryEntry[];
  url: string | null; // service URL
  logoColor: string; // hex color for placeholder logo
  createdAt: string;
}

export interface AppSettings {
  companyName: string;
  defaultCurrency: Currency;
  exchangeRates: {
    SEK: number;
    EUR: number;
    USD: number;
  };
}

export interface AppData {
  services: SaaSService[];
  users: ServiceUser[];
  settings: AppSettings;
}

// CSV Import types
export interface CSVRow {
  [key: string]: string;
}

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
}

export interface ImportPreviewRow {
  date: string;
  description: string;
  amount: number;
  matchedServiceId: string | null;
  suggestedServiceName: string;
  action: 'match' | 'create' | 'skip';
}
