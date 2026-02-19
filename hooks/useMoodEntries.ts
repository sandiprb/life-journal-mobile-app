import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { MoodEntry, MoodValue } from '../types/database';
import { format } from 'date-fns';

const MOOD_KEYS = {
  all: ['mood-entries'] as const,
  list: () => [...MOOD_KEYS.all, 'list'] as const,
  today: () => [...MOOD_KEYS.all, 'today'] as const,
};

export function useMoodEntries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: MOOD_KEYS.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as MoodEntry[];
    },
    enabled: !!user,
  });
}

export function useTodayMoods() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: MOOD_KEYS.today(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('entry_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MoodEntry[];
    },
    enabled: !!user,
  });
}

export function useCreateMoodEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mood, note }: { mood: MoodValue; note?: string }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user!.id,
          mood,
          note: note || null,
          entry_date: today,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MoodEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOOD_KEYS.all });
    },
  });
}
