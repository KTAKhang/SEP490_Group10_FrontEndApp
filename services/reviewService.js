import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

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
 * Backend: GET /reviews/product/:productId (hoặc GET /reviews?productId=)
 * Response: { status: "OK", data: Review[], pagination }
 */
export async function getProductReviewsByProductId(product_id, { page = 1, limit = 20 } = {}) {
  try {
    if (!product_id) throw new Error('Product ID is required');

    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
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
    return list;
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
 */
export async function createReviewWithFormDataApi(formData) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập để đánh giá.');

    const response = await axios.post(`${API_BASE_URL}/reviews`, formData, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Lỗi đánh giá sản phẩm');
    }

    return { status: 'OK', data: normalizeReview(result.data), message: result.message };
  } catch (error) {
    console.error('createReviewWithFormDataApi error:', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định khi đánh giá'
    );
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
 */
export async function updateReviewWithFormDataApi(reviewId, formData) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập.');

    const response = await axios.put(`${API_BASE_URL}/reviews/${reviewId}`, formData, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Lỗi cập nhật đánh giá');
    }

    return { status: 'OK', data: normalizeReview(result.data), message: result.message };
  } catch (error) {
    console.error('updateReviewWithFormDataApi error:', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định khi cập nhật đánh giá'
    );
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
