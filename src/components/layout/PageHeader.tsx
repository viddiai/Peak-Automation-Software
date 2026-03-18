import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import { useAppData } from '@/hooks/useAppData';
import { Plus, List, Upload, PiggyBank, Download } from 'lucide-react';
import { exportServicesToCSV } from '@/lib/exportCSV';
import type { SaaSService } from '@/types';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  const navigate = useNavigate();
  const { services, users, settings, addService } = useAppData();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-in-1">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm mt-1.5">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-aurora-cyan hover:bg-aurora-cyan/90 text-background font-semibold shadow-lg glow-cyan"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Lägg till tjänst
          </Button>
          <Button variant="outline" className="border-border/60 text-muted-foreground hover:text-foreground hover:border-border" onClick={() => navigate('/tjanster')}>
            <List className="w-4 h-4 mr-2" /> Alla tjänster
          </Button>
          <Button variant="outline" className="border-border/60 text-muted-foreground hover:text-foreground hover:border-border" onClick={() => navigate('/importera')}>
            <Upload className="w-4 h-4 mr-2" /> Importera
          </Button>
          <Button variant="outline" className="border-border/60 text-muted-foreground hover:text-foreground hover:border-border" onClick={() => navigate('/besparingar')}>
            <PiggyBank className="w-4 h-4 mr-2" /> Besparingar
          </Button>
          <Button variant="outline" className="border-border/60 text-muted-foreground hover:text-foreground hover:border-border" onClick={() => exportServicesToCSV(services, users, settings)}>
            <Download className="w-4 h-4 mr-2" /> Exportera CSV
          </Button>
        </div>
      </div>

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        service={null}
        onSave={(service: SaaSService) => { addService(service); setFormOpen(false); }}
      />
    </>
  );
}
