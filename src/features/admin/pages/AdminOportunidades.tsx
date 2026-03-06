import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Zap, Plus, Search, MoreVertical, Edit, Trash2,
  Eye, DollarSign, TrendingUp, Users, Image as ImageIcon,
  Building2, FileText, MapPin, Clock, Percent, Shield,
  Star, StarOff, Upload, Link as LinkIcon, GitBranch
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SETORES, SEGMENTOS_POR_SETOR } from '@/features/operations/components/NewDealWizard/types';
import { supabase } from '@/lib/supabase';
import { mockOperacoes } from '@/lib/mock-data';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Textarea } from '@/shared/components/textarea';
import { Badge } from '@/shared/components/badge';
import { Label } from '@/shared/components/label';
import { Switch } from '@/shared/components/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/dialog';
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
import { Progress } from '@/shared/components/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';

interface MilestoneItem {
  label: string;
  completed: boolean;
  current: boolean;
}

interface OportunidadeEmpresa {
  nome: string;
  descricao: string;
  experiencia: string;
  projetos: number;
  unidades_entregues: number;
}

interface FinanceiroData {
  faturamento_2023: number;
  faturamento_2024: number;
  faturamento_2025: number;
  faturamento_2026: number;
  ebitda_2023: number;
  ebitda_2024: number;
  ebitda_2025: number;
  ebitda_2026: number;
}

interface Oportunidade {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  setor?: string;
  segmento: string;
  instrumento: string;
  rentabilidade: number;
  investimento_minimo: number;
  prazo: number;
  pagamento: string;
  status: string;
  captado: number;
  alvo_minimo: number;
  alvo_maximo: number;
  investidores: number;
  data_inicio: string;
  data_fim: string;
  garantia: string;
  devedora: string;
  amortizacao: string;
  empresa: OportunidadeEmpresa;
  risco: string;
  financeiro: FinanceiroData;
  documentos: string[];
  image_url: string;
  destaque: boolean;
  operacao_origem_id?: string | null;
  milestones?: MilestoneItem[];
  retorno_pessimista?: number;
  retorno_base?: number;
  retorno_otimista?: number;
  created_at: string;
}

const defaultEmpresa: OportunidadeEmpresa = {
  nome: '', descricao: '', experiencia: '', projetos: 0, unidades_entregues: 0,
};

const defaultFinanceiro: FinanceiroData = {
  faturamento_2023: 0, faturamento_2024: 0, faturamento_2025: 0, faturamento_2026: 0,
  ebitda_2023: 0, ebitda_2024: 0, ebitda_2025: 0, ebitda_2026: 0,
};

const defaultForm = {
  nome: '',
  descricao: '',
  tipo: 'Dívida',
  setor: 'imobiliario',
  segmento: '',
  instrumento: 'CRI',
  rentabilidade: 0,
  investimento_minimo: 0,
  prazo: 12,
  pagamento: 'Mensal',
  status: 'aberta',
  captado: 0,
  alvo_minimo: 0,
  alvo_maximo: 0,
  investidores: 0,
  data_inicio: '',
  data_fim: '',
  garantia: '',
  devedora: '',
  amortizacao: '',
  risco: 'Baixo',
  image_url: '',
  destaque: false,
  operacao_origem_id: null as string | null,
  empresa: { ...defaultEmpresa },
  financeiro: { ...defaultFinanceiro },
  milestones: [] as MilestoneItem[],
  retorno_pessimista: 0,
  retorno_base: 0,
  retorno_otimista: 0,
};

export default function AdminOportunidades() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOportunidade, setSelectedOportunidade] = useState<Oportunidade | null>(null);
  const [formData, setFormData] = useState({ ...defaultForm });
  const [editTab, setEditTab] = useState('geral');
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Pre-fill from operation (Cliente Ativo → Gerar Oportunidade)
  useEffect(() => {
    const state = location.state as { fromOperation?: {
      id: string;
      nome: string;
      segmento: string;
      valor: number;
      observacoes: string;
      numero_funil: string;
      office: string;
      tipo_capital: string;
    } } | null;
    
    if (state?.fromOperation) {
      const op = state.fromOperation;
      resetForm();
      setFormData(prev => ({
        ...prev,
        nome: op.nome ? `Oportunidade - ${op.nome}` : '',
        segmento: op.segmento || 'Imobiliário',
        alvo_minimo: op.valor || 0,
        alvo_maximo: op.valor || 0,
        descricao: op.observacoes || '',
        operacao_origem_id: op.id || null,
        empresa: {
          ...defaultEmpresa,
          nome: op.nome || '',
        },
      }));
      setDialogOpen(true);
      // Clear location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const queryClient = useQueryClient();

  const { data: oportunidades, isLoading } = useQuery({
    queryKey: ['oportunidades-investimento', search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oportunidades_investimento')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      let filtered = data as Oportunidade[];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(o =>
          o.nome?.toLowerCase().includes(s) || o.segmento?.toLowerCase().includes(s)
        );
      }
      return filtered;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: any }) => {
      const payload = {
        ...data,
        empresa: data.empresa,
        financeiro: data.financeiro,
        updated_at: new Date().toISOString(),
      };
      if (id) {
        const { error } = await supabase.from('oportunidades_investimento').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('oportunidades_investimento').insert(payload);
        if (error) throw error;

        // Auto-move the source operation to Matchmaking when opportunity is generated
        if (data.operacao_origem_id) {
          await supabase
            .from('operacoes')
            .update({
              etapa_atual: 'Matchmaking',
              ultima_movimentacao: new Date().toISOString(),
              dias_na_etapa: 0,
            })
            .eq('id', data.operacao_origem_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oportunidades-investimento'] });
      queryClient.invalidateQueries({ queryKey: ['oportunidades-stats'] });
      queryClient.invalidateQueries({ queryKey: ['operacoes'] });
      queryClient.invalidateQueries({ queryKey: ['operacoes-stats'] });
      setDialogOpen(false);
      resetForm();
      toast.success(selectedOportunidade ? 'Oportunidade atualizada!' : 'Oportunidade criada!');
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('oportunidades_investimento').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oportunidades-investimento'] });
      queryClient.invalidateQueries({ queryKey: ['oportunidades-stats'] });
      setDeleteDialogOpen(false);
      setSelectedOportunidade(null);
      toast.success('Oportunidade excluída!');
    },
    onError: () => toast.error('Erro ao excluir'),
  });

  const resetForm = () => { setFormData({ ...defaultForm }); setSelectedOportunidade(null); setEditTab('geral'); };

  const openEditDialog = (op: Oportunidade) => {
    setSelectedOportunidade(op);
    setFormData({
      nome: op.nome || '',
      descricao: op.descricao || '',
      tipo: op.tipo || 'Dívida',
      setor: (op as any).setor || 'imobiliario',
      segmento: op.segmento || '',
      instrumento: op.instrumento || 'CRI',
      rentabilidade: op.rentabilidade || 0,
      investimento_minimo: op.investimento_minimo || 0,
      prazo: op.prazo || 12,
      pagamento: op.pagamento || 'Mensal',
      status: op.status || 'aberta',
      captado: op.captado || 0,
      alvo_minimo: op.alvo_minimo || 0,
      alvo_maximo: op.alvo_maximo || 0,
      investidores: op.investidores || 0,
      data_inicio: op.data_inicio || '',
      data_fim: op.data_fim || '',
      garantia: op.garantia || '',
      devedora: op.devedora || '',
      amortizacao: op.amortizacao || '',
      risco: op.risco || 'Baixo',
      image_url: op.image_url || '',
      destaque: op.destaque || false,
      operacao_origem_id: op.operacao_origem_id || null,
      empresa: op.empresa ? { ...defaultEmpresa, ...op.empresa } : { ...defaultEmpresa },
      financeiro: op.financeiro ? { ...defaultFinanceiro, ...op.financeiro } : { ...defaultFinanceiro },
      milestones: op.milestones || [],
      retorno_pessimista: op.retorno_pessimista || 0,
      retorno_base: op.retorno_base || 0,
      retorno_otimista: op.retorno_otimista || 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    saveMutation.mutate({ id: selectedOportunidade?.id, data: formData });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value || 0);

  const statusColors: Record<string, string> = {
    aberta: 'bg-emerald-500',
    fechada: 'bg-gray-500',
    encerrada: 'bg-gray-500',
    em_captacao: 'bg-blue-500',
    captada: 'bg-violet-500',
  };

  const statusLabel: Record<string, string> = {
    aberta: 'Aberta',
    fechada: 'Fechada',
    encerrada: 'Encerrada',
    em_captacao: 'Em Captação',
    captada: 'Captada',
  };

  const stats = {
    total: oportunidades?.length || 0,
    abertas: oportunidades?.filter(o => o.status === 'aberta').length || 0,
    investidores: oportunidades?.reduce((a, o) => a + (o.investidores || 0), 0) || 0,
    volume: oportunidades?.reduce((a, o) => a + (o.alvo_maximo || 0), 0) || 0,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Oportunidades' }]} />

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Oportunidades de Investimento</h1>
          <p className="text-muted-foreground mt-1">Gerencie as oportunidades da plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs px-3 py-1.5 border-muted-foreground/20">
            {stats.total} oportunidades
          </Badge>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: Zap, gradient: 'from-amber-500 to-yellow-500' },
          { label: 'Abertas', value: stats.abertas, icon: Eye, gradient: 'from-emerald-500 to-green-500' },
          { label: 'Investidores', value: stats.investidores, icon: Users, gradient: 'from-violet-500 to-purple-500' },
          { label: 'Volume Total', value: formatCurrency(stats.volume), icon: DollarSign, gradient: 'from-blue-500 to-cyan-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 overflow-hidden relative">
              <div className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', stat.gradient)} />
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn('p-2.5 rounded-lg bg-gradient-to-br shadow-lg', stat.gradient)}>
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

      {/* Search */}
      <Card className="border-0">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Buscar por título ou setor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/30 border-muted-foreground/10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-muted-foreground/5 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Oportunidade</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Setor</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Captação</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Rent.</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Prazo</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : oportunidades && oportunidades.length > 0 ? (
                oportunidades.map((op, index) => {
                  const captPercent = op.alvo_maximo > 0 ? (op.captado / op.alvo_maximo) * 100 : 0;
                  return (
                    <motion.tr
                      key={op.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="group border-b border-muted-foreground/5 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {op.image_url ? (
                            <img src={op.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                              <Zap className="h-4 w-4 text-amber-500" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{op.nome}</p>
                              {op.destaque && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {op.tipo} • {op.instrumento || '—'}
                              {op.operacao_origem_id && (
                                <span className="ml-1.5 inline-flex items-center gap-0.5 text-primary">
                                  <LinkIcon className="h-2.5 w-2.5" />
                                  Vinculada
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-muted-foreground/20">
                          {SETORES.find(s => s.value === (op as any).setor)?.label || op.segmento}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>{formatCurrency(op.captado || 0)}</span>
                            <span>{captPercent.toFixed(0)}%</span>
                          </div>
                          <Progress value={captPercent} className="h-1.5" />
                          <p className="text-[10px] text-muted-foreground/50">Meta: {formatCurrency(op.alvo_maximo || 0)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {op.rentabilidade > 0 ? `${op.rentabilidade}%` : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{op.prazo > 0 ? `${op.prazo}m` : '—'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-white text-[10px] px-2 py-0', statusColors[op.status] || 'bg-gray-500')}>
                          {statusLabel[op.status] || op.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/oportunidades/${op.id}`}><Eye className="h-4 w-4 mr-2" />Visualizar</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(op)}>
                                <Edit className="h-4 w-4 mr-2" />Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedOportunidade(op); setDeleteDialogOpen(true); }}>
                                <Trash2 className="h-4 w-4 mr-2" />Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Zap className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm font-medium">Nenhuma oportunidade encontrada</p>
                      <p className="text-xs text-muted-foreground/60">Tente ajustar a busca</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog — Full fields with tabs */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOportunidade ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {selectedOportunidade ? 'Editar Oportunidade' : 'Nova Oportunidade'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={editTab} onValueChange={setEditTab}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="geral" className="text-xs gap-1"><FileText className="h-3.5 w-3.5" />Geral</TabsTrigger>
              <TabsTrigger value="operacao" className="text-xs gap-1"><TrendingUp className="h-3.5 w-3.5" />Operação</TabsTrigger>
              <TabsTrigger value="origem" className="text-xs gap-1"><GitBranch className="h-3.5 w-3.5" />Origem</TabsTrigger>
              <TabsTrigger value="projeto" className="text-xs gap-1"><MapPin className="h-3.5 w-3.5" />Projeto</TabsTrigger>
              <TabsTrigger value="empresa" className="text-xs gap-1"><Building2 className="h-3.5 w-3.5" />Empresa</TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs gap-1"><DollarSign className="h-3.5 w-3.5" />Financeiro</TabsTrigger>
            </TabsList>

            {/* Geral */}
            <TabsContent value="geral" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome / Título *</Label>
                <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea rows={3} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" />Imagem do Card</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={imageMode === 'url' ? 'default' : 'outline'}
                    onClick={() => setImageMode('url')}
                    className="gap-1.5"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />URL
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={imageMode === 'upload' ? 'default' : 'outline'}
                    onClick={() => setImageMode('upload')}
                    className="gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />Upload
                  </Button>
                </div>
                {imageMode === 'url' ? (
                  <Input placeholder="https://..." value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Imagem muito grande. Máximo 5MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, image_url: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-20 border-dashed border-2 gap-2 text-muted-foreground hover:text-foreground"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5" />
                      Clique para selecionar uma imagem
                    </Button>
                    <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP. Máximo 5MB.</p>
                  </div>
                )}
                {formData.image_url && (
                  <div className="relative">
                    <img src={formData.image_url} alt="Preview" className="h-24 w-full object-cover rounded-lg border border-border/30" />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Select value={formData.setor} onValueChange={(v) => setFormData({ ...formData, setor: v, segmento: '' })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {SETORES.filter(s => s.value !== 'outros').map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Segmento</Label>
                  <Select value={formData.segmento} onValueChange={(v) => setFormData({ ...formData, segmento: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(SEGMENTOS_POR_SETOR[formData.setor] || []).map(s => (
                        <SelectItem key={s.value} value={s.label}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Risco</Label>
                  <Select value={formData.risco} onValueChange={(v) => setFormData({ ...formData, risco: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixo">Baixo</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberta">Aberta</SelectItem>
                      <SelectItem value="em_captacao">Em Captação</SelectItem>
                      <SelectItem value="captada">Captada</SelectItem>
                      <SelectItem value="encerrada">Encerrada</SelectItem>
                      <SelectItem value="fechada">Fechada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.destaque} onCheckedChange={(c) => setFormData({ ...formData, destaque: c })} />
                    <Label className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-400" />Destaque</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Operação */}
            <TabsContent value="operacao" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Operação</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Dívida', 'Equity', 'Crédito', 'Híbrido'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Instrumento</Label>
                  <Select value={formData.instrumento} onValueChange={(v) => setFormData({ ...formData, instrumento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['CRI', 'CRA', 'Debênture', 'CCB', 'Nota Comercial', 'FIDC', 'Outros'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rentabilidade (%)</Label>
                  <Input type="number" step="0.01" value={formData.rentabilidade} onChange={(e) => setFormData({ ...formData, rentabilidade: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Prazo (meses)</Label>
                  <Input type="number" value={formData.prazo} onChange={(e) => setFormData({ ...formData, prazo: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Pagamento</Label>
                  <Select value={formData.pagamento} onValueChange={(v) => setFormData({ ...formData, pagamento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Mensal', 'Trimestral', 'Semestral', 'Anual', 'No vencimento'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Investimento Mínimo (R$)</Label>
                  <Input type="number" value={formData.investimento_minimo} onChange={(e) => setFormData({ ...formData, investimento_minimo: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Captado (R$)</Label>
                  <Input type="number" value={formData.captado} onChange={(e) => setFormData({ ...formData, captado: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alvo Mínimo (R$)</Label>
                  <Input type="number" value={formData.alvo_minimo} onChange={(e) => setFormData({ ...formData, alvo_minimo: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Alvo Máximo (R$)</Label>
                  <Input type="number" value={formData.alvo_maximo} onChange={(e) => setFormData({ ...formData, alvo_maximo: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input type="date" value={formData.data_inicio} onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input type="date" value={formData.data_fim} onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Devedora</Label>
                <Input value={formData.devedora} onChange={(e) => setFormData({ ...formData, devedora: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Garantia</Label>
                <Textarea rows={2} value={formData.garantia} onChange={(e) => setFormData({ ...formData, garantia: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Amortização</Label>
                <Input value={formData.amortizacao} onChange={(e) => setFormData({ ...formData, amortizacao: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Investidores</Label>
                <Input type="number" value={formData.investidores} onChange={(e) => setFormData({ ...formData, investidores: Number(e.target.value) })} />
              </div>
            </TabsContent>

            {/* Origem — read-only */}
            <TabsContent value="origem" className="space-y-4 mt-4">
              {(() => {
                const origemOp = selectedOportunidade?.operacao_origem_id
                  ? mockOperacoes.find(op => op.id === selectedOportunidade.operacao_origem_id)
                  : null;
                if (!origemOp) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                      <GitBranch className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Nenhuma operação vinculada a esta oportunidade.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border/40 bg-muted/30 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <GitBranch className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Operação de Origem</span>
                        <Badge variant="outline" className="ml-auto text-xs">{origemOp.etapa_atual}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Nº Funil</p>
                          <p className="font-medium">{origemOp.numero_funil}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Empresa</p>
                          <p className="font-medium">{origemOp.empresa?.nome || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Segmento</p>
                          <p className="font-medium">{origemOp.segmento}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Tipo de Capital</p>
                          <p className="font-medium">{origemOp.tipo_capital}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Valor do Investimento</p>
                          <p className="font-medium">R$ {(origemOp.valor_investimento || 0).toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Office</p>
                          <p className="font-medium">{origemOp.office}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Responsável</p>
                          <p className="font-medium">{origemOp.responsavel?.nome || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Lead Tag</p>
                          <p className="font-medium capitalize">{origemOp.lead_tag}</p>
                        </div>
                      </div>
                      {origemOp.observacoes && (
                        <div className="pt-2 border-t border-border/30">
                          <p className="text-muted-foreground text-xs">Observações</p>
                          <p className="text-sm">{origemOp.observacoes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Esta informação é somente leitura e não pode ser editada.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setDialogOpen(false);
                          navigate(`/operacoes/${origemOp.id}`);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver Operação
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="empresa" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input value={formData.empresa.nome} onChange={(e) => setFormData({ ...formData, empresa: { ...formData.empresa, nome: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição da Empresa</Label>
                <Textarea rows={3} value={formData.empresa.descricao} onChange={(e) => setFormData({ ...formData, empresa: { ...formData.empresa, descricao: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Experiência</Label>
                <Input placeholder="Ex: 20 anos no mercado imobiliário" value={formData.empresa.experiencia} onChange={(e) => setFormData({ ...formData, empresa: { ...formData.empresa, experiencia: e.target.value } })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Projetos Realizados</Label>
                  <Input type="number" value={formData.empresa.projetos} onChange={(e) => setFormData({ ...formData, empresa: { ...formData.empresa, projetos: Number(e.target.value) } })} />
                </div>
                <div className="space-y-2">
                  <Label>Unidades Entregues</Label>
                  <Input type="number" value={formData.empresa.unidades_entregues} onChange={(e) => setFormData({ ...formData, empresa: { ...formData.empresa, unidades_entregues: Number(e.target.value) } })} />
                </div>
              </div>
            </TabsContent>

            {/* Financeiro */}
            <TabsContent value="financeiro" className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Faturamento (R$)</Label>
                <div className="grid grid-cols-4 gap-3">
                  {(['2023', '2024', '2025', '2026'] as const).map(year => (
                    <div key={year} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{year}</Label>
                      <Input
                        type="number"
                        value={formData.financeiro[`faturamento_${year}` as keyof FinanceiroData]}
                        onChange={(e) => setFormData({
                          ...formData,
                          financeiro: { ...formData.financeiro, [`faturamento_${year}`]: Number(e.target.value) }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-3 block">EBITDA (R$)</Label>
                <div className="grid grid-cols-4 gap-3">
                  {(['2023', '2024', '2025', '2026'] as const).map(year => (
                    <div key={year} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{year}</Label>
                      <Input
                        type="number"
                        value={formData.financeiro[`ebitda_${year}` as keyof FinanceiroData]}
                        onChange={(e) => setFormData({
                          ...formData,
                          financeiro: { ...formData.financeiro, [`ebitda_${year}`]: Number(e.target.value) }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Projeto - Milestones & Retorno */}
            <TabsContent value="projeto" className="space-y-5 mt-4">
              {/* Cenários de Retorno */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Cenários de Retorno (% a.a.)
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Pessimista</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 8.0"
                      value={formData.retorno_pessimista || ''}
                      onChange={(e) => setFormData({ ...formData, retorno_pessimista: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Base</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 15.0"
                      value={formData.retorno_base || ''}
                      onChange={(e) => setFormData({ ...formData, retorno_base: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Otimista</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 22.0"
                      value={formData.retorno_otimista || ''}
                      onChange={(e) => setFormData({ ...formData, retorno_otimista: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Se não preenchido, será calculado automaticamente a partir da rentabilidade.</p>
              </div>

              {/* Milestones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Etapas / Marcos do Projeto
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => setFormData({
                      ...formData,
                      milestones: [...formData.milestones, { label: '', completed: false, current: false }],
                    })}
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar
                  </Button>
                </div>

                {/* Templates por setor */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Carregar template por setor</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Imobiliário', milestones: ['Aquisição do terreno', 'Aprovação do projeto', 'Fase de construção', 'Comercialização', 'Entrega das unidades'] },
                      { label: 'Agro', milestones: ['Planejamento da safra', 'Plantio', 'Manejo e cultivo', 'Colheita', 'Comercialização'] },
                      { label: 'Tech', milestones: ['Validação de mercado', 'Desenvolvimento do MVP', 'Tração inicial', 'Escala', 'Rodada de follow-on'] },
                      { label: 'Infra', milestones: ['Estudos de viabilidade', 'Licenciamento ambiental', 'Execução da obra', 'Testes e comissionamento', 'Operação comercial'] },
                      { label: 'Negócios', milestones: ['Due diligence', 'Estruturação', 'Captação', 'Implantação', 'Retorno ao investidor'] },
                    ].map((template) => (
                      <Button
                        key={template.label}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2.5"
                        onClick={() => setFormData({
                          ...formData,
                          milestones: template.milestones.map((label, i) => ({
                            label,
                            completed: false,
                            current: i === 0,
                          })),
                        })}
                      >
                        {template.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {formData.milestones.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                    Nenhuma etapa definida. Selecione um template ou adicione manualmente.
                  </p>
                )}

                <div className="space-y-2">
                  {formData.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20">
                      <span className="text-xs text-muted-foreground w-5 text-center">{index + 1}</span>
                      <Input
                        value={milestone.label}
                        onChange={(e) => {
                          const updated = [...formData.milestones];
                          updated[index] = { ...updated[index], label: e.target.value };
                          setFormData({ ...formData, milestones: updated });
                        }}
                        placeholder="Nome da etapa"
                        className="flex-1 h-8 text-sm"
                      />
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant={milestone.completed ? 'default' : 'outline'}
                          className="h-7 text-[10px] px-2"
                          onClick={() => {
                            const updated = [...formData.milestones];
                            updated[index] = { ...updated[index], completed: !updated[index].completed, current: false };
                            setFormData({ ...formData, milestones: updated });
                          }}
                        >
                          ✓
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={milestone.current ? 'default' : 'outline'}
                          className="h-7 text-[10px] px-2"
                          onClick={() => {
                            const updated = formData.milestones.map((m, i) => ({
                              ...m,
                              current: i === index ? !m.current : false,
                            }));
                            setFormData({ ...formData, milestones: updated });
                          }}
                        >
                          Atual
                        </Button>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          const updated = formData.milestones.filter((_, i) => i !== index);
                          setFormData({ ...formData, milestones: updated });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!formData.nome || !formData.descricao || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oportunidade?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedOportunidade && deleteMutation.mutate(selectedOportunidade.id)} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
