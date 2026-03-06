import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  TrendingUp,
  Clock,
  DollarSign,
  Percent,
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Target,
  ChevronDown,
  Loader2,
  BarChart3,
  Share2,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Checkbox } from '@/shared/components/checkbox';
import { Badge } from '@/shared/components/badge';
import { Progress } from '@/shared/components/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/collapsible';
import { cn } from '@/lib/utils';
import { ShareButton } from '@/components/opportunities/ShareButton';
import { motion, AnimatePresence } from 'framer-motion';
import { getSetores, getSetorLabel } from '@/lib/setores-segmentos';
import { SEGMENTOS_POR_SETOR } from '@/features/operations/components/NewDealWizard/types';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .replace(/(\d)([a-zA-Z])/g, '$1-$2')
    .toLowerCase();
}

function SetorIcon({ name, className }: { name: string; className?: string }) {
  const kebab = toKebabCase(name) as keyof typeof dynamicIconImports;
  if (!dynamicIconImports[kebab]) return null;
  const LucideIcon = lazy(dynamicIconImports[kebab]);
  return (
    <Suspense fallback={<span className={className} />}>
      <LucideIcon className={className} />
    </Suspense>
  );
}
import { 
  useOportunidadesInvestimento, 
  useOportunidadesStats,
  OportunidadeInvestimento 
} from '@/hooks/useOportunidadesInvestimento';
import { useConfigImage } from '@/hooks/useConfigImages';

const statusConfig = {
  aberta: {
    label: 'Aberta',
    color: 'bg-foreground/10 text-foreground backdrop-blur-md border border-foreground/20',
    icon: CheckCircle2,
  },
  encerrada: {
    label: 'Encerrada',
    color: 'bg-foreground/10 text-foreground backdrop-blur-md border border-foreground/20',
    icon: XCircle,
  },
  captada: {
    label: 'Captada com Sucesso',
    color: 'bg-foreground/10 text-foreground backdrop-blur-md border border-foreground/20',
    icon: Sparkles,
  },
};

const riscoConfig = {
  Baixo: 'text-primary',
  Médio: 'text-warning',
  Alto: 'text-destructive',
};


const setorHighlightMetric: Record<string, { label: string; getValue: (opp: OportunidadeInvestimento) => string }> = {
  imobiliario: { label: 'VGV', getValue: (opp) => formatBRL(opp.alvo_maximo * 1.4) },
  agronegocio: { label: 'Área / Produção', getValue: (opp) => opp.financeiro?.faturamento_2025 ? `${(opp.alvo_maximo / 15000).toFixed(0)} ha` : '—' },
  tech: { label: 'Valuation', getValue: (opp) => opp.financeiro?.faturamento_2025 ? formatBRL(opp.financeiro.faturamento_2025 * 8) : '—' },
  infraestrutura: { label: 'CAPEX', getValue: (opp) => formatBRL(opp.alvo_maximo * 0.85) },
  negocios: { label: 'Faturamento', getValue: (opp) => opp.financeiro?.faturamento_2025 ? formatBRL(opp.financeiro.faturamento_2025) : '—' },
  outros: { label: 'Valor Face', getValue: (opp) => formatBRL(opp.alvo_maximo) },
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

const modalidades = ['Dívida', 'Equity'];

const setorGradients: Record<string, string> = {
  'imobiliario': 'from-cyan-500/80 via-sky-600/70 to-blue-800/80',
  'agronegocio': 'from-emerald-500/80 via-green-600/70 to-teal-800/80',
  'tech': 'from-violet-500/80 via-purple-600/70 to-indigo-800/80',
  'infraestrutura': 'from-amber-400/80 via-orange-500/70 to-red-700/80',
  'negocios': 'from-rose-400/80 via-pink-500/70 to-fuchsia-700/80',
  'outros': 'from-slate-400/80 via-slate-500/70 to-slate-700/80',
  'default': 'from-primary/60 via-primary/40 to-primary/20',
};

// Alias map for legacy/free-text segmento values → setor key
const SEGMENTO_ALIASES: Record<string, string> = {
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

function findSetorForSegmento(segmentoValue: string): string | null {
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
  if (SEGMENTO_ALIASES[lower]) return SEGMENTO_ALIASES[lower];
  return null;
}

function findSegmentoLabel(segmentoValue: string): string | null {
  const lower = segmentoValue.toLowerCase();
  for (const segmentos of Object.values(SEGMENTOS_POR_SETOR)) {
    const match = segmentos.find(s => s.value.toLowerCase() === lower || s.label.toLowerCase() === lower);
    if (match) return match.label;
  }
  return null;
}

function OpportunityCard({ opportunity, onClick, index = 0 }: { opportunity: OportunidadeInvestimento; onClick: () => void; index?: number }) {
  const status = statusConfig[opportunity.status];
  const StatusIcon = status.icon;
  const captadoPercent = (opportunity.captado / opportunity.alvo_maximo) * 100;
  const setorKey = findSetorForSegmento(opportunity.segmento);
  const gradient = setorGradients[setorKey || ''] || setorGradients['default'];
  const setorLabel = setorKey ? getSetorLabel(setorKey) : opportunity.segmento;
  const setorIcon = setorKey ? getSetores().find(s => s.value === setorKey)?.icon || '' : '';
  const segmentoLabel = findSegmentoLabel(opportunity.segmento) || (
    opportunity.segmento.charAt(0).toUpperCase() + opportunity.segmento.slice(1)
  );
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card 
        className="group cursor-pointer overflow-hidden border-border/40 hover:border-primary/50 transition-all duration-300 bg-card h-full flex flex-col hover:shadow-2xl hover:shadow-primary/5"
        onClick={onClick}
      >
        {/* Image / Gradient Banner - BIGGER */}
        <div className="relative h-52 overflow-hidden">
          {opportunity.image_url ? (
            <img 
              src={opportunity.image_url} 
              alt={opportunity.nome} 
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${gradient}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/5 blur-2xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          
          {/* Status & Destaque badges */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <Badge variant="outline" className={cn('text-[11px] font-medium shadow-lg', status.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          {opportunity.destaque && (
            <div className="absolute top-3 left-3">
              <Badge variant="outline" className="bg-foreground/10 text-foreground backdrop-blur-md border border-foreground/20 text-[11px] shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                Destaque
              </Badge>
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              <Badge variant="outline" className="text-[11px] bg-card/70 backdrop-blur-md border-border/40 gap-1">
                {setorIcon && <SetorIcon name={setorIcon} className="h-3 w-3" />}
                {setorLabel}
              </Badge>
              {segmentoLabel && (
                <Badge variant="outline" className="text-[11px] bg-card/50 backdrop-blur-md border-border/30 gap-1 opacity-75">
                  {segmentoLabel}
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2 transition-colors duration-200">
              {opportunity.nome}
            </h3>
          </div>
        </div>

        <CardContent className="p-6 space-y-5 flex-1 flex flex-col">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Percent className="h-3.5 w-3.5" />
                Rentabilidade
              </div>
              <p className="font-bold text-base text-foreground">
                {opportunity.rentabilidade > 0 ? `${opportunity.rentabilidade.toFixed(2)}% a.a.` : 'Variável'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                ROI
              </div>
              <p className="font-bold text-base text-foreground">
                {opportunity.rentabilidade > 0 ? `${opportunity.rentabilidade.toFixed(2)}%` : 'Variável'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5" />
                Prazo
              </div>
              <p className="font-bold text-base text-foreground">
                {opportunity.prazo > 0 ? `${opportunity.prazo} meses` : 'Indeterminado'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Target className="h-3.5 w-3.5" />
                Modalidade
              </div>
              <p className="font-bold text-base text-foreground">{opportunity.tipo}</p>
            </div>
          </div>

          {/* Captação + Métrica Destaque */}
          <div className="grid grid-cols-2 gap-6 pt-2 border-t border-border/30">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                Captação
              </div>
              <p className="font-extrabold text-xl text-primary tracking-tight">
                {formatBRL(opportunity.alvo_maximo)}
              </p>
            </div>
            {setorKey && setorHighlightMetric[setorKey] && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  {setorHighlightMetric[setorKey].label}
                </div>
                <p className="font-bold text-base text-foreground tracking-tight">
                  {setorHighlightMetric[setorKey].getValue(opportunity)}
                </p>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function InvestmentOpportunitiesPage() {
  const navigate = useNavigate();
  const opportunitiesHeroBg = useConfigImage('img_oportunidades_hero');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: [] as string[],
    modalidade: [] as string[],
    setor: [] as string[],
  });
  const setores = getSetores();

  const { data: opportunities = [], isLoading } = useOportunidadesInvestimento();
  const { data: stats } = useOportunidadesStats();

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...prev[category], value],
    }));
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    // Search filter
    if (searchQuery && !opp.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(opp.status)) {
      return false;
    }
    // Modalidade filter
    if (filters.modalidade.length > 0 && !filters.modalidade.includes(opp.tipo)) {
      return false;
    }
    // Setor filter
    if (filters.setor.length > 0 && !filters.setor.includes(opp.segmento)) {
      return false;
    }
    return true;
  });

  const activeFiltersCount = filters.status.length + filters.modalidade.length + filters.setor.length;

  const handleOpportunityClick = (opportunityId: string) => {
    navigate(`/oportunidades/${opportunityId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden p-8 md:p-10 border border-border/40"
      >
        <img src={opportunitiesHeroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/75 to-card/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/40 to-transparent" />
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 bg-card/50 backdrop-blur-sm text-[11px]">
              Área do Investidor
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            Oportunidades de Investimento
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
            Descubra oportunidades exclusivas selecionadas por nossa equipe de especialistas. 
            Invista em operações estruturadas com rentabilidade atrativa.
          </p>
        </div>
      </motion.div>


      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="sticky top-20 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </CardTitle>
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFilters({ status: [], modalidade: [], setor: [] })}
                  >
                    Limpar ({activeFiltersCount})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome da oferta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
                  Status
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {['aberta', 'encerrada', 'captada'].map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <Checkbox 
                        checked={filters.status.includes(status)}
                        onCheckedChange={() => toggleFilter('status', status)}
                      />
                      {statusConfig[status as keyof typeof statusConfig].label}
                    </label>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Modalidade */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
                  Modalidade
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {modalidades.map((modalidade) => (
                    <label key={modalidade} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <Checkbox 
                        checked={filters.modalidade.includes(modalidade)}
                        onCheckedChange={() => toggleFilter('modalidade', modalidade)}
                      />
                      {modalidade}
                    </label>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Setor */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
                  Setor
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {setores.map((setor) => (
                    <label key={setor.value} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <Checkbox 
                        checked={filters.setor.includes(setor.label)}
                        onCheckedChange={() => toggleFilter('setor', setor.label)}
                      />
                      <SetorIcon name={setor.icon} className="h-3.5 w-3.5 text-muted-foreground" />
                      {setor.label}
                    </label>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>

        {/* Opportunities Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Carregando oportunidades...</p>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Nenhuma oportunidade encontrada</h3>
              <p className="text-muted-foreground max-w-sm">
                {searchQuery || activeFiltersCount > 0
                  ? 'Tente ajustar seus filtros ou busca para encontrar mais oportunidades.'
                  : 'Ainda não há oportunidades de investimento disponíveis. Volte em breve!'}
              </p>
              {(searchQuery || activeFiltersCount > 0) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ status: [], modalidade: [], setor: [] });
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'oportunidade' : 'oportunidades'} encontrada{filteredOpportunities.length !== 1 && 's'}
                </p>
              </div>
              <motion.div layout className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                  {filteredOpportunities.map((opportunity, index) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      index={index}
                      onClick={() => handleOpportunityClick(opportunity.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
