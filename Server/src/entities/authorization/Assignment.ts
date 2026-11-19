import { AuthorizationStatus } from './User';

export interface UserRoleAssignment {
  userId: number;
  roleId: number;
  assignmentStatus: AuthorizationStatus;
  validFrom: Date;
  validTo: Date | null;
  grantedBy: number | null;
  reason: string | null;
  createdAt: Date;
}

export interface RolePermission {
  roleId: number;
  permissionCode: string;
  grantedBy: number | null;
  createdAt: Date;
}

export interface RoleHierarchyLink {
  parentRoleId: number;
  childRoleId: number;
  createdBy: number | null;
  createdAt: Date;
}
