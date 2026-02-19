-- Allow multiple mood entries per day (drop unique constraint)
alter table public.mood_entries drop constraint mood_entries_user_id_entry_date_key;
