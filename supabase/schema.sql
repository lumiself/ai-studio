-- AI Studio — Supabase Schema
-- Run this in the Supabase SQL Editor after creating your project.

-- Token balances and plan info per user
create table if not exists user_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'starter',   -- 'starter' | 'pro' | 'studio'
  balance integer not null default 0,
  used integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Processing jobs (one row per image processed)
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pipeline text not null,         -- pipeline id, e.g. 'remove_bg', 'upscale'
  action_id text not null,        -- action id, e.g. 'remove_background', 'upscale_2x'
  status text not null default 'processing', -- 'processing' | 'succeeded' | 'failed'
  step integer not null default 0,           -- current pipeline step index
  prediction_id text,             -- Replicate prediction ID for current step
  input_url text,                 -- public URL of original image in uploads/
  output_url text,                -- public URL of final result in results/
  intermediate_url text,          -- foreground PNG URL (for multi-step pipelines)
  bg_prompt text,                 -- background description prompt
  scale integer,
  face_enhance boolean,
  high_res boolean not null default false,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_id_idx on jobs(user_id);
create index if not exists jobs_prediction_id_idx on jobs(prediction_id);
create index if not exists jobs_status_idx on jobs(status);

-- Custom presets created via the admin preset builder
create table if not exists custom_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null,
  thumbnail_url text,
  bg_prompt text not null default '',
  inputs jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Global key-value settings (Replicate API key, model overrides)
create table if not exists settings (
  key text primary key,
  value text not null
);

-- Insert default settings placeholders (update via admin settings page)
insert into settings (key, value) values
  ('replicate_api_key', ''),
  ('model_remove_bg',   ''),
  ('model_replace_bg_step0', ''),
  ('model_replace_bg_step1', ''),
  ('model_upscale',    ''),
  ('model_gfpgan',     ''),
  ('model_portrait_retouch_step0', ''),
  ('model_portrait_retouch_step1', ''),
  ('concurrency_limit', '20')
on conflict (key) do nothing;

-- Row-level security (users can only see their own data)
alter table user_tokens enable row level security;
alter table jobs enable row level security;
alter table custom_presets enable row level security;
alter table settings enable row level security;

-- user_tokens: users read/update own row; service role can do everything
create policy "users_own_tokens" on user_tokens
  for all using (auth.uid() = user_id);

-- jobs: users read/update own jobs; service role handles inserts/updates via webhook
create policy "users_own_jobs" on jobs
  for select using (auth.uid() = user_id);

-- custom_presets: all authenticated users can read; service role manages writes
create policy "all_read_presets" on custom_presets
  for select using (auth.role() = 'authenticated');

-- settings: only service role accesses settings (no client-side reads)
-- (no public policy — service_role_key bypasses RLS)
