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

/** GET /discounts/customer/valid?orderValue= — danh sách voucher còn dùng được */
export async function getValidVouchers(orderValue = null) {
  const params = orderValue != null ? { orderValue } : {};
  const response = await axios.get(`${API_BASE_URL}/discounts/customer/valid`, {
    params,
    headers: await authHeaders(),
  });
  const data = response.data;
  if (data.status !== 'OK') throw new Error(data.message || 'Lấy voucher thất bại');
  return data.data || [];
}

/** POST /discounts/customer/validate — kiểm tra mã giảm giá (body: code, orderValue) */
export async function validateVoucherCode({ code, orderValue }) {
  const response = await axios.post(
    `${API_BASE_URL}/discounts/customer/validate`,
    { code: code?.trim(), orderValue },
    { headers: await authHeaders() }
  );
  const data = response.data;
  if (data.status !== 'OK') throw new Error(data.message || 'Mã không hợp lệ');
  return data.data; // { discountId, code, discountAmount, ... }
}

/** POST /discounts/customer/apply — áp dụng voucher khi tạo đơn (body: discountId, orderValue, orderId?) */
export async function applyVoucher({ discountId, orderValue, orderId = null }) {
  const response = await axios.post(
    `${API_BASE_URL}/discounts/customer/apply`,
    { discountId, orderValue, orderId },
    { headers: await authHeaders() }
  );
  const data = response.data;
  if (data.status !== 'OK') throw new Error(data.message || 'Áp dụng thất bại');
  return data.data;
}

/** GET /discounts/customer/history — lịch sử đã dùng voucher */
export async function getVoucherHistory() {
  const response = await axios.get(`${API_BASE_URL}/discounts/customer/history`, {
    headers: await authHeaders(),
  });
  const data = response.data;
  if (data.status !== 'OK') throw new Error(data.message || 'Lấy lịch sử thất bại');
  return data.data || [];
}
