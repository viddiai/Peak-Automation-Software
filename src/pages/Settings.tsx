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
import { Save, RotateCcw } from 'lucide-react';
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
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Inställningar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hantera applikationsinställningar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Företagsinformation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Företagsnamn</Label>
            <Input
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Standardvaluta</Label>
            <Select
              value={form.defaultCurrency}
              onValueChange={v => { if (v) setForm(f => ({ ...f, defaultCurrency: v as Currency })); }}
            >
              <SelectTrigger className="w-[120px]">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Växelkurser (till SEK)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ange växelkurser för att konvertera kostnader till SEK.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>1 SEK =</Label>
              <Input
                type="number"
                step="0.01"
                value={form.exchangeRates.SEK}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>1 EUR =</Label>
              <Input
                type="number"
                step="0.01"
                value={form.exchangeRates.EUR}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    exchangeRates: { ...f.exchangeRates, EUR: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">SEK</p>
            </div>
            <div className="space-y-2">
              <Label>1 USD =</Label>
              <Input
                type="number"
                step="0.01"
                value={form.exchangeRates.USD}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    exchangeRates: { ...f.exchangeRates, USD: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">SEK</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSave}
        >
          <Save className="w-4 h-4 mr-2" />
          {saved ? 'Sparat!' : 'Spara inställningar'}
        </Button>
      </div>

      <Separator />

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Farozon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Återställ all data till ursprungliga exempelvärden. Alla dina ändringar kommer att raderas.
          </p>
          <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium">
              <RotateCcw className="w-4 h-4" /> Återställ all data
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Återställ all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta tar bort all data och återställer till exempeldata. Åtgärden kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
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
