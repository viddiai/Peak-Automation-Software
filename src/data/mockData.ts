import { v4 as uuid } from 'uuid';
import type { SaaSService, ServiceUser, AppSettings } from '@/types';

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};
const monthsFromNow = (n: number) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split('T')[0];
};

function generateCostHistory(monthlyCost: number, currency: SaaSService['currency'], months = 12): SaaSService['costHistory'] {
  const history: SaaSService['costHistory'] = [];
  for (let i = months; i >= 1; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const variance = 0.95 + Math.random() * 0.1;
    history.push({
      id: uuid(),
      date: d.toISOString().split('T')[0],
      amount: Math.round(monthlyCost * variance),
      currency,
      description: 'Månadsbetalning',
    });
  }
  return history;
}

// Service IDs (stable)
const slackId = uuid();
const ms365Id = uuid();
const zoomId = uuid();
const notionId = uuid();
const githubId = uuid();
const salesforceId = uuid();
const figmaId = uuid();
const hubspotId = uuid();
const googleWsId = uuid();
const jiraId = uuid();

export const mockServices: SaaSService[] = [
  {
    id: slackId,
    name: 'Slack',
    vendor: 'Salesforce',
    plan: 'Pro',
    totalLicenses: 20,
    cost: 1490,
    currency: 'SEK',
    billingCycle: 'monthly',
    renewalDate: monthsFromNow(2),
    responsible: 'Anna Lindberg',
    category: 'Kommunikation',
    status: 'active',
    tags: ['samarbete', 'chatt'],
    notes: [{ id: uuid(), text: 'Uppgraderade från Free i januari 2024', createdAt: '2024-01-15' }],
    costHistory: generateCostHistory(1490, 'SEK'),
    logoColor: '#4A154B',
    createdAt: '2023-06-01',
  },
  {
    id: ms365Id,
    name: 'Microsoft 365',
    vendor: 'Microsoft',
    plan: 'Business Standard',
    totalLicenses: 17,
    cost: 1190,
    currency: 'SEK',
    billingCycle: 'monthly',
    renewalDate: monthsFromNow(5),
    responsible: 'Erik Johansson',
    category: 'Produktivitet',
    status: 'active',
    tags: ['e-post', 'office', 'teams'],
    notes: [],
    costHistory: generateCostHistory(1190, 'SEK'),
    logoColor: '#D83B01',
    createdAt: '2022-01-01',
  },
  {
    id: zoomId,
    name: 'Zoom',
    vendor: 'Zoom Video Communications',
    plan: 'Business',
    totalLicenses: 10,
    cost: 189,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: monthsFromNow(1),
    responsible: 'Anna Lindberg',
    category: 'Kommunikation',
    status: 'active',
    tags: ['videomöte'],
    notes: [{ id: uuid(), text: 'Överväg att konsolidera med Teams', createdAt: '2024-08-10' }],
    costHistory: generateCostHistory(189, 'USD'),
    logoColor: '#2D8CFF',
    createdAt: '2023-03-01',
  },
  {
    id: notionId,
    name: 'Notion',
    vendor: 'Notion Labs',
    plan: 'Team',
    totalLicenses: 15,
    cost: 80,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: monthsFromNow(3),
    responsible: 'Maria Svensson',
    category: 'Produktivitet',
    status: 'active',
    tags: ['dokumentation', 'wiki'],
    notes: [],
    costHistory: generateCostHistory(80, 'USD'),
    logoColor: '#000000',
    createdAt: '2023-09-01',
  },
  {
    id: githubId,
    name: 'GitHub',
    vendor: 'Microsoft',
    plan: 'Team',
    totalLicenses: 8,
    cost: 37,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: monthsFromNow(4),
    responsible: 'Erik Johansson',
    category: 'Utveckling',
    status: 'active',
    tags: ['kod', 'versionskontroll'],
    notes: [],
    costHistory: generateCostHistory(37, 'USD'),
    logoColor: '#24292E',
    createdAt: '2022-06-01',
  },
  {
    id: salesforceId,
    name: 'Salesforce',
    vendor: 'Salesforce',
    plan: 'Professional',
    totalLicenses: 5,
    cost: 750,
    currency: 'EUR',
    billingCycle: 'monthly',
    renewalDate: monthsFromNow(7),
    responsible: 'Ola Stål',
    category: 'Försäljning',
    status: 'active',
    tags: ['CRM', 'försäljning'],
    notes: [{ id: uuid(), text: 'Kontraktet förnyas i oktober - förhandla rabatt', createdAt: '2024-03-01' }],
    costHistory: generateCostHistory(750, 'EUR'),
    logoColor: '#00A1E0',
    createdAt: '2023-01-01',
  },
  {
    id: figmaId,
    name: 'Figma',
    vendor: 'Figma',
    plan: 'Professional',
    totalLicenses: 5,
    cost: 625,
    currency: 'SEK',
    billingCycle: 'monthly',
    renewalDate: monthsFromNow(6),
    responsible: 'Maria Svensson',
    category: 'Design',
    status: 'active',
    tags: ['design', 'prototyp'],
    notes: [],
    costHistory: generateCostHistory(625, 'SEK'),
    logoColor: '#F24E1E',
    createdAt: '2023-05-01',
  },
  {
    id: hubspotId,
    name: 'HubSpot',
    vendor: 'HubSpot',
    plan: 'Marketing Hub Starter',
    totalLicenses: 3,
    cost: 11500,
    currency: 'SEK',
    billingCycle: 'monthly',
    renewalDate: monthsFromNow(2),
    responsible: 'Ola Stål',
    category: 'Marknadsföring',
    status: 'active',
    tags: ['marknadsföring', 'automation'],
    notes: [{ id: uuid(), text: 'Kostnad inkluderar Marketing Hub + Sales Hub', createdAt: '2024-01-05' }],
    costHistory: generateCostHistory(11500, 'SEK'),
    logoColor: '#FF7A59',
    createdAt: '2022-09-01',
  },
  {
    id: googleWsId,
    name: 'Google Workspace',
    vendor: 'Google',
    plan: 'Business Standard',
    totalLicenses: 17,
    cost: 138,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: monthsFromNow(1),
    responsible: 'Erik Johansson',
    category: 'Produktivitet',
    status: 'active',
    tags: ['e-post', 'samarbete', 'moln'],
    notes: [{ id: uuid(), text: 'Används parallellt med M365 - överväg konsolidering', createdAt: '2024-06-15' }],
    costHistory: generateCostHistory(138, 'USD'),
    logoColor: '#4285F4',
    createdAt: '2022-03-01',
  },
  {
    id: jiraId,
    name: 'Jira Software',
    vendor: 'Atlassian',
    plan: 'Standard',
    totalLicenses: 10,
    cost: 77,
    currency: 'USD',
    billingCycle: 'monthly',
    renewalDate: monthsFromNow(8),
    responsible: 'Erik Johansson',
    category: 'Utveckling',
    status: 'inactive',
    tags: ['projektledning', 'utveckling'],
    notes: [{ id: uuid(), text: 'Migrerat till GitHub Issues - kan avslutas', createdAt: '2024-09-01' }],
    costHistory: generateCostHistory(77, 'USD'),
    logoColor: '#0052CC',
    createdAt: '2022-01-01',
  },
];

export const mockUsers: ServiceUser[] = [
  // Slack users
  { id: uuid(), name: 'Anna Lindberg', email: 'anna@foretaget.se', lastLogin: daysAgo(1), licenseTier: 'Pro', serviceId: slackId },
  { id: uuid(), name: 'Erik Johansson', email: 'erik@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Pro', serviceId: slackId },
  { id: uuid(), name: 'Maria Svensson', email: 'maria@foretaget.se', lastLogin: daysAgo(3), licenseTier: 'Pro', serviceId: slackId },
  { id: uuid(), name: 'Ola Stål', email: 'ola@foretaget.se', lastLogin: daysAgo(2), licenseTier: 'Pro', serviceId: slackId },
  { id: uuid(), name: 'Felix Sjöstedt', email: 'felix@foretaget.se', lastLogin: daysAgo(5), licenseTier: 'Pro', serviceId: slackId },
  { id: uuid(), name: 'Sara Ek', email: 'sara@foretaget.se', lastLogin: daysAgo(90), licenseTier: 'Pro', serviceId: slackId },
  { id: uuid(), name: 'Johan Berg', email: 'johan@foretaget.se', lastLogin: daysAgo(120), licenseTier: 'Pro', serviceId: slackId },
  { id: uuid(), name: 'Lisa Norén', email: 'lisa@foretaget.se', lastLogin: daysAgo(1), licenseTier: 'Pro', serviceId: slackId },
  { id: uuid(), name: 'Karl Åström', email: 'karl@foretaget.se', lastLogin: null, licenseTier: 'Pro', serviceId: slackId },
  { id: uuid(), name: 'Emma Dahl', email: 'emma@foretaget.se', lastLogin: daysAgo(10), licenseTier: 'Pro', serviceId: slackId },
  // MS 365 users
  { id: uuid(), name: 'Anna Lindberg', email: 'anna@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Standard', serviceId: ms365Id },
  { id: uuid(), name: 'Erik Johansson', email: 'erik@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Standard', serviceId: ms365Id },
  { id: uuid(), name: 'Maria Svensson', email: 'maria@foretaget.se', lastLogin: daysAgo(1), licenseTier: 'Standard', serviceId: ms365Id },
  { id: uuid(), name: 'Ola Stål', email: 'ola@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Standard', serviceId: ms365Id },
  { id: uuid(), name: 'Felix Sjöstedt', email: 'felix@foretaget.se', lastLogin: daysAgo(2), licenseTier: 'Standard', serviceId: ms365Id },
  { id: uuid(), name: 'Sara Ek', email: 'sara@foretaget.se', lastLogin: daysAgo(75), licenseTier: 'Standard', serviceId: ms365Id },
  { id: uuid(), name: 'Johan Berg', email: 'johan@foretaget.se', lastLogin: daysAgo(80), licenseTier: 'Standard', serviceId: ms365Id },
  { id: uuid(), name: 'Lisa Norén', email: 'lisa@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Standard', serviceId: ms365Id },
  // Zoom users
  { id: uuid(), name: 'Anna Lindberg', email: 'anna@foretaget.se', lastLogin: daysAgo(5), licenseTier: 'Licensed', serviceId: zoomId },
  { id: uuid(), name: 'Erik Johansson', email: 'erik@foretaget.se', lastLogin: daysAgo(10), licenseTier: 'Licensed', serviceId: zoomId },
  { id: uuid(), name: 'Ola Stål', email: 'ola@foretaget.se', lastLogin: daysAgo(3), licenseTier: 'Licensed', serviceId: zoomId },
  { id: uuid(), name: 'Sara Ek', email: 'sara@foretaget.se', lastLogin: daysAgo(100), licenseTier: 'Basic', serviceId: zoomId },
  { id: uuid(), name: 'Karl Åström', email: 'karl@foretaget.se', lastLogin: daysAgo(200), licenseTier: 'Basic', serviceId: zoomId },
  // Notion users
  { id: uuid(), name: 'Anna Lindberg', email: 'anna@foretaget.se', lastLogin: daysAgo(2), licenseTier: 'Member', serviceId: notionId },
  { id: uuid(), name: 'Maria Svensson', email: 'maria@foretaget.se', lastLogin: daysAgo(1), licenseTier: 'Member', serviceId: notionId },
  { id: uuid(), name: 'Felix Sjöstedt', email: 'felix@foretaget.se', lastLogin: daysAgo(4), licenseTier: 'Member', serviceId: notionId },
  { id: uuid(), name: 'Lisa Norén', email: 'lisa@foretaget.se', lastLogin: daysAgo(60), licenseTier: 'Member', serviceId: notionId },
  { id: uuid(), name: 'Emma Dahl', email: 'emma@foretaget.se', lastLogin: daysAgo(90), licenseTier: 'Guest', serviceId: notionId },
  // GitHub users
  { id: uuid(), name: 'Erik Johansson', email: 'erik@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Member', serviceId: githubId },
  { id: uuid(), name: 'Felix Sjöstedt', email: 'felix@foretaget.se', lastLogin: daysAgo(1), licenseTier: 'Member', serviceId: githubId },
  { id: uuid(), name: 'Karl Åström', email: 'karl@foretaget.se', lastLogin: daysAgo(3), licenseTier: 'Member', serviceId: githubId },
  // Salesforce users
  { id: uuid(), name: 'Ola Stål', email: 'ola@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Professional', serviceId: salesforceId },
  { id: uuid(), name: 'Anna Lindberg', email: 'anna@foretaget.se', lastLogin: daysAgo(5), licenseTier: 'Professional', serviceId: salesforceId },
  { id: uuid(), name: 'Johan Berg', email: 'johan@foretaget.se', lastLogin: daysAgo(150), licenseTier: 'Professional', serviceId: salesforceId },
  // Figma users
  { id: uuid(), name: 'Maria Svensson', email: 'maria@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Editor', serviceId: figmaId },
  { id: uuid(), name: 'Felix Sjöstedt', email: 'felix@foretaget.se', lastLogin: daysAgo(2), licenseTier: 'Editor', serviceId: figmaId },
  { id: uuid(), name: 'Lisa Norén', email: 'lisa@foretaget.se', lastLogin: daysAgo(100), licenseTier: 'Viewer', serviceId: figmaId },
  // HubSpot users
  { id: uuid(), name: 'Ola Stål', email: 'ola@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Marketing', serviceId: hubspotId },
  { id: uuid(), name: 'Anna Lindberg', email: 'anna@foretaget.se', lastLogin: daysAgo(3), licenseTier: 'Sales', serviceId: hubspotId },
  // Google Workspace users
  { id: uuid(), name: 'Anna Lindberg', email: 'anna@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Standard', serviceId: googleWsId },
  { id: uuid(), name: 'Erik Johansson', email: 'erik@foretaget.se', lastLogin: daysAgo(1), licenseTier: 'Standard', serviceId: googleWsId },
  { id: uuid(), name: 'Maria Svensson', email: 'maria@foretaget.se', lastLogin: daysAgo(0), licenseTier: 'Standard', serviceId: googleWsId },
  { id: uuid(), name: 'Ola Stål', email: 'ola@foretaget.se', lastLogin: daysAgo(2), licenseTier: 'Standard', serviceId: googleWsId },
  { id: uuid(), name: 'Felix Sjöstedt', email: 'felix@foretaget.se', lastLogin: daysAgo(5), licenseTier: 'Standard', serviceId: googleWsId },
  { id: uuid(), name: 'Sara Ek', email: 'sara@foretaget.se', lastLogin: daysAgo(65), licenseTier: 'Standard', serviceId: googleWsId },
  { id: uuid(), name: 'Johan Berg', email: 'johan@foretaget.se', lastLogin: daysAgo(70), licenseTier: 'Standard', serviceId: googleWsId },
  { id: uuid(), name: 'Lisa Norén', email: 'lisa@foretaget.se', lastLogin: daysAgo(1), licenseTier: 'Standard', serviceId: googleWsId },
  { id: uuid(), name: 'Karl Åström', email: 'karl@foretaget.se', lastLogin: daysAgo(200), licenseTier: 'Standard', serviceId: googleWsId },
  { id: uuid(), name: 'Emma Dahl', email: 'emma@foretaget.se', lastLogin: daysAgo(10), licenseTier: 'Standard', serviceId: googleWsId },
  // Jira users
  { id: uuid(), name: 'Erik Johansson', email: 'erik@foretaget.se', lastLogin: daysAgo(90), licenseTier: 'Standard', serviceId: jiraId },
  { id: uuid(), name: 'Felix Sjöstedt', email: 'felix@foretaget.se', lastLogin: daysAgo(95), licenseTier: 'Standard', serviceId: jiraId },
  { id: uuid(), name: 'Karl Åström', email: 'karl@foretaget.se', lastLogin: daysAgo(110), licenseTier: 'Standard', serviceId: jiraId },
];

export const defaultSettings: AppSettings = {
  companyName: 'PeakAutomation AB',
  defaultCurrency: 'SEK',
  exchangeRates: {
    SEK: 1,
    EUR: 11.5,
    USD: 10.5,
  },
};
