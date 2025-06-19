-- Create a table for public user profiles
create table users (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  -- The user's role in the system.
  role text default 'user' not null,
  created_at timestamp with time zone default now() not null
);

comment on table public.users is 'Public user data, linked to auth.users.';

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table users
  enable row level security;

create policy "Public profiles are viewable by everyone." on users
  for select using (true);

create policy "Users can insert their own profile." on users
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on users
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile when a new user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 