import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

export async function addFavoriteApi(productId) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Bạn cần đăng nhập để thêm sản phẩm yêu thích');
    }

    const response = await axios.post(
      `${API_BASE_URL}/favorites`,
      { productId },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Không thể thêm sản phẩm vào danh sách yêu thích');
    }

    return result;
  } catch (error) {
    // Chuẩn hóa message theo BE tài liệu
    const msg =
      error.response?.data?.message ||
      error.message ||
      'Không thể thêm sản phẩm vào danh sách yêu thích';
    throw new Error(msg);
  }
}

export async function removeFavoriteApi(productId) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Bạn cần đăng nhập để bỏ sản phẩm yêu thích');
    }

    const response = await axios.delete(`${API_BASE_URL}/favorites/${productId}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Không thể bỏ sản phẩm yêu thích');
    }

    return result;
  } catch (error) {
    const msg =
      error.response?.data?.message ||
      error.message ||
      'Không thể bỏ sản phẩm yêu thích';
    throw new Error(msg);
  }
}

export async function checkFavoriteApi(productId) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      // Nếu chưa đăng nhập thì mặc định không phải yêu thích
      return { isFavorite: false };
    }

    const response = await axios.get(`${API_BASE_URL}/favorites/check/${productId}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Không thể kiểm tra trạng thái yêu thích');
    }

    return { isFavorite: !!result.data?.isFavorite };
  } catch (error) {
    // Lỗi validate productId thì xem như chưa yêu thích
    const msg = error.response?.data?.message || error.message || '';
    if (msg === 'Invalid productId') {
      return { isFavorite: false };
    }
    throw new Error(
      msg || 'Không thể kiểm tra trạng thái yêu thích'
    );
  }
}

export async function getFavoritesApi({
  page = 1,
  limit = 12,
  search = '',
  category,
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Bạn cần đăng nhập để xem danh sách yêu thích');
    }

    const params = new URLSearchParams({
      page: String(page),
      limit: String(Math.min(limit, 100)),
      sortBy: String(sortBy),
      sortOrder: String(sortOrder),
    });

    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }
    if (category) {
      params.append('category', String(category));
    }

    const response = await axios.get(`${API_BASE_URL}/favorites?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Không thể lấy danh sách sản phẩm yêu thích');
    }

    return {
      status: result.status,
      data: result.data || [],
      pagination: result.pagination || {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error) {
    const msg =
      error.response?.data?.message ||
      error.message ||
      'Không thể lấy danh sách sản phẩm yêu thích';
    throw new Error(msg);
  }
}

