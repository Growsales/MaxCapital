import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Percent,
  DollarSign,
  Clock,
  Calendar,
  Building2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  FileText,
  Loader2,
  AlertCircle,
  LogIn,
  Lock,
  Download,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/card';
import { Progress } from '@/shared/components/progress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ShareButton } from '@/components/opportunities/ShareButton';
import {
  useOportunidadeInvestimento,
  OportunidadeInvestimento,
  FinanceiroData,
} from '@/hooks/useOportunidadesInvestimento';
import { getSetores, getSetorLabel } from '@/lib/setores-segmentos';
import { SEGMENTOS_POR_SETOR } from '@/features/operations/components/NewDealWizard/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

// ── Config ──────────────────────────────────────────────

const statusConfig = {
  aberta: { label: 'Captação Aberta', color: 'bg-foreground/10 text-foreground backdrop-blur-md border border-foreground/20', icon: CheckCircle2 },
  encerrada: { label: 'Captação Encerrada', color: 'bg-foreground/10 text-foreground backdrop-blur-md border border-foreground/20', icon: XCircle },
  captada: { label: 'Captação Concluída', color: 'bg-foreground/10 text-foreground backdrop-blur-md border border-foreground/20', icon: Sparkles },
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatCurrencyShort = (v: number) => Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v.toFixed(0);
const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

const SEGMENTO_ALIASES: Record<string, string> = {
  startups: 'tech', tecnologia: 'tech', energia: 'infraestrutura',
  'energia renovável': 'infraestrutura', industrial: 'negocios',
  comercial: 'negocios', logística: 'infraestrutura',
  saneamento: 'infraestrutura', saúde: 'tech', educação: 'tech',
};

function findSetorForSegmento(seg: string): string | null {
  const lower = seg.toLowerCase();
  const setores = getSetores();
  const v = setores.find(s => s.value === lower);
  if (v) return v.value;
  const l = setores.find(s => s.label.toLowerCase() === lower);
  if (l) return l.value;
  for (const [k, segs] of Object.entries(SEGMENTOS_POR_SETOR)) {
    if (segs.some(s => s.label.toLowerCase() === lower || s.value.toLowerCase() === lower)) return k;
  }
  return SEGMENTO_ALIASES[lower] || null;
}

const setorHighlightMetric: Record<string, { label: string; getValue: (o: OportunidadeInvestimento) => string }> = {
  imobiliario: { label: 'VGV', getValue: (o) => formatBRL(o.alvo_maximo * 1.4) },
  agronegocio: { label: 'Área / Produção', getValue: (o) => o.financeiro?.faturamento_2025 ? `${(o.alvo_maximo / 15000).toFixed(0)} ha` : '—' },
  tech: { label: 'Valuation', getValue: (o) => o.financeiro?.faturamento_2025 ? formatBRL(o.financeiro.faturamento_2025 * 8) : '—' },
  infraestrutura: { label: 'CAPEX', getValue: (o) => formatBRL(o.alvo_maximo * 0.85) },
  negocios: { label: 'Faturamento', getValue: (o) => o.financeiro?.faturamento_2025 ? formatBRL(o.financeiro.faturamento_2025) : '—' },
  outros: { label: 'Valor Face', getValue: (o) => formatBRL(o.alvo_maximo) },
};

const setorGradients: Record<string, string> = {
  imobiliario: 'from-cyan-500/80 via-sky-600/70 to-blue-800/80',
  agronegocio: 'from-emerald-500/80 via-green-600/70 to-teal-800/80',
  tech: 'from-violet-500/80 via-purple-600/70 to-indigo-800/80',
  infraestrutura: 'from-amber-400/80 via-orange-500/70 to-red-700/80',
  negocios: 'from-rose-400/80 via-pink-500/70 to-fuchsia-700/80',
  outros: 'from-slate-400/80 via-slate-500/70 to-slate-700/80',
  default: 'from-primary/60 via-primary/40 to-primary/20',
};

function getMilestonesForSetor(setor: string) {
  const map: Record<string, Array<{ label: string; completed: boolean; current: boolean }>> = {
    imobiliario: [
      { label: 'Aquisição do terreno', completed: true, current: false },
      { label: 'Aprovação do projeto', completed: true, current: false },
      { label: 'Fase de construção', completed: false, current: true },
      { label: 'Comercialização', completed: false, current: false },
      { label: 'Entrega das unidades', completed: false, current: false },
    ],
    agronegocio: [
      { label: 'Planejamento da safra', completed: true, current: false },
      { label: 'Plantio', completed: true, current: false },
      { label: 'Manejo e cultivo', completed: false, current: true },
      { label: 'Colheita', completed: false, current: false },
      { label: 'Comercialização', completed: false, current: false },
    ],
    tech: [
      { label: 'Validação de mercado', completed: true, current: false },
      { label: 'Desenvolvimento do MVP', completed: true, current: false },
      { label: 'Tração inicial', completed: false, current: true },
      { label: 'Escala', completed: false, current: false },
      { label: 'Rodada de follow-on', completed: false, current: false },
    ],
    infraestrutura: [
      { label: 'Estudos de viabilidade', completed: true, current: false },
      { label: 'Licenciamento ambiental', completed: true, current: false },
      { label: 'Execução da obra', completed: false, current: true },
      { label: 'Testes e comissionamento', completed: false, current: false },
      { label: 'Operação comercial', completed: false, current: false },
    ],
    negocios: [
      { label: 'Due diligence', completed: true, current: false },
      { label: 'Estruturação', completed: true, current: false },
      { label: 'Captação', completed: false, current: true },
      { label: 'Implantação', completed: false, current: false },
      { label: 'Retorno ao investidor', completed: false, current: false },
    ],
    outros: [
      { label: 'Análise preliminar', completed: true, current: false },
      { label: 'Estruturação', completed: true, current: false },
      { label: 'Em andamento', completed: false, current: true },
      { label: 'Finalização', completed: false, current: false },
    ],
  };
  return map[setor] || map['outros'];
}

// ── Chart Component ─────────────────────────────────────

interface ChartDataPoint { year: string; value: number; label: string; isProjection?: boolean; }

function FinancialChart({ title, data, color }: { title: string; data: ChartDataPoint[]; color: string }) {
  const growth = data.length >= 2 && data[0].value > 0
    ? (((data[data.length - 1].value - data[0].value) / data[0].value) * 100).toFixed(0)
    : null;
  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {growth && Number(growth) > 0 && <span className="text-xs text-muted-foreground font-medium">+{growth}%</span>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 5, left: 5, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={formatCurrencyShort} width={50} />
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.15)', radius: 4 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-xl bg-popover border border-border shadow-lg px-4 py-3 min-w-[160px]">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(payload[0].value as number)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={color} fillOpacity={entry.isProjection ? 0.4 : 0.8} />
                ))}
                <LabelList dataKey="value" position="top" formatter={(v: number) => formatCurrencyShort(v)} fill="hsl(var(--muted-foreground))" fontSize={10} fontWeight={500} offset={6} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ───────────────────────────────────────────

export default function PublicOpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'operacao' | 'empresa' | 'financeiro' | 'documentos'>('operacao');

  const { data: opportunity, isLoading } = useOportunidadeInvestimento(id);

  // Dynamic OG meta tags
  useEffect(() => {
    if (!opportunity) return;
    const setMeta = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const title = `${opportunity.nome} | Max Capital`;
    const desc = `${opportunity.descricao?.slice(0, 150)}... | Rentabilidade: ${opportunity.rentabilidade}% a.a. | Captação: ${formatBRL(opportunity.alvo_maximo)}`;
    document.title = title;
    setMeta('og:title', title);
    setMeta('og:description', desc);
    setMeta('og:url', window.location.href);
    if (opportunity.image_url) setMeta('og:image', opportunity.image_url);
    return () => { document.title = 'Max Capital'; };
  }, [opportunity]);

  // Force dark mode on this page
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.add('dark');
    return () => { if (!hadDark) html.classList.remove('dark'); };
  }, []);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando oportunidade...</p>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-background">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Oportunidade não encontrada</h2>
        <p className="text-muted-foreground">Esta oportunidade não existe ou foi removida.</p>
        <Button onClick={() => navigate('/login')}><LogIn className="h-4 w-4 mr-2" />Acessar plataforma</Button>
      </div>
    );
  }

  const status = statusConfig[opportunity.status];
  const StatusIcon = status.icon;
  const captadoPercent = (opportunity.captado / opportunity.alvo_maximo) * 100;
  const setorKey = findSetorForSegmento(opportunity.segmento);
  const gradient = setorGradients[setorKey || ''] || setorGradients['default'];
  const empresa = opportunity.empresa as { nome: string; descricao: string; experiencia: string; projetos: number; unidades_entregues: number } | undefined;
  const financeiro = opportunity.financeiro as FinanceiroData;
  const faturamentoData: ChartDataPoint[] = [
    { year: '2023', value: financeiro?.faturamento_2023 || 0, label: '2023' },
    { year: '2024', value: financeiro?.faturamento_2024 || 0, label: '2024' },
    { year: '2025', value: financeiro?.faturamento_2025 || 0, label: '2025' },
    { year: '2026', value: financeiro?.faturamento_2026 || 0, label: '2026 (Proj)', isProjection: true },
  ];
  const ebitdaData: ChartDataPoint[] = [
    { year: '2023', value: financeiro?.ebitda_2023 || 0, label: '2023' },
    { year: '2024', value: financeiro?.ebitda_2024 || 0, label: '2024' },
    { year: '2025', value: financeiro?.ebitda_2025 || 0, label: '2025' },
    { year: '2026', value: financeiro?.ebitda_2026 || 0, label: '2026 (Proj)', isProjection: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-foreground tracking-tight">Max Capital</span>
          <div className="flex items-center gap-2">
            <ShareButton opportunityId={opportunity.id} opportunityName={opportunity.nome} variant="page" />
            <Button size="sm" onClick={() => navigate('/login')} className="gap-2">
              <LogIn className="h-4 w-4" />
              Entrar na plataforma
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden border border-border/50"
        >
          {opportunity.image_url ? (
            <img src={opportunity.image_url} alt={opportunity.nome} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-info/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/80 to-card/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />

          <div className="relative p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{opportunity.segmento}</Badge>
                <Badge variant="outline">{opportunity.instrumento}</Badge>
                <Badge className={cn('text-xs font-medium', status.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">{opportunity.nome}</h1>
              <p className="text-muted-foreground max-w-2xl">{opportunity.descricao}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(opportunity.data_inicio)} - {formatDate(opportunity.data_fim)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content with Sidebar - mirrors OpportunityDetailsPage */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Section Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'operacao' as const, label: 'Operação', icon: Target },
                { key: 'empresa' as const, label: 'Empresa', icon: Building2 },
                { key: 'financeiro' as const, label: 'Financeiro', icon: TrendingUp },
                { key: 'documentos' as const, label: 'Documentos', icon: FileText },
              ].map((section) => (
                <Button
                  key={section.key}
                  variant={activeSection === section.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveSection(section.key)}
                  className="gap-2"
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </Button>
              ))}
            </div>

            {/* Operação */}
            {activeSection === 'operacao' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-border/50">
                    <CardContent className="p-4 text-center">
                      <Percent className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Rentabilidade</p>
                      <p className="text-xl font-bold text-foreground">{opportunity.rentabilidade > 0 ? `${opportunity.rentabilidade.toFixed(2)}%` : 'Variável'}</p>
                      <p className="text-xs text-muted-foreground">ao ano</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-info" />
                      <p className="text-sm text-muted-foreground">ROI</p>
                      <p className="text-xl font-bold text-foreground">{opportunity.rentabilidade > 0 ? `${opportunity.rentabilidade.toFixed(2)}%` : 'Variável'}</p>
                      <p className="text-xs text-muted-foreground">retorno estimado</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
                      <p className="text-sm text-muted-foreground">Prazo</p>
                      <p className="text-xl font-bold text-foreground">{opportunity.prazo > 0 ? `${opportunity.prazo} meses` : 'Indeterm.'}</p>
                      <p className="text-xs text-muted-foreground">de duração</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Modalidade</p>
                      <p className="text-xl font-bold text-foreground">{opportunity.tipo}</p>
                      <p className="text-xs text-muted-foreground">tipo de operação</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-border/50">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <DollarSign className="h-3.5 w-3.5 text-primary" /> Captação
                      </div>
                      <p className="font-extrabold text-2xl text-primary tracking-tight">{formatBRL(opportunity.alvo_maximo)}</p>
                    </CardContent>
                  </Card>
                  {setorKey && setorHighlightMetric[setorKey] && (
                    <Card className="border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <TrendingUp className="h-3.5 w-3.5" /> {setorHighlightMetric[setorKey].label}
                        </div>
                        <p className="font-bold text-2xl text-foreground tracking-tight">{setorHighlightMetric[setorKey].getValue(opportunity)}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-lg">Detalhes da Operação</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de Operação</p>
                        <p className="font-medium">{opportunity.tipo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Instrumento</p>
                        <p className="font-medium">{opportunity.instrumento}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Devedora</p>
                        <p className="font-medium">{opportunity.devedora}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amortização</p>
                        <p className="font-medium">{opportunity.amortizacao}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Empresa */}
            {activeSection === 'empresa' && (
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{empresa?.nome}</CardTitle>
                      <CardDescription>{empresa?.experiencia} de experiência</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">{empresa?.descricao}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 text-center">
                      <p className="text-3xl font-bold text-foreground">{empresa?.projetos}</p>
                      <p className="text-sm text-muted-foreground">Projetos Realizados</p>
                    </div>
                    {(empresa?.unidades_entregues || 0) > 0 && (
                      <div className="p-4 rounded-lg bg-muted/30 text-center">
                        <p className="text-3xl font-bold text-foreground">{empresa?.unidades_entregues?.toLocaleString('pt-BR')}</p>
                        <p className="text-sm text-muted-foreground">Unidades Entregues</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financeiro */}
            {activeSection === 'financeiro' && (
              <div className="space-y-6">
                <FinancialChart title="Faturamento Bruto" data={faturamentoData} color="hsl(var(--muted-foreground))" />
                <FinancialChart title="EBITDA" data={ebitdaData} color="hsl(var(--foreground))" />
              </div>
            )}

            {/* Documentos - bloqueado na pública */}
            {activeSection === 'documentos' && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Documentos da Operação
                  </CardTitle>
                  <CardDescription>Acesse a plataforma para desbloquear os documentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Documentos Bloqueados</h3>
                    <p className="text-muted-foreground max-w-sm mb-4">
                      Para acessar os documentos completos, é necessário entrar na plataforma e manifestar interesse.
                    </p>
                    <Button onClick={() => navigate('/login')}>
                      <LogIn className="h-4 w-4 mr-2" /> Acessar plataforma
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-16 space-y-6">
              {/* Etapas do Projeto */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Etapas do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const customMilestones = (opportunity as any).milestones as Array<{ label: string; completed: boolean; current: boolean }> | undefined;
                    const milestones = customMilestones && customMilestones.length > 0
                      ? customMilestones
                      : getMilestonesForSetor(setorKey || 'outros');
                    return (
                      <div className="space-y-0">
                        {milestones.map((m, i) => (
                          <div key={i} className="flex items-start gap-3 relative">
                            {i < milestones.length - 1 && <div className="absolute left-[11px] top-7 w-0.5 h-[calc(100%-4px)] bg-border" />}
                            <div className={cn(
                              'h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold',
                              m.completed ? 'bg-primary text-primary-foreground' : m.current ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground'
                            )}>
                              {m.completed ? '✓' : i + 1}
                            </div>
                            <div className="pb-5">
                              <p className={cn('text-sm font-medium', m.current ? 'text-primary' : m.completed ? 'text-foreground' : 'text-muted-foreground')}>
                                {m.label}
                              </p>
                              {m.current && <p className="text-xs text-primary/70 mt-0.5">Em andamento</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Retorno Alvo */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Retorno Alvo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const opp = opportunity as any;
                    const baseReturn = opp.retorno_base > 0 ? opp.retorno_base : (opportunity.rentabilidade > 0 ? opportunity.rentabilidade : 15);
                    const pessimistic = opp.retorno_pessimista > 0 ? opp.retorno_pessimista : baseReturn * 0.6;
                    const optimistic = opp.retorno_otimista > 0 ? opp.retorno_otimista : baseReturn * 1.5;
                    return (
                      <>
                        <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Pessimista</span>
                            <span className="text-lg font-bold text-destructive">{pessimistic.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Cenário conservador</p>
                        </div>
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Base</span>
                            <span className="text-lg font-bold text-primary">{baseReturn.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Cenário esperado</p>
                        </div>
                        <div className="p-3 rounded-lg bg-chart-2/5 border border-chart-2/10">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Otimista</span>
                            <span className="text-lg font-bold text-chart-2">{optimistic.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Melhor cenário</p>
                        </div>
                      </>
                    );
                  })()}
                  <p className="text-[10px] text-muted-foreground text-center pt-2">* Retornos projetados, sujeitos a variações de mercado</p>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground mb-1">Interessado?</h3>
                    <p className="text-xs text-muted-foreground mb-4">Acesse a plataforma para manifestar interesse e desbloquear documentos.</p>
                  </div>
                  <Button className="w-full" size="lg" onClick={() => navigate('/login')}>
                    <LogIn className="h-5 w-5 mr-2" /> Acessar plataforma
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Ao investir, você concorda com os termos e condições da oferta.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/30 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Max Capital. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
