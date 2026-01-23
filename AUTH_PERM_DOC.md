# Authentication & Permission System Documentation

This document describes the authentication and permission system for the Maholan User Service API. This guide is intended for AI agents and frontend developers integrating with the backend.

---

## Table of Contents
1. [Authentication System](#authentication-system)
2. [Permission System](#permission-system)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Request/Response Examples](#requestresponse-examples)

---

## Authentication System

### Overview
The system supports multiple authentication methods:
- **Local Login** (username/password)
- **Google OAuth**
- **Active Directory (AD)**
- **RDP (Remote Desktop Protocol) SSO**
- **LINE Login**

### Token Types
- **Access Token (JWT)**: Short-lived token for API authentication
- **Refresh Token**: Long-lived token to obtain new access tokens

### Token Configuration
- Access token expiry: Defined in `JWT_EXPIRE_IN` environment variable
- Refresh token expiry: Defined in `JWT_REFRESH_TOKEN_EXPIRATION` environment variable
- JWT Secret: `JWT_SECRET`
- Refresh Token Secret: `JWT_REFRESH_TOKEN_SECRET`

---

## Authentication Endpoints

### 1. Local Login
**Endpoint:** `POST /auth/local`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "user_line_id": "optional_line_id"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "LOGIN_AUTH_WITH_LOCAL_OK",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null,
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

**Notes:**
- Email is case-insensitive (converted to lowercase)
- Only active users (status = 1) can login
- Password is hashed using bcrypt
- Audit trail is automatically recorded with device info and IP

---

### 2. LINE Login
**Endpoint:** `POST /auth/line`

**Request Body:** Same as local login
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response:** Same as local login

---

### 3. Active Directory Login
**Endpoint:** `POST /auth/active-directory`

**Request Body:**
```json
{
  "email": "user@rtarf.mi.th",
  "password": "adpassword"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "LOGIN_AUTH_WITH_LOCAL_OK",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null,
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

**Notes:**
- Authenticates against `ldap://10.104.117.90` (RTARF AD)
- Auto-creates user if doesn't exist
- New users get default unit: `e675fb85-17f7-4e38-bab0-2f5fbef44657`
- New users get default role: `076d1d27-88f7-4832-b1a4-10e3bd384737`
- SSO field set to `'ad'`

---

### 4. RDP Login
**Endpoint:** `POST /auth/rdp`

**Request Body:**
```json
{
  "token": "rdp_verification_token"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "LOGIN_AUTH_WITH_RDP_OK",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null,
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

**Notes:**
- Verifies token with `https://rdp.rtarf.mi.th/rdp-api-backend/index.php/verify/verifyToken`
- Auto-creates user and unit from J4 person data
- Fetches person data from MASTERDATA_URI
- New users get default role from `RDP_LOGIN_DEFAULT_ROLE` env variable
- SSO field set to `'rdp'`

---

### 5. Google OAuth Login

#### Step 1: Initiate Google OAuth
**Endpoint:** `GET /auth/google`

Redirects user to Google OAuth consent screen.

#### Step 2: Google Callback
**Endpoint:** `GET /auth/google/redirect`

**Response:**
Redirects to frontend with tokens in URL:
```
{GOOGLE_CALLBACK_FRONTEND}?token={jwt_token}&refresh_token={refresh_token}
```

**Notes:**
- Auto-creates user if doesn't exist
- New users get default unit: `29bac8a6-a14b-4f65-822c-7688e531c051`
- New users get default role: `076d1d27-88f7-4832-b1a4-10e3bd384737`
- SSO field set to `'gmail'`
- Session is created with JWT

---

### 6. Check Username Availability
**Endpoint:** `POST /auth/check`

**Headers:**
```
Username: user@example.com
```

**Response:**
```json
{
  "permission": true
}
```
or
```json
{
  "permission": false
}
```

**Notes:**
- Returns `true` if user exists
- Returns `false` if user doesn't exist

---

### 7. Decode JWT Token
**Endpoint:** `GET /auth/decode`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "status": 200,
  "message": "GET_USER_BY_ME_OK",
  "data": {
    "header": {
      "alg": "HS256",
      "typ": "JWT"
    },
    "payload": {
      "id": "user-uuid",
      "iat": 1234567890,
      "exp": 1234567890
    }
  },
  "error": null,
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

### 8. Get Current User (Me)
**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "status": 200,
  "message": "GET_USER_BY_ME_OK",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "tel": "0812345678",
    "idCard": "1234567890123",
    "avatarUrl": "https://...",
    "position": "Developer",
    "status": 1,
    "roles": [
      {
        "id": "role-uuid",
        "name": "admin",
        "nameTh": "ผู้ดูแลระบบ"
      }
    ],
    "units": [
      {
        "id": "unit-uuid",
        "code": "UNIT001",
        "name": "IT Department",
        "nameTh": "ฝ่ายไอที"
      }
    ],
    "activeUnit": {
      "id": "unit-uuid",
      "code": "UNIT001",
      "name": "IT Department"
    }
  },
  "error": null,
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

**Notes:**
- Requires JWT authentication
- Only returns active users (status = 1)
- Can use token from session or Authorization header

---

### 9. Get User Permissions
**Endpoint:** `GET /auth/permission`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "status": 200,
  "message": "GET_USER_PERMISSION_OK",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "displayname": "John Doe",
    "roles": [...],
    "units": [...]
  },
  "error": null,
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

### 10. Refresh Access Token
**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "token": "new_jwt_token",
  "refresh_token": "new_refresh_token"
}
```

**Notes:**
- Validates refresh token
- Generates new access token and refresh token
- Throws ForbiddenException if refresh token is invalid

---

### 11. User Registration
**Endpoint:** `POST /auth/register`

**Headers:**
```
registertoken: {REGISTER_TOKEN from env}
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "firstname": "Jane",
  "lastname": "Smith",
  "tel": "0812345678",
  "idCard": "1234567890123",
  "position": "Developer"
}
```

**Response:**
Returns created user object

**Notes:**
- Requires `registertoken` header matching `REGISTER_TOKEN` env variable
- Auto-assigns roles from `PUBLIC_ROLE_TOKEN` env
- Auto-assigns units from `PUBLIC_UNIT_TOKEN` env
- Returns 403 Forbidden if token doesn't match

---

### 12. Audit Trail Endpoint
**Endpoint:** `POST /auth/audit-trail`

**Headers:**
```
Authorization: Bearer {jwt_token}
User-Agent: {browser_user_agent}
audit-trail: "ข้อความที่ต้องการบันทึก"
```

**Response:**
```json
{
  "msg": "OK"
}
```

**Notes:**
- Requires JWT authentication
- Records user activity with device detection
- Captures IP address automatically
- `audit-trail` header contains the message to log

---

## Permission System

### Overview
The permission system has two types:
1. **Action Permission**: Controls what actions users can perform (CRUD operations)
2. **Data Permission**: Controls what data users can access

### Permission Structure

#### Action Permission
Controls CRUD operations on routes. Stored as:
```
{
  "service_name": {
    "route_name": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    }
  }
}
```

#### Data Permission
Controls data access levels. Stored as:
```
{
  "service_name": {
    "route_name": {
      "own": true,        // Access only own data
      "unit": true,       // Access unit's data
      "all": true         // Access all data
    }
  }
}
```

---

## Permission Endpoints

### 1. Get Basic Permission
**Endpoint:** `GET /permission`

**Request Body:**
```json
{
  "request_by": {
    "id": "user-uuid",
    "roles": [...]
  }
}
```

**Response:**
Returns the `request_by` object

---

### 2. Get Full Permissions (GraphQL-based)
**Endpoint:** `GET /permission/:service/:route`

**Example:** `GET /permission/user-service/users`

**Request Body:** Automatically injected by `RolesGuard`
```json
{
  "request_by": {
    "id": "user-uuid",
    "email": "user@example.com",
    "displayname": "John Doe",
    "idCard": "1234567890123",
    "activeUnit": {...},
    "roles": [
      {
        "id": "role-uuid",
        "name": "admin",
        "nameTh": "ผู้ดูแลระบบ"
      }
    ],
    "units": [...]
  }
}
```

**Response:**
```json
{
  "request_by": {
    "id": "user-uuid",
    "email": "user@example.com",
    "displayname": "John Doe",
    "roles": [...],
    "units": [...]
  },
  "action_permission": {
    "user-service": {
      "users": {
        "create": true,
        "read": true,
        "update": true,
        "delete": false
      }
    }
  },
  "data_permission": {
    "user-service": {
      "users": {
        "own": true,
        "unit": true,
        "all": false
      }
    }
  }
}
```

**Notes:**
- Uses GraphQL to query Directus permission tables
- Requires `@Roles()` decorator (can be empty array)
- Returns empty permissions if user has no roles

---

### 3. Get Full Permissions (REST-based)
**Endpoint:** `GET /permission/rest/:service/:route`

**Example:** `GET /permission/rest/user-service/users`

**Request Body:** Same as GraphQL version

**Response:** Same as GraphQL version

**Notes:**
- Uses REST API instead of GraphQL
- Better performance for some use cases
- Filters out routes with null service references

---

## Guards and Decorators

### 1. @Roles() Decorator
```typescript
import { Roles } from 'src/decorators/roles.decorator';

@Get('users')
@Roles('admin', 'moderator')  // Accepts specific roles
async getUsers() {
  // ...
}

@Get('public')
@Roles()  // No specific role required, but still authenticated
async getPublic() {
  // ...
}
```

### 2. JwtAuthGuard
```typescript
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute() {
  // Requires valid JWT token
}
```

### 3. RolesGuard
The `RolesGuard` automatically:
- Validates JWT token
- Loads user data with roles and units
- Checks if user has required roles
- Injects `request_by` object into request body
- Allows register token bypass

```typescript
import { RolesGuard } from './guards/roles.guard';

@UseGuards(RolesGuard)
@Roles('admin')
@Get('admin-only')
async adminRoute(@Body() body) {
  // body.request_by contains user info
}
```

---

## Request Flow

### Standard Authenticated Request Flow

1. **Client sends request with JWT**
```http
GET /auth/me HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. **JwtAuthGuard validates token**
- Verifies JWT signature
- Checks expiration
- Throws UnauthorizedException if invalid

3. **Controller processes request**
- Access user data via `@Req()` or session

4. **Response sent to client**

### Permission-Checked Request Flow

1. **Client sends request**
```http
POST /some-service/some-route HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "data": "some data"
}
```

2. **RolesGuard executes**
- Validates JWT token
- Loads user with roles and units
- Checks role requirements (if any)
- Injects `request_by` into body:
```json
{
  "request_by": {
    "id": "user-uuid",
    "email": "user@example.com",
    "displayname": "John Doe",
    "idCard": "1234567890123",
    "activeUnit": {...},
    "roles": [...],
    "units": [...]
  },
  "data": "some data"
}
```

3. **Controller receives augmented request**
- Access user info via `body.request_by`
- Check permissions if needed

4. **Permission service called (if checking permissions)**
```typescript
GET /permission/:service/:route
```
- Returns action and data permissions
- Frontend can use this to show/hide UI elements
- Backend can use this to filter data

---

## JWT Token Structure

### Access Token Payload
```json
{
  "id": "user-uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Notes:**
- Contains only user ID (minimal payload)
- Other user data loaded from database when needed
- This prevents token invalidation issues when user data changes

### Refresh Token Payload
```json
{
  "id": "user-uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Triggers:**
- Missing Authorization header
- Invalid JWT token
- Expired JWT token
- User not found

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbiden",
  "error": "Forbidden"
}
```

**Triggers:**
- Invalid refresh token
- Missing register token
- Invalid register token

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "username or password incorrect",
  "error": "Not Found"
}
```

**Triggers:**
- Login with wrong credentials
- User doesn't exist

---

## Frontend Integration Guide

### 1. Login Flow
```typescript
// 1. Login
const loginResponse = await fetch('/auth/local', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await loginResponse.json();
const { token, refresh_token } = data;

// 2. Store tokens
localStorage.setItem('access_token', token);
localStorage.setItem('refresh_token', refresh_token);

// 3. Get user info
const userResponse = await fetch('/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data: user } = await userResponse.json();
```

### 2. Making Authenticated Requests
```typescript
const token = localStorage.getItem('access_token');

const response = await fetch('/some-endpoint', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Handling Token Expiration
```typescript
async function fetchWithRefresh(url, options) {
  let token = localStorage.getItem('access_token');

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });

  // If 401, try to refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');

    const refreshResponse = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (refreshResponse.ok) {
      const { token: newToken, refresh_token: newRefreshToken } = await refreshResponse.json();

      localStorage.setItem('access_token', newToken);
      localStorage.setItem('refresh_token', newRefreshToken);

      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        }
      });
    } else {
      // Refresh failed, logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  }

  return response;
}
```

### 4. Checking Permissions
```typescript
async function checkPermission(service: string, route: string) {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`/permission/${service}/${route}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})  // Body will be injected by RolesGuard
  });

  const permissions = await response.json();

  return {
    canCreate: permissions.action_permission[service]?.[route]?.create,
    canRead: permissions.action_permission[service]?.[route]?.read,
    canUpdate: permissions.action_permission[service]?.[route]?.update,
    canDelete: permissions.action_permission[service]?.[route]?.delete,
    dataAccess: permissions.data_permission[service]?.[route]
  };
}

// Usage
const perms = await checkPermission('user-service', 'users');
if (perms.canCreate) {
  // Show create button
}
```

### 5. Audit Trail Logging
```typescript
async function logAuditTrail(message: string) {
  const token = localStorage.getItem('access_token');

  await fetch('/auth/audit-trail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'audit-trail': message,
      'User-Agent': navigator.userAgent
    }
  });
}

// Usage
logAuditTrail('เข้าหน้าจัดการผู้ใช้');
```

### 6. Google OAuth Flow
```typescript
// Redirect to Google OAuth
window.location.href = '/auth/google';

// After redirect back to frontend with tokens in URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const refreshToken = urlParams.get('refresh_token');

if (token) {
  localStorage.setItem('access_token', token);
  localStorage.setItem('refresh_token', refreshToken);

  // Redirect to app
  window.location.href = '/dashboard';
}
```

---

## Environment Variables Reference

### Required Variables
```env
# JWT Configuration
JWT_SECRET=your_secret_key
JWT_EXPIRE_IN=1h
JWT_REFRESH_TOKEN_SECRET=your_refresh_secret
JWT_REFRESH_TOKEN_EXPIRATION=7d

# Google OAuth
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CALLBACK_FRONTEND=http://localhost:3000/auth/callback

# Default Roles/Units
PUBLIC_ROLE_TOKEN=role-uuid-for-public-registration
PUBLIC_UNIT_TOKEN=unit-uuid-for-public-registration
RDP_LOGIN_DEFAULT_ROLE=role-uuid-for-rdp-users

# Registration Token
REGISTER_TOKEN=secret_registration_token

# External Services
MASTERDATA_URI=http://masterdata-service-url
```

---

## Best Practices for Frontend

### 1. Token Storage
- Store tokens in localStorage or sessionStorage
- Clear tokens on logout
- Never expose tokens in URLs (except OAuth callbacks)

### 2. Permission-Based UI
```typescript
// Load permissions on route/component mount
const [permissions, setPermissions] = useState(null);

useEffect(() => {
  async function loadPermissions() {
    const perms = await checkPermission('user-service', 'users');
    setPermissions(perms);
  }
  loadPermissions();
}, []);

// Conditionally render UI
{permissions?.canCreate && <CreateButton />}
{permissions?.canUpdate && <EditButton />}
{permissions?.canDelete && <DeleteButton />}
```

### 3. Error Handling
```typescript
try {
  const response = await fetchWithRefresh('/api/endpoint');
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    } else if (response.status === 403) {
      // Show permission denied message
      alert('You do not have permission to perform this action');
    }
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

### 4. Audit Trail Best Practices
- Log page visits: `logAuditTrail('เข้าหน้า[PageName]')`
- Log important actions: `logAuditTrail('แก้ไขข้อมูลผู้ใช้ ID: 123')`
- Don't log sensitive data
- Use Thai language for consistency with backend

---

## Data Models

### User Object
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  tel?: string;
  idCard?: string;
  avatarUrl?: string;
  position?: string;
  status: number;  // 1 = active, 0 = inactive
  sso?: 'local' | 'gmail' | 'ad' | 'rdp';
  roles: Role[];
  units: Unit[];
  activeUnit?: Unit;
  created_at: Date;
  updated_at: Date;
}
```

### Role Object
```typescript
interface Role {
  id: string;
  name: string;
  nameTh: string;
  description?: string;
}
```

### Unit Object
```typescript
interface Unit {
  id: string;
  code: string;
  name: string;
  nameTh: string;
  nameEn?: string;
  status: number;
  org_id?: number;
  icon?: any;
}
```

### Request By Object (Injected by RolesGuard)
```typescript
interface RequestBy {
  id: string;
  email: string;
  displayname: string;
  idCard?: string;
  activeUnit?: Unit;
  roles: Role[];
  units: Unit[];
}
```

---

## Common Use Cases

### Use Case 1: Protected Route with Role Check
```typescript
// Backend
@UseGuards(RolesGuard)
@Roles('admin', 'moderator')
@Get('admin/users')
async getAdminUsers(@Body() body) {
  const { request_by } = body;
  // request_by contains user info with roles and units
  return this.userService.findAll();
}

// Frontend
const response = await fetch('/admin/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Use Case 2: Data Filtering Based on Permission
```typescript
// Backend
@UseGuards(RolesGuard)
@Roles()
@Get('data')
async getData(@Body() body) {
  const { request_by } = body;

  // Check data permission
  const perms = await this.permissionService.findAllRest({
    body,
    service: 'my-service',
    route: 'data'
  });

  const dataPermission = perms.data_permission['my-service']?.['data'];

  if (dataPermission?.all) {
    return this.service.findAll();
  } else if (dataPermission?.unit) {
    return this.service.findByUnit(request_by.activeUnit.id);
  } else if (dataPermission?.own) {
    return this.service.findByUser(request_by.id);
  } else {
    throw new ForbiddenException();
  }
}
```

### Use Case 3: Public Registration with Token
```typescript
// Frontend
const response = await fetch('/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'registertoken': 'your_secret_register_token'
  },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'securepassword',
    firstname: 'John',
    lastname: 'Doe'
  })
});
```

---

## Troubleshooting

### Issue: "Unauthorized" on every request
- Check if token is valid and not expired
- Verify token is sent in Authorization header
- Check if user exists and is active (status = 1)

### Issue: "authorization role mismatch"
- User doesn't have required role
- Check user's roles in database
- Verify @Roles() decorator has correct role names

### Issue: Empty permissions returned
- User has no roles assigned
- Permission not configured in Directus
- Service/route name mismatch

### Issue: Register token forbidden
- `registertoken` header doesn't match `REGISTER_TOKEN` env
- Header name is case-sensitive: `registertoken` (lowercase)

---

## Security Considerations

1. **Always use HTTPS in production**
2. **Never expose JWT secrets**
3. **Implement rate limiting on auth endpoints**
4. **Validate and sanitize all inputs**
5. **Use strong passwords and enforce password policies**
6. **Rotate refresh tokens periodically**
7. **Implement session timeout**
8. **Log all authentication attempts**
9. **Use secure cookies for session storage when possible**
10. **Implement CORS properly**

---

## Additional Notes

- All timestamps are in ISO 8601 format
- All authentication methods create audit trail entries automatically
- User emails are stored in lowercase
- Only users with status = 1 can authenticate
- Device detection is automatic via User-Agent header
- IP addresses are captured via @RealIP() decorator
- The permission system requires Directus backend for GraphQL/REST queries
- Permission checks are NOT enforced automatically - implement in your controllers
