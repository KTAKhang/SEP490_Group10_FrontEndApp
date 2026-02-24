import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

/**
 * Gửi FormData (có file) bằng XMLHttpRequest.
 * Trên React Native, XHR thường xử lý multipart ổn định hơn fetch/axios.
 * Không set Content-Type để runtime tự gắn multipart/form-data; boundary=...
 */
function sendFormDataWithXHR(method, url, formData, token) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const TIMEOUT_MS = 30000;
    xhr.timeout = TIMEOUT_MS;
    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ status: xhr.status, data: result });
        } else {
          reject(new Error(result.message || `Lỗi ${xhr.status}`));
        }
      } catch (_) {
        reject(new Error('Phản hồi không hợp lệ'));
      }
    };
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Gửi quá lâu. Thử lại hoặc giảm kích thước ảnh.'));
    xhr.open(method, url);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

/**
 * Chuẩn hóa review từ backend cho UI: content (từ comment), user (từ user_id)
 */
function normalizeReview(r) {
  if (!r) return r;
  return {
    ...r,
    content: r.content ?? r.comment ?? '',
    comment: r.comment ?? r.content ?? '',
    user: r.user ?? r.user_id ?? {},
    product: r.product ?? (r.product_id ? { _id: r.product_id } : {}),
  };
}

/**
 * Backend: GET /reviews/product/:productId
 * Query: page, limit, rating (optional, 1-5: filter by star. Backend cần thêm query.rating vào filter.)
 * Response: { status: "OK", data: Review[], pagination: { page, limit, total, totalPages } }
 */
export async function getProductReviewsByProductId(product_id, { page = 1, limit = 10, rating } = {}) {
  try {
    if (!product_id) throw new Error('Product ID is required');

    const params = new URLSearchParams({
      page: String(Math.max(1, parseInt(page, 10) || 1)),
      limit: String(Math.min(100, Math.max(1, parseInt(limit, 10) || 10))),
    });
    if (rating !== undefined && rating !== '' && rating !== null) {
      const r = parseInt(rating, 10);
      if (r >= 1 && r <= 5) params.append('rating', String(r));
    }
    const response = await axios.get(
      `${API_BASE_URL}/reviews/product/${product_id}?${params.toString()}`,
      {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      }
    );

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Failed to fetch reviews');
    }

    const list = (result.data || []).map(normalizeReview);
    const pagination = result.pagination || { page: 1, limit: 10, total: list.length, totalPages: 1 };
    return { list, pagination };
  } catch (error) {
    console.error('getProductReviewsByProductId error:', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to fetch reviews'
    );
  }
}

/**
 * Backend: POST /reviews (cần auth)
 * Body: orderId, productId, rating, comment hoặc FormData (khi có ảnh)
 */
export async function createReviewApi({ order_id, product_id, rating, comment }) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập để đánh giá.');

    const response = await axios.post(
      `${API_BASE_URL}/reviews`,
      {
        orderId: order_id,
        productId: product_id,
        rating: Number(rating),
        comment: (comment ?? '').trim(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Lỗi đánh giá sản phẩm');
    }

    return { status: 'OK', data: normalizeReview(result.data), message: result.message };
  } catch (error) {
    console.error('createReviewApi error:', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định khi đánh giá'
    );
  }
}

/**
 * POST /reviews với FormData (orderId, productId, rating, comment, images)
 * Dùng khi có ảnh đính kèm (multipart/form-data).
 * Dùng XMLHttpRequest để gửi FormData + file ổn định trên React Native.
 */
export async function createReviewWithFormDataApi(formData) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập để đánh giá.');

    const { data: result } = await sendFormDataWithXHR(
      'POST',
      `${API_BASE_URL}/reviews`,
      formData,
      token
    );

    if (result.status !== 'OK') {
      throw new Error(result.message || 'Lỗi đánh giá sản phẩm');
    }

    return { status: 'OK', data: normalizeReview(result.data), message: result.message };
  } catch (error) {
    console.error('createReviewWithFormDataApi error:', error);
    const isNetworkError =
      error.message === 'Network request failed' ||
      (error.message && error.message.includes('Network'));
    if (isNetworkError) {
      throw new Error(
        'Không kết nối được máy chủ. Kiểm tra: (1) Backend đang chạy, (2) Địa chỉ API trong config/api.js đúng với thiết bị (máy thật: IP máy tính; emulator: 10.0.2.2:3001), (3) Cùng mạng WiFi.'
      );
    }
    throw new Error(error.message || 'Lỗi không xác định khi đánh giá');
  }
}

/**
 * Backend: PUT /reviews/:reviewId (cần auth)
 * Body: rating, comment hoặc FormData khi có ảnh
 */
export async function updateReviewApi({ review_id, rating, comment }) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập.');

    const response = await axios.put(
      `${API_BASE_URL}/reviews/${review_id}`,
      {
        rating: Number(rating),
        comment: (comment ?? '').trim(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Lỗi cập nhật đánh giá');
    }

    return { status: 'OK', data: normalizeReview(result.data), message: result.message };
  } catch (error) {
    console.error('updateReviewApi error:', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định khi cập nhật đánh giá'
    );
  }
}

/**
 * PUT /reviews/:id với FormData (rating, comment, existingImages, existingImagePublicIds, images)
 * Dùng XMLHttpRequest để gửi FormData + file ổn định trên React Native.
 */
export async function updateReviewWithFormDataApi(reviewId, formData) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập.');

    const { data: result } = await sendFormDataWithXHR(
      'PUT',
      `${API_BASE_URL}/reviews/${reviewId}`,
      formData,
      token
    );

    if (result.status !== 'OK') {
      throw new Error(result.message || 'Lỗi cập nhật đánh giá');
    }

    return { status: 'OK', data: normalizeReview(result.data), message: result.message };
  } catch (error) {
    console.error('updateReviewWithFormDataApi error:', error);
    const isNetworkError =
      error.message === 'Network request failed' ||
      (error.message && error.message.includes('Network'));
    if (isNetworkError) {
      throw new Error(
        'Không kết nối được máy chủ. Kiểm tra: (1) Backend đang chạy, (2) Địa chỉ API trong config/api.js đúng với thiết bị (máy thật: IP máy tính; emulator: 10.0.2.2:3001), (3) Cùng mạng WiFi.'
      );
    }
    throw new Error(error.message || 'Lỗi không xác định khi cập nhật đánh giá');
  }
}

/**
 * Lấy đánh giá theo đơn hàng (customer).
 * Backend: GET /order/my-orders/:id (authUserMiddleware).
 */
export async function getReviewsByOrderIdApi(order_id) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập.');

    const response = await axios.get(`${API_BASE_URL}/order/my-orders/${order_id}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Lỗi khi lấy đơn hàng');
    }

    const reviews = (result.data?.reviews || []).map(normalizeReview);
    return reviews;
  } catch (error) {
    console.error('getReviewsByOrderIdApi error:', error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Lỗi không xác định khi lấy đánh giá theo đơn hàng'
    );
  }
}
