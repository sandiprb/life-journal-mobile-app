import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUploadPhoto } from '../hooks/usePhotos';
import { Photo } from '../types/database';

interface PhotoPickerProps {
  lifeEventId: string;
  onPhotosPicked?: (photos: Photo[]) => void;
}

export default function PhotoPicker({
  lifeEventId,
  onPhotosPicked,
}: PhotoPickerProps) {
  const uploadPhoto = useUploadPhoto();

  const handlePress = async () => {
    try {
      const photos = await uploadPhoto.mutateAsync({
        life_event_id: lifeEventId,
      });
      onPhotosPicked?.(photos);
    } catch (error: any) {
      if (error?.message === 'Image selection cancelled') {
        return;
      }
      Alert.alert('Upload Failed', error?.message || 'Failed to upload photo.');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={uploadPhoto.isPending}
      activeOpacity={0.7}
      className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center justify-center bg-gray-50"
    >
      {uploadPhoto.isPending ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-sm text-gray-500 mt-2">Uploading...</Text>
        </View>
      ) : (
        <View className="items-center">
          <Ionicons name="camera-outline" size={32} color="#9ca3af" />
          <Text className="text-sm text-gray-500 mt-2">Add Photos</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
