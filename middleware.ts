import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login'];
  const isPublicPath = publicPaths.includes(pathname);

  // Allow access to auth token page without authentication
  if (pathname.startsWith('/auth/token/')) {
    return NextResponse.next();
  }

  // If accessing /app/* without token, redirect to login
  if (pathname.startsWith('/app') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing /login or / with token, redirect to app
  if (isPublicPath && token && pathname === '/login') {
    return NextResponse.redirect(new URL('/app/catalog', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
};
