import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, Plus, Search, MoreVertical, Edit, Trash2,
  Eye, Flame, DollarSign, MapPin, Image as ImageIcon,
  Upload, Link as LinkIcon, FileText, TrendingUp
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Textarea } from '@/shared/components/textarea';
import { Badge } from '@/shared/components/badge';
import { Label } from '@/shared/components/label';
import { Switch } from '@/shared/components/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/shared/components/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/alert-dialog';
import { Skeleton } from '@/shared/components/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { useAdminLogs } from '@/hooks/useAdminLogs';

interface Tese {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  categoria: string;
  valor_min: number;
  valor_max: number;
  ativo: boolean;
  tese_quente?: boolean;
  localizacao?: string;
  image_url?: string;
  created_at: string;
}

const defaultForm = {
  titulo: '',
  descricao: '',
  tipo: '',
  categoria: '',
  valor_min: 0,
  valor_max: 0,
  ativo: true,
  tese_quente: false,
  localizacao: '',
  image_url: '',
};

export default function AdminTeses() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTese, setSelectedTese] = useState<Tese | null>(null);
  const [formData, setFormData] = useState({ ...defaultForm });
  const [editTab, setEditTab] = useState('geral');
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { logAction } = useAdminLogs();
  const { data: teses, isLoading } = useQuery({
    queryKey: ['admin-teses', search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teses_investimento')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      let filtered = data as Tese[];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(t =>
          t.titulo?.toLowerCase().includes(s) || t.categoria?.toLowerCase().includes(s)
        );
      }
      return filtered;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: typeof formData }) => {
      const payload = { ...data, updated_at: new Date().toISOString() };
      if (id) {
        const { error } = await supabase.from('teses_investimento').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('teses_investimento').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-teses'] });
      queryClient.invalidateQueries({ queryKey: ['teses'] });
      queryClient.invalidateQueries({ queryKey: ['tese'] });
      const isEdit = !!variables.id;
      setDialogOpen(false);
      resetForm();
      toast.success(isEdit ? 'Tese atualizada!' : 'Tese criada!');
      logAction({
        acao: isEdit ? 'editar' : 'criar',
        recurso: 'teses',
        recurso_id: variables.id,
        descricao: `Tese "${variables.data.titulo}" ${isEdit ? 'atualizada' : 'criada'}`,
        dados_novos: variables.data as any,
      });
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teses_investimento').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_result, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-teses'] });
      queryClient.invalidateQueries({ queryKey: ['teses'] });
      queryClient.invalidateQueries({ queryKey: ['tese'] });
      const deletedTese = selectedTese;
      setDeleteDialogOpen(false);
      setSelectedTese(null);
      toast.success('Tese excluída!');
      logAction({
        acao: 'deletar',
        recurso: 'teses',
        recurso_id: deletedId,
        descricao: `Tese "${deletedTese?.titulo || ''}" excluída`,
        dados_anteriores: deletedTese as any,
      });
    },
    onError: () => toast.error('Erro ao excluir'),
  });

  const resetForm = () => { setFormData({ ...defaultForm }); setSelectedTese(null); setEditTab('geral'); };

  const openEditDialog = (tese: Tese) => {
    setSelectedTese(tese);
    setFormData({
      titulo: tese.titulo || '',
      descricao: tese.descricao || '',
      tipo: tese.tipo || '',
      categoria: tese.categoria || '',
      valor_min: tese.valor_min || 0,
      valor_max: tese.valor_max || 0,
      ativo: tese.ativo ?? true,
      tese_quente: tese.tese_quente || false,
      localizacao: tese.localizacao || '',
      image_url: tese.image_url || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    saveMutation.mutate({ id: selectedTese?.id, data: formData });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

  const totalTeses = teses?.length || 0;
  const ativas = teses?.filter(t => t.ativo).length || 0;
  const quentes = teses?.filter(t => t.tese_quente).length || 0;

  const stats = [
    { label: 'Total de Teses', value: totalTeses, icon: Lightbulb, gradient: 'from-accent/20 to-accent/5' },
    { label: 'Ativas', value: ativas, icon: Eye, gradient: 'from-primary/20 to-primary/5' },
    { label: 'Teses Quentes', value: quentes, icon: Flame, gradient: 'from-warning/20 to-warning/5' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Teses' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teses de Investimento</h1>
          <p className="text-muted-foreground">Gerencie as teses de investimento da plataforma</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />Nova Tese
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-border/30 overflow-hidden">
              <CardContent className="p-4">
                <div className={cn('flex items-center gap-4 rounded-xl p-3 bg-gradient-to-r', stat.gradient)}>
                  <div className="p-2.5 rounded-lg bg-background/80">
                    <stat.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <Card className="border-border/30">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/30">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead>Tese</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : teses && teses.length > 0 ? (
                teses.map((tese, idx) => (
                  <motion.tr
                    key={tese.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {tese.image_url ? (
                          <img src={tese.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                            <Lightbulb className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{tese.titulo}</p>
                            {tese.tese_quente && (
                              <Badge className="bg-warning/15 text-warning border-warning/20 text-xs gap-1">
                                <Flame className="h-3 w-3" />Quente
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">{tese.descricao}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border/50">{tese.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(tese.valor_min)} - {formatCurrency(tese.valor_max)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        tese.ativo ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'
                      )}>
                        {tese.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/teses/${tese.id}`}>
                              <Eye className="h-4 w-4 mr-2" />Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(tese)}>
                            <Edit className="h-4 w-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedTese(tese); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Nenhuma tese encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTese ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {selectedTese ? 'Editar Tese' : 'Nova Tese'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={editTab} onValueChange={setEditTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="geral" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" />Geral
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="gap-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5" />Detalhes
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <TabsContent value="geral" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Textarea rows={3} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
                </div>

                {/* Image upload */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" />Imagem do Card</Label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={imageMode === 'url' ? 'default' : 'outline'} onClick={() => setImageMode('url')} className="gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5" />URL
                    </Button>
                    <Button type="button" size="sm" variant={imageMode === 'upload' ? 'default' : 'outline'} onClick={() => setImageMode('upload')} className="gap-1.5">
                      <Upload className="h-3.5 w-3.5" />Upload
                    </Button>
                  </div>
                  {imageMode === 'url' ? (
                    <Input placeholder="https://..." value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
                  ) : (
                    <div className="space-y-2">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB.'); return; }
                        const reader = new FileReader();
                        reader.onloadend = () => setFormData({ ...formData, image_url: reader.result as string });
                        reader.readAsDataURL(file);
                      }} />
                      <Button type="button" variant="outline" className="w-full h-20 border-dashed border-2 gap-2 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-5 w-5" />Clique para selecionar uma imagem
                      </Button>
                      <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP. Máximo 5MB.</p>
                    </div>
                  )}
                  {formData.image_url && (
                    <div className="relative">
                      <img src={formData.image_url} alt="Preview" className="h-24 w-full object-cover rounded-lg border border-border/30" />
                      <Button type="button" size="sm" variant="destructive" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => setFormData({ ...formData, image_url: '' })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {['Private Equity', 'Venture Capital', 'Crédito Estruturado', 'Real Estate', 'Infraestrutura', 'Agro'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {['Imobiliário', 'Infraestrutura', 'Agro', 'Crédito Corporativo', 'Venture Capital', 'Tecnologia', 'Energia'].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="detalhes" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Mínimo (R$)</Label>
                    <Input type="number" value={formData.valor_min} onChange={(e) => setFormData({ ...formData, valor_min: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Máximo (R$)</Label>
                    <Input type="number" value={formData.valor_max} onChange={(e) => setFormData({ ...formData, valor_max: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" />Localização</Label>
                  <Input placeholder="Ex: São Paulo, SP" value={formData.localizacao} onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <Switch checked={formData.ativo} onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })} />
                    <Label>Tese Ativa</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={formData.tese_quente} onCheckedChange={(checked) => setFormData({ ...formData, tese_quente: checked })} />
                    <Label className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-warning" />Tese Quente
                    </Label>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!formData.titulo || !formData.descricao || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tese?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tese "{selectedTese?.titulo}" será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedTese && deleteMutation.mutate(selectedTese.id)} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
