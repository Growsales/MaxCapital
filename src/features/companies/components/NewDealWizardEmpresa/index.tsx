import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Building2, 
  Layers, 
  TrendingUp, 
  Briefcase,
  Save,
  Send,
  Loader2,
  Shield
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/dialog';
import { Progress } from '@/shared/components/progress';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/shared/hooks/useAuth';
import { useCreateOperacao } from '@/features/operations/api/useOperacoes';
import { useCreateEmpresa } from '@/features/companies/api/useEmpresas';

import { StepLGPDEmpresa } from './StepLGPDEmpresa';
import { StepInformacoesCadastrais } from './StepInformacoesCadastrais';
import { StepClassificacao } from './StepClassificacao';
import { StepInformacoesFinanceiras } from './StepInformacoesFinanceiras';
import { StepTipoOperacao } from './StepTipoOperacao';
import { EmpresaFormData, initialEmpresaFormData } from './types';
import { getSetores } from '@/lib/setores-segmentos';

interface NewDealWizardEmpresaProps {
  open: boolean;
  onClose: () => void;
}

/**
 * DEPRECATED: Use NewDealWizardEmpresaV2 instead
 * This component is kept for backward compatibility
 */

const STORAGE_KEY = 'new-deal-wizard-empresa-draft';

const steps = [
  { id: 1, title: 'Confidencialidade', icon: Shield },
  { id: 2, title: 'Informações Cadastrais', icon: Building2 },
  { id: 3, title: 'Classificação', icon: Layers },
  { id: 4, title: 'Informações Financeiras', icon: TrendingUp },
  { id: 5, title: 'Tipo de Operação', icon: Briefcase },
];

export function NewDealWizardEmpresa({ open, onClose }: NewDealWizardEmpresaProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EmpresaFormData>(initialEmpresaFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const createOperacao = useCreateOperacao();
  const createEmpresa = useCreateEmpresa();

  // Load draft from localStorage
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(parsed);
        } catch (e) {
          console.error('Error loading draft:', e);
        }
      }
    }
  }, [open]);

  // Save draft to localStorage
  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    toast({
      title: 'Rascunho salvo!',
      description: 'Seu progresso foi salvo localmente.',
    });
  };

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleUpdate = (field: keyof EmpresaFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // LGPD
        if (!formData.lgpdAccepted) {
          toast({
            title: 'Aceite obrigatório',
            description: 'Você precisa aceitar os termos de confidencialidade para continuar.',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      
      case 2: // Informações Cadastrais
        if (!formData.nomeEmpresarial.trim()) {
          toast({
            title: 'Nome obrigatório',
            description: 'Informe o nome empresarial.',
            variant: 'destructive',
          });
          return false;
        }
        if (!formData.cnpj.trim()) {
          toast({
            title: 'CNPJ obrigatório',
            description: 'Informe o CNPJ da empresa.',
            variant: 'destructive',
          });
          return false;
        }
        if (!formData.emailEmpresario.trim()) {
          toast({
            title: 'E-mail obrigatório',
            description: 'Informe o e-mail do empresário.',
            variant: 'destructive',
          });
          return false;
        }
        if (!formData.recuperacaoJudicial) {
          toast({
            title: 'Campo obrigatório',
            description: 'Informe se a empresa está em recuperação judicial.',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      
      case 3: // Classificação
        if (!formData.tipoEmpresa) {
          toast({
            title: 'Seleção obrigatória',
            description: 'Selecione o tipo da empresa (Economia Real ou Tecnologia).',
            variant: 'destructive',
          });
          return false;
        }
        if (!formData.setores || formData.setores.length === 0) {
          toast({
            title: 'Seleção obrigatória',
            description: 'Selecione pelo menos um setor.',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      
      case 4: // Financeiro
        // Financeiro é opcional, mas se tiver dívidas, validar
        if (formData.possuiDividas === 'sim') {
          const temDivida = formData.endividamentoBancario || 
                           formData.endividamentoFornecedores || 
                           formData.endividamentoTributario || 
                           formData.outrosEndividamentos;
          if (!temDivida) {
            toast({
              title: 'Detalhe as dívidas',
              description: 'Informe pelo menos um tipo de endividamento.',
              variant: 'destructive',
            });
            return false;
          }
        }
        return true;
      
      case 5: // Tipo de Operação
        if (!formData.tiposOperacao || formData.tiposOperacao.length === 0) {
          toast({
            title: 'Seleção obrigatória',
            description: 'Selecione pelo menos um tipo de operação.',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  const getSegmentoLabel = (): string => {
    const setores = getSetores();
    const selectedSetor = setores.find(s => formData.setores?.includes(s.value));
    return selectedSetor?.label || 'Comercial';
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para criar uma operação.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Map tipo to valid Segmento
      const segmentoMap: Record<string, 'Startups' | 'Comercial' | 'Agronegócio' | 'Imobiliário' | 'Energia' | 'Ativos judiciais' | 'Outros'> = {
        'tecnologia': 'Startups',
        'economia_real': 'Comercial',
      };
      
      const segmentoValue = segmentoMap[formData.tipoEmpresa] || 'Comercial';
      
      // Calculate total value from financials
      const valorOperacao = parseCurrency(formData.faturamento2025) || 
                           parseCurrency(formData.faturamento2024) || 
                           parseCurrency(formData.faturamento2023) || 
                           0;

      // First, create the empresa
      const empresaData = {
        nome: formData.nomeEmpresarial,
        cnpj: formData.cnpj.replace(/\D/g, '') || '00000000000000',
        nome_fantasia: formData.nomeFantasia || null,
        segmento: segmentoValue,
        contato_email: formData.emailEmpresario || user.email || '',
        telefone: null,
        responsavel_id: user.id,
        valor_operacao: valorOperacao,
        tipo_operacao: 'Incorporação' as const,
        endereco_cep: null,
        endereco_logradouro: null,
        endereco_numero: null,
        endereco_complemento: null,
        endereco_bairro: null,
        endereco_cidade: null,
        endereco_uf: null,
        status_cadastro: 'incompleto' as const,
        criado_por_id: user.id,
      };

      const empresa = await createEmpresa.mutateAsync(empresaData);

      // Generate funil number
      const funilNumber = `OP-${Date.now().toString(36).toUpperCase()}`;

      // Create the operação with all form data
      await createOperacao.mutateAsync({
        numero_funil: funilNumber,
        empresa_id: empresa.id,
        etapa_atual: 'Prospecto',
        sub_etapa: null,
        valor_investimento: valorOperacao,
        tipo_capital: 'Captação',
        segmento: segmentoValue,
        responsavel_id: user.id,
        office: 'Sudeste',
        lead_tag: 'frio',
        status_exclusividade: 'Sem exclusividade',
        data_exclusividade: null,
        observacoes: JSON.stringify({
          // All form data for empresa
          ...formData,
          setorLabel: getSegmentoLabel(),
          origemFormulario: 'empresa',
        }),
      });

      clearDraft();
      
      toast({
        title: 'Operação enviada!',
        description: 'Sua operação foi enviada para análise com sucesso.',
      });

      handleClose();
    } catch (error: any) {
      console.error('Error creating operation:', error);
      toast({
        title: 'Erro ao criar operação',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData(initialEmpresaFormData);
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepLGPDEmpresa formData={formData} onUpdate={handleUpdate} />;
      case 2:
        return <StepInformacoesCadastrais formData={formData} onUpdate={handleUpdate} />;
      case 3:
        return <StepClassificacao formData={formData} onUpdate={handleUpdate} />;
      case 4:
        return <StepInformacoesFinanceiras formData={formData} onUpdate={handleUpdate} />;
      case 5:
        return <StepTipoOperacao formData={formData} onUpdate={handleUpdate} />;
      default:
        return null;
    }
  };

  const progress = (currentStep / 5) * 100;
  const stepInfo = steps[currentStep - 1];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden p-0 bg-background">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Novo Negócio - Empresa
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="sr-only">
              Formulário de cadastro de novo negócio para empresas
            </DialogDescription>
          </DialogHeader>

          {/* Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {stepInfo && <stepInfo.icon className="h-4 w-4 text-primary" />}
                <span className="font-medium text-foreground">
                  Etapa {currentStep} de 5: {stepInfo?.title}
                </span>
              </div>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators - Compact for 5 steps */}
          <div className="flex items-center justify-between mt-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all flex-shrink-0 ${
                    currentStep >= step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  <step.icon className="h-3.5 w-3.5" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 sm:w-14 h-0.5 mx-0.5 transition-colors ${
                      currentStep > step.id ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? handleClose : handleBack}
              disabled={isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Cancelar' : 'Voltar'}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={isSubmitting}
                className="hidden sm:flex"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </Button>
              
              {currentStep < 5 ? (
                <Button onClick={handleNext} className="btn-primary">
                  Continuar
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar para Análise
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
