import { Stack } from "expo-router";

export default function EventsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Life Events" }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Event" }}
      />
    </Stack>
  );
}
