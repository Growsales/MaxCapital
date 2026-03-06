import { forwardRef } from 'react';
import { Copy, MessageCircle, Gift, Users, DollarSign, Loader2, AlertCircle, Share, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/alert';
import { Card, CardContent } from '@/shared/components/card';
import { Badge } from '@/shared/components/badge';
import { useCodigoConvite, useCompartilharWhatsApp, useMinhasIndicacoes } from '@/features/network/api/useIndicacoes';

const ReferralCard = forwardRef<HTMLDivElement>((_, ref) => {
  const { data: codigo, isLoading: isLoadingCodigo, error: codigoError } = useCodigoConvite();
  const { compartilhar, compartilharNativo, copiarLink, copiarCodigo, suportaCompartilhamentoNativo } = useCompartilharWhatsApp();
  const { data, error: indicacoesError } = useMinhasIndicacoes();
  const stats = data?.stats;

  const referralLink = codigo ? `${window.location.origin}/selecao-perfil?ref=${codigo}` : '';

  const hasDbError = codigoError || indicacoesError;
  const needsDbSetup = hasDbError && (
    String(codigoError).includes('indicacoes') ||
    String(indicacoesError).includes('indicacoes') ||
    String(codigoError).includes('PGRST') ||
    String(indicacoesError).includes('PGRST')
  );

  if (isLoadingCodigo) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6">
      {needsDbSetup && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuração do Banco de Dados Necessária</AlertTitle>
          <AlertDescription>
            A tabela de indicações ainda não foi criada. Execute as migrations SQL para habilitar o sistema.
          </AlertDescription>
        </Alert>
      )}

      {!codigo && !isLoadingCodigo && !needsDbSetup && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-500">Código ainda não gerado</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Seu código de indicação será gerado automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Section — Código de Indicação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden relative">
          {/* Subtle gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
          <CardContent className="p-8 relative">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Left — Title & Code */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Convide e Ganhe</h3>
                  <p className="text-sm text-muted-foreground">Compartilhe seu código e receba comissões</p>
                </div>
              </div>

              {/* Center — Code display */}
              <div className="flex-1 space-y-1.5">
                <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Seu código</span>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/40 border border-border/50">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-mono text-xl font-bold tracking-[0.15em] text-foreground">
                      {codigo || '---'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copiarCodigo}
                    disabled={!codigo}
                    className="h-[52px] w-[52px] shrink-0 hover:bg-primary/10 rounded-xl"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right — Share actions */}
              <div className="flex flex-row md:flex-col gap-2 md:w-52 shrink-0">
                <Button
                  className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white h-11 rounded-xl text-sm font-medium"
                  onClick={compartilhar}
                  disabled={!codigo}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 md:flex-none h-11 rounded-xl text-sm"
                  onClick={copiarLink}
                  disabled={!codigo}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                {suportaCompartilhamentoNativo && (
                  <Button
                    variant="secondary"
                    className="flex-1 md:flex-none h-11 rounded-xl text-sm"
                    onClick={compartilharNativo}
                    disabled={!codigo}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Mais opções
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Commission Tiers */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          {
            nivel: 1,
            title: 'Indicação Direta',
            percent: '2%',
            desc: 'Comissão sobre operações fechadas por pessoas que você indicou diretamente',
            border: 'border-l-primary',
            circleClass: 'bg-primary/20 text-primary',
            percentColor: 'text-primary',
            badge: 'Nível 1',
            badgeClass: 'bg-primary/15 text-primary border-0',
          },
          {
            nivel: 2,
            title: 'Indicação Indireta',
            percent: '1%',
            desc: 'Comissão sobre operações de pessoas indicadas pelos seus indicados diretos',
            border: 'border-l-blue-500',
            circleClass: 'bg-blue-500/20 text-blue-500',
            percentColor: 'text-blue-500',
            badge: 'Nível 2',
            badgeClass: 'bg-blue-500/10 text-blue-500 border-0',
          },
        ].map((tier, i) => (
          <motion.div
            key={tier.nivel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
          >
            <Card className={`border-0 border-l-4 ${tier.border} shadow-sm h-full`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full ${tier.circleClass} flex items-center justify-center`}>
                    <span className="text-lg font-bold">{tier.nivel}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{tier.title}</h4>
                    <Badge className={`${tier.badgeClass} text-[10px] mt-0.5`}>{tier.badge}</Badge>
                  </div>
                  <span className={`text-3xl font-bold ${tier.percentColor}`}>{tier.percent}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tier.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* How it works — horizontal flow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Como Funciona</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { step: '1', title: 'Compartilhe', desc: 'Envie seu código via WhatsApp ou redes sociais', color: 'bg-primary/10 text-primary' },
                { step: '2', title: 'Cadastro', desc: 'A pessoa se cadastra usando seu link', color: 'bg-blue-500/10 text-blue-500' },
                { step: '3', title: 'Operações', desc: 'Indicados realizam operações na plataforma', color: 'bg-amber-500/10 text-amber-500' },
                { step: '4', title: 'Comissões', desc: 'Você recebe comissões automaticamente', color: 'bg-emerald-500/10 text-emerald-500' },
              ].map((item, i) => (
                <div key={item.step} className="relative">
                  <div className="text-center p-4 rounded-xl bg-muted/20 h-full flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full ${item.color} flex items-center justify-center mb-2.5`}>
                      <span className="text-sm font-bold">{item.step}</span>
                    </div>
                    <h4 className="font-medium text-foreground text-sm mb-1">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Terms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3 text-sm">Regras do Programa</h3>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-1.5">
              {[
                'Comissões calculadas sobre operações fechadas',
                'Pagamento após liquidação da operação',
                'Até 2 níveis de indicação (direta e indireta)',
                'Diretas: 2% · Indiretas: 1%',
                'Consulte o regulamento completo',
              ].map((rule, i) => (
                <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                  {rule}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
});

ReferralCard.displayName = 'ReferralCard';

export default ReferralCard;
