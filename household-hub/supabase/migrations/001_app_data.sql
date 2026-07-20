-- Run this in Supabase Dashboard → SQL Editor

create table if not exists app_data (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_data enable row level security;

-- Anyone can read (Charlene's app + public API)
create policy "Public read access"
  on app_data for select
  using (true);

-- Writes go through Next.js API using the service role key (bypasses RLS)

create index if not exists app_data_updated_at_idx on app_data (updated_at desc);
