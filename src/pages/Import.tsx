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
import { Upload, FileSpreadsheet, Check, X, ArrowRight, Plus } from 'lucide-react';
import type { CSVRow, ColumnMapping, ImportPreviewRow, SaaSService } from '@/types';

type ImportStep = 'upload' | 'map' | 'preview' | 'done';

// Common SaaS keywords for auto-detection
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
          // Auto-detect column mapping
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

        // Try to match existing service
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

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Importera</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Importera kontoutdrag eller bokföringsexport (CSV) för att identifiera prenumerationer
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Ladda upp', 'Mappa kolumner', 'Förhandsgranska', 'Klart'].map((label, i) => {
          const stepIdx = ['upload', 'map', 'preview', 'done'].indexOf(step);
          const isActive = i === stepIdx;
          const isDone = i < stepIdx;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              <Badge
                variant={isActive ? 'default' : isDone ? 'default' : 'secondary'}
                className={isActive ? 'bg-emerald-600' : isDone ? 'bg-emerald-100 text-emerald-700' : ''}
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
        <Card>
          <CardContent className="pt-6">
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Ladda upp CSV-fil</p>
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
                <span className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium cursor-pointer">
                  <Upload className="w-4 h-4" /> Välj fil
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Map columns */}
      {step === 'map' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mappa kolumner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Matchade {rawData.length} rader. Välj vilka kolumner som motsvarar datum, beskrivning och belopp.
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Select value={mapping.date} onValueChange={v => setMapping(m => ({ ...m, date: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Välj kolumn" /></SelectTrigger>
                  <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Beskrivning *</Label>
                <Select value={mapping.description} onValueChange={v => setMapping(m => ({ ...m, description: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Välj kolumn" /></SelectTrigger>
                  <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Belopp *</Label>
                <Select value={mapping.amount} onValueChange={v => setMapping(m => ({ ...m, amount: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Välj kolumn" /></SelectTrigger>
                  <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview first 5 rows */}
            {rawData.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Förhandsgranskning (5 första raderna)</p>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.slice(0, 6).map(h => (
                          <TableHead key={h} className="text-xs">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawData.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {headers.slice(0, 6).map(h => (
                            <TableCell key={h} className="text-xs">{row[h]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetImport}>Börja om</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Förhandsgranskning ({previewRows.filter(r => r.action !== 'skip').length} att importera)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Beskrivning</TableHead>
                    <TableHead>Belopp</TableHead>
                    <TableHead>Matchad/Ny tjänst</TableHead>
                    <TableHead>Åtgärd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, i) => (
                    <TableRow key={i} className={row.action === 'skip' ? 'opacity-40' : ''}>
                      <TableCell className="text-sm">{row.date}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{row.description}</TableCell>
                      <TableCell className="font-medium">{row.amount.toLocaleString('sv-SE')} SEK</TableCell>
                      <TableCell>
                        <span className="text-sm">{row.suggestedServiceName}</span>
                        {row.matchedServiceId && (
                          <Badge variant="secondary" className="ml-2 text-xs">Befintlig</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => toggleAction(i)}
                        >
                          {row.action === 'match' && <Check className="w-3 h-3 mr-1 text-emerald-600" />}
                          {row.action === 'create' && <Plus className="w-3 h-3 mr-1 text-blue-600" />}
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
              <Button variant="outline" onClick={() => setStep('map')}>Tillbaka</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleImport}>
                Importera {previewRows.filter(r => r.action !== 'skip').length} rader
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Import klar!</h2>
            <p className="text-muted-foreground mb-6">
              {importedCount} nya tjänster skapades från importen.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={resetImport}>
                Importera fler
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
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
