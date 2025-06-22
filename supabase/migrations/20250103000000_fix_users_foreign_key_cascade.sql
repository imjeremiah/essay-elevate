-- Fix the foreign key constraint in users table to allow cascade deletion
-- This will allow users to be deleted from the Supabase dashboard without foreign key constraint errors

-- First, drop the existing foreign key constraint
ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;

-- Add the constraint back with ON DELETE CASCADE
ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT users_id_fkey ON public.users IS 
  'Foreign key to auth.users with cascade delete to allow user deletion from dashboard'; 