import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Giỏ hàng - chỉ gọi backend (folder src).
 * GET /cart, POST /cart/add, PUT /cart/update, DELETE /cart/remove (body: product_ids)
 */

async function authHeaders() {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Bạn cần đăng nhập để sử dụng giỏ hàng');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getCartByUserApi() {
  try {
    const response = await axios.get(`${API_BASE_URL}/cart`, {
      headers: await authHeaders(),
    });
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Lấy giỏ hàng thất bại');
    }
    return data.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

export async function addToCartApi({ product_id, quantity }) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/cart/add`,
      { product_id, quantity },
      { headers: await authHeaders() }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Thêm vào giỏ thất bại');
    }
    return data.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

export async function updateCartApi({ product_id, quantity }) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/cart/update`,
      { product_id, quantity },
      { headers: await authHeaders() }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Cập nhật giỏ hàng thất bại');
    }
    return data.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

/**
 * Backend: DELETE /cart/remove, body { product_ids: [...] } hoặc product_id đơn (gửi dạng mảng 1 phần tử).
 */
export async function removeFromCartApi(product_id) {
  try {
    const product_ids = Array.isArray(product_id) ? product_id : [product_id];
    const response = await axios.delete(`${API_BASE_URL}/cart/remove`, {
      headers: await authHeaders(),
      data: { product_ids },
    });
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Xóa khỏi giỏ thất bại');
    }
    return data.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
