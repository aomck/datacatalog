# Token URL Authentication

ระบบ login ผ่าน URL โดยรับ JWT token เป็น parameter แล้ว validate กับ Core API ภายนอก
ถ้า token ถูกต้อง → เก็บลง httpOnly cookie → redirect เข้าหน้า app อัตโนมัติ

**Use case**: ระบบอื่น (เช่น portal หลัก) ส่ง link ให้ user คลิกเข้าระบบโดยไม่ต้องกรอก email/password

```
User คลิก link: https://your-app.com/auth/token/{jwt_token}
       │
       ▼
Frontend ดึง token จาก URL → ส่งไป Backend
       │
       ▼
Backend ส่ง token ไป validate กับ Core API (GET /auth/me)
       │
       ▼
Core API ตอบกลับข้อมูล User
       │
       ▼
Backend เก็บ token ลง httpOnly cookie
       │
       ▼
Frontend redirect ไปหน้า app
```

---

## 1. Core API Endpoints (External Service)

ระบบนี้ไม่ได้สร้าง JWT เอง แต่ใช้ Core API ภายนอกเป็นตัวจัดการ JWT

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/auth/me` | ตรวจสอบ token และดึงข้อมูล user | Header: `Authorization: Bearer <token>` | `{ status: 200, data: User }` |

### Response Format

```typescript
// Core API ตอบกลับในรูปแบบนี้ทุก endpoint
interface ApiResponse<T> {
  status: number;    // 200 = success
  message: string;
  data: T;
  error: any;
  timestamp: string;
}

// User object ที่ได้จาก /auth/me
interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  tel?: string;
  avatarUrl?: string;
  position?: string;
  status: number;
  roles: { id: string; name: string; nameTh: string }[];
  units: { id: string; code: string; name: string; nameTh: string; status: number }[];
  activeUnit?: { id: string; code: string; name: string; nameTh: string; status: number };
}
```

---

## 2. Backend (NestJS)

### 2.1 Cookie Configuration

เก็บ token ใน **httpOnly cookie** เพื่อให้ JavaScript เข้าถึงไม่ได้ (ป้องกัน XSS)

```typescript
// auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { Response, Request } from 'express';

@Injectable()
export class AuthService {
  private readonly TOKEN_NAME = 'access_token';

  setAuthCookie(res: Response, token: string) {
    res.cookie(this.TOKEN_NAME, token, {
      httpOnly: true,                                // JavaScript เข้าถึงไม่ได้
      secure: process.env.NODE_ENV === 'production', // HTTPS only ใน production
      sameSite: 'lax',                               // ป้องกัน CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000,              // 7 วัน (milliseconds)
    });
  }

  getAccessToken(req: Request): string | null {
    return req.cookies?.[this.TOKEN_NAME] || null;
  }

  clearAuthCookie(res: Response) {
    res.clearCookie(this.TOKEN_NAME);
  }
}
```

### 2.2 Token Auth Endpoint

```typescript
// auth/auth.controller.ts
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/token - รับ token จาก frontend แล้ว validate กับ Core API
  @Post('token')
  async tokenAuth(@Body() body: { token: string }, @Res() res: Response) {
    try {
      // ส่ง token ไป validate กับ Core API
      const coreResponse = await axios.get(`${process.env.CORE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${body.token}` },
      });

      if (coreResponse.data.status === 200 && coreResponse.data.data) {
        // Token valid → เก็บลง httpOnly cookie
        this.authService.setAuthCookie(res, body.token);

        return res.json({
          success: true,
          message: 'Authentication successful',
          user: coreResponse.data.data,
        });
      }

      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token',
      });
    } catch (error: any) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: error.response?.data?.message || 'Invalid or expired token',
      });
    }
  }
}
```

### 2.3 Auth Guard (ป้องกัน route อื่นๆ)

ใช้ตรวจสอบ token จาก cookie ก่อนเข้าถึง protected endpoints

```typescript
// auth/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.['access_token'];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const response = await axios.get(`${process.env.CORE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === 200 && response.data.data) {
        request['user'] = response.data.data; // แนบ user data ไว้ใน request
        return true;
      }

      throw new UnauthorizedException('Invalid token');
    } catch {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
```

### 2.4 CORS + Cookie Parser (main.ts)

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL, // เช่น http://localhost:5173
    credentials: true,                // สำคัญ! ให้ browser ส่ง cookie ได้
  });

  await app.listen(3000);
}
```

### 2.5 Environment Variables

```env
CORE_API_URL=https://your-core-api-url/user-api
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## 3. Frontend (React + Vite + TypeScript)

### 3.1 API Client

```typescript
// lib/api.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // NestJS backend URL
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true, // สำคัญ! ส่ง cookie ไปกับทุก request
});
```

> `withCredentials: true` ทำให้ browser ส่ง httpOnly cookie ไปพร้อม request อัตโนมัติ

### 3.2 Auth Function

```typescript
// lib/auth.ts
import { apiClient } from './api';

// Token auth - ส่ง token ไปให้ backend validate แล้ว set cookie
export async function tokenAuth(token: string): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> {
  try {
    const response = await apiClient.post('/auth/token', { token });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Invalid or expired token',
    };
  }
}
```

### 3.3 Token Auth Page

```tsx
// pages/auth/TokenAuthPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tokenAuth } from '../../lib/auth';

export default function TokenAuthPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      if (!token) {
        setError('Token is required');
        setLoading(false);
        return;
      }

      try {
        // ส่ง token ไปให้ backend validate
        const result = await tokenAuth(token);

        if (result.success) {
          // Backend set cookie แล้ว → redirect ไปหน้า app
          navigate('/app', { replace: true });
        } else {
          setError(result.message);
          setLoading(false);
        }
      } catch {
        setError('Authentication failed. Please try again.');
        setLoading(false);
      }
    };

    authenticate();
  }, [token, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      {loading ? (
        <p>กำลังตรวจสอบสิทธิ์...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : null}
    </div>
  );
}
```

### 3.4 Route Setup

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TokenAuthPage from './pages/auth/TokenAuthPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Token auth - ไม่ต้อง protect route นี้ */}
        <Route path="/auth/token/:token" element={<TokenAuthPage />} />

        {/* Protected routes - ต้องมี cookie แล้ว */}
        <Route path="/app/*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 3.5 Environment Variables

```env
VITE_API_URL=http://localhost:3000
```

---

## 4. Sequence Diagram

```
User              Frontend (React)         Backend (NestJS)         Core API
 │                      │                        │                      │
 │ คลิก link            │                        │                      │
 │ /auth/token/xxx ─────>│                        │                      │
 │                      │                        │                      │
 │                      │ POST /auth/token       │                      │
 │                      │ { token: "xxx" } ──────>│                      │
 │                      │                        │                      │
 │                      │                        │ GET /auth/me          │
 │                      │                        │ Bearer xxx ──────────>│
 │                      │                        │                      │
 │                      │                        │    { status: 200,     │
 │                      │                        │<──── data: User }     │
 │                      │                        │                      │
 │                      │                        │ Set-Cookie:           │
 │                      │   { success: true }    │ access_token=xxx     │
 │                      │<───────────────────────│ (httpOnly, secure)   │
 │                      │                        │                      │
 │  redirect /app       │                        │                      │
 │<─────────────────────│                        │                      │
 │                      │                        │                      │
 │  (ต่อไปทุก request   │ GET /api/xxx           │                      │
 │   cookie ถูกส่ง      │ Cookie: access_token ──>│ validate token       │
 │   อัตโนมัติ)         │                        │──────────────────────>│
```

---

## 5. สรุปหลักการ

1. **Frontend ไม่เก็บ token ใน JavaScript** - ไม่ใช้ localStorage หรือ state ใดๆ
2. **Token ถูกเก็บใน httpOnly cookie** - Browser จัดการส่ง cookie ให้อัตโนมัติ
3. **Backend เป็นตัวกลาง** - Validate token กับ Core API แล้ว set cookie
4. **หน้า `/auth/token/:token` ต้องเป็น public route** - ไม่ต้อง login ก่อนถึงจะเข้าได้
5. **ต้องตั้ง `withCredentials: true`** ที่ axios frontend + `credentials: true` ที่ CORS backend
