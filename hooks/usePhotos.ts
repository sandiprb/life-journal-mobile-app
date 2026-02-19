import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Photo } from '../types/database';

const PHOTO_KEYS = {
  all: ['photos'] as const,
  byLifeEvent: (lifeEventId: string) =>
    [...PHOTO_KEYS.all, 'life-event', lifeEventId] as const,
  url: (storagePath: string) =>
    [...PHOTO_KEYS.all, 'url', storagePath] as const,
};

export function usePhotosByLifeEvent(lifeEventId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: PHOTO_KEYS.byLifeEvent(lifeEventId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user!.id)
        .eq('life_event_id', lifeEventId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Photo[];
    },
    enabled: !!user && !!lifeEventId,
  });
}

interface UploadPhotoInput {
  life_event_id: string;
}

export function useUploadPhoto() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadPhotoInput) => {
      // 1. Pick images from the library (allow multiple)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (result.canceled || result.assets.length === 0) {
        throw new Error('Image selection cancelled');
      }

      // 2. Upload each selected image in sequence
      const photos: Photo[] = [];
      for (const asset of result.assets) {
        const uri = asset.uri;
        const filename = uri.split('/').pop() || 'photo.jpg';
        const mimeType = asset.mimeType || 'image/jpeg';
        const width = asset.width ?? null;
        const height = asset.height ?? null;

        const file = new File(uri);
        const arrayBuffer = await file.arrayBuffer();

        const timestamp = Date.now();
        const storagePath = `${user!.id}/${timestamp}_${filename}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(storagePath, arrayBuffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data, error: insertError } = await supabase
          .from('photos')
          .insert({
            user_id: user!.id,
            storage_path: storagePath,
            filename,
            mime_type: mimeType,
            width,
            height,
            journal_entry_id: null,
            life_event_id: input.life_event_id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        photos.push(data as Photo);
      }

      return photos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHOTO_KEYS.all });
    },
  });
}

export function usePhotoUrl(storagePath: string) {
  return useQuery({
    queryKey: PHOTO_KEYS.url(storagePath),
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('photos')
        .createSignedUrl(storagePath, 3600);

      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!storagePath,
    staleTime: 50 * 60 * 1000, // 50 minutes (URL valid for 60 min)
  });
}

export function useDeletePhoto() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: Photo) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      // Delete from photos table
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id)
        .eq('user_id', user!.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHOTO_KEYS.all });
    },
  });
}
