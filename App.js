import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/index';
import AppNavigator from './navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import  { useEffect } from 'react';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { View } from 'react-native';

export default function App() {
 useEffect(() => {
  GoogleSignin.configure({
    // Đảm bảo ID này lấy từ bản mới nhất trên Firebase Console (Type 3)
    webClientId: "97674304678-1n2qeutinlrucvpg5fug479kb9er529p.apps.googleusercontent.com",
    offlineAccess: true,
  });
}, []); // PHẢI có dấu [] này để chỉ chạy 1 lần duy nhất khi app mở
  return (
    <Provider store={store}>
      <ActionSheetProvider>
        <View style={{ flex: 1 }}>
          <AppNavigator />
          <Toast />
        </View>
      </ActionSheetProvider>
    </Provider>
  );
}