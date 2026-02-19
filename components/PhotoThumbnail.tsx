import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { usePhotoUrl } from "../hooks/usePhotos";
import { Photo } from "../types/database";

interface PhotoThumbnailProps {
  photo: Photo;
  size?: number;
  onPress?: () => void;
}

export default function PhotoThumbnail({
  photo,
  size = 100,
  onPress,
}: PhotoThumbnailProps) {
  const { data: url, isLoading } = usePhotoUrl(photo.storage_path);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      style={{ width: size, height: size }}
      className="rounded-lg overflow-hidden bg-gray-100"
    >
      {isLoading || !url ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#9ca3af" />
        </View>
      ) : (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
        />
      )}
      {photo.caption ? (
        <View className="absolute bottom-0 left-0 right-0 bg-black/40 px-1.5 py-0.5">
          <Text className="text-white text-[10px]" numberOfLines={1}>
            {photo.caption}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
