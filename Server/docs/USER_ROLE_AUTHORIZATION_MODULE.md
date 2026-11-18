# User and Role Authorization Module

This module is implemented as an isolated, backward-compatible authorization layer. It does not modify the existing maintenance login flow or the current warehouse business logic. It is designed to coexist with the current application while exposing user management, role management, RBAC, authentication, and password reset APIs in a separate implementation boundary.

## Security model

- Role-based access control is enforced by mapping permissions to roles.
- User-to-role assignments are stored separately from the legacy user table.
- Customer users are restricted to their own customer scope.
- Employee users can access broader operational data.
- Password reset follows a secure token workflow with expiry and validation.

## Email procedure

The email send flow follows the standard warehouse application procedure:

1. Generate a password reset token.
2. Build a secure reset link.
3. Send the email using the configured SMTP settings.
4. Validate token expiry before password reset.

The email logic is encapsulated in the warehouse email service and does not touch the current user flow.

## Example payloads

### Role create

```json
{
  "roleCode": "CUSTOMER_MANAGER",
  "name": "Customer Manager",
  "description": "Manages customer records and service access",
  "roleKind": "EMPLOYEE",
  "status": "ACTIVE"
}
```

### User create

```json
{
  "userName": "John Doe",
  "loginUserName": "john.doe",
  "email": "john.doe@warehouse.local",
  "password": "MySecurePass123",
  "userType": "EMPLOYEE",
  "customerId": 1001,
  "roleIds": [1, 2]
}
```

### Login

```json
{
  "loginUserName": "john.doe",
  "password": "MySecurePass123"
}
```

### Refresh token

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

### Forgot password

```json
{
  "email": "john.doe@warehouse.local"
}
```

### Reset password

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "newPassword": "NewSecurePass456"
}
```

## Response standards

All endpoints return a consistent envelope:

```json
{
  "success": true,
  "data": { ... }
}
```

Failure responses follow:

```json
{
  "success": false,
  "message": "Reason for failure"
}
```

## Notes

This is intentionally isolated from the current maintenance router so no current functionality, API behavior, or business flow is modified.
