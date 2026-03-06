import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Wallet, BadgeCheck, CircleDollarSign,
  Radar, ClipboardCheck, Ban, Landmark, UserRoundCheck,
  Link2, Layers, Monitor, Scale, ShieldCheck,
  Users, UserMinus, Building2, Search, Trophy,
  UserPlus, BarChart3, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfigImage } from '@/hooks/useConfigImages';
import { ReportFilters } from './ReportFilters';
import { useOperacoesStats } from '@/features/operations/api/useOperacoes';
import { useRedeStats } from '@/features/network/api/useRede';
import { useTesesInvestimento } from '@/features/teses/api/useTeses';
import { mockProfiles } from '@/lib/mock-data';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// Funnel SVG
function FunnelSVG({ stages }: { stages: { label: string; value: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const cumulative: number[] = [];
  let total = stages.reduce((s, st) => s + st.value, 0);
  for (let i = 0; i < stages.length; i++) { cumulative.push(total); total -= stages[i].value; }
  const maxVal = cumulative[0] || 1;
  const colors = [
    'hsl(164, 100%, 36%)', 'hsl(164, 95%, 33%)', 'hsl(164, 88%, 30%)',
    'hsl(164, 80%, 27%)', 'hsl(164, 72%, 24%)', 'hsl(164, 65%, 21%)',
    'hsl(164, 58%, 18%)', 'hsl(164, 50%, 15%)', 'hsl(164, 42%, 12%)',
    'hsl(164, 35%, 10%)',
  ];
  const svgW = 380, svgH = 340, stageH = svgH / stages.length;
  const minW = 40, maxW = svgW - 20, cx = svgW / 2;
  const neckW = 28, neckH = stageH * 0.5;

  return (
    <div className="relative w-full max-w-[360px]">
      <svg viewBox={`0 0 ${svgW} ${svgH + neckH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {stages.map((stage, i) => {
          const isLast = i === stages.length - 1;
          const topW = ((cumulative[i] / maxVal) * (maxW - minW)) + minW;
          const botW = isLast ? neckW : ((cumulative[i + 1] / maxVal) * (maxW - minW)) + minW;
          const y = i * stageH;
          const botY = isLast ? y + stageH + neckH : y + stageH;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              <polygon
                points={`${cx - topW / 2},${y} ${cx + topW / 2},${y} ${cx + botW / 2},${botY} ${cx - botW / 2},${botY}`}
                fill={colors[i] || colors[colors.length - 1]}
                style={{ opacity: hovered === i ? 1 : 0.92, filter: hovered === i ? 'brightness(1.25)' : 'none', transition: 'all 0.2s' }}
              />
              <text x={cx} y={y + stageH / 2 - 3} textAnchor="middle" fill="white" fontSize="9.5" fontWeight="600">{stage.label}</text>
              <text x={cx} y={y + stageH / 2 + 9} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11" fontWeight="700">{cumulative[i]}</text>
            </g>
          );
        })}
      </svg>
      {hovered !== null && (
        <div className="absolute z-10 px-3 py-2 rounded-lg border text-xs shadow-xl pointer-events-none"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', top: `${((hovered * stageH) / (svgH + neckH)) * 100}%`, left: '105%', whiteSpace: 'nowrap' }}>
          <p className="font-semibold">{stages[hovered].label}</p>
          <p>Acumulado: {cumulative[hovered]}</p>
          <p>Nesta fase: {stages[hovered].value}</p>
          {hovered > 0 && cumulative[hovered - 1] > 0 && (
            <p className="text-primary font-medium">Conversão: {((cumulative[hovered] / cumulative[hovered - 1]) * 100).toFixed(1)}%</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminReportDashboard() {
  const heroImg = useConfigImage('img_relatorios_admin_hero');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const { data: operacoesStatsData } = useOperacoesStats(undefined, dateRange);
  const { data: redeStats } = useRedeStats();
  const { data: teses = [] } = useTesesInvestimento();
  const operacoesStats = operacoesStatsData?.stats;
  const stageStats = operacoesStatsData?.stageStats;

  // Derived
  const emAndamento = (operacoesStats?.totalNegocios || 0) - (operacoesStats?.negociosConcluidos || 0);
  const concluidas = operacoesStats?.negociosConcluidos || 0;
  const valorCaptar = (operacoesStats?.valorTotal || 0) / 100;
  const valorCaptado = ((operacoesStats?.valorTotal || 0) * ((operacoesStats?.taxaConversao || 0) / 100)) / 100;

  // Profile stats
  const parceiros = mockProfiles.filter(p => p.tipo === 'parceiro');
  const empresasProfiles = mockProfiles.filter(p => p.tipo === 'empresa');
  const investidores = mockProfiles.filter(p => p.tipo === 'investidor');
  const tesesAtivas = teses.filter((t: any) => (t as any).status === 'ativa');

  // Mock "active" = recent
  const parceirosAtivos = parceiros.length;
  const parceirosInativos = 0;
  const empresasAtivas = empresasProfiles.length;
  const empresasSemOp = 0;
  const investidoresComTese = Math.min(investidores.length, tesesAtivas.length);
  const investidoresSemTese = investidores.length - investidoresComTese;

  // Top 5 parceiros mock
  const topParceiros = parceiros.slice(0, 5).map((p, i) => ({
    nome: p.nome,
    operacoes: Math.max(10 - i * 2, 1),
    valor: (5000000 - i * 800000),
  }));

  const fotoFinanceira = [
    { label: 'Operações ativas', value: emAndamento, format: 'qty', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
    { label: 'Valor a captar', value: valorCaptar, format: 'currency', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500' },
    { label: 'Operações concluídas', value: concluidas, format: 'qty', icon: BadgeCheck, color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' },
    { label: 'Valor total captado', value: valorCaptado, format: 'currency', icon: CircleDollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-l-amber-500' },
  ];

  const statusGlobal = [
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

  const redeCards = [
    { label: 'Parceiros ativos', desc: 'Últimos 6 meses', value: parceirosAtivos, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
    { label: 'Parceiros inativos', desc: '+6 meses', value: parceirosInativos, icon: UserMinus, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-l-slate-500' },
    { label: 'Empresas ativas', desc: 'Com operação', value: empresasAtivas, icon: Building2, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-l-violet-500' },
    { label: 'Empresas sem operações', desc: 'Sem ativa', value: empresasSemOp, icon: Search, color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-l-muted' },
  ];

  const investidorCards = [
    { label: 'Investidores totais', desc: 'Cadastrados', value: investidores.length, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
    { label: 'Com tese', desc: 'Com tese ativa', value: investidoresComTese, icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500' },
    { label: 'Sem tese', desc: 'Sem tese', value: investidoresSemTese, icon: UserMinus, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-l-amber-500' },
    { label: 'Total teses', desc: 'Todas', value: teses?.length || 0, icon: Layers, color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' },
  ];

  const funnelStages = statusGlobal.map(s => ({ label: s.label, value: s.value }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header Hero */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-border/40 p-8 md:p-10 min-h-[120px]">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/80 to-card/40" />
        <div className="relative flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <BarChart3 className="h-5 w-5 text-amber-500" />
          </div>
          <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">Administração</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground relative">Administrador</h1>
        <p className="text-sm text-muted-foreground mt-1 relative">Visão global de operações, rede e investidores</p>
      </motion.div>

      {/* Filtros */}
      <motion.div variants={item}>
        <ReportFilters
          onDateRangeChange={setDateRange}
          exportData={statusGlobal.map(s => ({ etapa: s.label, quantidade: s.value }))}
          exportFilename="relatorio_admin"
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

      {/* Linha 2 — Status Global */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Status Global</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {statusGlobal.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center gap-2 hover:border-primary/30 transition-colors">
              <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('h-5 w-5', s.color)} /></div>
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Linha 3 — Visão de Rede */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Visão de Rede</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {redeCards.map((s, i) => (
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

      {/* Linha 4 — Investidores */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Investidores</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {investidorCards.map((s, i) => (
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

      {/* Linha 5 — Rankings + Funil */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Rankings + Funil Visual</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Rankings */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-semibold text-foreground">Top 5 Parceiros</h3>
            </div>
            <div className="space-y-3">
              {topParceiros.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white',
                      i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-muted-foreground/50'
                    )}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.nome}</p>
                      <p className="text-[11px] text-muted-foreground">{p.operacoes} operações</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(p.valor)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Funil */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">Funil Global</h3>
            <div className="flex flex-col items-center">
              <FunnelSVG stages={funnelStages} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
