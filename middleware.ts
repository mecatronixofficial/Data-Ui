import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // A refresh-only session is still recoverable. The dashboard layout calls
  // /auth/me, and the API client refreshes once before redirecting to login.
  const token = req.cookies.get('access_token') || req.cookies.get('refresh_token');
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');

  if (isDashboard && !token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
