import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

async function authHeaders() {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Cần đăng nhập');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** POST /notifications/register-token — đăng ký FCM token (gọi sau khi có token từ expo-notifications hoặc Firebase) */
export async function registerNotificationToken(fcmToken) {
  const response = await axios.post(
    `${API_BASE_URL}/notifications/register-token`,
    { fcmToken: fcmToken?.trim() },
    { headers: await authHeaders() }
  );
  const data = response.data;
  if (data.status !== 'OK') throw new Error(data.message || 'Đăng ký thất bại');
  return data;
}

/** GET /notifications?page=&limit=&isRead=&type= */
export async function getNotifications({ page = 1, limit = 20, isRead, type } = {}) {
  const params = { page, limit };
  if (isRead !== undefined) params.isRead = isRead;
  if (type) params.type = type;
  const response = await axios.get(`${API_BASE_URL}/notifications`, {
    params,
    headers: await authHeaders(),
  });
  const data = response.data;
  if (data.status !== 'OK') throw new Error(data.message || 'Lấy thông báo thất bại');
  return {
    list: data.data || [],
    pagination: data.pagination || {},
    unreadCount: data.unreadCount ?? 0,
  };
}

/** GET /notifications/unread-count */
export async function getUnreadCount() {
  const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
    headers: await authHeaders(),
  });
  const data = response.data;
  if (data.status !== 'OK') throw new Error(data.message || 'Lỗi');
  return data.count ?? 0;
}

/** PUT /notifications/:notificationId/read */
export async function markAsRead(notificationId) {
  const response = await axios.put(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {},
    { headers: await authHeaders() }
  );
  const data = response.data;
  if (data.status !== 'OK') throw new Error(data.message || 'Lỗi');
  return data;
}

/** PUT /notifications/read-all */
export async function markAllAsRead() {
  const response = await axios.put(
    `${API_BASE_URL}/notifications/read-all`,
    {},
    { headers: await authHeaders() }
  );
  const data = response.data;
  if (data.status !== 'OK') throw new Error(data.message || 'Lỗi');
  return data;
}
