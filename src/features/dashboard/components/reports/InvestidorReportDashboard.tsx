import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Telescope, Wallet, BadgeCheck, CircleDollarSign,
  Link2, Monitor, Scale, ShieldCheck,
  BarChart3, TrendingUp, PauseCircle, FolderKanban,
} from 'lucide-react';
import heroImg from '@/assets/opportunities-hero-bg.jpg';
import { useConfigImage } from '@/hooks/useConfigImages';
import { cn } from '@/lib/utils';
import { ReportFilters } from './ReportFilters';
import { useAuth } from '@/shared/hooks/useAuth';
import { useOportunidadesInvestimento } from '@/features/opportunities/api/useOportunidadesInvestimento';
import { useTesesInvestimento } from '@/features/teses/api/useTeses';
import { useOperacoesStats } from '@/features/operations/api/useOperacoes';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export function InvestidorReportDashboard() {
  const heroImgDynamic = useConfigImage('img_relatorios_investidor_hero');
  const { profile } = useAuth();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const { data: oportunidades = [] } = useOportunidadesInvestimento();
  const { data: teses = [] } = useTesesInvestimento();
  const { data: operacoesStatsData } = useOperacoesStats(profile?.id, dateRange);
  const stageStats = operacoesStatsData?.stageStats;

  const ativas = oportunidades.filter((o: any) => o.status === 'aberta');
  const concluidas = oportunidades.filter((o: any) => o.status === 'captada' || o.status === 'encerrada');
  const valorPotencial = ativas.reduce((s: number, o: any) => s + (o.alvo_maximo || 0), 0);
  const valorInvestido = concluidas.reduce((s: number, o: any) => s + (o.alvo_minimo || 0), 0);
  const tesesAtivas = teses.filter((t: any) => t.status === 'ativa');

  const fotoFinanceira = [
    { label: 'Oportunidades ativas', desc: 'Onde se candidatou', value: ativas.length, format: 'qty', icon: Telescope, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
    { label: 'Valor potencial', desc: '', value: valorPotencial, format: 'currency', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500' },
    { label: 'Oportunidades concluídas', desc: 'Participou', value: concluidas.length, format: 'qty', icon: BadgeCheck, color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' },
    { label: 'Valor investido', desc: '', value: valorInvestido, format: 'currency', icon: CircleDollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-l-amber-500' },
  ];

  const pipelineCards = [
    { label: 'Teses ativas', value: tesesAtivas.length, icon: BarChart3, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Matchmaking', value: stageStats?.matchmaking || 0, icon: Link2, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Apresentação', value: stageStats?.apresentacao || 0, icon: Monitor, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Negociação', value: stageStats?.negociacoes || 0, icon: Scale, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Concluído', value: stageStats?.concluido || 0, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  // Teses breakdown
  const tesesInativas = teses.filter((t: any) => t.status !== 'ativa');

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header Hero */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-border/40 p-8 md:p-10 min-h-[120px]">
        <img src={heroImgDynamic} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/80 to-card/40" />
        <div className="relative flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">Área do Investidor</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground relative">Investidor</h1>
        <p className="text-sm text-muted-foreground mt-1 relative">Acompanhe suas oportunidades e teses</p>
      </motion.div>

      {/* Filtros */}
      <motion.div variants={item}>
        <ReportFilters
          onDateRangeChange={setDateRange}
          exportData={pipelineCards.map(s => ({ etapa: s.label, quantidade: s.value }))}
          exportFilename="relatorio_investidor"
          exportHeaders={{ etapa: 'Etapa', quantidade: 'Quantidade' }}
        />
      </motion.div>

      {/* Linha 1 */}
      <motion.div variants={item}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {fotoFinanceira.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={cn('rounded-xl border border-border bg-card p-4 border-l-4', s.border)}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-muted-foreground block">{s.label}</span>
                  {s.desc && <span className="text-[10px] text-muted-foreground/70">{s.desc}</span>}
                </div>
                <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('h-4 w-4', s.color)} /></div>
              </div>
              <span className="text-2xl font-bold text-foreground block">
                {s.format === 'currency' ? formatCurrency(s.value) : s.value}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Linha 2 — Teses + Pipeline */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Teses + Pipeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {pipelineCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center gap-2 hover:border-primary/30 transition-colors">
              <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('h-5 w-5', s.color)} /></div>
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Linha 3 — Visão de Teses */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Visão de Teses</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total de teses', desc: 'Cadastradas', value: teses.length, icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
            { label: 'Teses ativas', desc: 'Em operação', value: tesesAtivas.length, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500' },
            { label: 'Teses inativas', desc: 'Pausadas/encerradas', value: tesesInativas.length, icon: PauseCircle, color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-l-muted' },
            { label: 'Oportunidades totais', desc: 'Todas', value: oportunidades.length, icon: Telescope, color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={cn('rounded-xl border border-border bg-card p-4 border-l-4', s.border)}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-muted-foreground block">{s.label}</span>
                  <span className="text-[10px] text-muted-foreground/70">{s.desc}</span>
                </div>
                <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('h-4 w-4', s.color)} /></div>
              </div>
              <span className="text-2xl font-bold text-foreground block">{s.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Linha 4 — Pipeline Visual */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Pipeline de Investimento</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="space-y-4">
            {pipelineCards.map((step, index) => {
              const total = pipelineCards.reduce((acc, s) => acc + s.value, 0) || 1;
              const percentage = (step.value / total) * 100;
              return (
                <motion.div key={step.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}
                  className="flex items-center gap-4">
                  <div className="w-28 text-sm text-muted-foreground">{step.label}</div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div className={cn('h-full rounded-full', step.bg.replace('/10', ''))}
                      initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.06 }}
                    />
                  </div>
                  <div className="w-10 text-sm font-medium text-foreground text-right">{step.value}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
