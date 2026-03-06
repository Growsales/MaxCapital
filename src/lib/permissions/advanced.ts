import { supabase } from '@/lib/supabase';
import { Permission, PermissionContext } from './types';

/**
 * Advanced Permission Features
 * - Time-based permissions (expiry)
 * - Geo-based restrictions
 * - Team-based permissions
 * - Resource-level ACLs
 */

export interface TimeBasedPermission {
  permission: Permission;
  expiresAt?: Date;
  renewableUntil?: Date;
}

export interface GeoBasedPermission {
  permission: Permission;
  allowedCountries?: string[];
  allowedStates?: string[];
  blockedIPs?: string[];
}

export interface TeamPermission {
  permission: Permission;
  teamId: string;
  inherited?: boolean;
}

/**
 * Advanced Permission Manager
 */
export class AdvancedPermissionManager {
  /**
   * Check time-based permission
   */
  static async checkTimeBasedPermission(
    userId: string,
    permission: Permission
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('time_based_permissions')
      .select('expires_at, renewable_until')
      .eq('user_id', userId)
      .eq('permission', permission)
      .single();

    if (error || !data) {
      return false;
    }

    const now = new Date();
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    const renewableUntil = data.renewable_until ? new Date(data.renewable_until) : null;

    // Check if expired
    if (expiresAt && now > expiresAt) {
      return false;
    }

    // Check if still renewable
    if (renewableUntil && now > renewableUntil) {
      return false;
    }

    return true;
  }

  /**
   * Check geo-based permission
   */
  static async checkGeoBasedPermission(
    userId: string,
    permission: Permission,
    userCountry?: string,
    userState?: string,
    userIP?: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('geo_based_permissions')
      .select('allowed_countries, allowed_states, blocked_ips')
      .eq('user_id', userId)
      .eq('permission', permission)
      .single();

    if (error || !data) {
      return true; // No restrictions
    }

    // Check blocked IPs
    if (userIP && data.blocked_ips?.includes(userIP)) {
      return false;
    }

    // Check allowed countries
    if (
      data.allowed_countries &&
      data.allowed_countries.length > 0 &&
      userCountry &&
      !data.allowed_countries.includes(userCountry)
    ) {
      return false;
    }

    // Check allowed states
    if (
      data.allowed_states &&
      data.allowed_states.length > 0 &&
      userState &&
      !data.allowed_states.includes(userState)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Check team-based permission
   */
  static async checkTeamPermission(
    userId: string,
    teamId: string,
    permission: Permission
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('team_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('permission', permission)
      .single();

    return !error && !!data;
  }

  /**
   * Grant time-based permission
   */
  static async grantTimeBasedPermission(
    userId: string,
    permission: Permission,
    expiresAt?: Date,
    renewableUntil?: Date
  ): Promise<void> {
    const { error } = await supabase.from('time_based_permissions').insert({
      user_id: userId,
      permission,
      expires_at: expiresAt?.toISOString(),
      renewable_until: renewableUntil?.toISOString(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Revoke time-based permission
   */
  static async revokeTimeBasedPermission(
    userId: string,
    permission: Permission
  ): Promise<void> {
    const { error } = await supabase
      .from('time_based_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('permission', permission);

    if (error) {
      throw error;
    }
  }

  /**
   * Grant resource-level ACL
   */
  static async grantResourceACL(
    userId: string,
    resourceType: string,
    resourceId: string,
    permission: Permission
  ): Promise<void> {
    const { error } = await supabase.from('resource_acls').insert({
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      permission,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Check resource-level ACL
   */
  static async checkResourceACL(
    userId: string,
    resourceType: string,
    resourceId: string,
    permission: Permission
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('resource_acls')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .eq('permission', permission)
      .single();

    return !error && !!data;
  }

  /**
   * Renew time-based permission
   */
  static async renewTimeBasedPermission(
    userId: string,
    permission: Permission,
    newExpiresAt: Date,
    newRenewableUntil?: Date
  ): Promise<void> {
    const { error } = await supabase
      .from('time_based_permissions')
      .update({
        expires_at: newExpiresAt.toISOString(),
        renewable_until: newRenewableUntil?.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('permission', permission);

    if (error) {
      throw error;
    }
  }

  /**
   * Grant geo-based permission
   */
  static async grantGeoBasedPermission(
    userId: string,
    permission: Permission,
    allowedCountries?: string[],
    allowedStates?: string[],
    blockedIPs?: string[]
  ): Promise<void> {
    const { error } = await supabase.from('geo_based_permissions').insert({
      user_id: userId,
      permission,
      allowed_countries: allowedCountries,
      allowed_states: allowedStates,
      blocked_ips: blockedIPs,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Revoke geo-based permission
   */
  static async revokeGeoBasedPermission(
    userId: string,
    permission: Permission
  ): Promise<void> {
    const { error } = await supabase
      .from('geo_based_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('permission', permission);

    if (error) {
      throw error;
    }
  }

  /**
   * Grant team permission
   */
  static async grantTeamPermission(
    userId: string,
    teamId: string,
    permission: Permission,
    inherited: boolean = false
  ): Promise<void> {
    const { error } = await supabase.from('team_permissions').insert({
      user_id: userId,
      team_id: teamId,
      permission,
      inherited,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Revoke team permission
   */
  static async revokeTeamPermission(
    userId: string,
    teamId: string,
    permission: Permission
  ): Promise<void> {
    const { error } = await supabase
      .from('team_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('permission', permission);

    if (error) {
      throw error;
    }
  }

  /**
   * List all permissions for user
   */
  static async listUserPermissions(userId: string): Promise<{
    direct: Permission[];
    timeBased: TimeBasedPermission[];
    geoBased: GeoBasedPermission[];
    teamBased: TeamPermission[];
    resources: Array<{ resourceType: string; resourceId: string; permission: Permission }>;
  }> {
    const [directPerms, timePerms, geoPerms, teamPerms, resourcePerms] = await Promise.all([
      supabase
        .from('user_roles_permissions')
        .select('permission')
        .eq('user_id', userId),
      supabase
        .from('time_based_permissions')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('geo_based_permissions')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('team_permissions')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('resource_acls')
        .select('resource_type, resource_id, permission')
        .eq('user_id', userId),
    ]);

    return {
      direct: directPerms.data?.map((p: any) => p.permission) || [],
      timeBased: timePerms.data || [],
      geoBased: geoPerms.data || [],
      teamBased: teamPerms.data || [],
      resources: resourcePerms.data || [],
    };
  }

  /**
   * Revoke resource ACL
   */
  static async revokeResourceACL(
    userId: string,
    resourceType: string,
    resourceId: string,
    permission: Permission
  ): Promise<void> {
    const { error } = await supabase
      .from('resource_acls')
      .delete()
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .eq('permission', permission);

    if (error) {
      throw error;
    }
  }
}
