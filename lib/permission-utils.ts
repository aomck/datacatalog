import type {
  PermissionResponse,
  ActionPermission,
  DataPermission,
} from '@/types';

/**
 * Check if user has a specific action permission for a route
 * Also checks for "all" action which bypasses everything
 */
export function checkActionPermission(
  permissions: PermissionResponse | null,
  service: string,
  route: string,
  action: 'create' | 'view' | 'update' | 'delete' | 'approve'
): boolean {
  if (!permissions) return false;

  const actionPerm = permissions.action_permission?.[service]?.[route];

  // Check for "all" action first (bypasses everything)
  if ((actionPerm as any)?.all === true) return true;

  return (actionPerm as any)?.[action] === true;
}

/**
 * Check if user has at least one action permission for a route
 * Used to determine if menu item should be visible
 * Also checks for "all" action
 */
export function hasAnyAction(
  permissions: PermissionResponse | null,
  service: string,
  route: string
): boolean {
  if (!permissions) return false;

  const actionPerm = permissions.action_permission?.[service]?.[route];
  if (!actionPerm) return false;

  // Check for "all" action first
  if ((actionPerm as any)?.all === true) return true;

  return (
    actionPerm.create === true ||
    actionPerm.view === true ||
    actionPerm.update === true ||
    actionPerm.delete === true ||
    actionPerm.approve === true
  );
}

/**
 * Get all action permissions for a route
 */
export function getActionPermissions(
  permissions: PermissionResponse | null,
  service: string,
  route: string
): ActionPermission {
  if (!permissions) {
    return {
      create: false,
      view: false,
      update: false,
      delete: false,
      approve: false,
    };
  }

  const actionPerm = permissions.action_permission?.[service]?.[route];
  return {
    create: (actionPerm as any)?.create === true,
    view: (actionPerm as any)?.view === true,
    update: (actionPerm as any)?.update === true,
    delete: (actionPerm as any)?.delete === true,
    approve: (actionPerm as any)?.approve === true,
  };
}

/**
 * Check data permission level
 */
export function checkDataPermission(
  permissions: PermissionResponse | null,
  service: string,
  route: string
): DataPermission {
  if (!permissions) {
    return {
      own: false,
      unit: false,
      all: false,
    };
  }

  const dataPerm = permissions.data_permission?.[service]?.[route];
  return {
    own: dataPerm?.own === true,
    unit: dataPerm?.unit === true,
    all: dataPerm?.all === true,
  };
}

/**
 * Get the highest data permission level
 * Returns: 'all' | 'unit' | 'own' | 'none'
 */
export function getDataPermissionLevel(
  permissions: PermissionResponse | null,
  service: string,
  route: string
): 'all' | 'unit' | 'own' | 'none' {
  const dataPerm = checkDataPermission(permissions, service, route);

  if (dataPerm.all) return 'all';
  if (dataPerm.unit) return 'unit';
  if (dataPerm.own) return 'own';
  return 'none';
}

/**
 * Check if user can access a page
 * Page is accessible if user has at least read permission
 */
export function canAccessPage(
  permissions: PermissionResponse | null,
  service: string,
  route: string
): boolean {
  return hasAnyAction(permissions, service, route);
}

/**
 * Check if user has admin permission
 * datacatalog.admin.[create, view, update, delete]
 */
export function checkAdminPermission(
  permissions: PermissionResponse | null,
  action?: 'create' | 'view' | 'update' | 'delete' | 'approve'
): boolean {
  if (!action) {
    return hasAnyAction(permissions, 'datacatalog', 'admin');
  }
  return checkActionPermission(permissions, 'datacatalog', 'admin', action);
}

/**
 * Check if user has approve permission
 * datacatalog.approve.approve
 */
export function checkApprovePermission(
  permissions: PermissionResponse | null
): boolean {
  return checkActionPermission(permissions, 'datacatalog', 'approve', 'approve');
}
