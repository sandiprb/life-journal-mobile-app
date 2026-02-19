import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import {
  useLifeEvent,
  useUpdateLifeEvent,
  useDeleteLifeEvent,
} from "../../../hooks/useLifeEvents";
import {
  usePhotosByLifeEvent,
  useUploadPhoto,
  useDeletePhoto,
} from "../../../hooks/usePhotos";
import PhotoThumbnail from "../../../components/PhotoThumbnail";
import {
  EVENT_CATEGORIES,
  getCategoryOption,
} from "../../../constants/categories";
import { EventCategory, MoodValue, Photo } from "../../../types/database";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: event, isLoading, error } = useLifeEvent(id);
  const updateEvent = useUpdateLifeEvent();
  const deleteEvent = useDeleteLifeEvent();
  const { data: photos } = usePhotosByLifeEvent(id);
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<EventCategory>("other");
  const [editLocation, setEditLocation] = useState("");
  const [editSignificance, setEditSignificance] = useState<MoodValue>(3);

  const startEditing = () => {
    if (!event) return;
    setEditTitle(event.title);
    setEditDescription(event.description || "");
    setEditCategory(event.category);
    setEditLocation(event.location || "");
    setEditSignificance(event.significance);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!event || !editTitle.trim()) return;
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        category: editCategory,
        location: editLocation.trim() || null,
        significance: editSignificance,
      });
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEvent.mutateAsync(id);
              router.back();
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const handleAddPhotos = async () => {
    try {
      await uploadPhoto.mutateAsync({ life_event_id: id });
    } catch (error: any) {
      if (error?.message === "Image selection cancelled") return;
      Alert.alert("Upload Failed", error?.message || "Failed to upload photos.");
    }
  };

  const handleDeletePhoto = (photo: Photo) => {
    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePhoto.mutateAsync(photo);
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-lg font-semibold text-gray-700 mt-4">
          Event not found
        </Text>
        <Text className="text-sm text-gray-400 mt-1 text-center">
          This event may have been deleted or is unavailable.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 px-6 py-2.5 bg-blue-600 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category = getCategoryOption(event.category);

  if (isEditing) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Title
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Event title"
          />

          {/* Description */}
          <Text className="text-sm font-medium text-gray-700 mt-5 mb-1.5">
            Description
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            value={editDescription}
            onChangeText={setEditDescription}
            placeholder="Describe this event..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
          />

          {/* Category */}
          <Text className="text-sm font-medium text-gray-700 mt-5 mb-2">
            Category
          </Text>
          <View className="flex-row flex-wrap">
            {EVENT_CATEGORIES.map((cat) => {
              const isSelected = editCategory === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setEditCategory(cat.value)}
                  className="flex-row items-center px-3 py-2 rounded-lg mr-2 mb-2"
                  style={{
                    backgroundColor: isSelected ? cat.color + "1A" : "#f3f4f6",
                    borderWidth: isSelected ? 1.5 : 1,
                    borderColor: isSelected ? cat.color : "#e5e7eb",
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={isSelected ? cat.color : "#9ca3af"}
                  />
                  <Text
                    className="ml-1.5 text-xs font-medium"
                    style={{
                      color: isSelected ? cat.color : "#6b7280",
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Location */}
          <Text className="text-sm font-medium text-gray-700 mt-5 mb-1.5">
            Location
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            value={editLocation}
            onChangeText={setEditLocation}
            placeholder="Where did it happen?"
          />

          {/* Significance */}
          <Text className="text-sm font-medium text-gray-700 mt-5 mb-2">
            Significance
          </Text>
          <View className="flex-row">
            {([1, 2, 3, 4, 5] as MoodValue[]).map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setEditSignificance(val)}
                className="mr-2"
              >
                <Ionicons
                  name={val <= editSignificance ? "star" : "star-outline"}
                  size={32}
                  color={val <= editSignificance ? "#f59e0b" : "#d1d5db"}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Photos in edit mode */}
          <Text className="text-sm font-medium text-gray-700 mt-5 mb-2">
            Photos
          </Text>
          <View className="flex-row flex-wrap">
            {photos?.map((photo) => (
              <View key={photo.id} className="mr-2 mb-2" style={{ position: "relative" }}>
                <PhotoThumbnail photo={photo} size={80} />
                <TouchableOpacity
                  onPress={() => handleDeletePhoto(photo)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    backgroundColor: "#ef4444",
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="close" size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={handleAddPhotos}
              disabled={uploadPhoto.isPending}
              className="items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg"
              style={{ width: 80, height: 80 }}
            >
              {uploadPhoto.isPending ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={24} color="#9ca3af" />
                  <Text className="text-[10px] text-gray-400 mt-1">Add</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View className="flex-row mt-8">
            <TouchableOpacity
              onPress={cancelEditing}
              className="flex-1 py-3 items-center rounded-xl border border-gray-300 mr-3"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={updateEvent.isPending || !editTitle.trim()}
              className={`flex-1 py-3 items-center rounded-xl ${
                updateEvent.isPending || !editTitle.trim()
                  ? "bg-blue-300"
                  : "bg-blue-600"
              }`}
            >
              <Text className="text-white font-semibold">
                {updateEvent.isPending ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // View mode
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header with category badge */}
      <View className="px-6 pt-6">
        <View className="flex-row items-center mb-4">
          <View
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{ backgroundColor: category.color + "1A" }}
          >
            <Ionicons
              name={category.icon as any}
              size={14}
              color={category.color}
            />
            <Text
              className="ml-1.5 text-xs font-semibold"
              style={{ color: category.color }}
            >
              {category.label}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-gray-900">{event.title}</Text>

        {/* Dates */}
        <View className="flex-row items-center mt-3">
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1.5">
            {format(parseISO(event.event_date), "MMMM d, yyyy")}
            {event.end_date
              ? ` - ${format(parseISO(event.end_date), "MMMM d, yyyy")}`
              : ""}
          </Text>
        </View>

        {/* Location */}
        {event.location ? (
          <View className="flex-row items-center mt-2">
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1.5">
              {event.location}
            </Text>
          </View>
        ) : null}

        {/* Significance */}
        <View className="flex-row items-center mt-3">
          <Text className="text-sm text-gray-500 mr-2">Significance</Text>
          <View className="flex-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < event.significance ? "star" : "star-outline"}
                size={18}
                color={i < event.significance ? "#f59e0b" : "#d1d5db"}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Description */}
      {event.description ? (
        <View className="px-6 mt-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Description
          </Text>
          <Text className="text-base text-gray-800 leading-6">
            {event.description}
          </Text>
        </View>
      ) : null}

      {/* Photos */}
      <View className="px-6 mt-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Photos
        </Text>
        <View className="flex-row flex-wrap">
          {photos?.map((photo) => (
            <View key={photo.id} className="mr-2 mb-2">
              <PhotoThumbnail photo={photo} size={100} />
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={handleAddPhotos}
          disabled={uploadPhoto.isPending}
          className="flex-row items-center justify-center py-2.5 mt-1 border border-dashed border-gray-300 rounded-xl"
        >
          {uploadPhoto.isPending ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={18} color="#6b7280" />
              <Text className="text-sm text-gray-500 ml-1.5">Add Photos</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* AI Summary */}
      {event.ai_summary ? (
        <View className="mx-6 mt-6 p-4 bg-blue-50 rounded-xl">
          <View className="flex-row items-center mb-2">
            <Ionicons name="sparkles" size={16} color="#2563eb" />
            <Text className="text-sm font-semibold text-blue-700 ml-1.5">
              AI Summary
            </Text>
          </View>
          <Text className="text-sm text-blue-900 leading-5">
            {event.ai_summary}
          </Text>
        </View>
      ) : null}

      {/* AI Tags */}
      {event.ai_tags && event.ai_tags.length > 0 ? (
        <View className="px-6 mt-4">
          <View className="flex-row flex-wrap">
            {event.ai_tags.map((tag, i) => (
              <View
                key={i}
                className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2"
              >
                <Text className="text-xs text-gray-600">{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Action buttons */}
      <View className="px-6 mt-8">
        <TouchableOpacity
          onPress={startEditing}
          className="flex-row items-center justify-center py-3 bg-blue-600 rounded-xl"
        >
          <Ionicons name="create-outline" size={18} color="#ffffff" />
          <Text className="text-white font-semibold ml-2">Edit Event</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleteEvent.isPending}
          className="flex-row items-center justify-center py-3 mt-3 border border-red-300 rounded-xl"
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-2">
            {deleteEvent.isPending ? "Deleting..." : "Delete Event"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
