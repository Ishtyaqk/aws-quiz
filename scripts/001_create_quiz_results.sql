-- Create quiz_results table with public read access
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  score integer not null,
  total integer not null,
  percentage integer not null,
  date date not null,
  time_spent integer,
  question_statuses jsonb,
  wrong_questions jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.quiz_results enable row level security;

-- Policy: Anyone can view all results (public leaderboard)
create policy "quiz_results_select_public" 
  on public.quiz_results 
  for select 
  using (true);

-- Policy: Anyone can insert their own results
create policy "quiz_results_insert_public" 
  on public.quiz_results 
  for insert 
  with check (true);

-- Create index for faster queries
create index if not exists idx_quiz_results_user_id on public.quiz_results(user_id);
create index if not exists idx_quiz_results_date on public.quiz_results(date);
create index if not exists idx_quiz_results_percentage on public.quiz_results(percentage);
