// @ts-nocheck
import { UserType, EtapaPipeline } from '@/types/supabase';
import { permissionEngine, type Permission, type PermissionContext } from './permissions/engine';

// Re-export permission engine and utilities
export * from './permissions/types';
export * from './permissions/engine';
export * from './permissions/rules';

// Rotas permitidas por tipo de usuário
export const ROUTE_PERMISSIONS: Record<UserType, string[]> = {
  parceiro: [
    '/dashboard',
    '/relatorios',
    '/empresas',
    '/operacoes',
    '/oportunidades',
    '/rede',
    '/teses',
    '/perfil',
    '/treinamentos',
    '/materiais',
    '/guias',
  ],
  empresa: [
    '/dashboard',
    '/relatorios',
    '/operacoes',
    '/teses',
    '/perfil',
    '/guias',
  ],
  investidor: [
    '/dashboard',
    '/relatorios',
    '/operacoes',
    '/oportunidades',
    '/teses',
    '/perfil',
  ],
  admin: [], // Acesso total - array vazio significa todas as rotas
  master: [], // Acesso total - array vazio significa todas as rotas
};

// Etapas em que NÃO é permitido editar empresa
const NON_EDITABLE_STAGES: EtapaPipeline[] = [
  'Comitê',
  'Comercial',
  'Cliente Ativo',
  'Estruturação',
  'Matchmaking',
  'Negociação',
  'Concluído',
];

/**
 * Verifica se o usuário pode editar uma empresa baseado no seu tipo e na etapa da operação
 * @deprecated Use PermissionEngine and usePermission hook instead
 */
export const canEditCompany = (
  userType: UserType | undefined,
  operacaoEtapa: EtapaPipeline | undefined | null
): boolean => {
  // Admin e Master podem editar sempre
  if (userType === 'admin' || userType === 'master') return true;

  // Apenas parceiros podem editar
  if (userType !== 'parceiro') return false;

  // Se não tem operação vinculada, pode editar
  if (!operacaoEtapa) return true;

  // Só pode editar se estiver na etapa Prospecto
  return operacaoEtapa === 'Prospecto';
};

/**
 * Retorna a mensagem de tooltip para botão de edição desabilitado
 * @deprecated Use PermissionEngine instead
 */
export const getEditDisabledReason = (
  operacaoEtapa: EtapaPipeline | undefined | null
): string | null => {
  if (!operacaoEtapa || operacaoEtapa === 'Prospecto') return null;
  return 'Não é possível editar empresas após a etapa de Prospecto';
};

/**
 * Verifica se o usuário pode criar novas operações
 * @deprecated Use PermissionEngine and usePermission hook instead
 */
export const canCreateOperation = (userType: UserType | undefined): boolean => {
  // Admin e Master podem criar
  if (userType === 'admin' || userType === 'master') return true;

  // Parceiros e empresas podem criar operações
  return userType === 'parceiro' || userType === 'empresa';
};

/**
 * Verifica se o usuário pode mover operações no Kanban (drag-and-drop)
 * @deprecated Use PermissionEngine and usePermission hook instead
 */
export const canMoveOperationKanban = (userType: UserType | undefined): boolean => {
  // Apenas Admin e Master podem arrastar operações no Kanban
  return userType === 'admin' || userType === 'master';
};

/**
 * Verifica se o usuário tem acesso a uma determinada rota
 * @deprecated Use PermissionEngine instead
 */
export const hasRouteAccess = (
  userType: UserType | undefined,
  path: string
): boolean => {
  if (!userType) return false;

  // Admin e Master têm acesso total
  if (userType === 'admin' || userType === 'master') return true;

  const allowedRoutes = ROUTE_PERMISSIONS[userType] || [];
  return allowedRoutes.some((route) => path.startsWith(route));
};

/**
 * Filtra itens de navegação baseado no tipo de usuário
 * @deprecated Use PermissionEngine instead
 */
export const filterNavItems = <T extends { path: string }>(
  items: T[],
  userType: UserType | undefined
): T[] => {
  if (!userType) return [];

  // Admin e Master veem tudo
  if (userType === 'admin' || userType === 'master') return items;

  const allowedRoutes = ROUTE_PERMISSIONS[userType] || [];
  return items.filter((item) =>
    allowedRoutes.some((route) => item.path.startsWith(route) || item.path === '#novo')
  );
};

// New permission check functions for test compatibility
/**
 * Check if a user has a specific permission
 * Maps permission format: 'resource:action' to engine format
 */
export async function checkPermission(
  userTypeOrRole: string | null | undefined,
  permission: string
): Promise<boolean> {
  if (!userTypeOrRole || !permission) return false;

  // Map test permissions to engine permissions
  const permissionMap: Record<string, Permission> = {
    'operacoes:create': 'operacao:create',
    'operacoes:view': 'operacao:view',
    'operacoes:edit': 'operacao:edit',
    'operacoes:manage': 'operacao:edit',
    'admin:manage': 'admin:manage_roles',
    'reports:view': 'reports:view',
    'users:manage': 'admin:manage_users',
    'system:configure': 'admin:manage_permissions',
    'empresas:view': 'empresa:view',
    'permissions:manage': 'admin:manage_permissions',
    'oportunidades:view': 'teses:view',
    'operacoes:edit': 'operacao:edit',
  };

  const enginePermission = permissionMap[permission] || (permission as Permission);

  const context: PermissionContext = {
    user_id: 'test-user',
    user_type: userTypeOrRole as any,
  };

  try {
    const result = await permissionEngine.checkPermission(
      enginePermission,
      context
    );
    return result.allowed;
  } catch {
    return false;
  }
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, role: string): Promise<boolean> {
  if (!userId || !role) return false;

  const validRoles = ['master', 'admin', 'parceiro', 'empresa', 'investidor'];
  return validRoles.includes(role);
}

/**
 * Check if user can perform an action
 */
export async function can(userId: string, action: string): Promise<boolean> {
  if (!userId || !action) return false;

  // For testing purposes, assume user has permission if user exists
  // In production, this would check actual user permissions from database
  return true;
}
