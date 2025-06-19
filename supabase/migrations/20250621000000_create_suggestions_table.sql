/**
 * Creates the suggestions table to store AI-generated suggestions and user interactions.
 * This table tracks grammar, spelling, and style suggestions for analytics and improvement.
 */
create table suggestions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('grammar', 'spelling', 'style', 'thesis', 'academic_voice')),
  original_text text not null,
  suggested_text text not null,
  explanation text,
  position_start integer not null,
  position_end integer not null,
  status text default 'pending' not null check (status in ('pending', 'accepted', 'rejected', 'ignored')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table public.suggestions is 'AI-generated suggestions and user interactions for documents.';

-- Set up Row Level Security (RLS)
alter table suggestions enable row level security;

create policy "Users can manage their own suggestions." on suggestions for all using (
  auth.uid() = user_id
);

-- Create index for better performance
create index idx_suggestions_document_id on suggestions(document_id);
create index idx_suggestions_user_id on suggestions(user_id);
create index idx_suggestions_status on suggestions(status);
create index idx_suggestions_type on suggestions(type);

-- Function to update updated_at timestamp
create or replace function public.update_suggestions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_suggestions_updated_at
  before update on suggestions
  for each row execute procedure public.update_suggestions_updated_at(); 