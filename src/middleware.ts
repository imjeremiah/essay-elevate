/**
 * @file This file contains the Next.js middleware, which is used to refresh
 * user sessions and protect routes.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * The middleware function that is executed for every matching request.
 * It uses the `updateSession` utility to refresh the user's session token.
 * After refreshing the session, it retrieves the user and performs redirects
 * based on the user's authentication state and the requested path.
 *
 * @param request - The incoming Next.js request object.
 * @returns A NextResponse object that either continues the request chain
 * or redirects the user.
 */
export async function middleware(request: NextRequest) {
  const { response, supabase } = await updateSession(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // If a user is not logged in and is trying to access a protected route,
  // redirect them to the login page.
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/editor'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If a user is logged in and is trying to access an auth page (login/signup),
  // redirect them to the dashboard.
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     *
     * This is a slightly modified version of the default matcher to include
     * the /api path.
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}; 