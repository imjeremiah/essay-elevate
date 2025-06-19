-- Create a policy to allow public read access
CREATE POLICY "Allow public read access"
ON public.messages
FOR SELECT
USING (true);

-- Insert a test message
INSERT INTO public.messages (text)
VALUES ('This message was fetched from the Supabase database!');
