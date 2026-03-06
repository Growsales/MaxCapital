import { useState, useCallback } from 'react';
import { useSecurityForms } from '@/hooks/useSecurityForms';
import { Checkbox } from '@/shared/components/checkbox';
import {
  CheckCircle2,
  FileText,
  Phone,
  Calendar,
  Download,
  Shield,
  Sparkles,
  HandHeart,
  ArrowRight,
  Loader2,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/dialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/shared/components/separator';

interface ManifestInterestModalProps {
  open: boolean;
  onClose: () => void;
  opportunityName: string;
  onSuccess: () => void;
}

export function ManifestInterestModal({ 
  open, 
  onClose, 
  opportunityName,
  onSuccess 
}: ManifestInterestModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const { getFirstActive } = useSecurityForms();
  const adminForm = getFirstActive('interesse');
  const handleSubmit = async () => {
    if (!termsAccepted) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setCurrentStep(2);
  };

  const handleComplete = () => {
    onSuccess();
    handleModalClose();
  };

  const handleModalClose = () => {
    onClose();
    setTimeout(() => {
      setCurrentStep(1);
      setTermsAccepted(false);
    }, 300);
  };

  const defaultItems = [
    { icon: Phone, title: 'Análise de Perfil', text: 'Nossa equipe entrará em contato em até 48 horas úteis para verificar se esta oportunidade é adequada aos seus objetivos.' },
    { icon: FileText, title: 'Documentação', text: 'Você terá acesso aos documentos completos da oferta para análise detalhada antes de qualquer compromisso.' },
    { icon: Shield, title: 'Sem Compromisso', text: 'A manifestação não constitui compromisso de investimento. Você poderá desistir a qualquer momento.' },
  ];

  // Use admin clauses as cards if available, otherwise defaults
  const termsItems = adminForm
    ? adminForm.clauses.slice(0, 3).map((c, i) => ({
        icon: [Phone, FileText, Shield][i] || Shield,
        title: c.title.replace(/^\d+\.\s*/, ''),
        text: c.content.slice(0, 150) + (c.content.length > 150 ? '...' : ''),
      }))
    : defaultItems;

  const nextSteps = [
    { icon: Phone, text: 'Contato da equipe em até 48h úteis' },
    { icon: Calendar, text: 'Reunião para entender seu perfil' },
    { icon: FileText, text: 'Acesso aos documentos completos' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-border/50 bg-card">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <HandHeart className="h-5 w-5 text-primary" />
              </div>
              {/* Step indicator */}
              <div className="flex items-center gap-2 ml-auto">
                <div className={cn(
                  "h-2 w-8 rounded-full transition-colors",
                  currentStep >= 1 ? "bg-primary" : "bg-muted"
                )} />
                <div className={cn(
                  "h-2 w-8 rounded-full transition-colors",
                  currentStep >= 2 ? "bg-primary" : "bg-muted"
                )} />
              </div>
            </div>
            <DialogTitle className="text-xl">
              {currentStep === 1 ? 'Manifestar Interesse' : 'Interesse Registrado!'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {opportunityName}
            </DialogDescription>
          </DialogHeader>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="px-6 pb-6 space-y-5"
            >
              {/* Terms cards */}
              <div className="space-y-3">
                {termsItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Separator />

              {/* Terms viewer */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <Eye className="h-4 w-4" />
                  Ver termos completos
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showTerms && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showTerms && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed space-y-3 max-h-48 overflow-y-auto">
                        <p className="font-semibold text-foreground text-sm">{adminForm?.name ?? 'Termos de Manifestação de Interesse'}</p>
                        <p>Ao manifestar interesse nesta oportunidade de investimento, você declara estar ciente dos seguintes pontos:</p>
                        {(adminForm?.clauses ?? [
                          { id: '1', title: '1. Análise de Perfil', content: 'Nossa equipe especializada entrará em contato em até 48 horas úteis para avaliar a compatibilidade desta oportunidade com o seu perfil de investidor e seus objetivos financeiros.' },
                          { id: '2', title: '2. Acesso à Documentação', content: 'Após a análise inicial, você terá acesso integral aos documentos da oferta, incluindo prospecto, relatórios financeiros e termo de adesão, para sua análise detalhada antes de qualquer compromisso.' },
                          { id: '3', title: '3. Sem Compromisso', content: 'A manifestação de interesse não constitui compromisso de investimento, reserva de valores ou obrigação de aporte. Você poderá desistir a qualquer momento sem ônus.' },
                          { id: '4', title: '4. Confidencialidade', content: 'Todas as informações compartilhadas durante o processo são tratadas com sigilo e em conformidade com a LGPD (Lei Geral de Proteção de Dados).' },
                          { id: '5', title: '5. Riscos', content: 'Todo investimento envolve riscos. Recomendamos a leitura completa dos documentos e, se necessário, a consulta a um assessor financeiro independente antes de tomar qualquer decisão.' },
                        ]).map((clause) => (
                          <p key={clause.id}><strong className="text-foreground">{clause.title}:</strong> {clause.content}</p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accept checkbox */}
              <div 
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all",
                  termsAccepted 
                    ? "border-primary/50 bg-primary/5" 
                    : "border-border/50 hover:border-border"
                )}
                onClick={() => setTermsAccepted(!termsAccepted)}
              >
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer text-muted-foreground">
                  {adminForm?.checkboxLabel ?? 'Li e aceito os termos de manifestação de interesse. Entendo que a equipe entrará em contato para dar continuidade ao processo.'}
                </label>
              </div>

              {/* Next steps preview */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {nextSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <step.icon className="h-3.5 w-3.5 text-primary" />
                    <span>{step.text}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleModalClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!termsAccepted || isSubmitting}
                  className="flex-1 gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      Confirmar Interesse
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="px-6 pb-6 space-y-6"
            >
              {/* Success animation */}
              <div className="text-center space-y-3 py-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Sparkles className="h-8 w-8 text-primary" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Tudo certo!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sua manifestação foi registrada com sucesso.
                  </p>
                </div>
              </div>

              {/* Documents available */}
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border/50">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Documentos Desbloqueados
                  </p>
                </div>
                <div className="divide-y divide-border/50">
                  {[
                    'Prospecto da Oferta',
                    'Relatório Financeiro',
                    'Termo de Adesão',
                  ].map((doc, i) => (
                    <motion.div
                      key={doc}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                    >
                      <span className="text-sm text-foreground">{doc}</span>
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary">
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Operação enviada para a etapa de Matchmaking
              </p>

              <Button onClick={handleComplete} className="w-full gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Concluir
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
