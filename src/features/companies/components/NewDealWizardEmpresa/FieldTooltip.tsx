import { HelpCircle } from 'lucide-react';
import { Label } from '@/shared/components/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/tooltip';

interface FieldTooltipProps {
  label: string;
  tooltip?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldTooltip({ label, tooltip, required, children }: FieldTooltipProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-sm">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
    </div>
  );
}

// Tooltips dictionary for financial terms
export const financialTooltips = {
  faturamento: 'Receita bruta total da empresa no período, antes de impostos e deduções.',
  ebitda: 'Lucros antes de Juros, Impostos, Depreciação e Amortização. Indica a geração de caixa operacional.',
  endividamentoBancario: 'Dívidas contraídas junto a instituições financeiras (empréstimos, financiamentos).',
  endividamentoFornecedores: 'Valores devidos a fornecedores de produtos ou serviços.',
  endividamentoTributario: 'Débitos com impostos, taxas e contribuições (federais, estaduais e municipais).',
  outrosEndividamentos: 'Outras obrigações financeiras como debêntures, mútuos, etc.',
  recuperacaoJudicial: 'Processo legal que visa reestruturar as dívidas de uma empresa em dificuldade financeira.',
  balancoAuditado: 'Demonstrações financeiras verificadas por auditoria independente.',
};
