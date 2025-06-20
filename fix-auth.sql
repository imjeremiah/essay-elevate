-- Fix auth configuration for production
-- Ensure auth schema is properly configured

-- Check if the trigger function exists and recreate if needed
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY definer SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON users;
DROP POLICY IF EXISTS "Users can update own profile." ON users;

CREATE POLICY "Public profiles are viewable by everyone." ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON users
  FOR UPDATE USING (auth.uid() = id);

-- Ensure documents policies are correct
DROP POLICY IF EXISTS "Users can manage their own documents." ON documents;

CREATE POLICY "Users can manage their own documents." ON documents 
  FOR ALL USING (auth.uid() = user_id);

-- Add some debugging to help troubleshoot
SELECT 'Auth setup complete' as status; 