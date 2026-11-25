export type AuthorizationStatus = 'ACTIVE' | 'INACTIVE';

export type AuthorizationRoleKind = 'EMPLOYEE' | 'CUSTOMER';

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

export interface PasswordResetOtp {
    resetOtpId: number;
    userId: number;
    otpHash: string;
    createdAt: Date;
    expiresAt: Date;
    attemptCount: number;
    status: 'PENDING' | 'CONSUMED' | 'INVALIDATED' | 'LOCKED';
    consumedAt: Date | null;
}

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
    permissionId: number;
    grantedBy: number | null;
    createdAt: Date;
}

export interface RoleHierarchyLink {
    parentRoleId: number;
    childRoleId: number;
    createdBy: number | null;
    createdAt: Date;
}

export interface AuditLog {
    auditId: number;
    actorUserId: number | null;
    subjectUserId: number | null;
    eventType: string;
    objectType: string;
    objectId: string | null;
    outcome: 'SUCCESS' | 'DENIED' | 'FAILURE';
    reason: string | null;
    requestId: string | null;
    sourceIp: string | null;
    occurredAt: Date;
    details: Record<string, unknown> | null;
}