/**
 * NewDealWizard - Unified 5-step wizard
 * Steps: LGPD → Dados Cadastrais → Setor → Segmento → Formulário Completo (dynamic per setor/segmento)
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Shield, Building2, Layers,
  FileText, Save, Send, Loader2, CheckCircle2, TrendingUp,
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/shared/hooks/useAuth';
import { useCreateOperacao } from '@/hooks/useOperacoes';
import { useCreateEmpresa } from '@/hooks/useEmpresas';
import { cn } from '@/lib/utils';

import { StepLGPD } from './StepLGPD';
import { StepDadosCadastrais } from './steps/StepDadosCadastrais';
import { StepSetor } from './StepSetor';
import { StepSegmento } from './StepSegmento';
import { StepFormularioDinamico } from './steps/StepFormularioDinamico';
import { WizardFormData, initialFormData } from './types';

export interface PrefilledEmpresa {
  id: string;
  nome: string;
  cnpj: string;
  segmento?: string;
  contato_email?: string;
  telefone?: string;
  endereco_cep?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
}

interface NewDealWizardProps {
  open: boolean;
  onClose: () => void;
  prefilledEmpresa?: PrefilledEmpresa;
}

const STORAGE_KEY = 'new-deal-wizard-draft';

const STEPS = [
  { key: 'lgpd', title: 'Termo LGPD', icon: Shield },
  { key: 'dados_cadastrais', title: 'Dados Cadastrais', icon: Building2 },
  { key: 'setor', title: 'Setor', icon: Layers },
  { key: 'segmento', title: 'Segmento', icon: Layers },
  { key: 'formulario', title: 'Formulário Completo', icon: FileText },
];

export function NewDealWizard({ open, onClose, prefilledEmpresa }: NewDealWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fundosConfig, setFundosConfig] = useState({ quantidade: '15', mensagem: '' });
  const [selectedExistingEmpresaId, setSelectedExistingEmpresaId] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const createOperacao = useCreateOperacao();
  const createEmpresa = useCreateEmpresa();

  const totalSteps = STEPS.length;
  const stepConfig = STEPS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const StepIcon = stepConfig.icon;

  // Pre-fill from empresa when provided
  useEffect(() => {
    if (open && prefilledEmpresa) {
      const segReverseMap: Record<string, string> = {
        'Agronegócio': 'agronegocio', 'Energia': 'infraestrutura', 'Imobiliário': 'imobiliario',
        'Startups': 'tech', 'Comercial': 'negocios', 'Outros': 'outros',
      };
      setFormData(prev => ({
        ...prev,
        nomeProjeto: prefilledEmpresa.nome || '',
        cnpj: prefilledEmpresa.cnpj || '',
        setor: prefilledEmpresa.segmento ? (segReverseMap[prefilledEmpresa.segmento] || '') : '',
        cep: prefilledEmpresa.endereco_cep || '',
        cidade: prefilledEmpresa.endereco_cidade || '',
        uf: prefilledEmpresa.endereco_uf || '',
      }));
      return; // skip draft loading when prefilled
    }
    if (open) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { setFormData(JSON.parse(saved)); } catch { /* ignore */ }
      }
    }
  }, [open, prefilledEmpresa]);

  // Load funds config
  useEffect(() => {
    if (open) {
      try {
        const raw = localStorage.getItem('admin-configuracoes-cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          setFundosConfig({
            quantidade: parsed.fundos_disponiveis_quantidade || '15',
            mensagem: parsed.fundos_disponiveis_mensagem || '',
          });
        }
      } catch { /* ignore */ }
    }
  }, [open]);

  const handleUpdate = (field: keyof WizardFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    toast({ title: 'Rascunho salvo!', description: 'Seu progresso foi salvo localmente.' });
  };

  const validateStep = (): boolean => {
    switch (stepConfig.key) {
      case 'lgpd':
        if (!formData.lgpdAccepted) {
          toast({ title: 'Aceite obrigatório', description: 'Você precisa aceitar os termos.', variant: 'destructive' });
          return false;
        }
        return true;
      case 'dados_cadastrais':
        if (!formData.nomeProjeto.trim()) {
          toast({ title: 'Nome obrigatório', description: 'Informe o nome do projeto.', variant: 'destructive' });
          return false;
        }
        if (!formData.cnpj.trim()) {
          toast({ title: 'CNPJ obrigatório', description: 'Informe o CNPJ.', variant: 'destructive' });
          return false;
        }
        return true;
      case 'setor':
        if (!formData.setor) {
          toast({ title: 'Selecione um setor', description: 'Escolha o setor da operação.', variant: 'destructive' });
          return false;
        }
        return true;
      case 'segmento':
        if (!formData.segmento) {
          toast({ title: 'Selecione um segmento', description: 'Escolha o segmento específico.', variant: 'destructive' });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
  };

  const handleSubmit = async () => {
    if (!validateStep() || !user) return;
    setIsSubmitting(true);

    try {
      const segMap: Record<string, 'Startups' | 'Comercial' | 'Agronegócio' | 'Imobiliário' | 'Energia' | 'Ativos judiciais' | 'Outros'> = {
        agronegocio: 'Agronegócio', infraestrutura: 'Energia', imobiliario: 'Imobiliário',
        tech: 'Startups', negocios: 'Comercial', outros: 'Outros',
      };
      const segmentoValue = segMap[formData.setor] || 'Outros';

      let empresaId: string;

      if (prefilledEmpresa) {
        empresaId = prefilledEmpresa.id;
      } else if (selectedExistingEmpresaId) {
        empresaId = selectedExistingEmpresaId;
      } else {
        // Create new empresa
        const empresa = await createEmpresa.mutateAsync({
          nome: formData.nomeProjeto,
          cnpj: formData.cnpj.replace(/\D/g, '') || '00000000000000',
          nome_fantasia: null, segmento: segmentoValue,
          contato_email: user.email || '', telefone: null,
          responsavel_id: user.id,
          valor_operacao: parseCurrency(formData.investimentoNecessario || formData.valorTotal),
          tipo_operacao: 'Incorporação' as const,
          endereco_cep: formData.cep || null, endereco_logradouro: null,
          endereco_numero: null, endereco_complemento: null, endereco_bairro: null,
          endereco_cidade: formData.cidade || null, endereco_uf: formData.uf || null,
          status_cadastro: 'incompleto' as const, criado_por_id: user.id,
        });
        empresaId = empresa.id;
      }

      await createOperacao.mutateAsync({
        numero_funil: `OP-${Date.now().toString(36).toUpperCase()}`,
        empresa_id: empresaId, etapa_atual: 'Prospecto', sub_etapa: null,
        valor_investimento: parseCurrency(formData.investimentoNecessario || formData.valorTotal),
        tipo_capital: 'Captação', segmento: segmentoValue,
        responsavel_id: user.id, office: 'Sudeste',
        lead_tag: 'frio', status_exclusividade: 'Sem exclusividade',
        data_exclusividade: null, observacoes: JSON.stringify({ ...formData }),
      });

      localStorage.removeItem(STORAGE_KEY);
      setShowSuccess(true);
    } catch (error: any) {
      toast({ title: 'Erro ao criar operação', description: error.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFormData(initialFormData);
    setShowSuccess(false);
    onClose();
  };

  const getSuccessMessage = () => {
    const q = fundosConfig.quantidade || '15';
    return fundosConfig.mensagem
      ? fundosConfig.mensagem.replace('{quantidade}', q)
      : `Identificamos ${q} fundos com potencial interesse em investir no seu negócio. Nossa equipe entrará em contato em breve.`;
  };

  const renderStep = () => {
    switch (stepConfig.key) {
      case 'lgpd': return <StepLGPD formData={formData} onUpdate={handleUpdate} onAccept={handleNext} />;
      case 'dados_cadastrais': return <StepDadosCadastrais formData={formData} onUpdate={handleUpdate} onSelectEmpresaId={setSelectedExistingEmpresaId} />;
      case 'setor': return <StepSetor formData={formData} onUpdate={handleUpdate} />;
      case 'segmento': return <StepSegmento formData={formData} onUpdate={handleUpdate} />;
      case 'formulario': return <StepFormularioDinamico formData={formData} onUpdate={handleUpdate} />;
      default: return null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[720px] max-h-[92vh] overflow-hidden p-0 bg-background border-0 shadow-2xl">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 bg-card">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <StepIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold tracking-tight">Novo Negócio</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Etapa {currentStep + 1} de {totalSteps} — {stepConfig.title}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full tabular-nums">
                  {Math.round(progress)}%
                </span>
              </div>
            </DialogHeader>

            <div className="mt-4 flex items-center gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= currentStep ? 'bg-primary' : 'bg-border/60')} />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 195px)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={stepConfig.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost" size="sm"
                onClick={currentStep === 0 ? handleClose : handleBack}
                disabled={isSubmitting}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {currentStep === 0 ? 'Cancelar' : 'Voltar'}
              </Button>

              <div className="flex items-center gap-2">
                {isLastStep ? (
                  <>
                    <Button variant="outline" size="sm" onClick={saveDraft} disabled={isSubmitting} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      Rascunho
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="btn-primary gap-1.5 shadow-lg shadow-primary/20">
                      {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Enviar para Análise
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleNext} size="sm" className="btn-primary gap-1.5 shadow-lg shadow-primary/20">
                    Continuar
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[480px] p-0 bg-background border-0 shadow-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="p-7 space-y-5">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Operação registrada</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">Sua operação foi enviada para análise pela nossa equipe.</p>
              </div>
            </div>
            <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">{fundosConfig.quantidade || '15'} fundos com potencial interesse</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{getSuccessMessage()}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose} size="sm" className="btn-primary shadow-lg shadow-primary/20">Entendido</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
