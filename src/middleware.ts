/**
 * @file This file contains the Next.js middleware, which will be used
 * for handling authentication and protecting routes.
 */
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add auth logic here
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 