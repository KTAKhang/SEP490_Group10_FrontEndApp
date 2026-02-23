import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Tất cả API auth gọi tới backend (folder src).
 * Header: Authorization Bearer <access_token>. Refresh token dùng cookie (web) hoặc lưu local (mobile).
 */

export async function loginApi({ email, password }) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/sign-in`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        withCredentials: true,
      }
    );

    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    return {
      user: data.data,
      token: { access_token: data.token?.access_token },
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || 'Đăng nhập thất bại'
    );
  }
}

export async function logoutApi() {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      {
        headers: refreshToken ? { 'x-refresh-token': refreshToken } : {},
        withCredentials: true,
      }
    );
  } catch (e) {
    // Vẫn xóa local dù server lỗi
  } finally {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
  }
  return { message: 'Đăng xuất thành công' };
}

/**
 * Backend: POST /auth/register/send-otp
 * Body: user_name, email, password, phone, address, birthday, gender
 */
export async function sendOtpApi(payload) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/register/send-otp`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Gửi OTP thất bại');
    }
    return data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || 'Gửi OTP thất bại'
    );
  }
}

/**
 * Backend: POST /auth/register/confirm
 * Body: { email, otp }
 */
export async function confirmOtpApi({ email, otp }) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/register/confirm`,
      { email, otp },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Xác nhận OTP thất bại');
    }
    return data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || 'Xác nhận OTP thất bại'
    );
  }
}

export async function forgotPasswordApi({ email }) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/forgot-password`,
      { email },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Gửi OTP thất bại');
    }
    return { message: data.message };
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || 'Gửi OTP thất bại'
    );
  }
}

export async function resetPasswordApi({ email, otp, newPassword }) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/reset-password`,
      { email, otp, newPassword },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Đặt lại mật khẩu thất bại');
    }
    return { message: data.message };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Đặt lại mật khẩu thất bại'
    );
  }
}

/**
 * Backend: PUT /profile/change-password (cần Bearer token)
 */
export async function changePasswordApi({ old_password, new_password }) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Bạn cần đăng nhập để đổi mật khẩu');
    }
    const response = await axios.put(
      `${API_BASE_URL}/profile/change-password`,
      { old_password, new_password },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Đổi mật khẩu thất bại');
    }
    return { message: data.message || 'Đổi mật khẩu thành công' };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Đổi mật khẩu thất bại'
    );
  }
}

/**
 * Gọi API có bảo vệ với token (dùng chung cho các service khác nếu cần).
 */
export async function apiCall(url, options = {}) {
  const token = await AsyncStorage.getItem('token');
  const config = {
    method: options.method || 'GET',
    url: url.startsWith('http') ? url : `${API_BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...(options.data && { data: options.data }),
    ...(options.params && { params: options.params }),
  };
  const response = await axios(config);
  return response.data;
}
