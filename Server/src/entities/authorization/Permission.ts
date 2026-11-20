export interface Permission {
  permissionId: number;
  permissionCode: string;
  displayName: string;
  applicationCode: PermissionApplicationCode;
  permissionKey: string;
  moduleKey: string;
  resourceKey: string;
  actionKey: string;
  description: string | null;
  forEmployee: 'Y' | 'N';
  forCustomer: 'Y' | 'N';
}

export type PermissionApplicationCode = 'warehouse' | 'maintenance' | 'network_services';
