// AI triage permission check utility
import type { ProjectConfig } from '@stride/types';
import { UserRole } from '@stride/types';

/**
 * Default AI triage permissions (lowercase from config)
 * Admin only by default if not configured
 */
const DEFAULT_AI_TRIAGE_PERMISSIONS = ['admin'] as const;

/**
 * Map config role string (lowercase) to UserRole enum (capitalized)
 */
function mapConfigRoleToUserRole(configRole: string): UserRole | null {
  const roleMap: Record<string, UserRole> = {
    'admin': UserRole.Admin,
    'member': UserRole.Member,
    'viewer': UserRole.Viewer,
  };
  
  return roleMap[configRole.toLowerCase()] || null;
}

/**
 * Map UserRole enum to config role string (lowercase)
 */
function mapUserRoleToConfigRole(userRole: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    [UserRole.Admin]: 'admin',
    [UserRole.Member]: 'member',
    [UserRole.Viewer]: 'viewer',
  };
  
  return roleMap[userRole] || 'viewer';
}

/**
 * Check if user has permission to use AI triage feature
 * Reads aiTriageConfig.permissions from project config
 * Maps YAML snake_case `ai_triage_permissions` to schema camelCase `aiTriageConfig.permissions`
 * Defaults to ['admin'] if not configured
 * 
 * Note: Config uses lowercase strings ('admin', 'member', 'viewer'),
 * but UserRole enum uses capitalized values ('Admin', 'Member', 'Viewer')
 * 
 * @param userRole - User's role (enum value)
 * @param projectConfig - Project configuration
 * @returns true if user has permission, false otherwise
 */
export function canUseAITriage(
  userRole: UserRole,
  projectConfig?: ProjectConfig
): boolean {
  // Check if AI triage is enabled
  if (projectConfig?.ai_triage_config?.enabled === false) {
    return false;
  }

  // Get permissions from config (lowercase strings: 'admin', 'member', 'viewer')
  const configuredPermissions = projectConfig?.ai_triage_config?.permissions;

  // Use configured permissions or default to admin only
  const allowedConfigRoles = configuredPermissions && configuredPermissions.length > 0
    ? configuredPermissions
    : [...DEFAULT_AI_TRIAGE_PERMISSIONS];

  // Convert user role to config role string for comparison
  const userConfigRole = mapUserRoleToConfigRole(userRole);

  // Check if user role is in allowed list
  return allowedConfigRoles.includes(userConfigRole as 'admin' | 'member' | 'viewer');
}

/**
 * Get AI triage permission configuration for a project
 * Returns the configured permissions or default (as UserRole enum values)
 * 
 * @param projectConfig - Project configuration
 * @returns Array of allowed roles (enum values)
 */
export function getAITriagePermissions(
  projectConfig?: ProjectConfig
): UserRole[] {
  const configuredPermissions = projectConfig?.ai_triage_config?.permissions;

  const configRoles = configuredPermissions && configuredPermissions.length > 0
    ? configuredPermissions
    : [...DEFAULT_AI_TRIAGE_PERMISSIONS];

  // Convert config roles (lowercase strings) to UserRole enum values
  return configRoles
    .map(mapConfigRoleToUserRole)
    .filter((role: UserRole | null): role is UserRole => role !== null);
}
