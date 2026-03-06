import { useState, useRef } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, PiggyBank, Landmark, Building, Receipt } from 'lucide-react';
import { Input } from '@/shared/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import { cn } from '@/lib/utils';
import { EmpresaFormData } from './types';
import { FieldTooltip, financialTooltips } from './FieldTooltip';

interface StepProps {
  formData: EmpresaFormData;
  onUpdate: (field: keyof EmpresaFormData, value: any) => void;
}

// Format value for display only
const formatCurrencyDisplay = (value: string): string => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  
  const numValue = parseInt(numbers, 10);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

// Currency input component that doesn't lose focus
function CurrencyInput({ 
  value, 
  onChange, 
  placeholder = "R$ 0",
  className 
}: { 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(() => formatCurrencyDisplay(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numbers = rawValue.replace(/\D/g, '');
    
    if (numbers) {
      const formatted = formatCurrencyDisplay(numbers);
      setDisplayValue(formatted);
      onChange(formatted);
    } else {
      setDisplayValue('');
      onChange('');
    }
  };

  const handleFocus = () => {
    // Move cursor to end on focus
    setTimeout(() => {
      if (inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  return (
    <Input
      ref={inputRef}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
      inputMode="numeric"
    />
  );
}

export function StepInformacoesFinanceiras({ formData, onUpdate }: StepProps) {
  const handleCurrencyChange = (field: keyof EmpresaFormData, value: string) => {
    onUpdate(field, value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Informações Financeiras
        </h3>
        <p className="text-sm text-muted-foreground">
          Forneça os dados financeiros dos últimos anos e previsões. Esses dados são essenciais para análise.
        </p>
      </div>

      {/* Revenue Section */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-border flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <FieldTooltip 
            label="Faturamento Bruto Anual" 
            tooltip={financialTooltips.faturamento}
          >
            <span />
          </FieldTooltip>
        </div>
        <div className="p-4 bg-card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">2023</span>
              <CurrencyInput
                value={formData.faturamento2023}
                onChange={(v) => handleCurrencyChange('faturamento2023', v)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">2024</span>
              <CurrencyInput
                value={formData.faturamento2024}
                onChange={(v) => handleCurrencyChange('faturamento2024', v)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">2025</span>
              <CurrencyInput
                value={formData.faturamento2025}
                onChange={(v) => handleCurrencyChange('faturamento2025', v)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-primary">2026 (Projeção)</span>
              <CurrencyInput
                value={formData.faturamento2026}
                onChange={(v) => handleCurrencyChange('faturamento2026', v)}
                className="bg-primary/5 border-primary/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* EBITDA Section */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-border flex items-center gap-2">
          <PiggyBank className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <FieldTooltip 
            label="EBITDA" 
            tooltip={financialTooltips.ebitda}
          >
            <span />
          </FieldTooltip>
        </div>
        <div className="p-4 bg-card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">2023</span>
              <CurrencyInput
                value={formData.ebitda2023}
                onChange={(v) => handleCurrencyChange('ebitda2023', v)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">2024</span>
              <CurrencyInput
                value={formData.ebitda2024}
                onChange={(v) => handleCurrencyChange('ebitda2024', v)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">2025</span>
              <CurrencyInput
                value={formData.ebitda2025}
                onChange={(v) => handleCurrencyChange('ebitda2025', v)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-primary">2026 (Projeção)</span>
              <CurrencyInput
                value={formData.ebitda2026}
                onChange={(v) => handleCurrencyChange('ebitda2026', v)}
                className="bg-primary/5 border-primary/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Debt Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <FieldTooltip 
          label="A empresa possui dívidas?" 
          required
          tooltip="Informe se a empresa possui obrigações financeiras de qualquer natureza."
        >
          <Select 
            value={formData.possuiDividas} 
            onValueChange={(v) => onUpdate('possuiDividas', v)}
          >
            <SelectTrigger className="w-full md:w-1/2 bg-background">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao">Não possui dívidas</SelectItem>
              <SelectItem value="sim">Sim, possui dívidas</SelectItem>
            </SelectContent>
          </Select>
        </FieldTooltip>

        {formData.possuiDividas === 'sim' && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-700 dark:text-amber-400 text-sm">
                Detalhamento do Endividamento
              </span>
            </div>
            <div className="p-4 bg-card grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldTooltip 
                label="Endividamento Bancário" 
                tooltip={financialTooltips.endividamentoBancario}
              >
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <CurrencyInput
                    value={formData.endividamentoBancario}
                    onChange={(v) => handleCurrencyChange('endividamentoBancario', v)}
                    className="pl-10 bg-background"
                  />
                </div>
              </FieldTooltip>

              <FieldTooltip 
                label="Endividamento com Fornecedores" 
                tooltip={financialTooltips.endividamentoFornecedores}
              >
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <CurrencyInput
                    value={formData.endividamentoFornecedores}
                    onChange={(v) => handleCurrencyChange('endividamentoFornecedores', v)}
                    className="pl-10 bg-background"
                  />
                </div>
              </FieldTooltip>

              <FieldTooltip 
                label="Endividamento Tributário" 
                tooltip={financialTooltips.endividamentoTributario}
              >
                <div className="relative">
                  <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <CurrencyInput
                    value={formData.endividamentoTributario}
                    onChange={(v) => handleCurrencyChange('endividamentoTributario', v)}
                    className="pl-10 bg-background"
                  />
                </div>
              </FieldTooltip>

              <FieldTooltip 
                label="Outros Endividamentos" 
                tooltip={financialTooltips.outrosEndividamentos}
              >
                <div className="relative">
                  <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <CurrencyInput
                    value={formData.outrosEndividamentos}
                    onChange={(v) => handleCurrencyChange('outrosEndividamentos', v)}
                    className="pl-10 bg-background"
                  />
                </div>
              </FieldTooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
