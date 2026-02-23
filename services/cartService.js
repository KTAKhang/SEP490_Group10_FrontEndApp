// cartService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = 'http://10.0.2.2:3001';

export async function getCartByUserApi() {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            throw new Error('Bạn cần đăng nhập để xem giỏ hàng');
        }

        const response = await axios.get(
            `${API_BASE_URL}/cart`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
        });

        return response.data.data;
    } catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function addToCartApi({ product_id, quantity }) {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            throw new Error('Bạn cần đăng nhập để thêm vào giỏ hàng');
        }

        const response = await axios.post(
             `${API_BASE_URL}/cart/add`,
            { product_id, quantity },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true
            }
        );

        return response.data.data;
    } catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function updateCartApi({ product_id, quantity }) {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            throw new Error('Bạn cần đăng nhập để cập nhật giỏ hàng');
        }

        const response = await axios.put(
            `${API_BASE_URL}/cart/update`,
            { product_id, quantity },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            }
        );

        return response.data.data;
    } catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function removeFromCartApi({product_ids}) {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            throw new Error('Bạn cần đăng nhập để xóa sản phẩm khỏi giỏ hàng');
        }

        const response = await axios.delete(
            `${API_BASE_URL}/cart/remove`,
             { product_ids },
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true
            }
        );

        return response.data.data;
    } catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}
