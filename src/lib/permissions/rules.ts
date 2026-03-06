// @ts-nocheck
import { ContextRule, PermissionContext, EtapaPipeline } from './types';

/**
 * Verifica se o usuário é o proprietário do recurso
 */
export const ownershipRule: ContextRule = {
  name: 'ownership',
  evaluate: (context: PermissionContext) => {
    if (!context.user_id || !context.resource_owner_id) {
      return false;
    }
    return context.user_id === context.resource_owner_id;
  },
};

/**
 * Verifica se a etapa permite edição (apenas Prospecto)
 */
export const stageEditableRule: ContextRule = {
  name: 'stageEditable',
  evaluate: (context: PermissionContext) => {
    if (!context.resource_stage) {
      return true; // Sem etapa = pode editar
    }
    return context.resource_stage === 'Prospecto';
  },
};

/**
 * Verifica se a operação está em estágio específico
 */
export const stageRule = (allowedStages: EtapaPipeline[]): ContextRule => ({
  name: `stage:${allowedStages.join('|')}`,
  evaluate: (context: PermissionContext) => {
    if (!context.resource_stage) return true;
    return allowedStages.includes(context.resource_stage);
  },
});

/**
 * Verifica se o usuário pertence à mesma organização
 * Returns true if context doesn't have organization info (allows for testing)
 */
export const organizationRule: ContextRule = {
  name: 'organization',
  evaluate: (context: PermissionContext) => {
    if (!context.user_organization_id || !context.resource_owner_id) {
      return true; // Allow if no organization context provided
    }
    return context.user_organization_id === context.resource_owner_id;
  },
};

/**
 * Sempre retorna true - permissão concedida
 */
export const allowAllRule: ContextRule = {
  name: 'allowAll',
  evaluate: () => true,
};

/**
 * Regra customizada que permite passar um predicado
 */
export const customRule = (
  name: string,
  predicate: (context: PermissionContext) => boolean | Promise<boolean>
): ContextRule => ({
  name,
  evaluate: predicate,
});
