# Maintenance Module - API Routes Documentation

## Overview

The maintenance module has been refactored from a monolithic 512-line file into a modular, organized structure with 4 sub-routers (auth, user, role, permission) combined via a main index router.

## Route Structure

```
/src/routes/maintenance/
├── index.ts         (Main router - combines all sub-routers)
├── auth.ts          (Authentication routes)
├── user.ts          (User management routes)
├── role.ts          (Role management routes)
└── permission.ts    (Permission routes)
```

## API Endpoints

### Base Path: `/api/maintenance`

### Authentication Routes (`/auth`)

- **POST** `/api/maintenance/auth/login` - User login (returns JWT token)
  - Body: `{ loginUserName: string, password: string }`
  - Response: `{ token: string, user: UserResponse }`

### User Routes (`/users`)

All endpoints require JWT authentication.

- **POST** `/api/maintenance/users` - Create new user (auto-generates password)

  - Body: `{ userName, loginUserName, email, roleId, userType, customerId? }`
  - Response: `{ userId, userName, loginUserName, tempPassword, ... }`

- **GET** `/api/maintenance/users` - Get all users (paginated)

  - Query params: `limit?, offset?`
  - Response: `{ users: UserResponse[], total: number }`

- **GET** `/api/maintenance/users/{userId}` - Get user by ID

  - Response: `UserResponse`

- **PUT** `/api/maintenance/users/{userId}` - Update user

  - Body: `{ userName?, email?, roleId?, activeStatus?, customerId? }`
  - Response: `{ success: boolean, message: string }`

- **POST** `/api/maintenance/users/{userId}/change-password` - Change user password

  - Body: `{ oldPassword: string, newPassword: string }`
  - Response: `{ success: boolean, message: string }`

- **POST** `/api/maintenance/users/{userId}/reset-password` - Reset password (Admin only)

  - Response: `{ userId, tempPassword: string, message: string }`

- **DELETE** `/api/maintenance/users/{userId}` - Delete user (Admin only)

  - Response: `{ success: boolean, message: string }`

- **GET** `/api/maintenance/users/role/{roleId}` - Get users by role
  - Response: `{ users: UserResponse[] }`

### Role Routes (`/roles`)

All endpoints require JWT authentication.

- **POST** `/api/maintenance/roles` - Create new role

  - Body: `{ roleName: string }`
  - Response: `{ roleId, roleName, createdAt, ... }`

- **GET** `/api/maintenance/roles` - Get all roles

  - Response: `{ roles: RoleResponse[] }`

- **GET** `/api/maintenance/roles/{roleId}` - Get role by ID (includes permissions)

  - Response: `RoleResponse`

- **PUT** `/api/maintenance/roles/{roleId}` - Update role

  - Body: `{ roleName: string }`
  - Response: `{ success: boolean, message: string }`

- **DELETE** `/api/maintenance/roles/{roleId}` - Delete role
  - Response: `{ success: boolean, message: string }`

### Permission Routes (`/permissions`)

All endpoints require JWT authentication.

- **GET** `/api/maintenance/permissions` - Get all permissions

  - Response: `{ permissions: PermissionResponse[] }`

- **GET** `/api/maintenance/permissions/{permissionId}` - Get permission by ID

  - Response: `PermissionResponse`

- **GET** `/api/maintenance/permissions/module/{moduleName}` - Get permissions by module

  - Response: `{ permissions: PermissionResponse[] }`

- **POST** `/api/maintenance/permissions/init` - Initialize permissions (populate DB with static permissions)

  - Response: `{ success: boolean, message: string, initialized: number }`

- **GET** `/api/maintenance/roles/{roleId}/permissions` - Get permissions assigned to role

  - Response: `{ permissions: PermissionResponse[] }`

- **POST** `/api/maintenance/roles/{roleId}/permissions` - Assign permission(s) to role

  - Body (single): `{ permissionId: number }`
  - Body (multiple): `{ permissionIds: number[] }`
  - Response: `{ success: boolean, message: string }`

- **DELETE** `/api/maintenance/roles/{roleId}/permissions/{permissionId}` - Remove permission from role
  - Response: `{ success: boolean, message: string }`

## Authentication

Most endpoints require JWT Bearer token authentication. Include in request header:

```
Authorization: Bearer <token>
```

Tokens are obtained via the login endpoint and are valid for 24 hours.

## Static Permissions

The system includes 32 predefined permissions across 8 modules:

- **User Module**: view, create, edit, delete
- **Role Module**: view, create, edit, delete, manage
- **Permission Module**: view, assign, manage
- **Customer Module**: view, create, edit, delete
- **Carrier Module**: view, create, edit, delete
- **Station Module**: view, create, edit, delete
- **Rate Module**: view, create, edit, delete
- **Shipment Module**: view, create, edit, delete

These are defined in `/src/entities/maintenance/Permission.ts` and can be synchronized with the database using the `/permissions/init` endpoint.

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200** - Success
- **400** - Bad Request (validation error)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource not found)
- **500** - Internal Server Error

Error responses include a message field: `{ error: string, message?: string }`

## Connection Management

Each route file implements connection management via:

- `getConnection()` function that creates ODBC connection from environment variables
- Try/finally blocks to ensure connections are properly closed
- Support for environment variables: `DB2_CONNECTION_STRING` or `DATABASE_CONNECTION_STRING`
- Default fallback connection string for development

## Refactoring Summary

**Old Structure**: 1 monolithic file (512 lines)

- `/src/routes/maintenance.ts` - All routes in single file

**New Structure**: Organized modular approach (5 files)

- `/src/routes/maintenance/index.ts` - Main router (combines all sub-routers)
- `/src/routes/maintenance/auth.ts` - Authentication (50 lines)
- `/src/routes/maintenance/user.ts` - User management (263 lines)
- `/src/routes/maintenance/role.ts` - Role management (140 lines)
- `/src/routes/maintenance/permission.ts` - Permission handling (178 lines)

**Benefits**:
✅ Improved code organization by responsibility
✅ Easier to locate and modify specific functionality
✅ Better separation of concerns
✅ More maintainable and testable
✅ Consistent connection management pattern
✅ Clear routing hierarchy
✅ All Swagger documentation preserved
