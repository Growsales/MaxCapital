import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Building2,
  Edit,
  MessageSquare,
  History,
  Loader2,
  Lock,
  X,
  User,
  Clock,
  Circle,
  Flame,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/tooltip';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { useOperacoes, useOperacoesStats, useAllHistorico } from '@/features/operations/api/useOperacoes';
import { useOportunidadesOrigemIds } from '@/hooks/useOportunidadesInvestimento';
import { useProfiles } from '@/hooks/useProfiles';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { EtapaPipeline, LeadTag, UserType } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';
import { canCreateOperation, canMoveOperationKanban } from '@/lib/permissions';
import { NewDealModalWizard } from '@/features/operations/components/NewDealWizard/NewDealModalWizard';
import { KanbanBoard } from '@/features/operations/components/KanbanBoard';
import { OperationsFilters, FilterValues } from '@/features/operations/components/OperationsFilters';

// All pipeline stages
const allPipelineStages: EtapaPipeline[] = [
  'Prospecto',
  'Comitê',
  'Comercial',
  'Cliente Ativo',
  'Estruturação',
  'Matchmaking',
  'Apresentação',
  'Negociação',
  'Concluído',
];

// Stages visible for investors (from Matchmaking onwards)
const investorPipelineStages: EtapaPipeline[] = [
  'Matchmaking',
  'Apresentação',
  'Negociação',
  'Concluído',
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Check if an operation is a draft (incomplete) */
export const isOperacaoDraft = (operacao: any): boolean => {
  try {
    if (!operacao.observacoes) return false;
    const obs = JSON.parse(operacao.observacoes);
    return obs._draft === true;
  } catch {
    return false;
  }
};

/** Resume a draft operation — loads formData into localStorage and navigates to form page */
export const resumeDraftOperation = (operacao: any, navigate: (path: string) => void) => {
  try {
    const obs = JSON.parse(operacao.observacoes);
    if (obs.formData) {
      localStorage.setItem('new-deal-wizard-draft', JSON.stringify(obs.formData));
      localStorage.setItem('new-deal-draft-operation-id', operacao.id);
      navigate('/operacoes/novo');
    }
  } catch {
    // fallback to normal navigation
    navigate(`/operacoes/${operacao.id}`);
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function OperationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useAuth();
  const { isAdmin: hasAdminAccess, isMaster } = useAdminPermissions();
  const userType = profile?.tipo as UserType | undefined;
  const isAdmin = hasAdminAccess || isMaster || userType === 'admin' || userType === 'master';
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(isAdmin ? 'kanban' : 'list');
  
  const [showActive, setShowActive] = useState(true);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});

  const userId = profile?.id;
  const showNewDealButton = canCreateOperation(userType);
  const canDragKanban = isAdmin || canMoveOperationKanban(userType);
  
  const effectiveViewMode = isAdmin ? viewMode : 'list';
  
  // Investors see only Matchmaking onwards, others see all stages
  const isInvestor = userType === 'investidor';
  const pipelineStages = isInvestor ? investorPipelineStages : allPipelineStages;
  const [activeStage, setActiveStage] = useState<EtapaPipeline>(
    (location.state as any)?.activeStage || (isInvestor ? 'Matchmaking' : 'Prospecto')
  );

  // Admin sees all operations, others see only their own
  const filterUserId = isAdmin ? undefined : userId;

  const { data: allOperacoes = [], isLoading } = useOperacoes({ 
    searchQuery, 
    etapa: effectiveViewMode === 'list' ? activeStage : undefined,
    userId: filterUserId,
  });
  const origemIds = useOportunidadesOrigemIds();
  const { data: statsData } = useOperacoesStats(filterUserId);
  const { data: historico = [], isLoading: isLoadingHistorico } = useAllHistorico(filterUserId);
  const { data: profiles = [] } = useProfiles();

  // Get unique responsáveis for filter dropdown
  const responsaveis = useMemo(() => {
    return profiles
      .filter(p => p.tipo === 'parceiro' || p.tipo === 'admin' || p.tipo === 'master')
      .map(p => ({ id: p.id, nome: p.nome || p.email }));
  }, [profiles]);

  // Apply filters to list view
  const operacoes = useMemo(() => {
    let filtered = allOperacoes;
    
    // Filter by ativo/inativo status
    if (showActive) {
      filtered = filtered.filter(op => (op as any).ativo !== false);
    } else {
      filtered = filtered.filter(op => (op as any).ativo === false);
    }
    
    if (filters.responsavel) {
      filtered = filtered.filter(op => op.responsavel_id === filters.responsavel);
    }
    if (filters.segmento && filters.segmento !== 'Todos') {
      filtered = filtered.filter(op => 
        op.segmento === filters.segmento || op.empresa?.segmento === filters.segmento
      );
    }
    if (filters.valorMin !== undefined) {
      filtered = filtered.filter(op => (op.valor_investimento || 0) >= filters.valorMin!);
    }
    if (filters.valorMax !== undefined) {
      filtered = filtered.filter(op => (op.valor_investimento || 0) <= filters.valorMax!);
    }
    if (filters.dataInicio) {
      filtered = filtered.filter(op => 
        op.created_at && new Date(op.created_at) >= filters.dataInicio!
      );
    }
    if (filters.dataFim) {
      filtered = filtered.filter(op => 
        op.created_at && new Date(op.created_at) <= filters.dataFim!
      );
    }
    
    return filtered;
  }, [allOperacoes, filters, showActive]);

  const getStageCount = (stage: EtapaPipeline) => {
    const stageMap: Record<EtapaPipeline, keyof typeof statsData.stageStats | undefined> = {
      'Prospecto': 'prospeccao',
      'Comitê': 'comite',
      'Comercial': 'comercial',
      'Cliente Ativo': 'clienteAtivo',
      'Matchmaking': 'matchmaking',
      'Estruturação': 'preparacao',
      'Apresentação': 'apresentacao',
      'Negociação': 'negociacoes',
      'Concluído': 'concluido',
    };
    const key = stageMap[stage];
    return key && statsData?.stageStats ? statsData.stageStats[key] : 0;
  };

    return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Minhas operações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Acompanhe as movimentações de suas originações</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && effectiveViewMode === 'kanban' && (
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/admin/investidores', { state: { openMatchmaking: true } })}
            >
              <Flame className="h-4 w-4 animate-pulse text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
              Matchmaking
            </Button>
          )}
          {showNewDealButton && (
            <Button className="btn-primary gap-2 shadow-lg shadow-primary/20" onClick={() => setShowNewDealModal(true)}>
              <Plus className="h-4 w-4" />
              {userType === 'investidor' ? 'Nova Tese' : 'Novo Negócio'}
            </Button>
          )}
        </div>
      </div>

      <NewDealModalWizard open={showNewDealModal} onOpenChange={setShowNewDealModal} />

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <OperationsFilters 
            filters={filters} 
            onFiltersChange={setFilters}
            responsaveis={responsaveis}
          />
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                  viewMode === 'list' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1',
                  viewMode === 'kanban' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={() => setShowActive(true)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                showActive 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Ativo
            </button>
            <button
              onClick={() => setShowActive(false)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                !showActive 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Inativo
            </button>
          </div>

          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-1.5 rounded-lg",
              showHistory 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <History className="h-3.5 w-3.5" />
            Histórico
          </button>
        </div>
      </div>

      {/* Pipeline Tabs - Only show in list mode */}
      {effectiveViewMode === 'list' && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border/50">
          {pipelineStages.map((stage) => (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={cn(
                'px-3 py-2 text-sm font-medium whitespace-nowrap transition-all rounded-t-md relative',
                activeStage === stage 
                  ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {stage}
              {getStageCount(stage) > 0 && (
                <span className={cn(
                  'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                  activeStage === stage 
                    ? 'bg-primary/15 text-primary' 
                    : 'bg-muted text-muted-foreground'
                )}>
                  {getStageCount(stage)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {effectiveViewMode === 'kanban' ? (
        <div className="space-y-2">
          {!canDragKanban && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border/50">
              <Lock className="h-4 w-4" />
              Modo visualização: apenas administradores podem mover operações
            </div>
          )}
          <KanbanBoard searchQuery={searchQuery} filters={filters} userId={filterUserId} />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-xl border-0 bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Empresa</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Status</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Office Responsável</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Exclusividade</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Valor</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {operacoes.length > 0 ? (
                      operacoes.map((operacao, index) => (
                        <motion.tr 
                          key={operacao.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
                          className="cursor-pointer hover:bg-muted/30 transition-colors group"
                          onClick={() => isOperacaoDraft(operacao) ? resumeDraftOperation(operacao, navigate) : navigate(`/operacoes/${operacao.id}`)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-muted/70 flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-medium text-foreground text-sm">
                                    {operacao.empresa?.nome || 'N/A'}
                                  </p>
                                  {isOperacaoDraft(operacao) && (
                                    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-amber-500/15 text-amber-500 border border-amber-500/20">
                                      <AlertCircle className="h-2.5 w-2.5" />
                                      Incompleto
                                    </span>
                                  )}
                                  {origemIds.has(operacao.id) && (
                                    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-amber-500 text-amber-100">
                                      <Zap className="h-2.5 w-2.5" />
                                      Oportunidade
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {operacao.numero_funil}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground text-sm">
                                {operacao.etapa_atual || 'N/A'}
                              </span>
                              <span className="text-xs text-muted-foreground mt-0.5">
                                {operacao.ultima_movimentacao ? formatDate(operacao.ultima_movimentacao) : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-primary-foreground">M</span>
                              </div>
                              <span className="text-sm text-foreground">MAX CAPITAL</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {operacao.responsavel_id ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                Ativo
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-foreground text-sm tabular-nums">
                              {operacao.valor_investimento ? formatCurrency(operacao.valor_investimento) : '-'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              {isAdmin && operacao.etapa_atual === 'Cliente Ativo' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button 
                                      className="p-1.5 rounded-md hover:bg-amber-500/10 text-amber-500 hover:text-amber-400 transition-colors"
                                      onClick={() => navigate('/admin/oportunidades', {
                                        state: {
                                          fromOperation: {
                                            id: operacao.id,
                                            nome: operacao.empresa?.nome || '',
                                            segmento: operacao.segmento || operacao.empresa?.segmento || 'Imobiliário',
                                            valor: operacao.valor_investimento || 0,
                                            observacoes: operacao.observacoes || '',
                                            numero_funil: operacao.numero_funil,
                                          },
                                        },
                                      })}
                                    >
                                      <Flame className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Gerar Oportunidade</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => navigate(`/operacoes/${operacao.id}`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">Ver detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => navigate(`/operacoes/${operacao.id}?tab=timeline`)}
                                  >
                                    <History className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">Histórico</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-16">
                          <div className="text-muted-foreground">
                            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium mb-1">Nenhuma operação encontrada</p>
                            <p className="text-sm opacity-70">Não há operações nesta etapa do pipeline.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-card border-0 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Histórico de Movimentações
                </h3>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isLoadingHistorico ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma movimentação registrada.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border/60" />
                  <div className="space-y-3">
                    {historico.map((item: any, index: number) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="relative pl-10"
                      >
                        <div className={cn(
                          'absolute left-[11px] w-2.5 h-2.5 rounded-full border-2',
                          index === 0 ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/40'
                        )} />
                        <div className="bg-muted/30 rounded-lg p-3.5 border border-border/30">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {item.etapa_anterior} → {item.etapa_nova}
                              </p>
                              {(item as any).operacao && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {(item as any).operacao.empresa?.nome || (item as any).operacao.numero_funil}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-full">
                              {format(new Date(item.data_hora), "dd MMM, HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {item.observacoes && (
                            <p className="text-xs text-muted-foreground mt-1.5">{item.observacoes}</p>
                          )}
                          {item.usuario && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/30">
                              {item.usuario.avatar_url ? (
                                <img src={item.usuario.avatar_url} alt={item.usuario.nome} className="h-5 w-5 rounded-full object-cover" />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-2.5 w-2.5 text-primary" />
                                </div>
                              )}
                              <span className="text-[11px] text-muted-foreground">{item.usuario.nome}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
