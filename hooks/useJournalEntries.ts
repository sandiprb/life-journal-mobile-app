import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { JournalEntry } from '../types/database';

const JOURNAL_KEYS = {
  all: ['journal-entries'] as const,
  list: () => [...JOURNAL_KEYS.all, 'list'] as const,
  detail: (id: string) => [...JOURNAL_KEYS.all, 'detail', id] as const,
};

export function useJournalEntries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: JOURNAL_KEYS.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as JournalEntry[];
    },
    enabled: !!user,
  });
}

export function useJournalEntry(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: JOURNAL_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return data as JournalEntry;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateJournalEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      body,
      entry_date,
    }: {
      title?: string;
      body: string;
      entry_date: string;
    }) => {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user!.id,
          title: title || null,
          body,
          entry_date,
        })
        .select()
        .single();

      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEYS.all });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      body,
      is_favorite,
    }: {
      id: string;
      title?: string;
      body?: string;
      is_favorite?: boolean;
    }) => {
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title || null;
      if (body !== undefined) {
        updates.body = body;
      }
      if (is_favorite !== undefined) updates.is_favorite = is_favorite;

      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEYS.all });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEYS.all });
    },
  });
}
