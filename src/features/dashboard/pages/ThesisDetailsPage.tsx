import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Briefcase,
  TrendingUp,
  Target,
  Info,
  Flame,
  CheckCircle2,
  Pencil
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { useAuth } from '@/features/auth';
import { Badge } from '@/shared/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Skeleton } from '@/shared/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/tooltip';
import { cn } from '@/lib/utils';
import { TransactionProfile } from '@/components/teses/TransactionDonut';
import { useTesesInvestimento } from '@/hooks/useTeses';

const sectorGradients: Record<string, string> = {
  'Tecnologia': 'from-blue-600 via-blue-700 to-blue-900',
  'Agronegócio': 'from-green-600 via-green-700 to-green-900',
  'Agro': 'from-green-600 via-green-700 to-green-900',
  'Indústria': 'from-slate-500 via-slate-600 to-slate-800',
  'Financeiro': 'from-emerald-500 via-emerald-600 to-emerald-800',
  'Fintech': 'from-violet-500 via-violet-600 to-violet-800',
  'Energia': 'from-amber-500 via-amber-600 to-amber-800',
  'Imobiliário': 'from-cyan-500 via-cyan-600 to-cyan-800',
  'Saúde': 'from-rose-500 via-rose-600 to-rose-800',
  'Startups': 'from-purple-500 via-purple-600 to-purple-800',
  'default': 'from-primary/80 via-primary to-primary/60',
};

const formatCurrency = (value: number): string => {
  if (value >= 1000000000) {
    return `R$ ${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return `R$ ${value}`;
};

// Animation config
const pageTransition = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function ThesisDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const isInvestidor = user?.user_metadata?.tipo === 'investidor';

  const { data: teses = [], isLoading } = useTesesInvestimento();
  const thesis = teses.find(t => t.id === id);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-32" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!thesis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-lg text-muted-foreground">Tese não encontrada</p>
        <Button onClick={() => navigate('/teses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Teses
        </Button>
      </div>
    );
  }

  // Mock extended data (in production, these would come from the database)
  const extendedData = {
    setores: thesis.setores || [thesis.categoria, 'Tecnologia', 'SaaS', 'B2B'],
    regioes: thesis.regioes || ['Sudeste', 'Sul', 'Centro-Oeste'],
    tipo_transacao: thesis.tipo_transacao || [thesis.tipo],
    localizacao: thesis.localizacao || 'São Paulo, SP',
    categoria_investidor: thesis.categoria_investidor || 'Empresa Investidora',
    modelo_negocio: thesis.modelo_negocio || 'Empresas com modelo de receita recorrente (SaaS/ARR)',
    fase_investimento: thesis.fase_investimento || 'Growth / Scale-up',
    publico_alvo: thesis.publico_alvo || 'B2B / Enterprise',
    faturamento_min: thesis.faturamento_min || thesis.valor_min * 0.5,
    faturamento_max: thesis.faturamento_max || thesis.valor_max * 2,
    ebitda_min: thesis.ebitda_min || 0,
    ebitda_max: thesis.ebitda_max || null,
    informacoes_adicionais: thesis.informacoes_adicionais || [
      'Preferência por empresas com EBITDA positivo',
      'Interesse em sinergias operacionais',
      'Foco em empresas com equipe de gestão consolidada'
    ],
    tese_quente: thesis.tese_quente ?? false,
  };

  const mainSector = extendedData.setores[0] || 'default';
  const gradient = sectorGradients[mainSector] || sectorGradients['default'];

  return (
    <motion.div 
      className="space-y-6"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={staggerContainer}
    >
      {/* Back button */}
      <motion.div variants={pageTransition} className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/teses')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Teses
        </Button>
        {isInvestidor && thesis && (
          <Button 
            onClick={() => navigate(`/teses/${thesis.id}/editar`)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Editar Tese
          </Button>
        )}
      </motion.div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="grid lg:grid-cols-3">
            {/* Image/Gradient Section */}
            <div className={`relative h-64 lg:h-auto overflow-hidden ${!thesis.image_url ? `bg-gradient-to-br ${gradient}` : ''}`}>
              {thesis.image_url ? (
                <>
                  <img src={thesis.image_url} alt={thesis.titulo} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
                </>
              ) : (
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <pattern id="hero-pattern" patternUnits="userSpaceOnUse" width="10" height="10">
                      <circle cx="5" cy="5" r="1" fill="currentColor" />
                    </pattern>
                    <rect width="100" height="100" fill="url(#hero-pattern)" />
                  </svg>
                </div>
              )}
              
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-white/80 text-sm font-mono">
                    #{thesis.id.slice(0, 8).toUpperCase()}
                  </span>
                  {extendedData.tese_quente && (
                    <Badge className="bg-orange-500/90 text-white border-0 gap-1">
                      <Flame className="h-3 w-3" />
                      Tese Quente
                    </Badge>
                  )}
                </div>
                
                <div>
                  <Building2 className="h-12 w-12 text-white/80 mb-2" />
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="p-6 lg:col-span-1 bg-card">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sobre
                  </span>
                  <h1 className="text-2xl font-bold text-foreground mt-1">
                    {thesis.titulo}
                  </h1>
                </div>
                
                <p className="text-muted-foreground leading-relaxed">
                  {thesis.descricao}
                </p>
              </div>
            </div>

            {/* Info Cards */}
            <div className="p-6 bg-muted/30 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">Categoria</span>
                    <p className="font-medium text-foreground">{extendedData.categoria_investidor}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">Localização</span>
                    <p className="font-medium text-foreground">{extendedData.localizacao}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">Tipo</span>
                    <p className="font-medium text-foreground">{thesis.tipo}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Target Company Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Perfil da Empresa Alvo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Características das empresas desejadas
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Setores */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Setores de Interesse
                </span>
                <div className="flex flex-wrap gap-2">
                  {extendedData.setores.map((setor, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {setor}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Modelo de Negócio */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Modelo de Negócio
                </span>
                <p className="text-sm text-foreground">{extendedData.modelo_negocio}</p>
              </div>

              {/* Fase de Investimento */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fase de Investimento
                </span>
                <p className="text-sm text-foreground">{extendedData.fase_investimento}</p>
              </div>

              {/* Público Alvo */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Público Alvo
                </span>
                <p className="text-sm text-foreground">{extendedData.publico_alvo}</p>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-3 pt-4 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Informações Adicionais
              </span>
              <ul className="space-y-2">
                {extendedData.informacoes_adicionais.map((info, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {info}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Regions and Transaction Profile */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Regions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Regiões de Atuação
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Onde a empresa alvo deve atuar
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'].map((regiao) => {
                  const isActive = extendedData.regioes.some(r => 
                    r.toLowerCase().includes(regiao.toLowerCase())
                  );
                  return (
                    <div 
                      key={regiao}
                      className={cn(
                        'flex items-center gap-2 p-2.5 rounded-lg transition-colors',
                        isActive ? 'bg-primary/10' : 'bg-muted/30'
                      )}
                    >
                      <div className={cn('h-2 w-2 rounded-full', isActive ? 'bg-primary' : 'bg-muted-foreground/30')} />
                      <span className={cn('text-sm', isActive ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                        {regiao}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Perfil da Transação
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tipos de investimentos desejados
              </p>
            </CardHeader>
            <CardContent>
              <TransactionProfile types={extendedData.tipo_transacao} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Financial Requirements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Requisitos Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Receita Bruta */}
              <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Receita Bruta Anual
                </span>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-muted-foreground">MÍN</span>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(extendedData.faturamento_min)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">MÁX</span>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(extendedData.faturamento_max)}
                    </p>
                  </div>
                </div>
              </div>

              {/* EBITDA */}
              <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  EBITDA Anual
                </span>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-muted-foreground">MÍN</span>
                    <p className="text-lg font-bold text-foreground">
                      {extendedData.ebitda_min === 0 ? 'R$ 0' : formatCurrency(extendedData.ebitda_min)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">MÁX</span>
                    <p className="text-lg font-bold text-foreground">
                      {extendedData.ebitda_max ? formatCurrency(extendedData.ebitda_max) : 'Sem limite'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Valor do Investimento */}
              <div className="p-4 bg-primary/10 rounded-xl space-y-3 border border-primary/20">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Valor do Investimento
                </span>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-muted-foreground">MÍN</span>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(thesis.valor_min)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">MÁX</span>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(thesis.valor_max)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </motion.div>
  );
}
