import { cn } from '@/lib/utils';
import { getSetores, getSegmentos } from '@/lib/setores-segmentos';
import type { WizardFormData } from './types';
import { FileText, icons } from 'lucide-react';
import React from 'react';

function LucideIcon({ name, className }: { name: string; className?: string }) {
  const IconComp = (icons as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComp) return <FileText className={className} />;
  return <IconComp className={className} />;
}

interface StepSetorProps {
  formData: WizardFormData;
  onUpdate: (field: keyof WizardFormData, value: any) => void;
}

export function StepSetor({ formData, onUpdate }: StepSetorProps) {
  const setores = getSetores();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <p className="text-base text-muted-foreground leading-relaxed">
          Que legal que você tem uma operação!
        </p>
        <h2 className="text-xl font-bold text-foreground leading-tight">
          Em qual setor ela se encaixa?
        </h2>
      </div>

      {/* Sector grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {setores.map((setor) => (
          <button
            key={setor.value}
            type="button"
            onClick={() => onUpdate('setor', setor.value)}
            className={cn(
              'flex items-center gap-4 p-5 rounded-xl transition-all duration-200 text-left',
              'hover:bg-muted/80',
              formData.setor === setor.value
                ? 'bg-primary/10 ring-2 ring-primary'
                : 'bg-muted/40'
            )}
          >
            <div className="shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <LucideIcon name={setor.icon} className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className={cn(
              'font-medium text-sm',
              formData.setor === setor.value ? 'text-primary' : 'text-foreground'
            )}>
              {setor.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
