import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  console.log('[Middleware] Request:', pathname);

  // ALWAYS skip middleware for API routes - no matter what
  if (pathname.includes('/api/')) {
    console.log('[Middleware] Skipping API route:', pathname);
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', `${basePath}`, `${basePath}/login`];
  const isPublicPath = publicPaths.includes(pathname);

  // Allow access to auth token page without authentication
  if (pathname.startsWith('/auth/token/') || pathname.startsWith(`${basePath}/auth/token/`)) {
    return NextResponse.next();
  }

  // If accessing /app/* without token, redirect to login
  if (pathname.startsWith('/app') && !token) {
    return NextResponse.redirect(new URL(`${basePath}/login`, request.url));
  }

  // If accessing /login or / with token, redirect to app
  if (isPublicPath && token && (pathname === '/login' || pathname === `${basePath}/login`)) {
    return NextResponse.redirect(new URL(`${basePath}/app/catalog`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only match app routes and login, explicitly exclude api
    '/app/:path*',
    '/login',
    '/',
  ],
};
