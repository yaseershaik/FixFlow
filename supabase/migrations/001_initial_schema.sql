-- FixFlow Initial PostgreSQL & Supabase Migration with RLS
-- Version 1.0 (MVP)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: profiles / users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: issues
create table if not exists public.issues (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null check (char_length(title) >= 5 and char_length(title) <= 120),
  company text not null check (char_length(company) >= 1 and char_length(company) <= 120),
  category text not null check (category in ('delivery', 'telecom', 'warranty', 'refund', 'banking', 'education', 'government', 'other')),
  reference_no text check (reference_no is null or char_length(reference_no) <= 120),
  description text not null check (char_length(description) >= 10 and char_length(description) <= 2000),
  status text not null default 'open' check (status in ('open', 'waiting', 'action_needed', 'resolved', 'closed')),
  expected_date date,
  next_action text check (next_action is null or char_length(next_action) <= 500),
  notes text check (notes is null or char_length(notes) <= 5000),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: issue_events
create table if not exists public.issue_events (
  id uuid default gen_random_uuid() primary key,
  issue_id uuid references public.issues on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  event_type text not null,
  body text not null,
  event_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: attachments
create table if not exists public.attachments (
  id uuid default gen_random_uuid() primary key,
  issue_id uuid references public.issues on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: reminders
create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  issue_id uuid references public.issues on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  remind_at timestamp with time zone not null,
  type text default 'in_app' not null,
  completed_at timestamp with time zone
);

-- Table: extraction_runs
create table if not exists public.extraction_runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  issue_id uuid references public.issues on delete set null,
  provider text not null,
  model text not null,
  input_hash text not null,
  output_json text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies
alter table public.profiles enable row level security;
alter table public.issues enable row level security;
alter table public.issue_events enable row level security;
alter table public.attachments enable row level security;
alter table public.reminders enable row level security;
alter table public.extraction_runs enable row level security;

-- Profiles: user can only see/update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Issues: isolated to owner
create policy "Users can view own issues" on public.issues
  for select using (auth.uid() = user_id);
create policy "Users can insert own issues" on public.issues
  for insert with check (auth.uid() = user_id);
create policy "Users can update own issues" on public.issues
  for update using (auth.uid() = user_id);
create policy "Users can delete own issues" on public.issues
  for delete using (auth.uid() = user_id);

-- Issue Events: isolated to owner
create policy "Users can view own issue events" on public.issue_events
  for select using (auth.uid() = user_id);
create policy "Users can insert own issue events" on public.issue_events
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own issue events" on public.issue_events
  for delete using (auth.uid() = user_id);

-- Attachments: isolated to owner
create policy "Users can view own attachments" on public.attachments
  for select using (auth.uid() = user_id);
create policy "Users can insert own attachments" on public.attachments
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own attachments" on public.attachments
  for delete using (auth.uid() = user_id);

-- Extraction Runs: isolated to owner
create policy "Users can view own extraction runs" on public.extraction_runs
  for select using (auth.uid() = user_id);
create policy "Users can insert own extraction runs" on public.extraction_runs
  for insert with check (auth.uid() = user_id);
