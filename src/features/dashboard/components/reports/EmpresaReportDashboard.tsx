import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Wallet, BadgeCheck, CircleDollarSign,
  Radar, ClipboardCheck, Ban, Landmark, UserRoundCheck,
  Link2, Layers, Monitor, Scale, ShieldCheck,
  Hourglass, BarChart3,
} from 'lucide-react';
import heroImg from '@/assets/reports-hero-bg.jpg';
import { useConfigImage } from '@/hooks/useConfigImages';
import { cn } from '@/lib/utils';
import { ReportFilters } from './ReportFilters';
import { useAuth } from '@/shared/hooks/useAuth';
import { useOperacoesStats } from '@/features/operations/api/useOperacoes';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export function EmpresaReportDashboard() {
  const heroImgDynamic = useConfigImage('img_relatorios_empresa_hero');
  const { profile } = useAuth();
  const userId = profile?.id;
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const { data: operacoesStatsData } = useOperacoesStats(userId, dateRange);
  const operacoesStats = operacoesStatsData?.stats;
  const stageStats = operacoesStatsData?.stageStats;

  const emAndamento = (operacoesStats?.totalNegocios || 0) - (operacoesStats?.negociosConcluidos || 0);
  const valorCaptar = (operacoesStats?.valorTotal || 0) - ((operacoesStats?.valorTotal || 0) * ((operacoesStats?.taxaConversao || 0) / 100));
  const concluidas = operacoesStats?.negociosConcluidos || 0;
  const valorCaptado = (operacoesStats?.valorTotal || 0) * ((operacoesStats?.taxaConversao || 0) / 100);

  const fotoFinanceira = [
    { label: 'Operações em andamento', value: emAndamento, format: 'qty', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
    { label: 'Valor a captar', value: valorCaptar / 100, format: 'currency', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500' },
    { label: 'Operações concluídas', value: concluidas, format: 'qty', icon: BadgeCheck, color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' },
    { label: 'Valor captado', value: valorCaptado / 100, format: 'currency', icon: CircleDollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-l-amber-500' },
  ];

  const statusCards = [
    { label: 'Prospecto', value: stageStats?.prospeccao || 0, icon: Radar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Comitê', value: stageStats?.comite || 0, icon: ClipboardCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Reprovados', value: stageStats?.reprovadas || 0, icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Comercial', value: stageStats?.comercial || 0, icon: Landmark, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Cliente Ativo', value: stageStats?.clienteAtivo || 0, icon: UserRoundCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Estruturação', value: stageStats?.preparacao || 0, icon: Layers, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Matchmaking', value: stageStats?.matchmaking || 0, icon: Link2, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Apresentação', value: stageStats?.apresentacao || 0, icon: Monitor, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Negociação', value: stageStats?.negociacoes || 0, icon: Scale, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Concluído', value: stageStats?.concluido || 0, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  // Pipeline progress for visual bar
  const pipelineSteps = useMemo(() => [
    { label: 'Prospecto', value: stageStats?.prospeccao || 0, color: 'bg-blue-500' },
    { label: 'Comitê', value: stageStats?.comite || 0, color: 'bg-purple-500' },
    { label: 'Comercial', value: stageStats?.comercial || 0, color: 'bg-orange-500' },
    { label: 'Estruturação', value: stageStats?.preparacao || 0, color: 'bg-yellow-500' },
    { label: 'Matchmaking', value: stageStats?.matchmaking || 0, color: 'bg-cyan-500' },
    { label: 'Negociação', value: stageStats?.negociacoes || 0, color: 'bg-pink-500' },
    { label: 'Concluído', value: stageStats?.concluido || 0, color: 'bg-emerald-500' },
  ], [stageStats]);

  const totalPipeline = pipelineSteps.reduce((acc, s) => acc + s.value, 0) || 1;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header Hero */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-border/40 p-8 md:p-10 min-h-[120px]">
        <img src={heroImgDynamic} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/80 to-card/40" />
        <div className="relative flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Landmark className="h-5 w-5 text-emerald-500" />
          </div>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">Área da Empresa</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground relative">Empresa</h1>
        <p className="text-sm text-muted-foreground mt-1 relative">Visão consolidada das suas operações</p>
      </motion.div>

      {/* Filtros */}
      <motion.div variants={item}>
        <ReportFilters
          onDateRangeChange={setDateRange}
          exportData={statusCards.map(s => ({ etapa: s.label, quantidade: s.value }))}
          exportFilename="relatorio_empresa"
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
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('h-4 w-4', s.color)} /></div>
              </div>
              <span className="text-2xl font-bold text-foreground block">
                {s.format === 'currency' ? formatCurrency(s.value) : s.value}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Linha 2 — Status Operações */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Status das Operações</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {statusCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center gap-2 hover:border-primary/30 transition-colors">
              <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('h-5 w-5', s.color)} /></div>
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Linha 3 — Pipeline Visual */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Pipeline das Operações</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="space-y-4">
            {pipelineSteps.map((step, index) => {
              const percentage = (step.value / totalPipeline) * 100;
              return (
                <motion.div key={step.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}
                  className="flex items-center gap-4">
                  <div className="w-28 text-sm text-muted-foreground">{step.label}</div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div className={cn('h-full rounded-full', step.color)}
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

      {/* Linha 4 — Resumo de Atividades */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Resumo de Atividades</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Em análise', value: (stageStats?.prospeccao || 0) + (stageStats?.comite || 0), icon: Hourglass, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Em negociação', value: (stageStats?.negociacoes || 0) + (stageStats?.matchmaking || 0), icon: Scale, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Concluídas', value: stageStats?.concluido || 0, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-5 flex flex-col items-center text-center gap-2">
              <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('h-6 w-6', s.color)} /></div>
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
