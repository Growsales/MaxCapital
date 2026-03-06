// @ts-nocheck
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, DollarSign, Briefcase, HelpCircle } from 'lucide-react';
import { GenericModal, FormModalContent } from '@/lib/design-system';
import { useUpdateOperacao } from '@/hooks/useOperacoes';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TIPOS_OPERACAO_EMPRESA } from '@/features/companies/components/NewDealWizardEmpresa/types';
import { getSetores } from '@/lib/setores-segmentos';

interface EditOperationModalEmpresaProps {
  open: boolean;
  onClose: () => void;
  operacao: any;
}

const tooltips: Record<string, string> = {
  ebitda: 'EBITDA: Lucros antes de juros, impostos, depreciação e amortização',
  recuperacaoJudicial: 'Indica se a empresa está em processo de recuperação judicial',
  balancoAuditado: 'Indica se a empresa possui balanço auditado por empresa de auditoria',
  receitaNaoDeclarada: 'Indica se há receita que não foi declarada oficialmente',
  endividamentoBancario: 'Total de dívidas com instituições bancárias',
  endividamentoFornecedores: 'Total de dívidas com fornecedores',
  endividamentoTributario: 'Total de dívidas tributárias (impostos)',
};

const FieldWithTooltip = ({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1">
      <Label>{label}</Label>
      {tooltip && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    {children}
  </div>
);

// Currency input component to prevent focus loss
function CurrencyInput({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [displayValue, setDisplayValue] = useState(value || '');

  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  const formatCurrency = (val: string) => {
    const numbers = val.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers, 10) / 100;
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatCurrency(rawValue);
    setDisplayValue(formatted);
  };

  const handleBlur = () => {
    onChange(displayValue);
  };

  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder || "R$ 0,00"}
    />
  );
}

export function EditOperationModalEmpresa({ open, onClose, operacao }: EditOperationModalEmpresaProps) {
  const updateOperacao = useUpdateOperacao();
  
  // Parse existing observacoes if it's JSON
  const parseObservacoes = () => {
    if (operacao?.observacoes && typeof operacao.observacoes === 'string') {
      try {
        if (operacao.observacoes.startsWith('{')) {
          return JSON.parse(operacao.observacoes);
        }
      } catch {
        return {};
      }
    }
    return {};
  };

  const [formData, setFormData] = useState({
    valor_investimento: operacao?.valor_investimento || 0,
    ...parseObservacoes(),
  });

  useEffect(() => {
    if (operacao) {
      setFormData({
        valor_investimento: operacao.valor_investimento || 0,
        ...parseObservacoes(),
      });
    }
  }, [operacao]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    const current = formData[field] || [];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    updateField(field, updated);
  };

  const handleSave = async () => {
    if (!operacao?.id) return;

    try {
      const { valor_investimento, ...observacoesData } = formData;

      await updateOperacao.mutateAsync({
        id: operacao.id,
        valor_investimento: Number(valor_investimento),
        observacoes: JSON.stringify(observacoesData),
      });

      toast({
        title: 'Operação atualizada',
        description: 'Os dados foram salvos com sucesso.',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const setoresOptions = getSetores();

  return (
    <GenericModal
      open={open}
      onClose={onClose}
      onConfirm={handleSave}
      title="Editar Operação"
      description={`Operação: ${operacao?.numero_funil || '-'}`}
      icon={Building2}
      variant="default"
      confirmLabel="Salvar Alterações"
      cancelLabel="Cancelar"
      showConfirmButton={true}
      showCancelButton={true}
      isLoading={updateOperacao.isPending}
      size="xl"
    >
      <FormModalContent>
        <Tabs defaultValue="cadastrais" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cadastrais">Cadastrais</TabsTrigger>
            <TabsTrigger value="classificacao">Classificação</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="operacao">Operação</TabsTrigger>
          </TabsList>

          {/* Tab Cadastrais */}
          <TabsContent value="cadastrais" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Informações Cadastrais</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldWithTooltip label="Nome Empresarial">
                <Input
                  value={formData.nomeEmpresarial || ''}
                  onChange={(e) => updateField('nomeEmpresarial', e.target.value)}
                  placeholder="Razão Social"
                />
              </FieldWithTooltip>

              <FieldWithTooltip label="CNPJ">
                <Input
                  value={formData.cnpj || ''}
                  onChange={(e) => updateField('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </FieldWithTooltip>

              <FieldWithTooltip label="Nome Fantasia">
                <Input
                  value={formData.nomeFantasia || ''}
                  onChange={(e) => updateField('nomeFantasia', e.target.value)}
                  placeholder="Nome Fantasia"
                />
              </FieldWithTooltip>

              <FieldWithTooltip label="Site">
                <Input
                  value={formData.site || ''}
                  onChange={(e) => updateField('site', e.target.value)}
                  placeholder="https://..."
                />
              </FieldWithTooltip>

              <FieldWithTooltip label="E-mail do Empresário">
                <Input
                  type="email"
                  value={formData.emailEmpresario || ''}
                  onChange={(e) => updateField('emailEmpresario', e.target.value)}
                  placeholder="email@empresa.com"
                />
              </FieldWithTooltip>
            </div>

            <FieldWithTooltip label="Sobre a Empresa">
              <Textarea
                value={formData.sobreEmpresa || ''}
                onChange={(e) => updateField('sobreEmpresa', e.target.value)}
                rows={3}
                placeholder="Descreva brevemente a empresa..."
              />
            </FieldWithTooltip>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <FieldWithTooltip label="Recuperação Judicial?" tooltip={tooltips.recuperacaoJudicial}>
                <Select value={formData.recuperacaoJudicial || ''} onValueChange={(v) => updateField('recuperacaoJudicial', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithTooltip>

              <FieldWithTooltip label="Balanço Auditado?" tooltip={tooltips.balancoAuditado}>
                <Select value={formData.balancoAuditado || ''} onValueChange={(v) => updateField('balancoAuditado', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithTooltip>

              <FieldWithTooltip label="Receita Não Declarada?" tooltip={tooltips.receitaNaoDeclarada}>
                <Select value={formData.receitaNaoDeclarada || ''} onValueChange={(v) => updateField('receitaNaoDeclarada', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithTooltip>
            </div>
          </TabsContent>

          {/* Tab Classificação */}
          <TabsContent value="classificacao" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Classificação da Empresa</h3>
            </div>

            <FieldWithTooltip label="Tipo de Empresa">
              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant={tipoEmpresa === 'economia_real' ? 'default' : 'outline'}
                  onClick={() => {
                    updateField('tipoEmpresa', 'economia_real');
                    updateField('setores', []);
                  }}
                  className="flex-1"
                >
                  Economia Real
                </Button>
                <Button
                  type="button"
                  variant={tipoEmpresa === 'tecnologia' ? 'default' : 'outline'}
                  onClick={() => {
                    updateField('tipoEmpresa', 'tecnologia');
                    updateField('setores', []);
                  }}
                  className="flex-1"
                >
                  Tecnologia
                </Button>
              </div>
            </FieldWithTooltip>

            {tipoEmpresa && (
              <FieldWithTooltip label="Setores de Atuação">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {setoresOptions.map((setor) => (
                    <div key={setor.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`setor-${setor.value}`}
                        checked={(formData.setores || []).includes(setor.value)}
                        onCheckedChange={() => handleArrayToggle('setores', setor.value)}
                      />
                      <label htmlFor={`setor-${setor.value}`} className="text-sm cursor-pointer">
                        {setor.label}
                      </label>
                    </div>
                  ))}
                </div>
              </FieldWithTooltip>
            )}
          </TabsContent>

          {/* Tab Financeiro */}
          <TabsContent value="financeiro" className="space-y-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Informações Financeiras</h3>
            </div>

            {/* Faturamento */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-4">Faturamento Anual</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FieldWithTooltip label="2023">
                  <CurrencyInput
                    value={formData.faturamento2023 || ''}
                    onChange={(v) => updateField('faturamento2023', v)}
                  />
                </FieldWithTooltip>
                <FieldWithTooltip label="2024">
                  <CurrencyInput
                    value={formData.faturamento2024 || ''}
                    onChange={(v) => updateField('faturamento2024', v)}
                  />
                </FieldWithTooltip>
                <FieldWithTooltip label="2025">
                  <CurrencyInput
                    value={formData.faturamento2025 || ''}
                    onChange={(v) => updateField('faturamento2025', v)}
                  />
                </FieldWithTooltip>
                <FieldWithTooltip label="2026 (Projeção)">
                  <CurrencyInput
                    value={formData.faturamento2026 || ''}
                    onChange={(v) => updateField('faturamento2026', v)}
                  />
                </FieldWithTooltip>
              </div>
            </div>

            {/* EBITDA */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <h4 className="font-medium">EBITDA</h4>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex">
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{tooltips.ebitda}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FieldWithTooltip label="2023">
                  <CurrencyInput
                    value={formData.ebitda2023 || ''}
                    onChange={(v) => updateField('ebitda2023', v)}
                  />
                </FieldWithTooltip>
                <FieldWithTooltip label="2024">
                  <CurrencyInput
                    value={formData.ebitda2024 || ''}
                    onChange={(v) => updateField('ebitda2024', v)}
                  />
                </FieldWithTooltip>
                <FieldWithTooltip label="2025">
                  <CurrencyInput
                    value={formData.ebitda2025 || ''}
                    onChange={(v) => updateField('ebitda2025', v)}
                  />
                </FieldWithTooltip>
                <FieldWithTooltip label="2026 (Projeção)">
                  <CurrencyInput
                    value={formData.ebitda2026 || ''}
                    onChange={(v) => updateField('ebitda2026', v)}
                  />
                </FieldWithTooltip>
              </div>
            </div>

            {/* Dívidas */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-4">Endividamento</h4>
              
              <FieldWithTooltip label="Possui Dívidas?">
                <Select value={formData.possuiDividas || ''} onValueChange={(v) => updateField('possuiDividas', v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithTooltip>

              {formData.possuiDividas === 'sim' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FieldWithTooltip label="Endividamento Bancário" tooltip={tooltips.endividamentoBancario}>
                    <CurrencyInput
                      value={formData.endividamentoBancario || ''}
                      onChange={(v) => updateField('endividamentoBancario', v)}
                    />
                  </FieldWithTooltip>
                  <FieldWithTooltip label="Endividamento Fornecedores" tooltip={tooltips.endividamentoFornecedores}>
                    <CurrencyInput
                      value={formData.endividamentoFornecedores || ''}
                      onChange={(v) => updateField('endividamentoFornecedores', v)}
                    />
                  </FieldWithTooltip>
                  <FieldWithTooltip label="Endividamento Tributário" tooltip={tooltips.endividamentoTributario}>
                    <CurrencyInput
                      value={formData.endividamentoTributario || ''}
                      onChange={(v) => updateField('endividamentoTributario', v)}
                    />
                  </FieldWithTooltip>
                  <FieldWithTooltip label="Outros Endividamentos">
                    <CurrencyInput
                      value={formData.outrosEndividamentos || ''}
                      onChange={(v) => updateField('outrosEndividamentos', v)}
                    />
                  </FieldWithTooltip>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Operação */}
          <TabsContent value="operacao" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Tipo de Operação</h3>
            </div>

            <FieldWithTooltip label="Tipos de Operação Desejados">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {TIPOS_OPERACAO_EMPRESA.map((tipo) => (
                  <div 
                    key={tipo.value} 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      (formData.tiposOperacao || []).includes(tipo.value) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleArrayToggle('tiposOperacao', tipo.value)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={(formData.tiposOperacao || []).includes(tipo.value)}
                        onCheckedChange={() => handleArrayToggle('tiposOperacao', tipo.value)}
                      />
                      <div>
                        <p className="font-medium text-sm">{tipo.label}</p>
                        <p className="text-xs text-muted-foreground">{tipo.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FieldWithTooltip>

            <FieldWithTooltip label="Observações Gerais">
              <Textarea
                value={formData.observacoesGerais || ''}
                onChange={(e) => updateField('observacoesGerais', e.target.value)}
                rows={4}
                placeholder="Informações adicionais sobre a operação..."
              />
            </FieldWithTooltip>
          </TabsContent>
        </Tabs>
      </FormModalContent>
    </GenericModal>
  );
}
