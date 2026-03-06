import type { UserType, Permission } from '../types';

export const ROLE_PERMISSIONS: Record<UserType, Permission[]> = {
  master: ['*'],

  admin: [
    'operacao:view', 'operacao:create', 'operacao:edit', 'operacao:delete', 'operacao:move',
    'empresa:view', 'empresa:create', 'empresa:edit', 'empresa:delete',
    'rede:view', 'rede:create',
    'teses:view', 'teses:create', 'teses:edit', 'teses:delete',
    'reports:view', 'reports:create', 'reports:export',
    'admin:view', 'admin:manage_users', 'admin:manage_roles', 'admin:view_audit',
    'oportunidade:view', 'oportunidade:create', 'oportunidade:edit', 'oportunidade:delete',
    'chamado:view', 'chamado:create', 'chamado:edit', 'chamado:assign',
    'formulario:view', 'formulario:create', 'formulario:edit', 'formulario:delete',
    'curso:view', 'curso:create', 'curso:edit', 'curso:delete',
    'comissao:view', 'comissao:edit',
  ],

  parceiro: [
    'operacao:view', 'operacao:create', 'operacao:edit', 'operacao:move',
    'empresa:view', 'empresa:create', 'empresa:edit',
    'rede:view', 'rede:create',
    'teses:view',
    'reports:view', 'reports:create',
    'oportunidade:view',
    'chamado:view', 'chamado:create',
    'curso:view',
    'comissao:view',
  ],

  empresa: [
    'operacao:view',
    'empresa:view',
    'teses:view',
    'reports:view',
    'oportunidade:view',
    'chamado:view', 'chamado:create',
    'curso:view',
  ],

  investidor: [
    'operacao:view',
    'teses:view', 'teses:create', 'teses:edit',
    'reports:view',
    'oportunidade:view',
    'chamado:view', 'chamado:create',
    'curso:view',
  ],
};

export function hasPermission(userType: UserType, permission: Permission): boolean {
  if (userType === 'master') return true;

  const permissions = ROLE_PERMISSIONS[userType];
  if (!permissions) return false;

  if (permissions.includes('*')) return true;

  return permissions.includes(permission);
}
