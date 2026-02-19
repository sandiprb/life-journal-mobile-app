import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { JournalEntry } from '../types/database';

interface EntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
}

export default function EntryCard({ entry, onPress }: EntryCardProps) {
  const formattedDate = format(new Date(entry.created_at), 'MMM d, yyyy  h:mm a');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 mx-4"
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
          {entry.title || 'Untitled'}
        </Text>
        {entry.is_favorite && (
          <Ionicons name="star" size={16} color="#f59e0b" />
        )}
      </View>

      {entry.body ? (
        <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
          {entry.body}
        </Text>
      ) : null}

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-400">{formattedDate}</Text>
        <Text className="text-xs text-gray-400">
          {entry.word_count} {entry.word_count === 1 ? 'word' : 'words'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
