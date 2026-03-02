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

/**
 * Loại voucher sinh nhật (birthday) khỏi danh sách hiển thị.
 * Birthday voucher chỉ dùng khi: đơn đủ điều kiện hoặc khách tự nhập mã lúc checkout.
 * Backend đã không trả về (isBirthdayDiscount: { $ne: true }); lọc thêm phía app để đồng bộ với web.
 */
function excludeBirthdayVouchers(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((v) => v.isBirthdayDiscount !== true);
}

/** GET /discounts/customer/valid?orderValue= — danh sách voucher còn dùng được (không gồm birthday voucher). */
export async function getValidVouchers(orderValue = null) {
  const params = orderValue != null ? { orderValue } : {};
  const response = await axios.get(`${API_BASE_URL}/discounts/customer/valid`, {
    params,
    headers: await authHeaders(),
  });
  const data = response.data;
  if (data.status !== 'OK') throw new Error(data.message || 'Lấy voucher thất bại');
  const raw = data.data || [];
  return excludeBirthdayVouchers(raw);
}

/** POST /discounts/customer/validate — kiểm tra mã giảm giá (body: code, orderValue) */
export async function validateVoucherCode({ code, orderValue }) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/discounts/customer/validate`,
      { code: code?.trim(), orderValue },
      { headers: await authHeaders() }
    );
    const data = response.data;
    if (data.status !== 'OK') throw new Error(data.message || 'Mã giảm giá không hợp lệ');
    return data.data; // { discountId, code, discountAmount, ... }
  } catch (err) {
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    if (err.message && !err.message.includes('status code')) {
      throw new Error(err.message);
    }
    throw new Error('Mã giảm giá không hợp lệ. Vui lòng kiểm tra lại mã hoặc điều kiện đơn hàng.');
  }
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
