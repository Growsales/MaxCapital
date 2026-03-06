import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, MoreVertical, Mail, Phone,
  CheckCircle2, XCircle, Clock, Edit, UserCog, Save, Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Badge } from '@/shared/components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';
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
  DialogDescription,
  DialogFooter,
} from '@/shared/components/dialog';
import { Skeleton } from '@/shared/components/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { useAdminActions } from '@/hooks/useAdminActions';
import type { UserType, UserStatus } from '@/types/supabase';

interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  tipo: UserType;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
}

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-green-500', icon: CheckCircle2 },
  inativo: { label: 'Inativo', color: 'bg-gray-500', icon: XCircle },
  pendente_aprovacao: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
};

const tipoConfig = {
  parceiro: { label: 'Parceiro', color: 'text-blue-500 bg-blue-500/10' },
  empresa: { label: 'Empresa', color: 'text-purple-500 bg-purple-500/10' },
  investidor: { label: 'Investidor', color: 'text-green-500 bg-green-500/10' },
  admin: { label: 'Admin', color: 'text-orange-500 bg-orange-500/10' },
  master: { label: 'Master', color: 'text-red-500 bg-red-500/10' },
};

export default function AdminUsuarios() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    tipo: 'parceiro' as UserType,
    status: 'ativo' as UserStatus,
  });
  
  const queryClient = useQueryClient();
  const { updateUser } = useAdminActions();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['admin-usuarios', search, tipoFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (tipoFilter && tipoFilter !== 'all') {
        query = query.eq('tipo', tipoFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Pagination logic
  const paginatedUsers = useMemo(() => {
    if (!usuarios) return [];
    const start = (currentPage - 1) * pageSize;
    return usuarios.slice(start, start + pageSize);
  }, [usuarios, currentPage, pageSize]);

  const totalPages = Math.ceil((usuarios?.length || 0) / pageSize);

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const openEditDialog = (user: Profile) => {
    setSelectedUser(user);
    setEditForm({
      nome: user.nome || '',
      email: user.email || '',
      telefone: user.telefone || '',
      tipo: user.tipo,
      status: user.status,
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    await updateUser.mutateAsync({
      userId: selectedUser.id,
      data: editForm,
    });
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const stats = {
    total: usuarios?.length || 0,
    ativos: usuarios?.filter(u => u.status === 'ativo').length || 0,
    pendentes: usuarios?.filter(u => u.status === 'pendente_aprovacao').length || 0,
    parceiros: usuarios?.filter(u => u.tipo === 'parceiro').length || 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[{ label: 'Usuários' }]} />

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os usuários da plataforma
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1.5 border-muted-foreground/20">
          {stats.total} usuários
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total de Usuários', value: stats.total, icon: Users, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Usuários Ativos', value: stats.ativos, icon: CheckCircle2, gradient: 'from-emerald-500 to-green-500' },
          { label: 'Pendentes', value: stats.pendentes, icon: Clock, gradient: 'from-amber-500 to-yellow-500' },
          { label: 'Parceiros', value: stats.parceiros, icon: UserCog, gradient: 'from-violet-500 to-purple-500' },
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
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 bg-muted/30 border-muted-foreground/10"
              />
            </div>
            <Select value={tipoFilter} onValueChange={handleFilterChange(setTipoFilter)}>
              <SelectTrigger className="w-[170px] bg-muted/30 border-muted-foreground/10">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="parceiro">Parceiro</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="investidor">Investidor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
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
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Usuário</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Contato</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Tipo</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">Cadastro</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-full rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-muted-foreground/5 transition-colors hover:bg-muted/30 group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-muted-foreground/10">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback className="text-xs font-semibold bg-muted/50">{user.nome?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.nome}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.telefone ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {user.telefone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-medium text-[11px] px-2.5', tipoConfig[user.tipo]?.color)}>
                        {tipoConfig[user.tipo]?.label || user.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', statusConfig[user.status]?.color)} />
                        <span className="text-sm">{statusConfig[user.status]?.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditDialog(user)}
                        className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium">Nenhum usuário encontrado</p>
                      <p className="text-sm text-muted-foreground/60">Tente ajustar os filtros de busca</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {(usuarios?.length || 0) > 0 && (
            <div className="border-t border-muted-foreground/5">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={usuarios?.length || 0}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário {selectedUser?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editForm.nome}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={editForm.telefone}
                  onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                <Select 
                  value={editForm.tipo}
                  onValueChange={(v) => setEditForm({ ...editForm, tipo: v as UserType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parceiro">Parceiro</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="investidor">Investidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v as UserStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="pendente_aprovacao">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={updateUser.isPending} className="gap-2">
              {updateUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
