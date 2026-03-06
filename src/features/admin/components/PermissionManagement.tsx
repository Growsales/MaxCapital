import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Clock, Users, Lock,
  Search, Plus, Trash2, Loader2, ChevronDown,
  Copy, AlertTriangle, CheckCircle2, XCircle,
  Filter, Download, MoreHorizontal, Eye, RefreshCw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Badge } from '@/shared/components/badge';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/select';
import { Skeleton } from '@/shared/components/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/shared/components/dropdown-menu';
import { Checkbox } from '@/shared/components/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { AdvancedPermissionManager } from '@/lib/permissions/advanced';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PERMISSION_OPTIONS = [
  { value: 'operacao:view', label: 'Ver Operações', group: 'Operações' },
  { value: 'operacao:create', label: 'Criar Operações', group: 'Operações' },
  { value: 'operacao:edit', label: 'Editar Operações', group: 'Operações' },
  { value: 'operacao:delete', label: 'Excluir Operações', group: 'Operações' },
  { value: 'operacao:move', label: 'Mover Operações', group: 'Operações' },
  { value: 'empresa:view', label: 'Ver Empresas', group: 'Empresas' },
  { value: 'empresa:create', label: 'Criar Empresas', group: 'Empresas' },
  { value: 'empresa:edit', label: 'Editar Empresas', group: 'Empresas' },
  { value: 'empresa:delete', label: 'Excluir Empresas', group: 'Empresas' },
  { value: 'rede:view', label: 'Ver Rede', group: 'Rede' },
  { value: 'rede:create', label: 'Criar Rede', group: 'Rede' },
  { value: 'rede:edit', label: 'Editar Rede', group: 'Rede' },
  { value: 'teses:view', label: 'Ver Teses', group: 'Teses' },
  { value: 'teses:create', label: 'Criar Teses', group: 'Teses' },
  { value: 'admin:manage_users', label: 'Gerenciar Usuários', group: 'Admin' },
  { value: 'admin:manage_roles', label: 'Gerenciar Roles', group: 'Admin' },
  { value: 'admin:view_audit', label: 'Ver Auditoria', group: 'Admin' },
  { value: 'admin:manage_permissions', label: 'Gerenciar Permissões', group: 'Admin' },
  { value: 'reports:view', label: 'Ver Relatórios', group: 'Relatórios' },
  { value: 'reports:export', label: 'Exportar Relatórios', group: 'Relatórios' },
];

const typeConfig = {
  'time-based': { label: 'Temporal', icon: Clock, borderColor: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
  'team': { label: 'Equipe', icon: Users, borderColor: 'border-l-purple-500', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500' },
  'resource-acl': { label: 'Recurso', icon: Lock, borderColor: 'border-l-orange-500', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-500' },
};

interface PermissionEntry {
  id: string;
  user_id: string;
  permission: string;
  expires_at?: string;
  renewable_until?: string;
  team_id?: string;
  inherited?: boolean;
  resource_type?: string;
  resource_id?: string;
  created_at?: string;
  type: 'time-based' | 'team' | 'resource-acl';
}

function getTimeRemaining(expiresAt: string) {
  const now = new Date();
  const exp = new Date(expiresAt);
  if (exp < now) return { label: 'Expirada', urgent: true };
  const hours = differenceInHours(exp, now);
  const days = differenceInDays(exp, now);
  if (days > 7) return { label: `${days} dias`, urgent: false };
  if (days > 0) return { label: `${days}d ${hours % 24}h`, urgent: days <= 3 };
  return { label: `${hours}h`, urgent: true };
}

function PermissionBadge({ permission }: { permission: string }) {
  const [scope, action] = permission.split(':');
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className="text-[10px] font-mono bg-muted/50">{scope}</Badge>
      <span className="text-[10px] text-muted-foreground">:</span>
      <Badge variant="secondary" className="text-[10px]">{action}</Badge>
    </div>
  );
}

export function PermissionManagement() {
  const [activeTab, setActiveTab] = useState('time-based');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantType, setGrantType] = useState<string>('time-based');

  // Grant form state
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [teamId, setTeamId] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [resourceId, setResourceId] = useState('');

  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, tipo, nome')
        .order('nome')
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const usersMap = useMemo(() => {
    const map: Record<string, { email: string; tipo: string; nome: string }> = {};
    users?.forEach((u: any) => {
      map[u.id] = { email: u.email || '', tipo: u.tipo || '', nome: u.nome || '' };
    });
    return map;
  }, [users]);

  const { data: allPermissions, isLoading, refetch } = useQuery({
    queryKey: ['advanced-permissions-all'],
    queryFn: async () => {
      const [timeRes, teamRes, resourceRes] = await Promise.all([
        supabase.from('time_based_permissions').select('*'),
        supabase.from('team_permissions').select('*'),
        supabase.from('resource_acls').select('*'),
      ]);

      const timePerms: PermissionEntry[] = (timeRes.data || []).map((p: any) => ({ ...p, type: 'time-based' as const }));
      const teamPerms: PermissionEntry[] = (teamRes.data || []).map((p: any) => ({ ...p, type: 'team' as const }));
      const resourcePerms: PermissionEntry[] = (resourceRes.data || []).map((p: any) => ({ ...p, type: 'resource-acl' as const }));

      return [...timePerms, ...teamPerms, ...resourcePerms];
    },
  });

  const filteredPermissions = useMemo(() => {
    if (!allPermissions) return [];
    let filtered = allPermissions.filter((p) => p.type === activeTab);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const user = usersMap[p.user_id];
        return (
          p.permission?.toLowerCase().includes(query) ||
          user?.email?.toLowerCase().includes(query) ||
          user?.nome?.toLowerCase().includes(query)
        );
      });
    }
    return filtered;
  }, [allPermissions, activeTab, searchQuery, usersMap]);

  const paginatedPermissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPermissions.slice(start, start + pageSize);
  }, [filteredPermissions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPermissions.length / pageSize);

  const stats = useMemo(() => {
    if (!allPermissions) return { total: 0, timeBased: 0, team: 0, resource: 0, expired: 0 };
    const expired = allPermissions.filter(p => p.expires_at && new Date(p.expires_at) < new Date()).length;
    return {
      total: allPermissions.length,
      timeBased: allPermissions.filter((p) => p.type === 'time-based').length,
      team: allPermissions.filter((p) => p.type === 'team').length,
      resource: allPermissions.filter((p) => p.type === 'resource-acl').length,
      expired,
    };
  }, [allPermissions]);

  const resetGrantForm = () => {
    setSelectedUser('');
    setSelectedPermission('');
    setExpiresAt('');
    setTeamId('');
    setResourceType('');
    setResourceId('');
  };

  const grantMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !selectedPermission) throw new Error('Selecione usuário e permissão');
      const expiryDate = expiresAt ? new Date(expiresAt) : undefined;
      await AdvancedPermissionManager.grantTimeBasedPermission(selectedUser, selectedPermission as any, expiryDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-permissions-all'] });
      toast.success('Permissão concedida com sucesso!');
      resetGrantForm();
      setShowGrantForm(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const table =
        type === 'time-based' ? 'time_based_permissions'
        : type === 'team' ? 'team_permissions'
        : 'resource_acls';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-permissions-all'] });
      toast.success('Permissão revogada!');
    },
    onError: () => toast.error('Erro ao revogar permissão'),
  });

  const bulkRevokeMutation = useMutation({
    mutationFn: async () => {
      const permsToDelete = allPermissions?.filter(p => selectedIds.has(p.id)) || [];
      const grouped: Record<string, string[]> = {};
      permsToDelete.forEach(p => {
        const table = p.type === 'time-based' ? 'time_based_permissions'
          : p.type === 'team' ? 'team_permissions' : 'resource_acls';
        if (!grouped[table]) grouped[table] = [];
        grouped[table].push(p.id);
      });
      await Promise.all(
        Object.entries(grouped).map(([table, ids]) =>
          supabase.from(table).delete().in('id', ids)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-permissions-all'] });
      toast.success(`${selectedIds.size} permissões revogadas!`);
      setSelectedIds(new Set());
    },
    onError: () => toast.error('Erro ao revogar permissões em lote'),
  });

  const getUserDisplay = (userId: string) => {
    const user = usersMap[userId];
    if (user) return { name: user.nome || user.email, tipo: user.tipo, email: user.email };
    return { name: userId.substring(0, 8) + '...', tipo: '', email: '' };
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedPermissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPermissions.map(p => p.id)));
    }
  };

  const duplicatePermission = (perm: PermissionEntry) => {
    setShowGrantForm(true);
    setGrantType(perm.type);
    setSelectedPermission(perm.permission);
    setSelectedUser('');
    toast.info('Preencha o usuário para duplicar a permissão');
  };

  const statCards = [
    { icon: Shield, value: stats.total, label: 'Total', borderColor: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
    { icon: Clock, value: stats.timeBased, label: 'Temporais', borderColor: 'border-l-green-500', iconBg: 'bg-green-500/10', iconColor: 'text-green-500' },
    { icon: Users, value: stats.team + stats.resource, label: 'Equipe/Recurso', borderColor: 'border-l-purple-500', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500' },
    { icon: AlertTriangle, value: stats.expired, label: 'Expiradas', borderColor: 'border-l-orange-500', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-500' },
  ];

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Permissões Avançadas</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie permissões temporais, de equipe e de recursos</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar</TooltipContent>
            </Tooltip>
            <Button onClick={() => { setShowGrantForm(!showGrantForm); resetGrantForm(); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Conceder Permissão
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className={cn("border-0 border-l-4", stat.borderColor)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.iconBg)}>
                  <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grant Form */}
        <AnimatePresence>
          {showGrantForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-0 border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="h-4 w-4 text-primary" />
                    Nova Permissão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Type selector */}
                    <div className="flex gap-2">
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <Button
                          key={key}
                          variant={grantType === key ? 'default' : 'outline'}
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => setGrantType(key)}
                        >
                          <config.icon className="h-3.5 w-3.5" />
                          {config.label}
                        </Button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Usuário</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {users?.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                <span className="font-medium">{user.nome || user.email}</span>
                                <span className="text-muted-foreground ml-1">({user.tipo})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Permissão</Label>
                        <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PERMISSION_OPTIONS.map((perm) => (
                              <SelectItem key={perm.value} value={perm.value}>
                                {perm.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {grantType === 'time-based' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Expiração</Label>
                          <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="text-sm" />
                        </div>
                      )}




                      {grantType === 'team' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Team ID</Label>
                          <Input value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="UUID do time" className="text-sm" />
                        </div>
                      )}

                      {grantType === 'resource-acl' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tipo de Recurso</Label>
                          <Select value={resourceType} onValueChange={setResourceType}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Tipo..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="operacao">Operação</SelectItem>
                              <SelectItem value="empresa">Empresa</SelectItem>
                              <SelectItem value="documento">Documento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex items-end gap-2">
                        <Button
                          onClick={() => grantMutation.mutate()}
                          disabled={grantMutation.isPending || !selectedUser || !selectedPermission}
                          className="flex-1 gap-2"
                        >
                          {grantMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Conceder
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setShowGrantForm(false); resetGrantForm(); }}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Permissions Table */}
        <Card className="border-0">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Permissões Ativas
                  <Badge variant="secondary" className="text-xs">{filteredPermissions.length}</Badge>
                </CardTitle>
                {selectedIds.size > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => bulkRevokeMutation.mutate()}
                      disabled={bulkRevokeMutation.isPending}
                    >
                      {bulkRevokeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Revogar {selectedIds.size} selecionadas
                    </Button>
                  </motion.div>
                )}
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário ou permissão..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); setSelectedIds(new Set()); }}>
              <TabsList className="mb-4">
                {Object.entries(typeConfig).map(([key, config]) => (
                  <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
                    <config.icon className="h-3.5 w-3.5" />
                    {config.label}
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                      {allPermissions?.filter((p) => p.type === key).length || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.keys(typeConfig).map((tabKey) => (
                <TabsContent key={tabKey} value={tabKey}>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                    </div>
                  ) : paginatedPermissions.length > 0 ? (
                    <div className="space-y-1.5">
                      {/* Select all row */}
                      <div className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground">
                        <Checkbox
                          checked={selectedIds.size === paginatedPermissions.length && paginatedPermissions.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                        <span>Selecionar todos</span>
                      </div>

                      {paginatedPermissions.map((perm) => {
                        const userDisplay = getUserDisplay(perm.user_id);
                        const expired = isExpired(perm.expires_at);
                        const isSelected = selectedIds.has(perm.id);
                        const timeInfo = perm.expires_at ? getTimeRemaining(perm.expires_at) : null;

                        return (
                          <motion.div
                            key={perm.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-lg border transition-all",
                              isSelected ? "border-primary/40 bg-primary/5" : "border-border/30 bg-card hover:bg-muted/30",
                              expired && "opacity-60"
                            )}
                          >
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(perm.id)} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm truncate">{userDisplay.name}</span>
                                {userDisplay.tipo && (
                                  <Badge variant="outline" className="text-[10px] capitalize shrink-0">{userDisplay.tipo}</Badge>
                                )}
                              </div>
                              <PermissionBadge permission={perm.permission} />
                            </div>

                            {/* Type-specific info */}
                            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              {tabKey === 'time-based' && timeInfo && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span className={cn(timeInfo.urgent && !expired && "text-orange-500 font-medium", expired && "text-destructive")}>
                                    {expired ? 'Expirada' : timeInfo.label}
                                  </span>
                                </div>
                              )}
                              {tabKey === 'time-based' && !perm.expires_at && (
                                <Badge variant="outline" className="text-[10px]">Permanente</Badge>
                              )}


                              {tabKey === 'team' && (
                                <div className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5" />
                                  <span className="font-mono">{perm.team_id?.substring(0, 8)}...</span>
                                  {perm.inherited && <Badge variant="secondary" className="text-[10px]">Herdada</Badge>}
                                </div>
                              )}
                              {tabKey === 'resource-acl' && (
                                <div className="flex items-center gap-1.5">
                                  <Lock className="h-3.5 w-3.5" />
                                  <Badge variant="outline" className="text-[10px] capitalize">{perm.resource_type}</Badge>
                                </div>
                              )}
                            </div>

                            {/* Status badge */}
                            {tabKey === 'time-based' && (
                              <Badge
                                className={cn("text-[10px] shrink-0",
                                  expired ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20"
                                )}
                                variant="outline"
                              >
                                {expired ? <XCircle className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {expired ? 'Expirada' : 'Ativa'}
                              </Badge>
                            )}

                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => duplicatePermission(perm)} className="gap-2 text-xs">
                                  <Copy className="h-3.5 w-3.5" />
                                  Duplicar para outro usuário
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => revokeMutation.mutate({ id: perm.id, type: perm.type })}
                                  className="gap-2 text-xs text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Revogar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <div className="p-4 rounded-full bg-muted/30 w-fit mx-auto mb-4">
                        <Shield className="h-8 w-8 opacity-40" />
                      </div>
                      <p className="text-sm font-medium mb-1">Nenhuma permissão {typeConfig[tabKey as keyof typeof typeConfig]?.label.toLowerCase()}</p>
                      <p className="text-xs">Clique em "Conceder Permissão" para adicionar</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>

            {filteredPermissions.length > 0 && (
              <div className="mt-4">
                <AdminPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredPermissions.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
