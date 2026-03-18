import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Save, RotateCcw, Check } from 'lucide-react';
import type { Currency } from '@/types';

export function Settings() {
  const { settings, updateSettings, resetData } = useAppData();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inställningar"
        subtitle="Hantera applikationsinställningar"
      />

      <Card className="glass-card animate-in-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Företagsinformation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Företagsnamn</Label>
            <Input
              className="bg-white/[0.04] border-border/50 focus:border-aurora-cyan/40"
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Standardvaluta</Label>
            <Select
              value={form.defaultCurrency}
              onValueChange={v => { if (v) setForm(f => ({ ...f, defaultCurrency: v as Currency })); }}
            >
              <SelectTrigger className="w-[120px] bg-white/[0.04] border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEK">SEK</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card animate-in-3">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Växelkurser (till SEK)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ange växelkurser för att konvertera kostnader till SEK.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">1 SEK =</Label>
              <Input
                type="number"
                step="0.01"
                className="bg-white/[0.04] border-border/50"
                value={form.exchangeRates.SEK}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">1 EUR =</Label>
              <Input
                type="number"
                step="0.01"
                className="bg-white/[0.04] border-border/50 focus:border-aurora-cyan/40"
                value={form.exchangeRates.EUR}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    exchangeRates: { ...f.exchangeRates, EUR: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
              <p className="text-[11px] text-muted-foreground/60">SEK</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">1 USD =</Label>
              <Input
                type="number"
                step="0.01"
                className="bg-white/[0.04] border-border/50 focus:border-aurora-cyan/40"
                value={form.exchangeRates.USD}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    exchangeRates: { ...f.exchangeRates, USD: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
              <p className="text-[11px] text-muted-foreground/60">SEK</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end animate-in-4">
        <Button
          className="bg-aurora-cyan hover:bg-aurora-cyan/90 text-background font-semibold shadow-lg glow-cyan"
          onClick={handleSave}
        >
          {saved ? (
            <><Check className="w-4 h-4 mr-2" /> Sparat!</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Spara inställningar</>
          )}
        </Button>
      </div>

      <Separator className="bg-border/30" />

      <Card className="border-aurora-rose/20 glass-card animate-in-5">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-aurora-rose">Farozon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Återställ all data till ursprungliga exempelvärden. Alla dina ändringar kommer att raderas.
          </p>
          <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 rounded-xl bg-aurora-rose/15 hover:bg-aurora-rose/25 text-aurora-rose px-4 py-2 text-sm font-semibold transition-colors">
              <RotateCcw className="w-4 h-4" /> Återställ all data
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-xl">Återställ all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta tar bort all data och återställer till exempeldata. Åtgärden kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border/50">Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-aurora-rose hover:bg-aurora-rose/90 text-white"
                  onClick={resetData}
                >
                  Återställ
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
