import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginApi,
  loginByGoogleApi,
  logoutApi,
  sendOtpApi,
  confirmOtpApi,
  forgotPasswordApi,
  changePasswordApi,
  resetPasswordApi,
} from "../../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/sign-in",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await loginApi({ email, password });
console.log("response",response)
      // Save token to AsyncStorage
      await AsyncStorage.setItem("token", response.token);
      await AsyncStorage.setItem("refreshToken", response.refresh_token);
      await AsyncStorage.setItem("user", JSON.stringify(response.user));
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const loginByGoogle = createAsyncThunk(
  "auth/sign-in",
  async ({ idToken }, { rejectWithValue }) => {
    try {
      const response = await loginByGoogleApi(idToken);

      // ✅ đúng cấu trúc backend trả về
      await AsyncStorage.setItem("token", response.token);
      await AsyncStorage.setItem("refreshToken", response.refresh_token);
      await AsyncStorage.setItem("user", JSON.stringify(response.user));

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for sending OTP
export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async ({ user_name, email, password, phone, address,birthday,gender }, { rejectWithValue }) => {
    try {
      const response = await sendOtpApi({ user_name, email, password, phone, address,birthday,gender });
      return response.message;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for confirming OTP
export const confirmOtp = createAsyncThunk(
  "auth/confirmOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      console.log("otp",otp)
      const response = await confirmOtpApi(email, otp);
      return response.message;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    const response = await logoutApi({  });
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("refreshToken");
    return response.message;
  },
);

// Async thunk to check if user is already logged in
export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");

      if (token && user) {
        return {
          token,
          user: JSON.parse(user),
        };
      }
      return null;
    } catch (error) {
      return rejectWithValue("Failed to check auth status");
    }
  },
);

// Async thunk for forgot password
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await forgotPasswordApi({ email });
      return response.message;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for changing password
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ old_password, new_password }, { rejectWithValue }) => {
    try {
      const response = await changePasswordApi({ old_password, new_password });
      return response.message;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for resetting password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ email, otp, newPassword }, { rejectWithValue }) => {
    try {
      const response = await resetPasswordApi({ email, otp, newPassword });
      return response.message;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  otpStatus: null,
  otpMessage: null,
  confirmOtpStatus: null,
  confirmOtpMessage: null,
  forgotPasswordStatus: null,
  forgotPasswordMessage: null,
  changePasswordStatus: null,
  changePasswordMessage: null,
  resetPasswordStatus: null,
  resetPasswordMessage: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    resetForgotPasswordState: (state) => {
      state.forgotPasswordStatus = null;
      state.forgotPasswordMessage = null;
    },
    resetOtpState: (state) => {
      state.otpStatus = null;
      state.otpMessage = null;
    },
    resetConfirmOtpState: (state) => {
      state.confirmOtpStatus = null;
      state.confirmOtpMessage = null;
    },
    resetResetPasswordState: (state) => {
      state.resetPasswordStatus = null;
      state.resetPasswordMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Register OTP cases
      .addCase(sendOtp.pending, (state) => {
        state.isLoading = true;
        state.otpStatus = null;
        state.otpMessage = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpStatus = "success";
        state.otpMessage = action.payload;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.otpStatus = "error";
        state.otpMessage = action.payload;
      })
      // Confirm OTP cases
      .addCase(confirmOtp.pending, (state) => {
        state.isLoading = true;
        state.confirmOtpStatus = null;
        state.confirmOtpMessage = null;
      })
      .addCase(confirmOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.confirmOtpStatus = "success";
        state.otpStatus = null;
        state.confirmOtpMessage = action.payload;
      })
      .addCase(confirmOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.confirmOtpStatus = "error";
        state.confirmOtpMessage = action.payload;
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Check auth status cases
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      })
      // Forgot password case
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.forgotPasswordStatus = null;
        state.forgotPasswordMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.forgotPasswordStatus = "success";
        state.forgotPasswordMessage = action.payload;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.forgotPasswordStatus = "error";
        state.forgotPasswordMessage = action.payload;
      })
      // Change password case
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.changePasswordStatus = null;
        state.changePasswordMessage = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.changePasswordStatus = "success";
        state.changePasswordMessage = action.payload;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.changePasswordStatus = "error";
        state.changePasswordMessage = action.payload;
      })
      // Reset password case
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.resetPasswordStatus = null;
        state.resetPasswordMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resetPasswordStatus = "success";
        state.resetPasswordMessage = action.payload;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.resetPasswordStatus = "error";
        state.resetPasswordMessage = action.payload;
      });
  },
});

export const {
  clearError,
  resetAuth,
  resetForgotPasswordState,
  resetOtpState,
  resetConfirmOtpState,
  resetResetPasswordState,
} = authSlice.actions;
export default authSlice.reducer;