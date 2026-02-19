import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      Alert.alert("Sign In Error", error.message);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center px-8">
      <Text className="text-4xl font-bold text-center text-primary-600 mb-2">
        Life Journal
      </Text>
      <Text className="text-base text-gray-500 text-center mb-10">
        Your personal space for reflection
      </Text>

      <TouchableOpacity
        className={`flex-row items-center justify-center rounded-xl py-3.5 ${
          loading ? "bg-gray-100" : "bg-white border border-gray-300"
        }`}
        onPress={handleGoogleSignIn}
        disabled={loading}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text className="text-gray-700 font-semibold text-base ml-3">
              Continue with Google
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
