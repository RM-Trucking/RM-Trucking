import { AuthorizationRoleKind, AuthorizationStatus } from './User';

export interface Role {
  roleId: number;
  name: string;
  description: string | null;
  roleKind: AuthorizationRoleKind;
  status: AuthorizationStatus;
  isSystemManaged: 'Y' | 'N';
  createdBy: number | null;
  createdAt: Date;
  updatedBy: number | null;
  updatedAt: Date;
}
