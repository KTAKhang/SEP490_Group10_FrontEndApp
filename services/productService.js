import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Sản phẩm public - chỉ gọi backend (folder src).
 * GET /products, GET /products/featured, GET /products/:id
 * Query: page, limit, search, category, sortBy, sortOrder
 */

export async function getProducts({
  page = 1,
  limit = 10,
  search = '',
  category = null,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) {
  try {
    const params = { page, limit, sortBy, sortOrder };
    if (search && search.trim()) params.search = search.trim();
    if (category) params.category = category;

    const response = await axios.get(`${API_BASE_URL}/products`, {
      params,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Lấy danh sách sản phẩm thất bại');
    }
    const list = data.data || [];
    const pagination = data.pagination || {};
    const total = pagination.total ?? list.length;
    const totalPages = pagination.totalPages ?? Math.ceil(total / limit);
    return {
      ...data,
      data: {
        products: list,
        total: {
          totalProduct: total,
          currentPage: page,
          totalPage: totalPages,
        },
      },
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Lấy danh sách sản phẩm thất bại'
    );
  }
}

export async function getProductById(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Lấy sản phẩm thất bại');
    }
    return data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lấy sản phẩm thất bại'
    );
  }
}

export async function getTopSoldProducts({ page = 1, limit = 10, search = '' }) {
  try {
    const params = { page, limit };
    if (search && search.trim()) params.search = search.trim();
    const response = await axios.get(`${API_BASE_URL}/products/featured`, {
      params,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Lấy sản phẩm nổi bật thất bại');
    }
    const products = data.data || [];
    return {
      ...data,
      data: { products },
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Lấy sản phẩm nổi bật thất bại'
    );
  }
}

export async function searchProducts({ search, page = 1, limit = 10 }) {
  return getProducts({ page, limit, search });
}

export async function getProductsByCategory({
  category_name,
  page = 1,
  limit = 10,
}) {
  try {
    const listRes = await getProducts({ page: 1, limit: 100 });
    const allProducts = listRes.data?.products || [];
    const normalized = (s) =>
      (s ?? '')
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const target = normalized(category_name);
    const filtered = allProducts.filter((p) => {
      const cat = normalized(p.category?.name ?? p.category_name ?? '');
      return cat.includes(target) || target.includes(cat);
    });
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    return {
      ...listRes,
      data: {
        ...listRes.data,
        products: paginated,
        total: {
          ...listRes.data?.total,
          totalProduct: total,
          currentPage: page,
          totalPage: totalPages,
        },
      },
    };
  } catch (error) {
    throw error;
  }
}
