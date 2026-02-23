import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

/** GET /preorder/fruit-types — danh sách loại trái cây có thể đặt trước (public) */
export async function getFruitTypes(params = {}) {
  const response = await axios.get(`${API_BASE_URL}/preorder/fruit-types`, {
    params: { page: params.page || 1, limit: params.limit || 20, ...params },
    headers: { 'Content-Type': 'application/json' },
  });
  const data = response.data;
  if (data.status === 'ERR') throw new Error(data.message || 'Lấy danh sách thất bại');
  return { list: data.data || [], pagination: data.pagination || {} };
}

/** GET /preorder/fruit-types/:id — chi tiết 1 loại trái (public) */
export async function getFruitTypeById(id) {
  const response = await axios.get(`${API_BASE_URL}/preorder/fruit-types/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = response.data;
  if (data.status === 'ERR') throw new Error(data.message || 'Không tìm thấy');
  return data.data;
}

async function authHeaders() {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Cần đăng nhập');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Deep link để VNPay redirect về app sau thanh toán */
const APP_VNPAY_RETURN_URL = 'shopapp://payment/vnpay/return';

/** Header để backend nhận diện app và dùng return URL deep link (fallback khi body không tới). */
const APP_PLATFORM_HEADERS = { 'X-Platform': 'app' };

/** POST /preorder/create-payment-intent — tạo intent đặt cọc 50%, trả về payUrl VNPay. App gửi returnUrl + X-Platform để VNPay redirect về app. */
export async function createPreOrderPaymentIntent({ fruitTypeId, quantityKg, receiverInfo }) {
  const headers = { ...(await authHeaders()), ...APP_PLATFORM_HEADERS };
  const response = await axios.post(
    `${API_BASE_URL}/preorder/create-payment-intent`,
    {
      fruitTypeId,
      quantityKg,
      receiverInfo: receiverInfo || null,
      returnUrl: APP_VNPAY_RETURN_URL,
      platform: 'app',
    },
    { headers }
  );
  const data = response.data;
  if (!data.success) throw new Error(data.message || 'Tạo đơn đặt trước thất bại');
  return data; // { success, paymentIntentId, payUrl, expiresAt }
}

/** GET /preorder/my-pre-orders?page=&limit=&sortBy=&sortOrder=&status= */
export async function getMyPreOrders(params = {}) {
  const response = await axios.get(`${API_BASE_URL}/preorder/my-pre-orders`, {
    params: { page: 1, limit: 50, ...params },
    headers: await authHeaders(),
  });
  const data = response.data;
  if (data.status === 'ERR') throw new Error(data.message || 'Lấy đơn đặt trước thất bại');
  return {
    list: data.data || [],
    pagination: data.pagination || {},
  };
}

/** PUT /preorder/cancel/:id — hủy đơn đặt trước (backend có thể từ chối) */
export async function cancelPreOrder(id) {
  const response = await axios.put(
    `${API_BASE_URL}/preorder/cancel/${id}`,
    {},
    { headers: await authHeaders() }
  );
  const data = response.data;
  if (data.status === 'ERR') throw new Error(data.message || 'Hủy thất bại');
  return data;
}

/** POST /preorder/create-remaining-payment/:id — tạo link thanh toán 50% còn lại (VNPay). App gửi returnUrl + X-Platform để redirect về app. */
export async function createRemainingPayment(preOrderId) {
  const headers = { ...(await authHeaders()), ...APP_PLATFORM_HEADERS };
  const response = await axios.post(
    `${API_BASE_URL}/preorder/create-remaining-payment/${preOrderId}`,
    { returnUrl: APP_VNPAY_RETURN_URL, platform: 'app' },
    { headers }
  );
  const data = response.data;
  if (!data.success) throw new Error(data.message || 'Tạo thanh toán thất bại');
  return data; // { success, payUrl, expiresAt }
}
