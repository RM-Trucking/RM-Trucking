import { AuthorizationRoleKind } from '../../entities/authorization';

export const buildPermissionKey = (moduleKey: string, resourceKey: string, actionKey: string): string =>
  `${moduleKey}:${resourceKey}:${actionKey}`.toUpperCase();

export const normalizePermissionKey = (permissionKey: string): string => permissionKey.trim().toUpperCase();

export const isEmployeeUser = (userType: AuthorizationRoleKind): boolean => userType === 'EMPLOYEE';

export const isCustomerUser = (userType: AuthorizationRoleKind): boolean => userType === 'CUSTOMER';

export const canAccessCustomerData = (
  userType: AuthorizationRoleKind,
  userCustomerId: number | null,
  targetCustomerId: number | null,
): boolean => {
  if (userType === 'EMPLOYEE') {
    return true;
  }

  return userCustomerId !== null && userCustomerId === targetCustomerId;
};

export const isCustomerReadOnly = (userType: AuthorizationRoleKind): boolean => userType === 'CUSTOMER';
