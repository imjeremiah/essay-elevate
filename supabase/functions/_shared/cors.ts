/**
 * @file This file contains the standard CORS headers for Supabase Edge Functions.
 * It's imported into each function to ensure consistent CORS handling.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}; 