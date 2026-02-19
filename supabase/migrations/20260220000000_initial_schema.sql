-- ============================================================
-- Life Journal — Initial Database Schema
-- ============================================================

-- gen_random_uuid() is available by default in Supabase (pgcrypto)

-- ============================================================
-- 1. mood_entries
-- ============================================================
create table public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  mood smallint not null check (mood between 1 and 5),
  note text,
  entry_date date not null default current_date,
  ai_sentiment_score real,
  ai_tags jsonb,
  ai_summary text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, entry_date)
);

-- ============================================================
-- 2. journal_entries
-- ============================================================
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  body text not null default '',
  entry_date date not null default current_date,
  is_favorite boolean not null default false,
  word_count integer generated always as (
    array_length(string_to_array(trim(body), ' '), 1)
  ) stored,
  ai_summary text,
  ai_prompt text,
  ai_tags jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- 3. life_events
-- ============================================================
create table public.life_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null default 'other'
    check (category in (
      'travel','milestone','health','career',
      'relationship','education','creative','financial','other'
    )),
  event_date date not null default current_date,
  end_date date,
  location text,
  significance smallint not null default 3 check (significance between 1 and 5),
  ai_summary text,
  ai_tags jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- 4. photos
-- ============================================================
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  width integer,
  height integer,
  caption text,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  life_event_id uuid references public.life_events(id) on delete set null,
  ai_description text,
  ai_tags jsonb,
  created_at timestamptz default now() not null
);

-- ============================================================
-- 5. ai_weekly_summaries (placeholder for future AI features)
-- ============================================================
create table public.ai_weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start date not null,
  week_end date not null,
  mood_summary text,
  journal_summary text,
  event_summary text,
  overall_summary text,
  created_at timestamptz default now() not null,
  unique(user_id, week_start)
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_mood_entries_user_date on public.mood_entries(user_id, entry_date desc);
create index idx_journal_entries_user_date on public.journal_entries(user_id, entry_date desc);
create index idx_life_events_user_date on public.life_events(user_id, event_date desc);
create index idx_life_events_category on public.life_events(user_id, category);
create index idx_photos_user on public.photos(user_id, created_at desc);
create index idx_photos_journal on public.photos(journal_entry_id) where journal_entry_id is not null;
create index idx_photos_event on public.photos(life_event_id) where life_event_id is not null;

-- ============================================================
-- updated_at trigger function
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_mood_entries_updated_at
  before update on public.mood_entries
  for each row execute function public.handle_updated_at();

create trigger set_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.handle_updated_at();

create trigger set_life_events_updated_at
  before update on public.life_events
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

-- mood_entries
alter table public.mood_entries enable row level security;

create policy "Users can view own mood entries"
  on public.mood_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own mood entries"
  on public.mood_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mood entries"
  on public.mood_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own mood entries"
  on public.mood_entries for delete
  using (auth.uid() = user_id);

-- journal_entries
alter table public.journal_entries enable row level security;

create policy "Users can view own journal entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own journal entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own journal entries"
  on public.journal_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own journal entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- life_events
alter table public.life_events enable row level security;

create policy "Users can view own life events"
  on public.life_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own life events"
  on public.life_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own life events"
  on public.life_events for update
  using (auth.uid() = user_id);

create policy "Users can delete own life events"
  on public.life_events for delete
  using (auth.uid() = user_id);

-- photos
alter table public.photos enable row level security;

create policy "Users can view own photos"
  on public.photos for select
  using (auth.uid() = user_id);

create policy "Users can insert own photos"
  on public.photos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own photos"
  on public.photos for update
  using (auth.uid() = user_id);

create policy "Users can delete own photos"
  on public.photos for delete
  using (auth.uid() = user_id);

-- ai_weekly_summaries
alter table public.ai_weekly_summaries enable row level security;

create policy "Users can view own weekly summaries"
  on public.ai_weekly_summaries for select
  using (auth.uid() = user_id);

create policy "Users can insert own weekly summaries"
  on public.ai_weekly_summaries for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for photos
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
);

-- Storage policies: users can only access their own folder ({user_id}/*)
create policy "Users can upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own photos"
  on storage.objects for select
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
