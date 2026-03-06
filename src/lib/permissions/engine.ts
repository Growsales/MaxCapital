// @ts-nocheck
import {
  Permission,
  PermissionContext,
  Role,
  PermissionCheckResult,
  PermissionMatrix,
} from './types';
import {
  ownershipRule,
  stageEditableRule,
  organizationRule,
  allowAllRule,
} from './rules';

/**
 * PermissionEngine - centralized RBAC engine
 * Single source of truth for all authorization logic
 */
export class PermissionEngine {
  private roles: Map<string, Role> = new Map();
  private matrix: PermissionMatrix = {};

  constructor() {
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default roles with their permissions
   */
  private initializeDefaultRoles(): void {
    // Master role - has all permissions
    this.registerRole({
      id: 'master',
      name: 'Master Administrator',
      permissions: this.getAllPermissions(),
    });

    // Admin role - almost all permissions
    this.registerRole({
      id: 'admin',
      name: 'Administrator',
      permissions: this.getAllPermissions().filter(
        (p) => !p.includes('admin:manage_permissions')
      ),
    });

    // Parceiro role - can manage own operations and companies
    this.registerRole({
      id: 'parceiro',
      name: 'Partner',
      permissions: [
        'operacao:view',
        'operacao:create',
        'operacao:edit',
        'empresa:view',
        'empresa:create',
        'empresa:edit',
        'rede:view',
        'rede:create',
        'teses:view',
        'reports:view',
        'reports:create',
      ],
    });

    // Empresa role - can view operations and participate
    this.registerRole({
      id: 'empresa',
      name: 'Company',
      permissions: [
        'operacao:view',
        'empresa:view',
        'teses:view',
        'reports:view',
      ],
    });

    // Investidor role - can view operations and opportunities
    this.registerRole({
      id: 'investidor',
      name: 'Investor',
      permissions: [
        'operacao:view',
        'teses:view',
        'reports:view',
      ],
    });

    // Build permission matrix for fast lookups
    this.buildMatrix();
  }

  /**
   * Get all available permissions
   */
  private getAllPermissions(): Permission[] {
    return [
      'operacao:view',
      'operacao:create',
      'operacao:edit',
      'operacao:delete',
      'operacao:move',
      'empresa:view',
      'empresa:create',
      'empresa:edit',
      'empresa:delete',
      'rede:view',
      'rede:create',
      'rede:edit',
      'rede:delete',
      'teses:view',
      'teses:create',
      'teses:edit',
      'teses:delete',
      'admin:manage_users',
      'admin:manage_roles',
      'admin:view_audit',
      'admin:manage_permissions',
      'reports:view',
      'reports:create',
      'reports:export',
    ];
  }

  /**
   * Register a custom role
   */
  registerRole(role: Role): void {
    this.roles.set(role.id, role);
    this.matrix[role.id] = new Set(role.permissions);
  }

  /**
   * Build permission matrix for fast lookups
   */
  private buildMatrix(): void {
    this.matrix = {};
    this.roles.forEach((role) => {
      this.matrix[role.id] = new Set(role.permissions);
    });
  }

  /**
   * Check if a permission is allowed
   * Returns true if:
   * 1. User has permission in their role, AND
   * 2. All context rules evaluate to true (if any exist)
   */
  async canPerform(
    permission: Permission,
    context: PermissionContext
  ): Promise<boolean> {
    const role = this.roles.get(context.user_type);

    if (!role) {
      return false;
    }

    // Check if permission exists in role
    if (!role.permissions.includes(permission)) {
      return false;
    }

    // Evaluate context-specific rules for this permission
    const contextRules = this.getContextRulesForPermission(
      permission,
      context.user_type
    );

    if (contextRules && contextRules.length > 0) {
      for (const rule of contextRules) {
        const result = await Promise.resolve(rule.evaluate(context));
        if (!result) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get context rules for a specific permission and role
   */
  private getContextRulesForPermission(
    permission: Permission,
    userType: string
  ): ContextRule[] {
    // Edit permissions require ownership and stage validation
    if (permission.includes(':edit')) {
      if (userType === 'parceiro') {
        return [ownershipRule, stageEditableRule];
      }
    }

    // View operations for empresa/investidor requires organization match
    if (permission.includes(':view') && userType === 'empresa') {
      return [organizationRule];
    }

    if (permission.includes(':view') && userType === 'investidor') {
      return [organizationRule];
    }

    return [];
  }

  /**
   * Synchronous version of canPerform (doesn't evaluate async rules)
   */
  canPerformSync(
    permission: Permission,
    context: PermissionContext
  ): boolean {
    const role = this.roles.get(context.user_type);

    if (!role) {
      return false;
    }

    // Check if permission exists in role
    if (!role.permissions.includes(permission)) {
      return false;
    }

    // Evaluate only synchronous context rules
    const contextRules = this.getContextRulesForPermission(
      permission,
      context.user_type
    );

    if (contextRules && contextRules.length > 0) {
      for (const rule of contextRules) {
        try {
          const result = rule.evaluate(context);
          // Skip if rule returns a promise in sync mode
          if (result instanceof Promise) {
            console.warn(`Async rule "${rule.name}" skipped in sync mode`);
            continue;
          }
          if (!result) {
            return false;
          }
        } catch (error) {
          console.error(`Error evaluating rule "${rule.name}":`, error);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get full permission check result with reason
   */
  async checkPermission(
    permission: Permission,
    context: PermissionContext
  ): Promise<PermissionCheckResult> {
    const allowed = await this.canPerform(permission, context);

    const reason = allowed
      ? `User ${context.user_type} is allowed to perform ${permission}`
      : `User ${context.user_type} is denied ${permission}`;

    return {
      allowed,
      permission,
      reason,
      context,
    };
  }

  /**
   * Get user's available permissions
   */
  getUserPermissions(userType: string): Permission[] {
    return this.matrix[userType] ? Array.from(this.matrix[userType]) : [];
  }

  /**
   * Get all roles
   */
  getRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Get specific role
   */
  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }
}

// Export singleton instance
export const permissionEngine = new PermissionEngine();
