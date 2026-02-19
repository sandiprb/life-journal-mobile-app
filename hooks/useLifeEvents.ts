import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { LifeEvent, EventCategory, MoodValue } from '../types/database';

const LIFE_EVENT_KEYS = {
  all: ['life-events'] as const,
  list: (category?: EventCategory) =>
    category
      ? ([...LIFE_EVENT_KEYS.all, 'list', category] as const)
      : ([...LIFE_EVENT_KEYS.all, 'list'] as const),
  detail: (id: string) => [...LIFE_EVENT_KEYS.all, 'detail', id] as const,
};

export function useLifeEvents(category?: EventCategory) {
  const { user } = useAuth();

  return useQuery({
    queryKey: LIFE_EVENT_KEYS.list(category),
    queryFn: async () => {
      let query = supabase
        .from('life_events')
        .select('*')
        .eq('user_id', user!.id)
        .order('event_date', { ascending: false })
        .limit(50);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LifeEvent[];
    },
    enabled: !!user,
  });
}

export function useLifeEvent(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: LIFE_EVENT_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return data as LifeEvent;
    },
    enabled: !!user && !!id,
  });
}

interface CreateLifeEventInput {
  title: string;
  description?: string;
  category: EventCategory;
  event_date: string;
  end_date?: string;
  location?: string;
  significance: MoodValue;
}

export function useCreateLifeEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLifeEventInput) => {
      const { data, error } = await supabase
        .from('life_events')
        .insert({
          user_id: user!.id,
          title: input.title,
          description: input.description || null,
          category: input.category,
          event_date: input.event_date,
          end_date: input.end_date || null,
          location: input.location || null,
          significance: input.significance,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LifeEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIFE_EVENT_KEYS.all });
    },
  });
}

interface UpdateLifeEventInput {
  id: string;
  title?: string;
  description?: string | null;
  category?: EventCategory;
  event_date?: string;
  end_date?: string | null;
  location?: string | null;
  significance?: MoodValue;
}

export function useUpdateLifeEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateLifeEventInput) => {
      const { data, error } = await supabase
        .from('life_events')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as LifeEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIFE_EVENT_KEYS.all });
    },
  });
}

export function useDeleteLifeEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('life_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIFE_EVENT_KEYS.all });
    },
  });
}
