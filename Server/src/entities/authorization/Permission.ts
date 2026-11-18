import { AuthorizationStatus } from './User';

export interface Permission {
  permissionId: number;
  permissionKey: string;
  moduleKey: string;
  resourceKey: string;
  actionKey: string;
  description: string | null;
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: AuthorizationStatus;
}
