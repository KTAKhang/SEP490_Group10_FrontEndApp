import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { resetAuth } from "../store/slices/authSlice";
import { navigationRef, navigate, resetTo } from "../navigation/RootNavigation";
import { API_BASE_URL } from "../config/apiConfig";

/**
 * API profile/user - chỉ gọi backend (folder src).
 * GET /profile/user-info, PUT /profile/update-user, PUT /profile/change-password.
 */

export async function getUserProfileApi() {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/profile/user-info`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = response.data;
    if (data.status !== "OK") {
      throw new Error(data.message || "Lấy thông tin user thất bại");
    }
    return data.data;
  } catch (error) {
    // Bắt lỗi từ axios
    const status = error.response?.status;
    const message = error.response?.data?.message;

    console.log("status", status);

    /* =======================
       401 – TOKEN EXPIRED / INVALID
    ======================== */
   if (status === 401) {
  try {
    const refreshToken = await AsyncStorage.getItem("refreshToken");

    console.log("refreshToken:", refreshToken);

    if (!refreshToken) {
      throw new Error("Không có refresh token");
    }

    const refreshRes = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      { refresh_token: refreshToken }
    );

    console.log("refreshRes.data:", refreshRes.data);

    const newAccessToken =
      refreshRes.data?.token?.access_token ||
      refreshRes.data?.access_token;

    if (!newAccessToken) {
      throw new Error("Không nhận được access token mới");
    }

    await AsyncStorage.setItem("token", newAccessToken);

    // 🔁 Retry
    const retryRes = await axios.get(
      `${API_BASE_URL}/profile/user-info`,
      {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      }
    );

    return retryRes.data.data;

  } catch (refreshError) {
    console.log("REFRESH ERROR:", refreshError.response?.data);
    clearAuthAndRedirect()
    throw new Error(
      refreshError.response?.data?.message || "Refresh failed"
    );
  }
}

    /* =======================
       403 – ACCOUNT LOCKED
    ======================== */
    // if (status === 403 && message === "Account is locked") {
    //   alert("🚫 Your account has been locked by the admin");
    //   clearAuthAndRedirect();
    //   return;
    // }

    /* =======================
       403 – ACCESS DENIED
    ======================== */
    // if (status === 403 && message === "Access denied") {
    //   alert("⛔ You do not have permission to access this function");
    //   return;
    // }

    // throw error;
  }
}

const clearAuthAndRedirect = async () => {
  resetAuth()
  AsyncStorage.removeItem("token");
  AsyncStorage.removeItem("user");
  // try {
  //   if (navigationRef?.isReady()) {
  //     navigationRef.reset({ index: 0, routes: [{ name: "Login" }] });
  //     return;
  //   }
  // } catch (e) {
  //   ignore
  // }
  // // fallback
  // navigate('Login');
};

/**
 * Backend: PUT /profile/update-user
 * Body: user_name, phone, address, birthday, gender; optional file avatar (multipart).
 */
export async function updateUserProfileApi({
  user_name,
  phone,
  address,
  birthday,
  gender,
  avatar,
}) {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Cần đăng nhập");
    const formData = new FormData();
    if (user_name != null) formData.append("user_name", user_name);
    if (phone != null) formData.append("phone", phone);
    if (address != null) formData.append("address", address);
    if (birthday != null) formData.append("birthday", birthday);
    if (gender != null) formData.append("gender", gender);
    if (avatar && avatar.uri) {
      formData.append("avatar", {
        uri: avatar.uri.startsWith("file://")
          ? avatar.uri
          : `file://${avatar.uri}`,
        name: avatar.name || `avatar_${Date.now()}.jpg`,
        type: avatar.type || "image/jpeg",
      });
    }
    const response = await axios.put(
      `${API_BASE_URL}/profile/update-user`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
     "Content-Type": "multipart/form-data",     
          Accept: "application/json",
        },
      },
    );
    const data = response.data;

    if (data.status !== "OK") {
      throw new Error(data.message || "Cập nhật thất bại");
    }
    return data.data ?? data;
  } catch (error) {
    console.log("UPDATE PROFILE ERROR >>>", error);
  console.log("error.response >>>", error.response);
  console.log("error.response?.data >>>", error.response?.data);

    throw new Error(
      
      error.response?.data?.message || error.message || "Cập nhật thất bại",
    );
  }
}

/**
 * Backend: PUT /profile/change-password (dùng trong userSlice / Profile).
 */
export async function changePasswordApi({ old_password, new_password }) {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Bạn cần đăng nhập để đổi mật khẩu");
    const response = await axios.put(
      `${API_BASE_URL}/profile/change-password`,
      { old_password, new_password },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const data = response.data;
    if (data.status !== "OK") {
      throw new Error(data.message || "Đổi mật khẩu thất bại");
    }
    return { message: data.message || "Đổi mật khẩu thành công" };
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || "Đổi mật khẩu thất bại",
    );
  }
}
