/**
 * User Entity
 * Represents a user in the system
 */
export interface User {
    userId: number;
    userName: string;
    loginUserName: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    createdBy: number | null;
    activeStatus: 'Y' | 'N';
    roleId: number;
    userType: 'EMPLOYEE' | 'CUSTOMER';
    customerId: number | null;
}

/**
 * User creation request
 */
export interface CreateUserRequest {
    userName: string;
    loginUserName: string;
    email: string;
    loginPassword: string; // Will be hashed using PBKDF2
    roleId?: number;
    userType: 'EMPLOYEE' | 'CUSTOMER';
    customerId?: number | null;
}

/**
 * User update request
 */
export interface UpdateUserRequest {
    userId: number;
    userName?: string;
    loginUserName?: string;
    email?: string;
    roleId?: number;
    userType?: 'EMPLOYEE' | 'CUSTOMER';
    customerId?: number | null;
}

/**
 * User password reset request
 */
export interface ResetPasswordRequest {
    userId: number;
    newPassword: string;
}

/**
 * User login request
 */
export interface LoginRequest {
    loginUserName: string;
    password: string;
}

/**
 * User response (without sensitive data)
 */
export interface UserResponse {
    userId: number;
    userName: string;
    loginUserName: string;
    email: string;
    createdAt: Date;
    createdBy: number | null;
    activeStatus: 'Y' | 'N';
    roleId: number;
    roleName?: string;
    userType: 'EMPLOYEE' | 'CUSTOMER';
    customerId: number | null;
    customerName?: string;
}
