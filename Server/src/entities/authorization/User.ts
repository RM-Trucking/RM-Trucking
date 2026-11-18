export type AuthorizationRoleKind = 'EMPLOYEE' | 'CUSTOMER';
export type AuthorizationStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  userId: number;
  userName: string;
  loginUserName: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  createdBy: number | null;
  activeStatus: 'Y' | 'N';
  userType: AuthorizationRoleKind;
  customerId: number | null;
}
