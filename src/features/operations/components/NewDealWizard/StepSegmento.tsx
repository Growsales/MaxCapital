import React from 'react';
import { cn } from '@/lib/utils';
import { getSetores, getSegmentos } from '@/lib/setores-segmentos';
import type { WizardFormData } from './types';
import { FileText, icons } from 'lucide-react';

function LucideIcon({ name, className }: { name: string; className?: string }) {
  const IconComp = (icons as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComp) return <FileText className={className} />;
  return <IconComp className={className} />;
}

interface StepSegmentoProps {
  formData: WizardFormData;
  onUpdate: (field: keyof WizardFormData, value: any) => void;
}

export function StepSegmento({ formData, onUpdate }: StepSegmentoProps) {
  const segmentos = getSegmentos(formData.setor);
  const setorInfo = getSetores().find(s => s.value === formData.setor);
  const setorLabel = setorInfo?.label?.toLowerCase() || 'selecionado';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        {formData.setor === '_investidor_tese' ? (
          <>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Vamos montar sua tese de investimento!
            </p>
            <h2 className="text-2xl font-bold text-foreground leading-tight">
              Qual segmento te interessa?
            </h2>
          </>
        ) : (
          <>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Certo! E dentro do setor <span className="font-bold text-foreground">{setorLabel}</span>
            </p>
            <h2 className="text-2xl font-bold text-foreground leading-tight">
              Qual o segmento?
            </h2>
          </>
        )}
      </div>

      {/* Segment cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {segmentos.map((segmento) => (
          <button
            key={segmento.value}
            type="button"
            onClick={() => onUpdate('segmento', segmento.value)}
            className={cn(
              'flex flex-col justify-start p-6 rounded-2xl text-left transition-all duration-200 min-h-[190px]',
              formData.segmento === segmento.value
                ? 'bg-primary text-primary-foreground ring-2 ring-primary shadow-lg shadow-primary/25'
                : 'bg-muted/60 text-foreground hover:bg-muted'
            )}
          >
            <p className="font-semibold text-base mb-3 leading-snug">
              {segmento.label}
            </p>
            {segmento.description && (
              <p className={cn(
                'text-sm leading-relaxed',
                formData.segmento === segmento.value
                  ? 'text-primary-foreground/80'
                  : 'text-muted-foreground'
              )}>
                {segmento.description}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
