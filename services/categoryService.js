import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Danh mục public - chỉ gọi backend (folder src).
 * GET /categories?page=&limit=&search=&sortBy=&sortOrder=
 */

export async function getCategories({
  page = 1,
  limit = 100,
  search = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) {
  try {
    const params = { page, limit, sortBy, sortOrder };
    if (search && search.trim()) params.search = search.trim();

    const response = await axios.get(`${API_BASE_URL}/categories`, {
      params,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Lấy danh mục thất bại');
    }
    return data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Lấy danh mục thất bại'
    );
  }
}

export async function searchCategories({ search, page = 1, limit = 10 }) {
  return getCategories({ page, limit, search });
}
