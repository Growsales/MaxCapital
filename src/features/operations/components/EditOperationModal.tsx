import { useState, useEffect } from 'react';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { Textarea } from '@/shared/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/select';
import { Checkbox } from '@/shared/components/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import { Building2, DollarSign, MapPin, FileText, HelpCircle } from 'lucide-react';
import { GenericModal, FormModalContent } from '@/lib/design-system';
import { useUpdateOperacao } from '@/features/operations/api/useOperacoes';
import { toast } from '@/shared/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/tooltip';

interface EditOperationModalProps {
  open: boolean;
  onClose: () => void;
  operacao: any;
}

const tooltips: Record<string, string> = {
  vgvEstimado: 'Valor Geral de Vendas - soma do valor de todas as unidades a serem comercializadas',
  tirProjetada: 'Taxa Interna de Retorno - indicador de rentabilidade do projeto',
  ticketMinimo: 'Valor mínimo de investimento por cotista',
  mrr: 'Monthly Recurring Revenue - receita recorrente mensal',
  arr: 'Annual Recurring Revenue - receita recorrente anual',
  ltv: 'Lifetime Value - valor total que um cliente gera durante o relacionamento',
  cac: 'Customer Acquisition Cost - custo para adquirir um novo cliente',
  ebitda: 'Lucros antes de juros, impostos, depreciação e amortização',
  capex: 'Capital Expenditure - investimentos em bens de capital',
  opex: 'Operational Expenditure - despesas operacionais',
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

export function EditOperationModal({ open, onClose, operacao }: EditOperationModalProps) {
  const updateOperacao = useUpdateOperacao();
  
  // Parse existing observacoes if it's JSON
  const parseObservacoes = () => {
    if (operacao?.observacoes && typeof operacao.observacoes === 'string') {
      try {
        if (operacao.observacoes.startsWith('{')) {
          return JSON.parse(operacao.observacoes);
        }
      } catch {
        return { observacoes: operacao.observacoes };
      }
    }
    return {};
  };

  const [formData, setFormData] = useState({
    // Main fields
    valor_investimento: operacao?.valor_investimento || 0,
    office: operacao?.office || '',
    status_exclusividade: operacao?.status_exclusividade || 'Sem exclusividade',
    
    // Parsed observacoes data
    ...parseObservacoes(),
  });

  useEffect(() => {
    if (operacao) {
      setFormData({
        valor_investimento: operacao.valor_investimento || 0,
        office: operacao.office || '',
        status_exclusividade: operacao.status_exclusividade || 'Sem exclusividade',
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
      // Separate main fields from observacoes fields
      const { valor_investimento, office, status_exclusividade, ...observacoesData } = formData;

      await updateOperacao.mutateAsync({
        id: operacao.id,
        valor_investimento: Number(valor_investimento),
        office,
        status_exclusividade,
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

  const setor = formData.setor || 'outros';

  return (
    <GenericModal
      open={open}
      onClose={onClose}
      onConfirm={handleSave}
      title="Editar Operação"
      description={`Operação: ${operacao?.numero_funil || '-'}`}
      icon={FileText}
      variant="default"
      confirmLabel="Salvar Alterações"
      cancelLabel="Cancelar"
      showConfirmButton={true}
      showCancelButton={true}
      isLoading={updateOperacao.isPending}
      size="xl"
    >
      <FormModalContent>
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="localizacao">Localização</TabsTrigger>
            <TabsTrigger value="caracteristicas">Características</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>

          {/* Tab Geral */}
          <TabsContent value="geral" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldWithTooltip label="Setor">
                <Select value={formData.setor || ''} onValueChange={(v) => updateField('setor', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agronegocio">Agronegócio</SelectItem>
                    <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                    <SelectItem value="imobiliario">Imobiliário</SelectItem>
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="negocios">Negócios</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithTooltip>

              <FieldWithTooltip label="Segmento">
                <Input
                  value={formData.segmento || ''}
                  onChange={(e) => updateField('segmento', e.target.value)}
                  placeholder="Ex: Incorporação, SaaS..."
                />
              </FieldWithTooltip>

              <FieldWithTooltip label="Status do Projeto">
                <Select value={formData.statusProjeto || ''} onValueChange={(v) => updateField('statusProjeto', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não, ainda não possuo terreno">Não, ainda não possuo terreno</SelectItem>
                    <SelectItem value="Sim, mas a obra ainda não começou">Sim, mas a obra ainda não começou</SelectItem>
                    <SelectItem value="Sim e a obra já foi iniciada">Sim e a obra já foi iniciada</SelectItem>
                    <SelectItem value="Sim, a construção já foi finalizada">Sim, a construção já foi finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithTooltip>


              <FieldWithTooltip label="Office">
                <Select value={formData.office} onValueChange={(v) => updateField('office', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o office" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Norte">Norte</SelectItem>
                    <SelectItem value="Nordeste">Nordeste</SelectItem>
                    <SelectItem value="Centro-Oeste">Centro-Oeste</SelectItem>
                    <SelectItem value="Sudeste">Sudeste</SelectItem>
                    <SelectItem value="Sul">Sul</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithTooltip>

              <FieldWithTooltip label="Exclusividade">
                <Select value={formData.status_exclusividade} onValueChange={(v) => updateField('status_exclusividade', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sem exclusividade">Sem exclusividade</SelectItem>
                    <SelectItem value="Com exclusividade">Com exclusividade</SelectItem>
                    <SelectItem value="Exclusividade parcial">Exclusividade parcial</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithTooltip>
            </div>

            <FieldWithTooltip label="Observações Gerais">
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => updateField('observacoes', e.target.value)}
                rows={4}
                placeholder="Informações adicionais sobre a operação..."
              />
            </FieldWithTooltip>
          </TabsContent>

          {/* Tab Localização */}
          <TabsContent value="localizacao" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Dados de Localização</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <FieldWithTooltip label="CEP">
                <Input
                  value={formData.cep || ''}
                  onChange={(e) => updateField('cep', e.target.value)}
                  placeholder="00000-000"
                />
              </FieldWithTooltip>

              <FieldWithTooltip label="Cidade">
                <Input
                  value={formData.cidade || ''}
                  onChange={(e) => updateField('cidade', e.target.value)}
                  placeholder="Cidade"
                />
              </FieldWithTooltip>

              <FieldWithTooltip label="Estado">
                <Input
                  value={formData.estado || ''}
                  onChange={(e) => updateField('estado', e.target.value)}
                  placeholder="UF"
                />
              </FieldWithTooltip>
            </div>

            {(setor === 'agronegocio' || setor === 'imobiliario') && (
              <div className="grid grid-cols-2 gap-4">
                <FieldWithTooltip label="Área do Terreno (m²)">
                  <Input
                    value={formData.areaTerreno || ''}
                    onChange={(e) => updateField('areaTerreno', e.target.value)}
                    placeholder="Ex: 5000"
                  />
                </FieldWithTooltip>

                {setor === 'agronegocio' && (
                  <FieldWithTooltip label="Área Produtiva (ha)">
                    <Input
                      value={formData.areaProdutiva || ''}
                      onChange={(e) => updateField('areaProdutiva', e.target.value)}
                      placeholder="Ex: 100"
                    />
                  </FieldWithTooltip>
                )}

                {setor === 'imobiliario' && (
                  <FieldWithTooltip label="Área Construída (m²)">
                    <Input
                      value={formData.areaConstruida || ''}
                      onChange={(e) => updateField('areaConstruida', e.target.value)}
                      placeholder="Ex: 3000"
                    />
                  </FieldWithTooltip>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab Características */}
          <TabsContent value="caracteristicas" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Características do Projeto</h3>
            </div>

            {setor === 'imobiliario' && (
              <>
                <FieldWithTooltip label="Tipo de Produto">
                  <div className="flex flex-wrap gap-4 mt-2">
                    {[
                      { value: 'residencial_vertical', label: 'Residencial Vertical' },
                      { value: 'residencial_horizontal', label: 'Residencial Horizontal' },
                      { value: 'salas_comerciais', label: 'Salas Comerciais' },
                      { value: 'laje_corporativa', label: 'Laje Corporativa' },
                      { value: 'lojas', label: 'Lojas' },
                      { value: 'multipropriedade', label: 'Multipropriedade' },
                    ].map((item) => (
                      <div key={item.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={(formData.tipoProduto || []).includes(item.value)}
                          onCheckedChange={() => handleArrayToggle('tipoProduto', item.value)}
                        />
                        <label className="text-sm">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </FieldWithTooltip>

                <FieldWithTooltip label="Público-Alvo">
                  <div className="flex flex-wrap gap-4 mt-2">
                    {[
                      { value: 'baixa_renda', label: 'Baixa Renda' },
                      { value: 'media_renda', label: 'Média Renda' },
                      { value: 'alta_renda', label: 'Alta Renda' },
                    ].map((item) => (
                      <div key={item.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={(formData.publicoAlvo || []).includes(item.value)}
                          onCheckedChange={() => handleArrayToggle('publicoAlvo', item.value)}
                        />
                        <label className="text-sm">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </FieldWithTooltip>

                <div className="grid grid-cols-2 gap-4">
                  <FieldWithTooltip label="Número de Unidades">
                    <Input
                      value={formData.numeroUnidades || ''}
                      onChange={(e) => updateField('numeroUnidades', e.target.value)}
                      placeholder="Ex: 120"
                    />
                  </FieldWithTooltip>

                  <FieldWithTooltip label="Área Média por Unidade (m²)">
                    <Input
                      value={formData.areaMediaUnidade || ''}
                      onChange={(e) => updateField('areaMediaUnidade', e.target.value)}
                      placeholder="Ex: 65"
                    />
                  </FieldWithTooltip>
                </div>
              </>
            )}

            {setor === 'tech' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FieldWithTooltip label="Modelo de Negócio">
                    <Select value={formData.modeloNegocio || ''} onValueChange={(v) => updateField('modeloNegocio', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B2B">B2B</SelectItem>
                        <SelectItem value="B2C">B2C</SelectItem>
                        <SelectItem value="B2B2C">B2B2C</SelectItem>
                        <SelectItem value="Marketplace">Marketplace</SelectItem>
                        <SelectItem value="SaaS">SaaS por assinatura</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldWithTooltip>

                  <FieldWithTooltip label="Estágio">
                    <Select value={formData.estagio || ''} onValueChange={(v) => updateField('estagio', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pre-operacional">Pré-operacional</SelectItem>
                        <SelectItem value="MVP">MVP desenvolvido</SelectItem>
                        <SelectItem value="Operando">Operando com clientes</SelectItem>
                        <SelectItem value="Crescimento">Crescimento</SelectItem>
                        <SelectItem value="Scale-up">Scale-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldWithTooltip>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FieldWithTooltip label="Usuários Ativos">
                    <Input
                      value={formData.usuariosAtivos || ''}
                      onChange={(e) => updateField('usuariosAtivos', e.target.value)}
                      placeholder="Ex: 5000"
                    />
                  </FieldWithTooltip>

                  <FieldWithTooltip label="MRR" tooltip={tooltips.mrr}>
                    <Input
                      value={formData.mrr || ''}
                      onChange={(e) => updateField('mrr', e.target.value)}
                      placeholder="R$ 0,00"
                    />
                  </FieldWithTooltip>

                  <FieldWithTooltip label="Taxa de Churn (%)">
                    <Input
                      value={formData.churnRate || ''}
                      onChange={(e) => updateField('churnRate', e.target.value)}
                      placeholder="Ex: 5%"
                    />
                  </FieldWithTooltip>
                </div>
              </>
            )}

            {setor === 'agronegocio' && (
              <div className="grid grid-cols-2 gap-4">
                <FieldWithTooltip label="Tipo de Solo">
                  <Input
                    value={formData.tipoSolo || ''}
                    onChange={(e) => updateField('tipoSolo', e.target.value)}
                    placeholder="Ex: Terra roxa"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="Fonte de Água">
                  <Input
                    value={formData.fonteAgua || ''}
                    onChange={(e) => updateField('fonteAgua', e.target.value)}
                    placeholder="Ex: Rio, Poço artesiano"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="Produtividade Esperada">
                  <Input
                    value={formData.produtividadeEsperada || ''}
                    onChange={(e) => updateField('produtividadeEsperada', e.target.value)}
                    placeholder="Ex: 60 sacas/ha"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="Ciclo de Produção (meses)">
                  <Input
                    value={formData.cicloProdução || ''}
                    onChange={(e) => updateField('cicloProdução', e.target.value)}
                    placeholder="Ex: 12"
                  />
                </FieldWithTooltip>
              </div>
            )}

            {setor === 'infraestrutura' && (
              <div className="grid grid-cols-2 gap-4">
                <FieldWithTooltip label="Tipo de Projeto">
                  <Select value={formData.tipoProjetoInfra || ''} onValueChange={(v) => updateField('tipoProjetoInfra', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Greenfield">Greenfield (novo)</SelectItem>
                      <SelectItem value="Brownfield">Brownfield (expansão)</SelectItem>
                      <SelectItem value="Concessao">Concessão</SelectItem>
                      <SelectItem value="PPP">PPP</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWithTooltip>

                <FieldWithTooltip label="Prazo de Concessão (anos)">
                  <Input
                    value={formData.prazoConcessao || ''}
                    onChange={(e) => updateField('prazoConcessao', e.target.value)}
                    placeholder="Ex: 30"
                  />
                </FieldWithTooltip>
              </div>
            )}

            {(setor === 'negocios' || setor === 'outros') && (
              <FieldWithTooltip label="Descrição do Projeto">
                <Textarea
                  value={formData.descricaoProjeto || ''}
                  onChange={(e) => updateField('descricaoProjeto', e.target.value)}
                  rows={4}
                  placeholder="Descreva detalhes do projeto..."
                />
              </FieldWithTooltip>
            )}
          </TabsContent>

          {/* Tab Financeiro */}
          <TabsContent value="financeiro" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Dados Financeiros</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldWithTooltip label="Valor do Investimento (R$)">
                <Input
                  type="number"
                  value={formData.valor_investimento}
                  onChange={(e) => updateField('valor_investimento', Number(e.target.value))}
                  placeholder="R$ 0,00"
                />
              </FieldWithTooltip>

              <FieldWithTooltip label="Ticket Mínimo" tooltip={tooltips.ticketMinimo}>
                <Input
                  value={formData.ticketMinimo || ''}
                  onChange={(e) => updateField('ticketMinimo', e.target.value)}
                  placeholder="R$ 0,00"
                />
              </FieldWithTooltip>

              <FieldWithTooltip label="TIR Projetada (%)" tooltip={tooltips.tirProjetada}>
                <Input
                  value={formData.tirProjetada || ''}
                  onChange={(e) => updateField('tirProjetada', e.target.value)}
                  placeholder="Ex: 18%"
                />
              </FieldWithTooltip>

              <FieldWithTooltip label="Prazo da Operação (meses)">
                <Input
                  value={formData.prazoOperacao || ''}
                  onChange={(e) => updateField('prazoOperacao', e.target.value)}
                  placeholder="Ex: 24"
                />
              </FieldWithTooltip>
            </div>

            {setor === 'imobiliario' && (
              <div className="grid grid-cols-2 gap-4">
                <FieldWithTooltip label="VGV Estimado" tooltip={tooltips.vgvEstimado}>
                  <Input
                    value={formData.vgvEstimado || ''}
                    onChange={(e) => updateField('vgvEstimado', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="Custo Total da Obra">
                  <Input
                    value={formData.custoTotalObra || ''}
                    onChange={(e) => updateField('custoTotalObra', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="Margem de Lucro (%)">
                  <Input
                    value={formData.margemLucro || ''}
                    onChange={(e) => updateField('margemLucro', e.target.value)}
                    placeholder="Ex: 25%"
                  />
                </FieldWithTooltip>
              </div>
            )}

            {setor === 'tech' && (
              <div className="grid grid-cols-2 gap-4">
                <FieldWithTooltip label="Valuation (R$)">
                  <Input
                    value={formData.valuation || ''}
                    onChange={(e) => updateField('valuation', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="ARR" tooltip={tooltips.arr}>
                  <Input
                    value={formData.arr || ''}
                    onChange={(e) => updateField('arr', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="LTV" tooltip={tooltips.ltv}>
                  <Input
                    value={formData.ltv || ''}
                    onChange={(e) => updateField('ltv', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="CAC" tooltip={tooltips.cac}>
                  <Input
                    value={formData.cac || ''}
                    onChange={(e) => updateField('cac', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </FieldWithTooltip>
              </div>
            )}

            {setor === 'infraestrutura' && (
              <div className="grid grid-cols-2 gap-4">
                <FieldWithTooltip label="CAPEX Total" tooltip={tooltips.capex}>
                  <Input
                    value={formData.capex || ''}
                    onChange={(e) => updateField('capex', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="OPEX Anual" tooltip={tooltips.opex}>
                  <Input
                    value={formData.opex || ''}
                    onChange={(e) => updateField('opex', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="Payback (anos)">
                  <Input
                    value={formData.payback || ''}
                    onChange={(e) => updateField('payback', e.target.value)}
                    placeholder="Ex: 8"
                  />
                </FieldWithTooltip>
              </div>
            )}

            {setor === 'negocios' && (
              <div className="grid grid-cols-2 gap-4">
                <FieldWithTooltip label="Faturamento Anual">
                  <Input
                    value={formData.faturamentoAnual || ''}
                    onChange={(e) => updateField('faturamentoAnual', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="EBITDA" tooltip={tooltips.ebitda}>
                  <Input
                    value={formData.ebitda || ''}
                    onChange={(e) => updateField('ebitda', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip label="Margem EBITDA (%)">
                  <Input
                    value={formData.margemEbitda || ''}
                    onChange={(e) => updateField('margemEbitda', e.target.value)}
                    placeholder="Ex: 15%"
                  />
                </FieldWithTooltip>
              </div>
            )}

            <FieldWithTooltip label="Link Google Drive">
              <Input
                value={formData.googleDriveLink || ''}
                onChange={(e) => updateField('googleDriveLink', e.target.value)}
                placeholder="https://drive.google.com/..."
              />
            </FieldWithTooltip>
          </TabsContent>
        </Tabs>
      </FormModalContent>
    </GenericModal>
  );
}
