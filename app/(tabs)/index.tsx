import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO, subDays } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../lib/auth";
import { useTodayMoods, useMoodEntries } from "../../hooks/useMoodEntries";
import { useJournalEntries } from "../../hooks/useJournalEntries";
import { useLifeEvents } from "../../hooks/useLifeEvents";
import { getMoodOption } from "../../constants/moods";
import { MoodEntry, EventCategory } from "../../types/database";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function computeMoodStreak(entries: MoodEntry[] | undefined): number {
  if (!entries || entries.length === 0) return 0;

  // entries are sorted by entry_date descending from the hook
  const today = format(new Date(), "yyyy-MM-dd");
  const sortedDates = [...new Set(entries.map((e) => e.entry_date))]
    .sort((a, b) => b.localeCompare(a)); // descending, unique dates

  // The streak must include today or yesterday to be "current"
  const mostRecent = sortedDates[0];
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const expectedDate = format(
      subDays(parseISO(sortedDates[i - 1]), 1),
      "yyyy-MM-dd"
    );
    if (sortedDates[i] === expectedDate) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

const CATEGORY_ICONS: Record<EventCategory, keyof typeof Ionicons.glyphMap> = {
  travel: "airplane",
  milestone: "trophy",
  health: "heart",
  career: "briefcase",
  relationship: "people",
  education: "school",
  creative: "color-palette",
  financial: "cash",
  other: "ellipsis-horizontal-circle",
};

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: todayMoods,
    isLoading: isTodayMoodLoading,
    refetch: refetchTodayMood,
  } = useTodayMoods();

  const latestTodayMood = todayMoods?.[0] ?? null;
  const {
    data: moodEntries,
    isLoading: isMoodEntriesLoading,
    refetch: refetchMoodEntries,
  } = useMoodEntries();
  const {
    data: journalEntries,
    isLoading: isJournalLoading,
    refetch: refetchJournal,
  } = useJournalEntries();
  const {
    data: lifeEvents,
    isLoading: isEventsLoading,
    refetch: refetchEvents,
  } = useLifeEvents();

  const isRefreshing =
    isTodayMoodLoading || isMoodEntriesLoading || isJournalLoading || isEventsLoading;

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const moodStreak = useMemo(() => computeMoodStreak(moodEntries), [moodEntries]);

  const recentJournals = useMemo(
    () => (journalEntries ?? []).slice(0, 3),
    [journalEntries]
  );

  const recentEvents = useMemo(
    () => (lifeEvents ?? []).slice(0, 3),
    [lifeEvents]
  );

  const todayFormatted = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="px-6 pt-8 pb-2">
        <Text className="text-2xl font-bold text-gray-900">
          {getGreeting()}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">{user?.email}</Text>
        <Text className="text-sm text-gray-400 mt-0.5">{todayFormatted}</Text>
      </View>

      {/* Today's Mood Card */}
      <View className="px-6 mt-4">
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Today's Mood
          </Text>
          {isTodayMoodLoading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : latestTodayMood ? (
            <View className="flex-row items-center">
              <Text className="text-4xl mr-3">
                {getMoodOption(latestTodayMood.mood).emoji}
              </Text>
              <View className="flex-1">
                <Text
                  className="text-lg font-semibold"
                  style={{ color: getMoodOption(latestTodayMood.mood).color }}
                >
                  {getMoodOption(latestTodayMood.mood).label}
                </Text>
                {latestTodayMood.note ? (
                  <Text
                    className="text-sm text-gray-500 mt-0.5"
                    numberOfLines={2}
                  >
                    {latestTodayMood.note}
                  </Text>
                ) : null}
                {(todayMoods?.length ?? 0) > 1 && (
                  <Text className="text-xs text-gray-400 mt-1">
                    +{(todayMoods?.length ?? 0) - 1} more today
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View className="items-center py-2">
              <Text className="text-gray-500 text-sm mb-3">
                How are you feeling today?
              </Text>
              <TouchableOpacity
                className="bg-blue-600 rounded-xl px-6 py-2.5"
                onPress={() => router.navigate("/(tabs)/mood")}
              >
                <Text className="text-white font-semibold text-sm">
                  Log Your Mood
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Quick Stats */}
      <View className="px-6 mt-5">
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Quick Stats
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
            <Ionicons name="book-outline" size={22} color="#2563eb" />
            <Text className="text-2xl font-bold text-gray-900 mt-1">
              {journalEntries?.length ?? 0}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">Journal Entries</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
            <Ionicons name="calendar-outline" size={22} color="#8b5cf6" />
            <Text className="text-2xl font-bold text-gray-900 mt-1">
              {lifeEvents?.length ?? 0}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">Life Events</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
            <Ionicons name="flame-outline" size={22} color="#f97316" />
            <Text className="text-2xl font-bold text-gray-900 mt-1">
              {moodStreak}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Recent Journal Entries */}
      <View className="px-6 mt-5">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-semibold text-gray-900">
            Recent Journal Entries
          </Text>
          <TouchableOpacity
            onPress={() => router.navigate("/(tabs)/journal")}
          >
            <Text className="text-sm text-blue-600 font-medium">See all</Text>
          </TouchableOpacity>
        </View>
        {isJournalLoading ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : recentJournals.length > 0 ? (
          <View className="gap-3">
            {recentJournals.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
                onPress={() =>
                  router.push(`/(tabs)/journal/${entry.id}`)
                }
                activeOpacity={0.7}
              >
                <Text
                  className="text-sm font-semibold text-gray-900"
                  numberOfLines={1}
                >
                  {entry.title || "Untitled Entry"}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">
                  {format(parseISO(entry.entry_date), "MMM d, yyyy")}
                </Text>
                <Text
                  className="text-sm text-gray-600 mt-1.5"
                  numberOfLines={2}
                >
                  {entry.body}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-5 shadow-sm items-center">
            <Text className="text-sm text-gray-400">
              No journal entries yet.
            </Text>
          </View>
        )}
      </View>

      {/* Recent Life Events */}
      <View className="px-6 mt-5">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-semibold text-gray-900">
            Recent Events
          </Text>
          <TouchableOpacity
            onPress={() => router.navigate("/(tabs)/events")}
          >
            <Text className="text-sm text-blue-600 font-medium">See all</Text>
          </TouchableOpacity>
        </View>
        {isEventsLoading ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : recentEvents.length > 0 ? (
          <View className="gap-3">
            {recentEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center"
                onPress={() =>
                  router.push(`/(tabs)/events/${event.id}`)
                }
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <Ionicons
                    name={CATEGORY_ICONS[event.category] || "ellipsis-horizontal-circle"}
                    size={20}
                    color="#6b7280"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold text-gray-900"
                    numberOfLines={1}
                  >
                    {event.title}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {format(parseISO(event.event_date), "MMM d, yyyy")}
                    {"  "}
                    <Text className="text-xs text-gray-400 capitalize">
                      {event.category}
                    </Text>
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-5 shadow-sm items-center">
            <Text className="text-sm text-gray-400">
              No life events yet.
            </Text>
          </View>
        )}
      </View>

      {/* Sign Out */}
      <View className="px-6 pt-8 pb-12">
        <TouchableOpacity
          className="py-3 items-center"
          onPress={signOut}
        >
          <Text className="text-sm text-gray-400 font-medium">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
