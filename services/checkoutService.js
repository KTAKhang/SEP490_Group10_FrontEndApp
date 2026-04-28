// checkoutService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/mobileAxiosConfig';

export async function checkoutHoldApi({ selected_product_ids, checkout_session_id }) {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            throw new Error('You need to log in to checkout.');
        }
        // console.log("checkoutHoldApi",selected_product_ids, checkout_session_id)

        const response = await apiClient.post(`/checkout/hold`, { selected_product_ids, checkout_session_id });

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
            throw new Error('You need to log in to checkout.');
        }

        const response = await apiClient.post(`/checkout/cancel`, { checkout_session_id });

        console.log(" checkoutCancelApi",response.data)

        return response.data;
    } catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}