import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useLifeEvents } from "../../../hooks/useLifeEvents";
import {
  EVENT_CATEGORIES,
  getCategoryOption,
} from "../../../constants/categories";
import SearchBar from "../../../components/SearchBar";
import { EventCategory, LifeEvent } from "../../../types/database";

export default function EventsListScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<
    EventCategory | undefined
  >(undefined);
  const [search, setSearch] = useState("");

  const { data: events, isLoading } = useLifeEvents(selectedCategory);

  const filteredEvents = useMemo(() => {
    if (!events || !search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    );
  }, [events, search]);

  return (
    <View className="flex-1 bg-white">
      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-14 border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory(undefined)}
          className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
            selectedCategory === undefined
              ? "bg-blue-600"
              : "bg-gray-100"
          }`}
        >
          <Ionicons
            name="grid"
            size={14}
            color={selectedCategory === undefined ? "#ffffff" : "#6b7280"}
          />
          <Text
            className={`ml-1.5 text-sm font-medium ${
              selectedCategory === undefined
                ? "text-white"
                : "text-gray-600"
            }`}
          >
            All
          </Text>
        </TouchableOpacity>
        {EVENT_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <TouchableOpacity
              key={cat.value}
              onPress={() =>
                setSelectedCategory(isSelected ? undefined : cat.value)
              }
              className={`flex-row items-center px-4 py-2 rounded-full mr-2`}
              style={{
                backgroundColor: isSelected ? cat.color : "#f3f4f6",
              }}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={isSelected ? "#ffffff" : cat.color}
              />
              <Text
                className={`ml-1.5 text-sm font-medium`}
                style={{ color: isSelected ? "#ffffff" : "#4b5563" }}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Events list */}
      <FlatList
        className="flex-1"
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => router.push(`/(tabs)/events/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          events && events.length > 0 ? (
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search events..."
            />
          ) : null
        }
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 100 }}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator className="py-16" size="large" color="#2563eb" />
          ) : (
            <View className="items-center justify-center py-16 px-6">
              <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
              <Text className="text-lg font-semibold text-gray-400 mt-4">
                {search.trim() ? "No events match your search" : "No events yet"}
              </Text>
              <Text className="text-sm text-gray-400 mt-1 text-center">
                {search.trim()
                  ? "Try a different search term"
                  : "Tap the + button to record your first life event"}
              </Text>
            </View>
          )
        }
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push("/new/life-event")}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center"
        style={{
          shadowColor: "#2563eb",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

function EventCard({
  event,
  onPress,
}: {
  event: LifeEvent;
  onPress: () => void;
}) {
  const category = getCategoryOption(event.category);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-4 my-1.5 p-4 bg-white rounded-xl border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start">
        {/* Category icon */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: category.color + "1A" }}
        >
          <Ionicons
            name={category.icon as any}
            size={18}
            color={category.color}
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {event.title}
          </Text>

          <View className="flex-row items-center mt-1">
            <Text className="text-xs text-gray-500">
              {format(parseISO(event.event_date), "MMM d, yyyy")}
            </Text>
            {event.location ? (
              <View className="flex-row items-center ml-3">
                <Ionicons name="location-outline" size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-500 ml-0.5" numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Significance stars */}
        <View className="flex-row ml-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < event.significance ? "star" : "star-outline"}
              size={12}
              color={i < event.significance ? "#f59e0b" : "#d1d5db"}
            />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}
