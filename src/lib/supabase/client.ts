/**
 * @file This file contains the Supabase client for use in browser components.
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a new Supabase client for use in browser environments.
 *
 * This client is safe to use in React Client Components. It uses environment
 * variables for configuration and is initialized with the ssr package to
 * manage session information across server/client boundaries.
 *
 * @returns A Supabase client instance.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
} 