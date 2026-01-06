import type { UserRole } from "@stride/types";

/**
 * Permission checking utilities for role-based access control
 */

export enum Permission {
  // User management
  CREATE_USER = "create_user",
  UPDATE_USER = "update_user",
  DELETE_USER = "delete_user",
  VIEW_USER = "view_user",

  // Project management
  CREATE_PROJECT = "create_project",
  UPDATE_PROJECT = "update_project",
  DELETE_PROJECT = "delete_project",
  VIEW_PROJECT = "view_project",
  MANAGE_PROJECT_CONFIG = "manage_project_config", // Admin only

  // Issue management
  CREATE_ISSUE = "create_issue",
  UPDATE_ISSUE = "update_issue",
  DELETE_ISSUE = "delete_issue",
  VIEW_ISSUE = "view_issue",
  ASSIGN_ISSUE = "assign_issue",

  // Cycle/Sprint management
  CREATE_CYCLE = "create_cycle",
  UPDATE_CYCLE = "update_cycle",
  DELETE_CYCLE = "delete_cycle",
  VIEW_CYCLE = "view_cycle",

  // Repository management
  CONNECT_REPOSITORY = "connect_repository",
  MANAGE_REPOSITORY = "manage_repository",
}

/**
 * Role-based permission mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Admin: [
    // Admins have all permissions
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.VIEW_USER,
    Permission.CREATE_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.VIEW_PROJECT,
    Permission.MANAGE_PROJECT_CONFIG,
    Permission.CREATE_ISSUE,
    Permission.UPDATE_ISSUE,
    Permission.DELETE_ISSUE,
    Permission.VIEW_ISSUE,
    Permission.ASSIGN_ISSUE,
    Permission.CREATE_CYCLE,
    Permission.UPDATE_CYCLE,
    Permission.DELETE_CYCLE,
    Permission.VIEW_CYCLE,
    Permission.CONNECT_REPOSITORY,
    Permission.MANAGE_REPOSITORY,
  ],
  Member: [
    // Members can create and edit issues, view projects
    Permission.VIEW_USER,
    Permission.VIEW_PROJECT,
    Permission.CREATE_ISSUE,
    Permission.UPDATE_ISSUE,
    Permission.VIEW_ISSUE,
    Permission.ASSIGN_ISSUE,
    Permission.VIEW_CYCLE,
    Permission.CONNECT_REPOSITORY,
  ],
  Viewer: [
    // Viewers have read-only access
    Permission.VIEW_USER,
    Permission.VIEW_PROJECT,
    Permission.VIEW_ISSUE,
    Permission.VIEW_CYCLE,
  ],
};

/**
 * Check if a role has a specific permission
 * @param role - User role
 * @param permission - Permission to check
 * @returns True if role has permission, false otherwise
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role can perform an action (convenience function)
 * @param role - User role
 * @param action - Action name (e.g., "create_issue")
 * @returns True if role can perform action, false otherwise
 */
export function canPerformAction(
  role: UserRole,
  action: string,
): boolean {
  // Try to match action to permission enum
  const permission = Object.values(Permission).find(
    (p) => p.toLowerCase() === action.toLowerCase(),
  );

  if (!permission) {
    // Unknown action, default to false for safety
    return false;
  }

  return hasPermission(role, permission);
}

/**
 * Require a specific permission, throw error if not granted
 * @param role - User role
 * @param permission - Required permission
 * @throws Error if permission is not granted
 */
export function requirePermission(
  role: UserRole,
  permission: Permission,
): void {
  if (!hasPermission(role, permission)) {
    throw new Error(
      `Permission denied: ${permission} requires a higher role than ${role}`,
    );
  }
}

/**
 * Check if user can create or edit issues (Member+)
 * @param role - User role
 * @returns True if user can create/edit issues
 */
export function canCreateOrEditIssues(role: UserRole): boolean {
  return (
    hasPermission(role, Permission.CREATE_ISSUE) ||
    hasPermission(role, Permission.UPDATE_ISSUE)
  );
}

/**
 * Check if user can manage project configuration (Admin only)
 * @param role - User role
 * @returns True if user can manage project config
 */
export function canManageProjectConfig(role: UserRole): boolean {
  return hasPermission(role, Permission.MANAGE_PROJECT_CONFIG);
}

/**
 * Check if user can create issues (Member+)
 * @param role - User role
 * @returns True if user can create issues
 */
export function canCreateIssue(role: UserRole): boolean {
  return hasPermission(role, Permission.CREATE_ISSUE);
}

/**
 * Check if user can update issues (Member+)
 * @param role - User role
 * @returns True if user can update issues
 */
export function canUpdateIssue(role: UserRole): boolean {
  return hasPermission(role, Permission.UPDATE_ISSUE);
}

/**
 * Check if user can delete issues (Admin only)
 * @param role - User role
 * @returns True if user can delete issues
 */
export function canDeleteIssue(role: UserRole): boolean {
  return hasPermission(role, Permission.DELETE_ISSUE);
}

/**
 * Check if user can view issues (all roles)
 * @param role - User role
 * @returns True if user can view issues
 */
export function canViewIssue(role: UserRole): boolean {
  return hasPermission(role, Permission.VIEW_ISSUE);
}

/**
 * Check if user can create cycles (Admin only)
 * @param role - User role
 * @returns True if user can create cycles
 */
export function canCreateCycle(role: UserRole): boolean {
  return hasPermission(role, Permission.CREATE_CYCLE);
}

/**
 * Check if user can update cycles (Admin only)
 * @param role - User role
 * @returns True if user can update cycles
 */
export function canUpdateCycle(role: UserRole): boolean {
  return hasPermission(role, Permission.UPDATE_CYCLE);
}

/**
 * Check if user can delete cycles (Admin only)
 * @param role - User role
 * @returns True if user can delete cycles
 */
export function canDeleteCycle(role: UserRole): boolean {
  return hasPermission(role, Permission.DELETE_CYCLE);
}

/**
 * Check if user can view cycles (all roles)
 * @param role - User role
 * @returns True if user can view cycles
 */
export function canViewCycle(role: UserRole): boolean {
  return hasPermission(role, Permission.VIEW_CYCLE);
}

