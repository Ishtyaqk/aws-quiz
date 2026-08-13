-- Versioned question bank (each upload creates a new version with merged questions)
create table if not exists public.questions_versions (
  id uuid primary key default gen_random_uuid(),
  version_number integer not null unique,
  questions jsonb not null default '[]'::jsonb,
  uploaded_by text not null default 'anonymous',
  md_file_path text,
  total_questions integer not null default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Audit trail for markdown uploads
create table if not exists public.upload_audit_log (
  id uuid primary key default gen_random_uuid(),
  uploaded_by text not null default 'anonymous',
  file_name text,
  new_questions_added integer not null default 0,
  total_questions_after integer not null default 0,
  version_number integer not null default 0,
  status text not null default 'pending',
  error_message text,
  file_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add columns if tables already existed with an older schema
alter table public.questions_versions add column if not exists version_number integer;
alter table public.questions_versions add column if not exists questions jsonb default '[]'::jsonb;
alter table public.questions_versions add column if not exists uploaded_by text default 'anonymous';
alter table public.questions_versions add column if not exists md_file_path text;
alter table public.questions_versions add column if not exists total_questions integer default 0;
alter table public.questions_versions add column if not exists notes text;
alter table public.questions_versions add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

alter table public.upload_audit_log add column if not exists uploaded_by text default 'anonymous';
alter table public.upload_audit_log add column if not exists file_name text;
alter table public.upload_audit_log add column if not exists new_questions_added integer default 0;
alter table public.upload_audit_log add column if not exists total_questions_after integer default 0;
alter table public.upload_audit_log add column if not exists version_number integer default 0;
alter table public.upload_audit_log add column if not exists status text default 'pending';
alter table public.upload_audit_log add column if not exists error_message text;
alter table public.upload_audit_log add column if not exists file_path text;
alter table public.upload_audit_log add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

alter table public.questions_versions enable row level security;
alter table public.upload_audit_log enable row level security;

-- Policies (drop first so re-running this script is safe)
drop policy if exists "questions_versions_select_public" on public.questions_versions;
drop policy if exists "questions_versions_insert_public" on public.questions_versions;
drop policy if exists "upload_audit_log_select_public" on public.upload_audit_log;
drop policy if exists "upload_audit_log_insert_public" on public.upload_audit_log;

create policy "questions_versions_select_public"
  on public.questions_versions
  for select
  using (true);

create policy "questions_versions_insert_public"
  on public.questions_versions
  for insert
  with check (true);

create policy "upload_audit_log_select_public"
  on public.upload_audit_log
  for select
  using (true);

create policy "upload_audit_log_insert_public"
  on public.upload_audit_log
  for insert
  with check (true);

create index if not exists idx_questions_versions_version_number
  on public.questions_versions(version_number desc);

create index if not exists idx_upload_audit_log_created_at
  on public.upload_audit_log(created_at desc);
