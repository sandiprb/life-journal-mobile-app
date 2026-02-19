import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import {
  useJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
} from '../../../hooks/useJournalEntries';

export default function JournalEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: entry, isLoading, error } = useJournalEntry(id);
  const updateMutation = useUpdateJournalEntry();
  const deleteMutation = useDeleteJournalEntry();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const handleToggleFavorite = () => {
    if (!entry) return;
    updateMutation.mutate({
      id: entry.id,
      is_favorite: !entry.is_favorite,
    });
  };

  const handleStartEditing = () => {
    if (!entry) return;
    setEditTitle(entry.title || '');
    setEditBody(entry.body);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditBody('');
  };

  const handleSaveEdit = () => {
    if (!entry) return;
    updateMutation.mutate(
      {
        id: entry.id,
        title: editTitle,
        body: editBody,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(id, {
              onSuccess: () => {
                router.back();
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error || !entry) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-base text-red-500 mt-3 text-center">
          Failed to load journal entry.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-indigo-500 text-base font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate = format(parseISO(entry.entry_date), 'EEEE, MMMM d, yyyy');

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Entry' : 'Entry',
          headerRight: () => (
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={handleToggleFavorite} hitSlop={8}>
                <Ionicons
                  name={entry.is_favorite ? 'star' : 'star-outline'}
                  size={24}
                  color={entry.is_favorite ? '#f59e0b' : '#9ca3af'}
                />
              </TouchableOpacity>
              {!isEditing && (
                <TouchableOpacity onPress={handleDelete} hitSlop={8}>
                  <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />

      <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
        {isEditing ? (
          <View>
            <Text className="text-xs font-medium text-gray-500 uppercase mb-1 ml-1">
              Title
            </Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Entry title (optional)"
              placeholderTextColor="#9ca3af"
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 mb-4"
            />

            <Text className="text-xs font-medium text-gray-500 uppercase mb-1 ml-1">
              Body
            </Text>
            <TextInput
              value={editBody}
              onChangeText={setEditBody}
              placeholder="Write your thoughts..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 mb-4"
              style={{ minHeight: 200 }}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleCancelEditing}
                className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
              >
                <Text className="text-base font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={!editBody.trim() || updateMutation.isPending}
                className={`flex-1 rounded-xl py-3 items-center ${
                  !editBody.trim() || updateMutation.isPending
                    ? 'bg-indigo-300'
                    : 'bg-indigo-500'
                }`}
              >
                <Text className="text-base font-semibold text-white">
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <View className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {entry.title || 'Untitled'}
              </Text>
              <View className="flex-row items-center mb-4">
                <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                <Text className="text-sm text-gray-400 ml-1">{formattedDate}</Text>
                <Text className="text-sm text-gray-300 mx-2">|</Text>
                <Text className="text-sm text-gray-400">
                  {entry.word_count} {entry.word_count === 1 ? 'word' : 'words'}
                </Text>
              </View>
              <Text className="text-base text-gray-700 leading-6">{entry.body}</Text>
            </View>

            <TouchableOpacity
              onPress={handleStartEditing}
              className="bg-indigo-500 rounded-xl py-3 items-center"
            >
              <Text className="text-base font-semibold text-white">Edit Entry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}
