import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useCreateJournalEntry } from '../../hooks/useJournalEntries';

export default function NewJournalEntryModal() {
  const router = useRouter();
  const createMutation = useCreateJournalEntry();

  const [entryDate, setEntryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const charCount = body.length;
  const canSave = body.trim().length > 0;

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEntryDate(selectedDate);
    }
  };

  const handleSave = () => {
    if (!canSave) return;

    createMutation.mutate(
      {
        title: title.trim() || undefined,
        body: body.trim(),
        entry_date: format(entryDate, 'yyyy-MM-dd'),
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      }
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Entry',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
              <Text style={{ fontSize: 16, color: '#6366f1' }}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave || createMutation.isPending}
              hitSlop={8}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: canSave && !createMutation.isPending ? '#6366f1' : '#d1d5db',
                }}
              >
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        <ScrollView
          className="flex-1 bg-gray-50"
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#6366f1" />
            <Text className="text-sm text-indigo-500 ml-1 font-medium">
              {format(entryDate, 'EEEE, MMMM d, yyyy')}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#6366f1" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={entryDate}
              mode="date"
              display="inline"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Entry title (optional)"
            placeholderTextColor="#9ca3af"
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 mb-3"
          />

          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write your thoughts..."
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            autoFocus
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 mb-4"
            style={{ minHeight: 250 }}
          />

          <View className="flex-row items-center justify-between px-1">
            <Text className="text-xs text-gray-400">
              {charCount} {charCount === 1 ? 'character' : 'characters'}
            </Text>
            <Text className="text-xs text-gray-400">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </Text>
          </View>

          {createMutation.isError && (
            <View className="bg-red-50 rounded-xl p-3 mt-4 flex-row items-center">
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text className="text-sm text-red-600 ml-2 flex-1">
                Failed to save entry. Please try again.
              </Text>
            </View>
          )}

          {/* Inline save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave || createMutation.isPending}
            className={`mt-6 py-3.5 items-center rounded-xl ${
              canSave && !createMutation.isPending ? 'bg-indigo-500' : 'bg-indigo-300'
            }`}
          >
            <Text className="text-white font-semibold text-base">
              {createMutation.isPending ? 'Saving...' : 'Save Entry'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
