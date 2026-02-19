import { useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useJournalEntries } from '../../../hooks/useJournalEntries';
import EntryCard from '../../../components/EntryCard';
import SearchBar from '../../../components/SearchBar';
import { JournalEntry } from '../../../types/database';

export default function JournalListScreen() {
  const router = useRouter();
  const { data: entries, isLoading, error } = useJournalEntries();
  const [search, setSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredEntries = useMemo(() => {
    if (!entries) return entries;
    let result = entries;
    if (showFavoritesOnly) {
      result = result.filter((e) => e.is_favorite);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          (e.title?.toLowerCase().includes(q)) ||
          e.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, search, showFavoritesOnly]);

  const handleEntryPress = (entry: JournalEntry) => {
    router.push(`/(tabs)/journal/${entry.id}`);
  };

  const handleNewEntry = () => {
    router.push('/new/journal-entry');
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-base text-red-500 mt-3 text-center">
          Failed to load journal entries. Pull down to retry.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard entry={item} onPress={() => handleEntryPress(item)} />
        )}
        ListHeaderComponent={
          entries && entries.length > 0 ? (
            <View>
              <View className="flex-row items-center px-4 mb-2">
                <View className="flex-1">
                  <SearchBar
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search journal entries..."
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="ml-2 p-2"
                >
                  <Ionicons
                    name={showFavoritesOnly ? "star" : "star-outline"}
                    size={22}
                    color={showFavoritesOnly ? "#f59e0b" : "#9ca3af"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={
          filteredEntries && filteredEntries.length > 0
            ? { paddingTop: 12, paddingBottom: 100 }
            : { flex: 1 }
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="book-outline" size={64} color="#d1d5db" />
            <Text className="text-base text-gray-400 mt-4 text-center">
              {search.trim()
                ? 'No entries match your search.'
                : 'No journal entries yet. Start writing!'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={handleNewEntry}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-500 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#6366f1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
