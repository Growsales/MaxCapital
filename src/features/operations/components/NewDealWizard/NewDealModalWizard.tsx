/**
 * NewDealModalWizard - Modal wizard for steps 1-4 (LGPD → Dados Cadastrais → Setor → Segmento)
 * For investors: skips Setor step and auto-sets setor to '_investidor_tese'.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/shared/hooks/useAuth';
import { Dialog, DialogContent } from '@/shared/components/dialog';

import { StepLGPD } from './StepLGPD';
import { StepDadosCadastrais } from './steps/StepDadosCadastrais';
import { StepSetor } from './StepSetor';
import { StepSegmento } from './StepSegmento';
import { WizardFormData, initialFormData } from './types';

const STORAGE_KEY = 'new-deal-wizard-draft';

export interface PrefilledEmpresa {
  id: string;
  nome: string;
  cnpj: string;
  segmento?: string;
}

interface NewDealModalWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledEmpresa?: PrefilledEmpresa;
}

export function NewDealModalWizard({ open, onOpenChange, prefilledEmpresa }: NewDealModalWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const { toast } = useToast();
  const { profile } = useAuth();

  const isInvestidor = profile?.tipo === 'investidor';

  // Investors skip the Setor step — setor is auto-set to '_investidor_tese'
  const STEP_KEYS = useMemo(() => {
    if (isInvestidor) return ['lgpd', 'dados_cadastrais', 'segmento'] as const;
    return ['lgpd', 'dados_cadastrais', 'setor', 'segmento'] as const;
  }, [isInvestidor]);

  const stepKey = STEP_KEYS[currentStep];

  // Auto-set setor for investors
  useEffect(() => {
    if (isInvestidor && formData.setor !== '_investidor_tese') {
      setFormData(prev => ({ ...prev, setor: '_investidor_tese' }));
    }
  }, [isInvestidor]);

  // Load draft or prefill on open
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
      }));
      return;
    }
    if (open) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (isInvestidor) parsed.setor = '_investidor_tese';
          setFormData(parsed);
        } catch { /* ignore */ }
      } else if (isInvestidor) {
        setFormData(prev => ({ ...prev, setor: '_investidor_tese' }));
      }
    }
  }, [open, isInvestidor, prefilledEmpresa]);

  // Reset step when modal closes
  useEffect(() => {
    if (!open) setCurrentStep(0);
  }, [open]);

  const handleUpdate = (field: keyof WizardFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (): boolean => {
    switch (stepKey) {
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
          toast({ title: 'Selecione um setor', variant: 'destructive' });
          return false;
        }
        return true;
      case 'segmento':
        if (!formData.segmento) {
          toast({ title: 'Selecione um segmento', variant: 'destructive' });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (currentStep < STEP_KEYS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last modal step — save and go to full-screen
      const dataToSave = prefilledEmpresa 
        ? { ...formData, _prefilledEmpresaId: prefilledEmpresa.id }
        : formData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      onOpenChange(false);
      navigate('/operacoes/novo');
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    goNext();
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSetorSelect = (field: keyof WizardFormData, value: any) => {
    handleUpdate(field, value);
    handleUpdate('segmento', '');
  };

  const handleSegmentoSelect = (field: keyof WizardFormData, value: any) => {
    handleUpdate(field, value);
  };

  const renderStep = () => {
    switch (stepKey) {
      case 'lgpd':
        return <StepLGPD formData={formData} onUpdate={handleUpdate} onAccept={handleNext} />;
      case 'dados_cadastrais':
        return <StepDadosCadastrais formData={formData} onUpdate={handleUpdate} />;
      case 'setor':
        return <StepSetor formData={formData} onUpdate={handleSetorSelect} />;
      case 'segmento':
        return <StepSegmento formData={formData} onUpdate={handleSegmentoSelect} />;
      default:
        return null;
    }
  };

  const showBackButton = currentStep > 0;
  const showContinueButton = stepKey === 'dados_cadastrais' || stepKey === 'setor' || stepKey === 'segmento';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col border-0 shadow-2xl rounded-2xl [&>button]:hidden">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-5 right-5 z-10 p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 pt-10 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepKey}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer - only show if back or continue buttons needed */}
        {(showBackButton || showContinueButton) && (
          <div className="px-10 py-5 flex items-center justify-between">
            {showBackButton ? (
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                className="px-8 rounded-full"
              >
                Voltar
              </Button>
            ) : <div />}

            {showContinueButton && (
              <Button
                onClick={handleNext}
                size="lg"
                disabled={
                  (stepKey === 'segmento' && !formData.segmento) ||
                  (stepKey === 'setor' && !formData.setor)
                }
                className="btn-primary px-8 rounded-full shadow-lg shadow-primary/20"
              >
                {stepKey === 'segmento' ? 'Iniciar Submissão' : 'Continuar'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
