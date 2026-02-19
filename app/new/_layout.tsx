import { Stack } from "expo-router";

export default function NewLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="journal-entry" options={{ title: "New Entry" }} />
      <Stack.Screen name="life-event" options={{ title: "New Event" }} />
      <Stack.Screen name="mood-checkin" options={{ title: "Mood Check-in" }} />
    </Stack>
  );
}
