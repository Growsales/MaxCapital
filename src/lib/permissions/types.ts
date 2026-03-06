import { UserType, EtapaPipeline } from '@/types/supabase';

/**
 * Permissão é uma ação que pode ser realizada em um recurso
 * Formato: "recurso:acao"
 */
export type Permission =
  | 'operacao:view'
  | 'operacao:create'
  | 'operacao:edit'
  | 'operacao:delete'
  | 'operacao:move'
  | 'empresa:view'
  | 'empresa:create'
  | 'empresa:edit'
  | 'empresa:delete'
  | 'rede:view'
  | 'rede:create'
  | 'rede:edit'
  | 'rede:delete'
  | 'teses:view'
  | 'teses:create'
  | 'teses:edit'
  | 'teses:delete'
  | 'admin:manage_users'
  | 'admin:manage_roles'
  | 'admin:view_audit'
  | 'admin:manage_permissions'
  | 'reports:view'
  | 'reports:create'
  | 'reports:export';

/**
 * Contexto de permissão - informações sobre o usuário e o recurso
 */
export interface PermissionContext {
  user_id: string;
  user_type: UserType;
  user_organization_id?: string;
  resource_owner_id?: string;
  resource_type?: string;
  resource_id?: string;
  resource_stage?: EtapaPipeline;
  custom?: Record<string, unknown>;
}

/**
 * Regra de contexto - evalua se uma permissão é permitida dado um contexto
 */
export interface ContextRule {
  name: string;
  evaluate: (context: PermissionContext) => boolean | Promise<boolean>;
}

/**
 * Permissão com regras de contexto opcionais
 */
export interface RolePermission {
  permission: Permission;
  contextRules?: ContextRule[];
}

/**
 * Papel/Role no sistema RBAC
 */
export interface Role {
  id: UserType;
  name: string;
  permissions: Permission[];
  contextRules?: ContextRule[];
}

/**
 * Resultado da avaliação de permissão
 */
export interface PermissionCheckResult {
  allowed: boolean;
  permission: Permission;
  reason?: string;
  context?: PermissionContext;
}

/**
 * Estrutura de matriz de permissões para cache
 */
export interface PermissionMatrix {
  [userType: string]: Set<Permission>;
}
