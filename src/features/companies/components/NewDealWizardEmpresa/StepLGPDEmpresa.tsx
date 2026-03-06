import { ScrollArea } from '@/shared/components/scroll-area';
import { Checkbox } from '@/shared/components/checkbox';
import { Label } from '@/shared/components/label';
import { Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSecurityForms } from '@/hooks/useSecurityForms';
import type { EmpresaFormData } from './types';

interface StepLGPDEmpresaProps {
  formData: EmpresaFormData;
  onUpdate: (field: keyof EmpresaFormData, value: any) => void;
}

export function StepLGPDEmpresa({ formData, onUpdate }: StepLGPDEmpresaProps) {
  const { getFirstActive } = useSecurityForms();
  const adminForm = getFirstActive('empresa');

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handleAcceptChange = (checked: boolean) => {
    onUpdate('lgpdAccepted', checked);
    onUpdate('lgpdAcceptedAt', checked ? new Date().toISOString() : null);
  };

  const clauses = adminForm?.clauses ?? [
    { id: '1', title: 'CLÁUSULA 1 - DO OBJETO', content: '1.1. O presente Termo tem por objeto regular a confidencialidade das informações trocadas entre as partes, incluindo informações financeiras, operacionais e estratégicas da empresa.' },
    { id: '2', title: 'CLÁUSULA 2 - TRATAMENTO DE DADOS PESSOAIS (LGPD)', content: '2.1. Em conformidade com a Lei nº 13.709/2018 (LGPD), as partes se comprometem a tratar os dados pessoais compartilhados exclusivamente para as finalidades descritas neste termo.\n\n2.2. Os dados coletados serão utilizados para análise de viabilidade de operações financeiras, comunicação e cumprimento de obrigações legais.' },
    { id: '3', title: 'CLÁUSULA 3 - DA ASSINATURA ELETRÔNICA', content: '3.1. As partes reconhecem a validade jurídica da assinatura eletrônica em conformidade com a MP 2.200-2/2001.' },
  ];

  const footerNote = adminForm?.footerNote ?? 'Ao marcar a caixa abaixo, você declara ter lido e concordado com todos os termos em nome da empresa que representa.';
  const checkboxLabel = adminForm?.checkboxLabel ?? 'Li e aceito os termos de confidencialidade e proteção de dados. Declaro estar ciente das obrigações assumidas em nome da empresa que represento.';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
        <Shield className="h-8 w-8 text-primary flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-foreground">{adminForm?.name ?? 'Termo de Confidencialidade e Proteção de Dados'}</h3>
          <p className="text-sm text-muted-foreground">
            {adminForm?.description ?? 'Em conformidade com a Lei Geral de Proteção de Dados (LGPD)'}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          A leitura e aceite deste termo é obrigatória para prosseguir com o cadastro da sua operação.
        </p>
      </div>

      <ScrollArea className="h-[280px] rounded-lg border border-border p-4 bg-muted/30">
        <div className="space-y-4 text-sm text-muted-foreground pr-4">
          <p className="font-semibold text-foreground">TERMO DE CONFIDENCIALIDADE E NÃO DIVULGAÇÃO</p>
          
          <p>
            Pelo presente instrumento particular, as partes abaixo qualificadas, de um lado a <strong>MAX CAPITAL SECURITIZADORA S.A.</strong>, 
            inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, com sede na cidade de São Paulo/SP, doravante denominada "PARTE RECEPTORA", 
            e de outro lado, o USUÁRIO/EMPRESA que aceita os termos deste documento, doravante denominado "PARTE REVELADORA".
          </p>

          {clauses.map((clause) => (
            <div key={clause.id}>
              <p className="font-medium text-foreground">{clause.title}</p>
              <p className="whitespace-pre-line">{clause.content}</p>
            </div>
          ))}

          <p className="font-medium text-foreground">CLÁUSULA {clauses.length + 1} - DA DATA</p>
          <p>O presente Termo é firmado eletronicamente na data de <strong>{currentDate}</strong>.</p>

          <p className="mt-6 text-xs text-muted-foreground">{footerNote}</p>
        </div>
      </ScrollArea>

      <div 
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border transition-colors',
          formData.lgpdAccepted 
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
            : 'bg-card border-border'
        )}
      >
        <Checkbox
          id="lgpd-accept-empresa"
          checked={formData.lgpdAccepted}
          onCheckedChange={handleAcceptChange}
          className="mt-0.5"
        />
        <Label htmlFor="lgpd-accept-empresa" className="text-sm cursor-pointer leading-relaxed">
          {checkboxLabel}
        </Label>
      </div>
    </div>
  );
}
