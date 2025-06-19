/**
 * @file This file contains shared CORS headers for Supabase Edge Functions.
 * It allows cross-origin requests from the web application.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}; 