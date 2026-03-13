import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/apiConfig";
import { resetAuth } from "../store/slices/authSlice";
import { navigationRef } from "../navigation/RootNavigation";
import { store } from "../store";
import Toast from "react-native-toast-message";
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

/* ======================
   GET TOKEN
====================== */
const getToken = async () => {
  return await AsyncStorage.getItem("token");
};

const updateToken = async (token) => {
  await AsyncStorage.setItem("token", token);
};

const clearAuthAndRedirect = async () => {
  await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);

  store.dispatch(resetAuth());

  console.log("Redirecting to Login...");

  navigationRef.reset({
    index: 0,
    routes: [{ name: "Login" }],
  });
};

/* ======================
   REQUEST INTERCEPTOR
====================== */

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ======================
   RESPONSE INTERCEPTOR
====================== */

apiClient.interceptors.response.use(
  async (response) => {
    const newToken = response.headers["new-access-token"];

    if (newToken) {
      await updateToken(newToken);
    }

    return response;
  },

  async (error) => {
    const originalRequest = { ...error.config };

    const status = error.response?.status;
    const message = error.response?.data?.message;

    console.log("API ERROR:", status, message);

    /* =======================
       TOKEN EXPIRED
    ======================== */

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refresh_token: refreshToken },
        );

        const newAccessToken = refreshRes.data?.token?.access_token;
        console.log("newAccessToken", newAccessToken);
        if (newAccessToken) {
          await updateToken(newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        const refreshStatus = refreshError.response?.status;
        const refreshMessage = refreshError.response?.data?.message;

        console.log("REFRESH ERROR:", refreshStatus, refreshMessage);

        if (
          refreshStatus === 401 &&
          refreshMessage === "The refresh token has expired."
        ) {
          Toast.show({
            type: "error",
            text1: "Session expired",
            text2: "Please login again",
          });
          clearAuthAndRedirect();
          return;
        }

        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    /* =======================
       ACCOUNT LOCKED
    ======================== */

    if (status === 403 && message === "Account is locked") {
      Toast.show({
        type: "error",
        text1: "Account locked",
        text2: "Please contact admin",
      });
      clearAuthAndRedirect();
      return;
    }

    /* =======================
       SINGLE LOGIN
    ======================== */

    if (
      status === 401 &&
      message === "Your account has been logged in from elsewhere."
    ) {
      Toast.show({
        type: "error",
        text1: "Session ended",
        text2: "Your account logged in from another device",
      });

      clearAuthAndRedirect();
      return;
    }

    return Promise.reject(error);
  },
);

export default apiClient;
