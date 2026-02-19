import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image as RNImage,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { useCreateLifeEvent } from "../../hooks/useLifeEvents";
import { EVENT_CATEGORIES } from "../../constants/categories";
import { EventCategory, MoodValue } from "../../types/database";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useQueryClient } from "@tanstack/react-query";

export default function NewLifeEventModal() {
  const router = useRouter();
  const createEvent = useCreateLifeEvent();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("milestone");
  const [eventDateObj, setEventDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState("");
  const [significance, setSignificance] = useState<MoodValue>(3);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = title.trim().length > 0;

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImages((prev) => [...prev, ...result.assets]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const event = await createEvent.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        event_date: format(eventDateObj, "yyyy-MM-dd"),
        location: location.trim() || undefined,
        significance,
      });

      // Upload selected photos for this event
      for (const asset of selectedImages) {
        const uri = asset.uri;
        const filename = uri.split("/").pop() || "photo.jpg";
        const mimeType = asset.mimeType || "image/jpeg";
        const width = asset.width ?? null;
        const height = asset.height ?? null;

        const file = new File(uri);
        const arrayBuffer = await file.arrayBuffer();

        const timestamp = Date.now();
        const storagePath = `${user!.id}/${timestamp}_${filename}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(storagePath, arrayBuffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase
          .from("photos")
          .insert({
            user_id: user!.id,
            storage_path: storagePath,
            filename,
            mime_type: mimeType,
            width,
            height,
            journal_entry_id: null,
            life_event_id: event.id,
          });

        if (insertError) throw insertError;
      }

      if (selectedImages.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["photos"] });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saving = isSaving || createEvent.isPending;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-blue-600 text-base">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">New Event</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          <Text
            className={`text-base font-semibold ${
              canSave && !saving
                ? "text-blue-600"
                : "text-blue-300"
            }`}
          >
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Title <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
          value={title}
          onChangeText={setTitle}
          placeholder="What happened?"
          autoFocus
        />

        {/* Description */}
        <Text className="text-sm font-medium text-gray-700 mt-5 mb-1.5">
          Description
        </Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell the story of this event..."
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
            const isSelected = category === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                onPress={() => {
                  setCategory(cat.value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="items-center justify-center px-3 py-2.5 rounded-xl mr-2 mb-2"
                style={{
                  backgroundColor: isSelected ? cat.color + "1A" : "#f3f4f6",
                  borderWidth: isSelected ? 1.5 : 1,
                  borderColor: isSelected ? cat.color : "#e5e7eb",
                  minWidth: 80,
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={isSelected ? cat.color : "#9ca3af"}
                />
                <Text
                  className="text-xs font-medium mt-1"
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

        {/* Event Date */}
        <Text className="text-sm font-medium text-gray-700 mt-5 mb-1.5">
          Date
        </Text>
        <TouchableOpacity
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center"
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <Ionicons name="calendar-outline" size={18} color="#6b7280" />
          <Text className="text-base text-gray-900 ml-2 flex-1">
            {format(eventDateObj, "MMMM d, yyyy")}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#9ca3af" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={eventDateObj}
            mode="date"
            display="inline"
            onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
              setShowDatePicker(false);
              if (selectedDate) setEventDateObj(selectedDate);
            }}
          />
        )}

        {/* Location */}
        <Text className="text-sm font-medium text-gray-700 mt-5 mb-1.5">
          Location
        </Text>
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
          <Ionicons name="location-outline" size={18} color="#6b7280" />
          <TextInput
            className="flex-1 py-3 ml-2 text-base text-gray-900"
            value={location}
            onChangeText={setLocation}
            placeholder="Where did it happen?"
          />
        </View>

        {/* Significance */}
        <Text className="text-sm font-medium text-gray-700 mt-5 mb-2">
          Significance
        </Text>
        <View className="flex-row items-center">
          {([1, 2, 3, 4, 5] as MoodValue[]).map((val) => (
            <TouchableOpacity
              key={val}
              onPress={() => {
                setSignificance(val);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="mr-3"
            >
              <Ionicons
                name={val <= significance ? "star" : "star-outline"}
                size={36}
                color={val <= significance ? "#f59e0b" : "#d1d5db"}
              />
            </TouchableOpacity>
          ))}
          <Text className="text-sm text-gray-400 ml-1">
            {significance}/5
          </Text>
        </View>

        {/* Photos */}
        <Text className="text-sm font-medium text-gray-700 mt-5 mb-2">
          Photos
        </Text>
        <View className="flex-row flex-wrap">
          {selectedImages.map((asset, index) => (
            <View key={index} className="mr-2 mb-2" style={{ position: "relative" }}>
              <RNImage
                source={{ uri: asset.uri }}
                style={{ width: 80, height: 80, borderRadius: 8 }}
              />
              <TouchableOpacity
                onPress={() => removeImage(index)}
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
            onPress={handlePickImages}
            className="items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg"
            style={{ width: 80, height: 80 }}
          >
            <Ionicons name="camera-outline" size={24} color="#9ca3af" />
            <Text className="text-[10px] text-gray-400 mt-1">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Save button (bottom) */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || saving}
          className={`mt-8 py-3.5 items-center rounded-xl ${
            canSave && !saving ? "bg-blue-600" : "bg-blue-300"
          }`}
        >
          <Text className="text-white font-semibold text-base">
            {saving ? "Saving..." : "Save Event"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
