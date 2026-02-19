import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { format, parseISO } from "date-fns";
import MoodSelector from "../../components/MoodSelector";
import {
  useMoodEntries,
  useTodayMoods,
  useCreateMoodEntry,
} from "../../hooks/useMoodEntries";
import { getMoodOption } from "../../constants/moods";
import { MoodValue, MoodEntry } from "../../types/database";

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const [note, setNote] = useState("");

  const { data: todayMoods, isLoading: loadingToday } = useTodayMoods();
  const { data: entries, isLoading: loadingEntries } = useMoodEntries();
  const createMood = useCreateMoodEntry();

  const handleMoodSelect = (mood: MoodValue) => {
    setSelectedMood(mood);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert("Select a mood", "Please select how you're feeling today.");
      return;
    }
    try {
      await createMood.mutateAsync({ mood: selectedMood, note: note.trim() || undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedMood(null);
      setNote("");
      Alert.alert("Saved!", "Your mood has been recorded.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <FlatList
      className="flex-1 bg-white"
      ListHeaderComponent={
        <View className="px-6 pt-6 pb-4">
          <Text className="text-xl font-bold text-gray-900 mb-1">
            How are you feeling?
          </Text>
          <Text className="text-sm text-gray-500 mb-6">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </Text>

          {loadingToday ? (
            <ActivityIndicator className="py-8" />
          ) : (
            <>
              <MoodSelector selected={selectedMood} onSelect={handleMoodSelect} />

              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base mt-6"
                placeholder="Add a note about your day... (optional)"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity
                className={`rounded-xl py-3 items-center mt-4 ${
                  createMood.isPending || !selectedMood
                    ? "bg-primary-300"
                    : "bg-primary-600"
                }`}
                onPress={handleSave}
                disabled={createMood.isPending || !selectedMood}
              >
                <Text className="text-white font-semibold text-base">
                  {createMood.isPending ? "Saving..." : "Log Mood"}
                </Text>
              </TouchableOpacity>

              <Text className="text-lg font-semibold text-gray-900 mt-8 mb-3">
                Recent Moods
              </Text>
            </>
          )}
        </View>
      }
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MoodHistoryItem entry={item} />}
      ListEmptyComponent={
        !loadingEntries ? (
          <Text className="text-center text-gray-400 py-8">
            No mood entries yet. Start tracking today!
          </Text>
        ) : (
          <ActivityIndicator className="py-8" />
        )
      }
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}

function MoodHistoryItem({ entry }: { entry: MoodEntry }) {
  const mood = getMoodOption(entry.mood);

  return (
    <View className="flex-row items-center px-6 py-3 border-b border-gray-100">
      <Text className="text-2xl mr-3">{mood.emoji}</Text>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="font-medium text-gray-900">{mood.label}</Text>
          <Text className="text-xs text-gray-400 ml-2">
            {format(new Date(entry.created_at), "MMM d, yyyy  h:mm a")}
          </Text>
        </View>
        {entry.note ? (
          <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={2}>
            {entry.note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
