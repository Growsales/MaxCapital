import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { 
  ArrowLeft,
  Percent,
  DollarSign,
  Clock,
  Calendar,
  
  Building2,
  Shield,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  FileText,
  AlertCircle,
  Share2,
  Bookmark,
  ExternalLink,
  ChevronRight,
  HandHeart,
  Loader2,
  Download,
  Lock
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/card';

import { Input } from '@/shared/components/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ManifestInterestModal } from '@/features/opportunities/components/ManifestInterestModal';
import { ShareButton } from '@/components/opportunities/ShareButton';
import { toast } from '@/shared/hooks/use-toast';
import { 
  useOportunidadeInvestimento,
  useManifestacaoInteresse,
  useManifestInterest,
  OportunidadeInvestimento,
  FinanceiroData
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
  LabelList
} from 'recharts';

const statusConfig = {
  aberta: {
    label: 'Captação Aberta',
    color: 'bg-foreground/10 text-foreground backdrop-blur-md border border-foreground/20',
    icon: CheckCircle2,
  },
  encerrada: {
    label: 'Captação Encerrada',
    color: 'bg-foreground/10 text-foreground backdrop-blur-md border border-foreground/20',
    icon: XCircle,
  },
  captada: {
    label: 'Captação Concluída',
    color: 'bg-foreground/10 text-foreground backdrop-blur-md border border-foreground/20',
    icon: Sparkles,
  },
};

const riscoConfig = {
  Baixo: { color: 'text-primary', bg: 'bg-primary/10' },
  Médio: { color: 'text-warning', bg: 'bg-warning/10' },
  Alto: { color: 'text-destructive', bg: 'bg-destructive/10' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

const setorHighlightMetric: Record<string, { label: string; getValue: (opp: OportunidadeInvestimento) => string }> = {
  imobiliario: { label: 'VGV', getValue: (opp) => formatBRL(opp.alvo_maximo * 1.4) },
  agronegocio: { label: 'Área / Produção', getValue: (opp) => opp.financeiro?.faturamento_2025 ? `${(opp.alvo_maximo / 15000).toFixed(0)} ha` : '—' },
  tech: { label: 'Valuation', getValue: (opp) => opp.financeiro?.faturamento_2025 ? formatBRL(opp.financeiro.faturamento_2025 * 8) : '—' },
  infraestrutura: { label: 'CAPEX', getValue: (opp) => formatBRL(opp.alvo_maximo * 0.85) },
  negocios: { label: 'Faturamento', getValue: (opp) => opp.financeiro?.faturamento_2025 ? formatBRL(opp.financeiro.faturamento_2025) : '—' },
  outros: { label: 'Valor Face', getValue: (opp) => formatBRL(opp.alvo_maximo) },
};

const SEGMENTO_ALIASES_DETAIL: Record<string, string> = {
  'startups': 'tech',
  'tecnologia': 'tech',
  'energia': 'infraestrutura',
  'energia renovável': 'infraestrutura',
  'industrial': 'negocios',
  'comercial': 'negocios',
  'logística': 'infraestrutura',
  'saneamento': 'infraestrutura',
  'saúde': 'tech',
  'educação': 'tech',
};

function findSetorForSegmentoDetail(segmentoValue: string): string | null {
  const lower = segmentoValue.toLowerCase();
  const setores = getSetores();
  const valueMatch = setores.find(s => s.value === lower);
  if (valueMatch) return valueMatch.value;
  const labelMatch = setores.find(s => s.label.toLowerCase() === lower);
  if (labelMatch) return labelMatch.value;
  for (const [setorKey, segmentos] of Object.entries(SEGMENTOS_POR_SETOR)) {
    if (segmentos.some(s => s.label.toLowerCase() === lower || s.value.toLowerCase() === lower)) {
      return setorKey;
    }
  }
  if (SEGMENTO_ALIASES_DETAIL[lower]) return SEGMENTO_ALIASES_DETAIL[lower];
  return null;
}

interface Milestone {
  label: string;
  completed: boolean;
  current: boolean;
}

function getMilestonesForSetor(setor: string): Milestone[] {
  const milestonesMap: Record<string, Milestone[]> = {
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
  return milestonesMap[setor] || milestonesMap['outros'];
}

const formatCurrencyShort = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toFixed(0);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// Financial Chart Component
interface ChartDataPoint {
  year: string;
  value: number;
  label: string;
  isProjection?: boolean;
}

function FinancialChart({ 
  title, 
  data, 
  color 
}: { 
  title: string; 
  data: ChartDataPoint[]; 
  color: string;
}) {
  const growth = data.length >= 2 && data[0].value > 0
    ? (((data[data.length - 1].value - data[0].value) / data[0].value) * 100).toFixed(0)
    : null;

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {growth && Number(growth) > 0 && (
            <span className="text-xs text-muted-foreground font-medium">+{growth}%</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 5, left: 5, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => formatCurrencyShort(value)}
                width={50}
              />
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.15)', radius: 4 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const value = payload[0].value as number;
                  return (
                    <div className="rounded-xl bg-popover border border-border shadow-lg px-4 py-3 min-w-[160px]">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(value)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{title}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={color}
                    fillOpacity={entry.isProjection ? 0.4 : 0.8}
                  />
                ))}
                <LabelList 
                  dataKey="value" 
                  position="top" 
                  formatter={(value: number) => formatCurrencyShort(value)}
                  fill="hsl(var(--muted-foreground))"
                  fontSize={10}
                  fontWeight={500}
                  offset={6}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mt-2">
          {data.map((item) => (
            <div key={item.year} className="text-center py-1.5">
              <span className="text-[10px] text-muted-foreground block">{item.label}</span>
              <span className="text-xs font-semibold text-foreground">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OpportunityDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'operacao' | 'empresa' | 'financeiro' | 'documentos'>('operacao');

  const { data: opportunity, isLoading } = useOportunidadeInvestimento(id);
  const { data: manifestacao } = useManifestacaoInteresse(id);
  const manifestInterestMutation = useManifestInterest();
  const { user, profile } = useAuth();
  const hasManifested = !!manifestacao;
  const isOwnOpportunity = opportunity?.originador_id === user?.id || profile?.tipo === 'parceiro' && opportunity?.originador_id === user?.id;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando oportunidade...</p>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Oportunidade não encontrada</h2>
        <p className="text-muted-foreground">A oportunidade que você procura não existe ou foi removida.</p>
        <Button onClick={() => navigate('/oportunidades')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às Oportunidades
        </Button>
      </div>
    );
  }

  const status = statusConfig[opportunity.status];
  const StatusIcon = status.icon;
  const captadoPercent = (opportunity.captado / opportunity.alvo_maximo) * 100;
  


  // Prepare financial chart data
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

  const handleManifestInterest = async () => {
    try {
      await manifestInterestMutation.mutateAsync(opportunity.id);
      setShowInterestModal(false);
      toast({
        title: 'Interesse manifestado!',
        description: 'Você agora tem acesso aos documentos da operação. Entraremos em contato em breve.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível manifestar seu interesse. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const empresa = opportunity.empresa as { nome: string; descricao: string; experiencia: string; projetos: number; unidades_entregues: number };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button & Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/oportunidades')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span>Oportunidades</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{opportunity.nome}</span>
      </div>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden border border-border/50"
      >
        {/* Background image from card */}
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
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
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
              
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(opportunity.data_inicio)} - {formatDate(opportunity.data_fim)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShareButton opportunityId={opportunity.id} opportunityName={opportunity.nome} variant="page" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content with Sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
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

          {/* Section Content */}
          {activeSection === 'operacao' && (
            <div className="space-y-6">
              {/* Key Metrics - matching card layout */}
              {(() => {
                const setorKey = findSetorForSegmentoDetail(opportunity.segmento);
                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-border/50">
                        <CardContent className="p-4 text-center">
                          <Percent className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">Rentabilidade</p>
                          <p className="text-xl font-bold text-foreground">
                            {opportunity.rentabilidade > 0 ? `${opportunity.rentabilidade.toFixed(2)}%` : 'Variável'}
                          </p>
                          <p className="text-xs text-muted-foreground">ao ano</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50">
                        <CardContent className="p-4 text-center">
                          <DollarSign className="h-8 w-8 mx-auto mb-2 text-info" />
                          <p className="text-sm text-muted-foreground">ROI</p>
                          <p className="text-xl font-bold text-foreground">
                            {opportunity.rentabilidade > 0 ? `${opportunity.rentabilidade.toFixed(2)}%` : 'Variável'}
                          </p>
                          <p className="text-xs text-muted-foreground">retorno estimado</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50">
                        <CardContent className="p-4 text-center">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
                          <p className="text-sm text-muted-foreground">Prazo</p>
                          <p className="text-xl font-bold text-foreground">
                            {opportunity.prazo > 0 ? `${opportunity.prazo} meses` : 'Indeterm.'}
                          </p>
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

                    {/* Captação + Métrica do Setor */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border-border/50">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <DollarSign className="h-3.5 w-3.5 text-primary" />
                            Captação
                          </div>
                          <p className="font-extrabold text-2xl text-primary tracking-tight">
                            {formatBRL(opportunity.alvo_maximo)}
                          </p>
                        </CardContent>
                      </Card>
                      {setorKey && setorHighlightMetric[setorKey] && (
                        <Card className="border-border/50">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {setorHighlightMetric[setorKey].label}
                            </div>
                            <p className="font-bold text-2xl text-foreground tracking-tight">
                              {setorHighlightMetric[setorKey].getValue(opportunity)}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </>
                );
              })()}

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Detalhes da Operação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <p className="text-3xl font-bold text-foreground">
                        {empresa?.unidades_entregues?.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Unidades Entregues</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'financeiro' && (
            <div className="space-y-6">
              <FinancialChart 
                title="Faturamento Bruto" 
                data={faturamentoData}
                color="hsl(var(--muted-foreground))"
              />
              <FinancialChart 
                title="EBITDA" 
                data={ebitdaData}
                color="hsl(var(--foreground))"
              />
            </div>
          )}

          {activeSection === 'documentos' && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos da Operação
                </CardTitle>
                <CardDescription>
                  {hasManifested 
                    ? 'Acesse os documentos completos da operação'
                    : 'Manifeste interesse para desbloquear os documentos'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasManifested ? (
                  <div className="space-y-3">
                    {[
                      { nome: 'Termo de Adesão', tipo: 'PDF' },
                      { nome: 'Prospecto da Oferta', tipo: 'PDF' },
                      { nome: 'Demonstrativos Financeiros', tipo: 'PDF' },
                      { nome: 'Contrato de Garantia', tipo: 'PDF' },
                    ].map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.nome}</p>
                            <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Documentos Bloqueados</h3>
                    <p className="text-muted-foreground max-w-sm mb-4">
                      Para acessar os documentos completos da operação, é necessário manifestar seu interesse.
                    </p>
                    {!isOwnOpportunity && (
                      <Button onClick={() => setShowInterestModal(true)}>
                        <HandHeart className="h-4 w-4 mr-2" />
                        Manifestar Interesse
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            {/* Project Milestones */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Etapas do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const customMilestones = (opportunity as any).milestones as Array<{label: string; completed: boolean; current: boolean}> | undefined;
                  const setorKey = findSetorForSegmentoDetail(opportunity.segmento);
                  const milestones = customMilestones && customMilestones.length > 0
                    ? customMilestones
                    : getMilestonesForSetor(setorKey || 'outros');
                  return (
                    <div className="space-y-0">
                      {milestones.map((milestone, index) => (
                        <div key={index} className="flex items-start gap-3 relative">
                          {index < milestones.length - 1 && (
                            <div className="absolute left-[11px] top-7 w-0.5 h-[calc(100%-4px)] bg-border" />
                          )}
                          <div className={cn(
                            'h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold',
                            milestone.completed 
                              ? 'bg-primary text-primary-foreground' 
                              : milestone.current 
                                ? 'bg-primary/20 text-primary border-2 border-primary' 
                                : 'bg-muted text-muted-foreground'
                          )}>
                            {milestone.completed ? '✓' : index + 1}
                          </div>
                          <div className="pb-5">
                            <p className={cn(
                              'text-sm font-medium',
                              milestone.current ? 'text-primary' : milestone.completed ? 'text-foreground' : 'text-muted-foreground'
                            )}>
                              {milestone.label}
                            </p>
                            {milestone.current && (
                              <p className="text-xs text-primary/70 mt-0.5">Em andamento</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Target Return - 3 Scenarios */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Retorno Alvo
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
                <p className="text-[10px] text-muted-foreground text-center pt-2">
                  * Retornos projetados, sujeitos a variações de mercado
                </p>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="border-border/50">
              <CardContent className="pt-6 space-y-4">
                {opportunity.status === 'aberta' && !hasManifested && !isOwnOpportunity && (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setShowInterestModal(true)}
                  >
                    <HandHeart className="h-5 w-5 mr-2" />
                    Manifestar Interesse
                  </Button>
                )}
                {isOwnOpportunity && (
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-semibold text-muted-foreground">Sua Oportunidade</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Você é o originador desta oportunidade
                    </p>
                  </div>
                )}

                {hasManifested && (
                  <div className="p-4 rounded-lg bg-primary/10 text-center">
                    <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-primary">Interesse Manifestado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Entraremos em contato em breve
                    </p>
                  </div>
                )}

                {opportunity.status !== 'aberta' && !hasManifested && (
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-semibold text-muted-foreground">Captação Finalizada</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Esta oferta não aceita novos investidores
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Ao investir, você concorda com os termos e condições da oferta.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Interest Modal */}
      <ManifestInterestModal
        open={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        opportunityName={opportunity.nome}
        onSuccess={handleManifestInterest}
      />
    </div>
  );
}
