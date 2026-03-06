/**
 * GlobalMatchmakingView — Shows all investment opportunities matched against all investor theses.
 * Groups matches by opportunity, showing which investors are most compatible.
 */
import { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Flame, Target, Filter, ExternalLink, TrendingUp,
  CheckCircle2, AlertCircle, BarChart3, Users,
  ArrowLeft, Search, ChevronDown, ChevronUp, ChevronRight,
  Bell, Link2, Send, Trash2, Plus, UserPlus,
  Clock, MessageCircle, XCircle, Presentation,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { Input } from '@/shared/components/input';
import { Progress } from '@/shared/components/progress';
import { Separator } from '@/shared/components/separator';
import { Avatar, AvatarFallback } from '@/shared/components/avatar';
import { Checkbox } from '@/shared/components/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/shared/components/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/shared/components/popover';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/tooltip';
import { mockOportunidadesInvestimento, mockTesesInvestimento, mockProfiles, mockOperacoes, mockManifestacoes } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AddManualInvestorDialog } from './AddManualInvestorDialog';
import type { NavigateFunction } from 'react-router-dom';
import { manualInvestorsStore, type ManualInvestorEntry as SharedManualEntry } from '@/lib/manual-investors-store';

// ─── Types ──────────────────────────────────────────────────────

type MatchStatus = 'aguardando_contato' | 'em_contato' | 'interessado' | 'sem_interesse' | 'apresentacao';

const MATCH_STATUS_ICONS: Record<MatchStatus, typeof Clock> = {
  aguardando_contato: Clock,
  em_contato: MessageCircle,
  interessado: CheckCircle2,
  sem_interesse: XCircle,
  apresentacao: Presentation,
};

const MATCH_STATUS_OPTIONS: { value: MatchStatus; label: string; color: string }[] = [
  { value: 'aguardando_contato', label: 'Aguardando', color: 'bg-muted/60 text-muted-foreground' },
  { value: 'em_contato', label: 'Em Contato', color: 'bg-blue-500/10 text-blue-400' },
  { value: 'interessado', label: 'Interessado', color: 'bg-emerald-500/10 text-emerald-400' },
  { value: 'sem_interesse', label: 'Sem Interesse', color: 'bg-destructive/10 text-destructive' },
  { value: 'apresentacao', label: 'Apresentação', color: 'bg-purple-500/10 text-purple-400' },
];

type InvestorOrigem = 'sistema' | 'proprio';

interface InvestorMatch {
  investorId: string;
  investorName: string;
  investorEmail: string;
  thesisTitle: string;
  score: number;
  reasons: { label: string; matched: boolean }[];
  origem: InvestorOrigem;
}

interface OpportunityMatches {
  opportunity: typeof mockOportunidadesInvestimento[0];
  investors: InvestorMatch[];
  bestScore: number;
}

// ─── Matching Logic ─────────────────────────────────────────────

const SECTOR_MAPPING: Record<string, string[]> = {
  'Tecnologia': ['Tecnologia', 'SaaS', 'Fintech', 'Startups'],
  'Agronegócio': ['Agronegócio', 'Agro'],
  'Energia': ['Energia', 'Infraestrutura'],
  'Imobiliário': ['Imobiliário', 'Construção Civil'],
  'Startups': ['Tecnologia', 'SaaS', 'Fintech', 'Startups', 'Saúde', 'Biotecnologia'],
  'Saúde': ['Saúde', 'Biotecnologia'],
  'Infraestrutura': ['Infraestrutura', 'Saneamento', 'Energia'],
};

function calculateMatch(thesis: any, opportunity: typeof mockOportunidadesInvestimento[0]) {
  const reasons: { label: string; matched: boolean }[] = [];
  let score = 0;
  const maxScore = 5;

  const thesisSetores = thesis.setores || [];
  const oppSegmento = opportunity.segmento;
  const expandedOppSectors = SECTOR_MAPPING[oppSegmento] || [oppSegmento];
  const sectorMatch = thesisSetores.some((s: string) =>
    expandedOppSectors.some(es => es.toLowerCase() === s.toLowerCase()) ||
    s.toLowerCase() === oppSegmento.toLowerCase()
  );
  reasons.push({ label: 'Setor', matched: sectorMatch });
  if (sectorMatch) score += 2;

  const typeMatch = thesis.tipo?.toLowerCase() === opportunity.tipo?.toLowerCase() ||
    (thesis.tipo === 'Equity' && opportunity.tipo === 'Equity') ||
    (thesis.tipo === 'Crédito' && opportunity.tipo === 'Dívida') ||
    (thesis.tipo === 'Project Finance' && opportunity.tipo === 'Dívida');
  reasons.push({ label: 'Tipo', matched: typeMatch });
  if (typeMatch) score += 1;

  const thesisMin = thesis.valor_min || 0;
  const thesisMax = thesis.valor_max || Infinity;
  const oppMin = opportunity.investimento_minimo || 0;
  const oppMax = opportunity.alvo_maximo || Infinity;
  const valueOverlap = thesisMin <= oppMax && thesisMax >= oppMin;
  reasons.push({ label: 'Faixa de valor', matched: valueOverlap });
  if (valueOverlap) score += 1.5;

  const isOpen = opportunity.status === 'aberta';
  reasons.push({ label: 'Aberta', matched: isOpen });
  if (isOpen) score += 0.5;

  return { score: Math.round((score / maxScore) * 100), reasons };
}

// ─── Helpers ────────────────────────────────────────────────────

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-muted-foreground';
}

function getScoreBadgeClass(score: number) {
  if (score >= 80) return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
  if (score >= 60) return 'bg-amber-500/10 text-amber-600 border-amber-200';
  return 'bg-muted text-muted-foreground';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Alta';
  if (score >= 60) return 'Média';
  return 'Baixa';
}

const formatCurrency = (val?: number) => {
  if (!val) return '—';
  if (val >= 1000000000) return `R$ ${(val / 1000000000).toFixed(1)}B`;
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(0)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}K`;
  return `R$ ${val}`;
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

// ─── Interessados Tab ───────────────────────────────────────────

const interessadoStatusConfig: Record<string, { label: string; className: string }> = {
  interessado: { label: 'Interessado', className: 'bg-primary/10 text-primary border-primary/20' },
  pendente: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  aprovada: { label: 'Aprovado', className: 'bg-primary/10 text-primary border-primary/20' },
  rejeitada: { label: 'Rejeitado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

interface MatchedInvestorEntry {
  investorId: string;
  nome: string;
  email: string;
  status: string;
  created_at: string;
}

function InteressadosTab({
  opportunityId,
  extraMatched = [],
  onRemove,
  onAddManual,
  allInvestors,
  onInvestorClick,
}: {
  opportunityId: string;
  extraMatched?: MatchedInvestorEntry[];
  onRemove?: (investorId: string) => void;
  onAddManual?: (investorId: string) => void;
  allInvestors?: { id: string; nome: string; email: string }[];
  onInvestorClick?: (investorId: string) => void;
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<{ investorId: string; nome: string } | null>(null);

  const interessados = useMemo(() => {
    const manifestacoes = mockManifestacoes.filter(m => m.oportunidade_id === opportunityId);

    const investorMap: Record<string, { nome: string; email: string }> = {};
    mockProfiles.forEach(p => {
      investorMap[p.id] = { nome: p.nome, email: p.email };
    });

    const fromDb = manifestacoes.map(m => {
      const investorId = (m as any).investidor_id || (m as any).usuario_id;
      const investor = investorMap[investorId] || { nome: 'Investidor', email: '' };
      return {
        id: m.id,
        investorId,
        nome: investor.nome,
        email: investor.email,
        status: (m as any).status || 'interessado',
        created_at: m.created_at,
      };
    });

    const existingIds = new Set(fromDb.map(i => i.investorId));
    const merged = [...fromDb];
    extraMatched.forEach(e => {
      if (!existingIds.has(e.investorId)) {
        merged.push({ ...e, id: `matched-${e.investorId}` });
      }
    });

    return merged;
  }, [opportunityId, extraMatched]);

  // Filter available investors for adding (exclude already interested)
  const availableToAdd = useMemo(() => {
    if (!allInvestors) return [];
    const existingIds = new Set(interessados.map(i => i.investorId));
    return allInvestors.filter(inv =>
      !existingIds.has(inv.id) &&
      (addSearch === '' ||
        inv.nome.toLowerCase().includes(addSearch.toLowerCase()) ||
        inv.email.toLowerCase().includes(addSearch.toLowerCase()))
    );
  }, [allInvestors, interessados, addSearch]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {interessados.length} investidor(es) interessado(s)
          </span>
        </div>
        {onAddManual && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAddDialog(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        )}
      </div>

      {interessados.length === 0 ? (
        <div className="py-8 text-center">
          <Flame className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum investidor manifestou interesse ainda.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Use a aba "Compatíveis" para fazer match ou adicione manualmente.</p>
        </div>
      ) : (
        interessados.map(inv => {
          const sc = interessadoStatusConfig[inv.status] || interessadoStatusConfig.pendente;
          return (
            <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group">
              <div
                className={cn("flex items-center gap-3 flex-1 min-w-0", onInvestorClick && "cursor-pointer hover:opacity-80")}
                onClick={() => onInvestorClick?.(inv.investorId)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(inv.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{inv.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                </div>
              </div>
              <Badge variant="outline" className={cn('text-[10px] border shrink-0', sc.className)}>
                {sc.label}
              </Badge>
              {onRemove && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmRemove({ investorId: inv.investorId, nome: inv.nome })}
                  title="Remover interessado"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        })
      )}

      {/* Remove confirmation dialog */}
      <Dialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <DialogContent className="max-w-sm rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle>Remover interessado</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <span className="font-medium text-foreground">{confirmRemove?.nome}</span> da lista de interessados?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-muted/20 -mx-6 -mb-6 px-6 py-3 rounded-b-2xl flex gap-2 sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => setConfirmRemove(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirmRemove) {
                  onRemove?.(confirmRemove.investorId);
                  setConfirmRemove(null);
                }
              }}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add investor dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Investidor</DialogTitle>
            <DialogDescription>Selecione um investidor para adicionar como interessado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar investidor..."
                value={addSearch}
                onChange={e => setAddSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {availableToAdd.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum investidor disponível.</p>
              ) : (
                availableToAdd.map(inv => (
                  <button
                    key={inv.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 w-full text-left transition-colors"
                    onClick={() => {
                      onAddManual?.(inv.id);
                      setShowAddDialog(false);
                      setAddSearch('');
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(inv.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────

interface GlobalMatchmakingViewProps {
  navigate: NavigateFunction;
  onBack: () => void;
  onInvestorClick?: (investorId: string) => void;
  initialExpandedOppId?: string | null;
}

export function GlobalMatchmakingView({ navigate, onBack, onInvestorClick, initialExpandedOppId }: GlobalMatchmakingViewProps) {
  const [minScore, setMinScore] = useState('0');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [valorMinFilter, setValorMinFilter] = useState('');
  const [valorMaxFilter, setValorMaxFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOpp, setExpandedOpp] = useState<string | null>(initialExpandedOppId || null);
  const [selectedInvestors, setSelectedInvestors] = useState<Record<string, Set<string>>>({});
  // Investors that have been matched (moved to Interessados tab)
  const [matchedByOpp, setMatchedByOpp] = useState<Record<string, MatchedInvestorEntry[]>>({});
  // Match status: key = `${oppId}_${investorId}`
  const [matchStatuses, setMatchStatuses] = useState<Record<string, MatchStatus>>({});
  // Track which investors have already been notified (key = `${oppId}_${investorId}`)
  const [notifiedInvestors, setNotifiedInvestors] = useState<Set<string>>(new Set());
  const [addInvestorDialog, setAddInvestorDialog] = useState<{ oppId: string; oppName: string } | null>(null);

  // Shared manual investors store
  const manualInvestorsData = useSyncExternalStore(
    (cb) => manualInvestorsStore.subscribe(cb),
    () => manualInvestorsStore.getSnapshot(),
  );

  const getMatchStatus = (oppId: string, investorId: string): MatchStatus =>
    matchStatuses[`${oppId}_${investorId}`] || 'aguardando_contato';

  const setMatchStatus = (oppId: string, investorId: string, status: MatchStatus) => {
    setMatchStatuses(prev => ({ ...prev, [`${oppId}_${investorId}`]: status }));
  };


  // Match confirmation state
  const [confirmMatch, setConfirmMatch] = useState<{
    oppName: string;
    oppId: string;
    investors: InvestorMatch[];
    count: number;
  } | null>(null);

  // Notification confirmation state
  const [confirmNotify, setConfirmNotify] = useState<{
    type: 'single' | 'bulk';
    investorName?: string;
    oppName: string;
    investors?: InvestorMatch[];
  } | null>(null);

  // All investors for manual linking
  const allInvestors = useMemo(() =>
    mockProfiles.filter(p => p.tipo === 'investidor'),
  []);

  const handleNotifyInvestor = (investorName: string, oppName: string, oppId: string, investorId: string) => {
    const key = `${oppId}_${investorId}`;
    if (notifiedInvestors.has(key)) return;
    setConfirmNotify({ type: 'single', investorName, oppName, _notifyKey: key } as any);
  };

  const handleNotifyAllHigh = (oppName: string, investors: InvestorMatch[]) => {
    const highMatches = investors.filter(i => i.score >= 80);
    if (highMatches.length === 0) {
      toast.info('Nenhum investidor com alta compatibilidade para notificar.');
      return;
    }
    setConfirmNotify({ type: 'bulk', oppName, investors: highMatches });
  };

  const confirmAndSendNotification = () => {
    if (!confirmNotify) return;
    if (confirmNotify.type === 'single') {
      toast.success(`Notificação enviada para ${confirmNotify.investorName}`, {
        description: `Match de alta compatibilidade com "${confirmNotify.oppName}" notificado com sucesso.`,
      });
    } else {
      toast.success(`${confirmNotify.investors!.length} notificação(ões) enviada(s)`, {
        description: `Investidores com alta compatibilidade para "${confirmNotify.oppName}" foram notificados.`,
      });
    }
    // Mark investors as notified
    if (confirmNotify.type === 'single' && confirmNotify.investorName) {
      // For single, we need oppId and investorId — stored in confirmNotify
      const key = (confirmNotify as any)._notifyKey;
      if (key) setNotifiedInvestors(prev => new Set(prev).add(key));
    } else if (confirmNotify.type === 'bulk' && confirmNotify.investors) {
      setNotifiedInvestors(prev => {
        const next = new Set(prev);
        confirmNotify.investors!.forEach(inv => next.add(`${(confirmNotify as any)._oppId}_${inv.investorId}`));
        return next;
      });
    }
    setConfirmNotify(null);
  };

  const toggleInvestor = (oppId: string, investorId: string) => {
    setSelectedInvestors(prev => {
      const set = new Set(prev[oppId] || []);
      if (set.has(investorId)) set.delete(investorId);
      else set.add(investorId);
      return { ...prev, [oppId]: set };
    });
  };

  const toggleAllInvestors = (oppId: string, investors: InvestorMatch[]) => {
    setSelectedInvestors(prev => {
      const current = prev[oppId] || new Set();
      const allSelected = investors.every(i => current.has(i.investorId));
      return {
        ...prev,
        [oppId]: allSelected ? new Set() : new Set(investors.map(i => i.investorId)),
      };
    });
  };

  const getSelectedCount = (oppId: string) => (selectedInvestors[oppId]?.size || 0);

  const handleMatchSelected = (oppName: string, oppId: string, investors: InvestorMatch[]) => {
    const count = getSelectedCount(oppId);
    if (count === 0) {
      toast.error('Selecione ao menos um investidor para fazer match.');
      return;
    }
    const selected = selectedInvestors[oppId] || new Set();
    const matchedInvestors = investors.filter(i => selected.has(i.investorId));
    
    // Create manifestações de interesse for each selected investor
    matchedInvestors.forEach(inv => {
      supabase
        .from('manifestacoes_interesse')
        .insert({
          oportunidade_id: oppId,
          usuario_id: inv.investorId,
          aceite_termos: true,
        })
        .then(({ error }) => {
          if (error) console.error('Erro ao vincular investidor:', inv.investorName, error);
        });
    });

    toast.success(`Match realizado com ${count} investidor(es)`, {
      description: `Os investidores selecionados foram vinculados como interessados na oportunidade "${oppName}".`,
    });
    // Move matched investors to interessados
    const investorMap: Record<string, { nome: string; email: string }> = {};
    mockProfiles.forEach(p => { investorMap[p.id] = { nome: p.nome, email: p.email }; });

    setMatchedByOpp(prev => {
      const existing = prev[oppId] || [];
      const newEntries: MatchedInvestorEntry[] = matchedInvestors.map(inv => ({
        investorId: inv.investorId,
        nome: investorMap[inv.investorId]?.nome || inv.investorName,
        email: investorMap[inv.investorId]?.email || inv.investorEmail,
        status: 'interessado',
        created_at: new Date().toISOString(),
      }));
      return { ...prev, [oppId]: [...existing, ...newEntries] };
    });
    setMatchStatuses(prev => {
      const updated = { ...prev };
      matchedInvestors.forEach(inv => {
        updated[`${oppId}_${inv.investorId}`] = 'interessado';
      });
      return updated;
    });
    setSelectedInvestors(prev => ({ ...prev, [oppId]: new Set() }));
  };

    const map: Record<string, { nome: string; email: string }> = {};
  const investorMap = useMemo(() => {
    const map: Record<string, { nome: string; email: string }> = {};
    mockProfiles.forEach(p => {
      if (p.tipo === 'investidor') {
        map[p.id] = { nome: p.nome, email: p.email };
      }
    });
    return map;
  }, []);

  // Only show opportunities linked to operations in the "Matchmaking" pipeline stage
  const matchmakingOpportunities = useMemo(() => {
    const matchmakingOpIds = new Set(
      mockOperacoes.filter(op => op.etapa_atual === 'Matchmaking').map(op => op.id)
    );
    return mockOportunidadesInvestimento.filter(opp =>
      opp.operacao_origem_id && matchmakingOpIds.has(opp.operacao_origem_id)
    );
  }, []);

  // Build a set of self-manifested investor+opportunity pairs
  const selfManifestedKeys = useMemo(() => {
    const keys = new Set<string>();
    mockManifestacoes.forEach(m => {
      const investorId = (m as any).investidor_id || (m as any).usuario_id;
      keys.add(`${m.oportunidade_id}_${investorId}`);
    });
    return keys;
  }, []);

  // Generate all matches grouped by opportunity
  const opportunityMatches = useMemo(() => {
    const activeTeses = mockTesesInvestimento.filter(t => t.ativo);
    const results: OpportunityMatches[] = [];

    for (const opp of matchmakingOpportunities) {
      const investors: InvestorMatch[] = [];

      for (const thesis of activeTeses) {
        const { score, reasons } = calculateMatch(thesis, opp);
        if (score > 0) {
          const investor = investorMap[thesis.investidor_id] || { nome: 'Investidor', email: '' };
          const isSelfManifested = selfManifestedKeys.has(`${opp.id}_${thesis.investidor_id}`);
          const existing = investors.find(i => i.investorId === thesis.investidor_id);
          if (!existing || score > existing.score) {
            const filtered = investors.filter(i => i.investorId !== thesis.investidor_id);
            filtered.push({
              investorId: thesis.investidor_id,
              investorName: investor.nome,
              investorEmail: investor.email,
              thesisTitle: thesis.titulo,
              score,
              reasons,
              origem: isSelfManifested ? 'proprio' : 'sistema',
            });
            investors.length = 0;
            investors.push(...filtered);
          }
        }
      }

      if (investors.length > 0) {
        investors.sort((a, b) => b.score - a.score);
        results.push({
          opportunity: opp,
          investors,
          bestScore: investors[0].score,
        });
      }
    }

    return results.sort((a, b) => b.bestScore - a.bestScore);
  }, [investorMap, matchmakingOpportunities, selfManifestedKeys]);

  // Merge manual investors from shared store into opportunityMatches
  const opportunityMatchesWithManual = useMemo(() => {
    const merged = opportunityMatches.map(item => {
      const manualForOpp = manualInvestorsData[item.opportunity.id] || [];
      if (manualForOpp.length === 0) return item;
      const existingIds = new Set(item.investors.map(i => i.investorId));
      const newInvestors: InvestorMatch[] = manualForOpp
        .filter(m => !existingIds.has(m.investorId))
        .map(m => ({
          investorId: m.investorId,
          investorName: m.nome,
          investorEmail: m.email,
          thesisTitle: m.thesisTitle,
          score: m.score,
          reasons: m.reasons,
          origem: m.origem,
        }));
      if (newInvestors.length === 0) return item;
      return {
        ...item,
        investors: [...item.investors, ...newInvestors],
      };
    });

    // Also add opportunities that only have manual investors (not in system matches)
    const existingOppIds = new Set(merged.map(m => m.opportunity.id));
    for (const [oppId, entries] of Object.entries(manualInvestorsData)) {
      if (existingOppIds.has(oppId) || entries.length === 0) continue;
      const opp = matchmakingOpportunities.find(o => o.id === oppId);
      if (!opp) continue;
      merged.push({
        opportunity: opp,
        investors: entries.map(m => ({
          investorId: m.investorId,
          investorName: m.nome,
          investorEmail: m.email,
          thesisTitle: m.thesisTitle,
          score: m.score,
          reasons: m.reasons,
          origem: m.origem,
        })),
        bestScore: 0,
      });
    }

    return merged;
  }, [opportunityMatches, manualInvestorsData, matchmakingOpportunities]);

  // Auto-select investors with 100% score
  const autoSelectedApplied = useMemo(() => {
    const autoSelections: Record<string, Set<string>> = {};
    opportunityMatchesWithManual.forEach(item => {
      const perfect = item.investors.filter(i => i.score === 100);
      if (perfect.length > 0) {
        autoSelections[item.opportunity.id] = new Set(perfect.map(i => i.investorId));
      }
    });
    return autoSelections;
  }, [opportunityMatchesWithManual]);

  // Apply auto-selections and auto-status for self-manifested investors on first load
  useEffect(() => {
    setSelectedInvestors(prev => {
      const merged = { ...prev };
      Object.entries(autoSelectedApplied).forEach(([oppId, ids]) => {
        if (!merged[oppId] || merged[oppId].size === 0) {
          merged[oppId] = new Set(ids);
        }
      });
      return merged;
    });

    // Auto-set "interessado" status for self-manifested investors
    setMatchStatuses(prev => {
      const updated = { ...prev };
      opportunityMatchesWithManual.forEach(item => {
        item.investors.forEach(inv => {
          const key = `${item.opportunity.id}_${inv.investorId}`;
          if (inv.origem === 'proprio' && !updated[key]) {
            updated[key] = 'interessado';
          }
        });
      });
      return updated;
    });
  }, [autoSelectedApplied, opportunityMatchesWithManual]);

  // Apply filters
  const filtered = useMemo(() => {
    let results = opportunityMatchesWithManual;
    const minScoreNum = parseInt(minScore);

    if (minScoreNum > 0) {
      results = results.map(r => ({
        ...r,
        investors: r.investors.filter(i => i.score >= minScoreNum),
      })).filter(r => r.investors.length > 0);
    }

    if (sectorFilter !== 'all') {
      results = results.filter(r => r.opportunity.segmento === sectorFilter);
    }

    if (typeFilter !== 'all') {
      results = results.filter(r => r.opportunity.tipo === typeFilter);
    }

    if (valorMinFilter) {
      const min = parseFloat(valorMinFilter);
      results = results.filter(r => (r.opportunity.alvo_maximo || Infinity) >= min);
    }
    if (valorMaxFilter) {
      const max = parseFloat(valorMaxFilter);
      results = results.filter(r => (r.opportunity.investimento_minimo || 0) <= max);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(r =>
        r.opportunity.nome.toLowerCase().includes(q) ||
        r.opportunity.segmento.toLowerCase().includes(q)
      );
    }

    return results;
  }, [opportunityMatchesWithManual, minScore, sectorFilter, typeFilter, valorMinFilter, valorMaxFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const totalMatches = opportunityMatchesWithManual.reduce((sum, r) => sum + r.investors.length, 0);
    const highMatches = opportunityMatchesWithManual.reduce((sum, r) => sum + r.investors.filter(i => i.score >= 80).length, 0);
    const uniqueInvestors = new Set(opportunityMatchesWithManual.flatMap(r => r.investors.map(i => i.investorId))).size;
    return {
      opportunities: opportunityMatchesWithManual.length,
      totalMatches,
      highMatches,
      uniqueInvestors,
    };
  }, [opportunityMatchesWithManual]);

  const uniqueSectors = useMemo(() => {
    const sectors = new Set(opportunityMatchesWithManual.map(r => r.opportunity.segmento));
    return Array.from(sectors).sort();
  }, [opportunityMatchesWithManual]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
          <h2 className="text-xl font-bold text-foreground">Matchmaking de Oportunidades</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Correspondência automática entre oportunidades do funil e investidores compatíveis
          </p>
        </div>
      </div>


      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar oportunidade..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/30"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {(minScore !== '0' || sectorFilter !== 'all' || typeFilter !== 'all' || valorMinFilter || valorMaxFilter) && (
                <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                  {(minScore !== '0' ? 1 : 0) + (sectorFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (valorMinFilter || valorMaxFilter ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0" asChild>
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
            >
              <div className="px-4 py-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Filtros</h4>
                  {(minScore !== '0' || sectorFilter !== 'all' || typeFilter !== 'all' || valorMinFilter || valorMaxFilter) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => { setMinScore('0'); setSectorFilter('all'); setTypeFilter('all'); setValorMinFilter(''); setValorMaxFilter(''); }}
                    >
                      Limpar tudo
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-4">
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Compatibilidade mínima</label>
                  <Select value={minScore} onValueChange={setMinScore}>
                    <SelectTrigger className="h-9 bg-muted/30 border-0 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todas</SelectItem>
                      <SelectItem value="60">≥ 60% (Média+)</SelectItem>
                      <SelectItem value="80">≥ 80% (Alta)</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
                <Separator className="opacity-40" />
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Setor</label>
                  <Select value={sectorFilter} onValueChange={setSectorFilter}>
                    <SelectTrigger className="h-9 bg-muted/30 border-0 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os setores</SelectItem>
                      {uniqueSectors.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
                <Separator className="opacity-40" />
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tipo de operação</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9 bg-muted/30 border-0 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Dívida">Dívida</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
                <Separator className="opacity-40" />
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Faixa de valor (R$)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Mínimo"
                      value={valorMinFilter}
                      onChange={e => setValorMinFilter(e.target.value)}
                      className="h-9 bg-muted/30 border-0 shadow-none"
                    />
                    <Input
                      type="number"
                      placeholder="Máximo"
                      value={valorMaxFilter}
                      onChange={e => setValorMaxFilter(e.target.value)}
                      className="h-9 bg-muted/30 border-0 shadow-none"
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </PopoverContent>
        </Popover>

        <Badge variant="outline" className="font-medium tabular-nums shrink-0">
          {filtered.length} oportunidade{filtered.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Opportunity Tree */}
      {filtered.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <Flame className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-foreground">Matchmaking de Oportunidades</h3>
                </div>
                <Badge className="bg-primary/20 text-primary border-0">
                  {filtered.length} oportunidade{filtered.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="w-10 text-center" />
                    <TableHead>Oportunidade</TableHead>
                    <TableHead className="text-center">Setor</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Alvo</TableHead>
                    <TableHead className="text-center">Rentabilidade</TableHead>
                    <TableHead className="text-center">Compatíveis</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item, index) => {
                    const matchedIds = new Set((matchedByOpp[item.opportunity.id] || []).map(m => m.investorId));
                    const availableInvestors = item.investors.filter(i => !matchedIds.has(i.investorId));
                    const isExpanded = expandedOpp === item.opportunity.id;

                    return (
                      <>
                         {/* Spacer row for visual separation */}
                        {index > 0 && (
                          <tr key={`spacer-${item.opportunity.id}`} className="border-0">
                            <td colSpan={8} className="p-0 h-2 bg-transparent border-0" />
                          </tr>
                        )}
                        {/* Opportunity parent row */}
                        <motion.tr
                          key={item.opportunity.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={cn(
                            "border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
                            index % 2 === 0 ? "bg-card" : "bg-muted/10"
                          )}
                          onClick={() => setExpandedOpp(isExpanded ? null : item.opportunity.id)}
                        >
                          <TableCell className="text-center w-10">
                            <motion.span
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                              className="inline-flex"
                            >
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </motion.span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{item.opportunity.nome}</span>
                              <Badge variant={item.opportunity.status === 'aberta' ? 'default' : 'secondary'} className="text-[10px]">
                                {item.opportunity.status === 'aberta' ? 'Aberta' : 'Captada'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px]">{item.opportunity.segmento}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">{item.opportunity.tipo}</TableCell>
                          <TableCell className="text-center text-sm font-medium">
                            {formatCurrency(item.opportunity.alvo_minimo)} – {formatCurrency(item.opportunity.alvo_maximo)}
                          </TableCell>
                          <TableCell className="text-center text-sm font-bold text-primary">
                            {item.opportunity.rentabilidade}% a.a.
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-primary/20 text-primary border-0 text-xs">
                              {availableInvestors.length}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddInvestorDialog({ oppId: item.opportunity.id, oppName: item.opportunity.nome });
                                    }}
                                  >
                                    <UserPlus className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Adicionar investidor manualmente</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/oportunidades/${item.opportunity.id}`);
                                    }}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver oportunidade</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </motion.tr>

                        {/* Expanded investor children */}
                        <AnimatePresence>
                          {isExpanded && (
                            <>
                              {/* Investor rows */}
                              {availableInvestors.map((inv, i) => (
                                <motion.tr
                                  key={`inv-${inv.investorId}`}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ type: 'spring', bounce: 0, duration: 0.35, delay: i * 0.03 }}
                                  className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer bg-muted/10"
                                  onClick={() => onInvestorClick?.(inv.investorId)}
                                >
                                  <TableCell className="text-center w-10 relative overflow-visible">
                                    <div className="flex items-center justify-center h-full">
                                      <motion.div
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        transition={{ duration: 0.3, delay: i * 0.03 }}
                                        style={{ originY: 0 }}
                                        className={cn(
                                          "absolute left-1/2 top-0 w-px bg-primary/30",
                                          i === availableInvestors.length - 1 ? "h-1/2" : "h-full"
                                        )}
                                      />
                                      <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 0.2, delay: i * 0.03 + 0.15 }}
                                        style={{ originX: 0 }}
                                        className="absolute left-1/2 top-1/2 w-3 h-px bg-primary/30"
                                      />
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', bounce: 0.4, duration: 0.4, delay: i * 0.03 + 0.25 }}
                                        whileHover={{ scale: 2.5, boxShadow: '0 0 8px hsl(var(--primary) / 0.6)' }}
                                        className="relative z-10 w-1.5 h-1.5 rounded-full bg-primary/60 cursor-pointer"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell colSpan={2}>
                                    <div className="flex items-center gap-3 pl-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                          {getInitials(inv.investorName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-medium text-foreground truncate hover:underline">
                                            {inv.investorName}
                                          </p>
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-[9px] px-1.5 py-0 h-4 shrink-0 border font-medium",
                                              inv.origem === 'proprio'
                                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                : "bg-muted/60 text-muted-foreground border-border/50"
                                            )}
                                          >
                                            {inv.origem === 'proprio' ? 'Próprio' : 'Sistema'}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <TrendingUp className="h-3 w-3" />
                                          <span>Tese: {inv.thesisTitle}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell colSpan={2}>
                                    <div className="flex items-center justify-center gap-5">
                                      {inv.reasons.map((reason, ri) => (
                                        <div key={ri} className="flex items-center gap-1.5 text-[11px]">
                                          {reason.matched ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                          ) : (
                                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
                                          )}
                                          <span className={reason.matched ? 'text-foreground font-medium' : 'text-muted-foreground/50'}>
                                            {reason.label}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={cn('text-xs font-bold', getScoreColor(inv.score))}>
                                      {inv.score}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={cn('text-xs font-medium', getScoreColor(inv.score))}>
                                      {getScoreLabel(inv.score)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center gap-1 justify-center">
                                      <Select
                                        value={getMatchStatus(item.opportunity.id, inv.investorId)}
                                        onValueChange={(v) => {
                                          setMatchStatus(item.opportunity.id, inv.investorId, v as MatchStatus);
                                        }}
                                      >
                                        <SelectTrigger
                                          className={cn(
                                            'h-8 w-[140px] text-xs rounded-lg border-0 shadow-none gap-1.5 font-medium transition-colors',
                                            MATCH_STATUS_OPTIONS.find(o => o.value === getMatchStatus(item.opportunity.id, inv.investorId))?.color
                                          )}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl p-1 min-w-[160px]">
                                          {MATCH_STATUS_OPTIONS.map(opt => (
                                            <SelectItem
                                              key={opt.value}
                                              value={opt.value}
                                              className="rounded-lg text-xs cursor-pointer"
                                            >
                                              <span className="flex items-center gap-2">
                                                {(() => { const Icon = MATCH_STATUS_ICONS[opt.value]; return <Icon className="h-3.5 w-3.5" />; })()}
                                                <span>{opt.label}</span>
                                              </span>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {(() => {
                                        const notifyKey = `${item.opportunity.id}_${inv.investorId}`;
                                        const alreadyNotified = notifiedInvestors.has(notifyKey);
                                        return (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                              "h-7 w-7 p-0 hover:bg-muted/60",
                                              alreadyNotified && "opacity-40 cursor-not-allowed hover:bg-transparent"
                                            )}
                                            disabled={alreadyNotified}
                                            title={alreadyNotified ? 'Notificação já enviada' : `Notificar ${inv.investorName}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleNotifyInvestor(inv.investorName, item.opportunity.nome, item.opportunity.id, inv.investorId);
                                            }}
                                          >
                                            <Send className={cn("h-3.5 w-3.5", alreadyNotified ? "text-muted-foreground" : "text-primary")} />
                                          </Button>
                                        );
                                      })()}
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              ))}
                            </>
                          )}
                        </AnimatePresence>
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card className="border-0">
          <CardContent className="p-12 text-center">
            <Target className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">Nenhum match encontrado</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Tente ajustar os filtros para ver resultados.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Notification Confirmation Dialog */}
      <Dialog open={!!confirmNotify} onOpenChange={(open) => !open && setConfirmNotify(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Confirmar Notificação
            </DialogTitle>
            <DialogDescription>
              {confirmNotify?.type === 'single'
                ? `Deseja enviar uma notificação para ${confirmNotify.investorName} sobre a oportunidade "${confirmNotify.oppName}"?`
                : `Deseja notificar ${confirmNotify?.investors?.length} investidor(es) com alta compatibilidade para "${confirmNotify?.oppName}"?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-muted/20 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
            <Button variant="outline" onClick={() => setConfirmNotify(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmAndSendNotification} className="gap-2">
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Investor Dialog */}
      <AddManualInvestorDialog
        open={!!addInvestorDialog}
        onOpenChange={(open) => !open && setAddInvestorDialog(null)}
        opportunityName={addInvestorDialog?.oppName || ''}
        opportunityId={addInvestorDialog?.oppId || ''}
        existingInvestorIds={
          addInvestorDialog
            ? (opportunityMatchesWithManual.find(m => m.opportunity.id === addInvestorDialog.oppId)?.investors.map(i => i.investorId) || [])
            : []
        }
        onAddInvestor={(investor) => {
          if (!addInvestorDialog) return;
          const oppId = addInvestorDialog.oppId;
          // Add to shared store (syncs with CompatibleInvestorsTab)
          manualInvestorsStore.add(oppId, {
            investorId: investor.id,
            nome: investor.nome,
            email: investor.email,
            thesisTitle: 'Adicionado manualmente',
            score: 0,
            reasons: [],
            origem: 'proprio',
            status: 'interessado',
            created_at: new Date().toISOString(),
          });
          // Also add to local matchedByOpp for Interessados tab
          const entry: MatchedInvestorEntry = {
            investorId: investor.id,
            nome: investor.nome,
            email: investor.email,
            status: 'interessado',
            created_at: new Date().toISOString(),
          };
          setMatchedByOpp(prev => ({
            ...prev,
            [oppId]: [...(prev[oppId] || []), entry],
          }));
          setMatchStatuses(prev => ({
            ...prev,
            [`${oppId}_${investor.id}`]: 'interessado',
          }));
        }}
      />

    </div>
  );
}
