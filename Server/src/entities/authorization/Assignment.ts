export interface UserRoleAssignment {
  userId: number;
  roleId: number;
  grantedBy: number | null;
  createdAt: Date;
}

export interface UserStationAssignment {
  userId: number;
  stationId: number;
  createdBy: number | null;
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
