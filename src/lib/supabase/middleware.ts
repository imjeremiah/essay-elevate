/**
 * @file This file contains the Supabase middleware helper function that is
 * responsible for refreshing the user's session. It is designed to be used
 * in the main `middleware.ts` file.
 */
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * A helper function to refresh the Supabase session in a Next.js middleware
 * environment. It creates a Supabase server client and attempts to refresh
 * the session token.
 *
 * This function is adapted from the official Supabase documentation for
 * server-side authentication in Next.js.
 *
 * @param request - The incoming Next.js request object.
 * @returns A promise that resolves to an object containing the Next.js
 * response and the Supabase client instance.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options) => {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove: (name: string) => {
        request.cookies.delete(name);
        response.cookies.delete(name);
      },
    },
  });

  await supabase.auth.getUser();

  return { response, supabase };
} 