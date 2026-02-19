export type MoodValue = 1 | 2 | 3 | 4 | 5;

export type EventCategory =
  | 'travel'
  | 'milestone'
  | 'health'
  | 'career'
  | 'relationship'
  | 'education'
  | 'creative'
  | 'financial'
  | 'other';

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: MoodValue;
  note: string | null;
  entry_date: string;
  ai_sentiment_score: number | null;
  ai_tags: string[] | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  entry_date: string;
  is_favorite: boolean;
  word_count: number;
  ai_summary: string | null;
  ai_prompt: string | null;
  ai_tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface LifeEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  event_date: string;
  end_date: string | null;
  location: string | null;
  significance: MoodValue;
  ai_summary: string | null;
  ai_tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  caption: string | null;
  journal_entry_id: string | null;
  life_event_id: string | null;
  ai_description: string | null;
  ai_tags: string[] | null;
  created_at: string;
}

export interface AIWeeklySummary {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  mood_summary: string | null;
  journal_summary: string | null;
  event_summary: string | null;
  overall_summary: string | null;
  created_at: string;
}
