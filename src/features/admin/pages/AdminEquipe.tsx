import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, Plus, Shield, Crown, Headphones,
  MoreVertical, Mail, Calendar, CheckCircle2, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Badge } from '@/shared/components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';
import { Label } from '@/shared/components/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/components/dropdown-menu';
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
import { useAdminEquipe, type AdminMember } from '@/hooks/useAdminEquipe';
import { useAdminPermissions, type AdminRole } from '@/hooks/useAdminPermissions';
import { PermissionsManager } from '@/features/admin/components/PermissionsManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';

const roleConfig: Record<AdminRole, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  master: { label: 'Master', icon: Crown, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  administrador: { label: 'Administrador', icon: Shield, color: 'text-info', bgColor: 'bg-info/10' },
  suporte: { label: 'Suporte', icon: Headphones, color: 'text-primary', bgColor: 'bg-primary/10' },
};

export default function AdminEquipe() {
  const [activeTab, setActiveTab] = useState<'team' | 'permissions'>('team');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<AdminRole>('suporte');
  const [newCargo, setNewCargo] = useState('');
  const [newDepartamento, setNewDepartamento] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { isMaster } = useAdminPermissions();
  const { equipe, isLoading, stats, searchUsers, availableUsers, isLoadingUsers, addAdmin, updateAdmin, removeAdmin, reactivateAdmin } = useAdminEquipe();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchUsers(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddAdmin = async () => {
    if (!selectedUser) return;
    await addAdmin.mutateAsync({
      user_id: selectedUser.id,
      role: newRole,
      cargo: newCargo,
      departamento: newDepartamento,
    });
    setAddDialogOpen(false);
    resetForm();
  };

  const handleUpdateAdmin = async () => {
    if (!selectedMember) return;
    await updateAdmin.mutateAsync({
      id: selectedMember.id,
      role: newRole,
      cargo: newCargo,
      departamento: newDepartamento,
    });
    setEditDialogOpen(false);
    resetForm();
  };

  const handleRemoveAdmin = async () => {
    if (!selectedMember) return;
    await removeAdmin.mutateAsync(selectedMember.id);
    setRemoveDialogOpen(false);
    setSelectedMember(null);
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setNewRole('suporte');
    setNewCargo('');
    setNewDepartamento('');
    setSelectedMember(null);
  };

  // Display users: search results if searching, otherwise available users
  const displayUsers = searchQuery.trim() ? searchResults : (availableUsers || []);

  if (!isMaster) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas usuários Master podem acessar a gestão de equipe administrativa.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[{ label: 'Equipe' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe Administrativa</h1>
          <p className="text-muted-foreground">
            Gerencie os administradores e suas permissões
          </p>
        </div>
        {activeTab === 'team' && (
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Admin
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'team' | 'permissions')}>
        <TabsList>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Membros da Equipe
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permissões por Função
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Admins Ativos', value: stats.ativos, icon: Users, gradient: 'from-accent/20 to-accent/5' },
              ...Object.entries(roleConfig).map(([role, config]) => ({
                label: config.label,
                value: role === 'master' ? stats.masters : role === 'administrador' ? stats.administradores : stats.suporte,
                icon: config.icon,
                gradient: role === 'master' ? 'from-destructive/20 to-destructive/5' : role === 'administrador' ? 'from-info/20 to-info/5' : 'from-primary/20 to-primary/5',
              })),
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-border/30">
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

          {/* Team Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-border/30">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted/30 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))
            ) : equipe && equipe.length > 0 ? (
              equipe.map((member, idx) => {
                const RoleIcon = roleConfig[member.role]?.icon || Shield;
                const memberName = member.profile?.nome || member.cargo || 'Sem nome';
                const memberEmail = member.profile?.email || '';
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn('border-border/30 hover:border-border/60 transition-colors', !member.ativo && 'opacity-50')}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 border-2 border-border/30">
                              <AvatarImage src={member.profile?.avatar_url || ''} />
                              <AvatarFallback className="bg-muted text-foreground font-semibold">
                                {memberName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-foreground leading-tight">{memberName}</h3>
                              <p className="text-xs text-muted-foreground">{member.cargo || 'Sem cargo definido'}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedMember(member);
                                setNewRole(member.role);
                                setNewCargo(member.cargo || '');
                                setNewDepartamento(member.departamento || '');
                                setEditDialogOpen(true);
                              }}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {member.ativo ? (
                                <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedMember(member); setRemoveDialogOpen(true); }}>
                                  Remover da Equipe
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-primary" onClick={() => reactivateAdmin.mutate(member.id)}>
                                  Reativar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={cn('gap-1 text-xs', roleConfig[member.role]?.bgColor, roleConfig[member.role]?.color, 'border-transparent')}>
                              <RoleIcon className="h-3 w-3" />
                              {roleConfig[member.role]?.label}
                            </Badge>
                            {!member.ativo && (
                              <Badge variant="outline" className="text-destructive border-destructive/20 text-xs">Inativo</Badge>
                            )}
                          </div>

                          {memberEmail && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{memberEmail}</span>
                            </div>
                          )}

                          {member.departamento && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{member.departamento}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>Desde {(() => {
                              if (!member.data_admissao) return 'N/A';
                              const d = new Date(member.data_admissao);
                              return isNaN(d.getTime()) ? 'N/A' : format(d, "MMM yyyy", { locale: ptBR });
                            })()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <Card className="col-span-full border-border/30">
                <CardContent className="py-12 text-center">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <h3 className="text-base font-semibold mb-1">Nenhum administrador</h3>
                  <p className="text-sm text-muted-foreground mb-4">Adicione o primeiro membro da equipe</p>
                  <Button onClick={() => setAddDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />Adicionar Admin
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <PermissionsManager />
        </TabsContent>
      </Tabs>

      {/* Add Admin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Administrador</DialogTitle>
            <DialogDescription>
              Busque por nome ou email para adicionar à equipe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!selectedUser ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      {searchQuery.trim() ? 'Resultados da busca' : 'Usuários disponíveis'}
                    </Label>
                    {(isSearching || isLoadingUsers) && (
                      <span className="text-xs text-muted-foreground animate-pulse">Carregando...</span>
                    )}
                  </div>
                  
                  <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                    {displayUsers.length > 0 ? (
                      displayUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.nome?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.nome}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            {user.telefone && (
                              <p className="text-xs text-muted-foreground truncate">{user.telefone}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="capitalize flex-shrink-0">
                            {user.tipo}
                          </Badge>
                        </div>
                      ))
                    ) : searchQuery.trim() ? (
                      <div className="text-center py-8">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum usuário encontrado para "{searchQuery}"
                        </p>
                      </div>
                    ) : !isLoadingUsers && (
                      <div className="text-center py-8">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum usuário disponível
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar>
                    <AvatarImage src={selectedUser.avatar_url || ''} />
                    <AvatarFallback>{selectedUser.nome?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedUser.nome}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    Trocar
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AdminRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suporte">Suporte</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input
                    placeholder="Ex: Analista de Suporte"
                    value={newCargo}
                    onChange={(e) => setNewCargo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Input
                    placeholder="Ex: Tecnologia"
                    value={newDepartamento}
                    onChange={(e) => setNewDepartamento(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleAddAdmin} disabled={!selectedUser || addAdmin.isPending}>
              {addAdmin.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Administrador</DialogTitle>
            <DialogDescription>
              Atualize as informações de {selectedMember?.profile?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AdminRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={newCargo}
                onChange={(e) => setNewCargo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Departamento</Label>
              <Input
                value={newDepartamento}
                onChange={(e) => setNewDepartamento(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateAdmin} disabled={updateAdmin.isPending}>
              {updateAdmin.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Administrador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {selectedMember?.profile?.nome} da equipe administrativa?
              O usuário não terá mais acesso ao painel admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMember(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAdmin} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
