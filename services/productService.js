import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Chuẩn hóa product từ backend cho UI: quantity, image, category_name
 */
function normalizeProduct(p) {
  if (!p) return p;
  const qty = p.onHandQuantity ?? p.quantity ?? 0;
  const img = p.featuredImage ?? (Array.isArray(p.images) && p.images[0]) ?? p.image ?? '';
  const categoryName = (p.category && (p.category.name ?? p.category.category_name)) ?? p.category_name ?? '';
  return {
    ...p,
    quantity: qty,
    onHandQuantity: qty,
    image: img,
    featuredImage: img || p.featuredImage,
    category_name: categoryName,
  };
}

/**
 * Backend: GET /products
 * Query: page, limit, search, category (ObjectId), sortBy, sortOrder
 * Response: { status: "OK", data: Product[], pagination: { page, limit, total, totalPages } }
 */
export async function getProducts({
  page = 1,
  limit = 12,
  search = '',
  category = null,
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) {
  try {
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

    const response = await axios.get(`${API_BASE_URL}/products?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Failed to fetch products');
    }

    const products = (result.data || []).map(normalizeProduct);
    const pagination = result.pagination || { page: 1, limit, total: 0, totalPages: 0 };

    return {
      status: result.status,
      data: products,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages ?? Math.ceil((pagination.total || 0) / (pagination.limit || limit)),
      },
    };
  } catch (error) {
    console.error('getProducts error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch products');
  }
}

/**
 * Backend: GET /products/featured (top 6 bán chạy)
 * Response: { status: "OK", data: Product[] }
 */
export async function getFeaturedProducts() {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/featured`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Failed to fetch featured products');
    }

    const products = (result.data || []).map(normalizeProduct);
    return { status: result.status, data: products };
  } catch (error) {
    console.error('getFeaturedProducts error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch featured products');
  }
}

/**
 * Backend: GET /products/:id
 * Response: { status: "OK", data: Product }
 */
export async function getProductById(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/${id}`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });

    const result = response.data;
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Failed to fetch product');
    }

    return normalizeProduct(result.data);
  } catch (error) {
    console.error('getProductById API error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch product');
  }
}

/**
 * Lấy sản phẩm theo category (backend dùng category = ObjectId)
 */
export async function getProductsByCategory({ categoryId, page = 1, limit = 12, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
  return getProducts({ page, limit, search, category: categoryId || undefined, sortBy, sortOrder });
}

export async function searchProducts({ search, page = 1, limit = 12 }) {
  return getProducts({ page, limit, search });
}
