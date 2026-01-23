# Data Catalog - ISOC

ระบบจัดการข้อมูลแค็ตตาล็อก สำหรับ Information System Operation Center (ISOC)

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma** (PostgreSQL)
- **Axios** (API Client)
- **Jose** (JWT Handling)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

สร้างไฟล์ `.env` ในรูทของโปรเจกต์:

```env
# Database
DATABASE_URL="postgresql://aomck:Kerdsawad9@localhost:5432/datacatalog?schema=public"

# Core API
CORE_API_URL="https://isoc360-core.isoc.go.th/user-api"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Or run migrations (production)
npx prisma migrate deploy
```

### 4. Run Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

## Project Structure

```
datacatalog/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   ├── login/                   # Login page
│   │   └── page.tsx
│   └── app/                     # Protected app routes
│       ├── layout.tsx           # App layout with sidebar
│       ├── catalog/             # Data Catalog page
│       ├── my-catalog/          # My Catalog page
│       └── approver/            # Approver page
├── components/                   # React components
│   ├── providers/
│   │   └── permission-provider.tsx
│   └── sidebar/
│       └── sidebar.tsx
├── lib/                         # Utilities and actions
│   ├── api.ts                   # Axios client
│   ├── auth-actions.ts          # Server actions for auth
│   ├── cookies.ts               # Cookie utilities
│   └── permission-utils.ts      # Permission checking utilities
├── types/                       # TypeScript types
│   └── index.ts
├── prisma/                      # Prisma schema
│   └── schema.prisma
├── middleware.ts                # Next.js middleware for auth
└── .env                         # Environment variables
```

## Features

### ✅ Authentication System

- Login with email/password (Local)
- Support for multiple auth methods (Google OAuth, AD, RDP, LINE)
- JWT token management with httpOnly cookies
- Automatic token refresh
- Secure logout

### ✅ Permission System

- Action permissions (CRUD)
- Data permissions (own/unit/all)
- Permission-based UI rendering
- Menu visibility based on permissions
- Protected routes

### ✅ UI Components

- Responsive design (Google Material Design pattern)
- Expandable sidebar navigation
- User profile display
- Permission-aware components
- Loading states and error handling

### ✅ Pages

- **Landing Page** (`/`) - แนะนำระบบ
- **Login Page** (`/login`) - เข้าสู่ระบบ
- **Data Catalog** (`/app/catalog`) - จัดการแค็ตตาล็อกทั้งหมด
- **My Catalog** (`/app/my-catalog`) - แค็ตตาล็อกของฉัน
- **Approver** (`/app/approver`) - อนุมัติแค็ตตาล็อก

## API Integration

### Core API Endpoints Used

- `POST /auth/local` - Login
- `GET /auth/me` - Get current user
- `GET /auth/permission` - Get user permissions
- `POST /auth/refresh` - Refresh access token

### Server Actions

```typescript
// lib/auth-actions.ts
await loginAction(email, password)      // Login
await getMeAction()                     // Get user data
await getPermissionAction()             // Get permissions
await logoutAction()                    // Logout
await isAuthenticated()                 // Check auth status
```

## Permission Checking

### Utility Functions

```typescript
import { checkActionPermission, hasAnyAction, getDataPermissionLevel } from '@/lib/permission-utils';

// Check specific action
const canCreate = checkActionPermission(permissions, 'catalog-service', 'catalogs', 'create');

// Check if has any action (for menu visibility)
const showMenu = hasAnyAction(permissions, 'catalog-service', 'catalogs');

// Get data access level
const level = getDataPermissionLevel(permissions, 'catalog-service', 'catalogs'); // 'all' | 'unit' | 'own' | 'none'
```

### Using in Components

```typescript
'use client';

import { usePermission } from '@/components/providers/permission-provider';
import { getActionPermissions } from '@/lib/permission-utils';

export default function MyPage() {
  const { user, permissions } = usePermission();
  const actionPerms = getActionPermissions(permissions, 'service-name', 'route-name');

  return (
    <div>
      {actionPerms.create && <button>Create</button>}
      {actionPerms.update && <button>Update</button>}
      {actionPerms.delete && <button>Delete</button>}
    </div>
  );
}
```

## Development

### Enable Debug Mode

Debug information จะแสดงใน development mode โดยอัตโนมัติ (ด้านล่างของแต่ละหน้า)

### Build for Production

```bash
npm run build
npm start
```

## Security

- ✅ httpOnly cookies for token storage
- ✅ CSRF protection with Next.js middleware
- ✅ Server-side authentication checks
- ✅ Permission verification on every request
- ✅ Secure password handling (bcrypt on backend)

## Next Steps

1. ✅ เชื่อมต่อกับ Core API และทดสอบ authentication
2. ⏳ สร้าง CRUD operations สำหรับ Data Catalog
3. ⏳ เพิ่ม validation ด้วย Zod
4. ⏳ เพิ่ม toast notifications
5. ⏳ เพิ่ม loading states
6. ⏳ เพิ่ม error boundaries
7. ⏳ เพิ่ม unit tests

## Support

สำหรับปัญหาหรือคำถาม กรุณาติดต่อทีมพัฒนา ISOC
