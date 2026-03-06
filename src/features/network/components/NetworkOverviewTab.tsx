import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  UserPlus, GitBranch, TrendingUp, DollarSign, ArrowUpRight,
  Zap, CalendarDays, CircleCheckBig, Clock, Search, CalendarIcon, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/shared/components/card';
import { Badge } from '@/shared/components/badge';
import { Progress } from '@/shared/components/progress';
import { Button } from '@/shared/components/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/popover';

/* ── Formatting helpers ── */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value}`;
};

/* ── Full mock data (12 months with year) ── */
const allIndicacoesData = [
  { mes: 'Mar', ano: 2025, diretas: 0, indiretas: 0, total: 0 },
  { mes: 'Abr', ano: 2025, diretas: 0, indiretas: 0, total: 0 },
  { mes: 'Mai', ano: 2025, diretas: 1, indiretas: 0, total: 1 },
  { mes: 'Jun', ano: 2025, diretas: 1, indiretas: 0, total: 1 },
  { mes: 'Jul', ano: 2025, diretas: 1, indiretas: 0, total: 1 },
  { mes: 'Ago', ano: 2025, diretas: 1, indiretas: 0, total: 1 },
  { mes: 'Set', ano: 2025, diretas: 1, indiretas: 0, total: 1 },
  { mes: 'Out', ano: 2025, diretas: 2, indiretas: 0, total: 2 },
  { mes: 'Nov', ano: 2025, diretas: 3, indiretas: 1, total: 4 },
  { mes: 'Dez', ano: 2025, diretas: 4, indiretas: 1, total: 5 },
  { mes: 'Jan', ano: 2026, diretas: 5, indiretas: 2, total: 7 },
  { mes: 'Fev', ano: 2026, diretas: 6, indiretas: 3, total: 9 },
];

const allComissoesData = [
  { mes: 'Mar', ano: 2025, propria: 0, nivel1: 0, nivel2: 0 },
  { mes: 'Abr', ano: 2025, propria: 0, nivel1: 0, nivel2: 0 },
  { mes: 'Mai', ano: 2025, propria: 0, nivel1: 0, nivel2: 0 },
  { mes: 'Jun', ano: 2025, propria: 0, nivel1: 0, nivel2: 0 },
  { mes: 'Jul', ano: 2025, propria: 0, nivel1: 0, nivel2: 0 },
  { mes: 'Ago', ano: 2025, propria: 0, nivel1: 0, nivel2: 0 },
  { mes: 'Set', ano: 2025, propria: 0, nivel1: 0, nivel2: 0 },
  { mes: 'Out', ano: 2025, propria: 90000, nivel1: 40000, nivel2: 20000 },
  { mes: 'Nov', ano: 2025, propria: 90000, nivel1: 55000, nivel2: 25000 },
  { mes: 'Dez', ano: 2025, propria: 40000, nivel1: 55000, nivel2: 35000 },
  { mes: 'Jan', ano: 2026, propria: 80000, nivel1: 90000, nivel2: 60000 },
  { mes: 'Fev', ano: 2026, propria: 100000, nivel1: 100000, nivel2: 70000 },
];

type ComissaoFilter = 'todos' | 'propria' | 'nivel1' | 'nivel2';
const COMISSAO_FILTER_OPTIONS: { key: ComissaoFilter; label: string; color: string }[] = [
  { key: 'todos', label: 'Todos', color: '' },
  { key: 'propria', label: 'Própria', color: 'hsl(160 60% 45%)' },
  { key: 'nivel1', label: 'Nível 1', color: 'hsl(210 80% 55%)' },
  { key: 'nivel2', label: 'Nível 2', color: 'hsl(270 60% 55%)' },
];

const allPotenciaisGanhosData = [
  { mes: 'Mar', ano: 2025, ganhoReal: 0, ganhoPotencial: 12000 },
  { mes: 'Abr', ano: 2025, ganhoReal: 0, ganhoPotencial: 18000 },
  { mes: 'Mai', ano: 2025, ganhoReal: 7500, ganhoPotencial: 25000 },
  { mes: 'Jun', ano: 2025, ganhoReal: 12000, ganhoPotencial: 35000 },
  { mes: 'Jul', ano: 2025, ganhoReal: 12000, ganhoPotencial: 42000 },
  { mes: 'Ago', ano: 2025, ganhoReal: 12000, ganhoPotencial: 50000 },
  { mes: 'Set', ano: 2025, ganhoReal: 15000, ganhoPotencial: 65000 },
  { mes: 'Out', ano: 2025, ganhoReal: 22500, ganhoPotencial: 85000 },
  { mes: 'Nov', ano: 2025, ganhoReal: 48000, ganhoPotencial: 110000 },
  { mes: 'Dez', ano: 2025, ganhoReal: 67500, ganhoPotencial: 135000 },
  { mes: 'Jan', ano: 2026, ganhoReal: 102000, ganhoPotencial: 170000 },
  { mes: 'Fev', ano: 2026, ganhoReal: 142500, ganhoPotencial: 210000 },
];

const statusDistributionData = [
  { name: 'Ativo', value: 7, color: 'hsl(var(--primary))' },
  { name: 'Inativo', value: 2, color: 'hsl(var(--muted-foreground))' },
  { name: 'Pendente', value: 1, color: 'hsl(45 93% 47%)' },
];

const conversionFunnelData = [
  { etapa: 'Cadastrados', valor: 9, fill: 'hsl(var(--primary))' },
  { etapa: 'Com Negócios', valor: 5, fill: 'hsl(210 80% 55%)' },
  { etapa: 'Convertidos', valor: 3, fill: 'hsl(160 60% 45%)' },
  { etapa: 'Recorrentes', valor: 1, fill: 'hsl(45 93% 47%)' },
];


/* ── Period filter helper ── */
type PeriodKey = '3m' | '6m' | '12m' | 'custom';
const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: '3m', label: '3 meses' },
  { key: '6m', label: '6 meses' },
  { key: '12m', label: '12 meses' },
];


/* ── Animation variants ── */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ── Custom Tooltip ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <p key={i} className="text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium text-foreground">{
            typeof entry.value === 'number' && entry.value > 1000
              ? formatCurrency(entry.value)
              : entry.value
          }</span>
        </p>
      ))}
    </div>
  );
}

/* ── Comissões Tooltip with percentages ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ComissoesTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const items = payload.map((p: any) => ({
    key: p.dataKey as string,
    name: p.name as string,
    value: (p.value ?? 0) as number,
    color: p.stroke || p.color,
  }));
  const total = items.reduce((s: number, i: { value: number }) => s + i.value, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-sm min-w-[200px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {items.map((item: { key: string; name: string; value: number; color: string }) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="font-medium text-foreground">{formatCurrency(item.value)} <span className="text-xs text-muted-foreground">({pct}%)</span></span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-border/50 flex justify-between">
        <span className="text-muted-foreground font-medium">Total</span>
        <span className="font-bold text-foreground">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

/* ── Comissão Filter Buttons ── */
function ComissaoFilterButtons({ value, onChange }: { value: ComissaoFilter; onChange: (v: ComissaoFilter) => void }) {
  return (
    <div className="flex items-center gap-1">
      {COMISSAO_FILTER_OPTIONS.map((opt) => (
        <Button
          key={opt.key}
          variant={value === opt.key ? 'default' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-[10px] rounded-lg"
          onClick={() => onChange(opt.key)}
        >
          {opt.key !== 'todos' && <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: opt.color }} />}
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, icon: Icon, color, bg, change }: {
  label: string; value: string | number; icon: React.ElementType; color: string; bg: string; change?: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            {change && (
              <span className="text-xs font-medium text-emerald-500 flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                {change}
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-foreground mt-3">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Chart Card wrapper ── */
function ChartCard({ title, subtitle, icon: Icon, iconBg, iconColor, children, delay = 0, rightSlot }: {
  title: string; subtitle: string; icon: React.ElementType; iconBg: string; iconColor: string;
  children: React.ReactNode; delay?: number; rightSlot?: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} className="h-full">
        <Card className="border-0 shadow-sm h-full overflow-hidden">
          <CardContent className="p-4 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                <p className="text-[11px] text-muted-foreground">{subtitle}</p>
              </div>
              {rightSlot}
            </div>
            <div className="w-full">
              {children}
            </div>
          </CardContent>
      </Card>
    </motion.div>
  );
}


/* ── Period Filter Buttons ── */
function PeriodFilter({ value, onChange, customStart, customEnd, onCustomStartChange, onCustomEndChange }: {
  value: PeriodKey; onChange: (v: PeriodKey) => void;
  customStart: Date | undefined; customEnd: Date | undefined;
  onCustomStartChange: (v: Date | undefined) => void; onCustomEndChange: (v: Date | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1">
        {PERIOD_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            variant={value === opt.key ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 text-[11px] rounded-lg"
            onClick={() => onChange(opt.key)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant={value === 'custom' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 px-2.5 text-[11px] rounded-lg"
          onClick={() => onChange('custom')}
        >
          <Search className="h-3 w-3 mr-1" />
          Personalizado
        </Button>
        {value === 'custom' && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-7 px-2.5 text-[11px] rounded-lg gap-1", !customStart && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3" />
                  {customStart ? format(customStart, "dd/MM/yyyy") : "Início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customStart}
                  onSelect={onCustomStartChange}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-7 px-2.5 text-[11px] rounded-lg gap-1", !customEnd && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3" />
                  {customEnd ? format(customEnd, "dd/MM/yyyy") : "Fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customEnd}
                  onSelect={onCustomEndChange}
                  disabled={(date) => customStart ? date < customStart : false}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => {
                onCustomStartChange(undefined);
                onCustomEndChange(undefined);
                onChange('6m');
              }}
              title="Limpar filtro"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Month name to index mapping for date filtering ── */
const MONTH_MAP: Record<string, number> = {
  'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
  'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11,
};

function sliceByPeriodWithDates<T extends { mes?: string; ano?: number }>(data: T[], period: PeriodKey, customStart?: Date, customEnd?: Date): T[] {
  if (period === 'custom' && customStart && customEnd) {
    const startVal = customStart.getFullYear() * 12 + customStart.getMonth();
    const endVal = customEnd.getFullYear() * 12 + customEnd.getMonth();

    return data.filter(d => {
      const m = MONTH_MAP[d.mes || ''];
      if (m === undefined || !d.ano) return false;
      const itemVal = d.ano * 12 + m;
      return itemVal >= startVal && itemVal <= endVal;
    });
  }
  const total = data.length;
  if (period === '3m') return data.slice(total - 3);
  if (period === '6m') return data.slice(total - 6);
  return data;
}

/* ══════════════════════════════════════
   Main Component
   ══════════════════════════════════════ */

interface NetworkOverviewTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  diretasList: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indiretasList: any[];
  comissaoPercent: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpenDetail?: (membro: any) => void;
}

export default function NetworkOverviewTab({ diretasList, indiretasList, comissaoPercent, onOpenDetail }: NetworkOverviewTabProps) {
  const [period, setPeriod] = useState<PeriodKey>('6m');
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);

  const handleCustomStartChange = (date: Date | undefined) => {
    setCustomStart(date);
    if (date && customEnd && customEnd < date) {
      setCustomEnd(undefined);
    }
  };
  const [comissaoFilter, setComissaoFilter] = useState<ComissaoFilter>('todos');

  const topIndicados = useMemo(() => {
    const all = [
      ...diretasList.map(m => ({ ...m, nome: m.usuario?.nome || m.nome || 'Sem nome' })),
      ...indiretasList.map(m => ({ ...m, nome: m.usuario?.nome || m.nome || 'Sem nome' })),
    ];
    return all
      .sort((a, b) => (b.valor_total || 0) - (a.valor_total || 0))
      .slice(0, 5);
  }, [diretasList, indiretasList]);

  const valorDiretas = useMemo(() => diretasList.reduce((acc, m) => acc + (m.valor_total || 0), 0), [diretasList]);
  const valorIndiretas = useMemo(() => indiretasList.reduce((acc, m) => acc + (m.valor_total || 0), 0), [indiretasList]);
  const valorTotalOps = valorDiretas + valorIndiretas;

  // Comissões por conta própria (soma de propria em todos os meses)
  const comissoesPropria = useMemo(() => allComissoesData.reduce((acc, m) => acc + m.propria, 0), []);
  // Valor indicações rede (soma de nivel1 + nivel2 em todos os meses)
  const comissoesRede = useMemo(() => allComissoesData.reduce((acc, m) => acc + m.nivel1 + m.nivel2, 0), []);
  const potencialGanhos = valorTotalOps * comissaoPercent;
  const taxaConversao = diretasList.length > 0
    ? Math.round((diretasList.filter(m => (m.numero_negocios || 0) > 0).length / diretasList.length) * 100)
    : 0;

  const indicacoesData = useMemo(() => sliceByPeriodWithDates(allIndicacoesData, period, customStart, customEnd), [period, customStart, customEnd]);
  const comissoesData = useMemo(() => sliceByPeriodWithDates(allComissoesData, period, customStart, customEnd), [period, customStart, customEnd]);
  const potenciaisGanhosData = useMemo(() => sliceByPeriodWithDates(allPotenciaisGanhosData, period, customStart, customEnd), [period, customStart, customEnd]);

  const monthsCount = indicacoesData.length;

  const periodLabel = period === 'custom' && customStart && customEnd
    ? `${format(customStart, 'dd/MM/yy')} — ${format(customEnd, 'dd/MM/yy')}`
    : (PERIOD_OPTIONS.find(p => p.key === period)?.label || '');

  return (
    <div className="space-y-3">
      {/* ── Period filter (global) ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Período de análise</h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={monthsCount}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 rounded-md">
                {monthsCount} {monthsCount === 1 ? 'mês' : 'meses'}
              </Badge>
            </motion.div>
          </AnimatePresence>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomStartChange={handleCustomStartChange} onCustomEndChange={setCustomEnd} />
      </motion.div>

      {/* ── Financial Summary Cards ── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Valor Total Operações" value={formatCurrency(valorTotalOps)} icon={DollarSign} color="text-primary" bg="bg-primary/10" change="+18%" />
        <StatCard label="Comissões Conta Própria" value={formatCurrency(comissoesPropria)} icon={UserPlus} color="text-emerald-500" bg="bg-emerald-500/10" change="+12%" />
        <StatCard label="Valor Indicações Rede" value={formatCurrency(comissoesRede)} icon={GitBranch} color="text-blue-500" bg="bg-blue-500/10" change="+8%" />
        <StatCard label={`Potenciais Ganhos (${Math.round(comissaoPercent * 100)}%)`} value={formatCurrency(potencialGanhos)} icon={TrendingUp} color="text-amber-500" bg="bg-amber-500/10" change="+24%" />
      </motion.div>

      {/* ── Row 2: Performance KPIs ── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Comissões Recebidas" value={formatCurrency(potencialGanhos * 0.6)} icon={CircleCheckBig} color="text-emerald-500" bg="bg-emerald-500/10" change="+15%" />
        <StatCard label="Comissões Pendentes" value={formatCurrency(potencialGanhos * 0.4)} icon={Clock} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard label="Indicados Ativos" value={`${diretasList.filter(m => m.status === 'Ativo').length + indiretasList.filter(m => m.status === 'Ativo').length}`} icon={Zap} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard label="Última Indicação" value={diretasList.length > 0 ? 'Recente' : '—'} icon={CalendarDays} color="text-blue-500" bg="bg-blue-500/10" />
      </motion.div>

      {/* ── Row 3: Main Charts ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Evolução de Indicações" subtitle={periodLabel} icon={UserPlus} iconBg="bg-primary/10" iconColor="text-primary" delay={0.1}>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={indicacoesData} margin={{ top: 5, right: 15, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="diretas" name="Diretas" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                <Area type="monotone" dataKey="indiretas" name="Indiretas" stackId="1" stroke="hsl(210 80% 55%)" fill="hsl(210 80% 55%)" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-5 mt-3 text-xs text-muted-foreground px-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Diretas</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(210 80% 55%)' }} /> Indiretas</span>
          </div>
        </ChartCard>

        <ChartCard title="Comissões Originadas" subtitle={`Últimos ${periodLabel}`} icon={DollarSign} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" delay={0.2} rightSlot={<ComissaoFilterButtons value={comissaoFilter} onChange={setComissaoFilter} />}>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comissoesData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCurrencyShort} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ComissoesTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                {(comissaoFilter === 'todos' || comissaoFilter === 'propria') && (
                  <Bar dataKey="propria" name="Conta Própria" fill="hsl(160 60% 45%)" stackId={comissaoFilter === 'todos' ? 'stack' : undefined} radius={comissaoFilter !== 'todos' ? [4, 4, 0, 0] : undefined} fillOpacity={0.85} />
                )}
                {(comissaoFilter === 'todos' || comissaoFilter === 'nivel1') && (
                  <Bar dataKey="nivel1" name="Indicados Nível 1" fill="hsl(210 80% 55%)" stackId={comissaoFilter === 'todos' ? 'stack' : undefined} radius={comissaoFilter !== 'todos' ? [4, 4, 0, 0] : undefined} fillOpacity={0.85} />
                )}
                {(comissaoFilter === 'todos' || comissaoFilter === 'nivel2') && (
                  <Bar dataKey="nivel2" name="Indicados Nível 2" fill="hsl(270 60% 55%)" stackId={comissaoFilter === 'todos' ? 'stack' : undefined} radius={comissaoFilter !== 'todos' ? [4, 4, 0, 0] : [4, 4, 0, 0]} fillOpacity={0.85} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Resumo numérico por nível */}
          {(() => {
            const totalPropria = comissoesData.reduce((s: number, d: { propria: number }) => s + d.propria, 0);
            const totalN1 = comissoesData.reduce((s: number, d: { nivel1: number }) => s + d.nivel1, 0);
            const totalN2 = comissoesData.reduce((s: number, d: { nivel2: number }) => s + d.nivel2, 0);
            const grand = totalPropria + totalN1 + totalN2;
            return (
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-xl bg-muted/40 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(160 60% 45%)' }} />
                    <span className="text-[11px] text-muted-foreground font-medium">Própria</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(totalPropria)}</p>
                  <p className="text-[10px] text-muted-foreground">{grand > 0 ? Math.round((totalPropria / grand) * 100) : 0}% do total</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(210 80% 55%)' }} />
                    <span className="text-[11px] text-muted-foreground font-medium">Nível 1</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(totalN1)}</p>
                  <p className="text-[10px] text-muted-foreground">{grand > 0 ? Math.round((totalN1 / grand) * 100) : 0}% do total</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(270 60% 55%)' }} />
                    <span className="text-[11px] text-muted-foreground font-medium">Nível 2</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(totalN2)}</p>
                  <p className="text-[10px] text-muted-foreground">{grand > 0 ? Math.round((totalN2 / grand) * 100) : 0}% do total</p>
                </div>
              </div>
            );
          })()}
        </ChartCard>
      </div>

      {/* ── Row 4: Pie + Funnel ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Distribuição por Status" subtitle="Status atual dos indicados" icon={TrendingUp} iconBg="bg-violet-500/10" iconColor="text-violet-500" delay={0.3}>
          <div className="h-[240px] w-full flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={statusDistributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {statusDistributionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3 pl-4">
              {statusDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Funil de Conversão" subtitle="Da indicação ao negócio recorrente" icon={TrendingUp} iconBg="bg-amber-500/10" iconColor="text-amber-500" delay={0.4}>
          <div className="space-y-4 pt-2">
            {conversionFunnelData.map((step) => {
              const pct = Math.round((step.valor / conversionFunnelData[0].valor) * 100);
              return (
                <div key={step.etapa} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{step.etapa}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{step.valor}</span>
                      <Badge variant="outline" className="text-[10px] font-normal">{pct}%</Badge>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2.5" />
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* ── Row 5: Potenciais Ganhos + Top Indicados ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Potenciais Ganhos */}
        <ChartCard title="Potenciais Ganhos" subtitle={`Real vs potencial · ${periodLabel}`} icon={DollarSign} iconBg="bg-amber-500/10" iconColor="text-amber-500" delay={0.5}>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={potenciaisGanhosData} margin={{ top: 5, right: 15, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCurrencyShort} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ganhoPotencial" name="Potencial" stroke="hsl(45 93% 47%)" fill="hsl(45 93% 47%)" fillOpacity={0.15} strokeWidth={2} strokeDasharray="6 3" />
                <Area type="monotone" dataKey="ganhoReal" name="Realizado" stroke="hsl(160 60% 45%)" fill="hsl(160 60% 45%)" fillOpacity={0.3} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-5 mt-3 text-xs text-muted-foreground px-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(160 60% 45%)' }} /> Realizado</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(45 93% 47%)' }} /> Potencial</span>
          </div>
        </ChartCard>

        {/* Top Indicados Ranking */}
        <ChartCard title="Top Indicados" subtitle="Ranking por volume de negócios" icon={TrendingUp} iconBg="bg-amber-500/10" iconColor="text-amber-500" delay={0.6}>
          <div className="space-y-3">
           {topIndicados.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum indicado encontrado.</p>
            ) : (
              topIndicados.map((indicado, i) => (
                <div
                  key={indicado.id || i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onOpenDetail?.(indicado)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500/20 text-amber-500' : i === 1 ? 'bg-muted text-muted-foreground' : i === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-muted/50 text-muted-foreground'
                  }`}>
                    {i + 1}º
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{indicado.nome}</p>
                    <p className="text-xs text-muted-foreground">{indicado.numero_negocios || 0} negócio{(indicado.numero_negocios || 0) !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrencyShort(indicado.valor_total || 0)}</p>
                    <Badge variant={indicado.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px]">{indicado.status || '—'}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
