import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Search, MoreVertical, Eye, Edit, Trash2,
  MapPin, DollarSign, Save, Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Badge } from '@/shared/components/badge';
import { Label } from '@/shared/components/label';
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
import { cn } from '@/lib/utils';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { useAdminActions } from '@/hooks/useAdminActions';
import { FileUploadField } from '@/features/admin/components/FileUploadField';
import { getSetores } from '@/lib/setores-segmentos';
import type { Segmento } from '@/types/supabase';

const setorColors: Record<string, string> = {
  'agronegocio': 'bg-green-500/10 text-green-500',
  'infraestrutura': 'bg-amber-500/10 text-amber-500',
  'imobiliario': 'bg-cyan-500/10 text-cyan-500',
  'tech': 'bg-blue-500/10 text-blue-500',
  'negocios': 'bg-purple-500/10 text-purple-500',
  'outros': 'bg-gray-500/10 text-gray-500',
};

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  nome_fantasia: string | null;
  segmento: Segmento;
  contato_email: string;
  telefone: string | null;
  endereco_cep: string | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  valor_operacao: number;
  tipo_operacao: string | null;
  created_at: string;
  responsavel: {
    id: string;
    nome: string;
  };
}

export default function AdminEmpresas() {
  const [search, setSearch] = useState('');
  const [segmentoFilter, setSegmentoFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    nome: '',
    nome_fantasia: '',
    cnpj: '',
    segmento: 'Imobiliário' as Segmento,
    contato_email: '',
    telefone: '',
    logo_url: '',
    status_exclusividade: 'Sem exclusividade',
    data_exclusividade: '',
    endereco_cep: '',
    endereco_logradouro: '',
    endereco_numero: '',
    endereco_complemento: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_uf: '',
  });

  const { updateCompany, deleteCompany } = useAdminActions();

  const { data: empresas, isLoading } = useQuery({
    queryKey: ['admin-empresas', search, segmentoFilter],
    queryFn: async () => {
      let query = supabase
        .from('empresas')
        .select(`
          *,
          responsavel:profiles!empresas_responsavel_id_fkey(id, nome)
        `)
        .order('created_at', { ascending: false });

      if (segmentoFilter && segmentoFilter !== 'all') {
        query = query.eq('segmento', segmentoFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data as Empresa[];
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(emp =>
          emp.nome?.toLowerCase().includes(searchLower) ||
          emp.cnpj?.includes(search) ||
          emp.contato_email?.toLowerCase().includes(searchLower)
        );
      }

      return filtered;
    },
  });

  // Pagination logic
  const paginatedEmpresas = useMemo(() => {
    if (!empresas) return [];
    const start = (currentPage - 1) * pageSize;
    return empresas.slice(start, start + pageSize);
  }, [empresas, currentPage, pageSize]);

  const totalPages = Math.ceil((empresas?.length || 0) / pageSize);

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const openEditDialog = (emp: Empresa) => {
    setSelectedEmpresa(emp);
    setEditForm({
      nome: emp.nome || '',
      nome_fantasia: emp.nome_fantasia || '',
      cnpj: emp.cnpj || '',
      segmento: emp.segmento,
      contato_email: emp.contato_email || '',
      telefone: emp.telefone || '',
      logo_url: (emp as any).logo_url || '',
      status_exclusividade: (emp as any).status_exclusividade || 'Sem exclusividade',
      data_exclusividade: (emp as any).data_exclusividade || '',
      endereco_cep: emp.endereco_cep || '',
      endereco_logradouro: emp.endereco_logradouro || '',
      endereco_numero: emp.endereco_numero || '',
      endereco_complemento: emp.endereco_complemento || '',
      endereco_bairro: emp.endereco_bairro || '',
      endereco_cidade: emp.endereco_cidade || '',
      endereco_uf: emp.endereco_uf || '',
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedEmpresa) return;
    await updateCompany.mutateAsync({
      empresaId: selectedEmpresa.id,
      data: editForm,
    });
    setEditDialogOpen(false);
    setSelectedEmpresa(null);
  };

  const handleDelete = async () => {
    if (!selectedEmpresa) return;
    await deleteCompany.mutateAsync(selectedEmpresa.id);
    setDeleteDialogOpen(false);
    setSelectedEmpresa(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || cnpj;
  };

  const stats = {
    total: empresas?.length || 0,
    valorTotal: empresas?.reduce((acc, e) => acc + (e.valor_operacao || 0), 0) || 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[{ label: 'Empresas' }]} />

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e edite todas as empresas cadastradas na plataforma
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1.5 border-muted-foreground/20">
          {stats.total} empresas
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total de Empresas', value: stats.total, icon: Building2, gradient: 'from-violet-500 to-purple-500' },
          { label: 'Valor Total', value: formatCurrency(stats.valorTotal), icon: DollarSign, gradient: 'from-emerald-500 to-green-500' },
          { label: 'Segmentos', value: new Set(empresas?.map(e => e.segmento) || []).size, icon: Building2, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Com Localização', value: empresas?.filter(e => e.endereco_cidade).length || 0, icon: MapPin, gradient: 'from-amber-500 to-yellow-500' },
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
                placeholder="Buscar por nome, CNPJ ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 bg-muted/30 border-muted-foreground/10"
              />
            </div>
            <Select value={segmentoFilter} onValueChange={handleFilterChange(setSegmentoFilter)}>
              <SelectTrigger className="w-[180px] bg-muted/30 border-muted-foreground/10">
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-muted-foreground/10 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Empresa</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">CNPJ</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Setor</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Localização</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Responsável</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full rounded-md" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedEmpresas.length > 0 ? (
                paginatedEmpresas.map((emp, index) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-muted-foreground/5 transition-colors hover:bg-muted/30 group"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{emp.nome}</p>
                        {emp.nome_fantasia && (
                          <p className="text-xs text-muted-foreground">{emp.nome_fantasia}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-muted-foreground">{formatCNPJ(emp.cnpj)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-medium text-[11px] px-2.5', setorColors[emp.segmento] || 'bg-muted text-muted-foreground')}>
                        {getSetores().find(s => s.value === emp.segmento)?.label || emp.segmento}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {emp.endereco_cidade && emp.endereco_uf ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {emp.endereco_cidade}, {emp.endereco_uf}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {emp.responsavel?.nome}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openEditDialog(emp)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedEmpresa(emp);
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
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium">Nenhuma empresa encontrada</p>
                      <p className="text-sm text-muted-foreground/60">Tente ajustar os filtros de busca</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {(empresas?.length || 0) > 0 && (
            <div className="border-t border-muted-foreground/5">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={empresas?.length || 0}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Dados da Empresa */}
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados da Empresa</h4>

            <FileUploadField
              label="Logo da Empresa"
              value={editForm.logo_url}
              onChange={(val) => setEditForm({ ...editForm, logo_url: val })}
              accept="image/*"
              placeholder="https://exemplo.com/logo.png"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Razão Social *</Label>
                <Input
                  value={editForm.nome}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input
                  value={editForm.nome_fantasia}
                  onChange={(e) => setEditForm({ ...editForm, nome_fantasia: e.target.value })}
                  placeholder="Nome fantasia (opcional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CNPJ *</Label>
                <Input
                  value={editForm.cnpj}
                  onChange={(e) => setEditForm({ ...editForm, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  maxLength={18}
                />
              </div>
              <div className="space-y-2">
                <Label>Setor *</Label>
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

            {/* Contato */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contato</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail de Contato *</Label>
                  <Input
                    type="email"
                    value={editForm.contato_email}
                    onChange={(e) => setEditForm({ ...editForm, contato_email: e.target.value })}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={editForm.telefone}
                    onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Exclusividade - Admin only */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Exclusividade</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status de Exclusividade</Label>
                  <Select value={editForm.status_exclusividade} onValueChange={(v) => setEditForm({ ...editForm, status_exclusividade: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Vencido">Vencido</SelectItem>
                      <SelectItem value="Sem exclusividade">Sem exclusividade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editForm.status_exclusividade === 'Ativo' && (
                  <div className="space-y-2">
                    <Label>Data de Exclusividade</Label>
                    <Input
                      type="date"
                      value={editForm.data_exclusividade}
                      onChange={(e) => setEditForm({ ...editForm, data_exclusividade: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Endereço */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Endereço</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={editForm.endereco_cep}
                    onChange={(e) => setEditForm({ ...editForm, endereco_cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={editForm.endereco_logradouro}
                    onChange={(e) => setEditForm({ ...editForm, endereco_logradouro: e.target.value })}
                    placeholder="Rua, Avenida..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={editForm.endereco_numero}
                    onChange={(e) => setEditForm({ ...editForm, endereco_numero: e.target.value })}
                    placeholder="000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={editForm.endereco_complemento}
                    onChange={(e) => setEditForm({ ...editForm, endereco_complemento: e.target.value })}
                    placeholder="Sala, Andar..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={editForm.endereco_bairro}
                    onChange={(e) => setEditForm({ ...editForm, endereco_bairro: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={editForm.endereco_cidade}
                    onChange={(e) => setEditForm({ ...editForm, endereco_cidade: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input
                    maxLength={2}
                    value={editForm.endereco_uf}
                    onChange={(e) => setEditForm({ ...editForm, endereco_uf: e.target.value.toUpperCase() })}
                    placeholder="SP"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateCompany.isPending} className="gap-2">
              {updateCompany.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa {selectedEmpresa?.nome}?
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
