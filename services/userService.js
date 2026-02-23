import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * API profile/user - chỉ gọi backend (folder src).
 * GET /profile/user-info, PUT /profile/update-user, PUT /profile/change-password.
 */

export async function getUserProfileApi() {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/profile/user-info`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Lấy thông tin user thất bại');
    }
    return data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Lấy thông tin user thất bại'
    );
  }
}

/**
 * Backend: PUT /profile/update-user
 * Body: user_name, phone, address, birthday, gender; optional file avatar (multipart).
 */
export async function updateUserProfileApi({ user_name, phone, address, birthday, gender, avatar }) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Cần đăng nhập');

    const formData = new FormData();
    if (user_name != null) formData.append('user_name', user_name);
    if (phone != null) formData.append('phone', phone);
    if (address != null) formData.append('address', address);
    if (birthday != null) formData.append('birthday', birthday);
    if (gender != null) formData.append('gender', gender);
    if (avatar && avatar.uri) {
      formData.append('avatar', {
        uri: avatar.uri,
        name: avatar.name || 'avatar.jpg',
        type: avatar.type || 'image/jpeg',
      });
    }

    const response = await axios.put(
      `${API_BASE_URL}/profile/update-user`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      }
    );
    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Cập nhật thất bại');
    }
    return data.data ?? data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || 'Cập nhật thất bại'
    );
  }
}

/**
 * Backend: PUT /profile/change-password (dùng trong userSlice / Profile).
 */
export async function changePasswordApi({ old_password, new_password }) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Bạn cần đăng nhập để đổi mật khẩu');
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
