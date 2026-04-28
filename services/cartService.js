// cartService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../utils/mobileAxiosConfig";

export async function getCartByUserApi() {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập để xem giỏ hàng");
    }

    const response = await apiClient.get(`/cart`);

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
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập để thêm vào giỏ hàng");
    }

    const response = await apiClient.post(`/cart/add`, { product_id, quantity });

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
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập để cập nhật giỏ hàng");
    }

    const response = await apiClient.put(`/cart/update`, { product_id, quantity });

    return response.data.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

export async function removeFromCartApi(product_ids) {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập để xóa sản phẩm khỏi giỏ hàng");
    }
    console.log("token", token);

    const response = await apiClient.delete(`/cart/remove`, {
      data: { product_ids }, // ✅ body phải nằm trong data
    });
    console.log("removeFromCartApi", response.data);
    return response.data.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
