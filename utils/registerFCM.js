import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { registerNotificationToken } from '../services/notificationService';

/**
 * Xin quyền thông báo, lấy FCM/APNs token và đăng ký với backend.
 * Gọi sau khi user đã đăng nhập (có token trong AsyncStorage).
 * Android: FCM token. iOS: APNs token (backend có thể dùng chung endpoint).
 */
export async function registerFCMTokenWithBackend() {
  if (Platform.OS === 'web') return; // FCM web đã xử lý riêng
  // Expo Go từ SDK 53 không hỗ trợ push; bỏ qua để tránh báo lỗi đỏ
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') return;

    // Android: FCM token. iOS: APNs token
    const tokenResult = await Notifications.getDevicePushTokenAsync();
    const pushToken = tokenResult?.data;
    if (!pushToken?.trim()) return;

    await registerNotificationToken(pushToken);
  } catch (e) {
    if (__DEV__ && Platform.OS !== 'web') {
      console.warn('[registerFCM]', e?.message || e);
    }
  }
}
