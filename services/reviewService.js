import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Đánh giá - chỉ gọi backend (folder src).
 * GET /reviews/product/:productId, POST /reviews (orderId, productId, rating, comment, images), PUT /reviews/:id
 */

async function authHeaders() {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Bạn cần đăng nhập để đánh giá');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getProductReviewsByProductId(product_id) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/reviews/product/${product_id}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Lấy đánh giá thất bại');
    }
    return data.data ?? data.reviews ?? [];
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Lấy đánh giá thất bại'
    );
  }
}

/**
 * Backend create: orderId, productId, rating, comment, images (optional multipart).
 */
export async function createReviewApi({
  product_id,
  order_id,
  order_detail_id,
  rating,
  review_content,
}) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/reviews`,
      {
        orderId: order_id,
        productId: product_id,
        rating,
        comment: review_content ?? '',
      },
      { headers: await authHeaders() }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Gửi đánh giá thất bại');
    }
    return data.data ?? data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Gửi đánh giá thất bại'
    );
  }
}

export async function updateReviewApi({
  review_id,
  rating,
  review_content,
}) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/reviews/${review_id}`,
      { rating, comment: review_content ?? '' },
      { headers: await authHeaders() }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Cập nhật đánh giá thất bại');
    }
    return data.data ?? data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Cập nhật đánh giá thất bại'
    );
  }
}

/**
 * Backend không có endpoint "đánh giá theo order". Trả về [] để UI không lỗi.
 */
export async function getReviewsByOrderIdApi(_order_id) {
  return [];
}
