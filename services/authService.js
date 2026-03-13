import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
// Hàm đăng nhập
export async function loginApi({ email, password }) {
    try {
         
        const response = await axios.post(
             `${API_BASE_URL}/auth/sign-in`,
            { email, password },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                withCredentials: true,

            }
        );

        const data = response.data;


        if (data.status !== 'OK') {
            throw new Error(data.message || 'Login failed');
        }

        return {
            user: data?.data,
            token: data?.token.access_token,
            refresh_token: data?.token.refresh_token,
        };
    } catch (error) {
        // Bắt lỗi từ axios
        throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
}

export async function loginByGoogleApi(idToken) {
    try {
         
        const response = await axios.post(
             `${API_BASE_URL}/auth/google`,
            {idToken},
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                withCredentials: true,

            }
        );

        const data = response.data;


        if (data.status !== 'OK') {
            throw new Error(data.message || 'Login failed');
        }

        return {
            user: data?.data,
            token: data?.token.access_token,
            refresh_token: data?.token.refresh_token,
        };
    } catch (error) {
        // Bắt lỗi từ axios
        throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
}


export async function logoutApi() {
  try {
    const refreshToken = await AsyncStorage.getItem("refreshToken");

    const response = await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      {
        headers: {
          "x-refresh-token": refreshToken,
        },
      }
    );

    await AsyncStorage.multiRemove([
      "token",
      "refreshToken",
      "user",
    ]);
   

    return response.data;

  } catch (error) {
    throw new Error(error.message);
  }
}

// ✅ Hàm gửi OTP
export async function sendOtpApi({ user_name, email, password,fullName, phone, address,birthday,gender }) {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/auth/register/send-otp`,
            { user_name, email, password,fullName, phone, address,birthday,gender },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                withCredentials: true,
            }
        );

        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.message || 'Send OTP failed');
        }

        return data; // { status: 'OK', message: 'OTP sent to email' }
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Send OTP failed');
    }
}

export async function confirmOtpApi(email, otp) {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/auth/register/confirm`,
            { email, otp: String(otp) },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                withCredentials: true,
            }
        );

        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.message || 'Confirm OTP failed');
        }

        return data; // { status: 'OK', message: 'Register successfully' }
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Confirm OTP failed');
    }
}

// Hàm gọi API với token từ AsyncStorage
export async function apiCall(url, options = {}) {
    try {
        const token = await AsyncStorage.getItem('token');

        const config = {
            method: options.method || 'GET',
            url,
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
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'API call failed');
    }
}


// Hàm gửi yêu cầu quên mật khẩu
export async function forgotPasswordApi({ email }) {
    try {
        const response = await axios.post(
           `${API_BASE_URL}/auth/forgot-password`,
            { email },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                withCredentials: true,
            }
        );

        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.message || 'Failed to send OTP');
        }

        return {
            message: data.message, // Chứa thông báo thành công từ server
        };
    } catch (error) {
        // Bắt lỗi từ axios
        throw new Error(error.response?.data?.message || error.message || 'Failed to send OTP');
    }
}

// Hàm thay đổi mật khẩu
export async function changePasswordApi({ old_password, new_password }) {
    try {
        // Lấy token từ AsyncStorage
        const token = await AsyncStorage.getItem('token');

        if (!token) {
            throw new Error('Bạn cần phải đăng nhập để thay đổi mật khẩu');
        }

        // Gửi yêu cầu PUT để thay đổi mật khẩu
        const response = await axios.put(
            'https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/user/change-password',
            {
                old_password,
                new_password,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.message || 'Lỗi thay đổi mật khẩu');
        }

        return {
            status: 'OK',
            message: 'Thay đổi mật khẩu thành công',
        };
    } catch (error) {
        console.error('changePasswordApi error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Lỗi không xác định khi thay đổi mật khẩu');
    }
}

// Hàm đặt lại mật khẩu với OTP
export async function resetPasswordApi({ email, otp, newPassword }) {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/auth/reset-password`,
            { email, otp, newPassword },
            {
                  headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                withCredentials: true,
            }
        );

        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.message || 'Reset password failed');
        }

        return {
            message: data.message,
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Reset password failed');
    }
}