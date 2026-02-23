// cartService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = 'http://10.0.2.2:3001';

export async function checkoutHoldApi({ selected_product_ids, checkout_session_id }) {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            throw new Error('Bạn cần đăng nhập để checkout');
        }
        // console.log("checkoutHoldApi",selected_product_ids, checkout_session_id)

        const response = await axios.post(
             `${API_BASE_URL}/checkout/hold`,
            { selected_product_ids, checkout_session_id },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true
            }
        );

     

        return response.data;
    } catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function checkoutCancelApi({ checkout_session_id}) {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            throw new Error('Bạn cần đăng nhập để checkout');
        }

        const response = await axios.post(
             `${API_BASE_URL}/checkout/cancel`,
            { checkout_session_id },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true
            }
        );

        console.log(" checkoutCancelApi",response.data)

        return response.data;
    } catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}