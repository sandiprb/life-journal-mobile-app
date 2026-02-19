import { View, Text, TouchableOpacity } from "react-native";
import { MOOD_OPTIONS, MoodOption } from "../constants/moods";
import { MoodValue } from "../types/database";

interface MoodSelectorProps {
  selected: MoodValue | null;
  onSelect: (mood: MoodValue) => void;
}

export default function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <View className="flex-row justify-between px-2">
      {MOOD_OPTIONS.map((option) => (
        <MoodButton
          key={option.value}
          option={option}
          isSelected={selected === option.value}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </View>
  );
}

function MoodButton({
  option,
  isSelected,
  onPress,
}: {
  option: MoodOption;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="items-center rounded-2xl px-3 py-3"
      style={
        isSelected
          ? {
              backgroundColor: option.bgColor,
              borderWidth: 2,
              borderColor: option.color,
              transform: [{ scale: 1.1 }],
            }
          : {}
      }
    >
      <Text className="text-3xl mb-1">{option.emoji}</Text>
      <Text
        className={`text-xs font-medium ${
          isSelected ? "font-bold" : "text-gray-500"
        }`}
        style={isSelected ? { color: option.color } : {}}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  );
}
