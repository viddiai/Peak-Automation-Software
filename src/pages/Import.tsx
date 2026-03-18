import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { v4 as uuid } from 'uuid';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { Upload, FileSpreadsheet, Check, X, ArrowRight, Plus } from 'lucide-react';
import type { CSVRow, ColumnMapping, ImportPreviewRow, SaaSService } from '@/types';

type ImportStep = 'upload' | 'map' | 'preview' | 'done';

const SERVICE_KEYWORDS: Record<string, string> = {
  slack: 'Slack',
  microsoft: 'Microsoft 365',
  zoom: 'Zoom',
  notion: 'Notion',
  github: 'GitHub',
  salesforce: 'Salesforce',
  figma: 'Figma',
  hubspot: 'HubSpot',
  google: 'Google Workspace',
  atlassian: 'Jira Software',
  jira: 'Jira Software',
  dropbox: 'Dropbox',
  adobe: 'Adobe Creative Cloud',
  canva: 'Canva',
  mailchimp: 'Mailchimp',
  stripe: 'Stripe',
  aws: 'AWS',
  azure: 'Microsoft Azure',
  heroku: 'Heroku',
  vercel: 'Vercel',
  netlify: 'Netlify',
  intercom: 'Intercom',
  zendesk: 'Zendesk',
  asana: 'Asana',
  trello: 'Trello',
  monday: 'Monday.com',
  miro: 'Miro',
  linkedin: 'LinkedIn',
  sendgrid: 'SendGrid',
  twilio: 'Twilio',
};

function detectServiceName(description: string): string {
  const lower = description.toLowerCase();
  for (const [keyword, name] of Object.entries(SERVICE_KEYWORDS)) {
    if (lower.includes(keyword)) return name;
  }
  return description.slice(0, 40);
}

export function Import() {
  const { services, addService } = useAppData();

  const [step, setStep] = useState<ImportStep>('upload');
  const [rawData, setRawData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', description: '', amount: '' });
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.data.length > 0) {
          setRawData(results.data);
          setHeaders(Object.keys(results.data[0]));
          const h = Object.keys(results.data[0]);
          const dateCol = h.find(c => /datum|date|bokf/i.test(c)) || '';
          const descCol = h.find(c => /besk|desc|text|info|mott/i.test(c)) || '';
          const amountCol = h.find(c => /belopp|amount|summa|kost/i.test(c)) || '';
          setMapping({ date: dateCol, description: descCol, amount: amountCol });
          setStep('map');
        }
      },
    });
  }, []);

  const generatePreview = useCallback(() => {
    const rows: ImportPreviewRow[] = rawData
      .map(row => {
        const desc = row[mapping.description] || '';
        const amountStr = (row[mapping.amount] || '0').replace(/[^\d.,-]/g, '').replace(',', '.');
        const amount = Math.abs(parseFloat(amountStr) || 0);
        const date = row[mapping.date] || '';
        const suggestedName = detectServiceName(desc);

        const matched = services.find(s =>
          s.name.toLowerCase() === suggestedName.toLowerCase() ||
          desc.toLowerCase().includes(s.name.toLowerCase())
        );

        return {
          date,
          description: desc,
          amount,
          matchedServiceId: matched?.id || null,
          suggestedServiceName: matched?.name || suggestedName,
          action: matched ? 'match' as const : amount > 0 ? 'create' as const : 'skip' as const,
        };
      })
      .filter(r => r.amount > 0);

    setPreviewRows(rows);
    setStep('preview');
  }, [rawData, mapping, services]);

  const handleImport = useCallback(() => {
    let count = 0;
    const created = new Set<string>();

    for (const row of previewRows) {
      if (row.action === 'skip') continue;
      if (row.action === 'create' && !created.has(row.suggestedServiceName)) {
        const newService: SaaSService = {
          id: uuid(),
          name: row.suggestedServiceName,
          vendor: '',
          plan: '',
          totalLicenses: 1,
          cost: row.amount,
          currency: 'SEK',
          billingCycle: 'monthly',
          renewalDate: null,
          responsible: '',
          category: 'Övrigt',
          status: 'active',
          tags: ['importerad'],
          notes: [{ id: uuid(), text: `Importerad från CSV: ${row.description}`, createdAt: new Date().toISOString().split('T')[0] }],
          costHistory: [{
            id: uuid(),
            date: row.date || new Date().toISOString().split('T')[0],
            amount: row.amount,
            currency: 'SEK',
            description: 'Import från CSV',
          }],
          url: null,
          logoColor: `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}`,
          createdAt: new Date().toISOString().split('T')[0],
        };
        addService(newService);
        created.add(row.suggestedServiceName);
        count++;
      }
    }

    setImportedCount(count);
    setStep('done');
  }, [previewRows, addService]);

  const toggleAction = (index: number) => {
    setPreviewRows(prev => prev.map((r, i) => {
      if (i !== index) return r;
      const actions: ImportPreviewRow['action'][] = ['match', 'create', 'skip'];
      const currentIdx = actions.indexOf(r.action);
      return { ...r, action: actions[(currentIdx + 1) % actions.length] };
    }));
  };

  const resetImport = () => {
    setStep('upload');
    setRawData([]);
    setHeaders([]);
    setPreviewRows([]);
    setImportedCount(0);
  };

  const steps = ['Ladda upp', 'Mappa kolumner', 'Förhandsgranska', 'Klart'];
  const stepKeys = ['upload', 'map', 'preview', 'done'];
  const stepIdx = stepKeys.indexOf(step);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Importera"
        subtitle="Importera kontoutdrag eller bokföringsexport (CSV) för att identifiera prenumerationer"
      />

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm animate-in-2">
        {steps.map((label, i) => {
          const isActive = i === stepIdx;
          const isDone = i < stepIdx;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground/40" />}
              <Badge
                variant={isActive ? 'default' : isDone ? 'default' : 'secondary'}
                className={
                  isActive
                    ? 'bg-aurora-cyan text-background font-semibold'
                    : isDone
                    ? 'bg-aurora-teal/15 text-aurora-teal border-0'
                    : 'bg-white/[0.04] text-muted-foreground border-0'
                }
              >
                {isDone ? <Check className="w-3 h-3 mr-1" /> : null}
                {label}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card className="glass-card animate-in-3">
          <CardContent className="pt-6">
            <div className="border-2 border-dashed border-border/40 rounded-2xl p-12 text-center hover:border-aurora-cyan/30 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-aurora-cyan/10 flex items-center justify-center mx-auto mb-5">
                <FileSpreadsheet className="w-8 h-8 text-aurora-cyan" />
              </div>
              <p className="font-serif text-xl mb-2">Ladda upp CSV-fil</p>
              <p className="text-sm text-muted-foreground mb-6">
                Dra och släpp en CSV-fil eller klicka för att välja
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-aurora-cyan hover:bg-aurora-cyan/90 text-background px-5 py-2.5 text-sm font-semibold cursor-pointer shadow-lg glow-cyan transition-all">
                  <Upload className="w-4 h-4" /> Välj fil
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Map columns */}
      {step === 'map' && (
        <Card className="glass-card animate-in-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Mappa kolumner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Matchade {rawData.length} rader. Välj vilka kolumner som motsvarar datum, beskrivning och belopp.
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Datum</Label>
                <Select value={mapping.date} onValueChange={v => setMapping(m => ({ ...m, date: v ?? '' }))}>
                  <SelectTrigger className="bg-white/[0.04] border-border/50"><SelectValue placeholder="Välj kolumn" /></SelectTrigger>
                  <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Beskrivning *</Label>
                <Select value={mapping.description} onValueChange={v => setMapping(m => ({ ...m, description: v ?? '' }))}>
                  <SelectTrigger className="bg-white/[0.04] border-border/50"><SelectValue placeholder="Välj kolumn" /></SelectTrigger>
                  <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Belopp *</Label>
                <Select value={mapping.amount} onValueChange={v => setMapping(m => ({ ...m, amount: v ?? '' }))}>
                  <SelectTrigger className="bg-white/[0.04] border-border/50"><SelectValue placeholder="Välj kolumn" /></SelectTrigger>
                  <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {rawData.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Förhandsgranskning (5 första)</p>
                <div className="overflow-x-auto border border-border/30 rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30 hover:bg-transparent">
                        {headers.slice(0, 6).map(h => (
                          <TableHead key={h} className="text-[10px] uppercase tracking-wider">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawData.slice(0, 5).map((row, i) => (
                        <TableRow key={i} className="border-border/20">
                          {headers.slice(0, 6).map(h => (
                            <TableCell key={h} className="text-[11px] text-muted-foreground">{row[h]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="border-border/50" onClick={resetImport}>Börja om</Button>
              <Button
                className="bg-aurora-cyan hover:bg-aurora-cyan/90 text-background font-semibold"
                onClick={generatePreview}
                disabled={!mapping.description || !mapping.amount}
              >
                Fortsätt <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <Card className="glass-card animate-in-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Förhandsgranskning ({previewRows.filter(r => r.action !== 'skip').length} att importera)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wider">Datum</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Beskrivning</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Belopp</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Matchad/Ny tjänst</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">Åtgärd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, i) => (
                    <TableRow key={i} className={`border-border/20 ${row.action === 'skip' ? 'opacity-30' : ''}`}>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">{row.date}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate text-muted-foreground">{row.description}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{row.amount.toLocaleString('sv-SE')} SEK</TableCell>
                      <TableCell>
                        <span className="text-sm">{row.suggestedServiceName}</span>
                        {row.matchedServiceId && (
                          <Badge variant="secondary" className="ml-2 text-[10px] bg-aurora-teal/15 text-aurora-teal border-0">Befintlig</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] border-border/40"
                          onClick={() => toggleAction(i)}
                        >
                          {row.action === 'match' && <Check className="w-3 h-3 mr-1 text-aurora-teal" />}
                          {row.action === 'create' && <Plus className="w-3 h-3 mr-1 text-aurora-cyan" />}
                          {row.action === 'skip' && <X className="w-3 h-3 mr-1 text-muted-foreground" />}
                          {row.action === 'match' ? 'Matcha' : row.action === 'create' ? 'Skapa ny' : 'Hoppa över'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-3 p-4">
              <Button variant="outline" className="border-border/50" onClick={() => setStep('map')}>Tillbaka</Button>
              <Button className="bg-aurora-cyan hover:bg-aurora-cyan/90 text-background font-semibold" onClick={handleImport}>
                Importera {previewRows.filter(r => r.action !== 'skip').length} rader
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <Card className="glass-card animate-in-3">
          <CardContent className="pt-6 text-center py-16">
            <div className="w-20 h-20 bg-aurora-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6 glow-teal">
              <Check className="w-10 h-10 text-aurora-teal" />
            </div>
            <h2 className="font-serif text-2xl mb-2">Import klar!</h2>
            <p className="text-muted-foreground mb-8">
              {importedCount} nya tjänster skapades från importen.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="border-border/50" onClick={resetImport}>
                Importera fler
              </Button>
              <Button
                className="bg-aurora-cyan hover:bg-aurora-cyan/90 text-background font-semibold"
                onClick={() => window.location.href = '/tjanster'}
              >
                Visa tjänster
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
