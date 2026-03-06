import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
  LineChart, Line, Area, AreaChart,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  BadgeCheck, 
  Layers,
  Landmark,
  Link2,
  Ban,
  Scale,
  Monitor,
  UserRoundCheck,
  Download,
  Trophy,
  UserPlus,
  CircleDollarSign,
  CalendarIcon,
  Loader2,
  Hourglass,
  BarChart3,
  Radar,
  ClipboardCheck,
  Zap,
  Telescope,
  Building2,
  Users,
  Briefcase,
  ShieldCheck,
  UserRoundX,
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/shared/components/select';
import { Calendar } from '@/shared/components/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/popover';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-csv';
import { toast } from 'sonner';
import { useConfigImage } from '@/hooks/useConfigImages';
import { useAuth } from '@/shared/hooks/useAuth';
import { useOperacoesStats } from '@/features/operations/api/useOperacoes';
import { useRedeStats } from '@/features/network/api/useRede';
import { useEmpresas } from '@/features/companies/api/useEmpresas';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { EmpresaReportDashboard } from '@/features/dashboard/components/reports/EmpresaReportDashboard';
import { InvestidorReportDashboard } from '@/features/dashboard/components/reports/InvestidorReportDashboard';
import { AdminReportDashboard } from '@/features/dashboard/components/reports/AdminReportDashboard';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Funnel SVG component with tooltip — solid trapezoid style
function FunnelSVG({ stages, cumulative, maxVal, colors, svgW, svgH, stageH, minWidth, maxWidth, cx }: {
  stages: { label: string; value: number }[];
  cumulative: number[];
  maxVal: number;
  colors: string[];
  svgW: number;
  svgH: number;
  stageH: number;
  minWidth: number;
  maxWidth: number;
  cx: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // Neck style: last stage narrows to a spout
  const neckWidth = 30;
  const neckHeight = stageH * 0.6;

  return (
    <div className="relative w-full max-w-[380px]">
      <svg viewBox={`0 0 ${svgW} ${svgH + neckHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {stages.map((stage, i) => {
          const isLast = i === stages.length - 1;
          const topW = ((cumulative[i] / maxVal) * (maxWidth - minWidth)) + minWidth;
          const botW = isLast
            ? neckWidth
            : ((cumulative[i + 1] / maxVal) * (maxWidth - minWidth)) + minWidth;
          const y = i * stageH;
          const topL = cx - topW / 2;
          const topR = cx + topW / 2;
          // For the last stage, the bottom leads into a narrow neck/spout
          const actualBotY = isLast ? y + stageH + neckHeight : y + stageH;
          const botL = cx - botW / 2;
          const botR = cx + botW / 2;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={stage.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <polygon
                points={`${topL},${y} ${topR},${y} ${botR},${actualBotY} ${botL},${actualBotY}`}
                fill={colors[i]}
                style={{
                  opacity: isHovered ? 1 : 0.92,
                  filter: isHovered ? 'brightness(1.25)' : 'none',
                  transition: 'opacity 0.2s, filter 0.2s',
                }}
              />
              {/* Only show text if the trapezoid is tall enough */}
              <text x={cx} y={y + stageH / 2 - 4} textAnchor="middle" fill="white" fontSize="10.5" fontWeight="600">
                {stage.label}
              </text>
              <text x={cx} y={y + stageH / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="12" fontWeight="700">
                {cumulative[i]}
              </text>
            </g>
          );
        })}
      </svg>
      {hoveredIndex !== null && (
        <div
          className="absolute z-10 px-3 py-2 rounded-lg border text-xs shadow-xl pointer-events-none"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
            top: `${((hoveredIndex * stageH) / (svgH + neckHeight)) * 100}%`,
            left: '105%',
            whiteSpace: 'nowrap',
          }}
        >
          <p className="font-semibold">{stages[hoveredIndex].label}</p>
          <p>Acumulado: {cumulative[hoveredIndex]}</p>
          <p>Nesta fase: {stages[hoveredIndex].value}</p>
          {hoveredIndex > 0 && cumulative[hoveredIndex - 1] > 0 && (
            <p className="text-primary font-medium">
              Conversão: {((cumulative[hoveredIndex] / cumulative[hoveredIndex - 1]) * 100).toFixed(1)}%
            </p>
          )}
          {hoveredIndex === 0 && (
            <p className="text-primary font-medium">Entrada do funil</p>
          )}
        </div>
      )}
    </div>
  );
}

// Dashboard específico para usuários Empresa
function EmpresaDashboard({ 
  operacoesStats, 
  stageStats, 
  monthlyData, 
  selectedPeriod, 
  periodLabel,
  chartView,
  setChartView,
  isCustomPeriod,
  dateRange,
  handlePeriodChange,
  handleDateSelect,
  setDateRange,
  setIsCustomPeriod,
  profile,
  user
}: any) {
  const displayName = profile?.nome || user?.email?.split('@')[0] || 'Empresa';
  const maxQuantidade = Math.max(...monthlyData.map((d: any) => d.quantidade), 1);
  const maxValor = Math.max(...monthlyData.map((d: any) => d.valor), 1);

  // Stats cards for empresa
  const empresaStats = useMemo(() => [
    {
      label: 'Minhas Operações',
      value: operacoesStats?.totalNegocios?.toString() || '0',
      description: 'Total de operações submetidas',
      icon: Briefcase,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Valor Total',
      value: formatCurrency((operacoesStats?.valorTotal || 0) / 100),
      description: 'Valor acumulado das operações',
      icon: Wallet,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Em Andamento',
      value: ((operacoesStats?.totalNegocios || 0) - (operacoesStats?.negociosConcluidos || 0)).toString(),
      description: 'Operações ativas',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Concluídas',
      value: operacoesStats?.negociosConcluidos?.toString() || '0',
      description: 'Operações finalizadas',
      icon: BadgeCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ], [operacoesStats]);

  // Stage progress for empresa
  const stageProgress = useMemo(() => [
    { label: 'Prospecto', value: stageStats?.prospeccao || 0, color: 'bg-blue-500' },
    { label: 'Comitê / Score', value: stageStats?.comite || 0, color: 'bg-purple-500' },
    { label: 'Comercial', value: stageStats?.comercial || 0, color: 'bg-orange-500' },
    { label: 'Matchmaking', value: stageStats?.matchmaking || 0, color: 'bg-cyan-500' },
    { label: 'Negociações', value: stageStats?.negociacoes || 0, color: 'bg-pink-500' },
    { label: 'Concluído', value: stageStats?.concluido || 0, color: 'bg-emerald-500' },
  ], [stageStats]);

  const totalStages = stageProgress.reduce((acc, stage) => acc + stage.value, 0) || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          <p className="text-muted-foreground">Dashboard da Empresa</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-lg font-semibold text-primary">Ativo</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className={cn("w-[180px]", isCustomPeriod && "text-muted-foreground")}>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={isCustomPeriod ? "default" : "outline"} 
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              {isCustomPeriod && dateRange.from && dateRange.to ? (
                <span>
                  {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                </span>
              ) : (
                <span>Período personalizado</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.to || dateRange.from}
              onSelect={handleDateSelect}
              locale={ptBR}
              className="p-3 pointer-events-auto"
              disabled={(date) => date > new Date()}
            />
            {dateRange.from && (
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                {dateRange.from && !dateRange.to && (
                  <p>Selecione a data final</p>
                )}
                {dateRange.from && dateRange.to && (
                  <div className="flex items-center justify-between">
                    <p>
                      {format(dateRange.from, "dd/MM/yyyy")} → {format(dateRange.to, "dd/MM/yyyy")}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setDateRange({ from: undefined, to: undefined });
                        setIsCustomPeriod(false);
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>

        <div className="ml-auto">
          <Button variant="outline" className="gap-2" onClick={() => {
            const stageData = [
              { etapa: 'Prospecto', quantidade: stageStats?.prospeccao || 0 },
              { etapa: 'Comitê', quantidade: stageStats?.comite || 0 },
              { etapa: 'Comercial', quantidade: stageStats?.comercial || 0 },
              { etapa: 'Matchmaking', quantidade: stageStats?.matchmaking || 0 },
              { etapa: 'Negociações', quantidade: stageStats?.negociacoes || 0 },
              { etapa: 'Concluído', quantidade: stageStats?.concluido || 0 },
            ];
            exportToCSV(stageData, 'relatorio_empresa', { etapa: 'Etapa', quantidade: 'Quantidade' });
            toast.success('Relatório exportado com sucesso!');
          }}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {empresaStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="dashboard-card"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm font-medium text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Pipeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="dashboard-card"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Pipeline das Operações</h3>
        <div className="space-y-4">
          {stageProgress.map((stage, index) => {
            const percentage = totalStages > 0 ? (stage.value / totalStages) * 100 : 0;
            return (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-32 text-sm text-muted-foreground">{stage.label}</div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${stage.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-foreground text-right">
                  {stage.value}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Desempenho Mensal */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Evolução das Operações</h3>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setChartView('quantidade')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  chartView === 'quantidade' 
                    ? 'bg-foreground text-background' 
                    : 'bg-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Quantidade
              </button>
              <button
                onClick={() => setChartView('valor')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  chartView === 'valor' 
                    ? 'bg-foreground text-background' 
                    : 'bg-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Valor
              </button>
            </div>
          </div>
          
          <div className="flex items-end justify-between gap-2 h-48 px-4">
            <AnimatePresence mode="wait">
              {monthlyData.map((data: any, index: number) => {
                const height = chartView === 'quantidade' 
                  ? (data.quantidade / maxQuantidade) * 100 
                  : (data.valor / maxValor) * 100;
                
                return (
                  <motion.div 
                    key={`${chartView}-${data.month}-${selectedPeriod}`} 
                    className="flex flex-col items-center flex-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div 
                      className="w-full bg-primary rounded-t-sm min-h-[8px]"
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ 
                        duration: 0.6, 
                        delay: index * 0.1,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">{data.month}</p>
                    <motion.p 
                      className="text-xs font-medium text-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      {chartView === 'quantidade' ? data.quantidade : ''}
                    </motion.p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Funnel Chart - Status Distribution */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-foreground mb-6">Funil Acumulado por Etapa</h3>
          
          <div className="flex flex-col items-center w-full">
            {(() => {
              const stages = [
                { label: 'Prospecção', value: stageStats?.prospeccao || 0 },
                { label: 'Comitê', value: stageStats?.comite || 0 },
                { label: 'Comercial', value: stageStats?.comercial || 0 },
                { label: 'Matchmaking', value: stageStats?.matchmaking || 0 },
                { label: 'Estruturação', value: stageStats?.preparacao || 0 },
                { label: 'Apresentação', value: stageStats?.apresentacao || 0 },
                { label: 'Negociações', value: stageStats?.negociacoes || 0 },
                { label: 'Concluído', value: stageStats?.concluido || 0 },
              ];

              const cumulative: number[] = [];
              let runningTotal = stages.reduce((sum, s) => sum + s.value, 0);
              for (let i = 0; i < stages.length; i++) {
                cumulative.push(runningTotal);
                runningTotal -= stages[i].value;
              }

              const maxVal = cumulative[0] || 1;
              const colors = [
                'hsl(164, 100%, 36%)',
                'hsl(164, 95%, 33%)',
                'hsl(164, 88%, 30%)',
                'hsl(164, 80%, 27%)',
                'hsl(164, 72%, 24%)',
                'hsl(164, 65%, 21%)',
                'hsl(164, 58%, 18%)',
                'hsl(164, 50%, 15%)',
              ];

              const svgW = 400;
              const svgH = 340;
              const stageH = svgH / stages.length;
              const minWidth = 44;
              const maxWidth = svgW - 20;
              const cx = svgW / 2;

              return (
                <FunnelSVG
                  stages={stages}
                  cumulative={cumulative}
                  maxVal={maxVal}
                  colors={colors}
                  svgW={svgW}
                  svgH={svgH}
                  stageH={stageH}
                  minWidth={minWidth}
                  maxWidth={maxWidth}
                  cx={cx}
                />
              );
            })()}
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="dashboard-card"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Resumo de Atividades</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <Hourglass className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {(stageStats?.prospeccao || 0) + (stageStats?.comite || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Em análise</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <Scale className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {(stageStats?.negociacoes || 0) + (stageStats?.matchmaking || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Em negociação</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {stageStats?.concluido || 0}
            </p>
            <p className="text-sm text-muted-foreground">Concluídas</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ReportsPage() {
  const { profile, user } = useAuth();
  const { isAdmin } = useAdminPermissions();
  const reportsHeroBg = useConfigImage('img_relatorios_hero');
  const userId = profile?.id;
  const isEmpresaUser = profile?.tipo === 'empresa';
  const isInvestidorUser = profile?.tipo === 'investidor';
  
  const [parceiroDateRange, setParceiroDateRange] = useState<{ from?: Date; to?: Date }>({});
  const { data: operacoesStatsData, isLoading: isLoadingOperacoes } = useOperacoesStats(userId, parceiroDateRange);
  const { data: redeStats, isLoading: isLoadingRede } = useRedeStats();
  const { data: empresas = [] } = useEmpresas({ userId });

  const [chartView, setChartView] = useState<'quantidade' | 'valor'>('quantidade');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  

  const isLoading = isLoadingOperacoes || (isEmpresaUser ? false : isLoadingRede);

  // Extract stats from the query result
  const operacoesStats = operacoesStatsData?.stats;
  const stageStats = operacoesStatsData?.stageStats;

  // Calculate period label
  const periodLabel = useMemo(() => {
    if (selectedPeriod === '7') return 'últimos 7 dias';
    if (selectedPeriod === '30') return 'este mês';
    if (selectedPeriod === '90') return 'últimos 3 meses';
    if (selectedPeriod === '365') return 'este ano';
    return 'período';
  }, [selectedPeriod]);

  // Stats cards with real data
  const stats = useMemo(() => [
    {
      label: 'Total de Negócios',
      value: operacoesStats?.totalNegocios?.toString() || '0',
      change: `+0 ${periodLabel}`,
      positive: true,
      icon: Briefcase,
    },
    {
      label: 'Valor Total',
      value: formatCurrency((operacoesStats?.valorTotal || 0) / 100),
      change: `Acumulado`,
      positive: true,
      icon: Wallet,
    },
    {
      label: 'Negócios Concluídos',
      value: operacoesStats?.negociosConcluidos?.toString() || '0',
      change: `Concluídos`,
      positive: true,
      icon: BadgeCheck,
    },
    {
      label: 'Taxa de Conversão',
      value: `${(operacoesStats?.taxaConversao || 0).toFixed(1)}%`,
      change: `Do total`,
      positive: (operacoesStats?.taxaConversao || 0) > 20,
      icon: Layers,
    },
  ], [operacoesStats, periodLabel]);

  // Stage cards with real data
  const stageCards = useMemo(() => [
    { label: 'Prospecção', value: stageStats?.prospeccao || 0, icon: Radar, color: 'text-blue-400' },
    { label: 'Comitê / Score', value: stageStats?.comite || 0, icon: ClipboardCheck, color: 'text-purple-400' },
    { label: 'Reprovadas', value: stageStats?.reprovadas || 0, icon: Ban, color: 'text-red-400' },
    { label: 'Comercial', value: stageStats?.comercial || 0, icon: Landmark, color: 'text-orange-400' },
    { label: 'Cliente Ativo', value: stageStats?.clienteAtivo || 0, icon: UserRoundCheck, color: 'text-green-400' },
    { label: 'Matchmaking', value: stageStats?.matchmaking || 0, icon: Link2, color: 'text-cyan-400' },
    { label: 'Estruturação', value: stageStats?.preparacao || 0, icon: Layers, color: 'text-yellow-400' },
    { label: 'Negociações', value: stageStats?.negociacoes || 0, icon: Scale, color: 'text-pink-400' },
    { label: 'Concluído', value: stageStats?.concluido || 0, icon: ShieldCheck, color: 'text-emerald-400' },
    { label: 'Cliente Inativo', value: stageStats?.clienteInativo || 0, icon: UserRoundX, color: 'text-gray-400' },
  ], [stageStats]);

  // Calculate status percentages from real data
  const statusData = useMemo(() => {
    const total = operacoesStats?.totalNegocios || 1;
    const prospeccao = stageStats?.prospeccao || 0;
    const reprovadas = stageStats?.reprovadas || 0;
    
    return {
      prospeccao: Math.round((prospeccao / total) * 100),
      reprovadas: Math.round((reprovadas / total) * 100),
    };
  }, [operacoesStats, stageStats]);

  // Monthly data from real operations
  const monthlyData = useMemo(() => {
    const monthlyStats = operacoesStatsData?.monthlyStats || [];
    if (monthlyStats.length === 0) {
      return [
        { month: 'Jan', quantidade: 0, valor: 0 },
        { month: 'Fev', quantidade: 0, valor: 0 },
        { month: 'Mar', quantidade: 0, valor: 0 },
        { month: 'Abr', quantidade: 0, valor: 0 },
        { month: 'Mai', quantidade: 0, valor: 0 },
        { month: 'Jun', quantidade: 0, valor: 0 },
      ];
    }
    return monthlyStats;
  }, [operacoesStatsData?.monthlyStats]);

  const maxQuantidade = Math.max(...monthlyData.map(d => d.quantidade), 1);
  const maxValor = Math.max(...monthlyData.map(d => d.valor), 1);

  // Network stats with real data (only for non-empresa users)
  const networkStats = useMemo(() => [
    { label: 'Total de Indicados', value: redeStats?.totalIndicados?.toString() || '0', change: `Na rede`, icon: Users },
    { label: 'Indicações Diretas', value: redeStats?.indicacoesDiretas?.toString() || '0', change: `Diretas`, icon: UserPlus },
    { label: 'Total de Negócios', value: redeStats?.totalNegocios?.toString() || '0', change: `Da rede`, icon: Briefcase },
    { label: 'Valor Total', value: formatCurrency(redeStats?.valorTotal || 0), change: `Acumulado`, icon: TrendingUp },
  ], [redeStats]);

  // Top companies
  const destacados = empresas.slice(0, 3);

  // Ranking position based on total operations among all parceiros
  const rankingPosition = useMemo(() => {
    const totalNegocios = operacoesStats?.totalNegocios || 0;
    // Mock ranking: simulate positions based on performance
    // In production this would come from a leaderboard API
    const mockParceiros = [
      { nome: 'Ana Beatriz Costa', negocios: 12 },
      { nome: 'Pedro Almeida', negocios: 9 },
      { nome: 'Lucas Ferreira', negocios: 7 },
      { nome: profile?.nome || 'Você', negocios: totalNegocios },
      { nome: 'Carla Souza', negocios: 3 },
      { nome: 'Rafael Lima', negocios: 2 },
    ].sort((a, b) => b.negocios - a.negocios);
    const pos = mockParceiros.findIndex(p => p.nome === (profile?.nome || 'Você')) + 1;
    return { position: pos, total: mockParceiros.length };
  }, [operacoesStats?.totalNegocios, profile?.nome]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setIsCustomPeriod(false);
    setDateRange({ from: undefined, to: undefined });
    const days = parseInt(value);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setParceiroDateRange({ from, to });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!dateRange.from || (dateRange.from && dateRange.to)) {
      setDateRange({ from: date, to: undefined });
    } else {
      const newRange = date && date < dateRange.from
        ? { from: date, to: dateRange.from }
        : { from: dateRange.from, to: date };
      setDateRange(newRange);
      if (date) {
        setIsCustomPeriod(true);
        setParceiroDateRange({ from: newRange.from, to: newRange.to });
      }
    }
  };

  const displayName = profile?.nome || user?.email?.split('@')[0] || 'Usuário';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine which view to show based on user profile type
  const activeView = profile?.tipo === 'admin' ? 'admin'
    : isEmpresaUser ? 'empresa' 
    : isInvestidorUser ? 'investidor' 
    : 'parceiro';

  if (activeView === 'admin') {
    return <AdminReportDashboard />;
  }
  if (activeView === 'empresa') {
    return <EmpresaReportDashboard />;
  }
  if (activeView === 'investidor') {
    return <InvestidorReportDashboard />;
  }

  // Default: parceiro dashboard

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const animItem = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  const fotoFinanceira = [
    { label: 'Total de Negócios', value: operacoesStats?.totalNegocios?.toString() || '0', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
    { label: 'Valor Total', value: formatCurrency((operacoesStats?.valorTotal || 0) / 100), icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500' },
    { label: 'Negócios Concluídos', value: operacoesStats?.negociosConcluidos?.toString() || '0', icon: BadgeCheck, color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' },
    { label: 'Taxa de Conversão', value: `${(operacoesStats?.taxaConversao || 0).toFixed(1)}%`, icon: Layers, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-l-amber-500' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header Hero */}
      <motion.div variants={animItem} className="relative overflow-hidden rounded-2xl border border-border/40 p-8 md:p-10 min-h-[120px]">
        <img src={reportsHeroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/80 to-card/40" />
        <div className="relative flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">Área do Parceiro</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground relative">Parceiro</h1>
        <p className="text-sm text-muted-foreground mt-1 relative">Visão geral de operações, pipeline e rede</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={animItem} className="flex flex-wrap items-center gap-3">
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className={cn("w-[180px]", isCustomPeriod && "text-muted-foreground")}>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button variant="outline" className="gap-2" onClick={() => {
            const reportData = monthlyData.map((d: any) => ({ mes: d.month, quantidade: d.quantidade, valor: d.valor }));
            exportToCSV(reportData, 'relatorio_parceiro', { mes: 'Mês', quantidade: 'Quantidade', valor: 'Valor (R$)' });
            toast.success('Relatório exportado com sucesso!');
          }}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </motion.div>

      {/* Linha 1 */}
      <motion.div variants={animItem}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {fotoFinanceira.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={cn('rounded-xl border border-border bg-card p-4 border-l-4', s.border)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('h-4 w-4', s.color)} /></div>
              </div>
              <span className="text-2xl font-bold text-foreground block">{s.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Linha 2 — Status das Operações */}
      <motion.div variants={animItem}>
        <h2 className="text-base font-semibold text-foreground mb-3">Status das Operações</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {stageCards.map((stage, index) => (
            <motion.div key={stage.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }}
              className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center gap-2 hover:border-primary/30 transition-colors">
              <div className={cn("p-2 rounded-lg", stage.color.replace('text-', 'bg-').replace('-400', '-500/10'))}>
                <stage.icon className={cn("h-5 w-5", stage.color)} />
              </div>
              <span className="text-2xl font-bold text-foreground">{stage.value}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">{stage.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Linha 3 — Métricas + Ranking */}
      <motion.div variants={animItem}>
        <h2 className="text-base font-semibold text-foreground mb-3">Métricas de Desempenho</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Taxa de publicação */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-foreground mb-4">Taxa de publicação</h3>
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
                <motion.circle cx="56" cy="56" r="48" stroke="hsl(var(--primary))" strokeWidth="10" fill="none" strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${100 * 3.02}` }}
                  animate={{ strokeDasharray: `${(operacoesStats?.taxaConversao || 0) * 3.02} ${100 * 3.02}` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{(operacoesStats?.taxaConversao || 0).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Taxa de aprovação */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-foreground mb-4">Taxa de aprovação</h3>
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
                <motion.circle cx="56" cy="56" r="48" stroke="hsl(var(--primary))" strokeWidth="10" fill="none" strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${100 * 3.02}` }}
                  animate={{ strokeDasharray: `${Math.min((operacoesStats?.taxaConversao || 0) * 0.8, 100) * 3.02} ${100 * 3.02}` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{Math.floor((operacoesStats?.taxaConversao || 0) * 0.8)}%</span>
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center text-center">
            <div className="p-3 rounded-xl bg-primary/10 mb-3">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Sua posição no ranking</p>
            <p className="text-4xl font-bold text-foreground mt-1">
              {rankingPosition.position}º
            </p>
            <p className="text-xs text-muted-foreground mt-1">de {rankingPosition.total} parceiros</p>
          </div>
        </div>
      </motion.div>

      {/* Linha 4 — Evolução Temporal */}
      <motion.div variants={animItem}>
        <h2 className="text-base font-semibold text-foreground mb-3">Evolução de Originações</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <p className="text-xs text-muted-foreground">Tendência ao longo do tempo</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorQuantidadeP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px' }}
                formatter={(value: number) => [value, 'Negócios']}
              />
              <Area type="monotone" dataKey="quantidade" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorQuantidadeP)"
                dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Linha 5 — Originações em Destaque + Funil */}
      <motion.div variants={animItem}>
        <h2 className="text-base font-semibold text-foreground mb-3">Originações + Funil</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Originações em destaque */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Originações em Destaque</h3>
            </div>
            <div className="space-y-2.5">
              {destacados.length > 0 ? (
                destacados.map((empresa) => (
                  <div key={empresa.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{empresa.nome}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {empresa.created_at ? format(new Date(empresa.created_at), "dd/MM/yyyy") : '-'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground">
                      {empresa.segmento || 'N/A'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma empresa cadastrada</p>
              )}
            </div>
          </div>

          {/* Funil Global */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Funil Global</h3>
            <div className="flex flex-col items-center">
              {(() => {
                const stages = [
                  { label: 'Prospecto', value: stageStats?.prospeccao || 0 },
                  { label: 'Comitê', value: stageStats?.comite || 0 },
                  { label: 'Reprovados', value: stageStats?.reprovadas || 0 },
                  { label: 'Comercial', value: stageStats?.comercial || 0 },
                  { label: 'Cliente Ativo', value: stageStats?.clienteAtivo || 0 },
                  { label: 'Estruturação', value: stageStats?.preparacao || 0 },
                  { label: 'Matchmaking', value: stageStats?.matchmaking || 0 },
                  { label: 'Apresentação', value: stageStats?.apresentacao || 0 },
                  { label: 'Negociação', value: stageStats?.negociacoes || 0 },
                  { label: 'Concluído', value: stageStats?.concluido || 0 },
                ];
                const cumulative: number[] = [];
                let runningTotal = stages.reduce((sum, s) => sum + s.value, 0);
                for (let i = 0; i < stages.length; i++) { cumulative.push(runningTotal); runningTotal -= stages[i].value; }
                const maxVal = cumulative[0] || 1;
                const colors = [
                  'hsl(164, 100%, 36%)', 'hsl(164, 95%, 33%)', 'hsl(164, 88%, 30%)',
                  'hsl(164, 80%, 27%)', 'hsl(164, 72%, 24%)', 'hsl(164, 65%, 21%)',
                  'hsl(164, 58%, 18%)', 'hsl(164, 50%, 15%)', 'hsl(164, 42%, 12%)',
                  'hsl(164, 35%, 10%)',
                ];
                return (
                  <FunnelSVG stages={stages} cumulative={cumulative} maxVal={maxVal} colors={colors}
                    svgW={380} svgH={340} stageH={340 / stages.length} minWidth={40} maxWidth={360} cx={190} />
                );
              })()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Linha 6 — Resumo da Rede */}
      <motion.div variants={animItem}>
        <h2 className="text-base font-semibold text-foreground mb-3">Resumo da Rede</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {networkStats.map((stat, index) => {
            const borders = ['border-l-cyan-500', 'border-l-violet-500', 'border-l-emerald-500', 'border-l-amber-500'];
            const iconBgs = ['bg-cyan-500/10', 'bg-violet-500/10', 'bg-emerald-500/10', 'bg-amber-500/10'];
            const iconColors = ['text-cyan-500', 'text-violet-500', 'text-emerald-500', 'text-amber-500'];
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
                className={cn("rounded-xl border border-border bg-card p-4 border-l-4", borders[index])}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <div className={cn("p-2 rounded-lg", iconBgs[index])}>
                    <stat.icon className={cn("h-4 w-4", iconColors[index])} />
                  </div>
                </div>
                <span className="text-2xl font-bold text-foreground block">{stat.value}</span>
                <span className="text-xs text-primary flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
