import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hàm lấy danh mục
export async function getCategories({ page = 1, limit = 100 }) {
    try {
        // const token = await AsyncStorage.getItem('token');  // Lấy token từ AsyncStorage

        // if (!token) {
        //     throw new Error('No token provided');  // Nếu không có token, ném lỗi
        // }

        // Gửi yêu cầu GET với token trong header
        const response = await axios.get(
            `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/category?page=${page}&limit=${limit}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Authorization: `Bearer ${token}`,  // Thêm token vào header
                },
            }
        );

        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.message || 'Failed to fetch categories');
        }

        return data;  // Trả về dữ liệu danh mục
    } catch (error) {
        console.error('API error:', error);  // Log lỗi chi tiết
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch categories');
    }
}

// Hàm tìm kiếm danh mục theo tên
export async function searchCategories({ search, page = 1, limit = 10 }) {
    try {
        // const token = await AsyncStorage.getItem('token');
        // if (!token) throw new Error('Token not found');

        let url = `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/category?page=${page}&limit=${limit}`;
        if (search && search.trim() !== '') {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                // Authorization: `Bearer ${token}`,
            },
        });

        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.message || 'Failed to search categories');
        }

        return data;
    } catch (error) {
        console.error('searchCategories error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to search categories');
    }
}

