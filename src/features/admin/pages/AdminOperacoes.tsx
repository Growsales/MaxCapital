import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Search, MoreVertical, Eye, Edit, Trash2,
  Building2, DollarSign, Calendar, User, ArrowRight, Save, Loader2,
  MapPin, FileText, Tag, Clock, Shield, Hash, Zap, SlidersHorizontal
} from 'lucide-react';
import { Switch } from '@/shared/components/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Badge } from '@/shared/components/badge';
import { Label } from '@/shared/components/label';
import { Textarea } from '@/shared/components/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import { Separator } from '@/shared/components/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/components/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/alert-dialog';
import { Skeleton } from '@/shared/components/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { useAdminActions } from '@/hooks/useAdminActions';
import { getSetores } from '@/lib/setores-segmentos';
import type { EtapaPipeline, Segmento, Office, UserType, LeadTag, TipoCapital, StatusExclusividade } from '@/types/supabase';

const offices: Office[] = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const leadTags: LeadTag[] = ['frio', 'morno', 'quente', 'convertido'];
const tiposCapital: TipoCapital[] = ['Captação', 'Investimento', 'Híbrido'];
const statusExclusividades: StatusExclusividade[] = ['Ativo', 'Vencido', 'Sem exclusividade'];

const leadTagColors: Record<LeadTag, string> = {
  'frio': 'bg-blue-500/10 text-blue-500',
  'morno': 'bg-yellow-500/10 text-yellow-500',
  'quente': 'bg-orange-500/10 text-orange-500',
  'convertido': 'bg-green-500/10 text-green-500',
};
const etapaColors: Record<EtapaPipeline, string> = {
  'Prospecto': 'bg-gray-500',
  'Comitê': 'bg-blue-500',
  'Comercial': 'bg-purple-500',
  'Cliente Ativo': 'bg-indigo-500',
  'Matchmaking': 'bg-cyan-500',
  'Estruturação': 'bg-orange-500',
  'Apresentação': 'bg-teal-500',
  'Negociação': 'bg-yellow-500',
  'Concluído': 'bg-green-500',
};

const etapas: EtapaPipeline[] = ['Prospecto', 'Comitê', 'Comercial', 'Cliente Ativo', 'Estruturação', 'Matchmaking', 'Apresentação', 'Negociação', 'Concluído'];
// Setores loaded dynamically via getSetores()

interface Operacao {
  id: string;
  numero_funil: string;
  etapa_atual: EtapaPipeline;
  sub_etapa?: string | null;
  valor_investimento: number;
  segmento: Segmento;
  office: Office;
  lead_tag: LeadTag;
  tipo_capital: TipoCapital;
  status_exclusividade: StatusExclusividade;
  observacoes: string | null;
  created_at: string;
  ultima_movimentacao: string;
  responsavel_id: string;
  ativo?: boolean;
  empresa: {
    id: string;
    nome: string;
  };
  responsavel: {
    id: string;
    nome: string;
    tipo: UserType;
  };
}

export default function AdminOperacoes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [etapaFilter, setEtapaFilter] = useState<string>('all');
  const [segmentoFilter, setSegmentoFilter] = useState<string>('all');
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOperacao, setSelectedOperacao] = useState<Operacao | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit form state - admin can edit EVERYTHING
  const [editForm, setEditForm] = useState({
    etapa_atual: 'Prospecto' as EtapaPipeline,
    valor_investimento: 0,
    segmento: 'Imobiliário' as Segmento,
    observacoes: '',
    office: 'Sudeste' as Office,
    tipo_capital: 'Investimento' as TipoCapital,
    ativo: true,
  });

  const queryClient = useQueryClient();
  const { updateOperation, deleteOperation } = useAdminActions();

  const { data: operacoes, isLoading } = useQuery({
    queryKey: ['admin-operacoes', search, etapaFilter, segmentoFilter],
    queryFn: async () => {
      let query = supabase
        .from('operacoes')
        .select(`
          *,
          empresa:empresas!operacoes_empresa_id_fkey(id, nome),
          responsavel:profiles!operacoes_responsavel_id_fkey(id, nome, tipo)
        `)
        .order('created_at', { ascending: false });

      if (etapaFilter && etapaFilter !== 'all') {
        query = query.eq('etapa_atual', etapaFilter);
      }
      if (segmentoFilter && segmentoFilter !== 'all') {
        query = query.eq('segmento', segmentoFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data as Operacao[];

      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(op =>
          op.empresa?.nome?.toLowerCase().includes(searchLower) ||
          op.numero_funil?.toLowerCase().includes(searchLower) ||
          op.responsavel?.nome?.toLowerCase().includes(searchLower)
        );
      }

      return filtered;
    },
  });

  // Pagination logic
  const paginatedOperacoes = useMemo(() => {
    if (!operacoes) return [];
    const start = (currentPage - 1) * pageSize;
    return operacoes.slice(start, start + pageSize);
  }, [operacoes, currentPage, pageSize]);

  const totalPages = Math.ceil((operacoes?.length || 0) / pageSize);

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const openEditDialog = (op: Operacao) => {
    setSelectedOperacao(op);
    setEditForm({
      etapa_atual: op.etapa_atual,
      valor_investimento: op.valor_investimento || 0,
      segmento: op.segmento,
      observacoes: op.observacoes || '',
      office: op.office || 'Sudeste',
      tipo_capital: op.tipo_capital || 'Investimento',
      ativo: op.ativo !== false,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedOperacao) return;
    
    const { office, tipo_capital, ativo, ...baseData } = editForm;
    
    // Update via direct supabase call for full admin power
    const { error } = await supabase
      .from('operacoes')
      .update({
        ...baseData,
        office,
        tipo_capital,
        ativo,
        ultima_movimentacao: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedOperacao.id);
    
    if (error) {
      toast.error('Erro ao atualizar operação');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['admin-operacoes'] });
    queryClient.invalidateQueries({ queryKey: ['operacoes'] });
    toast.success('Operação atualizada com sucesso!');
    setEditDialogOpen(false);
    setSelectedOperacao(null);
  };

  const handleDelete = async () => {
    if (!selectedOperacao) return;
    await deleteOperation.mutateAsync(selectedOperacao.id);
    setDeleteDialogOpen(false);
    setSelectedOperacao(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const stats = {
    total: operacoes?.length || 0,
    emNegociacao: operacoes?.filter(o => o.etapa_atual === 'Negociação').length || 0,
    concluidas: operacoes?.filter(o => o.etapa_atual === 'Concluído').length || 0,
    valorTotal: operacoes?.reduce((acc, o) => acc + (o.valor_investimento || 0), 0) || 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[{ label: 'Operações' }]} />

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Operações</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie todas as operações da plataforma
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1.5 border-muted-foreground/20">
          {stats.total} operações
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: TrendingUp, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Em Negociação', value: stats.emNegociacao, icon: ArrowRight, gradient: 'from-amber-500 to-yellow-500' },
          { label: 'Concluídas', value: stats.concluidas, icon: TrendingUp, gradient: 'from-emerald-500 to-green-500' },
          { label: 'Valor Total', value: formatCurrency(stats.valorTotal), icon: DollarSign, gradient: 'from-violet-500 to-purple-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-0 overflow-hidden relative group">
              <div className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', stat.gradient)} />
              <CardContent className="p-5 pl-5 flex items-center gap-4">
                <div className={cn('p-2.5 rounded-xl bg-gradient-to-br opacity-15', stat.gradient, 'absolute right-4 top-4 h-10 w-10')} />
                <div className={cn('p-2.5 rounded-lg bg-gradient-to-br', stat.gradient, 'shadow-lg')}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
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
                placeholder="Buscar por empresa, código ou responsável..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 bg-muted/30 border-muted-foreground/10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-muted/30 border-muted-foreground/10">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {(etapaFilter !== 'all' || segmentoFilter !== 'all') && (
                    <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                      {(etapaFilter !== 'all' ? 1 : 0) + (segmentoFilter !== 'all' ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Etapa</Label>
                  <Select value={etapaFilter} onValueChange={handleFilterChange(setEtapaFilter)}>
                    <SelectTrigger className="bg-muted/30 border-muted-foreground/10">
                      <SelectValue placeholder="Etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Etapas</SelectItem>
                      {etapas.map(etapa => (
                        <SelectItem key={etapa} value={etapa}>
                          <div className="flex items-center gap-2">
                            <div className={cn('h-2 w-2 rounded-full', etapaColors[etapa])} />
                            {etapa}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Setor</Label>
                  <Select value={segmentoFilter} onValueChange={handleFilterChange(setSegmentoFilter)}>
                    <SelectTrigger className="bg-muted/30 border-muted-foreground/10">
                      <SelectValue placeholder="Setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Setores</SelectItem>
                      {getSetores().map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(etapaFilter !== 'all' || segmentoFilter !== 'all') && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => { setEtapaFilter('all'); setSegmentoFilter('all'); setCurrentPage(1); }}
                    >
                      Limpar filtros
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-muted-foreground/10 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Operação</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Empresa</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Etapa</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Valor</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Responsável</TableHead>
                
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Última Mov.</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full rounded-md" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedOperacoes.length > 0 ? (
                paginatedOperacoes.map((op, index) => (
                  <motion.tr
                    key={op.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-muted-foreground/5 transition-colors hover:bg-muted/30 group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-muted/50">
                          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-mono text-sm font-medium">{op.numero_funil}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-muted/50">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-sm">{op.empresa?.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-white text-[11px] font-medium px-2.5 py-0.5 shadow-sm', etapaColors[op.etapa_atual])}>
                          {op.etapa_atual}
                        </Badge>
                        {op.etapa_atual === 'Cliente Ativo' && (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-medium">
                                <Zap className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="text-xs">Pode gerar oportunidade</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm">{formatCurrency(op.valor_investimento)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted/80 flex items-center justify-center">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-sm">{op.responsavel?.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(op.ultima_movimentacao), "dd/MM/yy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link to={`/operacoes/${op.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(op)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {op.etapa_atual === 'Cliente Ativo' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  navigate('/admin/oportunidades', {
                                    state: {
                                      fromOperation: {
                                        id: op.id,
                                        nome: op.empresa?.nome || '',
                                        segmento: op.segmento || 'Imobiliário',
                                        valor: op.valor_investimento || 0,
                                        observacoes: op.observacoes || '',
                                        numero_funil: op.numero_funil,
                                        office: op.office,
                                        tipo_capital: op.tipo_capital,
                                      },
                                    },
                                  });
                                }}
                              >
                                <Zap className="h-4 w-4 mr-2 text-amber-500" />
                                Gerar Oportunidade
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedOperacao(op);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium">Nenhuma operação encontrada</p>
                      <p className="text-sm text-muted-foreground/60">Tente ajustar os filtros de busca</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {(operacoes?.length || 0) > 0 && (
            <div className="border-t border-muted-foreground/5">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={operacoes?.length || 0}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog - Full Admin Power */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Editar Operação</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedOperacao?.numero_funil} — {selectedOperacao?.empresa?.nome}
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="geral" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="geral" className="text-xs gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Geral
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs gap-1.5">
                <DollarSign className="h-3.5 w-3.5" /> Financeiro
              </TabsTrigger>
              <TabsTrigger value="config" className="text-xs gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Config
              </TabsTrigger>
            </TabsList>

            {/* Tab Geral (Pipeline + Detalhes unificados) */}
            <TabsContent value="geral" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <ArrowRight className="h-3.5 w-3.5" /> Etapa Atual
                  </Label>
                  <Select value={editForm.etapa_atual} onValueChange={(v) => setEditForm({ ...editForm, etapa_atual: v as EtapaPipeline })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {etapas.map(etapa => (
                        <SelectItem key={etapa} value={etapa}>
                          <div className="flex items-center gap-2">
                            <div className={cn('h-2.5 w-2.5 rounded-full', etapaColors[etapa])} />
                            {etapa}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" /> Setor
                  </Label>
                  <Select value={editForm.segmento} onValueChange={(v) => setEditForm({ ...editForm, segmento: v as Segmento })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getSetores().map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> Office / Região
                  </Label>
                  <Select value={editForm.office} onValueChange={(v) => setEditForm({ ...editForm, office: v as Office })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {offices.map(o => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tipo de Capital
                  </Label>
                  <Select value={editForm.tipo_capital} onValueChange={(v) => setEditForm({ ...editForm, tipo_capital: v as TipoCapital })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposCapital.map(tc => (
                        <SelectItem key={tc} value={tc}>{tc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Observações
                </Label>
                <Textarea
                  rows={3}
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                  placeholder="Notas internas da operação..."
                />
              </div>

              {/* Info panel */}
              {selectedOperacao && (
                <Card className="border-0 bg-muted/30">
                  <CardContent className="p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Informações</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nº Funil:</span>
                        <p className="font-medium font-mono">{selectedOperacao.numero_funil}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Responsável:</span>
                        <p className="font-medium">{selectedOperacao.responsavel?.nome}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Empresa:</span>
                        <p className="font-medium">{selectedOperacao.empresa?.nome}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criado em:</span>
                        <p className="font-medium">{format(new Date(selectedOperacao.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Financeiro */}
            <TabsContent value="financeiro" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" /> Valor do Investimento (R$)
                </Label>
                <Input
                  type="number"
                  value={editForm.valor_investimento}
                  onChange={(e) => setEditForm({ ...editForm, valor_investimento: Number(e.target.value) })}
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Formatado: {formatCurrency(editForm.valor_investimento)}
                </p>
              </div>

              <Separator />

              <Card className="border-0 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Resumo Financeiro</p>
                  <div className="text-3xl font-bold">{formatCurrency(editForm.valor_investimento)}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tipo: {editForm.tipo_capital} · Setor: {getSetores().find(s => s.value === editForm.segmento)?.label || editForm.segmento}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Config */}
            <TabsContent value="config" className="space-y-4 mt-4">
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Operação Ativa</Label>
                  <p className="text-xs text-muted-foreground">
                    Operações inativas não aparecem na listagem principal do parceiro
                  </p>
                </div>
                <Switch
                  checked={editForm.ativo}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, ativo: checked })}
                />
              </div>

              <Card className="border border-dashed border-muted-foreground/20 bg-muted/10">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">⚠️ Atenção</p>
                  <p>Alterações feitas aqui afetam diretamente a operação na plataforma. Todas as mudanças são registradas no log de auditoria.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gap-2 min-w-[120px]">
              {updateOperation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Operação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a operação {selectedOperacao?.numero_funil}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
