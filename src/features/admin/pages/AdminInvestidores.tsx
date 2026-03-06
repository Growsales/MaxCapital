/**
 * AdminInvestidores - Central dos Investidores
 * View/edit investor profiles, associated theses, and manage thesis forms.
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Eye, Edit, Mail, Phone, TrendingUp,
  CheckCircle2, XCircle, Clock, FileText, BarChart3,
  ChevronRight, ArrowLeft, ClipboardList, Briefcase,
  DollarSign, Calendar, Shield, Loader2, Save, Flame,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Badge } from '@/shared/components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';
import { Label } from '@/shared/components/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import { Separator } from '@/shared/components/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/shared/components/dialog';
import { Skeleton } from '@/shared/components/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { MatchmakingTab } from '@/features/admin/components/MatchmakingTab';
import { GlobalMatchmakingView } from '@/features/admin/components/GlobalMatchmakingView';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { FormBuilderEditor } from '@/features/admin/components/FormBuilder';
import type { FormBlock } from '@/features/admin/components/FormBuilder/types';
import type { UserStatus } from '@/types/supabase';
import {
  getForms, getFormBlocks, createForm, renameForm, deleteForm,
  setFormActive, saveFormBlocks, getActiveForm,
  FORMS_CHANGED_EVENT, type FormEntry,
} from '@/lib/forms-registry';
import { getDefaultBlocksForSector } from '@/features/admin/components/FormBuilder/defaultBlocks';

// ─── Types ──────────────────────────────────────────────────────────────────

interface InvestorProfile {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  codigo_convite_proprio?: string;
  total_indicacoes_diretas?: number;
  total_indicacoes_indiretas?: number;
}

type ViewMode = 'list' | 'detail' | 'forms' | 'matchmaking';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ativo: { label: 'Ativo', color: 'bg-emerald-500', icon: CheckCircle2 },
  inativo: { label: 'Inativo', color: 'bg-muted-foreground', icon: XCircle },
  pendente_aprovacao: { label: 'Pendente', color: 'bg-amber-500', icon: Clock },
};

// ─── Thesis Form Keys ───────────────────────────────────────────────────────

const THESIS_SETOR = '_investidor_tese';
const THESIS_SEGMENTO = 'default';

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminInvestidores() {
  const location = useLocation();
  const locationState = location.state as any;
  const [viewMode, setViewMode] = useState<ViewMode>(
    locationState?.openMatchmaking ? 'matchmaking' : locationState?.openInvestorId ? 'detail' : 'list'
  );
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorProfile | null>(null);
  const [pendingInvestorId, setPendingInvestorId] = useState<string | null>(locationState?.openInvestorId || null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Forms state
  const [formsVersion, setFormsVersion] = useState(0);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [editingForm, setEditingForm] = useState<FormEntry | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ─── Data Fetching ──────────────────────────────────────────────

  const { data: investors, isLoading } = useQuery({
    queryKey: ['admin-investidores', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('tipo', 'investidor')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InvestorProfile[];
    },
  });

  // Auto-open investor profile when navigated with openInvestorId
  useEffect(() => {
    if (pendingInvestorId && investors && investors.length > 0) {
      const found = investors.find(i => i.id === pendingInvestorId);
      if (found) {
        setSelectedInvestor(found);
        setViewMode('detail');
        setPendingInvestorId(null);
      }
    }
  }, [pendingInvestorId, investors]);

  // Fetch profile_details for the selected investor
  const { data: investorDetails } = useQuery({
    queryKey: ['admin-investor-details', selectedInvestor?.id],
    queryFn: async () => {
      if (!selectedInvestor) return null;
      const { data, error } = await supabase
        .from('profile_details')
        .select('*')
        .eq('user_id', selectedInvestor.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedInvestor,
  });

  // Fetch theses associated to a specific investor
  const { data: investorTeses } = useQuery({
    queryKey: ['admin-investor-teses', selectedInvestor?.id],
    queryFn: async () => {
      if (!selectedInvestor) return [];
      const { data, error } = await supabase
        .from('teses_investimento')
        .select('*')
        .eq('investidor_id', selectedInvestor.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedInvestor,
  });

  // Fetch all teses to count per investor in the list
  const { data: allTeses } = useQuery({
    queryKey: ['admin-all-teses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teses_investimento')
        .select('investidor_id');
      if (error) throw error;
      return data || [];
    },
  });

  const tesesCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    (allTeses || []).forEach((t: any) => {
      if (t.investidor_id) {
        map[t.investidor_id] = (map[t.investidor_id] || 0) + 1;
      }
    });
    return map;
  }, [allTeses]);
  // ─── Pagination ─────────────────────────────────────────────────

  const paginated = useMemo(() => {
    if (!investors) return [];
    const start = (currentPage - 1) * pageSize;
    return investors.slice(start, start + pageSize);
  }, [investors, currentPage, pageSize]);

  const totalPages = Math.ceil((investors?.length || 0) / pageSize);

  // ─── Stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: investors?.length || 0,
    ativos: investors?.filter(i => i.status === 'ativo').length || 0,
    pendentes: investors?.filter(i => i.status === 'pendente_aprovacao').length || 0,
    inativos: investors?.filter(i => i.status === 'inativo').length || 0,
  }), [investors]);

  // ─── Navigation ─────────────────────────────────────────────────

  const openDetail = (investor: InvestorProfile) => {
    setSelectedInvestor(investor);
    setViewMode('detail');
  };

  const goBack = () => {
    if (viewMode === 'detail') {
      setSelectedInvestor(null);
      setViewMode('list');
    } else if (viewMode === 'forms') {
      if (selectedFormId) {
        setSelectedFormId(null);
      } else {
        setViewMode('list');
      }
    } else if (viewMode === 'matchmaking') {
      if ((location.state as any)?.openMatchmaking) {
        navigate('/operacoes', { state: { activeStage: 'Matchmaking' } });
      } else {
        setViewMode('list');
      }
    }
  };

  // ─── Forms Management ──────────────────────────────────────────

  const thesisForms = useMemo(() => getForms(THESIS_SETOR, THESIS_SEGMENTO), [formsVersion]);

  const openNewFormModal = () => { setEditingForm(null); setFormName(''); setFormModalOpen(true); };
  const openEditFormModal = (form: FormEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingForm(form);
    setFormName(form.name);
    setFormModalOpen(true);
  };

  const handleSaveForm = () => {
    if (!formName.trim()) { toast.error('Nome é obrigatório'); return; }
    if (editingForm) {
      renameForm(THESIS_SETOR, THESIS_SEGMENTO, editingForm.id, formName.trim());
      toast.success(`Formulário renomeado`);
    } else {
      const defaults = getDefaultBlocksForSector('investidor_tese');
      createForm(THESIS_SETOR, THESIS_SEGMENTO, formName.trim(), defaults.length > 0 ? defaults : []);
      toast.success(`Formulário "${formName}" criado`);
    }
    setFormModalOpen(false);
    setFormsVersion(v => v + 1);
  };

  const handleToggleActive = (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormActive(THESIS_SETOR, THESIS_SEGMENTO, formId);
    toast.success('Formulário ativado');
    setFormsVersion(v => v + 1);
  };

  const handleDeleteForm = (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteForm(THESIS_SETOR, THESIS_SEGMENTO, formId);
    toast.success('Formulário removido');
    setFormsVersion(v => v + 1);
  };

  const handleSaveBlocks = (blocks: FormBlock[]) => {
    if (!selectedFormId) return;
    saveFormBlocks(THESIS_SETOR, THESIS_SEGMENTO, selectedFormId, blocks);
    setFormsVersion(v => v + 1);
    toast.success('Formulário salvo!');
  };

  // ─── Breadcrumb ─────────────────────────────────────────────────

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Central dos Investidores' }];
    if (viewMode === 'detail' && selectedInvestor) {
      items.push({ label: selectedInvestor.nome });
    }
    if (viewMode === 'forms') {
      items.push({ label: 'Formulários de Teses' });
      if (selectedFormId) {
        const form = thesisForms.find(f => f.id === selectedFormId);
        if (form) items.push({ label: form.name });
      }
    }
    if (viewMode === 'matchmaking') {
      items.push({ label: 'Matchmaking' });
    }
    return items;
  }, [viewMode, selectedInvestor, selectedFormId, thesisForms]);

  // ─── Render List View ──────────────────────────────────────────

  const renderList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Central dos Investidores</h1>
          <p className="text-muted-foreground mt-1">Gerencie perfis, teses e formulários de investidores</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setViewMode('matchmaking')}
            variant="outline"
            className="gap-2"
          >
            <Flame className="h-4 w-4 animate-pulse text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
            Matchmaking
          </Button>
          <Button
            onClick={() => { setViewMode('forms'); setSelectedFormId(null); }}
            variant="outline"
            className="gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            Formulários de Teses
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Investidores', value: stats.total, icon: Users, gradient: 'from-teal-500 to-emerald-500' },
          { label: 'Ativos', value: stats.ativos, icon: CheckCircle2, gradient: 'from-emerald-500 to-green-500' },
          { label: 'Pendentes', value: stats.pendentes, icon: Clock, gradient: 'from-amber-500 to-yellow-500' },
          { label: 'Inativos', value: stats.inativos, icon: XCircle, gradient: 'from-slate-500 to-slate-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-0 overflow-hidden relative">
              <div className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', stat.gradient)} />
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn('p-2.5 rounded-lg bg-gradient-to-br shadow-lg', stat.gradient)}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 bg-muted/30 border-muted-foreground/10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[170px] bg-muted/30 border-muted-foreground/10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="pendente_aprovacao">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-muted-foreground/10 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Investidor</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Contato</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 text-center">Teses</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Cadastro</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-8 w-full rounded-md" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length > 0 ? (
                paginated.map((investor, index) => (
                  <motion.tr
                    key={investor.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-muted-foreground/5 transition-colors hover:bg-muted/30 group cursor-pointer"
                    onClick={() => openDetail(investor)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-muted-foreground/10">
                          <AvatarImage src={investor.avatar_url || ''} />
                          <AvatarFallback className="text-xs font-semibold bg-teal-500/10 text-teal-600">
                            {investor.nome?.charAt(0) || 'I'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-foreground">{investor.nome}</p>
                          <p className="text-xs text-muted-foreground">{investor.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {investor.telefone ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {investor.telefone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', statusConfig[investor.status]?.color)} />
                        <span className="text-sm">{statusConfig[investor.status]?.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm text-foreground font-medium">{tesesCountMap[investor.id] || 0}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(investor.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium">Nenhum investidor encontrado</p>
                      <p className="text-sm text-muted-foreground/60">Tente ajustar os filtros</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {(investors?.length || 0) > 0 && (
            <div className="border-t border-muted-foreground/5">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={investors?.length || 0}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ─── Render Detail View ─────────────────────────────────────────

  const renderDetail = () => {
    if (!selectedInvestor) return null;
    const teses = investorTeses || [];

    const formatCurrency = (val?: number) => {
      if (!val) return '—';
      if (val >= 1000000000) return `R$ ${(val / 1000000000).toFixed(1)}B`;
      if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(0)}M`;
      if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}K`;
      return `R$ ${val}`;
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="border-0">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={selectedInvestor.avatar_url || ''} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {selectedInvestor.nome?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-foreground">{selectedInvestor.nome}</h2>
                  <Badge className={cn('text-[11px]', statusConfig[selectedInvestor.status]?.color === 'bg-emerald-500' ? 'bg-emerald-500/10 text-emerald-600' : statusConfig[selectedInvestor.status]?.color === 'bg-amber-500' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground')}>
                    {statusConfig[selectedInvestor.status]?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{selectedInvestor.email}</span>
                  {selectedInvestor.telefone && (
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{selectedInvestor.telefone}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Cadastro:</span>
                    <span className="font-medium text-foreground">{format(new Date(selectedInvestor.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-muted/30">
            <TabsTrigger value="info" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Informações</TabsTrigger>
            <TabsTrigger value="teses" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Teses ({teses.length})</TabsTrigger>
            <TabsTrigger value="matchmaking" className="gap-1.5"><Flame className="h-3.5 w-3.5 animate-pulse text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" /> Matchmaking</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="space-y-6">
              {/* Dados Pessoais */}
              <Card className="border-0">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Nome Completo', value: selectedInvestor.nome },
                      { label: 'Email', value: selectedInvestor.email },
                      { label: 'Telefone', value: selectedInvestor.telefone },
                      { label: 'CPF', value: investorDetails?.cpf },
                      { label: 'Data de Nascimento', value: investorDetails?.data_nascimento ? format(new Date(investorDetails.data_nascimento), 'dd/MM/yyyy', { locale: ptBR }) : null },
                      ...(investorDetails?.tipo_pessoa === 'PJ' ? [
                        { label: 'CNPJ', value: investorDetails?.cnpj },
                        { label: 'Razão Social', value: investorDetails?.razao_social },
                      ] : []),
                      { label: 'Cadastro', value: format(new Date(selectedInvestor.created_at), 'dd/MM/yyyy', { locale: ptBR }) },
                      { label: 'Última Atualização', value: format(new Date(selectedInvestor.updated_at), 'dd/MM/yyyy', { locale: ptBR }) },
                      { label: 'Status', value: statusConfig[selectedInvestor.status]?.label },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-sm font-medium text-foreground">{item.value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Perfil de Investidor */}
              <Card className="border-0">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Perfil de Investidor
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Perfil de Risco', value: investorDetails?.perfil_risco || investorDetails?.categoria_investidor },
                      { label: 'Categoria', value: investorDetails?.categoria_investidor },
                      { label: 'Receita Bruta Anual', value: investorDetails?.receita_bruta_anual ? `R$ ${Number(investorDetails.receita_bruta_anual).toLocaleString('pt-BR')}` : null },
                      { label: 'Patrimônio Líquido', value: investorDetails?.patrimonio_liquido ? `R$ ${Number(investorDetails.patrimonio_liquido).toLocaleString('pt-BR')}` : null },
                      { label: 'Total em Investimentos', value: investorDetails?.total_investimentos ? `R$ ${Number(investorDetails.total_investimentos).toLocaleString('pt-BR')}` : null },
                      { label: 'Experiência (anos)', value: investorDetails?.experiencia_anos?.toString() },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-sm font-medium text-foreground">{item.value || '—'}</p>
                      </div>
                    ))}
                    {investorDetails?.areas_atuacao && investorDetails.areas_atuacao.length > 0 && (
                      <div className="col-span-2 md:col-span-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Áreas de Atuação</p>
                        <div className="flex flex-wrap gap-1.5">
                          {investorDetails.areas_atuacao.map((a: string) => (
                            <Badge key={a} variant="outline" className="text-[11px]">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resumo de Teses */}
              <Card className="border-0">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Resumo de Investimentos
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total de Teses</p>
                      <p className="text-2xl font-bold text-foreground">{teses.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Teses Ativas</p>
                      <p className="text-2xl font-bold text-foreground">{teses.filter((t: any) => t.ativo).length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Teses Quentes</p>
                      <p className="text-2xl font-bold text-foreground">{teses.filter((t: any) => t.tese_quente).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teses">
            {teses.length > 0 ? (
              <div className="space-y-4">
                {teses.map((tese: any) => (
                  <Card key={tese.id} className="border-0 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-foreground">{tese.titulo}</h3>
                            {tese.tese_quente && (
                              <Badge className="bg-orange-500/10 text-orange-500 border-0 text-[10px] gap-1">
                                🔥 Quente
                              </Badge>
                            )}
                            <Badge variant={tese.ativo ? 'default' : 'secondary'} className="text-[10px]">
                              {tese.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{tese.descricao}</p>
                        </div>
                      </div>

                      <Separator className="mb-4" />

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tipo</p>
                          <p className="text-sm font-medium text-foreground">{tese.tipo || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Categoria</p>
                          <p className="text-sm font-medium text-foreground">{tese.categoria || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Ticket</p>
                          <p className="text-sm font-bold text-primary">{formatCurrency(tese.valor_min)} – {formatCurrency(tese.valor_max)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Modelo de Negócio</p>
                          <p className="text-sm font-medium text-foreground">{tese.modelo_negocio || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Fase</p>
                          <p className="text-sm font-medium text-foreground">{tese.fase_investimento || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Público Alvo</p>
                          <p className="text-sm font-medium text-foreground">{tese.publico_alvo || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Localização</p>
                          <p className="text-sm font-medium text-foreground">{tese.localizacao || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Criada em</p>
                          <p className="text-sm font-medium text-foreground">{format(new Date(tese.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                      </div>

                      {/* Setores */}
                      {tese.setores && tese.setores.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Setores</p>
                          <div className="flex flex-wrap gap-1.5">
                            {tese.setores.map((s: string) => (
                              <Badge key={s} variant="outline" className="text-[11px]">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Regiões */}
                      {tese.regioes && tese.regioes.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Regiões</p>
                          <div className="flex flex-wrap gap-1.5">
                            {tese.regioes.map((r: string) => (
                              <Badge key={r} variant="secondary" className="text-[11px]">{r}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tipo Transação */}
                      {tese.tipo_transacao && tese.tipo_transacao.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Tipos de Transação</p>
                          <div className="flex flex-wrap gap-1.5">
                            {tese.tipo_transacao.map((t: string) => (
                              <Badge key={t} variant="outline" className="text-[11px]">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Financial details */}
                      {(tese.faturamento_min || tese.ebitda_min) && (
                        <>
                          <Separator className="my-4" />
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {tese.faturamento_min != null && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Faturamento Mín.</p>
                                <p className="text-sm font-medium text-foreground">{formatCurrency(tese.faturamento_min)}</p>
                              </div>
                            )}
                            {tese.faturamento_max != null && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Faturamento Máx.</p>
                                <p className="text-sm font-medium text-foreground">{formatCurrency(tese.faturamento_max)}</p>
                              </div>
                            )}
                            {tese.ebitda_min != null && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">EBITDA Mín.</p>
                                <p className="text-sm font-medium text-foreground">{formatCurrency(tese.ebitda_min)}</p>
                              </div>
                            )}
                            {tese.ebitda_max != null && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">EBITDA Máx.</p>
                                <p className="text-sm font-medium text-foreground">{formatCurrency(tese.ebitda_max)}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      <Separator className="my-4" />
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/teses/${tese.id}`)} className="gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          Ver Tese
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium text-muted-foreground">Nenhuma tese encontrada</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Este investidor ainda não possui teses de investimento.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Matchmaking Tab */}
          <TabsContent value="matchmaking">
            <MatchmakingTab teses={teses} investorName={selectedInvestor.nome} investorId={selectedInvestor.id} navigate={navigate} />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // ─── Render Forms View ──────────────────────────────────────────

  const renderForms = () => {
    // If editing a specific form
    if (selectedFormId) {
      const blocks = getFormBlocks(THESIS_SETOR, THESIS_SEGMENTO, selectedFormId);
      const form = thesisForms.find(f => f.id === selectedFormId);

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </Button>
            <h2 className="text-lg font-bold text-foreground">{form?.name || 'Editor'}</h2>
          </div>
          <FormBuilderEditor
            setor={THESIS_SETOR}
            segmento={THESIS_SEGMENTO}
            setorLabel="Investidor"
            segmentoLabel="Teses"
            initialBlocks={blocks}
            onSave={handleSaveBlocks}
          />
        </div>
      );
    }

    // Forms listing
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Formulários de Teses</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os formulários que investidores preenchem ao submeter teses de investimento.
            </p>
          </div>
          <Button size="sm" onClick={openNewFormModal} className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Novo Formulário
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {thesisForms.length > 0 ? thesisForms.map((form) => (
            <motion.div key={form.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card
                className={cn(
                  'cursor-pointer hover:shadow-md transition-all group border-0 shadow-none',
                  form.active ? 'bg-primary/5' : 'bg-card/50'
                )}
                onClick={() => setSelectedFormId(form.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', form.active ? 'bg-primary/10' : 'bg-muted')}>
                    <ClipboardList className={cn('h-5 w-5', form.active ? 'text-primary' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{form.name}</h3>
                      {form.active && (
                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Ativo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Criado em {format(new Date(form.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!form.active && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Ativar" onClick={(e) => handleToggleActive(form.id, e)}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEditFormModal(form, e)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => handleDeleteForm(form.id, e)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          )) : (
            <Card className="border-0 col-span-2">
              <CardContent className="p-12 text-center">
                <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-medium text-muted-foreground">Nenhum formulário criado</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Crie um formulário para investidores submeterem suas teses.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Form name modal */}
        <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editingForm ? 'Renomear Formulário' : 'Novo Formulário de Tese'}</DialogTitle>
              <DialogDescription>
                {editingForm ? 'Edite o nome do formulário.' : 'Dê um nome para o novo formulário.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label>Nome</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Formulário Padrão de Tese" autoFocus />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveForm}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <AdminBreadcrumb items={breadcrumbItems} />

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode + (selectedFormId || '')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'list' && renderList()}
          {viewMode === 'detail' && renderDetail()}
          {viewMode === 'forms' && renderForms()}
          {viewMode === 'matchmaking' && (
            <GlobalMatchmakingView
              navigate={navigate}
              onBack={goBack}
              initialExpandedOppId={locationState?.expandOppId || null}
              onInvestorClick={(investorId) => {
                const inv = investors?.find(i => i.id === investorId);
                if (inv) openDetail(inv);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
