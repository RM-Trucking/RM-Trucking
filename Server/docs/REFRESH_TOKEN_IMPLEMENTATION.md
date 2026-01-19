# Refresh Token Implementation Guide

## Overview

A complete JWT refresh token authentication system has been implemented to provide secure, scalable session management with the ability to maintain long-lived sessions while keeping access tokens short-lived.

## Architecture

### Key Components

#### 1. **Database Table** (Required)

You need to create the following table in your database:

```sql
CREATE TABLE RANDM_TST.REFRESHTOKEN (
    REFRESHTOKENID INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    USERID INT NOT NULL,
    TOKEN VARCHAR(256) NOT NULL,
    EXPIRESAT TIMESTAMP NOT NULL,
    CREATEDAT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (USERID) REFERENCES RANDM_TST.USER(USERID) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IDX_REFRESHTOKEN_USERID_TOKEN ON RANDM_TST.REFRESHTOKEN(USERID, TOKEN);
```

#### 2. **Token Configuration** (Environment Variables)

Add these to your `.env` file:

```env
# JWT Access Token
TOKEN_SECRET=your-secret-key-change-this
JWT_EXPIRY=15m  # Short-lived (15 minutes recommended)

# JWT Refresh Token
REFRESH_SECRET=your-refresh-secret-key-change-this
REFRESH_EXPIRY=7d  # Long-lived (7 days recommended)
```

### Expiration Strategy

- **Access Token**: 15 minutes (short-lived, reduces security risk if compromised)
- **Refresh Token**: 7 days (long-lived, allows extended sessions without re-authentication)

The refresh token is stored securely in the database with an expiration timestamp, allowing validation before token refresh.

## API Endpoints

### 1. Login - Get Initial Tokens

**Endpoint**: `POST /api/maintenance/auth/login`

**Request**:

```json
{
  "loginUserName": "admin",
  "password": "password123"
}
```

**Response (200 - Success)**:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z...",
    "user": {
      "userId": 1,
      "userName": "Admin User",
      "loginUserName": "admin",
      "email": "admin@example.com",
      "roleId": 1
    }
  }
}
```

### 2. Refresh Access Token

**Endpoint**: `POST /api/maintenance/auth/refresh`

**Headers**:

```
Authorization: Bearer <current_access_token>
```

**Request**:

```json
{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z..."
}
```

**Response (200 - Success)**:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Logout (Single Device)

**Endpoint**: `POST /api/maintenance/auth/logout`

**Headers**:

```
Authorization: Bearer <access_token>
```

**Request**:

```json
{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z..."
}
```

**Response (200 - Success)**:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 4. Logout from All Devices

**Endpoint**: `POST /api/maintenance/auth/logout-all`

**Headers**:

```
Authorization: Bearer <access_token>
```

**Response (200 - Success)**:

```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

## Client Implementation Examples

### JavaScript/TypeScript Example

```typescript
// Store tokens after login
function handleLogin(response: any) {
  localStorage.setItem("accessToken", response.data.accessToken);
  localStorage.setItem("refreshToken", response.data.refreshToken);
}

// Attach access token to requests
function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token}`,
  };
}

// Refresh token when access token expires
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  const response = await fetch("/api/maintenance/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("accessToken", data.data.accessToken);
    return data.data.accessToken;
  } else {
    // Refresh token invalid - user needs to login again
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  }
}

// Logout
async function logout() {
  const refreshToken = localStorage.getItem("refreshToken");
  const response = await fetch("/api/maintenance/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({ refreshToken }),
  });

  // Clear tokens regardless of response
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
}
```

### Axios Interceptor Example

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Request interceptor - attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(
          "/api/maintenance/auth/refresh",
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        const newAccessToken = response.data.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

## Security Considerations

### Best Practices Implemented

1. **Separate Token Storage**

   - Access tokens are short-lived (15 minutes)
   - Refresh tokens are long-lived (7 days)
   - Refresh tokens are stored securely in the database

2. **Token Revocation**

   - Refresh tokens can be revoked individually (logout from single device)
   - All refresh tokens can be revoked at once (logout from all devices)
   - Expired tokens are automatically rejected

3. **Secure Generation**
   - Refresh tokens are generated using `crypto.randomBytes(32).toString('hex')`
   - Creates 64-character cryptographically secure random strings

### Recommendations

1. **Client-Side**

   - Store access tokens in memory or session storage (NOT localStorage if sensitive)
   - Store refresh tokens in httpOnly cookies or secure storage
   - Implement token refresh before expiration

2. **Server-Side**

   - Always validate refresh token against the database
   - Check token expiration timestamp
   - Validate user is still active before issuing new access token
   - Use HTTPS in production

3. **Token Management**
   - Implement token rotation (issue new refresh token on refresh)
   - Monitor for suspicious token refresh patterns
   - Set appropriate expiration times based on security requirements
   - Clean up expired tokens periodically

## Database Cleanup

To remove expired refresh tokens periodically, create a maintenance task:

```sql
-- Delete expired refresh tokens (can be run daily)
DELETE FROM RANDM_TST.REFRESHTOKEN
WHERE EXPIRESAT < CURRENT_TIMESTAMP;
```

## Files Modified/Created

### Modified Files

- `src/services/maintenance/user.ts` - Added refresh token logic
- `src/controllers/maintenance/user.ts` - Added refresh token endpoints
- `src/database/maintenance/user.ts` - Added refresh token database functions
- `src/routes/maintenance/auth.ts` - Added refresh token routes
- `src/types/maintenance/index.ts` - Updated authentication types

### New Functionality

- `loginUser()` - Now returns both access and refresh tokens
- `refreshAccessToken()` - Validates and refreshes access tokens
- `logoutUser()` - Revokes a single refresh token
- `logoutFromAllDevices()` - Revokes all user's refresh tokens
- `storeRefreshToken()` - Stores refresh token in database
- `getRefreshToken()` - Validates refresh token existence and expiration
- `revokeRefreshToken()` - Deletes specific refresh token
- `revokeAllRefreshTokens()` - Deletes all user's refresh tokens

## Error Handling

### Common Error Responses

**Invalid Refresh Token**:

```json
{
  "error": "Failed to refresh token",
  "message": "Invalid or expired refresh token"
}
```

**Missing Refresh Token**:

```json
{
  "error": "Refresh token is required"
}
```

**Inactive User**:

```json
{
  "error": "Failed to refresh token",
  "message": "User account is inactive"
}
```

## Testing the Implementation

### 1. Login

```bash
curl -X POST http://localhost:3000/api/maintenance/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginUserName":"admin","password":"password"}'
```

### 2. Use Access Token

```bash
curl -X GET http://localhost:3000/api/maintenance/users \
  -H "Authorization: Bearer <access_token>"
```

### 3. Refresh Token

```bash
curl -X POST http://localhost:3000/api/maintenance/auth/refresh \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

### 4. Logout

```bash
curl -X POST http://localhost:3000/api/maintenance/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

## Next Steps

1. **Create the REFRESHTOKEN table** in your database
2. **Set environment variables** for token secrets and expiry
3. **Update frontend** to use the new authentication endpoints
4. **Implement token refresh** in axios interceptor or similar
5. **Test the flow** using the provided curl examples
6. **Monitor** token refresh patterns for security issues

## Troubleshooting

### Issue: "Invalid or expired refresh token"

- Verify the refresh token hasn't expired (7 days by default)
- Check that the token matches what's stored in the database
- Ensure REFRESHTOKEN table exists and has data

### Issue: "User ID not found in token"

- Access token may be malformed
- Verify access token was issued by the login endpoint
- Check JWT_SECRET environment variable matches

### Issue: Database connection errors

- Ensure REFRESHTOKEN table exists
- Verify database connection string
- Check user has permissions to create/read/write to table
