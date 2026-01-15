/**
 * Access control utilities for AI configuration assistant
 * Role-based permissions with project opt-in configuration
 */

import type { ProjectConfig } from "@stride/types";
import { UserRole } from "@stride/types";

/**
 * Default assistant permissions (lowercase from config)
 * Admin only by default if not configured
 */
const DEFAULT_ASSISTANT_PERMISSIONS = ["admin"] as const;

/**
 * Map config role string (lowercase) to UserRole enum (capitalized)
 */
function mapConfigRoleToUserRole(configRole: string): UserRole | null {
  const roleMap: Record<string, UserRole> = {
    admin: UserRole.Admin,
    member: UserRole.Member,
    viewer: UserRole.Viewer,
  };

  return roleMap[configRole.toLowerCase()] || null;
}

/**
 * Map UserRole enum to config role string (lowercase)
 * Handles both enum values and string values for robustness
 */
function mapUserRoleToConfigRole(userRole: UserRole | string): string {
  // Handle enum values
  if (userRole === UserRole.Admin) return "admin";
  if (userRole === UserRole.Member) return "member";
  if (userRole === UserRole.Viewer) return "viewer";
  
  // Handle string values (case-insensitive)
  const roleString = String(userRole).toLowerCase();
  if (roleString === 'admin') return "admin";
  if (roleString === 'member') return "member";
  if (roleString === 'viewer') return "viewer";

  // Default fallback
  return "viewer";
}

/**
 * Check if user has permission to use project configuration assistant
 * Reads assistant_config.permissions from project config (if configured)
 * Defaults to admin-only if not configured
 * 
 * Note: Config uses lowercase strings ('admin', 'member', 'viewer'),
 * but UserRole enum uses capitalized values ('Admin', 'Member', 'Viewer')
 * 
 * @param userRole - User's role (enum value)
 * @param projectConfig - Project configuration (optional)
 * @returns true if user has permission, false otherwise
 */
export function canUseProjectAssistant(
  userRole: UserRole | string,
  projectConfig?: ProjectConfig | null
): boolean {
  // Check if assistant is enabled for the project
  // Future: projectConfig?.assistant_config?.enabled === false would disable it
  // For now, we assume enabled if config exists or defaults to enabled

  // Get permissions from config (lowercase strings: 'admin', 'member', 'viewer')
  // Future: assistant_config will be added to schema similar to ai_triage_config
  // For now, we default to admin-only
  const configuredPermissions =
    projectConfig && 
    projectConfig !== null && 
    typeof projectConfig === 'object' && 
    'assistant_config' in projectConfig
      ? (projectConfig as any).assistant_config?.permissions
      : undefined;

  // Use configured permissions or default to admin only
  const isUsingDefaultPermissions = !configuredPermissions || 
    !Array.isArray(configuredPermissions) || 
    configuredPermissions.length === 0;
  
  const allowedConfigRoles =
    isUsingDefaultPermissions
      ? [...DEFAULT_ASSISTANT_PERMISSIONS]
      : configuredPermissions;

  // Quick check: If using default permissions and user is Admin, always allow
  if (isUsingDefaultPermissions) {
    const isAdmin = userRole === UserRole.Admin || 
                    userRole === 'Admin' || 
                    userRole === 'admin' ||
                    String(userRole).toLowerCase() === 'admin';
    
    if (isAdmin) {
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[canUseProjectAssistant] Admin user with default permissions - allowing access');
      }
      return true;
    }
  }

  // Convert user role to config role string for comparison
  // Handle both enum values and string values
  const userConfigRole = mapUserRoleToConfigRole(userRole);

  // Normalize allowed roles to lowercase for comparison
  const normalizedAllowedRoles = allowedConfigRoles.map(role => 
    typeof role === 'string' ? role.toLowerCase() : String(role).toLowerCase()
  );

  // Check if user role is in allowed list
  const hasPermission = normalizedAllowedRoles.includes(userConfigRole);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[canUseProjectAssistant]', {
      userRole,
      userRoleType: typeof userRole,
      userConfigRole,
      configuredPermissions,
      allowedConfigRoles,
      normalizedAllowedRoles,
      hasPermission,
      projectConfigExists: !!projectConfig,
      projectConfigType: typeof projectConfig,
    });
  }

  return hasPermission;
}

/**
 * Check if user has permission to use infrastructure assistant
 * Infrastructure assistant always requires system admin role (non-configurable)
 * 
 * @param userRole - User's role (enum value)
 * @returns true if user is system admin, false otherwise
 */
export function canUseInfrastructureAssistant(userRole: UserRole): boolean {
  // Infrastructure assistant is admin-only, non-configurable
  return userRole === UserRole.Admin;
}

/**
 * Get assistant permission configuration for a project
 * Returns the configured permissions or default (as UserRole enum values)
 * 
 * @param projectConfig - Project configuration
 * @returns Array of allowed roles (enum values)
 */
export function getAssistantPermissions(
  projectConfig?: ProjectConfig
): UserRole[] {
  // Future: assistant_config will be added to schema similar to ai_triage_config
  const configuredPermissions = (projectConfig as any)?.assistant_config
    ?.permissions;

  const configRoles =
    configuredPermissions && configuredPermissions.length > 0
      ? configuredPermissions
      : [...DEFAULT_ASSISTANT_PERMISSIONS];

  // Convert config roles (lowercase strings) to UserRole enum values
  return configRoles
    .map(mapConfigRoleToUserRole)
    .filter((role: UserRole | null): role is UserRole => role !== null);
}

/**
 * Check access control for assistant based on context type
 * Convenience function that routes to the appropriate permission check
 * 
 * @param userRole - User's role
 * @param contextType - Context type ('project' or 'infrastructure')
 * @param projectConfig - Project configuration (required for project context)
 * @returns true if user has permission, false otherwise
 */
export function canUseAssistant(
  userRole: UserRole,
  contextType: "project" | "infrastructure",
  projectConfig?: ProjectConfig
): boolean {
  if (contextType === "infrastructure") {
    return canUseInfrastructureAssistant(userRole);
  }

  // Project context - canUseProjectAssistant handles null/undefined and defaults to admin-only
  return canUseProjectAssistant(userRole, projectConfig);
}
