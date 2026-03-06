import { useState, useEffect } from 'react';
import { Shield, Save, Loader2, CheckCircle2, Lock, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { Switch } from '@/shared/components/switch';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/shared/components/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AdminRole, PermissionAction, PermissionResource } from '@/hooks/useAdminPermissions';

interface Permission {
  id: string;
  role: AdminRole;
  resource: PermissionResource;
  action: PermissionAction;
  allowed: boolean;
}

const resources: { key: PermissionResource; label: string; description: string }[] = [
  { key: 'users', label: 'Usuários', description: 'Gestão de contas de usuários' },
  { key: 'profiles', label: 'Perfis', description: 'Dados de perfil dos usuários' },
  { key: 'empresas', label: 'Empresas', description: 'Cadastro de empresas' },
  { key: 'operacoes', label: 'Operações', description: 'Pipeline de operações' },
  { key: 'comissoes', label: 'Comissões', description: 'Gestão de comissões' },
  { key: 'oportunidades', label: 'Oportunidades', description: 'Oportunidades de investimento' },
  { key: 'teses', label: 'Teses', description: 'Teses de investimento' },
  { key: 'cursos', label: 'Cursos', description: 'Conteúdo educacional' },
  { key: 'materiais', label: 'Materiais', description: 'Materiais e documentos' },
  { key: 'noticias', label: 'Notícias', description: 'Publicações e notícias' },
  { key: 'chamados', label: 'Chamados', description: 'Suporte e tickets' },
  { key: 'configuracoes', label: 'Configurações', description: 'Configurações do sistema' },
  { key: 'equipe', label: 'Equipe Admin', description: 'Gestão da equipe admin' },
  { key: 'logs', label: 'Logs', description: 'Logs de auditoria' },
];

const actions: { key: PermissionAction; label: string; icon: string }[] = [
  { key: 'create', label: 'Criar', icon: '＋' },
  { key: 'read', label: 'Ler', icon: '👁' },
  { key: 'update', label: 'Editar', icon: '✎' },
  { key: 'delete', label: 'Excluir', icon: '✕' },
  { key: 'approve', label: 'Aprovar', icon: '✓' },
  { key: 'export', label: 'Exportar', icon: '↗' },
];

const roleStyles: Record<string, { label: string; color: string; bg: string }> = {
  administrador: { label: 'Administrador', color: 'text-info', bg: 'bg-info/10 border-info/20' },
  suporte: { label: 'Suporte', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
};

export function PermissionsManager() {
  const [selectedRole, setSelectedRole] = useState<AdminRole>('administrador');
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .order('resource');
      if (error) throw error;
      return data as Permission[];
    },
  });

  useEffect(() => {
    if (permissions) {
      const permMap: Record<string, boolean> = {};
      permissions.forEach(p => {
        permMap[`${p.role}-${p.resource}-${p.action}`] = p.allowed;
      });
      setLocalPermissions(permMap);
      setHasChanges(false);
    }
  }, [permissions]);

  const updatePermissions = useMutation({
    mutationFn: async (updates: { role: AdminRole; resource: PermissionResource; action: PermissionAction; allowed: boolean }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from('admin_permissions')
          .update({ allowed: update.allowed })
          .eq('role', update.role)
          .eq('resource', update.resource)
          .eq('action', update.action);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      toast.success('Permissões atualizadas!');
      setHasChanges(false);
    },
    onError: () => toast.error('Erro ao atualizar permissões'),
  });

  const handleToggle = (resource: PermissionResource, action: PermissionAction) => {
    const key = `${selectedRole}-${resource}-${action}`;
    setLocalPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const toggleAllForResource = (resource: PermissionResource) => {
    const allEnabled = actions.every(a => localPermissions[`${selectedRole}-${resource}-${a.key}`]);
    const newState = !allEnabled;
    const updated = { ...localPermissions };
    actions.forEach(a => { updated[`${selectedRole}-${resource}-${a.key}`] = newState; });
    setLocalPermissions(updated);
    setHasChanges(true);
  };

  const getPermission = (resource: PermissionResource, action: PermissionAction): boolean => {
    return localPermissions[`${selectedRole}-${resource}-${action}`] ?? false;
  };

  const getResourcePermCount = (resource: PermissionResource): number => {
    return actions.filter(a => getPermission(resource, a.key)).length;
  };

  const handleSave = () => {
    const updates: { role: AdminRole; resource: PermissionResource; action: PermissionAction; allowed: boolean }[] = [];
    resources.forEach(r => {
      actions.forEach(a => {
        const key = `${selectedRole}-${r.key}-${a.key}`;
        const original = permissions?.find(p => p.role === selectedRole && p.resource === r.key && p.action === a.key);
        const current = localPermissions[key];
        if (original && original.allowed !== current) {
          updates.push({ role: selectedRole, resource: r.key, action: a.key, allowed: current });
        }
      });
    });
    if (updates.length > 0) updatePermissions.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPerms = resources.length * actions.length;
  const enabledPerms = resources.reduce((acc, r) => acc + getResourcePermCount(r.key), 0);

  return (
    <TooltipProvider>
      <Card className="border-border/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-foreground" />
                Gerenciar Permissões
              </CardTitle>
              <CardDescription>Defina o que cada função pode acessar na plataforma</CardDescription>
            </div>
            {hasChanges && (
              <Button onClick={handleSave} disabled={updatePermissions.isPending} size="sm" className="gap-2">
                {updatePermissions.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Alterações
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Role selector */}
          <div className="flex gap-2">
            {(['administrador', 'suporte'] as AdminRole[]).map(role => {
              const style = roleStyles[role];
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                    isSelected ? cn(style.bg, style.color, 'border-current') : 'border-border/30 text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  {style.label}
                </button>
              );
            })}
          </div>

          {/* Summary */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{enabledPerms}</strong> de {totalPerms} permissões ativas para <strong className="text-foreground">{roleStyles[selectedRole]?.label}</strong>
            </span>
          </div>

          {/* Permissions table */}
          <div className="border border-border/30 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border/30">
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Recurso</th>
                  {actions.map(action => (
                    <th key={action.key} className="text-center p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider w-20">
                      {action.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resources.map((resource, idx) => {
                  const permCount = getResourcePermCount(resource.key);
                  const allEnabled = permCount === actions.length;
                  return (
                    <tr key={resource.key} className={cn('border-b border-border/10 hover:bg-muted/20 transition-colors', idx % 2 === 0 && 'bg-muted/5')}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => toggleAllForResource(resource.key)}
                                className={cn(
                                  'h-6 w-6 rounded flex items-center justify-center text-xs transition-colors flex-shrink-0',
                                  allEnabled ? 'bg-primary/15 text-primary' : permCount > 0 ? 'bg-warning/15 text-warning' : 'bg-muted/50 text-muted-foreground'
                                )}
                              >
                                {permCount}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-xs">{allEnabled ? 'Desativar todas' : 'Ativar todas'} as permissões</p>
                            </TooltipContent>
                          </Tooltip>
                          <div>
                            <span className="font-medium text-foreground">{resource.label}</span>
                            <p className="text-[10px] text-muted-foreground leading-tight">{resource.description}</p>
                          </div>
                        </div>
                      </td>
                      {actions.map(action => {
                        const hasPermission = getPermission(resource.key, action.key);
                        return (
                          <td key={action.key} className="text-center p-3">
                            <div className="flex justify-center">
                              <Switch
                                checked={hasPermission}
                                onCheckedChange={() => handleToggle(resource.key, action.key)}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3" />
            O role Master possui todas as permissões automaticamente
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
