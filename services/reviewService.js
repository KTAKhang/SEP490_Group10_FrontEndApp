import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/product-review';

// Hàm lấy tất cả đánh giá đã được duyệt của sản phẩm
export async function getProductReviewsByProductId(product_id) {
    try {
        // Kiểm tra xem product_id có hợp lệ không
        if (!product_id) {
            throw new Error('Product ID is required');
        }

        // Lấy token từ AsyncStorage
        // const token = await AsyncStorage.getItem('token');

        // if (!token) {
        //     throw new Error('Bạn cần phải đăng nhập để xem đánh giá');
        // }

        // Gửi yêu cầu GET để lấy tất cả đánh giá đã được duyệt của sản phẩm
        const response = await axios.get(
            `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/product-review/product/${product_id}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = response.data;

        if (data.success !== true) {
            throw new Error(data.message || 'Failed to fetch reviews');
        }

        return data.data; // Trả về danh sách đánh giá của sản phẩm

    } catch (error) {
        console.error('getProductReviewsByProductId error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch reviews');
    }
}

export async function updateReviewApi({ review_id, rating, review_content }) {
    try {
        // const token = await AsyncStorage.getItem('token');

        const response = await axios.put(
            `${BASE_URL}/update/${review_id}`,
            {
                rating,
                review_content,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = response.data;

        if (!data.success) {
            throw new Error(data.message || 'Lỗi cập nhật đánh giá');
        }

        return data; // { success, message, review }
    } catch (error) {
        console.error('updateReviewApi error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Lỗi không xác định khi cập nhật đánh giá');
    }
}

export async function getReviewsByOrderIdApi(order_id) {
    try {
        const token = await AsyncStorage.getItem('token');

        const response = await axios.get(
            `${BASE_URL}/order/${order_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': '*/*'
                }
            }
        );

        const data = response.data;

        if (!data.success) {
            throw new Error(data.message || 'Lỗi khi lấy đánh giá theo đơn hàng');
        }

        return data.data;
    } catch (error) {
        console.error('getReviewsByOrderIdApi error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Lỗi không xác định khi lấy đánh giá theo đơn hàng');
    }
}


export async function createReviewApi({ product_id, order_detail_id, rating, review_content }) {
    try {
        // const token = await AsyncStorage.getItem('token');

        const response = await axios.post(
            `${BASE_URL}/create`,
            {
                product_id,
                order_detail_id,
                rating,
                review_content,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = response.data;

        if (!data.success) {
            throw new Error(data.message || 'Lỗi đánh giá sản phẩm');
        }

        return data; // { success, message, review }
    } catch (error) {
        console.error('createReviewApi error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Lỗi không xác định khi đánh giá sản phẩm');
    }
}