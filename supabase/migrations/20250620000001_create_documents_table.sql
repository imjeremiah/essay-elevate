/**
 * Creates the documents table to store user-created documents.
 * This table is linked to the users table and has RLS policies
 * to ensure users can only access their own documents.
 */
create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content jsonb,
  created_at timestamp with time zone default now() not null
);

comment on table public.documents is 'Documents created by users.';

alter table documents enable row level security;

create policy "Users can manage their own documents." on documents for all using (
  auth.uid() = user_id
); 