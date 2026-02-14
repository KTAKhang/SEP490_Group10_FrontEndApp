// cartService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getCartByUserApi() {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            throw new Error('Bạn cần đăng nhập để xem giỏ hàng');
        }

        const response = await axios.get('https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/cart', {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
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
            'https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/cart/add',
            { product_id, quantity },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
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
            `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/cart/update`,
            { product_id, quantity },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
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

export async function removeFromCartApi(product_id) {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            throw new Error('Bạn cần đăng nhập để xóa sản phẩm khỏi giỏ hàng');
        }

        const response = await axios.delete(
            `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/cart/remove/${product_id}`,
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
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