import { useState } from 'react';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { Button } from '@/shared/components/button';
import { MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCEP } from '@/lib/validators';
import type { WizardFormData } from './types';

interface StepLocalizacaoProps {
  formData: WizardFormData;
  onUpdate: (field: keyof WizardFormData, value: any) => void;
}

export function StepLocalizacao({ formData, onUpdate }: StepLocalizacaoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepSuccess, setCepSuccess] = useState(false);

  const handleCEPChange = (value: string) => {
    const formatted = formatCEP(value);
    onUpdate('cep', formatted);
    setCepError(null);
    setCepSuccess(false);
    
    // Reset city and state when CEP changes
    if (formatted.length < 9) {
      onUpdate('cidade', '');
      onUpdate('uf', '');
    }
  };

  const handleCEPBlur = async () => {
    const cleanCep = formData.cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      if (cleanCep.length > 0) {
        setCepError('CEP deve ter 8 dígitos');
      }
      return;
    }

    setIsLoading(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado');
        onUpdate('cidade', '');
        onUpdate('uf', '');
      } else {
        onUpdate('cidade', data.localidade || '');
        onUpdate('uf', data.uf || '');
        setCepSuccess(true);
      }
    } catch (error) {
      setCepError('Erro ao buscar CEP. Tente novamente.');
      onUpdate('cidade', '');
      onUpdate('uf', '');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <MapPin className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Onde está localizado o projeto?
        </h3>
        <p className="text-sm text-muted-foreground">
          Informe o CEP para buscarmos a localização automaticamente
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-6">
        <div className="space-y-2">
          <Label htmlFor="cep">CEP *</Label>
          <div className="relative">
            <Input
              id="cep"
              value={formData.cep}
              onChange={(e) => handleCEPChange(e.target.value)}
              onBlur={handleCEPBlur}
              placeholder="00000-000"
              maxLength={9}
              className={`pr-10 ${cepError ? 'border-destructive' : cepSuccess ? 'border-green-500' : ''}`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!isLoading && cepSuccess && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {!isLoading && cepError && <AlertCircle className="h-4 w-4 text-destructive" />}
            </div>
          </div>
          {cepError && (
            <p className="text-xs text-destructive">{cepError}</p>
          )}
        </div>

        {(formData.cidade || formData.uf) && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  {formData.cidade} - {formData.uf}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Localização identificada com sucesso
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          O CEP será usado para identificar a região do empreendimento
        </p>
      </div>
    </div>
  );
}
