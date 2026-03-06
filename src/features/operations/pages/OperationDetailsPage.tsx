import { useState, useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams, type NavigateFunction } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Edit, 
  History, 
  Loader2, 
  User,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  Trash2,
  Lock,
  Briefcase,
  Send,
  Zap,
  ArrowRight,
  TrendingUp,
  Target,
  Users,
  ExternalLink,
  Flame,
  AlertCircle,
  Bell,
  MessageCircle,
  XCircle,
  Presentation,
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Label } from '@/shared/components/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import { useAuth } from '@/shared/hooks/useAuth';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useOperacao, useOperacaoHistorico, useMoveOperacao } from '@/features/operations/api/useOperacoes';
import { DeleteOperationModal } from '@/features/operations/components/DeleteOperationModal';
import { EditOperationModal } from '@/features/operations/components/EditOperationModal';
import { EditOperationModalEmpresa } from '@/features/companies/components/EditOperationModalEmpresa';
import { EtapaPipeline } from '@/types/supabase';
import { useOportunidadesInvestimento, type OportunidadeInvestimento } from '@/hooks/useOportunidadesInvestimento';
import { cn } from '@/lib/utils';
import { toast } from '@/shared/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/tooltip';
import { Avatar, AvatarFallback } from '@/shared/components/avatar';
import { Badge } from '@/shared/components/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/dialog';
import { mockProfiles, mockTesesInvestimento, mockManifestacoes } from '@/lib/mock-data';
import { toast as sonnerToast } from 'sonner';
import { AddManualInvestorDialog } from '@/features/admin/components/AddManualInvestorDialog';
import { UserPlus } from 'lucide-react';
import { manualInvestorsStore, type ManualInvestorEntry } from '@/lib/manual-investors-store';
const pipelineStages: EtapaPipeline[] = [
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Helper to parse and display observações
const ObservacoesDisplay = ({ observacoes }: { observacoes: string | null | undefined }) => {
  if (!observacoes) {
    return <p className="text-muted-foreground">Nenhuma observação registrada.</p>;
  }

  // Try to parse as JSON (wizard data)
  try {
    if (observacoes.startsWith('{')) {
      const data = JSON.parse(observacoes);
      
      // Define label mappings for human-readable display
      const labelMap: Record<string, string> = {
        setor: 'Setor',
        segmento: 'Segmento',
        statusProjeto: 'Status do Projeto',
        tipoProduto: 'Tipo de Produto',
        publicoAlvo: 'Público-Alvo',
        vgvEstimado: 'VGV Estimado',
        ticketMinimo: 'Ticket Mínimo',
        tirProjetada: 'TIR Projetada',
        prazoOperacao: 'Prazo da Operação',
        googleDriveLink: 'Link Google Drive',
        observacoes: 'Observações Adicionais',
        nomeEmpreendimento: 'Nome do Empreendimento',
        cnpj: 'CNPJ',
        descricaoProjeto: 'Descrição do Projeto',
        areaTerreno: 'Área do Terreno',
        areaConstruida: 'Área Construída',
        numeroUnidades: 'Número de Unidades',
        areaMediaUnidade: 'Área Média por Unidade',
        custoTotalObra: 'Custo Total da Obra',
        investimentoNecessario: 'Investimento Necessário',
        margemLucro: 'Margem de Lucro',
        dataInicioPrevista: 'Data de Início Prevista',
        dataConclusaoPrevista: 'Data de Conclusão Prevista',
        statusAprovacoes: 'Status das Aprovações',
        mrr: 'MRR',
        arr: 'ARR',
        valuation: 'Valuation',
        churnRate: 'Taxa de Churn',
        ltv: 'LTV',
        cac: 'CAC',
        areaTotal: 'Área Total',
        areaProdutiva: 'Área Produtiva',
        tipoSolo: 'Tipo de Solo',
        fonteAgua: 'Fonte de Água',
        produtividadeEsperada: 'Produtividade Esperada',
        cicloProdução: 'Ciclo de Produção',
        capex: 'CAPEX',
        opex: 'OPEX',
        payback: 'Payback',
        faturamentoAnual: 'Faturamento Anual',
        ebitda: 'EBITDA',
        margemEbitda: 'Margem EBITDA',
        cep: 'CEP',
        cidade: 'Cidade',
        uf: 'UF',
        logradouro: 'Endereço',
        bairro: 'Bairro',
        // Empresa specific fields
        nomeEmpresarial: 'Nome Empresarial',
        nomeFantasia: 'Nome Fantasia',
        site: 'Site',
        emailEmpresario: 'E-mail do Empresário',
        sobreEmpresa: 'Sobre a Empresa',
        recuperacaoJudicial: 'Em Recuperação Judicial',
        balancoAuditado: 'Balanço Auditado',
        receitaNaoDeclarada: 'Receita Não Declarada',
        tipoEmpresa: 'Tipo de Empresa',
        setores: 'Setores',
        setorLabel: 'Setor Principal',
        faturamento2023: 'Faturamento 2023',
        faturamento2024: 'Faturamento 2024',
        faturamento2025: 'Faturamento 2025',
        faturamento2026: 'Faturamento 2026 (Projeção)',
        ebitda2023: 'EBITDA 2023',
        ebitda2024: 'EBITDA 2024',
        ebitda2025: 'EBITDA 2025',
        ebitda2026: 'EBITDA 2026 (Projeção)',
        possuiDividas: 'Possui Dívidas',
        endividamentoBancario: 'Endividamento Bancário',
        endividamentoFornecedores: 'Endividamento com Fornecedores',
        endividamentoTributario: 'Endividamento Tributário',
        outrosEndividamentos: 'Outros Endividamentos',
        tiposOperacao: 'Tipos de Operação',
        patrimonioBens: 'Bens de Patrimônio',
        observacoesGerais: 'Observações Gerais',
        origemFormulario: 'Origem',
      };

      // Fields to hide from display (internal/technical fields)
      const hiddenFields = [
        'lgpdAccepted',
        'lgpdAcceptedAt',
      ];

      const formatValue = (key: string, value: any): string => {
        if (value === null || value === undefined || value === '') return '-';
        if (Array.isArray(value)) return value.map(v => formatArrayItem(v)).join(', ');
        if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
        return String(value);
      };

      const formatArrayItem = (item: string): string => {
        const itemMap: Record<string, string> = {
          residencial_vertical: 'Residencial Vertical',
          residencial_horizontal: 'Residencial Horizontal',
          salas_comerciais: 'Salas Comerciais',
          laje_corporativa: 'Laje Corporativa',
          lojas: 'Lojas',
          multipropriedade: 'Multipropriedade',
          baixa_renda: 'Baixa Renda',
          media_renda: 'Média Renda',
          alta_renda: 'Alta Renda',
          producao_agricola: 'Produção Agrícola',
          agronegocio: 'Agronegócio',
          infraestrutura: 'Infraestrutura',
          imobiliario: 'Imobiliário',
          tech: 'Tech',
          negocios: 'Negócios',
          outros: 'Outros',
          com_terreno: 'Com Terreno',
          sem_terreno: 'Sem Terreno',
          incorporacao: 'Incorporação',
          loteamento: 'Loteamento',
          hotel: 'Hotel',
          // Empresa tipos
          economia_real: 'Economia Real',
          tecnologia: 'Tecnologia',
          ma: 'M&A (Fusões e Aquisições)',
          credito: 'Crédito',
          financiamento_obras: 'Financiamento para Obras',
          capital_giro: 'Capital de Giro',
          expansao: 'Expansão',
          // Setores tecnologia
          fintech: 'Fintech',
          insurtech: 'Insurtech',
          healthtech: 'Healthtech',
          logtech: 'Logtech',
          retailtech: 'Retailtech',
          legaltech: 'Legaltech',
          agrotech: 'Agrotech',
          edtech: 'Edtech',
          foodtech: 'Foodtech',
          construtech: 'Construtech',
          proptech: 'Proptech',
          hrtech: 'HRtech',
          // Setores economia real
          agro: 'Agro',
          real_estate: 'Atividades Imobiliárias',
          construcao: 'Construção e Infraestrutura',
          servicos_tecnicos: 'Serviços Profissionais',
          servicos_adm: 'Serviços Administrativos',
          educacao: 'Educação',
          outros_servicos: 'Outros Serviços',
          educacao_corporativa: 'Educação Corporativa',
          franquiadora: 'Franquiadora',
          marketing: 'Marketing e Publicidade',
          sim: 'Sim',
          nao: 'Não',
        };
        return itemMap[item] || item.charAt(0).toUpperCase() + item.slice(1).replace(/_/g, ' ');
      };

      // Filter out empty values, hidden fields, and format
      const entries = Object.entries(data).filter(([key, value]) => 
        !hiddenFields.includes(key) &&
        value !== null && value !== undefined && value !== '' && 
        !(Array.isArray(value) && value.length === 0)
      );

      if (entries.length === 0) {
        return <p className="text-muted-foreground">Nenhuma observação registrada.</p>;
      }

      return (
        <div className="space-y-3">
          {entries.map(([key, value]) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              <span className="text-sm font-medium text-foreground min-w-[160px]">
                {labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className="text-sm text-muted-foreground">
                {formatValue(key, value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
  } catch (e) {
    // Not valid JSON, display as plain text
  }

  // Plain text observações
  return (
    <p className="text-muted-foreground whitespace-pre-wrap">
      {observacoes}
    </p>
  );
};

// Status Card Component
const StatusCard = ({ operacao }: { operacao: any }) => {
  const { profile } = useAuth();
  const isUserResponsible = operacao.responsavel_id === profile?.id;
  
  const getStageEntryDate = () => {
    if (operacao.ultima_movimentacao) {
      return format(new Date(operacao.ultima_movimentacao), 'dd/MM/yyyy', { locale: ptBR });
    }
    if (operacao.created_at) {
      return format(new Date(operacao.created_at), 'dd/MM/yyyy', { locale: ptBR });
    }
    return '-';
  };

  return (
    <div className="rounded-xl bg-card border-0 shadow-sm p-5 space-y-5">
      <h3 className="text-sm font-semibold text-foreground tracking-tight">Status</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Etapa Atual</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <Circle className="h-2 w-2 fill-primary" />
              {operacao.etapa_atual || 'N/A'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{getStageEntryDate()}</p>
        </div>

        <div className="h-px bg-border/50" />

        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Office Responsável</p>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-sm font-medium text-foreground">MAX CAPITAL</span>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div>
          <p className="text-xs text-muted-foreground mb-1">Exclusividade</p>
          {isUserResponsible ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              Ativo
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>

        <div className="h-px bg-border/50" />

        <div>
          <p className="text-xs text-muted-foreground mb-1">Dias na Etapa</p>
          <p className="text-sm font-semibold text-foreground tabular-nums">{operacao.dias_na_etapa || 0} dias</p>
        </div>
      </div>
    </div>
  );
};

// ─── Matching Logic (synced with GlobalMatchmakingView) ────────
const SECTOR_MAPPING_LOCAL: Record<string, string[]> = {
  'Tecnologia': ['Tecnologia', 'SaaS', 'Fintech', 'Startups'],
  'Agronegócio': ['Agronegócio', 'Agro'],
  'Energia': ['Energia', 'Infraestrutura'],
  'Imobiliário': ['Imobiliário', 'Construção Civil'],
  'Startups': ['Tecnologia', 'SaaS', 'Fintech', 'Startups', 'Saúde', 'Biotecnologia'],
  'Saúde': ['Saúde', 'Biotecnologia'],
  'Infraestrutura': ['Infraestrutura', 'Saneamento', 'Energia'],
};

function calculateMatchLocal(thesis: any, opportunity: any) {
  const reasons: { label: string; matched: boolean }[] = [];
  let score = 0;
  const maxScore = 5;

  const thesisSetores = thesis.setores || [];
  const oppSegmento = opportunity.segmento;
  const expanded = SECTOR_MAPPING_LOCAL[oppSegmento] || [oppSegmento];
  const sectorMatch = thesisSetores.some((s: string) =>
    expanded.some(es => es.toLowerCase() === s.toLowerCase()) ||
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

function getScoreColorLocal(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-muted-foreground';
}

function getScoreLabelLocal(score: number) {
  if (score >= 80) return 'Alta';
  if (score >= 60) return 'Média';
  return 'Baixa';
}

type MatchStatusLocal = 'aguardando_contato' | 'em_contato' | 'interessado' | 'sem_interesse' | 'apresentacao';

const MATCH_STATUS_ICONS_LOCAL: Record<MatchStatusLocal, typeof Clock> = {
  aguardando_contato: Clock,
  em_contato: MessageCircle,
  interessado: CheckCircle2,
  sem_interesse: XCircle,
  apresentacao: Presentation,
};

const MATCH_STATUS_OPTIONS_LOCAL: { value: MatchStatusLocal; label: string; color: string }[] = [
  { value: 'aguardando_contato', label: 'Aguardando', color: 'bg-muted/60 text-muted-foreground' },
  { value: 'em_contato', label: 'Em Contato', color: 'bg-blue-500/10 text-blue-400' },
  { value: 'interessado', label: 'Interessado', color: 'bg-emerald-500/10 text-emerald-400' },
  { value: 'sem_interesse', label: 'Sem Interesse', color: 'bg-destructive/10 text-destructive' },
  { value: 'apresentacao', label: 'Apresentação', color: 'bg-purple-500/10 text-purple-400' },
];

// ─── Compatible Investors Tab ───────────────────────────────────
function CompatibleInvestorsTab({ opportunity, navigate }: { opportunity: any; navigate: NavigateFunction }) {
  const [matchStatuses, setMatchStatuses] = useState<Record<string, MatchStatusLocal>>({});
  const [notifiedInvestors, setNotifiedInvestors] = useState<Set<string>>(new Set());
  const [confirmNotify, setConfirmNotify] = useState<{ investorName: string; investorId: string } | null>(null);
  const [addInvestorOpen, setAddInvestorOpen] = useState(false);

  // Shared store for manual investors
  const allManualData = useSyncExternalStore(
    (cb) => manualInvestorsStore.subscribe(cb),
    () => manualInvestorsStore.getSnapshot(),
  );
  const manualInvestors = allManualData[opportunity.id] || [];

  const selfManifestedKeys = useMemo(() => {
    const keys = new Set<string>();
    mockManifestacoes.forEach(m => {
      const investorId = (m as any).investidor_id || (m as any).usuario_id;
      if (m.oportunidade_id === opportunity.id) keys.add(investorId);
    });
    return keys;
  }, [opportunity.id]);

  const investorMap = useMemo(() => {
    const map: Record<string, { nome: string; email: string }> = {};
    mockProfiles.forEach(p => {
      if (p.tipo === 'investidor') map[p.id] = { nome: p.nome, email: p.email };
    });
    return map;
  }, []);

  const matches = useMemo(() => {
    const activeTeses = mockTesesInvestimento.filter(t => t.ativo);
    type InvMatch = { investorId: string; nome: string; email: string; thesisTitle: string; score: number; reasons: { label: string; matched: boolean }[]; origem: 'sistema' | 'proprio' };
    const results: InvMatch[] = [];

    for (const thesis of activeTeses) {
      const { score, reasons } = calculateMatchLocal(thesis, opportunity);
      if (score > 0) {
        const investor = investorMap[thesis.investidor_id] || { nome: 'Investidor', email: '' };
        const isSelf = selfManifestedKeys.has(thesis.investidor_id);
        const existing = results.find(r => r.investorId === thesis.investidor_id);
        if (!existing || score > existing.score) {
          const filtered = results.filter(r => r.investorId !== thesis.investidor_id);
          filtered.push({
            investorId: thesis.investidor_id,
            nome: investor.nome,
            email: investor.email,
            thesisTitle: thesis.titulo,
            score,
            reasons,
            origem: isSelf ? 'proprio' : 'sistema',
          });
          results.length = 0;
          results.push(...filtered);
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }, [opportunity, investorMap, selfManifestedKeys]);

  // Merge system matches with manually added investors
  const allMatches = useMemo(() => {
    const existingIds = new Set(matches.map(m => m.investorId));
    const extra = manualInvestors.filter(m => !existingIds.has(m.investorId));
    return [...matches, ...extra];
  }, [matches, manualInvestors]);

  const existingInvestorIds = useMemo(() => allMatches.map(m => m.investorId), [allMatches]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const getStatus = (investorId: string): MatchStatusLocal => {
    if (matchStatuses[investorId]) return matchStatuses[investorId];
    if (selfManifestedKeys.has(investorId)) return 'interessado';
    // Manual investors default to interessado
    if (manualInvestors.some(m => m.investorId === investorId)) return 'interessado';
    return 'aguardando_contato';
  };

  return (
    <div className="rounded-xl bg-card border-0 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="h-4 w-4 text-primary" />
          Investidores Compatíveis ({allMatches.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setAddInvestorOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => navigate('/admin/investidores', {
              state: { openMatchmaking: true, expandOppId: opportunity.id },
            })}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver no Matchmaking
          </Button>
        </div>
      </div>

      {allMatches.length === 0 ? (
        <div className="text-center py-10">
          <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum investidor compatível encontrado.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Investidores serão exibidos aqui quando suas teses coincidirem com esta oportunidade.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {allMatches.map((inv, i) => {
            const currentStatus = getStatus(inv.investorId);
            const statusOpt = MATCH_STATUS_OPTIONS_LOCAL.find(o => o.value === currentStatus);
            const notifyKey = inv.investorId;
            const alreadyNotified = notifiedInvestors.has(notifyKey);

            return (
              <motion.div
                key={inv.investorId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 transition-colors hover:bg-muted/50 group"
              >
                {/* Avatar + Info */}
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate('/admin/investidores', { state: { openInvestorId: inv.investorId } })}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(inv.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate hover:underline">{inv.nome}</p>
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
                      <span className="truncate">Tese: {inv.thesisTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Match reasons */}
                <div className="hidden lg:flex items-center gap-3 shrink-0">
                  {inv.reasons.map((reason, ri) => (
                    <div key={ri} className="flex items-center gap-1 text-[11px]">
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

                {/* Score */}
                <span className={cn('text-xs font-bold tabular-nums shrink-0', getScoreColorLocal(inv.score))}>
                  {inv.score}%
                </span>

                {/* Compatibility label */}
                <span className={cn('text-xs font-medium shrink-0 w-12 text-center', getScoreColorLocal(inv.score))}>
                  {getScoreLabelLocal(inv.score)}
                </span>

                {/* Status selector */}
                <Select
                  value={currentStatus}
                  onValueChange={(v) => setMatchStatuses(prev => ({ ...prev, [inv.investorId]: v as MatchStatusLocal }))}
                >
                  <SelectTrigger
                    className={cn(
                      'h-8 w-[130px] text-xs rounded-lg border-0 shadow-none gap-1.5 font-medium transition-colors shrink-0',
                      statusOpt?.color
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl p-1 min-w-[160px]">
                    {MATCH_STATUS_OPTIONS_LOCAL.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="rounded-lg text-xs cursor-pointer">
                        <span className="flex items-center gap-2">
                          {(() => { const Icon = MATCH_STATUS_ICONS_LOCAL[opt.value]; return <Icon className="h-3.5 w-3.5" />; })()}
                          <span>{opt.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Notify button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 w-7 p-0 hover:bg-muted/60 shrink-0",
                    alreadyNotified && "opacity-40 cursor-not-allowed hover:bg-transparent"
                  )}
                  disabled={alreadyNotified}
                  title={alreadyNotified ? 'Notificação já enviada' : `Notificar ${inv.nome}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!alreadyNotified) setConfirmNotify({ investorName: inv.nome, investorId: inv.investorId });
                  }}
                >
                  <Send className={cn("h-3.5 w-3.5", alreadyNotified ? "text-muted-foreground" : "text-primary")} />
                </Button>
              </motion.div>
            );
          })}
        </div>
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
              Deseja enviar uma notificação para <span className="font-medium text-foreground">{confirmNotify?.investorName}</span> sobre a oportunidade "{opportunity.nome}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-muted/20 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
            <Button variant="outline" onClick={() => setConfirmNotify(null)}>
              Cancelar
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                if (confirmNotify) {
                  setNotifiedInvestors(prev => new Set(prev).add(confirmNotify.investorId));
                  sonnerToast.success(`Notificação enviada para ${confirmNotify.investorName}`);
                  setConfirmNotify(null);
                }
              }}
            >
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Investor Dialog */}
      <AddManualInvestorDialog
        open={addInvestorOpen}
        onOpenChange={setAddInvestorOpen}
        opportunityName={opportunity.nome}
        opportunityId={opportunity.id}
        existingInvestorIds={existingInvestorIds}
        onAddInvestor={(investor) => {
          manualInvestorsStore.add(opportunity.id, {
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
          setMatchStatuses(prev => ({ ...prev, [investor.id]: 'interessado' }));
          sonnerToast.success(`${investor.nome} adicionado como interessado`);
        }}
      />
    </div>
  );
}

// ─── Match Investors Section ────────────────────────────────────
function MatchInvestorsSection({ opportunityId, navigate }: { opportunityId: string; navigate: NavigateFunction }) {
  const interessados = useMemo(() => {
    const manifestacoes = mockManifestacoes.filter(m => m.oportunidade_id === opportunityId);
    
    const investorMap: Record<string, { nome: string; email: string; tipo: string }> = {};
    mockProfiles.forEach(p => {
      investorMap[p.id] = { nome: p.nome, email: p.email, tipo: p.tipo };
    });

    return manifestacoes.map(m => {
      const investorId = (m as any).investidor_id || (m as any).usuario_id;
      const investor = investorMap[investorId] || { nome: 'Investidor', email: '', tipo: 'investidor' };
      return {
        id: m.id,
        investorId,
        nome: investor.nome,
        email: investor.email,
        valor: (m as any).valor || 0,
        status: (m as any).status || 'interessado',
        created_at: m.created_at,
      };
    });
  }, [opportunityId]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const statusConfig: Record<string, { label: string; className: string }> = {
    interessado: { label: 'Interessado', className: 'bg-primary/10 text-primary border-primary/20' },
    pendente: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
    aprovada: { label: 'Aprovado', className: 'bg-primary/10 text-primary border-primary/20' },
    rejeitada: { label: 'Rejeitado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  return (
    <div className="rounded-xl bg-card border-0 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Flame className="h-4 w-4 text-destructive" />
          Investidores Interessados ({interessados.length})
        </h3>
      </div>

      {interessados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum investidor manifestou interesse nesta oportunidade ainda.</p>
      ) : (
        <div className="space-y-2">
          {interessados.map(inv => {
            const sc = statusConfig[inv.status] || statusConfig.pendente;
            return (
              <div
                key={inv.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 transition-colors cursor-pointer hover:bg-muted/50"
                onClick={() => navigate('/admin/investidores', { state: { openInvestorId: inv.investorId } })}
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

                {inv.valor > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(inv.valor)}</p>
                  </div>
                )}

                <Badge variant="outline" className={cn('text-[10px] border', sc.className)}>
                  {sc.label}
                </Badge>

                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(inv.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OperationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingStageMove, setPendingStageMove] = useState<EtapaPipeline | null>(null);

  const defaultTab = searchParams.get('tab') || 'details';
  const [activeTab, setActiveTab] = useState(defaultTab);

  const { data: operacao, isLoading } = useOperacao(id);
  const { data: historico = [], isLoading: isLoadingHistorico } = useOperacaoHistorico(id);
  const moveOperacao = useMoveOperacao();
  const { data: allOportunidades } = useOportunidadesInvestimento();

  // Find linked opportunity for this operation
  const linkedOportunidade = useMemo(() => {
    if (!id || !allOportunidades) return null;
    return allOportunidades.find(o => o.operacao_origem_id === id) || null;
  }, [id, allOportunidades]);

  // Check if operation is a draft (incomplete)
  const isDraftOperation = useMemo(() => {
    try {
      if (!operacao?.observacoes) return false;
      const obs = JSON.parse(operacao.observacoes);
      return obs._draft === true;
    } catch { return false; }
  }, [operacao]);

  // Virtual opportunity derived from operation data — used for matchmaking when no real opportunity exists
  // Disabled for draft/incomplete operations
  const matchOpportunity = useMemo(() => {
    if (isDraftOperation) return null;
    if (linkedOportunidade) return linkedOportunidade;
    if (!operacao) return null;
    return {
      id: operacao.id,
      nome: operacao.empresa?.nome || operacao.numero_funil,
      segmento: operacao.segmento || operacao.empresa?.segmento || '',
      tipo: operacao.tipo_capital === 'Captação' ? 'Equity' : operacao.tipo_capital === 'Investimento' ? 'Equity' : 'Dívida',
      investimento_minimo: operacao.valor_investimento ? operacao.valor_investimento * 0.1 : 0,
      alvo_maximo: operacao.valor_investimento || 0,
      status: 'aberta' as const,
      _virtual: true,
    };
  }, [linkedOportunidade, operacao, isDraftOperation]);

  // Check if user is empresa type
  const isEmpresaUser = profile?.tipo === 'empresa';
  
  // Check if user is investidor type
  const isInvestidorUser = profile?.tipo === 'investidor';
  const { isAdmin: hasAdminAccess, isMaster } = useAdminPermissions();
  const isAdmin = hasAdminAccess || isMaster || profile?.tipo === 'admin' || profile?.tipo === 'master';

  // Only allow editing when operation is in "Prospecto" stage AND user is not an investor
  const canEdit = operacao?.etapa_atual === 'Prospecto' && !isInvestidorUser;
  
  // Investors cannot delete operations
  const canDelete = !isInvestidorUser;

  // Check if operation was created by empresa user (has empresa-specific fields)
  const isEmpresaOperation = (() => {
    if (!operacao?.observacoes) return false;
    try {
      const data = JSON.parse(operacao.observacoes);
      return data.origemFormulario === 'empresa' || data.nomeEmpresarial || data.tipoEmpresa;
    } catch {
      return false;
    }
  })();

  const confirmMoveStage = (newStage: EtapaPipeline) => {
    setPendingStageMove(newStage);
  };

  const handleMoveStage = async () => {
    if (!id || !operacao || !pendingStageMove) return;
    const newStage = pendingStageMove;
    setPendingStageMove(null);
    
    try {
      await moveOperacao.mutateAsync({
        operacaoId: id,
        novaEtapa: newStage,
        observacoes: `Movido de ${operacao.etapa_atual} para ${newStage}`,
      });
      toast({
        title: 'Etapa alterada',
        description: `Operação movida para ${newStage}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao mover operação',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

// Empresa-specific details view component
const EmpresaDetailsView = ({ operacao, formatCurrency }: { operacao: any; formatCurrency: (val: number) => string }) => {
  // Parse observacoes to get empresa-specific data
  const parseData = () => {
    if (!operacao?.observacoes) return {};
    try {
      return JSON.parse(operacao.observacoes);
    } catch {
      return {};
    }
  };

  const data = parseData();

  const formatYesNo = (val: string) => {
    if (val === 'sim') return 'Sim';
    if (val === 'nao') return 'Não';
    return '-';
  };

  const tipoEmpresaLabel = data.tipoEmpresa === 'tecnologia' ? 'Tecnologia' : 
                           data.tipoEmpresa === 'economia_real' ? 'Economia Real' : '-';

  const tiposOperacaoMap: Record<string, string> = {
    ma: 'M&A (Fusões e Aquisições)',
    credito: 'Crédito',
    financiamento_obras: 'Financiamento para Obras',
    capital_giro: 'Capital de Giro',
    expansao: 'Expansão',
  };

  const setoresMap: Record<string, string> = {
    fintech: 'Fintech', insurtech: 'Insurtech', healthtech: 'Healthtech',
    logtech: 'Logtech', retailtech: 'Retailtech', legaltech: 'Legaltech',
    agrotech: 'Agrotech', edtech: 'Edtech', foodtech: 'Foodtech',
    construtech: 'Construtech', proptech: 'Proptech', hrtech: 'HRtech',
    agro: 'Agro', real_estate: 'Atividades Imobiliárias', construcao: 'Construção e Infraestrutura',
    servicos_tecnicos: 'Serviços Profissionais', servicos_adm: 'Serviços Administrativos',
    educacao: 'Educação', outros_servicos: 'Outros Serviços', educacao_corporativa: 'Educação Corporativa',
    franquiadora: 'Franquiadora', marketing: 'Marketing e Publicidade',
  };

  return (
    <>
      {/* Informações Cadastrais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações Cadastrais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome Empresarial</Label>
              <p className="text-foreground">{data.nomeEmpresarial || operacao.empresa?.nome || '-'}</p>
            </div>
            <div>
              <Label>CNPJ</Label>
              <p className="text-foreground">{data.cnpj || operacao.empresa?.cnpj || '-'}</p>
            </div>
            <div>
              <Label>Nome Fantasia</Label>
              <p className="text-foreground">{data.nomeFantasia || '-'}</p>
            </div>
            <div>
              <Label>Site</Label>
              <p className="text-foreground">{data.site || '-'}</p>
            </div>
            <div>
              <Label>E-mail do Empresário</Label>
              <p className="text-foreground">{data.emailEmpresario || '-'}</p>
            </div>
            <div>
              <Label>Tipo de Empresa</Label>
              <p className="text-foreground">{tipoEmpresaLabel}</p>
            </div>
          </div>
          {data.sobreEmpresa && (
            <div className="mt-4">
              <Label>Sobre a Empresa</Label>
              <p className="text-foreground text-sm mt-1">{data.sobreEmpresa}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <Label>Recuperação Judicial</Label>
              <p className="text-foreground">{formatYesNo(data.recuperacaoJudicial)}</p>
            </div>
            <div>
              <Label>Balanço Auditado</Label>
              <p className="text-foreground">{formatYesNo(data.balancoAuditado)}</p>
            </div>
            <div>
              <Label>Receita Não Declarada</Label>
              <p className="text-foreground">{formatYesNo(data.receitaNaoDeclarada)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classificação */}
      {data.setores && data.setores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Setores de Atuação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.setores.map((setor: string) => (
                <span 
                  key={setor} 
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {setoresMap[setor] || setor}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Financeiras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Informações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Faturamento */}
          <div>
            <h4 className="font-medium mb-3">Faturamento Anual</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg">
                <Label className="text-xs">2023</Label>
                <p className="text-foreground font-medium">{data.faturamento2023 || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <Label className="text-xs">2024</Label>
                <p className="text-foreground font-medium">{data.faturamento2024 || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <Label className="text-xs">2025</Label>
                <p className="text-foreground font-medium">{data.faturamento2025 || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <Label className="text-xs">2026 (Projeção)</Label>
                <p className="text-foreground font-medium">{data.faturamento2026 || '-'}</p>
              </div>
            </div>
          </div>

          {/* EBITDA */}
          <div>
            <h4 className="font-medium mb-3">EBITDA</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg">
                <Label className="text-xs">2023</Label>
                <p className="text-foreground font-medium">{data.ebitda2023 || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <Label className="text-xs">2024</Label>
                <p className="text-foreground font-medium">{data.ebitda2024 || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <Label className="text-xs">2025</Label>
                <p className="text-foreground font-medium">{data.ebitda2025 || '-'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <Label className="text-xs">2026 (Projeção)</Label>
                <p className="text-foreground font-medium">{data.ebitda2026 || '-'}</p>
              </div>
            </div>
          </div>

          {/* Endividamento */}
          {data.possuiDividas === 'sim' && (
            <div>
              <h4 className="font-medium mb-3">Endividamento</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                  <Label className="text-xs">Bancário</Label>
                  <p className="text-foreground font-medium">{data.endividamentoBancario || '-'}</p>
                </div>
                <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                  <Label className="text-xs">Fornecedores</Label>
                  <p className="text-foreground font-medium">{data.endividamentoFornecedores || '-'}</p>
                </div>
                <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                  <Label className="text-xs">Tributário</Label>
                  <p className="text-foreground font-medium">{data.endividamentoTributario || '-'}</p>
                </div>
                <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                  <Label className="text-xs">Outros</Label>
                  <p className="text-foreground font-medium">{data.outrosEndividamentos || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipos de Operação */}
      {data.tiposOperacao && data.tiposOperacao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tipos de Operação Desejados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.tiposOperacao.map((tipo: string) => (
                <span 
                  key={tipo} 
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {tiposOperacaoMap[tipo] || tipo}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {data.observacoesGerais && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{data.observacoesGerais}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
};


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!operacao) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Operação não encontrada</p>
        <Button variant="outline" onClick={() => navigate('/operacoes')}>
          Voltar para Operações
        </Button>
      </div>
    );
  }

  const currentStageIndex = pipelineStages.indexOf(operacao.etapa_atual as EtapaPipeline);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-lg hover:bg-muted/70" onClick={() => navigate('/operacoes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-11 w-11 rounded-xl bg-muted/70 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {operacao.empresa?.nome || 'Sem empresa'}
            </h1>
            <p className="text-xs text-muted-foreground">{operacao.numero_funil}</p>
          </div>
        </div>

        {!isInvestidorUser && (
          <div className="flex items-center gap-2">
            {/* Advance stage button - admin only */}
            {isAdmin && operacao.etapa_atual !== 'Concluído' && operacao.etapa_atual !== 'Cliente Ativo' && (
              <Button
                size="sm"
                className="gap-1.5"
                disabled={moveOperacao.isPending}
                onClick={() => {
                  const currentIdx = pipelineStages.indexOf(operacao.etapa_atual as EtapaPipeline);
                  if (currentIdx < pipelineStages.length - 1) {
                    confirmMoveStage(pipelineStages[currentIdx + 1]);
                  }
                }}
              >
                {moveOperacao.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                Avançar Etapa
              </Button>
            )}
            {operacao.etapa_atual === 'Cliente Ativo' && isAdmin && (
              <Button 
                size="sm" 
                variant="outline"
                className="gap-1.5 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
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
                <Zap className="h-3.5 w-3.5" />
                Gerar Oportunidade
              </Button>
            )}
            {canEdit ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditModalOpen(true)}>
                <Edit className="h-3.5 w-3.5" />
                Editar
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled className="opacity-40 gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edição permitida apenas na etapa "Prospecto"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {canDelete && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      {isEmpresaOperation || isEmpresaUser ? (
        <EditOperationModalEmpresa open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} operacao={operacao} />
      ) : (
        <EditOperationModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} operacao={operacao} />
      )}
      <DeleteOperationModal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} operacao={operacao} onSuccess={() => navigate('/operacoes')} />

      {/* Stage Move Confirmation Dialog */}
      <AlertDialog open={!!pendingStageMove} onOpenChange={(open) => !open && setPendingStageMove(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar movimentação</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja mover esta operação de <span className="font-semibold text-foreground">{operacao.etapa_atual}</span> para <span className="font-semibold text-foreground">{pendingStageMove}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="bg-muted/20 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMoveStage} disabled={moveOperacao.isPending}>
              {moveOperacao.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pipeline Progress */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl bg-card border-0 shadow-sm p-5"
      >
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Pipeline</p>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {pipelineStages.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isAccessible = index <= currentStageIndex;
            
            return (
              <button
                key={stage}
                onClick={() => isAccessible && confirmMoveStage(stage)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  isCompleted && 'bg-primary/10 text-primary hover:bg-primary/15',
                  isCurrent && 'bg-primary text-primary-foreground shadow-sm shadow-primary/20',
                  !isAccessible && 'text-muted-foreground/40 cursor-not-allowed',
                  isAccessible && !isCurrent && !isCompleted && 'text-muted-foreground hover:bg-muted/50'
                )}
                disabled={moveOperacao.isPending || !isAccessible}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isCurrent ? (
                  <Circle className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Circle className="h-3.5 w-3.5 opacity-40" />
                )}
                {stage}
                {index < pipelineStages.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 opacity-30 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStageIndex + 1) / pipelineStages.length) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="lg:col-span-2 space-y-5"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              {isAdmin && linkedOportunidade && (
                <TabsTrigger value="oportunidade" className="gap-1.5">
                  <Zap className="h-3 w-3" />
                  Oportunidade
                </TabsTrigger>
              )}
              {isAdmin && matchOpportunity && (
                <TabsTrigger value="compativeis" className="gap-1.5">
                  <Users className="h-3 w-3" />
                  Compatíveis
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {isEmpresaOperation ? (
                <EmpresaDetailsView operacao={operacao} formatCurrency={formatCurrency} />
              ) : (
                <>
                  {/* Financial Info */}
                  <div className="rounded-xl bg-card border-0 shadow-sm p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Informações Financeiras
                    </h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Valor do Investimento</p>
                        <p className="text-lg font-bold text-foreground tabular-nums">
                          {operacao.valor_investimento ? formatCurrency(operacao.valor_investimento) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tipo de Capital</p>
                        <p className="text-sm font-medium text-foreground">{operacao.tipo_capital || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="rounded-xl bg-card border-0 shadow-sm p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                      <Building2 className="h-4 w-4 text-primary" />
                      Empresa
                    </h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Nome</p>
                        <p className="text-sm font-medium text-foreground">{operacao.empresa?.nome || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">CNPJ</p>
                        <p className="text-sm text-foreground tabular-nums">{operacao.empresa?.cnpj || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Segmento</p>
                        <p className="text-sm font-medium text-foreground">{operacao.empresa?.segmento || operacao.segmento || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="rounded-xl bg-card border-0 shadow-sm p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                      <FileText className="h-4 w-4 text-primary" />
                      Observações
                    </h3>
                    <ObservacoesDisplay observacoes={operacao.observacoes} />
                  </div>
                </>
              )}
            </TabsContent>


            <TabsContent value="timeline" className="mt-4">
              <div className="rounded-xl bg-card border-0 shadow-sm p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-5">
                  <History className="h-4 w-4 text-primary" />
                  Histórico de Movimentações
                </h3>
                {isLoadingHistorico ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : historico.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium mb-1">Nenhuma movimentação registrada</p>
                    <p className="text-xs opacity-70">O histórico aparecerá aqui quando houver alterações.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border/60" />
                    <div className="space-y-4">
                      {historico.map((item: any, index: number) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: index * 0.05 }}
                          className="relative pl-10"
                        >
                          <div className={cn(
                            'absolute left-[11px] w-2.5 h-2.5 rounded-full border-2',
                            index === 0 
                              ? 'bg-primary border-primary' 
                              : 'bg-background border-muted-foreground/40'
                          )} />
                          <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="text-sm font-medium text-foreground">
                                {item.etapa_anterior} → {item.etapa_nova}
                              </p>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-full">
                                {format(new Date(item.data_hora), "dd MMM, HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {item.sub_etapa_nova && (
                              <p className="text-xs text-muted-foreground">Sub-etapa: {item.sub_etapa_nova}</p>
                            )}
                            {item.observacoes && (
                              <p className="text-xs text-muted-foreground mt-2">{item.observacoes}</p>
                            )}
                            {item.usuario && (
                              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/30">
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
            </TabsContent>

            {/* Oportunidade Tab - Admin only */}
            {isAdmin && linkedOportunidade && (
              <TabsContent value="oportunidade" className="mt-4 space-y-4">
                <div className="rounded-xl bg-card border-0 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Oportunidade Vinculada
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => navigate(`/oportunidades/${linkedOportunidade.id}`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver Oportunidade
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nome</p>
                      <p className="text-sm font-semibold text-foreground">{linkedOportunidade.nome}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        linkedOportunidade.status === 'aberta' && 'bg-primary/10 text-primary',
                        linkedOportunidade.status === 'captada' && 'bg-amber-500/10 text-amber-500',
                        linkedOportunidade.status === 'encerrada' && 'bg-muted text-muted-foreground',
                      )}>
                        {linkedOportunidade.status === 'aberta' ? 'Aberta' : linkedOportunidade.status === 'captada' ? 'Captada' : 'Encerrada'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Instrumento</p>
                      <p className="text-sm font-medium text-foreground">{linkedOportunidade.instrumento || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Segmento</p>
                      <p className="text-sm font-medium text-foreground">{linkedOportunidade.segmento || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Financial metrics */}
                <div className="rounded-xl bg-card border-0 shadow-sm p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Métricas Financeiras
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Rentabilidade</p>
                      <p className="text-lg font-bold text-foreground">{linkedOportunidade.rentabilidade ? `${linkedOportunidade.rentabilidade}%` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Investimento Mínimo</p>
                      <p className="text-sm font-medium text-foreground">{linkedOportunidade.investimento_minimo ? formatCurrency(linkedOportunidade.investimento_minimo) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Prazo</p>
                      <p className="text-sm font-medium text-foreground">{linkedOportunidade.prazo ? `${linkedOportunidade.prazo} meses` : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Captação progress */}
                <div className="rounded-xl bg-card border-0 shadow-sm p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                    <Target className="h-4 w-4 text-primary" />
                    Captação
                  </h3>
                  <div className="grid grid-cols-3 gap-5 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Captado</p>
                      <p className="text-sm font-bold text-foreground">{formatCurrency(linkedOportunidade.captado || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Alvo</p>
                      <p className="text-sm font-medium text-foreground">{formatCurrency(linkedOportunidade.alvo_maximo || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Investidores</p>
                      <p className="text-sm font-bold text-foreground">{linkedOportunidade.investidores || 0}</p>
                    </div>
                  </div>
                  {linkedOportunidade.alvo_maximo > 0 && (
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((linkedOportunidade.captado || 0) / linkedOportunidade.alvo_maximo) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Compatíveis Tab - Admin only, available from Prospecto */}
            {isAdmin && matchOpportunity && (
              <TabsContent value="compativeis" className="mt-4">
                <CompatibleInvestorsTab opportunity={matchOpportunity} navigate={navigate} />
              </TabsContent>
            )}

          </Tabs>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-4"
        >
          <StatusCard operacao={operacao} />

          {/* Responsável */}
          <div className="rounded-xl bg-card border-0 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Responsável</h3>
            {operacao.responsavel ? (
              <div className="flex items-center gap-3">
                {operacao.responsavel.avatar_url ? (
                  <img src={operacao.responsavel.avatar_url} alt={operacao.responsavel.nome} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{operacao.responsavel.nome}</p>
                  <p className="text-xs text-muted-foreground">{operacao.responsavel.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Não atribuído</p>
            )}
          </div>

          {/* Datas */}
          <div className="rounded-xl bg-card border-0 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Datas</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Criado em</p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {operacao.created_at ? format(new Date(operacao.created_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Última movimentação</p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {operacao.ultima_movimentacao ? format(new Date(operacao.ultima_movimentacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
