import { Layers, Check } from 'lucide-react';
import { Label } from '@/shared/components/label';
import { cn } from '@/lib/utils';
import { getSetores } from '@/lib/setores-segmentos';
import { EmpresaFormData } from './types';

interface StepProps {
  formData: EmpresaFormData;
  onUpdate: (field: keyof EmpresaFormData, value: any) => void;
}

export function StepClassificacao({ formData, onUpdate }: StepProps) {
  const setoresOptions = getSetores();

  const handleSetorToggle = (setorValue: string) => {
    const currentSetores = formData.setores || [];
    if (currentSetores.includes(setorValue)) {
      onUpdate('setores', currentSetores.filter(s => s !== setorValue));
    } else {
      onUpdate('setores', [...currentSetores, setorValue]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Classificação da empresa
        </h3>
        <p className="text-sm text-muted-foreground">
          Escolha os setores que melhor representam a empresa.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">
          Selecione os setores da empresa
        </Label>
        
        <div className="flex flex-wrap gap-2">
          {setoresOptions.map((setor) => {
            const isSelected = formData.setores?.includes(setor.value);
            return (
              <button
                key={setor.value}
                type="button"
                onClick={() => handleSetorToggle(setor.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
                  isSelected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground'
                )}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                {setor.label}
              </button>
            );
          })}
        </div>

        {formData.setores && formData.setores.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {formData.setores.length} setor(es) selecionado(s)
          </p>
        )}
      </div>
    </div>
  );
}
