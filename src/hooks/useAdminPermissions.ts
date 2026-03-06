import { useAuth } from '@/shared/hooks/useAuth';

export type AdminRole = 'master' | 'administrador' | 'suporte';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export';
export type PermissionResource = 
  | 'users' | 'profiles' | 'empresas' | 'operacoes' | 'comissoes'
  | 'oportunidades' | 'teses' | 'cursos' | 'materiais' | 'noticias'
  | 'chamados' | 'configuracoes' | 'equipe' | 'logs';

export function useAdminPermissions() {
  const { profile } = useAuth();
  const isAdmin = profile?.tipo === 'admin' || profile?.tipo === 'master';
  const isMaster = profile?.tipo === 'admin' || profile?.tipo === 'master';

  // Always allow switching — the switcher itself is always visible
  const canSwitchProfiles = true;

  const hasPermission = (_resource: PermissionResource, _action: PermissionAction): boolean => isAdmin;

  return {
    adminData: { id: 'mock', user_id: 'mock', role: 'master' as AdminRole, departamento: null, cargo: 'Admin', ativo: true, created_at: '' },
    permissions: [],
    isLoading: false,
    isAdmin,
    isMaster,
    canSwitchProfiles,
    isAdministrador: false,
    isSuporte: false,
    adminRole: 'master' as AdminRole,
    hasPermission,
    canCreate: (_r: PermissionResource) => isAdmin,
    canRead: (_r: PermissionResource) => true,
    canUpdate: (_r: PermissionResource) => isAdmin,
    canDelete: (_r: PermissionResource) => isAdmin,
    canApprove: (_r: PermissionResource) => isAdmin,
    canExport: (_r: PermissionResource) => isAdmin,
  };
}
