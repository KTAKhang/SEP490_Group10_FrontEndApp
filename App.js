import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import { Provider } from "react-redux";
import { store } from "./store/index";
import AppNavigator from "./navigation/AppNavigator";
import Toast from "react-native-toast-message";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useEffect } from "react";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

function AppContent() {
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
    ...Ionicons.font,
  });
  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#13C2C2" />
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
      <Toast />
    </View>
  );
}

export default function App() {
  useEffect(() => {
    GoogleSignin.configure({
      // Đảm bảo ID này lấy từ bản mới nhất trên Firebase Console (Type 3)
      webClientId:
        "97674304678-1n2qeutinlrucvpg5fug479kb9er529p.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }, []); // PHẢI có dấu [] này để chỉ chạy 1 lần duy nhất khi app mở
  return (
    <ActionSheetProvider>
      <Provider store={store}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </Provider>
    </ActionSheetProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
});
