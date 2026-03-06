import { useState } from 'react';
import { ScrollArea } from '@/shared/components/scroll-area';
import { Button } from '@/shared/components/button';
import { Checkbox } from '@/shared/components/checkbox';
import { useSecurityForms } from '@/hooks/useSecurityForms';
import type { WizardFormData } from './types';

interface StepLGPDProps {
  formData: WizardFormData;
  onUpdate: (field: keyof WizardFormData, value: any) => void;
  onAccept?: () => void;
}

export function StepLGPD({ formData, onUpdate, onAccept }: StepLGPDProps) {
  const { getFirstActive } = useSecurityForms();
  const adminForm = getFirstActive('lgpd');
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    onUpdate('lgpdAccepted', true);
    onUpdate('lgpdAcceptedAt', new Date().toISOString());
    onAccept?.();
  };

  const clauses = adminForm?.clauses ?? [
    { id: '1', title: '', content: '1. A manter sigilo, tanto escrito como verbal, com relação a toda e qualquer informação a que tiverem acesso da parte REVELADORA.' },
    { id: '2', title: '', content: '2. A não agredir, assediar, interpelar ou acessar diretamente potencial cliente ou negócio em que a parte RECEPTORA tenha tomado conhecimento pela parte REVELADORA.' },
    { id: '3', title: '', content: '3. O item 2 supra será considerado nulo de pleno direito, caso a parte RECEPTORA apresente evidências de relacionamento e tratativas anteriores de negociações com o potencial cliente ou negócio prévios à assinatura deste termo.' },
    { id: '4', title: '', content: '4. A não utilizar as informações confidenciais a que tiver acesso, para gerar benefício próprio exclusivo e/ou unilateral, presente ou futuro, ou para o uso de terceiros.' },
    { id: '5', title: '', content: '5. A não efetuar nenhuma gravação ou cópia da documentação confidencial a que tiver acesso.' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <p className="text-base text-muted-foreground leading-relaxed">
          Antes de começar, reforçamos que todas as informações
        </p>
        <h2 className="text-xl font-bold text-foreground leading-tight">
          são protegidas pelo nosso termo de confidencialidade.
        </h2>
      </div>

      {/* Term content */}
      <ScrollArea className="h-[340px] rounded-xl bg-card p-6">
        <div className="space-y-4 text-sm text-muted-foreground pr-4">
          <p className="font-bold text-foreground text-base">
            {adminForm?.name ?? 'TERMO DE CONFIDENCIALIDADE, SIGILO E NÃO AGRESSÃO'}
          </p>
          
          <p className="leading-relaxed">
            {adminForm?.description ?? 
              'Pelo presente Termo, a Bloxs Tech Desenvolvedora de Programas LTDA, sociedade empresária limitada, inscrita no CNPJ/ME sob nº 47.594.535/0001-00, com sede na Rua Cardeal Arcoverde, 1641, conj 53/54, Pinheiros, São Paulo/SP, CEP 05407-002, neste ato representada na forma de seu contrato social doravante designada simplesmente como RECEPTORA, se obriga a em relação à PARTE REVELADORA de acordo com as seguintes cláusulas e condições:'
            }
          </p>

          {clauses.map((clause) => (
            <div key={clause.id}>
              {clause.title && <p className="font-medium text-foreground">{clause.title}</p>}
              <p className="whitespace-pre-line leading-relaxed">{clause.content}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Checkbox + Accept button */}
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="h-5 w-5"
          />
          <span className="text-sm text-muted-foreground">
            Li e concordo com os termos de confidencialidade acima
          </span>
        </label>

        <Button
          onClick={handleAccept}
          size="lg"
          disabled={!checked}
          className="btn-primary px-10 rounded-full shadow-lg shadow-primary/20"
        >
          Li e estou de acordo
        </Button>
      </div>
    </div>
  );
}
