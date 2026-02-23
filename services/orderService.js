import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = 'http://10.0.2.2:3001';


export async function getOrderByUserApi(page = 1, limit = 5, search = '') {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            throw new Error('Không tìm thấy token, vui lòng đăng nhập lại.');
        }

        // Gắn search vào URL nếu có
        const url = `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/order?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`;

        const response = await axios.get(url, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        const data = response.data;

        if (!data.success) {
            throw new Error(data.message || 'Lỗi lấy danh sách đơn hàng');
        }

        return data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
            error.message ||
            'Lỗi không xác định khi lấy đơn hàng'
        );
    }
}

export async function createOrderApi({ selected_product_ids, receiverInfo, payment_method,city }) {
    try {
        const token = await AsyncStorage.getItem('token');

        const isMobile=true;
         console.log("selected_product_ids",selected_product_ids)
          console.log("receiverInfo",receiverInfo)
        console.log("city",city)

        const response = await axios.post(
            `${API_BASE_URL}/order/create`,
            { selected_product_ids, receiverInfo, payment_method,city,isMobile },
            {
               headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true
            }
        );

        const data = response.data;
 console.log("response.data",response.data)
        if (!data.success) {
            throw new Error(data.message || 'Tạo đơn hàng thất bại');
        }

        return data;
    } catch (error) {
        console.error('createOrderApi error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Lỗi không xác định khi tạo đơn hàng');
    }
}

export async function checkShippingApi({ selected_product_ids, city}) {
    try {
        const token = await AsyncStorage.getItem('token');
        // console.log("selected_product_ids",selected_product_ids)
        // console.log("city",city)
        const response = await axios.post(
            `${API_BASE_URL}/shipping/check`,
            { selected_product_ids, city },
            {
               headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true
            }
        );
        const data = response.data;
        if (data.status!= "OK") {
            throw new Error(data.message || 'Tạo đơn hàng thất bại');
        }

        return data;
    } catch (error) {
        console.error('checkShippingApi error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Lỗi không xác định khi tạo đơn hàng');
    }
}



export async function cancelOrderApi(order_id) {
    try {
        const token = await AsyncStorage.getItem('token');

        const response = await axios.put(
            `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/order/cancel/${order_id}`,
            {},
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = response.data;

        if (!data.success) {
            throw new Error(data.message || 'Hủy đơn hàng thất bại');
        }

        return data; // { success: true, message: "Hủy đơn hàng thành công" }
    } catch (error) {
        console.error('cancelOrderApi error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Lỗi không xác định khi hủy đơn hàng');
    }
}

export async function returnOrderApi(order_id) {
    try {
        const token = await AsyncStorage.getItem('token');

        const response = await axios.put(
            `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/order/return/${order_id}`,
            {},
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = response.data;

        if (!data.success) {
            throw new Error(data.message || 'Trả hàng thất bại');
        }

        return data; // { success: true, message: "Trả hàng thành công" }
    } catch (error) {
        console.error('returnOrderApi error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Lỗi không xác định khi trả hàng');
    }
}
