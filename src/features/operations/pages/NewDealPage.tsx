/**
 * NewDealPage - Full-screen page for the final form step (Formulário Completo)
 * Steps 1-4 are handled in the modal wizard (NewDealModalWizard).
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, FileText, Save, Send, Loader2, CheckCircle2, TrendingUp, X, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/shared/hooks/useAuth';
import { useCreateOperacao, useUpdateOperacao } from '@/hooks/useOperacoes';
import { useCreateEmpresa } from '@/hooks/useEmpresas';

import { StepFormularioDinamico } from '@/features/operations/components/NewDealWizard/steps/StepFormularioDinamico';
import { WizardFormData, initialFormData } from '@/features/operations/components/NewDealWizard/types';

const STORAGE_KEY = 'new-deal-wizard-draft';
const DRAFT_OP_KEY = 'new-deal-draft-operation-id';

export default function NewDealPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [fundosConfig, setFundosConfig] = useState({ quantidade: '15', mensagem: '' });
  const draftOperationId = useRef<string | null>(null);

  const { toast } = useToast();
  const { user, profile } = useAuth();
  const createOperacao = useCreateOperacao();
  const updateOperacao = useUpdateOperacao();
  const createEmpresa = useCreateEmpresa();
  const isInvestidor = profile?.tipo === 'investidor';

  // Load draft (saved by modal wizard)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedOpId = localStorage.getItem(DRAFT_OP_KEY);
    if (savedOpId) draftOperationId.current = savedOpId;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.setor || !parsed.segmento) {
          navigate(-1);
          return;
        }
        setFormData(parsed);
      } catch {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, []);

  // Load funds config
  useEffect(() => {
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
  }, []);

  const handleUpdate = (field: keyof WizardFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
  };

  const getSegmentoValue = () => {
    const segMap: Record<string, 'Startups' | 'Comercial' | 'Agronegócio' | 'Imobiliário' | 'Energia' | 'Ativos judiciais' | 'Outros'> = {
      agronegocio: 'Agronegócio', infraestrutura: 'Energia', imobiliario: 'Imobiliário',
      tech: 'Startups', negocios: 'Comercial', outros: 'Outros',
    };
    return segMap[formData.setor] || 'Outros';
  };

  /**
   * Salvar rascunho — cria/atualiza operação no banco como Prospecto com flag _draft
   */
  const saveDraft = async () => {
    if (!user) return;
    setIsSavingDraft(true);

    try {
      const segmentoValue = getSegmentoValue();
      const observacoesData = { _draft: true, _progress: formProgress, formData };

      if (draftOperationId.current) {
        // Update existing draft operation
        await updateOperacao.mutateAsync({
          id: draftOperationId.current,
          valor_investimento: parseCurrency(formData.investimentoNecessario || formData.valorTotal),
          observacoes: JSON.stringify(observacoesData),
        });
      } else {
        // Create empresa + operation as draft
        const empresa = await createEmpresa.mutateAsync({
          nome: formData.nomeProjeto || 'Rascunho - Sem nome',
          cnpj: formData.cnpj?.replace(/\D/g, '') || '00000000000000',
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

        const op = await createOperacao.mutateAsync({
          numero_funil: `OP-${Date.now().toString(36).toUpperCase()}`,
          empresa_id: empresa.id, etapa_atual: 'Prospecto', sub_etapa: null,
          valor_investimento: parseCurrency(formData.investimentoNecessario || formData.valorTotal),
          tipo_capital: 'Captação', segmento: segmentoValue,
          responsavel_id: user.id, office: 'Sudeste',
          lead_tag: 'frio', status_exclusividade: 'Sem exclusividade',
          data_exclusividade: null,
          observacoes: JSON.stringify(observacoesData),
        });

        draftOperationId.current = op.id;
        localStorage.setItem(DRAFT_OP_KEY, op.id);
      }

      // Also save locally
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      toast({ title: 'Rascunho salvo!', description: 'Sua operação foi salva como rascunho em Prospecto.' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar rascunho', description: error.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const segmentoValue = getSegmentoValue();

      if (draftOperationId.current) {
        // Update existing draft → mark as complete
        await updateOperacao.mutateAsync({
          id: draftOperationId.current,
          valor_investimento: parseCurrency(formData.investimentoNecessario || formData.valorTotal),
          observacoes: JSON.stringify({ ...formData }),
        });
      } else {
        // Create new empresa + operation
        const empresa = await createEmpresa.mutateAsync({
          nome: formData.nomeProjeto,
          cnpj: formData.cnpj?.replace(/\D/g, '') || '00000000000000',
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

        await createOperacao.mutateAsync({
          numero_funil: `OP-${Date.now().toString(36).toUpperCase()}`,
          empresa_id: empresa.id, etapa_atual: 'Prospecto', sub_etapa: null,
          valor_investimento: parseCurrency(formData.investimentoNecessario || formData.valorTotal),
          tipo_capital: 'Captação', segmento: segmentoValue,
          responsavel_id: user.id, office: 'Sudeste',
          lead_tag: 'frio', status_exclusividade: 'Sem exclusividade',
          data_exclusividade: null, observacoes: JSON.stringify({ ...formData }),
        });
      }

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DRAFT_OP_KEY);
      draftOperationId.current = null;
      setShowSuccess(true);
    } catch (error: any) {
      toast({ title: 'Erro ao criar operação', description: error.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    navigate(-1);
  };

  const handleCloseClick = () => {
    setShowExitConfirm(true);
  };

  const getSuccessMessage = () => {
    const q = fundosConfig.quantidade || '15';
    return fundosConfig.mensagem
      ? fundosConfig.mensagem.replace('{quantidade}', q)
      : `Identificamos ${q} fundos com potencial interesse em investir no seu negócio. Nossa equipe entrará em contato em breve.`;
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full mx-4 p-7 space-y-5 bg-card rounded-2xl border border-border shadow-2xl"
        >
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
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-0 bg-gradient-to-r from-card via-card/95 to-card/90 backdrop-blur-xl border-b border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="w-full flex items-center justify-between h-[52px]">
          <div className="flex items-center gap-1 logo-text">
            <span className="font-bold text-foreground text-sm tracking-wide">MAX</span>
            <span className="w-px h-4 bg-primary mx-1" />
            <span className="font-medium text-muted-foreground text-sm">CAPITAL</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={saveDraft}
              disabled={isSubmitting || isSavingDraft}
              className="gap-2 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              {isSavingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar Rascunho
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || formProgress < 100}
              size="sm"
              className="gap-2 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-40 disabled:shadow-none transition-all duration-200"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Enviar para Análise
            </Button>
            <button
              onClick={handleCloseClick}
              className="group relative overflow-hidden ml-1 h-9 rounded-md border border-border/60 hover:border-destructive/40 transition-all duration-200"
              aria-label="Fechar"
            >
              <span className="inline-flex items-center justify-center w-16 translate-x-2 transition-opacity duration-500 group-hover:opacity-0 text-muted-foreground text-sm font-medium">
                Sair
              </span>
              <i className="absolute inset-0 z-10 grid w-1/4 place-items-center bg-destructive/10 transition-all duration-500 group-hover:w-full group-hover:bg-destructive/15">
                <X
                  className="opacity-60 group-hover:text-destructive"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </i>
            </button>
          </div>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <StepFormularioDinamico formData={formData} onUpdate={handleUpdate} onProgressChange={setFormProgress} onSubmit={handleSubmit} isSubmitting={isSubmitting} canSubmit={formProgress >= 100} />
        </div>
      </div>


      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-sm border-border/60 shadow-2xl p-0 overflow-hidden">
          <div className="p-6 pb-4 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="shrink-0 h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mt-0.5">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <div className="space-y-1.5">
                <AlertDialogHeader className="p-0 space-y-0">
                  <AlertDialogTitle className="text-[15px] font-semibold leading-snug">
                    Você tem certeza que deseja sair da submissão?
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription className="text-[13px] text-muted-foreground leading-relaxed">
                  Não se preocupe, todas as informações estão salvas em rascunho e você poderá continuar posteriormente.
                </AlertDialogDescription>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2.5 px-6 py-4 border-t border-border/40 bg-muted/20">
            <AlertDialogCancel className="h-9 px-4 text-[13px] font-medium rounded-lg">
              Continuar preenchendo
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              className="h-9 px-5 text-[13px] font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
            >
              Sair
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
