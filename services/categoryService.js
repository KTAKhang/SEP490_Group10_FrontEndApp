import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Backend: GET /categories
 * Query: page, limit, search, sortBy, sortOrder
 * Response: { status: "OK", message, data: Category[], pagination: { page, limit, total, totalPages } }
 */
export async function getCategories({ page = 1, limit = 100, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
    try {
        const params = new URLSearchParams({
            page: String(page),
            limit: String(Math.min(limit, 100)),
        });
        if (search && search.trim() !== '') {
            params.append('search', search.trim());
        }
        if (sortBy) params.append('sortBy', sortBy);
        if (sortOrder) params.append('sortOrder', sortOrder);

        const response = await axios.get(`${API_BASE_URL}/categories?${params.toString()}`, {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        const result = response.data;

        if (result.status !== 'OK') {
            throw new Error(result.message || 'Failed to fetch categories');
        }

        return result; // { status, message, data: Category[], pagination }
    } catch (error) {
        console.error('getCategories API error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch categories');
    }
}

/**
 * Tìm kiếm danh mục theo tên (gọi chung API getCategories với search)
 */
export async function searchCategories({ search, page = 1, limit = 10 }) {
    return getCategories({ page, limit, search: search || '' });
}

